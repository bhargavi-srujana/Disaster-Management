import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // Increased timeout to 30 seconds for slower connections
  headers: {
    'Content-Type': 'application/json',
  },
});

// Get weather and risk data for a location
export const getWeatherRisk = async (location, simulation = null) => {
  try {
    const params = { location };
    if (simulation) {
      params.simulation = simulation;
    }
    const response = await api.get('/weather', { params });
    return response.data;
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      throw 'Request timeout - server is taking too long to respond. Please try again.';
    }
    if (error.code === 'ERR_NETWORK') {
      throw 'Cannot connect to server. Make sure the backend is running on port 8080.';
    }
    throw error.response?.data?.detail || error.response?.data || error.message;
  }
};

// Trigger manual refresh of all monitored places
export const triggerRefresh = async () => {
  try {
    const response = await api.get('/refresh');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Monitored cities (matching backend)
export const MONITORED_CITIES = [
  "Mumbai",
  "Delhi",
  "Chennai",
  "Kolkata",
  "Bangalore",
  "Hyderabad",
  "Pune",
  "Ahmedabad"
];

export default api;
