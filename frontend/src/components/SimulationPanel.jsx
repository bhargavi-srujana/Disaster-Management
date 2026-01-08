import React from 'react';
import { Beaker, Zap, Play, Square } from 'lucide-react';

const SimulationPanel = ({ currentSimulation, onSimulate }) => {
  const scenarios = [
    {
      id: 'flood',
      name: 'Flood Scenario',
      description: 'Heavy rainfall (60mm/h)',
      icon: '🌊',
      color: 'blue'
    },
    {
      id: 'normal',
      name: 'Normal Weather',
      description: 'Clear conditions',
      icon: '☀️',
      color: 'green'
    }
  ];

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 h-full">
      <div className="flex items-center gap-2 mb-4">
        <Beaker className="w-5 h-5 text-purple-400" />
        <h2 className="text-lg font-semibold text-white">Simulation Mode</h2>
      </div>

      <p className="text-gray-400 text-sm mb-4">
        Test the system's response to different disaster scenarios.
      </p>

      {/* Scenario Buttons */}
      <div className="space-y-3">
        {scenarios.map(scenario => (
          <button
            key={scenario.id}
            onClick={() => onSimulate(currentSimulation === scenario.id ? null : scenario.id)}
            className={`w-full p-3 rounded-lg border transition-all duration-200 flex items-center gap-3 ${
              currentSimulation === scenario.id
                ? 'border-purple-500 bg-purple-900/30 shadow-lg shadow-purple-500/20'
                : 'border-gray-600 bg-gray-700/30 hover:border-gray-500 hover:bg-gray-700/50'
            }`}
          >
            <span className="text-2xl">{scenario.icon}</span>
            <div className="text-left flex-1">
              <h3 className="font-medium text-white">{scenario.name}</h3>
              <p className="text-xs text-gray-400">{scenario.description}</p>
            </div>
            {currentSimulation === scenario.id ? (
              <Square className="w-5 h-5 text-purple-400" />
            ) : (
              <Play className="w-5 h-5 text-gray-500" />
            )}
          </button>
        ))}
      </div>

      {/* Active Simulation Indicator */}
      {currentSimulation && (
        <div className="mt-4 p-3 bg-purple-900/30 border border-purple-500 rounded-lg">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-purple-400 animate-pulse" />
            <span className="text-purple-300 text-sm font-medium">
              Simulation Active
            </span>
          </div>
          <p className="text-gray-400 text-xs mt-1">
            Data is simulated. Click scenario again to stop.
          </p>
        </div>
      )}

      {/* Info */}
      <div className="mt-4 text-xs text-gray-500">
        <p>💡 Simulations trigger the full risk engine including email alerts (if configured).</p>
      </div>
    </div>
  );
};

export default SimulationPanel;
