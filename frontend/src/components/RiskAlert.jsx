import React from 'react';
import { AlertTriangle, X, Shield, Phone, Radio } from 'lucide-react';

const RiskAlert = ({ risk, location }) => {
  const [isVisible, setIsVisible] = React.useState(true);

  if (!isVisible || !risk || risk.risk_level === 'LOW') return null;

  const isHigh = risk.risk_level === 'HIGH';
  
  const getDisasterEmoji = () => {
    switch (risk.disaster_type) {
      case 'FLOOD': return '🌊';
      case 'CYCLONE': return '🌀';
      case 'HEATWAVE': return '🔥';
      case 'HEAVY_RAIN': return '🌧️';
      default: return '⚠️';
    }
  };

  const getSafetyTips = () => {
    switch (risk.disaster_type) {
      case 'FLOOD':
        return [
          'Move to higher ground immediately',
          'Avoid walking or driving through flood waters',
          'Stay away from streams and drainage channels',
          'Keep emergency supplies ready'
        ];
      case 'CYCLONE':
        return [
          'Stay indoors and away from windows',
          'Secure loose objects outside',
          'Keep emergency supplies ready',
          'Listen to official weather updates'
        ];
      case 'HEATWAVE':
        return [
          'Stay indoors during peak hours (11am-3pm)',
          'Drink plenty of water',
          'Avoid strenuous activities',
          'Check on elderly neighbors'
        ];
      case 'HEAVY_RAIN':
        return [
          'Avoid unnecessary travel',
          'Stay away from low-lying areas',
          'Keep drains clear',
          'Monitor water levels'
        ];
      default:
        return ['Stay alert and follow local advisories'];
    }
  };

  return (
    <div className={`mb-6 rounded-xl overflow-hidden ${
      isHigh 
        ? 'bg-red-900/40 border-2 border-red-500 animate-glow-red' 
        : 'bg-yellow-900/40 border-2 border-yellow-500'
    }`}>
      {/* Alert Header */}
      <div className={`px-6 py-4 ${isHigh ? 'bg-red-900/50' : 'bg-yellow-900/50'} flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${isHigh ? 'bg-red-500' : 'bg-yellow-500'} animate-pulse`}>
            <AlertTriangle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className={`text-xl font-bold ${isHigh ? 'text-red-400' : 'text-yellow-400'}`}>
              {getDisasterEmoji()} {isHigh ? 'EMERGENCY ALERT' : 'WEATHER WARNING'}
            </h3>
            <p className="text-gray-300 text-sm">
              {risk.disaster_type?.replace('_', ' ')} risk detected in {location}
            </p>
          </div>
        </div>
        <button 
          onClick={() => setIsVisible(false)}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* Alert Content */}
      <div className="p-6">
        {/* Risk Details */}
        <div className="bg-black/30 rounded-lg p-4 mb-4">
          <p className={`text-lg ${isHigh ? 'text-red-300' : 'text-yellow-300'}`}>
            {risk.reason}
          </p>
          <div className="flex gap-4 mt-3 text-sm text-gray-400">
            <span>Confidence: {Math.round(risk.confidence_score * 100)}%</span>
            {risk.persistence_duration_hrs > 0 && (
              <span>Duration: {risk.persistence_duration_hrs.toFixed(1)} hours</span>
            )}
          </div>
        </div>

        {/* Safety Tips */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-black/20 rounded-lg p-4">
            <h4 className="flex items-center gap-2 text-white font-semibold mb-3">
              <Shield className="w-5 h-5 text-blue-400" />
              Safety Tips
            </h4>
            <ul className="space-y-2">
              {getSafetyTips().map((tip, index) => (
                <li key={index} className="text-gray-300 text-sm flex items-start gap-2">
                  <span className="text-blue-400">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-black/20 rounded-lg p-4">
            <h4 className="flex items-center gap-2 text-white font-semibold mb-3">
              <Phone className="w-5 h-5 text-green-400" />
              Emergency Contacts
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-300">
                <span>National Emergency</span>
                <span className="text-green-400 font-mono">112</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Disaster Management</span>
                <span className="text-green-400 font-mono">1070</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Fire Services</span>
                <span className="text-green-400 font-mono">101</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Police</span>
                <span className="text-green-400 font-mono">100</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mt-4">
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
            <Radio className="w-4 h-4" />
            Get Live Updates
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors">
            <Phone className="w-4 h-4" />
            Emergency Services
          </button>
        </div>
      </div>
    </div>
  );
};

export default RiskAlert;
