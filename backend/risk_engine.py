import datetime

# --- CONFIGURABLE THRESHOLDS ---
FLOOD_RAIN_THRESHOLD = 50.0   # mm per hour
CYCLONE_WIND_THRESHOLD = 70.0 # km/h
HEATWAVE_TEMP_THRESHOLD = 40.0 # Celsius

def evaluate_risk(history):
    """
    Analyzes a list of historical weather observations and returns a risk assessment.
    
    `history` is a list of dicts, sorted by timestamp DESC (latest first).
    [
      {"temp": float, "wind_speed": float, "rain_1h": float, "timestamp": datetime},
      ...
    ]
    """
    if not history:
        return {
            "risk_level": "UNKNOWN",
            "disaster_type": "NONE",
            "reason": "No historical data available for assessment.",
            "timestamp": datetime.datetime.now().isoformat(),
            "confidence": 0.0
        }

    latest = history[0]
    
    # 1. Calculate Confidence (Staleness Decay)
    now = datetime.datetime.now(datetime.timezone.utc)
    
    # Resilient Timestamp Parsing
    def parse_ts(obj):
        ts = obj.get('timestamp') or obj.get('captured_at')
        if not ts: return now
        if isinstance(ts, str):
            return datetime.datetime.fromisoformat(ts.replace('Z', '+00:00'))
        return ts

    last_update = parse_ts(latest)
    time_gap_hrs = (now - last_update).total_seconds() / 3600
    confidence = max(0.0, 1.0 - (time_gap_hrs / 6)) # Linear decay over 6 hours

    risk_level = "LOW"
    disaster_type = "NONE"
    reason = "Weather conditions are within normal safety limits."
    duration_hrs = 0

    # 2. Check for HEATWAVE Persistence
    if latest.get('temp', 0) > HEATWAVE_TEMP_THRESHOLD:
        # Calculate how long it has been above threshold
        start_time = last_update
        for obs in history:
            if obs.get('temp', 0) > HEATWAVE_TEMP_THRESHOLD:
                start_time = parse_ts(obs)
            else:
                break
        
        diff = (last_update - start_time).total_seconds() / 3600
        duration_hrs = max(0.0, diff)
        
        if duration_hrs >= 6:
            risk_level = "HIGH"
            disaster_type = "HEATWAVE"
            reason = f"CRITICAL: Temperature has been above {HEATWAVE_TEMP_THRESHOLD}°C for {duration_hrs:.1f} continuous hours."
        else:
            risk_level = "MEDIUM"
            disaster_type = "HEATWAVE"
            reason = f"WARNING: High temperature detected ({latest['temp']}°C). Monitoring for persistence."

    # 3. Check for CYCLONE (Intensity based)
    elif latest.get('wind_speed', 0) > CYCLONE_WIND_THRESHOLD:
        risk_level = "HIGH"
        disaster_type = "CYCLONE"
        reason = f"ALERT: Extreme wind speeds ({latest['wind_speed']} km/h) detected. Immediate danger."

    # 4. Check for FLOOD (Intensity + Short term persistence)
    elif latest.get('rain_1h', 0) > FLOOD_RAIN_THRESHOLD:
        risk_level = "HIGH"
        disaster_type = "FLOOD"
        reason = f"ALERT: Heavy rainfall ({latest['rain_1h']} mm/h) indicates immediate flash flood risk."

    # 5. Check for Heavy Rain Persistence (Early Warning)
    else:
        rain_total_3h = sum([obs.get('rain_1h', 0) for obs in history[:3]])
        if rain_total_3h > FLOOD_RAIN_THRESHOLD:
            risk_level = "MEDIUM"
            disaster_type = "HEAVY_RAIN"
            reason = f"Sustained heavy rain ({rain_total_3h:.1f}mm over 3h). Risk of flooding is increasing."

    return {
        "risk_level": risk_level,
        "disaster_type": disaster_type,
        "reason": reason,
        "persistence_duration_hrs": round(duration_hrs, 2),
        "confidence_score": round(confidence, 2),
        "timestamp": now.isoformat()
    }
