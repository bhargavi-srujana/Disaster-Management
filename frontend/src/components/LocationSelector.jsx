import React, { useState } from 'react';

const LocationSelector = ({ selectedLocation, onLocationChange }) => {
  const [customLocation, setCustomLocation] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (customLocation.trim()) {
      onLocationChange(customLocation.trim());
      setCustomLocation('');
    }
  };

  return (
    <div style={{ border: '1px solid #4A4A4A', backgroundColor: '#F7F6F2' }}>
      <div style={{
        padding: '12px 14px',
        borderBottom: '1px solid #C9C8C3'
      }}>
        <div style={{
          fontSize: '11px',
          fontWeight: '700',
          color: '#666',
          marginBottom: '6px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          Change location
        </div>
        <div style={{ fontSize: '14px', fontWeight: '700', color: '#2B2B2B', marginBottom: '10px' }}>
          Currently viewing: {selectedLocation}
        </div>

        {/* Location Input - Compact */}
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', gap: '6px' }}>
            <input
              type="text"
              value={customLocation}
              onChange={(e) => setCustomLocation(e.target.value)}
              placeholder="Enter location..."
              style={{
                flex: 1,
                padding: '8px 10px',
                fontSize: '13px',
                border: '1px solid #4A4A4A',
                backgroundColor: '#FFFFFF'
              }}
            />
            <button
              type="submit"
              style={{
                padding: '8px 16px',
                fontSize: '12px',
                fontWeight: '700',
                border: '1px solid #000000',
                backgroundColor: '#2B2B2B',
                color: '#F7F6F2',
                cursor: 'pointer'
              }}
            >
              GO
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LocationSelector;
