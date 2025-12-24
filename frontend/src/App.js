/**
 * Main App component
 */
import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Map from './components/Map';
import Alerts from './components/Alerts';
import Charts from './components/Charts';
import ScenarioAnalysis from './components/ScenarioAnalysis';
import { predictTravelTime } from './services/api';
import './App.css';

function App() {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentScenario, setCurrentScenario] = useState(null);

  const handlePredict = async (formData) => {
    setLoading(true);
    setError(null);

    try {
      const result = await predictTravelTime(formData);
      setPrediction(result);
      setCurrentScenario(formData);
    } catch (err) {
      setError('Failed to get prediction. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      {/* Sidebar */}
      <div className="sidebar-container">
        <Sidebar onPredict={handlePredict} loading={loading} />
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Map Section */}
        <div className="map-section">
          <Map
            origin={currentScenario?.origin || 'singapore'}
            destination={currentScenario?.destination || 'jb'}
            congestionLevel={prediction?.congestion_level}
          />
        </div>

        {/* Results Section */}
        <div className="results-section">
          {error && (
            <div className="error-message">
              <span>⚠️</span> {error}
            </div>
          )}

          {prediction && (
            <>
              {/* Alerts */}
              <Alerts
                alert={prediction.alert}
                congestionLevel={prediction.congestion_level}
              />

              {/* Prediction Results */}
              <div className="prediction-card">
                <h2>Predicted Travel Time</h2>
                <div className="prediction-time">
                  <div className="time-value">
                    {Math.round(prediction.predicted_time_minutes)}
                    <span className="unit">min</span>
                  </div>
                  <div className="time-range">
                    Range: {Math.round(prediction.lower_bound_minutes)} -{' '}
                    {Math.round(prediction.upper_bound_minutes)} min
                  </div>
                </div>
              </div>

              {/* Scenario Analysis */}
              <ScenarioAnalysis baseScenario={currentScenario} />

              {/* Historical Charts */}
              <Charts
                origin={currentScenario?.origin}
                destination={currentScenario?.destination}
              />
            </>
          )}

          {!prediction && !error && (
            <div className="welcome-message">
              <h2>Welcome to SG-JB Travel Predictor</h2>
              <p>
                Enter your travel details in the sidebar to get started with
                predicting travel times between Singapore and Johor Bahru.
              </p>
              <div className="features">
                <div className="feature">
                  <span className="feature-icon">🚗</span>
                  <h3>Smart Predictions</h3>
                  <p>ML-powered travel time predictions with confidence intervals</p>
                </div>
                <div className="feature">
                  <span className="feature-icon">📅</span>
                  <h3>Holiday Awareness</h3>
                  <p>Accounts for public and school holidays in both countries</p>
                </div>
                <div className="feature">
                  <span className="feature-icon">📊</span>
                  <h3>Scenario Analysis</h3>
                  <p>Compare different times to find the best travel window</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
