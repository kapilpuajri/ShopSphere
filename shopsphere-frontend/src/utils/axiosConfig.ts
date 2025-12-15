import axios from 'axios';
import { store } from '../store/store';
import { restoreAuth, logout } from '../store/slices/authSlice';

// Configure axios defaults
axios.defaults.baseURL = 'http://localhost:8080/api';

// Request interceptor to add auth token to all requests
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401 errors globally
axios.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // If we get a 401 and haven't already tried to restore auth
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const token = localStorage.getItem('token');
      
      // Only try to restore auth if we have a token
      if (token) {
        try {
          // Try to restore authentication - this is critical to get user object
          const result = await store.dispatch(restoreAuth());
          
          // Check if restoreAuth was successful (has user data)
          if (result.type === 'auth/restoreAuth/fulfilled') {
            // Update the authorization header with the token
            const newToken = localStorage.getItem('token');
            if (newToken && originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            // Retry the request with the restored auth
            return axios(originalRequest);
          } else {
            // If restoreAuth failed, don't retry - let the error propagate
            console.error('Auth restoration failed in interceptor');
            return Promise.reject(error);
          }
        } catch (authError) {
          // If auth restoration throws an error, don't retry
          console.error('Auth restoration error in interceptor:', authError);
          return Promise.reject(error);
        }
      } else {
        // No token, don't retry
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default axios;

