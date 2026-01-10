import React from 'react';

function PlainWeatherInfo({ weather }) {
  if (!weather) return null;

  const getTemp = (temp) => {
    if (temp < 15) return `It is cold (${Math.round(temp)} degrees)`;
    if (temp < 25) return `It is pleasant (${Math.round(temp)} degrees)`;
    if (temp < 35) return `It is warm (${Math.round(temp)} degrees)`;
    return `It is very hot (${Math.round(temp)} degrees)`;
  };

  const getRain = (rain) => {
    if (!rain || rain < 0.1) return 'No rain';
    if (rain < 2) return 'Light rain';
    if (rain < 10) return 'Moderate rain';
    return 'Heavy rain';
  };

  const getWind = (speed) => {
    if (speed < 10) return 'Calm wind';
    if (speed < 30) return 'Light wind';
    if (speed < 50) return 'Strong wind';
    return 'Very strong wind';
  };

  const temp = weather.temperature || weather.temp;
  const rain = weather.rainfall || weather.rain_1h || 0;
  const wind = weather.wind_speed;

  return (
    <div style={{
      backgroundColor: '#FFFFFF',
      border: '2px solid #D0D0D0',
      padding: '20px',
      marginBottom: '24px'
    }}>
      <div style={{
        fontSize: '14px',
        fontWeight: '700',
        color: '#666',
        marginBottom: '14px',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }}>
        Right now:
      </div>
      
      <div style={{
        fontSize: '18px',
        color: '#1A1A1A',
        lineHeight: '1.7'
      }}>
        <div>{getTemp(temp)}</div>
        <div>{getRain(rain)}</div>
        <div>{getWind(wind)}</div>
      </div>
    </div>
  );
}

export default PlainWeatherInfo;
