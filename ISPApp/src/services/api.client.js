// ISP Management System - API Client
// Based on docs/api-integration.md

import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = 'https://nexus.mbanet.com.pk/api/';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - attach auth token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.warn('Failed to get auth token from SecureStore:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear stored auth data
      try {
        await SecureStore.deleteItemAsync('auth_token');
        await SecureStore.deleteItemAsync('user_role');
        await SecureStore.deleteItemAsync('company_id');
      } catch (e) {
        console.warn('Failed to clear SecureStore:', e);
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (username, password) =>
    apiClient.post('/auth/login', { username, password }),

  logout: () =>
    apiClient.post('/auth/logout'),
};

export default apiClient;
