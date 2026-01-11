from fastapi import FastAPI, Query, HTTPException, Body, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from google.cloud import firestore
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel, EmailStr
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
    "http://localhost:3000,http://127.0.0.1:3000,https://disaster-management-67yd.vercel.app"
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

# Pydantic model for user registration
class UserRegistration(BaseModel):
    name: str
    email: EmailStr
    phone: str
    location: str
    notify_disasters: bool = True


def normalize_location(location: str) -> str:
    """Standardizes location names for consistent database keys and URL handling."""
    return location.strip().lower().replace(" ", "_")


def save_weather_data(location: str, weather_data: dict, coordinates: tuple = (None, None), risk_result: dict = None):
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
        
        # Cache risk assessment to avoid unnecessary history reads
        if risk_result:
            update_payload['risk_cache'] = {
                'risk_level': risk_result.get('risk_level'),
                'risk_score': risk_result.get('risk_score'),
                'calculated_at': timestamp,
                'conditions_snapshot': {
                    'temp': weather_data.get('temp'),
                    'rain': weather_data.get('rain_1h'),
                    'wind': weather_data.get('wind_speed')
                }
            }
        
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


def populate_historical_data(location: str, hourly_data: dict, coordinates: tuple = (None, None)):
    """Populates database with historical hourly data for new locations."""
    if not db:
        return False
    
    try:
        print(f"Populating historical data for new location: {location}")
        doc_ref = db.collection('places').document(location)
        
        # Extract arrays from hourly data
        times = hourly_data.get('time', [])
        temps = hourly_data.get('temperature_2m', [])
        humidity = hourly_data.get('relative_humidity_2m', [])
        rain = hourly_data.get('rain', [])
        wind = hourly_data.get('wind_speed_10m', [])
        clouds = hourly_data.get('cloud_cover', [])
        
        # Process each hour's data
        saved_count = 0
        for i in range(len(times)):
            try:
                timestamp = datetime.fromisoformat(times[i].replace('Z', '+00:00'))
                hour_id = timestamp.strftime("%Y%m%d%H")
                
                history_data = {
                    "temp": temps[i] if i < len(temps) else 0,
                    "humidity": humidity[i] if i < len(humidity) else 0,
                    "rain_1h": rain[i] if i < len(rain) else 0,
                    "wind_speed": wind[i] if i < len(wind) else 0,
                    "clouds": clouds[i] if i < len(clouds) else 0,
                    "location": location,
                    "timestamp": timestamp,
                    "hour_id": hour_id
                }
                
                history_ref = doc_ref.collection('history').document(hour_id)
                history_ref.set(history_data, merge=True)
                saved_count += 1
            except Exception as e:
                print(f"Error saving hourly record {i}: {e}")
                continue
        
        print(f"Saved {saved_count} historical records for {location}")
        return True
    except Exception as e:
        print(f"Error populating historical data: {e}")
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

