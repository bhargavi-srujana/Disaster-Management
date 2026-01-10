import React from 'react';

const RiskAssessmentPanel = ({ risk }) => {
  if (!risk) {
    return (
      <div style={{ padding: '20px', backgroundColor: '#E9E8E3', border: '2px solid #4A4A4A' }}>
        <div style={{ color: '#666', fontSize: '13px' }}>Assessing conditions...</div>
      </div>
    );
  }

  const riskColors = {
    HIGH: '#B71C1C',
    MEDIUM: '#C87F0A',
    LOW: '#2D5F3F'
  };

  const getMessage = (level) => {
    if (level === 'HIGH') return 'SEVERE CONDITIONS DETECTED';
    if (level === 'MEDIUM') return 'CONDITIONS REQUIRE MONITORING';
    return 'Conditions normal';
  };

  const bgColor = riskColors[risk.risk_level] || '#666';
  const isElevated = risk.risk_level === 'HIGH' || risk.risk_level === 'MEDIUM';

  if (!isElevated) return null;

  const primaryFactor = risk.primary_factor || risk.primary_reason;
  const factors = risk.contributing_factors || risk.reasons || [];

  return (
    <div style={{
      border: '3px solid ' + bgColor,
      backgroundColor: '#F7F6F2'
    }}>
      {/* Status Header - Commanding */}
      <div style={{
        backgroundColor: bgColor,
        color: '#FFFFFF',
        padding: '20px 24px',
        borderBottom: '3px solid ' + (risk.risk_level === 'HIGH' ? '#8B0000' : '#8B5A00')
      }}>
        <div style={{
          fontSize: '11px',
          fontWeight: '700',
          letterSpacing: '2px',
          marginBottom: '6px',
          opacity: 0.9
        }}>
          RISK ASSESSMENT
        </div>
        <div style={{
          fontSize: '22px',
          fontWeight: '700',
          letterSpacing: '0.5px',
          lineHeight: '1.2'
        }}>
          {getMessage(risk.risk_level)}
        </div>
      </div>

      {/* Details - Operational Language */}
      <div style={{ padding: '20px 24px 24px' }}>
        <div style={{
          fontSize: '15px',
          fontWeight: '700',
          color: '#2B2B2B',
          marginBottom: '14px',
          lineHeight: '1.4'
        }}>
          {primaryFactor}
        </div>

        {factors.length > 0 && (
          <div style={{
            fontSize: '13px',
            color: '#4A4A4A',
            lineHeight: '1.6',
            marginBottom: '16px',
            paddingLeft: '16px',
            borderLeft: '2px solid #C9C8C3'
          }}>
            {factors.map((factor, idx) => (
              <div key={idx} style={{ marginBottom: '6px' }}>• {factor}</div>
            ))}
          </div>
        )}

        <div style={{
          fontSize: '12px',
          color: '#666',
          paddingTop: '12px',
          borderTop: '1px solid #C9C8C3'
        }}>
          {risk.duration || risk.persistence_hours ? 
            `Conditions expected to persist: ${risk.duration || risk.persistence_hours + ' hours'}` : 
            'Monitoring ongoing'}
        </div>
      </div>
    </div>
  );
};

export default RiskAssessmentPanel;
