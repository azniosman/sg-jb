/**
 * Alerts component for displaying warnings and notifications
 */
import React from 'react';
import './Alerts.css';

const Alerts = ({ alert, congestionLevel }) => {
  if (!alert && !congestionLevel) return null;

  const getCongestionEmoji = () => {
    switch (congestionLevel) {
      case 'low':
        return '✅';
      case 'moderate':
        return '⚠️';
      case 'high':
        return '🔴';
      case 'severe':
        return '🚨';
      default:
        return 'ℹ️';
    }
  };

  const getCongestionClass = () => {
    switch (congestionLevel) {
      case 'low':
        return 'alert-success';
      case 'moderate':
        return 'alert-warning';
      case 'high':
        return 'alert-danger';
      case 'severe':
        return 'alert-severe';
      default:
        return 'alert-info';
    }
  };

  return (
    <div className="alerts-container">
      {congestionLevel && (
        <div className={`alert ${getCongestionClass()}`}>
          <span className="alert-icon">{getCongestionEmoji()}</span>
          <div className="alert-content">
            <strong>Congestion Level: {congestionLevel.toUpperCase()}</strong>
          </div>
        </div>
      )}

      {alert && (
        <div className="alert alert-info">
          <span className="alert-icon">ℹ️</span>
          <div className="alert-content">{alert}</div>
        </div>
      )}
    </div>
  );
};

export default Alerts;
