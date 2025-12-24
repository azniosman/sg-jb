/**
 * Traffic Visualization Component - simplified route map
 */
import React from 'react';
import './TrafficVisualization.css';

const TrafficVisualization = ({ origin, destination, checkpoint, congestionLevel }) => {
  const getCheckpointLabel = () => {
    return checkpoint === 'woodlands' ? 'Woodlands Caus' : 'Tuas Second Link';
  };

  const getAlternateCheckpoint = () => {
    return checkpoint === 'woodlands' ? 'Tuas Second Link' : 'Woodlands Caus';
  };

  const getCongestionColor = () => {
    switch (congestionLevel) {
      case 'low':
        return '#22c55e';
      case 'moderate':
        return '#eab308';
      case 'high':
        return '#f97316';
      case 'severe':
        return '#ef4444';
      default:
        return '#94a3b8';
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-header-icon">🗺️</span>
        Live Traffic Visualization
      </div>

      <div className="traffic-map">
        {/* Johor Bahru (Top) */}
        <div className="location-label top">
          <div className="location-name">JOHOR BAHRU (MY)</div>
        </div>

        {/* Checkpoints */}
        <div className="checkpoints">
          {/* Selected Checkpoint - with traffic bar */}
          <div className="checkpoint selected">
            <div className="checkpoint-label">{getCheckpointLabel()}</div>
            <div
              className="traffic-bar"
              style={{
                background: getCongestionColor(),
                height: congestionLevel === 'severe' ? '80%' :
                        congestionLevel === 'high' ? '60%' :
                        congestionLevel === 'moderate' ? '40%' : '20%'
              }}
            />
          </div>

          {/* Alternate Checkpoint - gray bar */}
          <div className="checkpoint alternate">
            <div className="checkpoint-label">{getAlternateCheckpoint()}</div>
            <div className="traffic-bar alternate-bar" />
          </div>
        </div>

        {/* Singapore (Bottom) */}
        <div className="location-label bottom">
          <div className="location-name">SINGAPORE (SG)</div>
        </div>

        {/* Legend */}
        <div className="traffic-legend">
          <div className="legend-item">
            <div className="legend-bar" style={{ background: getCongestionColor() }} />
            <span>Current Route</span>
          </div>
          <div className="legend-item">
            <div className="legend-bar alternate-bar" />
            <span>Alternative Route</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrafficVisualization;
