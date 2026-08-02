import { create } from 'zustand';
import { AuthService, User } from '../services/auth.service';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  
  // Actions
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
  clearError: () => void;
}

const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  error: null,

  login: async (username, password) => {
    set({ isLoading: true, error: null });
    try {
      const user = await AuthService.login(username, password);
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      const message = error.response?.data?.error || 'Login failed. Please check your credentials.';
      set({ error: message, isLoading: false });
    }
  },

  logout: async () => {
    set({ isLoading: true });
    await AuthService.logout();
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  initialize: async () => {
    try {
      const user = await AuthService.getUser();
      const token = await AuthService.getToken();
      
      if (user && token) {
        set({ user, isAuthenticated: true, isInitialized: true });
      } else {
        set({ isInitialized: true, isAuthenticated: false });
      }
    } catch (error) {
      set({ isInitialized: true, isAuthenticated: false });
    }
  },

  clearError: () => set({ error: null }),
}));

export default useAuthStore;