@app.post("/users/register")
async def register_user(user: UserRegistration):
    """Register a new user for disaster notifications."""
    if not db:
        raise HTTPException(status_code=503, detail="Database unavailable")
    
    try:
        normalized_location = normalize_location(user.location)
        
        # Check if user already exists
        existing_users = db.collection('users').where('email', '==', user.email).limit(1).stream()
        if any(existing_users):
            raise HTTPException(status_code=400, detail="User with this email already registered")
        
        # Create user document
        user_data = {
            "name": user.name,
            "email": user.email,
            "phone": user.phone,
            "location": user.location,
            "location_normalized": normalized_location,
            "notify_disasters": user.notify_disasters,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
        
        # Add to Firestore
        doc_ref = db.collection('users').document()
        doc_ref.set(user_data)
        
        print(f"New user registered: {user.email} from {user.location}")
        
        return {
            "status": "success",
            "message": "User registered successfully for disaster notifications",
            "user_id": doc_ref.id,
            "location": user.location
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error registering user: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to register user: {str(e)}")

@app.get("/users/{email}")
async def get_user(email: str):
    """Get user information by email."""
    if not db:
        raise HTTPException(status_code=503, detail="Database unavailable")
    
    try:
        users_query = db.collection('users').where('email', '==', email).limit(1).stream()
        for user_doc in users_query:
            user_data = user_doc.to_dict()
            user_data['user_id'] = user_doc.id
            return {
                "status": "success",
                "user": user_data
            }
        
        raise HTTPException(status_code=404, detail="User not found")
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching user: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch user: {str(e)}")

@app.put("/users/{email}")
async def update_user(email: str, user: UserRegistration):
    """Update user notification preferences."""
    if not db:
        raise HTTPException(status_code=503, detail="Database unavailable")
    
    try:
        users_query = db.collection('users').where('email', '==', email).limit(1).stream()
        user_doc = None
        for doc in users_query:
            user_doc = doc
            break
        
        if not user_doc:
            raise HTTPException(status_code=404, detail="User not found")
        
        normalized_location = normalize_location(user.location)
        
        # Update user document
        user_data = {
            "name": user.name,
            "phone": user.phone,
            "location": user.location,
            "location_normalized": normalized_location,
            "notify_disasters": user.notify_disasters,
            "updated_at": datetime.now(timezone.utc)
        }
        
        user_doc.reference.update(user_data)
        
        print(f"User updated: {email}")
        
        return {
            "status": "success",
            "message": "User information updated successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating user: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update user: {str(e)}")

@app.delete("/users/{email}")
async def delete_user(email: str):
    """Unsubscribe user from disaster notifications."""
    if not db:
        raise HTTPException(status_code=503, detail="Database unavailable")
    
    try:
        users_query = db.collection('users').where('email', '==', email).limit(1).stream()
        user_doc = None
        for doc in users_query:
            user_doc = doc
            break
        
        if not user_doc:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_doc.reference.delete()
        
        print(f"User deleted: {email}")
        
        return {
            "status": "success",
            "message": "User unsubscribed successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting user: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete user: {str(e)}")

def should_recalculate_risk(current_weather: dict, cached_risk: dict) -> bool:
    """Determine if risk needs recalculation or can use cached result."""
    if not cached_risk:
        return True
    
    # Check cache age - recalculate if older than 1 hour
    try:
        cache_age = datetime.now(timezone.utc) - datetime.fromisoformat(cached_risk.get('calculated_at', ''))
        if cache_age > timedelta(hours=1):
            return True
    except:
        return True
    
    # If conditions are clearly safe and haven't changed much, use cache
    cached_conditions = cached_risk.get('conditions_snapshot', {})
    temp = current_weather.get('temp', 25)
    rain = current_weather.get('rain_1h', 0)
    wind = current_weather.get('wind_speed', 0)
    
    cached_temp = cached_conditions.get('temp', temp)
    cached_rain = cached_conditions.get('rain', rain)
    cached_wind = cached_conditions.get('wind', wind)
    
    # Safe conditions: moderate temp, low rain, low wind, and not much change
    is_safe = (15 <= temp <= 35 and rain < 10 and wind < 40)
    temp_stable = abs(temp - cached_temp) < 5
    rain_stable = abs(rain - cached_rain) < 5
    wind_stable = abs(wind - cached_wind) < 10
    
    # If safe and stable, use cached risk (avoids history read)
    if is_safe and temp_stable and rain_stable and wind_stable:
        return False
    
    # Otherwise, recalculate
    return True

def format_hourly_trends(hourly_data: dict) -> list:
    """Format hourly API data into readable trend format."""
    if not hourly_data or 'time' not in hourly_data:
        return []
    
    times = hourly_data.get('time', [])
    temps = hourly_data.get('temperature_2m', [])
    humidity = hourly_data.get('relative_humidity_2m', [])
    rain = hourly_data.get('rain', [])
    wind = hourly_data.get('wind_speed_10m', [])
    
    trends = []
    for i in range(len(times)):
        trends.append({
            'time': times[i],
            'temp': temps[i] if i < len(temps) else None,
            'humidity': humidity[i] if i < len(humidity) else None,
            'rain': rain[i] if i < len(rain) else None,
            'wind': wind[i] if i < len(wind) else None
        })
    
    return trends


def extract_forecast(hourly_data: dict) -> list:
    """Extracts next 48 hours of forecast data from Open-Meteo hourly response."""
    if not hourly_data or 'time' not in hourly_data:
        return []
    
    times = hourly_data.get('time', [])
    temps = hourly_data.get('temperature_2m', [])
    humidity = hourly_data.get('relative_humidity_2m', [])
    rain = hourly_data.get('rain', [])
    wind = hourly_data.get('wind_speed_10m', [])
    weather_codes = hourly_data.get('weather_code', [])
    
    # Find current time index (API returns past + future)
    now = datetime.now(timezone.utc)
    forecast = []
    
    for i in range(len(times)):
        time_str = times[i]
        try:
            hour_time = datetime.fromisoformat(time_str.replace('Z', '+00:00'))
        except:
            continue
        
        # Only include future hours (next 48 hours)
        if hour_time > now and len(forecast) < 48:
            forecast.append({
                'time': time_str,
                'temp': temps[i] if i < len(temps) else None,
                'humidity': humidity[i] if i < len(humidity) else None,
                'rain': rain[i] if i < len(rain) else 0,
                'wind': wind[i] if i < len(wind) else None,
                'weather_code': weather_codes[i] if i < len(weather_codes) else 0
            })
    
    return forecast


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

# Configurable list of places to monitor (empty = on-demand only)
MONITORED_PLACES = []  # No automatic monitoring - API first, DB fallback
LAST_BG_INGEST = datetime.min.replace(tzinfo=timezone.utc) # Cooldown tracker

def check_and_trigger_alerts(loc_name, risk_res, background_tasks=None):
    """
    Checks if risk is high and sends email alerts to users in the affected location.
    Queries users from Firestore database who opted in for notifications.
    """
    if risk_res.get('risk_level') == "HIGH":
        print(f"HIGH RISK detected for {loc_name}. Triggering alerts...")
        try:
            if not db:
                print("Firestore not available, cannot send alerts")
                return
            
            # Query users from Firestore who are in the affected location and want notifications
            normalized_location = normalize_location(loc_name)
            users_query = db.collection('users') \
                .where('location_normalized', '==', normalized_location) \
                .where('notify_disasters', '==', True) \
                .stream()
            
            matching_users = []
            for user_doc in users_query:
                user_data = user_doc.to_dict()
                matching_users.append(user_data)
            
            print(f"Found {len(matching_users)} users in {loc_name}. Sending alerts...")
            
            for user in matching_users:
                if background_tasks:
                    background_tasks.add_task(
                        notifier.send_high_risk_alert,
                        user.get('email'),
                        user.get('name'),
                        loc_name,
                        risk_res
                    )
                else:
                    notifier.send_high_risk_alert(
                        user.get('email'),
                        user.get('name'),
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

    # 2. API FIRST - Try live API, use DB only as fallback
    api_error = None
    weather_data = None
    lat, lon = None, None

    try:
        # Get coordinates (check DB cache first for efficiency)
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

        # ALWAYS fetch fresh data from API (DB is fallback only)
        print(f"Fetching live weather from API for {location}")
        
        # Fetch current + hourly forecast data (next 7 days, hourly)
        # Note: Open-Meteo free tier doesn't support past_hours, so we use forecast_days for future trends
        weather_url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,relative_humidity_2m,rain,wind_speed_10m,cloud_cover&hourly=temperature_2m,relative_humidity_2m,rain,wind_speed_10m,cloud_cover,weather_code&forecast_days=3&timezone=auto"
        resp = requests.get(weather_url, timeout=10)
        resp.raise_for_status()
        api_response = resp.json()
        api_data = api_response['current']
        hourly_data = api_response.get('hourly', {})  # Hourly forecast data from API
        print(f"Hourly data keys: {list(hourly_data.keys()) if hourly_data else 'None'}")
        print(f"Number of hourly data points: {len(hourly_data.get('time', [])) if hourly_data else 0}")

        weather_data = {
            "temp": api_data['temperature_2m'],
            "wind_speed": api_data['wind_speed_10m'],
            "rain_1h": api_data.get('rain', 0.0),
            "clouds": api_data['cloud_cover'],
            "humidity": api_data['relative_humidity_2m'],
            "location": location
        }
        
        # Save current weather data to DB in background (for fallback cache)
        background_tasks.add_task(save_weather_data, location, weather_data, (lat, lon))
        source = "live_api"
        print(f"Live API data retrieved for {location}")
        
        # Store hourly data for trends view (forecast data)
        api_hourly_trends = format_hourly_trends(hourly_data) if hourly_data else []
        print(f"Formatted {len(api_hourly_trends)} hourly trend data points")
        
        # Extract forecast data (next 48 hours)
        forecast_data = extract_forecast(hourly_data) if hourly_data else []
        print(f"Extracted {len(forecast_data)} forecast data points")
        forecast_data = extract_forecast(hourly_data) if hourly_data else []

    except Exception as e:
        print(f"API Fetch Failed for {location}: {e}")
        api_error = str(e)
        api_hourly_trends = []  # No hourly data if API fails
        forecast_data = []  # No forecast if API fails

    # 3. Fallback to Database Cache if API failed
    if not weather_data:
        api_hourly_trends = []  # No API trends available
        forecast_data = []  # No forecast available
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
        "history": history,  # DB history for extended trends (if available)
        "hourly_trends": api_hourly_trends,  # 24-hour trends from API (always fresh)
        "forecast": forecast_data,  # 48-hour forecast
        "has_extended_history": len(history) > 48  # Flag for UI to show extended trends option
    }

@app.get("/refresh")
async def manual_refresh(background_tasks: BackgroundTasks):
    """Manually trigger a full refresh of all monitored places."""
    background_tasks.add_task(ingest_weather)
    return {"message": "Global weather refresh started in background", "monitored_places": MONITORED_PLACES}

@app.head("/refresh")
async def manual_refresh_head(background_tasks: BackgroundTasks):
    """HEAD request support for UptimeRobot - triggers refresh without returning body."""
    background_tasks.add_task(ingest_weather)
    return {}



def ingest_weather(event=None, context=None):
    """Ingests data for monitored places only (no auto-monitoring from DB)."""
    print(f"\n--- [SCHEDULER] Starting Global Ingestion: {datetime.now()} ---")
    
    # Only monitor hardcoded MONITORED_PLACES (currently empty = no automatic monitoring)
    # This prevents quota issues from user-searched cities being auto-monitored
    if not MONITORED_PLACES:
        print("No cities configured for automatic monitoring. System is on-demand only.")
        return "OK"
    
    places_to_process = []
    
    # Add only hardcoded places
    for p in MONITORED_PLACES:
        places_to_process.append({'name': p, 'lat': None, 'lon': None})

    print(f"Monitoring {len(places_to_process)} configured locations.")
    
    for place in places_to_process:
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
            
            normalized_name = normalize_location(name)
            
            # Smart risk assessment with caching
            risk_result = None
            cached_risk = None
            
            # Try to get cached risk from main document
            if db:
                try:
                    doc_ref = db.collection('places').document(normalized_name)
                    doc = doc_ref.get()
                    if doc.exists:
                        cached_risk = doc.to_dict().get('risk_cache')
                except Exception as e:
                    print(f"Error reading cached risk for {name}: {e}")
            
            # Check if we need to recalculate risk
            if should_recalculate_risk(weather, cached_risk):
                # Need fresh calculation - read history (progressive reading)
                # Start with last 6 hours for quick check
                history = get_weather_history(normalized_name, hours=6)
                current_hour_id = datetime.now(timezone.utc).strftime("%Y%m%d%H")
                
                # Ensure latest reading is included
                if not any(h.get('hour_id') == current_hour_id for h in history):
                    current_snapshot = {**weather, "timestamp": datetime.now(timezone.utc).isoformat(), "hour_id": current_hour_id}
                    history.insert(0, current_snapshot)
                
                # Quick risk assessment
                quick_risk = risk_engine.evaluate_risk(history)
                
                # If concerning, read full 24 hours for detailed analysis
                if quick_risk.get('risk_level') in ['MEDIUM', 'HIGH']:
                    print(f"{name}: {quick_risk.get('risk_level')} risk detected, reading full history")
                    history = get_weather_history(normalized_name, hours=24)
                    if not any(h.get('hour_id') == current_hour_id for h in history):
                        history.insert(0, current_snapshot)
                    risk_result = risk_engine.evaluate_risk(history)
                else:
                    risk_result = quick_risk
                
                print(f"{name}: Risk calculated - {risk_result.get('risk_level')}")
            else:
                # Use cached risk (0 history reads!)
                risk_result = {
                    'risk_level': cached_risk.get('risk_level'),
                    'risk_score': cached_risk.get('risk_score'),
                    'factors': ['Using cached risk assessment'],
                    'recommendations': []
                }
                print(f"{name}: Using cached risk - {risk_result.get('risk_level')}")
            
            # Save with risk cache
            save_weather_data(normalized_name, weather, (lat, lon), risk_result)
            
            # Trigger alerts if needed
            check_and_trigger_alerts(name, risk_result)
            
            # Slight delay to be kind to the API
            time.sleep(0.5)
            
        except Exception as e:
            print(f"Failed to update {place.get('name')}: {e}")
            
    print(f"--- [SCHEDULER] Global Ingestion Complete: {datetime.now()} ---\n")
    return "OK"



def run_scheduler():
    """Background loop to update all weather data every 60 minutes."""
    # Wait for server to potentially start up first
    time.sleep(10)
    while True:
        try:
            ingest_weather()
        except Exception as e:
            print(f"Scheduler Error: {e}")
        
        # Sleep for 60 minutes (3600 seconds)
        time.sleep(3600)

if __name__ == "__main__":
    import uvicorn
    
    # Start the background scheduler thread
    scheduler_thread = threading.Thread(target=run_scheduler, daemon=True)
    scheduler_thread.start()
    
    print("Starting server on 0.0.0.0:8080...")
    uvicorn.run(app, host="0.0.0.0", port=8080)
