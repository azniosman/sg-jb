/**
 * Schematic Map Component
 * Custom SVG visualization of SG-JB routes
 */
import React from 'react';

const SchematicMap = ({ selectedRoute, congestionLevel, direction }) => {
  // Get route color based on congestion level
  const getRouteColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'low': return '#10b981'; // green-500
      case 'moderate': return '#eab308'; // yellow-500
      case 'high': return '#f97316'; // orange-500
      case 'severe': return '#ef4444'; // red-500
      default: return '#94a3b8'; // slate-400
    }
  };

  const routeColor = getRouteColor(congestionLevel);
  const isWoodlands = selectedRoute === 'woodlands';
  const isTuas = selectedRoute === 'tuas';

  return (
    <div className="w-full h-[450px] bg-gradient-to-br from-blue-50 via-indigo-50/30 to-slate-50 rounded-2xl border border-slate-200 p-8 shadow-soft hover:shadow-medium transition-all duration-300">
      <svg viewBox="0 0 800 400" className="w-full h-full drop-shadow-sm">
        {/* Water (Straits of Johor) */}
        <rect x="0" y="150" width="800" height="100" fill="#bfdbfe" opacity="0.5" />
        <text x="400" y="205" textAnchor="middle" fill="#60a5fa" fontSize="14" fontWeight="500">
          Straits of Johor
        </text>

        {/* Singapore (Bottom) */}
        <path
          d="M 50 300 Q 400 280 750 300 L 750 380 L 50 380 Z"
          fill="#f1f5f9"
          stroke="#cbd5e1"
          strokeWidth="2"
        />
        <text x="400" y="350" textAnchor="middle" fill="#334155" fontSize="20" fontWeight="700">
          🇸🇬 SINGAPORE
        </text>

        {/* Johor Bahru (Top) */}
        <path
          d="M 50 100 Q 400 120 750 100 L 750 20 L 50 20 Z"
          fill="#f1f5f9"
          stroke="#cbd5e1"
          strokeWidth="2"
        />
        <text x="400" y="70" textAnchor="middle" fill="#334155" fontSize="20" fontWeight="700">
          🇲🇾 JOHOR BAHRU
        </text>

        {/* Woodlands Causeway */}
        <g>
          {/* Bridge path */}
          <line
            x1="300"
            y1="280"
            x2="300"
            y2="120"
            stroke={isWoodlands ? routeColor : '#cbd5e1'}
            strokeWidth={isWoodlands ? '12' : '8'}
            strokeDasharray={isWoodlands ? '0' : '5,5'}
            opacity={isWoodlands ? 1 : 0.5}
          />

          {/* Bridge icon and label */}
          <circle cx="300" cy="200" r="25" fill="white" stroke={isWoodlands ? routeColor : '#cbd5e1'} strokeWidth="3" />
          <text x="300" y="205" textAnchor="middle" fontSize="20">🌉</text>
          <text x="300" y="155" textAnchor="middle" fill="#334155" fontSize="14" fontWeight="600">
            Woodlands
          </text>

          {/* Traffic flow indicators */}
          {isWoodlands && (
            <>
              {direction === 'singapore' || direction === 'both' ? (
                <>
                  <circle cx="300" cy="240" r="4" fill={routeColor}>
                    <animate attributeName="cy" from="280" to="120" dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" from="1" to="0" dur="2s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="300" cy="200" r="4" fill={routeColor}>
                    <animate attributeName="cy" from="280" to="120" dur="2s" begin="0.5s" repeatCount="indefinite" />
                    <animate attributeName="opacity" from="1" to="0" dur="2s" begin="0.5s" repeatCount="indefinite" />
                  </circle>
                </>
              ) : (
                <>
                  <circle cx="300" cy="160" r="4" fill={routeColor}>
                    <animate attributeName="cy" from="120" to="280" dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" from="1" to="0" dur="2s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="300" cy="200" r="4" fill={routeColor}>
                    <animate attributeName="cy" from="120" to="280" dur="2s" begin="0.5s" repeatCount="indefinite" />
                    <animate attributeName="opacity" from="1" to="0" dur="2s" begin="0.5s" repeatCount="indefinite" />
                  </circle>
                </>
              )}
            </>
          )}

          {/* Congestion badge */}
          {isWoodlands && congestionLevel && (
            <g>
              <rect x="340" y="185" width="100" height="30" rx="15" fill="white" stroke={routeColor} strokeWidth="2" />
              <text x="390" y="205" textAnchor="middle" fill={routeColor} fontSize="12" fontWeight="700">
                {congestionLevel.toUpperCase()}
              </text>
            </g>
          )}
        </g>

        {/* Tuas Second Link */}
        <g>
          {/* Bridge path */}
          <line
            x1="550"
            y1="280"
            x2="550"
            y2="120"
            stroke={isTuas ? routeColor : '#cbd5e1'}
            strokeWidth={isTuas ? '12' : '8'}
            strokeDasharray={isTuas ? '0' : '5,5'}
            opacity={isTuas ? 1 : 0.5}
          />

          {/* Bridge icon and label */}
          <circle cx="550" cy="200" r="25" fill="white" stroke={isTuas ? routeColor : '#cbd5e1'} strokeWidth="3" />
          <text x="550" y="205" textAnchor="middle" fontSize="20">🌁</text>
          <text x="550" y="155" textAnchor="middle" fill="#334155" fontSize="14" fontWeight="600">
            Tuas Link
          </text>

          {/* Traffic flow indicators */}
          {isTuas && (
            <>
              {direction === 'singapore' || direction === 'both' ? (
                <>
                  <circle cx="550" cy="240" r="4" fill={routeColor}>
                    <animate attributeName="cy" from="280" to="120" dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" from="1" to="0" dur="2s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="550" cy="200" r="4" fill={routeColor}>
                    <animate attributeName="cy" from="280" to="120" dur="2s" begin="0.5s" repeatCount="indefinite" />
                    <animate attributeName="opacity" from="1" to="0" dur="2s" begin="0.5s" repeatCount="indefinite" />
                  </circle>
                </>
              ) : (
                <>
                  <circle cx="550" cy="160" r="4" fill={routeColor}>
                    <animate attributeName="cy" from="120" to="280" dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" from="1" to="0" dur="2s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="550" cy="200" r="4" fill={routeColor}>
                    <animate attributeName="cy" from="120" to="280" dur="2s" begin="0.5s" repeatCount="indefinite" />
                    <animate attributeName="opacity" from="1" to="0" dur="2s" begin="0.5s" repeatCount="indefinite" />
                  </circle>
                </>
              )}
            </>
          )}

          {/* Congestion badge */}
          {isTuas && congestionLevel && (
            <g>
              <rect x="360" y="185" width="100" height="30" rx="15" fill="white" stroke={routeColor} strokeWidth="2" />
              <text x="410" y="205" textAnchor="middle" fill={routeColor} fontSize="12" fontWeight="700">
                {congestionLevel.toUpperCase()}
              </text>
            </g>
          )}
        </g>

        {/* Legend */}
        <g transform="translate(20, 20)">
          <rect x="0" y="0" width="160" height="80" rx="8" fill="white" fillOpacity="0.9" stroke="#cbd5e1" strokeWidth="1" />
          <text x="10" y="20" fill="#334155" fontSize="12" fontWeight="700">Traffic Legend:</text>
          <circle cx="20" cy="35" r="4" fill="#10b981" />
          <text x="30" y="39" fill="#334155" fontSize="11">Low</text>
          <circle cx="70" cy="35" r="4" fill="#eab308" />
          <text x="80" y="39" fill="#334155" fontSize="11">Moderate</text>
          <circle cx="20" cy="55" r="4" fill="#f97316" />
          <text x="30" y="59" fill="#334155" fontSize="11">High</text>
          <circle cx="70" cy="55" r="4" fill="#ef4444" />
          <text x="80" y="59" fill="#334155" fontSize="11">Severe</text>
        </g>
      </svg>
    </div>
  );
};

export default SchematicMap;
