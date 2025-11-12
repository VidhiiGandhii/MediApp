// import axios from 'axios';
// import * as SecureStore from 'expo-secure-store'; // ✅ CHANGED: Use SecureStore instead of AsyncStorage
// import { API_URL } from '../../../config/api';

// // Create a new axios instance
// const api = axios.create({
//   baseURL: API_URL + '/api',
// });

// // Add a request interceptor
// api.interceptors.request.use(
//   async (config) => {
//     try {
//       // ✅ CHANGED: Get token from SecureStore instead of AsyncStorage
//       const token = await SecureStore.getItemAsync('userToken');
      
//       console.log('🔍 Attaching token to request:', token ? token.substring(0, 20) + '...' : 'null');
      
//       if (token) {
//         config.headers.Authorization = `Bearer ${token}`;
//       } else {
//         console.warn('⚠️ No token found in SecureStore');
//       }
//     } catch (error) {
//       console.error('Error reading token from SecureStore:', error);
//     }
    
//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );

// // Optional: Add response interceptor for better error handling
// api.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     if (error.response?.status === 401) {
//       console.error('❌ 401 Unauthorized - Token may be invalid or expired');
//     }
//     return Promise.reject(error);
//   }
// );

// export default api;
import { API_URL } from '@/config/api';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';


// Create axios instance
const api = axios.create({
  baseURL: API_URL + '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - adds token to every request
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      
      if (token) {
        // Ensure proper Bearer format
        config.headers.Authorization = `Bearer ${token}`;
        console.log('🔍 Attaching token to request:', token.substring(0, 30) + '...');
        console.log('📍 Request to:', config.method?.toUpperCase(), config.url);
        console.log('📋 Full Authorization header:', config.headers.Authorization.substring(0, 50) + '...');
      } else {
        console.warn('⚠️ No token found in SecureStore for request to:', config.url);
      }
    } catch (error) {
      console.error('❌ Error reading token from SecureStore:', error);
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - logs detailed error info
api.interceptors.response.use(
  (response) => {
    console.log('✅ Response:', response.status, response.config.url);
    return response;
  },
  async (error) => {
    if (error.response) {
      console.error('❌ Response Error:', {
        status: error.response.status,
        url: error.config?.url,
        message: error.response.data?.message || error.message,
        data: error.response.data,
      });

      // Detailed 401 debugging
      if (error.response.status === 401) {
        const token = await SecureStore.getItemAsync('userToken');
        console.error('🔍 401 Unauthorized Debug Info:');
        console.error('  - Token exists:', !!token);
        console.error('  - Token preview:', token ? token.substring(0, 30) + '...' : 'null');
        console.error('  - Server message:', error.response.data?.message);
        console.error('  - Request headers:', error.config?.headers?.Authorization?.substring(0, 50));
      }
    } else if (error.request) {
      console.error('❌ Network Error: No response received');
      console.error('  - URL:', error.config?.url);
    } else {
      console.error('❌ Request Setup Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default api;