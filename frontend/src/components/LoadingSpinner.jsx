import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingSpinner = () => {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="relative">
        {/* Outer ring */}
        <div className="w-16 h-16 border-4 border-blue-500/20 rounded-full"></div>
        {/* Spinning ring */}
        <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-blue-500 rounded-full animate-spin"></div>
        {/* Center icon */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
        </div>
      </div>
      <p className="mt-4 text-gray-400 animate-pulse">Fetching weather data...</p>
    </div>
  );
};

export default LoadingSpinner;
