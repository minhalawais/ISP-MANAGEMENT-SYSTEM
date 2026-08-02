// ISP Management System - Auth Store
// Based on docs/state-management.md (Zustand)

import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { authAPI } from '../services/api.client';

const useAuthStore = create((set, get) => ({
  // State
  user: null,
  token: null,
  role: null,
  companyId: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  error: null,

  // Initialize - check SecureStore for existing session
  initialize: async () => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      const role = await SecureStore.getItemAsync('user_role');
      const companyId = await SecureStore.getItemAsync('company_id');

      if (token) {
        set({
          token,
          role,
          companyId,
          isAuthenticated: true,
          isInitialized: true,
        });
      } else {
        set({ isInitialized: true });
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      set({ isInitialized: true });
    }
  },

  // Login
  login: async (username, password) => {
    set({ isLoading: true, error: null });

    try {
      const response = await authAPI.login(username, password);
      const { token, role, company_id } = response.data;

      // Persist to SecureStore
      await SecureStore.setItemAsync('auth_token', token);
      await SecureStore.setItemAsync('user_role', role);
      await SecureStore.setItemAsync('company_id', String(company_id));

      set({
        token,
        role,
        companyId: String(company_id),
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      return { success: true, role };
    } catch (error) {
      const errorMessage =
        error.response?.data?.error || 'Login failed. Please try again.';

      set({
        isLoading: false,
        error: errorMessage,
      });

      return { success: false, error: errorMessage };
    }
  },

  // Logout
  logout: async () => {
    try {
      await SecureStore.deleteItemAsync('auth_token');
      await SecureStore.deleteItemAsync('user_role');
      await SecureStore.deleteItemAsync('company_id');
    } catch (error) {
      console.error('Logout SecureStore error:', error);
    }

    set({
      user: null,
      token: null,
      role: null,
      companyId: null,
      isAuthenticated: false,
      error: null,
    });
  },

  // Clear error
  clearError: () => set({ error: null }),
}));

export default useAuthStore;
