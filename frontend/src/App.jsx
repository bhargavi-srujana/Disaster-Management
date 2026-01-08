import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import LocationSearch from './components/LocationSearch';
import WeatherCard from './components/WeatherCard';
import RiskAlert from './components/RiskAlert';
import SimulationPanel from './components/SimulationPanel';
import HistoryChart from './components/HistoryChart';
import LoadingSpinner from './components/LoadingSpinner';
import UserRegistration from './components/UserRegistration';
import { getWeatherRisk, MONITORED_CITIES } from './services/api';

function App() {
  const [selectedLocation, setSelectedLocation] = useState('Mumbai');
  const [weatherData, setWeatherData] = useState(null);
  const [riskAssessment, setRiskAssessment] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [simulation, setSimulation] = useState(null);
  const [allCitiesData, setAllCitiesData] = useState({});
  const [lastUpdated, setLastUpdated] = useState(null);
  const [showRegistration, setShowRegistration] = useState(false);

  // Fetch weather data for a single location
  const fetchWeatherData = useCallback(async (location, sim = null) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getWeatherRisk(location, sim);
      setWeatherData(data.data);
      setRiskAssessment(data.risk_assessment);
      setHistoryData(data.history || []);
      setLastUpdated(new Date());
      
      // Update all cities data
      setAllCitiesData(prev => ({
        ...prev,
        [location]: {
          weather: data.data,
          risk: data.risk_assessment,
          source: data.source
        }
      }));
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Failed to fetch weather data');
      console.error('Error fetching weather:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch data for all monitored cities
  const fetchAllCities = useCallback(async () => {
    const promises = MONITORED_CITIES.map(async (city) => {
      try {
        const data = await getWeatherRisk(city);
        return { city, data };
      } catch (err) {
        return { city, error: err };
      }
    });

    const results = await Promise.allSettled(promises);
    const newData = {};
    
    results.forEach((result) => {
      if (result.status === 'fulfilled' && result.value.data) {
        const { city, data } = result.value;
        newData[city] = {
          weather: data.data,
          risk: data.risk_assessment,
          source: data.source
        };
      }
    });

    setAllCitiesData(newData);
  }, []);

  // Initial load
  useEffect(() => {
    fetchWeatherData(selectedLocation);
    fetchAllCities();
  }, []);

  // Handle location change
  const handleLocationChange = (location) => {
    setSelectedLocation(location);
    setSimulation(null);
    fetchWeatherData(location);
  };

  // Handle simulation
  const handleSimulation = (scenario) => {
    setSimulation(scenario);
    if (scenario) {
      fetchWeatherData(selectedLocation, scenario);
    } else {
      fetchWeatherData(selectedLocation);
    }
  };

  // Refresh data
  const handleRefresh = () => {
    fetchWeatherData(selectedLocation, simulation);
  };

  // Count high risk cities
  const highRiskCount = Object.values(allCitiesData).filter(
    data => data?.risk?.risk_level === 'HIGH'
  ).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <Header 
        highRiskCount={highRiskCount}
        lastUpdated={lastUpdated}
        onRefresh={handleRefresh}
        onRegisterClick={() => setShowRegistration(true)}
      />

      {/* User Registration Modal */}
      {showRegistration && (
        <UserRegistration onClose={() => setShowRegistration(false)} />
      )}

      <main className="container mx-auto px-4 py-6">
        {/* Top Section: Search & Simulation */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <LocationSearch 
              selectedLocation={selectedLocation}
              onLocationChange={handleLocationChange}
              cities={MONITORED_CITIES}
            />
          </div>
          <div>
            <SimulationPanel 
              currentSimulation={simulation}
              onSimulate={handleSimulation}
            />
          </div>
        </div>

        {/* Risk Alert Banner */}
        {riskAssessment && riskAssessment.risk_level !== 'LOW' && (
          <RiskAlert 
            risk={riskAssessment}
            location={selectedLocation}
          />
        )}

        {/* Main Content */}
        {isLoading ? (
          <LoadingSpinner />
        ) : error ? (
          <div className="bg-red-900/30 border border-red-500 rounded-xl p-6 text-center">
            <p className="text-red-400 text-lg">{error}</p>
            <button 
              onClick={handleRefresh}
              className="mt-4 px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white transition-colors"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            {/* Weather Details Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <div className="lg:col-span-2">
                <WeatherCard 
                  weather={weatherData}
                  location={selectedLocation}
                  risk={riskAssessment}
                />
              </div>
              <div>
                <Dashboard 
                  risk={riskAssessment}
                  weather={weatherData}
                />
              </div>
            </div>

            {/* Weather Trends */}
            {weatherData && (
              <div className="mb-6">
                <HistoryChart weather={weatherData} history={historyData} />
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 py-4 mt-8">
        <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
          <p>Disaster Alert System - Powered by Open-Meteo API</p>
          <p className="mt-1">Real-time weather monitoring and risk assessment</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
