import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://sfggjjfoyeinobtbwpii.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmZ2dqamZveWVpbm9idGJ3cGlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUzNTc2OTksImV4cCI6MjEwMDkzMzY5OX0.ljPEbi6ulxlg9uvrE7RyuQkjRpv4dV-m2BBHsSzTTo0';

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    persistSession: true,
    autoRefreshToken: true,
  },
});
