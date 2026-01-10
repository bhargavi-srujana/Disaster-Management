import React from 'react';

function CitizenStatusBox({ risk }) {
  const getStatus = () => {
    if (!risk) {
      return {
        safe: true,
        message: 'Checking current conditions...',
        detail: 'Please wait a moment.',
        color: '#4A4A4A',
        icon: '○'
      };
    }

    if (risk.risk_level === 'HIGH') {
      return {
        safe: false,
        message: 'DANGEROUS CONDITIONS IN YOUR AREA',
        detail: 'Heavy rain or flooding possible. Stay indoors if you can. Avoid travel.',
        color: '#B71C1C',
        icon: '⚠'
      };
    }

    if (risk.risk_level === 'MEDIUM') {
      return {
        safe: false,
        message: 'Weather warning in your area',
        detail: 'Conditions may become difficult. Be prepared and stay alert.',
        color: '#C87F0A',
        icon: '▲'
      };
    }

    return {
      safe: true,
      message: 'Your area is safe right now',
      detail: 'No immediate danger reported. Weather conditions are normal.',
      color: '#2D5F3F',
      icon: '●'
    };
  };

  const status = getStatus();

  return (
    <div style={{
      backgroundColor: status.safe ? '#F0F7F4' : (status.color === '#B71C1C' ? '#FFE8E8' : '#FFF4E5'),
      border: `4px solid ${status.color}`,
      padding: '28px 24px',
      marginBottom: '24px'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '16px'
      }}>
        <div style={{
          fontSize: '40px',
          lineHeight: '1',
          color: status.color
        }}>
          {status.icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: '24px',
            fontWeight: '700',
            color: '#1A1A1A',
            marginBottom: '12px',
            lineHeight: '1.3'
          }}>
            {status.message}
          </div>
          <div style={{
            fontSize: '16px',
            color: '#2B2B2B',
            lineHeight: '1.5'
          }}>
            {status.detail}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CitizenStatusBox;
