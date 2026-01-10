import React, { useState } from 'react';

const ForecastPanel = ({ forecast, location }) => {
  const [view, setView] = useState('12h'); // '12h' or '48h'

  if (!forecast || forecast.length === 0) {
    return null;
  }

  // Weather code to description mapping (WMO codes)
  const getWeatherDescription = (code) => {
    const codes = {
      0: { desc: 'Clear', emoji: '☀️', color: '#FDB927' },
      1: { desc: 'Mainly Clear', emoji: '🌤️', color: '#FDB927' },
      2: { desc: 'Partly Cloudy', emoji: '⛅', color: '#9CA3AF' },
      3: { desc: 'Cloudy', emoji: '☁️', color: '#6B7280' },
      45: { desc: 'Foggy', emoji: '🌫️', color: '#9CA3AF' },
      48: { desc: 'Foggy', emoji: '🌫️', color: '#9CA3AF' },
      51: { desc: 'Light Drizzle', emoji: '🌦️', color: '#3B82F6' },
      53: { desc: 'Drizzle', emoji: '🌦️', color: '#3B82F6' },
      55: { desc: 'Heavy Drizzle', emoji: '🌧️', color: '#2563EB' },
      61: { desc: 'Light Rain', emoji: '🌧️', color: '#3B82F6' },
      63: { desc: 'Rain', emoji: '🌧️', color: '#2563EB' },
      65: { desc: 'Heavy Rain', emoji: '⛈️', color: '#1E40AF' },
      71: { desc: 'Light Snow', emoji: '🌨️', color: '#60A5FA' },
      73: { desc: 'Snow', emoji: '❄️', color: '#3B82F6' },
      75: { desc: 'Heavy Snow', emoji: '❄️', color: '#2563EB' },
      80: { desc: 'Rain Showers', emoji: '🌦️', color: '#3B82F6' },
      81: { desc: 'Rain Showers', emoji: '🌧️', color: '#2563EB' },
      82: { desc: 'Heavy Showers', emoji: '⛈️', color: '#1E40AF' },
      95: { desc: 'Thunderstorm', emoji: '⛈️', color: '#B71C1C' },
      96: { desc: 'Thunderstorm', emoji: '⛈️', color: '#B71C1C' },
      99: { desc: 'Severe Storm', emoji: '🌩️', color: '#7F1D1D' }
    };
    return codes[code] || { desc: 'Clear', emoji: '🌤️', color: '#9CA3AF' };
  };

  // Detect upcoming risks
  const detectRisks = (forecastData) => {
    const risks = [];
    
    // Check for heavy rain in next 24 hours
    const next24h = forecastData.slice(0, 24);
    const heavyRain = next24h.some(h => h.rain && h.rain > 10);
    if (heavyRain) {
      risks.push({ text: 'Heavy rain expected', color: '#C87F0A', time: 'next 24 hours' });
    }
    
    // Check for high winds
    const strongWinds = next24h.some(h => h.wind && h.wind > 40);
    if (strongWinds) {
      risks.push({ text: 'Strong winds expected', color: '#C87F0A', time: 'next 24 hours' });
    }
    
    // Check for extreme temperatures
    const highTemp = next24h.some(h => h.temp && h.temp > 40);
    if (highTemp) {
      risks.push({ text: 'Very hot conditions', color: '#C87F0A', time: 'next 24 hours' });
    }
    
    return risks;
  };

  const risks = detectRisks(forecast);
  const displayData = view === '12h' ? forecast.slice(0, 12) : forecast;

  // Group forecast by day
  const groupedByDay = {};
  displayData.forEach(hour => {
    const date = new Date(hour.time);
    const dayKey = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    if (!groupedByDay[dayKey]) {
      groupedByDay[dayKey] = [];
    }
    groupedByDay[dayKey].push(hour);
  });

  return (
    <div style={{ marginBottom: '24px' }}>
      {/* Header */}
      <div style={{
        backgroundColor: '#FFFFFF',
        border: '2px solid #D0D0D0',
        borderBottom: 'none',
        padding: '16px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <div style={{
            fontSize: '18px',
            fontWeight: '700',
            color: '#1A1A1A'
          }}>
            Weather Forecast
          </div>
          <div style={{
            fontSize: '13px',
            color: '#666666',
            marginTop: '2px'
          }}>
            Next 48 hours • {location}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setView('12h')}
            style={{
              padding: '8px 16px',
              border: view === '12h' ? '2px solid #0066CC' : '2px solid #D0D0D0',
              backgroundColor: view === '12h' ? '#E8F4FD' : '#FFFFFF',
              color: view === '12h' ? '#0066CC' : '#666666',
              fontWeight: view === '12h' ? '700' : '400',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            12 Hours
          </button>
          <button
            onClick={() => setView('48h')}
            style={{
              padding: '8px 16px',
              border: view === '48h' ? '2px solid #0066CC' : '2px solid #D0D0D0',
              backgroundColor: view === '48h' ? '#E8F4FD' : '#FFFFFF',
              color: view === '48h' ? '#0066CC' : '#666666',
              fontWeight: view === '48h' ? '700' : '400',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            48 Hours
          </button>
        </div>
      </div>

      {/* Warnings */}
      {risks.length > 0 && (
        <div style={{
          backgroundColor: '#FFF9E6',
          border: '2px solid #C87F0A',
          borderTop: 'none',
          padding: '12px 20px'
        }}>
          {risks.map((risk, idx) => (
            <div key={idx} style={{
              fontSize: '14px',
              color: risk.color,
              fontWeight: '600',
              marginBottom: idx < risks.length - 1 ? '4px' : '0'
            }}>
              ⚠️ {risk.text} ({risk.time})
            </div>
          ))}
        </div>
      )}

      {/* Forecast List */}
      <div style={{
        backgroundColor: '#FFFFFF',
        border: '2px solid #D0D0D0',
        borderTop: risks.length > 0 ? 'none' : '2px solid #D0D0D0',
        maxHeight: '400px',
        overflowY: 'auto'
      }}>
        {Object.entries(groupedByDay).map(([day, hours], dayIdx) => (
          <div key={day}>
            {/* Day Header */}
            <div style={{
              backgroundColor: '#F5F5F5',
              padding: '8px 20px',
              fontSize: '14px',
              fontWeight: '700',
              color: '#1A1A1A',
              borderTop: dayIdx > 0 ? '2px solid #D0D0D0' : 'none'
            }}>
              {day}
            </div>
            
            {/* Hours for this day */}
            {hours.map((hour, idx) => {
              const time = new Date(hour.time);
              const timeStr = time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
              const weather = getWeatherDescription(hour.weather_code || 0);
              
              return (
                <div key={idx} style={{
                  padding: '12px 20px',
                  borderBottom: '1px solid #E0E0E0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                    <div style={{ fontSize: '14px', color: '#666666', width: '70px' }}>
                      {timeStr}
                    </div>
                    <div style={{ fontSize: '24px' }}>
                      {weather.emoji}
                    </div>
                    <div style={{ fontSize: '14px', color: '#666666' }}>
                      {weather.desc}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '18px', fontWeight: '700', color: '#1A1A1A' }}>
                        {hour.temp ? `${hour.temp.toFixed(1)}°` : 'N/A'}
                      </div>
                    </div>
                    
                    {hour.rain && hour.rain > 0 && (
                      <div style={{ fontSize: '13px', color: '#0066CC', width: '60px', textAlign: 'right' }}>
                        💧 {hour.rain.toFixed(1)}mm
                      </div>
                    )}
                    
                    {hour.wind && (
                      <div style={{ fontSize: '13px', color: '#666666', width: '80px', textAlign: 'right' }}>
                        💨 {hour.wind.toFixed(0)} km/h
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ForecastPanel;
