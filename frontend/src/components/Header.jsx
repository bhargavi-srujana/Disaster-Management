import React from 'react';
import { RefreshCw, AlertTriangle, Bell, Shield, UserPlus } from 'lucide-react';

const Header = ({ highRiskCount, lastUpdated, onRefresh, onRegisterClick }) => {
  return (
    <header className="bg-gray-900/80 backdrop-blur-md border-b border-gray-700 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Disaster Alert System</h1>
              <p className="text-xs text-gray-400">Real-time Weather Monitoring</p>
            </div>
          </div>

          {/* Status & Actions */}
          <div className="flex items-center gap-4">
            {/* High Risk Badge */}
            {highRiskCount > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-red-900/50 border border-red-500 rounded-full animate-pulse">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span className="text-red-400 text-sm font-medium">
                  {highRiskCount} High Risk {highRiskCount === 1 ? 'Area' : 'Areas'}
                </span>
              </div>
            )}

            {/* Notification Bell */}
            <button className="relative p-2 text-gray-400 hover:text-white transition-colors">
              <Bell className="w-5 h-5" />
              {highRiskCount > 0 && (
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>

            {/* Register Button */}
            <button
              onClick={onRegisterClick}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Register for Alerts</span>
            </button>

            {/* Last Updated */}
            {lastUpdated && (
              <div className="hidden sm:block text-xs text-gray-500">
                Updated: {lastUpdated.toLocaleTimeString()}
              </div>
            )}

            {/* Refresh Button */}
            <button
              onClick={onRefresh}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
