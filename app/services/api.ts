import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '../../config/api'; // Using relative path from services folder

// Create a new axios instance
const api = axios.create({
  baseURL: API_URL + '/api', // This sets the base for all requests, e.g., 'http://192.168.1.3:3000/api'
});

// Add a "request interceptor"
// This function runs BEFORE every request is sent
api.interceptors.request.use(
  async (config) => {
    // Get the token from storage
    const token = await AsyncStorage.getItem('userToken');
    
    // If the token exists, add it to the Authorization header
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config; // Continue with the request
  },
  (error) => {
    // Handle any errors during the request setup
    return Promise.reject(error);
  }
);

export default api;