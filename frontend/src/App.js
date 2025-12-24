/**
 * Main App component - redesigned to match UI/UX reference
 */
import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import TrafficVisualization from './components/TrafficVisualization';
import ForecastChart from './components/ForecastChart';
import HeavyCongestionAlert from './components/HeavyCongestionAlert';
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

  const getWeatherIcon = () => {
    // Default to sunny for demo
    return '☀️';
  };

  const getWeatherCondition = () => {
    return 'Clear';
  };

  const getTemperature = () => {
    return prediction?.features_used?.temp_c
      ? Math.round(prediction.features_used.temp_c)
      : 31;
  };

  return (
    <div className="app">
      <div className="app-header">
        <span className="app-icon">🚗</span>
        <h1>SG-JB Travel Predictor</h1>
      </div>

      <div className="app-content">
        {/* Left Sidebar */}
        <Sidebar onPredict={handlePredict} loading={loading} />

        {/* Main Content */}
        <div className="main-content">
          {error && (
            <div className="error-message">
              <span>⚠️</span> {error}
            </div>
          )}

          {prediction ? (
            <>
              {/* Info Cards Row */}
              <div className="info-cards">
                {/* Predicted Duration Card */}
                <div className="info-card">
                  <div className="info-card-icon red">🕐</div>
                  <div className="info-card-content">
                    <h3>Predicted Duration</h3>
                    <div className="info-card-value">
                      {Math.round(prediction.predicted_time_minutes)} min
                    </div>
                    <div className="info-card-subtext">
                      Range: {Math.round(prediction.lower_bound_minutes)}-
                      {Math.round(prediction.upper_bound_minutes)} min
                    </div>
                  </div>
                </div>

                {/* Congestion Level Card */}
                <div className="info-card">
                  <div className="info-card-icon blue">🚙</div>
                  <div className="info-card-content">
                    <h3>Congestion Level</h3>
                    <div className="info-card-value">
                      <span className={`congestion-badge ${prediction.congestion_level}`}>
                        {prediction.congestion_level}
                      </span>
                    </div>
                    <div className="info-card-subtext">Based on historical data</div>
                  </div>
                </div>

                {/* Weather Card */}
                <div className="info-card">
                  <div className="info-card-icon purple">{getWeatherIcon()}</div>
                  <div className="info-card-content">
                    <h3>Forecast Weather</h3>
                    <div className="info-card-value">{getTemperature()}°C</div>
                    <div className="info-card-subtext">{getWeatherCondition()}</div>
                  </div>
                </div>
              </div>

              {/* Heavy Congestion Alert */}
              {(prediction.congestion_level === 'high' ||
                prediction.congestion_level === 'severe') && (
                <HeavyCongestionAlert
                  congestionLevel={prediction.congestion_level}
                  predictedTime={prediction.predicted_time_minutes}
                />
              )}

              {/* Main Grid - Traffic Viz and Forecast Chart */}
              <div className="main-grid">
                <TrafficVisualization
                  origin={currentScenario?.origin}
                  destination={currentScenario?.destination}
                  checkpoint={currentScenario?.checkpoint}
                  congestionLevel={prediction.congestion_level}
                />

                <ForecastChart
                  checkpoint={currentScenario?.checkpoint}
                  date={currentScenario?.travel_date}
                />
              </div>
            </>
          ) : (
            <div className="welcome-message card">
              <h2>Welcome to SG-JB Travel Predictor</h2>
              <p>
                Enter your travel details in the sidebar to get started with predicting
                travel times between Singapore and Johor Bahru.
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
                  <h3>24-Hour Forecast</h3>
                  <p>View predicted travel times throughout the day</p>
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
