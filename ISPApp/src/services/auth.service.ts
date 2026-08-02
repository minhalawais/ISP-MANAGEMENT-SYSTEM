import axiosInstance from '../../config/axios';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'super_admin' | 'company_owner' | 'manager' | 'employee' | 'customer' | 'technician';
  first_name: string;
  last_name: string;
}

export interface LoginResponse {
  access_token: string;
  user: User;
}

export const AuthService = {
  login: async (username: string, password: string): Promise<User> => {
    try {
      const response = await axiosInstance.post<LoginResponse>('/auth/login', {
        username,
        password,
      });

      const { access_token, user } = response.data;

      await SecureStore.setItemAsync(TOKEN_KEY, access_token);
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));

      // Set default header for future requests
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

      return user;
    } catch (error) {
      throw error;
    }
  },

  logout: async () => {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_KEY);
      delete axiosInstance.defaults.headers.common['Authorization'];
    } catch (error) {
      console.error('Logout failed', error);
    }
  },

  getToken: async () => {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  },

  getUser: async (): Promise<User | null> => {
    const userJson = await SecureStore.getItemAsync(USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
  },
};
