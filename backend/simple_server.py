from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timezone
import requests
import json

app = FastAPI(title="Weather Safety Check - Simple Server")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def assess_risk(weather: dict) -> dict:
    """Simple risk assessment based on weather conditions."""
    temp = weather.get('temperature_2m', 25)
    rain = weather.get('rain', 0)
    wind = weather.get('wind_speed_10m', 0)
    
    risk_level = "LOW"
    factors = []
    recommendations = []
    
    # Check temperature
    if temp > 40:
        risk_level = "HIGH"
        factors.append("Extreme heat")
        recommendations.append("Stay indoors during peak hours")
    elif temp < 5:
        risk_level = "MEDIUM"
        factors.append("Cold weather")
        recommendations.append("Wear warm clothing")
    
    # Check rain
    if rain > 50:
        risk_level = "HIGH"
        factors.append("Heavy rainfall")
        recommendations.append("Avoid travel if possible")
    elif rain > 20:
        if risk_level == "LOW":
            risk_level = "MEDIUM"
        factors.append("Moderate rain")
        recommendations.append("Carry an umbrella")
    
    # Check wind
    if wind > 60:
        risk_level = "HIGH"
        factors.append("Very strong winds")
        recommendations.append("Secure loose objects")
    elif wind > 40:
        if risk_level == "LOW":
            risk_level = "MEDIUM"
        factors.append("Strong winds")
        recommendations.append("Be cautious outdoors")
    
    if risk_level == "LOW":
        factors.append("Normal conditions")
        recommendations.append("No special precautions needed")
    
    return {
        "risk_level": risk_level,
        "risk_score": 8.5 if risk_level == "HIGH" else (5.0 if risk_level == "MEDIUM" else 2.0),
        "factors": factors,
        "recommendations": recommendations,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

def get_weather_from_api(location: str):
    """Fetch real weather data from Open-Meteo API."""
    try:
        # First, geocode the location
        geocode_url = f"https://geocoding-api.open-meteo.com/v1/search?name={location}&count=1&language=en&format=json"
        geo_response = requests.get(geocode_url, timeout=10)
        geo_data = geo_response.json()
        
        if not geo_data.get('results'):
            return None
        
        result = geo_data['results'][0]
        lat = result['latitude']
        lon = result['longitude']
        city_name = result['name']
        
        # Get weather data
        weather_url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,relative_humidity_2m,rain,cloud_cover,wind_speed_10m&timezone=auto"
        weather_response = requests.get(weather_url, timeout=10)
        weather_data = weather_response.json()
        
        current = weather_data.get('current', {})
        
        return {
            "location": city_name,
            "latitude": lat,
            "longitude": lon,
            "temperature_2m": current.get('temperature_2m', 25),
            "relative_humidity_2m": current.get('relative_humidity_2m', 50),
            "rain": current.get('rain', 0),
            "cloud_cover": current.get('cloud_cover', 20),
            "wind_speed_10m": current.get('wind_speed_10m', 10),
            "captured_at": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        print(f"Error fetching weather: {e}")
        return None

@app.get("/")
def root():
    return {"message": "Weather Safety Check API - Simple Server", "status": "running"}

@app.get("/api/weather")
def get_weather(location: str):
    """Get weather and risk assessment for a location."""
    try:
        # Fetch weather data
        weather_data = get_weather_from_api(location)
        
        if not weather_data:
            return {
                "error": "Location not found",
                "message": f"Could not find weather data for '{location}'. Please check the spelling."
            }
        
        # Assess risk
        risk_assessment = assess_risk(weather_data)
        
        return {
            "data": weather_data,
            "risk_assessment": risk_assessment,
            "history": []
        }
    
    except Exception as e:
        print(f"Error in get_weather: {e}")
        return {
            "error": "Server error",
            "message": "Could not fetch weather data. Please try again."
        }

if __name__ == "__main__":
    import uvicorn
    print("Starting Weather Safety Check - Simple Server...")
    print("Server will run on http://localhost:8000")
    print("API endpoint: http://localhost:8000/api/weather?location=<city>")
    uvicorn.run(app, host="0.0.0.0", port=8000)
