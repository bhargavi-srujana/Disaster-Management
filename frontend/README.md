# Disaster Alert System - Frontend

A modern React-based frontend for the Disaster Alert System that provides real-time weather monitoring and risk assessment visualization.

## Features

- 🌡️ **Real-time Weather Data**: Live weather monitoring for multiple Indian cities
- ⚠️ **Risk Assessment Dashboard**: Visual risk level indicators (LOW, MEDIUM, HIGH)
- 🌊 **Disaster Type Detection**: Flood, Cyclone, Heatwave, and Heavy Rain alerts
- 📊 **Interactive Charts**: 24-hour weather trend visualization
- 🎮 **Simulation Mode**: Test disaster scenarios (Flood, Normal)
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile
- 🔔 **Emergency Alerts**: Animated alerts with safety tips and emergency contacts

## Tech Stack

- **React 18** - UI Framework
- **Tailwind CSS** - Styling
- **Recharts** - Charts & Graphs
- **Lucide React** - Icons
- **Axios** - API Client

## Getting Started

### Prerequisites

- Node.js 16+ 
- npm or yarn
- Backend server running on `http://localhost:8080`

### Installation

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Environment Variables

Create a `.env` file in the frontend directory:

```env
REACT_APP_API_URL=http://localhost:8080
```

## Project Structure

```
frontend/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Header.jsx          # Navigation & status bar
│   │   ├── Dashboard.jsx       # Risk assessment panel
│   │   ├── LocationSearch.jsx  # City selection
│   │   ├── WeatherCard.jsx     # Current weather display
│   │   ├── RiskAlert.jsx       # Emergency alert banner
│   │   ├── SimulationPanel.jsx # Test scenarios
│   │   ├── HistoryChart.jsx    # Weather trend charts
│   │   └── LoadingSpinner.jsx  # Loading state
│   ├── services/
│   │   └── api.js              # Backend API client
│   ├── App.jsx                 # Main app component
│   ├── index.js                # Entry point
│   └── index.css               # Global styles
├── package.json
├── tailwind.config.js
└── postcss.config.js
```

## API Integration

The frontend connects to these backend endpoints:

- `GET /weather?location={city}` - Fetch weather & risk data
- `GET /weather?location={city}&simulation={scenario}` - Simulate scenarios
- `GET /refresh` - Trigger global data refresh

## Monitored Cities

- Mumbai
- Delhi
- Chennai
- Kolkata
- Bangalore
- Hyderabad
- Pune
- Ahmedabad

## Risk Levels

| Level | Color | Trigger |
|-------|-------|---------|
| LOW | Green | Normal conditions |
| MEDIUM | Yellow | Elevated risk, monitoring |
| HIGH | Red | Immediate danger, take action |

## Disaster Types

- **FLOOD** 🌊 - Rain > 50mm/h
- **CYCLONE** 🌀 - Wind > 70km/h  
- **HEATWAVE** 🔥 - Temp > 40°C for 6+ hours
- **HEAVY_RAIN** 🌧️ - Sustained rainfall

## Screenshots

The application features:
1. Dark theme with gradient backgrounds
2. Interactive city selector
3. Large weather display with conditions
4. Risk assessment gauge
5. 24-hour historical charts
6. Emergency alert banners with safety tips
7. Simulation panel for testing

## Development

```bash
# Run in development mode
npm start

# Build for production
npm run build

# Run tests
npm test
```

## License

MIT
