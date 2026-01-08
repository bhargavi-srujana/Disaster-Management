from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from google.cloud import firestore
from datetime import datetime, timezone, timedelta
import requests
import json
import os
import threading
import time
import risk_engine
import notifier
import tempfile

app = FastAPI(title="Disaster Alert System")

# Configure CORS with environment variable support
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS", 
    "http://localhost:3000,http://127.0.0.1:3000"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Firestore with support for JSON credentials from environment
def init_firestore():
    """Initialize Firestore client with support for credential JSON in env var."""
    try:
        # Check if credentials are provided as JSON string (for Render/cloud deployment)
        creds_json = os.getenv('GOOGLE_CREDENTIALS_JSON')
        if creds_json:
            # Write credentials to a temporary file
            with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.json') as f:
                f.write(creds_json)
                temp_creds_path = f.name
            os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = temp_creds_path
            print("Using credentials from GOOGLE_CREDENTIALS_JSON environment variable")
        
        # Initialize Firestore client
        db = firestore.Client(database='weather')
        # Verify database access
        collections = list(db.collections(timeout=5))
        print("Firestore ('weather' database) initialized successfully.")
        return db
    except Exception as e:
        print(f"Firestore 'weather' database not available: {e}. Running in Local Mode.")
        return None

db = init_firestore()


def normalize_location(location: str) -> str:
    """Standardizes location names for consistent database keys and URL handling."""
    return location.strip().lower().replace(" ", "_")


def save_weather_data(location: str, weather_data: dict, coordinates: tuple = (None, None)):
    """Saves weather snapshot to Firestore history and updates latest cache."""
    if not db:
        return False

    try:
        # 1. Update Latest Snapshot (for quick dashboard access)
        # Assumes location is already normalized
        doc_ref = db.collection('places').document(location)
        timestamp = datetime.now(timezone.utc)
        weather_data['captured_at'] = timestamp.isoformat()
        
        update_payload = {
            'location': location,
            'weather': weather_data,
            'updated_at': timestamp
        }
        if coordinates[0] is not None:
            update_payload['coordinates'] = {'lat': coordinates[0], 'lon': coordinates[1]}
        
        doc_ref.set(update_payload, merge=True)

        # 2. Add to Historical Sub-collection (Hourly Bucketing)
        hour_id = timestamp.strftime("%Y%m%d%H") 
        history_ref = doc_ref.collection('history').document(hour_id)
        
        # We store the latest reading for this hour, explicitly including hour_id
        history_data = {**weather_data, "timestamp": timestamp, "hour_id": hour_id}
        history_ref.set(history_data, merge=True)

        print(f"Hourly record ({hour_id}) updated for {location}")
        
        # 3. Cleanup: Maintain a Rolling Cache (Delete records older than 24 hours)
        # This keeps only the most recent day's data for dashboard charts
        cleanup_cutoff = timestamp - timedelta(hours=24)
        old_docs = doc_ref.collection('history').where('timestamp', '<', cleanup_cutoff).stream()
        
        deleted_count = 0
        for old_doc in old_docs:
            old_doc.reference.delete()
            deleted_count += 1
            
        if deleted_count > 0:
            print(f"Cleaned up {deleted_count} stale records for {location}")

        return True
    except Exception as e:
        print(f"Error saving to Firestore: {e}")
        return False


def get_weather_history(location: str, hours: int = 24):
    """Retrieves recent weather observations for persistence analysis."""
    if not db:
        return []
    
    try:
        cutoff = datetime.now(timezone.utc).timestamp() - (hours * 3600)
        cutoff_dt = datetime.fromtimestamp(cutoff, tz=timezone.utc)
        
        history_query = db.collection('places').document(location) \
            .collection('history') \
            .where('timestamp', '>=', cutoff_dt) \
            .order_by('timestamp', direction=firestore.Query.DESCENDING)
        
        docs = history_query.stream()
        history = []
        for doc in docs:
            data = doc.to_dict()
            # Convert Firestore timestamp to ISO string if needed for logic
            if 'timestamp' in data:
                data['timestamp'] = data['timestamp'].isoformat()
            history.append(data)
        return history
    except Exception as e:
        print(f"Error fetching history: {e}")
        return []


