import React from 'react';
import { TrendingUp, BarChart3, AlertCircle } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts';

const HistoryChart = ({ weather, history = [] }) => {
  // Transform real history data for charts
  const formatHistoryData = () => {
    if (!history || history.length === 0) {
      return [];
    }

    return history
      .slice()
      .reverse() // Show oldest to newest
      .map(item => {
        const timestamp = new Date(item.timestamp);
        return {
          time: timestamp.getHours().toString().padStart(2, '0') + ':00',
          temp: item.temp || 0,
          rain: item.rain_1h || 0,
          wind: item.wind_speed || 0,
          humidity: item.humidity || 0
        };
      });
  };

  const data = formatHistoryData();

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-xl">
          <p className="text-gray-300 text-sm font-medium mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value.toFixed(1)} {
                entry.name === 'Temperature' ? '°C' :
                entry.name === 'Rain' ? 'mm/h' :
                entry.name === 'Wind' ? 'km/h' : '%'
              }
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg font-semibold text-white">Weather History</h2>
        </div>
        <span className="text-xs text-gray-500 bg-gray-700/50 px-2 py-1 rounded">
          {data.length} data points
        </span>
      </div>

      {/* No Data Message */}
      {data.length <= 1 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="w-12 h-12 text-gray-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-300 mb-2">No Historical Data Yet</h3>
          <p className="text-gray-500 text-sm max-w-md">
            This is a new location. Historical data will be collected over time as the system monitors weather conditions.
            Check back in a few hours to see trends.
          </p>
        </div>
      ) : (
        <>
          {/* Temperature & Humidity Chart */}
          <div className="mb-8">
            <h3 className="text-sm text-gray-400 mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Temperature & Humidity
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="humidityGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="time" 
                    stroke="#6B7280" 
                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                    interval={3}
                  />
                  <YAxis 
                    stroke="#6B7280" 
                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    wrapperStyle={{ paddingTop: '20px' }}
                    formatter={(value) => <span className="text-gray-300">{value}</span>}
                  />
                  <Area
                    type="monotone"
                    dataKey="temp"
                    name="Temperature"
                    stroke="#EF4444"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#tempGradient)"
                  />
                  <Area
                    type="monotone"
                    dataKey="humidity"
                    name="Humidity"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#humidityGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Rainfall & Wind Chart */}
          <div>
            <h3 className="text-sm text-gray-400 mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Rainfall & Wind Speed
            </h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="time" 
                    stroke="#6B7280" 
                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                    interval={3}
                  />
                  <YAxis 
                    stroke="#6B7280" 
                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    wrapperStyle={{ paddingTop: '20px' }}
                    formatter={(value) => <span className="text-gray-300">{value}</span>}
                  />
                  <Bar dataKey="rain" name="Rain" fill="#06B6D4" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="wind" name="Wind" fill="#8B5CF6" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Info */}
          <div className="mt-4 text-xs text-gray-500 text-center">
            Showing real historical data collected by the monitoring system
          </div>
        </>
      )}
    </div>
  );
};

export default HistoryChart;
