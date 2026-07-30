import AsyncStorage from '@react-native-async-storage/async-storage';
import { IssuedCredential } from './types';

const CREDENTIALS_KEY = '@refugeeid_credentials';
const PROFILE_KEY = '@refugeeid_profile';
const SYNC_TIMESTAMP_KEY = '@refugeeid_last_sync';
const SHARE_HISTORY_KEY = '@refugeeid_share_history';

export interface ShareHistoryEntry {
  id: string;
  credentialId?: string;
  credentialName?: string;
  method: 'qr' | 'code' | 'copy' | 'share';
  timestamp: string;
}

export const cache = {
  async getCredentials(): Promise<IssuedCredential[]> {
    try {
      const json = await AsyncStorage.getItem(CREDENTIALS_KEY);
      return json ? JSON.parse(json) : [];
    } catch {
      return [];
    }
  },

  async setCredentials(credentials: IssuedCredential[]): Promise<void> {
    try {
      await AsyncStorage.setItem(CREDENTIALS_KEY, JSON.stringify(credentials));
      await AsyncStorage.setItem(SYNC_TIMESTAMP_KEY, new Date().toISOString());
    } catch {}
  },

  async addCredential(cred: IssuedCredential): Promise<void> {
    const existing = await this.getCredentials();
    const updated = [cred, ...existing.filter((c) => c.id !== cred.id)];
    await this.setCredentials(updated);
  },

  async removeCredential(id: string): Promise<void> {
    const existing = await this.getCredentials();
    await this.setCredentials(existing.filter((c) => c.id !== id));
  },

  async getCredential(id: string): Promise<IssuedCredential | null> {
    const all = await this.getCredentials();
    return all.find((c) => c.id === id) ?? null;
  },

  async getLastSync(): Promise<string | null> {
    return AsyncStorage.getItem(SYNC_TIMESTAMP_KEY);
  },

  async getProfile(): Promise<{ display_name: string | null } | null> {
    try {
      const json = await AsyncStorage.getItem(PROFILE_KEY);
      return json ? JSON.parse(json) : null;
    } catch {
      return null;
    }
  },

  async setProfile(profile: { display_name: string | null }): Promise<void> {
    try {
      await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    } catch {}
  },

  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([CREDENTIALS_KEY, PROFILE_KEY, SYNC_TIMESTAMP_KEY, SHARE_HISTORY_KEY]);
    } catch {}
  },

  async getShareHistory(): Promise<ShareHistoryEntry[]> {
    try {
      const json = await AsyncStorage.getItem(SHARE_HISTORY_KEY);
      return json ? JSON.parse(json) : [];
    } catch {
      return [];
    }
  },

  async addShareHistory(entry: Omit<ShareHistoryEntry, 'id' | 'timestamp'>): Promise<void> {
    try {
      const history = await this.getShareHistory();
      const newEntry: ShareHistoryEntry = {
        ...entry,
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
        timestamp: new Date().toISOString(),
      };
      const updated = [newEntry, ...history].slice(0, 100);
      await AsyncStorage.setItem(SHARE_HISTORY_KEY, JSON.stringify(updated));
    } catch {}
  },

  async clearShareHistory(): Promise<void> {
    try {
      await AsyncStorage.removeItem(SHARE_HISTORY_KEY);
    } catch {}
  },
};
