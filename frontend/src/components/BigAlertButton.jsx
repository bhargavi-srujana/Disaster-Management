import React from 'react';

function BigAlertButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        padding: '20px',
        fontSize: '18px',
        fontWeight: '700',
        backgroundColor: '#0066CC',
        color: '#FFFFFF',
        border: '3px solid #004999',
        cursor: 'pointer',
        boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
        marginBottom: '24px',
        transition: 'transform 0.1s'
      }}
      onMouseDown={(e) => e.currentTarget.style.transform = 'translateY(2px)'}
      onMouseUp={(e) => e.currentTarget.style.transform = 'translateY(0)'}
      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
    >
      Get weather alerts on your phone
    </button>
  );
}

export default BigAlertButton;
