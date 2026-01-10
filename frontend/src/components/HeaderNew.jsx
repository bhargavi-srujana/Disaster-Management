import React from 'react';

const Header = ({ highRiskCount, lastUpdated, onRefresh, onRegisterClick }) => {
  return (
    <header style={{
      backgroundColor: '#2B2B2B',
      color: '#F7F6F2',
      borderBottom: '3px solid #000000',
      padding: '12px 0'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          
          {/* Logo & Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              backgroundColor: '#B71C1C',
              border: '2px solid #F7F6F2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{ fontSize: '20px', fontWeight: '700', color: '#FFFFFF' }}>⚠</span>
            </div>
            <div>
              <h1 style={{ fontSize: '18px', margin: 0, letterSpacing: '1px' }}>
                DISASTER ALERT SYSTEM
              </h1>
              <p style={{ 
                fontSize: '11px', 
                margin: 0, 
                color: '#C9C8C3',
                textTransform: 'none',
                letterSpacing: '0.5px'
              }}>
                Real-time Weather Monitoring
              </p>
            </div>
          </div>

          {/* Right Section */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            
            {/* High Risk Badge */}
            {highRiskCount > 0 && (
              <div style={{
                backgroundColor: '#B71C1C',
                border: '2px solid #FFFFFF',
                padding: '6px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ fontSize: '18px' }}>⚠</span>
                <span style={{ fontSize: '14px', fontWeight: '700', textTransform: 'uppercase' }}>
                  {highRiskCount} HIGH RISK {highRiskCount === 1 ? 'AREA' : 'AREAS'}
                </span>
              </div>
            )}

            {/* Last Updated */}
            {lastUpdated && (
              <div style={{ 
                fontSize: '11px', 
                color: '#C9C8C3',
                textAlign: 'right',
                textTransform: 'none'
              }}>
                <div>Last updated {lastUpdated.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false
                })} · Next check {new Date(lastUpdated.getTime() + 10 * 60000).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false
                })}</div>
              </div>
            )}

            {/* Register Button */}
            <button
              onClick={onRegisterClick}
              style={{
                backgroundColor: '#C87F0A',
                color: '#FFFFFF',
                border: '2px solid #FFFFFF',
                fontSize: '12px',
                padding: '8px 12px',
                cursor: 'pointer',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
            >
              REGISTER FOR ALERTS
            </button>

            {/* Refresh Button */}
            <button
              onClick={onRefresh}
              style={{
                backgroundColor: '#E9E8E3',
                color: '#2B2B2B',
                border: '2px solid #F7F6F2',
                fontSize: '12px',
                padding: '8px 12px',
                cursor: 'pointer',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
            >
              ↻ REFRESH
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
