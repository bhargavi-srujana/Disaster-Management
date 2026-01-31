# Intelligent Disaster Alert System

A real-time disaster early warning platform that analyzes weather patterns to detect floods, cyclones, and heatwaves before they become critical.

## 🌟 Key Features

### 🌦️ Real-Time Weather Monitoring
- Live weather data from Open-Meteo API (temperature, wind, rainfall, humidity, cloud cover)
- Auto-location detection with browser geolocation
- 48-hour weather forecast with hourly predictions
- Smart fallback to Firestore cache if API fails

### 🚨 Intelligent Risk Assessment

**Disaster Detection:**
| Disaster Type | Trigger Condition | Risk Level |
|--------------|-------------------|------------|
| **Flood** | Rain > 50mm/hour | 🔴 HIGH |
| **Heavy Rain** | 50mm+ over 3 hours | 🟡 MEDIUM |
| **Cyclone** | Wind > 70 km/h | 🔴 HIGH |
| **Heatwave** | Temp > 40°C for 6+ hours | 🔴 HIGH |

**Key Algorithm Features:**
- **Persistence Analysis**: Tracks duration of dangerous conditions (not just snapshots)
- **Confidence Scoring**: Risk reliability based on data freshness
- **Early Warning**: Detects developing threats before escalation

### 📊 Additional Features
- **View Trends**: 24-hour weather analysis with pattern detection
- **User Alerts**: Email notifications for HIGH risk conditions via SendGrid
- **Multi-City Dashboard**: Monitor 8 major Indian cities simultaneously
- **Simulation Mode**: Test with mock disaster scenarios

## 🏗️ Architecture

### Tech Stack
- **Backend**: FastAPI (Python) + Google Firestore
- **Frontend**: React 18 + Tailwind CSS 
- **APIs**: Open-Meteo (weather), BigDataCloud (geocoding), SendGrid (alerts)

### Project Structure
```
backend/
├── main.py           # API endpoints
├── risk_engine.py    # Disaster detection logic
└── notifier.py       # Email alerts

frontend/src/
├── App.jsx           # Main app
├── components/       # UI components
└── services/api.js   # Backend client
```

### Key API Endpoints
- `GET /weather?location={city}` - Weather & risk assessment
- `POST /users/register` - Register for alerts
- `GET /refresh` - Manual city refresh

### Data Flow
```
User Search → Geocode → Open-Meteo API → Save to Firestore
                                      ↓
                        Retrieve 24hr History → Risk Engine
                                      ↓
                        Return: Weather + Risk + Forecast + Trends
```

---

## 🚀 Deployment

### Backend (Render/Cloud Platform)
1. Set environment variables:
   ```bash
   GOOGLE_CREDENTIALS_JSON='{...firestore credentials...}'
   SENDGRID_API_KEY='SG.xxx...'
   ALLOWED_ORIGINS='https://your-frontend.vercel.app'
   ```
2. Deploy FastAPI app (port 8080)

### Frontend (Vercel)
1. Set environment variable:
   ```bash
   REACT_APP_API_URL='https://your-backend.onrender.com'
   ```
2. Deploy React app

### Database (Firestore)
1. Create Firebase project
2. Create database named `weather`
3. Deploy firestore.rules for security
4. Deploy firestore.indexes.json for queries

---

## 🛠️ Recent Fixes & Improvements

1. **Forecast Duration Fix** - Limited to 48 hours (was showing 13 days)
2. **Trends Fallback** - Use Firestore when API hourly data unavailable
3. **Error Handling** - Clear stale data when location not found
4. **Future Data Cleanup** - Remove incorrectly stored forecast from history
5. **Data Source Separation** - Clear distinction between observations vs predictions

---

**Simulation Mode:**
```bash
# Test flood scenario
GET /weather?location=Mumbai&simulation=flood

# Test normal conditions
GET /weather?location=Mumbai&simulation=normal
```

**Database Cleanup:**
```bash
# Remove all history records
python backend/cleanup_history.py

# Remove future-dated records only
python backend/cleanup_future_history.py
```

---

## 🎯 Use Cases

1. **Citizens** - Check local disaster risk before traveling
2. **Emergency Services** - Monitor high-risk areas for deployment
3. **Municipalities** - Early warning system for disaster preparedness
4. **Researchers** - Study weather pattern correlations with disasters
5. **Developers** - Template for real-time risk assessment systems

---


### Environment Variables

**Backend:**
```bash
GOOGLE_CREDENTIALS_JSON='{...firestore credentials...}'
SENDGRID_API_KEY='SG.xxx'
ALLOWED_ORIGINS='http://localhost:3000'
```

**Frontend:**
```bash
REACT_APP_API_URL='http://localhost:8080'
```

### Quick Start
1. Backend: Deploy FastAPI to Render/Cloud (port 8080)
2. Frontend: Deploy React to Vercel
3. Database: Create Firebase project with `weather` database

### Testing
```bash
# Test disaster scenarios
GET /weather?location=Mumbai&simulation=flood

# Database cleanup
python backend/cleanup_history.py
```

---

## 🎯 Use Cases

- **Citizens**: Check local disaster risk before traveling
- **Emergency Services**: Monitor high-risk areas
- **Municipalities**: Early warning disaster preparedness
- **Researchers**: Weather pattern analysis

---

**Built with ❤️ for safer communities** 