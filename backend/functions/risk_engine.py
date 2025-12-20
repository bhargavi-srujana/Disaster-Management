import datetime

# --- CONFIGURABLE THRESHOLDS ---
FLOOD_RAIN_THRESHOLD = 50.0   # mm per hour
CYCLONE_WIND_THRESHOLD = 70.0 # km/h
HEATWAVE_TEMP_THRESHOLD = 40.0 # Celsius

def evaluate_risk(weather_data):
    """
    Analyzes weather data and returns a risk assessment dictionary.
    
    Expected input `weather_data`:
    {
      "temp": float,       # Celsius
      "wind_speed": float, # km/h
      "rain_1h": float,    # mm
      "clouds": int        # %
    }
    """
    risk_level = "LOW"
    disaster_type = "NONE"
    reason = "Weather conditions are within normal safety limits."
    
    # Extract values with safe defaults
    wind = weather_data.get('wind_speed', 0)
    rain = weather_data.get('rain_1h', 0)
    temp = weather_data.get('temp', 0)

    # 1. Check for Cyclone (Top Priority)
    if wind > CYCLONE_WIND_THRESHOLD:
        risk_level = "HIGH"
        disaster_type = "CYCLONE"
        reason = f"ALERT: wind speed ({wind} km/h) exceeds severe storm threshold ({CYCLONE_WIND_THRESHOLD} km/h). Immediate shelter required."
    
    # 2. Check for Flood
    elif rain > FLOOD_RAIN_THRESHOLD:
        risk_level = "HIGH"
        disaster_type = "FLOOD"
        reason = f"ALERT: Rainfall intensity ({rain} mm/h) indicates high risk of flash flooding."
        
    # 3. Check for Heatwave
    elif temp > HEATWAVE_TEMP_THRESHOLD:
        risk_level = "MEDIUM"
        disaster_type = "HEATWAVE"
        reason = f"Temperature ({temp}°C) is dangerously high. Stay hydrated and avoid direct sun."
    
    # 4. Check for Heavy Rain (Medium Risk)
    elif rain > (FLOOD_RAIN_THRESHOLD / 2):
        risk_level = "MEDIUM"
        disaster_type = "HEAVY_RAIN"
        reason = f"Significant rainfall detected ({rain} mm/h). Monitor local alerts."

    return {
        "risk_level": risk_level,
        "disaster_type": disaster_type,
        "reason": reason,
        "timestamp": datetime.datetime.now().isoformat()
    }
