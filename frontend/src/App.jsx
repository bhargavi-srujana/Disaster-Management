import React, { useState, useEffect, useCallback } from 'react';
import CitizenStatusBox from './components/CitizenStatusBox';
import SimpleLocationBar from './components/SimpleLocationBar';
import PlainWeatherInfo from './components/PlainWeatherInfo';
import SimpleLocationChanger from './components/SimpleLocationChanger';
import BigAlertButton from './components/BigAlertButton';
import UserRegistration from './components/UserRegistration';
import TrendsModal from './components/TrendsModal';
import { getWeatherRisk } from './services/api';

function App() {
  const [selectedLocation, setSelectedLocation] = useState('');
  const [weatherData, setWeatherData] = useState(null);
  const [riskAssessment, setRiskAssessment] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [hourlyTrends, setHourlyTrends] = useState([]);
  const [hasExtendedHistory, setHasExtendedHistory] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [allCitiesData, setAllCitiesData] = useState({});
  const [lastUpdated, setLastUpdated] = useState(null);
  const [showRegistration, setShowRegistration] = useState(false);
  const [showTrends, setShowTrends] = useState(false);
  const [locationDetected, setLocationDetected] = useState(false);
  const [userCoordinates, setUserCoordinates] = useState(null);

  // Get user's location on first load
  useEffect(() => {
    if (!locationDetected && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          // Store coordinates for fallback
          setUserCoordinates({ latitude, longitude });
          
          // Try multiple geocoding services to find city name
          let city = null;
          
          // Try 1: BigDataCloud (usually best for cities)
          try {
            const response = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
            );
            const data = await response.json();
            city = data.city || data.locality || data.principalSubdivision;
          } catch (err) {
            console.log('BigDataCloud failed:', err);
          }
          
          // Try 2: If no city, try geocode.xyz
          if (!city) {
            try {
              const response = await fetch(
                `https://geocode.xyz/${latitude},${longitude}?json=1`
              );
              const data = await response.json();
              city = data.city || data.region;
            } catch (err) {
              console.log('Geocode.xyz failed:', err);
            }
          }
          
          if (city) {
            setSelectedLocation(city);
            setLocationDetected(true);
          } else {
            // No city name found from any service, show welcome screen
            console.log('Could not determine city name from coordinates');
            setLocationDetected(true);
          }
        },
        (error) => {
          // Geolocation denied or failed, don't set default location
          console.log('Geolocation not available:', error.message);
          setLocationDetected(true);
        },
        { timeout: 10000 }
      );
    } else if (!locationDetected) {
      // Geolocation not supported, don't set default
      setLocationDetected(true);
    }
  }, [locationDetected]);

  // Fetch weather data for a single location
  const fetchWeatherData = useCallback(async (location, isAutoDetected = false) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getWeatherRisk(location);
      setWeatherData(data.data);
      setRiskAssessment(data.risk_assessment);
      setHistoryData(data.history || []);
      setHourlyTrends(data.hourly_trends || []);
      setHasExtendedHistory(data.has_extended_history || false);
      setLastUpdated(new Date());
      
      setAllCitiesData(prev => ({
        ...prev,
        [location]: {
          weather: data.data,
          risk: data.risk_assessment
        }
      }));
    } catch (err) {
      // If auto-detected location failed, show welcome screen
      if (isAutoDetected) {
        setSelectedLocation('');
        console.log('Auto-detected location not found, showing welcome screen');
      } else {
        setError('Could not find that location. Please try a nearby major city.');
      }
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle location change
  const handleLocationChange = (location) => {
    setSelectedLocation(location);
  };

  // Initial load - fetch weather when location is detected
  useEffect(() => {
    if (selectedLocation) {
      // Check if this is the first load (auto-detected location)
      const isFirstLoad = !weatherData && !error;
      fetchWeatherData(selectedLocation, isFirstLoad);
    }
  }, [selectedLocation, fetchWeatherData]);

  // Calculate high risk count
  const highRiskCount = Object.values(allCitiesData).filter(
    city => city.risk?.risk_level === 'HIGH'
  ).length;

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#FAFAFA',
      padding: '0'
    }}>
      {/* Simple Header */}
      <header style={{
        backgroundColor: '#FFFFFF',
        borderBottom: '3px solid #2B2B2B',
        padding: '16px 20px'
      }}>
        <div style={{ 
          maxWidth: '700px', 
          margin: '0 auto',
          fontSize: '20px',
          fontWeight: '700',
          color: '#1A1A1A'
        }}>
          Weather Safety Check
        </div>
      </header>

      {/* User Registration Modal */}
      {showRegistration && (
        <UserRegistration onClose={() => setShowRegistration(false)} />
      )}

      {/* Trends Modal */}
      {showTrends && (
        <TrendsModal
          location={selectedLocation}
          hourlyTrends={hourlyTrends}
          hasExtendedHistory={hasExtendedHistory}
          onClose={() => setShowTrends(false)}
        />
      )}

      {/* Main Content - Single Column */}
      <main style={{ 
        maxWidth: '700px', 
        margin: '0 auto', 
        padding: '24px 20px' 
      }}>
        
        {/* No Location Yet - Welcome State */}
        {!selectedLocation && locationDetected && (
          <div>
            <div style={{
              backgroundColor: '#E8F4FD',
              border: '3px solid #0066CC',
              padding: '32px 24px',
              marginBottom: '24px',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '48px',
                marginBottom: '16px'
              }}>
                🌦️
              </div>
              <div style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#1A1A1A',
                marginBottom: '16px',
                lineHeight: '1.3'
              }}>
                Check weather safety in your area
              </div>
              <div style={{
                fontSize: '16px',
                color: '#2B2B2B',
                lineHeight: '1.6',
                marginBottom: '20px'
              }}>
                Get instant alerts about dangerous weather conditions. Stay safe during floods, heavy rain, and storms.
              </div>
            </div>

            <SimpleLocationChanger
              selectedLocation=""
              onLocationChange={handleLocationChange}
            />

            <BigAlertButton onClick={() => setShowRegistration(true)} />
          </div>
        )}
        
        {/* Error Message */}
        {error && selectedLocation && (
          <div style={{
            backgroundColor: '#FFE8E8',
            border: '3px solid #B71C1C',
            padding: '16px',
            marginBottom: '24px',
            fontSize: '16px',
            color: '#1A1A1A'
          }}>
            Could not check conditions right now. Please try again.
          </div>
        )}

        {/* Loading State */}
        {isLoading && selectedLocation && (
          <div style={{
            backgroundColor: '#FFFFFF',
            border: '2px solid #D0D0D0',
            padding: '40px',
            textAlign: 'center',
            marginBottom: '24px',
            fontSize: '18px',
            color: '#4A4A4A'
          }}>
            Checking conditions...
          </div>
        )}

        {!isLoading && weatherData && selectedLocation && (
          <>
            {/* 1. ARE YOU SAFE? */}
            <CitizenStatusBox risk={riskAssessment} />

            {/* 2. LOCATION & TIME */}
            <SimpleLocationBar 
              location={selectedLocation} 
              lastUpdated={lastUpdated} 
            />

            {/* 3. WHAT IS HAPPENING? */}
            <PlainWeatherInfo weather={weatherData} />

            {/* 3.5 VIEW TRENDS BUTTON */}
            <button
              onClick={() => setShowTrends(true)}
              style={{
                width: '100%',
                backgroundColor: '#FFFFFF',
                border: '3px solid #0066CC',
                color: '#0066CC',
                padding: '16px 24px',
                fontSize: '18px',
                fontWeight: '700',
                cursor: 'pointer',
                marginBottom: '24px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#E8F4FD';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#FFFFFF';
              }}
            >
              📊 View 24-Hour Trends
            </button>

            {/* 4. ACTION BUTTON */}
            <BigAlertButton onClick={() => setShowRegistration(true)} />

            {/* 5. CHANGE LOCATION */}
            <SimpleLocationChanger
              selectedLocation={selectedLocation}
              onLocationChange={handleLocationChange}
            />
          </>
        )}
      </main>

      {/* Simple Footer */}
      <footer style={{
        backgroundColor: '#2B2B2B',
        color: '#C9C8C3',
        padding: '16px 20px',
        marginTop: '48px',
        textAlign: 'center',
        fontSize: '13px'
      }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          Weather information updated every 10 minutes
        </div>
      </footer>
    </div>
  );
}

export default App;
