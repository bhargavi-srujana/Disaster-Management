import React from 'react';

function SimpleLocationChanger({ selectedLocation, onLocationChange }) {
  const [input, setInput] = React.useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      onLocationChange(input.trim());
      setInput('');
    }
  };

  return (
    <div style={{
      backgroundColor: '#F7F7F7',
      padding: '20px',
      marginBottom: '24px',
      border: '1px solid #D0D0D0'
    }}>
      <div style={{
        fontSize: '14px',
        fontWeight: '600',
        marginBottom: '10px',
        color: '#2B2B2B'
      }}>
        Check a different area:
      </div>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type city name"
          style={{
            flex: 1,
            padding: '14px 16px',
            fontSize: '16px',
            border: '2px solid #4A4A4A',
            backgroundColor: '#FFFFFF',
            outline: 'none'
          }}
        />
        <button
          type="submit"
          style={{
            padding: '14px 28px',
            fontSize: '16px',
            fontWeight: '700',
            backgroundColor: '#2B2B2B',
            color: '#FFFFFF',
            border: '2px solid #000000',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}
        >
          Check
        </button>
      </form>
    </div>
  );
}

export default SimpleLocationChanger;
