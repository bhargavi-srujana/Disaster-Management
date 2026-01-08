import React, { useState } from 'react';
import { Search, MapPin } from 'lucide-react';

const LocationSearch = ({ selectedLocation, onLocationChange, cities }) => {
  const [searchValue, setSearchValue] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchValue.trim()) {
      onLocationChange(searchValue.trim());
      setSearchValue('');
    }
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="w-5 h-5 text-blue-400" />
        <h2 className="text-lg font-semibold text-white">Select Location</h2>
      </div>

      {/* Search Input */}
      <form onSubmit={handleSearch} className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search for any city and press Enter..."
          value={searchValue}
          className="w-full pl-10 pr-24 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
          onChange={(e) => setSearchValue(e.target.value)}
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
        >
          Search
        </button>
      </form>

      {/* Current Selection */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-gray-400 text-sm">Currently monitoring:</span>
          <span className="text-white font-semibold">{selectedLocation}</span>
        </div>
      </div>
    </div>
  );
};

export default LocationSearch;
