/**
 * Scenario Analysis component for comparing multiple travel scenarios
 */
import React, { useState } from 'react';
import { simulateScenarios } from '../services/api';
import './ScenarioAnalysis.css';

const ScenarioAnalysis = ({ baseScenario }) => {
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const generateScenarios = () => {
    if (!baseScenario) return;

    // Generate scenarios for different times on the same day
    const times = ['06:00', '07:00', '08:00', '09:00', '12:00', '17:00', '18:00', '19:00'];

    return times.map((time) => ({
      ...baseScenario,
      travel_time: time,
    }));
  };

  const runScenarioAnalysis = async () => {
    setLoading(true);
    try {
      const scenarioList = generateScenarios();
      const result = await simulateScenarios(scenarioList);
      setScenarios(result.predictions);
      setExpanded(true);
    } catch (error) {
      console.error('Scenario analysis error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCongestionColor = (level) => {
    switch (level) {
      case 'low':
        return '#22c55e';
      case 'moderate':
        return '#eab308';
      case 'high':
        return '#f97316';
      case 'severe':
        return '#ef4444';
      default:
        return '#64748b';
    }
  };

  const formatTime = (time) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  if (!baseScenario) {
    return (
      <div className="scenario-analysis">
        <p className="scenario-hint">
          Make a prediction first to enable scenario analysis
        </p>
      </div>
    );
  }

  return (
    <div className="scenario-analysis">
      <div className="scenario-header">
        <h3>Scenario Analysis</h3>
        <button
          onClick={runScenarioAnalysis}
          disabled={loading}
          className="analyze-btn"
        >
          {loading ? 'Analyzing...' : 'Compare Different Times'}
        </button>
      </div>

      {expanded && scenarios.length > 0 && (
        <div className="scenarios-list">
          <table className="scenarios-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Predicted Time</th>
                <th>Congestion</th>
              </tr>
            </thead>
            <tbody>
              {scenarios.map((scenario, index) => (
                <tr key={index}>
                  <td className="time-cell">{formatTime(scenario.time)}</td>
                  <td className="duration-cell">
                    <strong>{Math.round(scenario.predicted_time)}</strong> min
                    <span className="range">
                      ({Math.round(scenario.lower_bound)}-
                      {Math.round(scenario.upper_bound)})
                    </span>
                  </td>
                  <td className="congestion-cell">
                    <span
                      className="congestion-badge"
                      style={{
                        background: getCongestionColor(scenario.congestion_level),
                      }}
                    >
                      {scenario.congestion_level}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="best-time">
            <strong>💡 Best Time:</strong>{' '}
            {formatTime(
              scenarios.reduce((best, curr) =>
                curr.predicted_time < best.predicted_time ? curr : best
              ).time
            )}{' '}
            (
            {Math.round(
              scenarios.reduce((best, curr) =>
                curr.predicted_time < best.predicted_time ? curr : best
              ).predicted_time
            )}{' '}
            min)
          </div>
        </div>
      )}
    </div>
  );
};

export default ScenarioAnalysis;
