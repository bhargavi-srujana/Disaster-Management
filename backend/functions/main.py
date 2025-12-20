from flask import Flask, request, jsonify
import requests
import json
import os
import datetime
import risk_engine

app = Flask(__name__)

# Core API Key
API_KEY = "e15af5ec0cc6857ec15cad616fcf52b8"

@app.route('/weather', methods=['GET'])
def get_weather_risk():
    location = request.args.get('location', 'Mumbai')
    
    print(f"\n--- NEW REQUEST: {location} ---")
    
    # 1. Fetch Real-Time Weather
    url = f"https://api.openweathermap.org/data/2.5/weather?q={location}&appid={API_KEY}&units=metric"
    try:
        response = requests.get(url, timeout=5)
        response.raise_for_status()
        api_data = response.json()
        
        # Log raw response to terminal
        print(f"RAW API DATA:\n{json.dumps(api_data, indent=2)}")

        weather_data = {
            "temp": api_data.get('main', {}).get('temp', 0),
            "wind_speed": api_data.get('wind', {}).get('speed', 0) * 3.6, # Convert m/s to km/h
            "rain_1h": api_data.get('rain', {}).get('1h', 0.0),
            "clouds": api_data.get('clouds', {}).get('all', 0),
            "humidity": api_data.get('main', {}).get('humidity', 0),
            "location": api_data.get('name', location)
        }
    except Exception as e:
        print(f"ERROR FETCHING DATA: {e}")
        return jsonify({"status": "error", "message": str(e)}), 400

    # 2. Evaluate Risk via Engine
    risk_result = risk_engine.evaluate_risk(weather_data)
    
    # 3. Combine and Respond
    final_response = {
        "status": "success",
        "location": weather_data['location'],
        "weather": weather_data,
        "risk_assessment": risk_result
    }

    # Log final assessment to terminal
    print(f"FINAL ASSESSMENT:\n{json.dumps(final_response, indent=2)}")
    print("-" * 50)

    return jsonify(final_response)

if __name__ == "__main__":
    print("Sentinel Weather API is live on http://localhost:8080")
    print("Test it with: http://localhost:8080/weather?location=London")
    app.run(port=8080, debug=True)