@app.get("/")
@app.head("/")
def health_check():
    """Health check endpoint for monitoring and deployment verification."""
    return {
        "status": "healthy",
        "service": "Disaster Alert System",
        "firestore_connected": db is not None,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

def get_coordinates(location: str):
    """Convert location name to lat/long using Open-Meteo Geocoding API."""
    url = f"https://geocoding-api.open-meteo.com/v1/search?name={location}&count=1&language=en&format=json"
    response = requests.get(url, timeout=5)
    response.raise_for_status()
    data = response.json()
    if not data.get('results'):
        return None, None
    result = data['results'][0]
    return result['latitude'], result['longitude']

def get_mock_data(scenario_name):
    try:
        base_path = os.path.dirname(os.path.abspath(__file__))
        file_path = os.path.join(base_path, 'mock_data', f'{scenario_name}.json')
        with open(file_path, 'r') as f:
            data = json.load(f)
            return data['readings'][0]
    except FileNotFoundError:
        return None

from fastapi import BackgroundTasks

# Configurable list of places to monitor
MONITORED_PLACES = ["Mumbai", "Delhi", "Chennai", "Kolkata", "Bangalore", "Hyderabad", "Pune", "Ahmedabad"]
LAST_BG_INGEST = datetime.min.replace(tzinfo=timezone.utc) # Cooldown tracker

def check_and_trigger_alerts(loc_name, risk_res, background_tasks=None):
    """
    Checks if risk is high and sends email alerts to users in the affected location.
    If background_tasks is provided, it uses FastAPI's background tasks.
    Otherwise, it sends emails synchronously (suitable for background jobs).
    """
    if risk_res.get('risk_level') == "HIGH":
        print(f"HIGH RISK detected for {loc_name}. Triggering alerts...")
        try:
            base_path = os.path.dirname(os.path.abspath(__file__))
            users_path = os.path.join(base_path, 'mock_data', 'users.json')
            if not os.path.exists(users_path):
                print(f"User data file not found at {users_path}")
                return

            with open(users_path, 'r') as f:
                users_data = json.load(f)
                matching_users = [u for u in users_data.get('users', []) if u.get('home_location') == normalize_location(loc_name)]
                
                print(f"Found {len(matching_users)} users in {loc_name}. Sending alerts...")
                
                for user in matching_users:
                    if background_tasks:
                        background_tasks.add_task(
                            notifier.send_high_risk_alert,
                            user['email'],
                            user['name'],
                            loc_name,
                            risk_res
                        )
                    else:
                        notifier.send_high_risk_alert(
                            user['email'],
                            user['name'],
                            loc_name,
                            risk_res
                        )
        except Exception as alert_err:
            print(f"Error triggering alerts for {loc_name}: {alert_err}")

@app.get("/weather")
async def get_weather_risk(
    background_tasks: BackgroundTasks,
    location: str = Query("Mumbai"),
    simulation: str = Query(None, description="Scenario for simulation (e.g., flood, normal)")
):
    # Normalize location for consistent DB mapping
    original_name = location
    location = normalize_location(original_name)
    
    print(f"\n--- REQUEST: {location} (Original: {original_name}, Simulation: {simulation}) ---")
    
    # 1. Check for Simulation (Mocking)
    if simulation:
        weather_data = get_mock_data(simulation)
        if not weather_data:
            raise HTTPException(status_code=404, detail=f"Simulation scenario '{simulation}' not found")
        
        weather_data["location"] = location
        ts = datetime.now(timezone.utc)
        weather_data["captured_at"] = ts.isoformat()
        
        # ENRICHMENT: Create a mock 6-hour history so persistence logic triggers
        # Injecting 6 hourly snapshots of the same simulation data
        mock_history = []
        for i in range(7): # Current + 6 hours back
            hist_ts = ts - timedelta(hours=i)
            mock_snap = {**weather_data, "timestamp": hist_ts.isoformat(), "hour_id": hist_ts.strftime("%Y%m%d%H")}
            mock_history.append(mock_snap)
            
        risk_result = risk_engine.evaluate_risk(mock_history)
        
        # Check and trigger alerts
        check_and_trigger_alerts(location, risk_result, background_tasks)
        
        return {
            "status": "success",
            "source": "simulation",
            "location": location,
            "data": weather_data,
            "risk_assessment": risk_result,
            "history_count": len(mock_history)
        }

    # 2. Attempt Live API Fetch
    api_error = None
    weather_data = None
    lat, lon = None, None

    try:
        # Optimization: Check DB for coordinates first to avoid slow geocoding API
        if db:
            doc_ref = db.collection('places').document(location)
            doc = doc_ref.get()
            if doc.exists:
                data = doc.to_dict()
                coords = data.get('coordinates', {})
                lat, lon = coords.get('lat'), coords.get('lon')
                print(f"Using cached coordinates for {location}: {lat}, {lon}")

        if lat is None:
            lat, lon = get_coordinates(original_name)
            if lat is None:
                raise HTTPException(status_code=404, detail=f"Location '{original_name}' not found")

        weather_url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,relative_humidity_2m,rain,wind_speed_10m,cloud_cover"
        resp = requests.get(weather_url, timeout=5)
        resp.raise_for_status()
        api_data = resp.json()['current']

        weather_data = {
            "temp": api_data['temperature_2m'],
            "wind_speed": api_data['wind_speed_10m'],
            "rain_1h": api_data.get('rain', 0.0),
            "clouds": api_data['cloud_cover'],
            "humidity": api_data['relative_humidity_2m'],
            "location": location
        }
        
        # Move database saving to background to speed up response
        background_tasks.add_task(save_weather_data, location, weather_data, (lat, lon))
        source = "live_api"

    except Exception as e:
        print(f"API Fetch Failed for {location}: {e}")
        api_error = str(e)

    # 3. Fallback to Database Cache if API failed
    if not weather_data:
        if db:
            doc_ref = db.collection('places').document(location)
            doc = doc_ref.get()
            if doc.exists:
                data = doc.to_dict()
                weather_data = data.get('weather')
                captured_at = weather_data.get('captured_at') if weather_data else "Unknown"
                print(f"Serving cached data for {location} (Last verified: {captured_at})")
                source = "verified_cache"
            else:
                raise HTTPException(status_code=503, detail=f"Weather service unavailable and no cached data: {api_error}")
        else:
            raise HTTPException(status_code=503, detail=f"Weather service unavailable: {api_error}")

    # 4. Evaluate Risk based on History
    history = get_weather_history(location, hours=24)
    current_hour_id = datetime.now(timezone.utc).strftime("%Y%m%d%H")
    
    # De-duplicate: If the latest history from DB is already for the current hour,
    # we don't need to manually insert the 'weather_data' we just fetched.
    if weather_data:
        has_current_hour = any(h.get('hour_id') == current_hour_id for h in history)
        if not has_current_hour:
            # Inject current data at the start if it wasn't in the DB stream yet
            current_snapshot = {**weather_data, "timestamp": datetime.now(timezone.utc).isoformat(), "hour_id": current_hour_id}
            history.insert(0, current_snapshot)

    risk_result = risk_engine.evaluate_risk(history)
    
    # Check and trigger alerts
    check_and_trigger_alerts(location, risk_result, background_tasks)
    
    # Proactively update other places in background if this is a live request
    # Cooldown check: Only refresh background data every 15 minutes
    global LAST_BG_INGEST
    now = datetime.now(timezone.utc)
    if source == "live_api" and (now - LAST_BG_INGEST).total_seconds() > 900:
        LAST_BG_INGEST = now
        background_tasks.add_task(ingest_weather)

    return {
        "status": "success",
        "source": source,
        "location": location,
        "data": weather_data,
        "risk_assessment": risk_result,
        "history_count": len(history),
        "history": history  # Include actual historical data for charts
    }

@app.get("/refresh")
async def manual_refresh(background_tasks: BackgroundTasks):
    """Manually trigger a full refresh of all monitored places."""
    background_tasks.add_task(ingest_weather)
    return {"message": "Global weather refresh started in background", "monitored_places": MONITORED_PLACES}



def ingest_weather(event=None, context=None):
    """Ingests data for all monitored places and any existing locations in Firestore."""
    print(f"\n--- [SCHEDULER] Starting Global Ingestion: {datetime.now()} ---")
    
    # 1. Identify all places to update
    # We combine the hardcoded MONITORED_PLACES with whatever is already in the DB
    places_to_process = [] # List of dicts: {'name': str, 'lat': float, 'lon': float}
    
    # Add hardcoded defaults
    for p in MONITORED_PLACES:
        places_to_process.append({'name': p, 'lat': None, 'lon': None})

    # Add dynamic places from DB
    if db:
        try:
            docs = db.collection('places').stream()
            for doc in docs:
                data = doc.to_dict()
                loc_id = doc.id
                coords = data.get('coordinates', {})
                # Use normalized ID as name if original not found, but prefer stored coords
                places_to_process.append({
                    'name': data.get('location', loc_id), 
                    'lat': coords.get('lat'), 
                    'lon': coords.get('lon')
                })
        except Exception as e:
            print(f"Error fetching existing places from DB: {e}")

    # De-duplicate by normalized name to avoid double-fetching
    seen = set()
    unique_places = []
    for p in places_to_process:
        norm = normalize_location(p['name'])
        if norm not in seen:
            seen.add(norm)
            unique_places.append(p)

    print(f"Found {len(unique_places)} unique locations to update.")
    
    for place in unique_places:
        try:
            name = place['name']
            lat, lon = place['lat'], place['lon']
            
            # Geocode only if we don't have coords
            if lat is None or lon is None:
                lat, lon = get_coordinates(name)
            
            if lat is None:
                print(f"Skipping {name}: Could not determine coordinates.")
                continue
                
            weather_url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,relative_humidity_2m,rain,wind_speed_10m,cloud_cover"
            resp = requests.get(weather_url, timeout=5)
            resp.raise_for_status()
            api_data = resp.json()['current']
            
            weather = {
                "temp": api_data['temperature_2m'],
                "wind_speed": api_data['wind_speed_10m'],
                "rain_1h": api_data.get('rain', 0.0),
                "clouds": api_data['cloud_cover'],
                "humidity": api_data['relative_humidity_2m'],
                "location": normalize_location(name)
            }
            
            save_weather_data(normalize_location(name), weather, (lat, lon))
            
            # Evaluate risk and trigger alerts
            history = get_weather_history(normalize_location(name), hours=24)
            current_hour_id = datetime.now(timezone.utc).strftime("%Y%m%d%H")
            
            # Ensure the latest reading is included in risk calculation
            if not any(h.get('hour_id') == current_hour_id for h in history):
                current_snapshot = {**weather, "timestamp": datetime.now(timezone.utc).isoformat(), "hour_id": current_hour_id}
                history.insert(0, current_snapshot)
            
            risk_result = risk_engine.evaluate_risk(history)
            check_and_trigger_alerts(name, risk_result)
            
            # Slight delay to be kind to the API
            time.sleep(0.5)
            
        except Exception as e:
            print(f"Failed to update {place.get('name')}: {e}")
            
    print(f"--- [SCHEDULER] Global Ingestion Complete: {datetime.now()} ---\n")
    return "OK"



def run_scheduler():
    """Background loop to update all weather data every 30 minutes."""
    # Wait for server to potentially start up first
    time.sleep(10)
    while True:
        try:
            ingest_weather()
        except Exception as e:
            print(f"Scheduler Error: {e}")
        
        # Sleep for 30 minutes (1800 seconds)
        time.sleep(1800)

if __name__ == "__main__":
    import uvicorn
    
    # Start the background scheduler thread
    scheduler_thread = threading.Thread(target=run_scheduler, daemon=True)
    scheduler_thread.start()
    
    print("Starting server on 0.0.0.0:8080...")
    uvicorn.run(app, host="0.0.0.0", port=8080)
