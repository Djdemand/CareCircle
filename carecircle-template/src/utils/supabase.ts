import 'react-native-url-polyfill/auto';
import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

// Add type definition for window
declare global {
  interface Window {
    SUPABASE_CONFIG?: {
      URL: string;
      ANON_KEY: string;
    };
  }
}

const supabaseUrl = (typeof window !== 'undefined' && window.SUPABASE_CONFIG?.URL) || process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = (typeof window !== 'undefined' && window.SUPABASE_CONFIG?.ANON_KEY) || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

/**
 * Custom storage adapter using Expo SecureStore for production-grade security.
 * Falls back to localStorage on web.
 */
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    if (Platform.OS === 'web') {
      if (typeof localStorage === 'undefined') return Promise.resolve(null);
      return Promise.resolve(localStorage.getItem(key));
    }
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string) => {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
      }
      return Promise.resolve();
    }
    SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string) => {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
      }
      return Promise.resolve();
    }
    SecureStore.deleteItemAsync(key);
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter as any,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});