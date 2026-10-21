import { create } from 'zustand';
import { User } from '../types';
import { DEFAULT_USER, getStoredUser, saveStoredUser } from '../utils/storage';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isDemoMode: boolean;
  login: (email: string, pass: string, remember?: boolean) => Promise<{ success: boolean; error?: string }>;
  signup: (name: string, email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  loginAsDemo: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
  const initialUser = getStoredUser();

  return {
    user: initialUser,
    isAuthenticated: true, // Auto authenticated in demo mode for instant accessibility
    isDemoMode: true,

    login: async (email, _pass) => {
      // Demo validation
      if (!email.includes('@')) {
        return { success: false, error: 'Please enter a valid email address.' };
      }

      const user: User = {
        ...DEFAULT_USER,
        email,
        name: email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      };

      saveStoredUser(user);
      set({ user, isAuthenticated: true, isDemoMode: true });
      return { success: true };
    },

    signup: async (name, email, _pass) => {
      if (!name.trim()) {
        return { success: false, error: 'Please enter your name.' };
      }
      if (!email.includes('@')) {
        return { success: false, error: 'Please enter a valid email address.' };
      }

      const user: User = {
        ...DEFAULT_USER,
        name: name.trim(),
        email: email.trim(),
      };

      saveStoredUser(user);
      set({ user, isAuthenticated: true, isDemoMode: true });
      return { success: true };
    },

    loginAsDemo: () => {
      saveStoredUser(DEFAULT_USER);
      set({ user: DEFAULT_USER, isAuthenticated: true, isDemoMode: true });
    },

    logout: () => {
      set({ user: null, isAuthenticated: false });
    },
  };
});
