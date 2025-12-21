from fastapi import FastAPI, Query, HTTPException
from google.cloud import firestore
from datetime import datetime, timezone
import requests
import json
import os
import risk_engine

app = FastAPI(title="Disaster Alert System")

# Initialize Firestore
# Note: Ensure GOOGLE_APPLICATION_CREDENTIALS is set or you are logged in via gcloud
try:
    # Based on your image, your database ID is 'weather'
    db = firestore.Client(database='weather')
    # verify if we can actually access the database
    collections = list(db.collections(timeout=5))
    print("Firestore ('weather' database) initialized successfully.")
except Exception as e:
    print(f"Firestore 'weather' database not available: {e}. Running in Local Mode.")
    db = None


def save_weather_data(location: str, weather_data: dict, coordinates: tuple = (None, None)):
    """Saves only the latest weather data to Firestore."""
    if not db:
        return False

    try:
        doc_ref = db.collection('places').document(location.lower())
        
        # Add timestamp to current reading
        weather_data['captured_at'] = datetime.now(timezone.utc).isoformat()
        
        update_payload = {
            'location': location,
            'weather': weather_data,
            'updated_at': datetime.now(timezone.utc)
        }
        
        if coordinates[0] is not None:
            update_payload['coordinates'] = {'lat': coordinates[0], 'lon': coordinates[1]}
            
        doc_ref.set(update_payload, merge=True)
        print(f"Latest data saved for {location}")
        return True
    except Exception as e:
        print(f"Error saving to Firestore: {e}")
        return False


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

@app.get("/weather")
async def get_weather_risk(
    background_tasks: BackgroundTasks,
    location: str = Query("Mumbai"),
    simulation: str = Query(None, description="Scenario for simulation (e.g., flood, normal)")
):
    print(f"\n--- REQUEST: {location} (Simulation: {simulation}) ---")
    
    # 1. Check for Simulation (Mocking)
    if simulation:
        weather_data = get_mock_data(simulation)
        if not weather_data:
            raise HTTPException(status_code=404, detail=f"Simulation scenario '{simulation}' not found")
        
        weather_data["location"] = location
        weather_data["captured_at"] = datetime.now(timezone.utc).isoformat()
        risk_result = risk_engine.evaluate_risk(weather_data)
        
        return {
            "status": "success",
            "source": "simulation",
            "location": location,
            "data": weather_data,
            "risk_assessment": risk_result
        }

    # 2. Attempt Live API Fetch
    api_error = None
    weather_data = None
    try:
        lat, lon = get_coordinates(location)
        if lat is None:
            raise HTTPException(status_code=404, detail=f"Location '{location}' not found")

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
        
        # Save to database (Latest only)
        save_weather_data(location, weather_data, (lat, lon))
        source = "live_api"

    except Exception as e:
        print(f"API Fetch Failed for {location}: {e}")
        api_error = str(e)

    # 3. Fallback to Database Cache if API failed
    if not weather_data:
        if db:
            doc_ref = db.collection('places').document(location.lower())
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

    # 4. Evaluate Risk
    risk_result = risk_engine.evaluate_risk(weather_data)
    
    # Proactively update other places in background if this is a live request
    if source == "live_api":
        background_tasks.add_task(ingest_weather)

    return {
        "status": "success",
        "source": source,
        "location": location,
        "data": weather_data,
        "risk_assessment": risk_result
    }

@app.get("/refresh")
async def manual_refresh(background_tasks: BackgroundTasks):
    """Manually trigger a full refresh of all monitored places."""
    background_tasks.add_task(ingest_weather)
    return {"message": "Global weather refresh started in background", "monitored_places": MONITORED_PLACES}



def ingest_weather(event=None, context=None):
    """Ingests data for all monitored places."""
    print(f"Starting ingestion for {len(MONITORED_PLACES)} locations...")
    
    for place in MONITORED_PLACES:
        try:
            lat, lon = get_coordinates(place)
            if not lat: continue
                
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
                "location": place
            }
            
            save_weather_data(place, weather, (lat, lon))
        except Exception as e:
            print(f"Failed to ingest {place}: {e}")
            
    print("Ingestion complete.")
    return "OK"



if __name__ == "__main__":
    import uvicorn
    print("Starting server on 0.0.0.0:8080...")
    uvicorn.run(app, host="0.0.0.0", port=8080)
