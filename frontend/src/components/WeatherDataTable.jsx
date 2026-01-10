import React from 'react';

const WeatherDataTable = ({ weather, location }) => {
  if (!weather) return null;

  const weatherParams = [
    { label: 'Temperature', value: weather.temperature || weather.temp, unit: '°C' },
    { label: 'Humidity', value: weather.humidity, unit: '%' },
    { label: 'Wind speed', value: weather.wind_speed, unit: 'km/h' },
    { label: 'Rainfall', value: weather.rainfall || weather.rain_1h, unit: 'mm' },
    { label: 'Cloud cover', value: weather.cloud_cover || weather.clouds, unit: '%' }
  ];

  return (
    <div style={{ border: '2px solid #4A4A4A', backgroundColor: '#F7F6F2' }}>
      {/* Header */}
      <div style={{
        backgroundColor: '#2B2B2B',
        color: '#F7F6F2',
        padding: '14px 18px',
        borderBottom: '2px solid #4A4A4A'
      }}>
        <div style={{
          fontSize: '11px',
          letterSpacing: '1.5px',
          fontWeight: '700',
          marginBottom: '4px',
          opacity: 0.8
        }}>
          CURRENT CONDITIONS
        </div>
        <div style={{
          fontSize: '16px',
          fontWeight: '700'
        }}>
          {location}
        </div>
      </div>

      {/* Table - Less decorative */}
      <div style={{ padding: '18px 20px' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse'
        }}>
          <tbody>
            {weatherParams.map((param, index) => (
              <tr
                key={param.label}
                style={{
                  borderBottom: index < weatherParams.length - 1 ? '1px solid #C9C8C3' : 'none'
                }}
              >
                <td style={{
                  padding: '11px 0',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#4A4A4A',
                  width: '40%'
                }}>
                  {param.label}
                </td>
                <td style={{
                  padding: '11px 0',
                  textAlign: 'right',
                  fontSize: '22px',
                  fontWeight: '700',
                  fontFamily: 'monospace',
                  letterSpacing: '-0.5px'
                }}>
                  {param.value?.toFixed(1)}
                </td>
                <td style={{
                  padding: '11px 0 11px 8px',
                  fontSize: '13px',
                  color: '#666',
                  width: '15%'
                }}>
                  {param.unit}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WeatherDataTable;
