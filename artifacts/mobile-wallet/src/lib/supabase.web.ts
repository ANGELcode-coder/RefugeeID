import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://sfggjjfoyeinobtbwpii.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmZ2dqamZveWVpbm9idGJ3cGlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUzNTc2OTksImV4cCI6MjEwMDkzMzY5OX0.ljPEbi6ulxlg9uvrE7RyuQkjRpv4dV-m2BBHsSzTTo0';

const WebStorageAdapter = {
  getItem: (key: string) => Promise.resolve(localStorage.getItem(key)),
  setItem: (key: string, value: string) => { localStorage.setItem(key, value); return Promise.resolve(); },
  removeItem: (key: string) => { localStorage.removeItem(key); return Promise.resolve(); },
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: WebStorageAdapter,
    persistSession: true,
    autoRefreshToken: true,
  },
});
