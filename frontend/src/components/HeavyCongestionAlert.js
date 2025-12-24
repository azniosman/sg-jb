/**
 * Heavy Congestion Alert Banner
 */
import React from 'react';
import './HeavyCongestionAlert.css';

const HeavyCongestionAlert = ({ congestionLevel, predictedTime }) => {
  const getMessage = () => {
    if (congestionLevel === 'severe') {
      const delayHours = Math.floor((predictedTime - 30) / 30);
      return `Traffic is building up. Consider delaying your trip by ${delayHours} hours or switching to Tuas Second Link.`;
    }
    return 'Traffic is building up. Consider alternative timing or route.';
  };

  return (
    <div className="heavy-congestion-alert">
      <div className="alert-icon">⚠️</div>
      <div className="alert-content">
        <div className="alert-title">Heavy Congestion Expected</div>
        <div className="alert-message">{getMessage()}</div>
      </div>
    </div>
  );
};

export default HeavyCongestionAlert;
