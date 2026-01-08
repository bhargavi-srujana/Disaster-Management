import React from 'react';
import { 
  Thermometer, 
  Wind, 
  Droplets, 
  Cloud, 
  CloudRain,
  MapPin,
  Sun,
  CloudSun,
  CloudFog
} from 'lucide-react';

const WeatherCard = ({ weather, location, risk }) => {
  if (!weather) return null;

  const getWeatherIcon = () => {
    if (weather.rain_1h > 10) return <CloudRain className="w-16 h-16 text-blue-400" />;
    if (weather.clouds > 70) return <Cloud className="w-16 h-16 text-gray-400" />;
    if (weather.clouds > 30) return <CloudSun className="w-16 h-16 text-yellow-300" />;
    if (weather.humidity > 80) return <CloudFog className="w-16 h-16 text-gray-300" />;
    return <Sun className="w-16 h-16 text-yellow-400" />;
  };

  const getWeatherCondition = () => {
    if (weather.rain_1h > 50) return 'Heavy Rain';
    if (weather.rain_1h > 10) return 'Rainy';
    if (weather.rain_1h > 0) return 'Light Rain';
    if (weather.clouds > 70) return 'Cloudy';
    if (weather.clouds > 30) return 'Partly Cloudy';
    return 'Clear Sky';
  };

  const stats = [
    {
      icon: Thermometer,
      label: 'Temperature',
      value: `${weather.temp}°C`,
      color: weather.temp > 35 ? 'text-red-400' : weather.temp < 15 ? 'text-blue-400' : 'text-green-400',
      bgColor: weather.temp > 35 ? 'bg-red-500/20' : weather.temp < 15 ? 'bg-blue-500/20' : 'bg-green-500/20'
    },
    {
      icon: Wind,
      label: 'Wind Speed',
      value: `${weather.wind_speed} km/h`,
      color: weather.wind_speed > 50 ? 'text-orange-400' : 'text-cyan-400',
      bgColor: weather.wind_speed > 50 ? 'bg-orange-500/20' : 'bg-cyan-500/20'
    },
    {
      icon: Droplets,
      label: 'Humidity',
      value: `${weather.humidity}%`,
      color: weather.humidity > 80 ? 'text-blue-400' : 'text-teal-400',
      bgColor: weather.humidity > 80 ? 'bg-blue-500/20' : 'bg-teal-500/20'
    },
    {
      icon: CloudRain,
      label: 'Rainfall',
      value: `${weather.rain_1h} mm/h`,
      color: weather.rain_1h > 30 ? 'text-red-400' : weather.rain_1h > 0 ? 'text-blue-400' : 'text-gray-400',
      bgColor: weather.rain_1h > 30 ? 'bg-red-500/20' : weather.rain_1h > 0 ? 'bg-blue-500/20' : 'bg-gray-500/20'
    },
    {
      icon: Cloud,
      label: 'Cloud Cover',
      value: `${weather.clouds}%`,
      color: 'text-gray-300',
      bgColor: 'bg-gray-500/20'
    }
  ];

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 overflow-hidden">
      {/* Header with Location */}
      <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 p-6 border-b border-gray-700">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-gray-400 mb-1">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">Current Weather</span>
            </div>
            <h2 className="text-3xl font-bold text-white capitalize">
              {location.replace('_', ' ')}
            </h2>
            <p className="text-gray-400 mt-1">{getWeatherCondition()}</p>
          </div>
          <div className="text-right">
            {getWeatherIcon()}
          </div>
        </div>
      </div>

      {/* Main Temperature Display */}
      <div className="p-6 text-center border-b border-gray-700">
        <div className="text-6xl font-bold text-white mb-2">
          {weather.temp}
          <span className="text-3xl text-gray-400">°C</span>
        </div>
        <p className="text-gray-400">
          Feels like {Math.round(weather.temp - (weather.wind_speed * 0.1))}°C
        </p>
      </div>

      {/* Weather Stats Grid */}
      <div className="p-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {stats.map((stat, index) => (
            <div 
              key={index}
              className={`${stat.bgColor} rounded-lg p-4 text-center transition-transform hover:scale-105`}
            >
              <stat.icon className={`w-6 h-6 ${stat.color} mx-auto mb-2`} />
              <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-gray-400 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Thresholds Info */}
      <div className="px-6 pb-6">
        <div className="bg-gray-900/50 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-300 mb-3">Alert Thresholds</h4>
          <div className="grid grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-gray-500">Flood Rain:</span>
              <span className="text-red-400 ml-1">&gt;50 mm/h</span>
            </div>
            <div>
              <span className="text-gray-500">Cyclone Wind:</span>
              <span className="text-orange-400 ml-1">&gt;70 km/h</span>
            </div>
            <div>
              <span className="text-gray-500">Heatwave:</span>
              <span className="text-yellow-400 ml-1">&gt;40°C</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherCard;
