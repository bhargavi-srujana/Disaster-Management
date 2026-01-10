import React from 'react';

const LoadingSpinner = ({ message = 'Checking conditions...' }) => {
  return (
    <div style={{
      backgroundColor: '#FFFFFF',
      border: '2px solid #D0D0D0',
      padding: '40px',
      textAlign: 'center',
      marginBottom: '24px'
    }}>
      <div style={{
        display: 'inline-block',
        width: '40px',
        height: '40px',
        border: '4px solid #E0E0E0',
        borderTopColor: '#0066CC',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        marginBottom: '16px'
      }} />
      <style>
        {`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}
      </style>
      <div style={{
        fontSize: '16px',
        color: '#666666',
        fontWeight: '600'
      }}>
        {message}
      </div>
    </div>
  );
};

export default LoadingSpinner;
