import React from 'react';
import { AlertTriangle, CheckCircle, AlertCircle, HelpCircle, Clock, TrendingUp } from 'lucide-react';

const Dashboard = ({ risk, weather }) => {
  if (!risk) return null;

  const getRiskConfig = (level) => {
    switch (level) {
      case 'HIGH':
        return {
          color: 'red',
          bgColor: 'bg-red-900/30',
          borderColor: 'border-red-500',
          textColor: 'text-red-400',
          icon: AlertTriangle,
          gradient: 'from-red-500 to-orange-500'
        };
      case 'MEDIUM':
        return {
          color: 'yellow',
          bgColor: 'bg-yellow-900/30',
          borderColor: 'border-yellow-500',
          textColor: 'text-yellow-400',
          icon: AlertCircle,
          gradient: 'from-yellow-500 to-orange-400'
        };
      case 'LOW':
        return {
          color: 'green',
          bgColor: 'bg-green-900/30',
          borderColor: 'border-green-500',
          textColor: 'text-green-400',
          icon: CheckCircle,
          gradient: 'from-green-500 to-emerald-500'
        };
      default:
        return {
          color: 'gray',
          bgColor: 'bg-gray-800/30',
          borderColor: 'border-gray-500',
          textColor: 'text-gray-400',
          icon: HelpCircle,
          gradient: 'from-gray-500 to-gray-600'
        };
    }
  };

  const config = getRiskConfig(risk.risk_level);
  const Icon = config.icon;
  const confidencePercent = Math.round((risk.confidence_score || 0) * 100);

  return (
    <div className={`${config.bgColor} backdrop-blur-sm rounded-xl p-6 border ${config.borderColor} h-full`}>
      {/* Risk Level Header */}
      <div className="text-center mb-6">
        <div className={`inline-flex p-4 rounded-full bg-gradient-to-br ${config.gradient} mb-3`}>
          <Icon className="w-8 h-8 text-white" />
        </div>
        <h2 className={`text-3xl font-bold ${config.textColor}`}>
          {risk.risk_level}
        </h2>
        <p className="text-gray-400 text-sm mt-1">Risk Level</p>
      </div>

      {/* Disaster Type */}
      {risk.disaster_type && risk.disaster_type !== 'NONE' && (
        <div className="bg-gray-800/50 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">
              {risk.disaster_type === 'FLOOD' && '🌊'}
              {risk.disaster_type === 'CYCLONE' && '🌀'}
              {risk.disaster_type === 'HEATWAVE' && '🔥'}
              {risk.disaster_type === 'HEAVY_RAIN' && '🌧️'}
            </span>
            <span className={`font-bold ${config.textColor}`}>
              {risk.disaster_type.replace('_', ' ')}
            </span>
          </div>
          <p className="text-gray-300 text-sm">{risk.reason}</p>
        </div>
      )}

      {/* Stats */}
      <div className="space-y-4">
        {/* Confidence Score */}
        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Confidence
            </span>
            <span className={`font-bold ${config.textColor}`}>{confidencePercent}%</span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className={`h-full bg-gradient-to-r ${config.gradient} transition-all duration-500`}
              style={{ width: `${confidencePercent}%` }}
            />
          </div>
        </div>

        {/* Persistence Duration */}
        {risk.persistence_duration_hrs > 0 && (
          <div className="bg-gray-800/50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Duration
              </span>
              <span className={`font-bold ${config.textColor}`}>
                {risk.persistence_duration_hrs.toFixed(1)}h
              </span>
            </div>
          </div>
        )}

        {/* Timestamp */}
        <div className="text-center text-xs text-gray-500 mt-4">
          Last assessed: {new Date(risk.timestamp).toLocaleString()}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
