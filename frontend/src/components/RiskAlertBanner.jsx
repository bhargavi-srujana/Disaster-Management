import React from 'react';

const RiskAlertBanner = ({ risk }) => {
  if (!risk) return null;

  const getMessage = (level, factor) => {
    if (level === 'HIGH') {
      return 'SEVERE CONDITIONS DETECTED - TAKE PROTECTIVE ACTION';
    }
    if (level === 'MEDIUM') {
      return 'Weather conditions require monitoring';
    }
    return 'No immediate weather threat detected';
  };

  const riskColors = {
    HIGH: { bg: '#B71C1C', border: '#8B0000' },
    MEDIUM: { bg: '#C87F0A', border: '#8B5A00' },
    LOW: { bg: '#2D5F3F', border: '#1B3A26' }
  };

  const colors = riskColors[risk.risk_level] || riskColors.LOW;
  const showBanner = risk.risk_level === 'HIGH' || risk.risk_level === 'MEDIUM';

  if (!showBanner) {
    // Low risk: subtle status bar, not a banner
    return (
      <div style={{
        backgroundColor: '#E9E8E3',
        borderBottom: '2px solid #4A4A4A',
        padding: '12px 24px',
        fontSize: '13px',
        color: '#2B2B2B'
      }}>
        <span style={{ fontWeight: '700' }}>STATUS:</span> No immediate weather threat detected · Monitoring continues · All stations reporting
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: colors.bg,
      color: '#FFFFFF',
      borderTop: `6px solid ${colors.border}`,
      borderBottom: `6px solid ${colors.border}`,
      padding: '28px 32px 24px 28px',
      position: 'relative'
    }}>
      <div style={{
        fontSize: '13px',
        fontWeight: '700',
        letterSpacing: '2px',
        marginBottom: '8px',
        opacity: 0.9
      }}>
        ALERT STATUS
      </div>
      <div style={{
        fontSize: risk.risk_level === 'HIGH' ? '32px' : '26px',
        fontWeight: '700',
        letterSpacing: '0.5px',
        lineHeight: '1.2',
        marginBottom: '12px'
      }}>
        {getMessage(risk.risk_level, risk.primary_factor)}
      </div>
      <div style={{
        fontSize: '15px',
        opacity: 0.95,
        lineHeight: '1.4',
        marginBottom: '8px'
      }}>
        {risk.primary_factor || risk.primary_reason}
      </div>
      <div style={{
        fontSize: '12px',
        opacity: 0.8,
        marginTop: '12px',
        borderTop: '1px solid rgba(255,255,255,0.3)',
        paddingTop: '10px'
      }}>
        Situation assessed at {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })} · Updates ongoing
      </div>
    </div>
  );
};

export default RiskAlertBanner;
