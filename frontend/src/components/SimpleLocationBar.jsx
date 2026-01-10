import React from 'react';

function SimpleLocationBar({ location, lastUpdated }) {
  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getNextUpdate = (date) => {
    const next = new Date(date.getTime() + 10 * 60000);
    return formatTime(next);
  };

  return (
    <div style={{
      padding: '16px 0',
      marginBottom: '24px',
      fontSize: '15px',
      color: '#4A4A4A',
      lineHeight: '1.8'
    }}>
      <div><strong>Monitoring:</strong> {location}</div>
      {lastUpdated && (
        <>
          <div><strong>Last checked:</strong> {formatTime(lastUpdated)}</div>
          <div><strong>Next update around:</strong> {getNextUpdate(lastUpdated)}</div>
        </>
      )}
    </div>
  );
}

export default SimpleLocationBar;
