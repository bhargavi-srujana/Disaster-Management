import React from 'react';

function HistoryChart24({ historyData }) {
  if (!historyData || historyData.length === 0) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '300px',
        fontSize: '13px',
        color: '#666'
      }}>
        NO HISTORICAL DATA AVAILABLE
      </div>
    );
  }

  // Get last 24 data points
  const data = historyData.slice(-24);
  
  // Extract temperature and rainfall data
  const temps = data.map(d => d.temperature);
  const rainfall = data.map(d => d.rainfall || 0);
  
  // Calculate scales
  const maxTemp = Math.max(...temps);
  const minTemp = Math.min(...temps);
  const maxRain = Math.max(...rainfall, 10); // At least 10mm scale
  
  const chartHeight = 240;
  const chartWidth = 100; // percentage
  const padding = { top: 20, bottom: 30, left: 40, right: 40 };
  
  // Scale functions
  const scaleY = (value, min, max) => {
    const range = max - min || 1;
    return chartHeight - ((value - min) / range) * chartHeight;
  };
  
  // Generate path for temperature line
  const tempPath = temps.map((temp, idx) => {
    const x = (idx / (data.length - 1)) * 100;
    const y = scaleY(temp, minTemp, maxTemp);
    return `${idx === 0 ? 'M' : 'L'} ${x}% ${y}`;
  }).join(' ');
  
  // Generate bars for rainfall
  const rainfallBars = rainfall.map((rain, idx) => {
    const x = (idx / (data.length - 1)) * 100;
    const height = (rain / maxRain) * chartHeight;
    return {
      x: `${x}%`,
      y: chartHeight - height,
      height: height,
      value: rain
    };
  });

  return (
    <div>
      {/* Legend */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '10px', fontSize: '11px', color: '#666' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '16px', height: '2px', backgroundColor: '#B71C1C' }}></div>
          <span>Temperature</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '16px', height: '10px', backgroundColor: '#4A90E2', opacity: 0.5 }}></div>
          <span>Rainfall</span>
        </div>
      </div>

      {/* Chart Container */}
      <div style={{
        position: 'relative',
        height: `${chartHeight + padding.top + padding.bottom}px`,
        backgroundColor: '#F7F6F2',
        border: '2px solid #4A4A4A',
        padding: `${padding.top}px ${padding.right}px ${padding.bottom}px ${padding.left}px`
      }}>
        {/* Grid lines */}
        <svg style={{
          position: 'absolute',
          top: padding.top,
          left: padding.left,
          right: padding.right,
          bottom: padding.bottom,
          width: `calc(100% - ${padding.left + padding.right}px)`,
          height: chartHeight
        }}>
          {/* Horizontal grid lines */}
          {[0, 25, 50, 75, 100].map(percent => (
            <line
              key={percent}
              x1="0%"
              y1={`${percent}%`}
              x2="100%"
              y2={`${percent}%`}
              stroke="#C9C8C3"
              strokeWidth="1"
              strokeDasharray="2,2"
            />
          ))}
          
          {/* Rainfall bars */}
          {rainfallBars.map((bar, idx) => (
            <rect
              key={`rain-${idx}`}
              x={bar.x}
              y={bar.y}
              width="2%"
              height={bar.height}
              fill="#4A90E2"
              opacity="0.5"
            />
          ))}
          
          {/* Temperature line */}
          <path
            d={tempPath}
            fill="none"
            stroke="#B71C1C"
            strokeWidth="3"
          />
          
          {/* Temperature points */}
          {temps.map((temp, idx) => {
            const x = (idx / (data.length - 1)) * 100;
            const y = scaleY(temp, minTemp, maxTemp);
            return (
              <circle
                key={`point-${idx}`}
                cx={`${x}%`}
                cy={y}
                r="3"
                fill="#B71C1C"
              />
            );
          })}
        </svg>
        
        {/* Y-axis labels - Temperature */}
        <div style={{
          position: 'absolute',
          left: 0,
          top: padding.top,
          bottom: padding.bottom,
          width: `${padding.left}px`,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          fontSize: '10px',
          fontFamily: 'monospace'
        }}>
          <div>{maxTemp.toFixed(1)}°</div>
          <div>{((maxTemp + minTemp) / 2).toFixed(1)}°</div>
          <div>{minTemp.toFixed(1)}°</div>
        </div>
        
        {/* Y-axis labels - Rainfall */}
        <div style={{
          position: 'absolute',
          right: 0,
          top: padding.top,
          bottom: padding.bottom,
          width: `${padding.right}px`,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          fontSize: '10px',
          fontFamily: 'monospace',
          textAlign: 'right'
        }}>
          <div>{maxRain.toFixed(0)}mm</div>
          <div>{(maxRain / 2).toFixed(0)}mm</div>
          <div>0mm</div>
        </div>
        
        {/* X-axis labels */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: padding.left,
          right: padding.right,
          height: `${padding.bottom}px`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '10px',
          fontFamily: 'monospace'
        }}>
          <div>{new Date(data[0].timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
          <div>24-HOUR PERIOD</div>
          <div>{new Date(data[data.length - 1].timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
      </div>

      {/* Data Summary */}
      <div style={{
        marginTop: '12px',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: '8px',
        fontSize: '11px'
      }}>
        <div style={{ padding: '8px', backgroundColor: '#E9E8E3', border: '1px solid #4A4A4A' }}>
          <div style={{ color: '#666' }}>AVG TEMP</div>
          <div style={{ fontSize: '14px', fontWeight: '700', fontFamily: 'monospace' }}>
            {(temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1)}°C
          </div>
        </div>
        <div style={{ padding: '8px', backgroundColor: '#E9E8E3', border: '1px solid #4A4A4A' }}>
          <div style={{ color: '#666' }}>TOTAL RAIN</div>
          <div style={{ fontSize: '14px', fontWeight: '700', fontFamily: 'monospace' }}>
            {rainfall.reduce((a, b) => a + b, 0).toFixed(1)}mm
          </div>
        </div>
        <div style={{ padding: '8px', backgroundColor: '#E9E8E3', border: '1px solid #4A4A4A' }}>
          <div style={{ color: '#666' }}>DATA POINTS</div>
          <div style={{ fontSize: '14px', fontWeight: '700', fontFamily: 'monospace' }}>
            {data.length}
          </div>
        </div>
      </div>
    </div>
  );
}

export default HistoryChart24;