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
 * Get live traffic data from Google Maps
 */
export const getLiveTraffic = async (origin = 'singapore', destination = 'jb', checkpoint = 'woodlands') => {
  try {
    const response = await api.get('/traffic/live', {
      params: { origin, destination, checkpoint },
    });
    return response.data;
  } catch (error) {
    console.error('Live traffic error:', error);
    throw error;
  }
};

/**
 * Get checkpoint wait time estimate
 */
export const getWaitTime = async (checkpoint = 'woodlands', origin = 'singapore', destination = 'jb', travelDatetime = null) => {
  try {
    const params = { checkpoint, origin, destination };
    if (travelDatetime) {
      params.travel_datetime = travelDatetime;
    }
    const response = await api.get('/checkpoint/wait-time', { params });
    return response.data;
  } catch (error) {
    console.error('Wait time error:', error);
    throw error;
  }
};

/**
 * Submit actual crossing data
 */
export const submitCrossing = async (crossingData) => {
  try {
    const response = await api.post('/crossings/submit', crossingData);
    return response.data;
  } catch (error) {
    console.error('Crossing submission error:', error);
    throw error;
  }
};

/**
 * Get recent crossing data
 */
export const getRecentCrossings = async (checkpoint = null, hours = 24, limit = 100) => {
  try {
    const params = { hours, limit };
    if (checkpoint) {
      params.checkpoint = checkpoint;
    }
    const response = await api.get('/crossings/recent', { params });
    return response.data;
  } catch (error) {
    console.error('Recent crossings error:', error);
    throw error;
  }
};

/**
 * Get database statistics
 */
export const getStats = async () => {
  try {
    const response = await api.get('/stats');
    return response.data;
  } catch (error) {
    console.error('Stats error:', error);
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
