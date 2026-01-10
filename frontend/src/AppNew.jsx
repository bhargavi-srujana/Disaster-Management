import React, { useState, useEffect, useCallback } from 'react';
import HeaderNew from './components/HeaderNew';
import RiskAlertBanner from './components/RiskAlertBanner';
import LocationSelector from './components/LocationSelector';
import WeatherDataTable from './components/WeatherDataTable';
import RiskAssessmentPanel from './components/RiskAssessmentPanel';
import UserRegistration from './components/UserRegistration';
import { getWeatherRisk, MONITORED_CITIES } from './services/api';

function App() {
  const [selectedLocation, setSelectedLocation] = useState('Mumbai');
  const [weatherData, setWeatherData] = useState(null);
  const [riskAssessment, setRiskAssessment] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [allCitiesData, setAllCitiesData] = useState({});
  const [lastUpdated, setLastUpdated] = useState(null);
  const [showRegistration, setShowRegistration] = useState(false);

  // Fetch weather data for a single location
  const fetchWeatherData = useCallback(async (location) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getWeatherRisk(location);
      setWeatherData(data.data);
      setRiskAssessment(data.risk_assessment);
      setLastUpdated(new Date());
      
      setAllCitiesData(prev => ({
        ...prev,
        [location]: {
          weather: data.data,
          risk: data.risk_assessment
        }
      }));
    } catch (err) {
      setError('Failed to fetch weather data. Please try again.');
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle location change
  const handleLocationChange = (location) => {
    setSelectedLocation(location);
    fetchWeatherData(location);
  };

  // Initial load
  useEffect(() => {
    fetchWeatherData(selectedLocation);
  }, [selectedLocation, fetchWeatherData]);

  // Calculate high risk count
  const highRiskCount = Object.values(allCitiesData).filter(
    city => city.risk?.risk_level === 'HIGH'
  ).length;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F7F6F2' }}>
      {/* Header */}
      <HeaderNew
        highRiskCount={highRiskCount}
        lastUpdated={lastUpdated}
        onRefresh={() => fetchWeatherData(selectedLocation)}
        onRegisterClick={() => setShowRegistration(true)}
      />

      {/* Risk Alert Banner */}
      {riskAssessment && <RiskAlertBanner risk={riskAssessment} />}

      {/* User Registration Modal */}
      {showRegistration && (
        <UserRegistration onClose={() => setShowRegistration(false)} />
      )}

      {/* Main Content */}
      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px 20px' }}>
        
        {/* Error Message */}
        {error && (
          <div style={{
            backgroundColor: '#B71C1C',
            color: '#FFFFFF',
            padding: '16px',
            marginBottom: '24px',
            border: '2px solid #8B0000',
            fontSize: '14px',
            fontWeight: '700'
          }}>
            ⚠ {error}
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div style={{
            backgroundColor: '#E9E8E3',
            border: '2px solid #4A4A4A',
            padding: '32px',
            textAlign: 'center',
            marginBottom: '24px'
          }}>
            <div style={{ fontSize: '16px', fontWeight: '700', textTransform: 'uppercase' }}>
              LOADING DATA...
            </div>
          </div>
        )}

        {!isLoading && weatherData && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: '24px' }}>
            
            {/* Left Column - Location & Risk */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <LocationSelector
                selectedLocation={selectedLocation}
                onLocationChange={handleLocationChange}
                cities={MONITORED_CITIES}
              />
              <RiskAssessmentPanel risk={riskAssessment} />
            </div>

            {/* Center Column - Weather Data */}
            <div>
              <WeatherDataTable weather={weatherData} location={selectedLocation} />
            </div>

            {/* Right Column - Placeholder for chart/additional info */}
            <div style={{
              border: '2px solid #4A4A4A',
              backgroundColor: '#E9E8E3',
              padding: '16px',
              minHeight: '400px'
            }}>
              <div style={{
                backgroundColor: '#2B2B2B',
                color: '#F7F6F2',
                padding: '12px',
                margin: '-16px -16px 16px -16px',
                fontSize: '14px',
                fontWeight: '700',
                letterSpacing: '1px'
              }}>
                24-HOUR HISTORY
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '300px',
                fontSize: '13px',
                color: '#666'
              }}>
                HISTORICAL DATA VISUALIZATION
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{
        backgroundColor: '#2B2B2B',
        color: '#C9C8C3',
        borderTop: '2px solid #000000',
        padding: '16px 20px',
        marginTop: '48px',
        textAlign: 'center',
        fontSize: '11px'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          DISASTER ALERT SYSTEM - POWERED BY OPEN-METEO API - FOR EMERGENCY USE ONLY
        </div>
      </footer>
    </div>
  );
}

export default App;
