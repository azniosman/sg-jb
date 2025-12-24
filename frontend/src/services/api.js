/**
 * API service for backend communication
 */
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Predict travel time for a single journey
 */
export const predictTravelTime = async (params) => {
  try {
    const response = await api.post('/predict', params);
    return response.data;
  } catch (error) {
    console.error('Prediction error:', error);
    throw error;
  }
};

/**
 * Simulate multiple scenarios
 */
export const simulateScenarios = async (scenarios) => {
  try {
    const response = await api.post('/simulate', { scenarios });
    return response.data;
  } catch (error) {
    console.error('Simulation error:', error);
    throw error;
  }
};

/**
 * Get historical travel time data
 */
export const getHistoricalData = async (days = 30, origin = 'singapore', destination = 'jb') => {
  try {
    const response = await api.get('/historical', {
      params: { days, origin, destination },
    });
    return response.data;
  } catch (error) {
    console.error('Historical data error:', error);
    throw error;
  }
};

/**
 * Health check
 */
export const healthCheck = async () => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    console.error('Health check error:', error);
    throw error;
  }
};

export default api;
