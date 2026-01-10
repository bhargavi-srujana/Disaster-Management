import React from 'react';

const TrendsModal = ({ location, hourlyTrends, hasExtendedHistory, onClose }) => {
  if (!hourlyTrends || hourlyTrends.length === 0) {
    return null;
  }

  // Get last 24 hours of data
  const recentData = hourlyTrends.slice(-24);
  
  // Calculate patterns
  const temps = recentData.map(d => d.temp).filter(t => t !== null);
  const rains = recentData.map(d => d.rain).filter(r => r !== null);
  const winds = recentData.map(d => d.wind).filter(w => w !== null);
  
  const avgTemp = temps.length > 0 ? (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1) : 'N/A';
  const maxTemp = temps.length > 0 ? Math.max(...temps).toFixed(1) : 'N/A';
  const minTemp = temps.length > 0 ? Math.min(...temps).toFixed(1) : 'N/A';
  const totalRain = rains.length > 0 ? rains.reduce((a, b) => a + b, 0).toFixed(1) : '0';
  const maxWind = winds.length > 0 ? Math.max(...winds).toFixed(1) : 'N/A';

  // Detect patterns
  const patterns = [];
  
  // Temperature trend
  if (temps.length >= 6) {
    const firstHalf = temps.slice(0, 6).reduce((a, b) => a + b, 0) / 6;
    const secondHalf = temps.slice(-6).reduce((a, b) => a + b, 0) / 6;
    if (secondHalf > firstHalf + 3) {
      patterns.push({ text: "Temperature rising over past hours", color: '#C87F0A' });
    } else if (secondHalf < firstHalf - 3) {
      patterns.push({ text: "Temperature dropping over past hours", color: '#0066CC' });
    }
  }
  
  // Rain pattern
  const recentRain = rains.slice(-6).reduce((a, b) => a + b, 0);
  if (recentRain > 10) {
    patterns.push({ text: "Active rainfall in recent hours", color: '#0066CC' });
  }
  
  // Wind pattern
  const recentMaxWind = winds.slice(-6).reduce((a, b) => Math.max(a, b), 0);
  if (recentMaxWind > 40) {
    patterns.push({ text: "Strong winds detected", color: '#C87F0A' });
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#FFFFFF',
        maxWidth: '700px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        border: '3px solid #2B2B2B',
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px',
          borderBottom: '2px solid #E0E0E0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{
              fontSize: '20px',
              fontWeight: '700',
              color: '#1A1A1A'
            }}>
              24-Hour Weather Trends
            </div>
            <div style={{
              fontSize: '14px',
              color: '#666666',
              marginTop: '4px'
            }}>
              {location}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '8px',
              color: '#666666'
            }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px' }}>
          
          {/* Summary Stats */}
          <div style={{
            backgroundColor: '#F5F5F5',
            padding: '16px',
            marginBottom: '20px',
            border: '2px solid #D0D0D0'
          }}>
            <div style={{
              fontSize: '16px',
              fontWeight: '700',
              color: '#1A1A1A',
              marginBottom: '12px'
            }}>
              Last 24 Hours Summary
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '13px', color: '#666666' }}>Average Temperature</div>
                <div style={{ fontSize: '20px', fontWeight: '700', color: '#1A1A1A' }}>{avgTemp}°C</div>
              </div>
              <div>
                <div style={{ fontSize: '13px', color: '#666666' }}>Temperature Range</div>
                <div style={{ fontSize: '20px', fontWeight: '700', color: '#1A1A1A' }}>{minTemp}° - {maxTemp}°</div>
              </div>
              <div>
                <div style={{ fontSize: '13px', color: '#666666' }}>Total Rainfall</div>
                <div style={{ fontSize: '20px', fontWeight: '700', color: '#0066CC' }}>{totalRain} mm</div>
              </div>
              <div>
                <div style={{ fontSize: '13px', color: '#666666' }}>Max Wind Speed</div>
                <div style={{ fontSize: '20px', fontWeight: '700', color: '#1A1A1A' }}>{maxWind} km/h</div>
              </div>
            </div>
          </div>

          {/* Detected Patterns */}
          {patterns.length > 0 && (
            <div style={{
              backgroundColor: '#FFF9E6',
              border: '2px solid #C87F0A',
              padding: '16px',
              marginBottom: '20px'
            }}>
              <div style={{
                fontSize: '16px',
                fontWeight: '700',
                color: '#1A1A1A',
                marginBottom: '8px'
              }}>
                Detected Patterns
              </div>
              {patterns.map((pattern, idx) => (
                <div key={idx} style={{
                  fontSize: '14px',
                  color: pattern.color,
                  marginTop: '4px',
                  fontWeight: '600'
                }}>
                  • {pattern.text}
                </div>
              ))}
            </div>
          )}

          {/* Simple hourly list - last 12 hours */}
          <div style={{
            backgroundColor: '#FFFFFF',
            border: '2px solid #D0D0D0',
            padding: '16px'
          }}>
            <div style={{
              fontSize: '16px',
              fontWeight: '700',
              color: '#1A1A1A',
              marginBottom: '12px'
            }}>
              Recent Hours
            </div>
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {recentData.slice(-12).reverse().map((hour, idx) => {
                const time = new Date(hour.time);
                const timeStr = time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
                
                return (
                  <div key={idx} style={{
                    padding: '8px 0',
                    borderBottom: idx < 11 ? '1px solid #E0E0E0' : 'none',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div style={{ fontSize: '14px', color: '#666666', width: '80px' }}>
                      {timeStr}
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: '600', color: '#1A1A1A', width: '60px' }}>
                      {hour.temp !== null ? `${hour.temp.toFixed(1)}°` : 'N/A'}
                    </div>
                    <div style={{ fontSize: '14px', color: '#0066CC', width: '80px' }}>
                      {hour.rain !== null && hour.rain > 0 ? `${hour.rain.toFixed(1)}mm` : 'No rain'}
                    </div>
                    <div style={{ fontSize: '14px', color: '#666666', width: '80px' }}>
                      {hour.wind !== null ? `${hour.wind.toFixed(0)} km/h` : 'N/A'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Extended history note */}
          {!hasExtendedHistory && (
            <div style={{
              backgroundColor: '#E8F4FD',
              border: '2px solid #0066CC',
              padding: '12px',
              marginTop: '16px',
              fontSize: '14px',
              color: '#1A1A1A'
            }}>
              <strong>Note:</strong> This location was recently added. Extended trends (7+ days) will be available after 48 hours of data collection.
            </div>
          )}
          
          {hasExtendedHistory && (
            <div style={{
              backgroundColor: '#E8F9E8',
              border: '2px solid #2D5F3F',
              padding: '12px',
              marginTop: '16px',
              fontSize: '14px',
              color: '#1A1A1A'
            }}>
              <strong>Extended history available:</strong> This location has been monitored for multiple days.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrendsModal;
