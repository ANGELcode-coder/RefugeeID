import { IssuedCredential } from './types';

const CREDENTIALS_KEY = '@refugeeid_credentials';
const SYNC_TIMESTAMP_KEY = '@refugeeid_last_sync';
const SHARE_HISTORY_KEY = '@refugeeid_share_history';

export interface ShareHistoryEntry {
  id: string;
  credentialId?: string;
  credentialName?: string;
  method: 'qr' | 'code' | 'copy' | 'share';
  timestamp: string;
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const json = localStorage.getItem(key);
    return json ? JSON.parse(json) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: any): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export const cache = {
  async getCredentials(): Promise<IssuedCredential[]> {
    return readJson(CREDENTIALS_KEY, []);
  },

  async setCredentials(credentials: IssuedCredential[]): Promise<void> {
    writeJson(CREDENTIALS_KEY, credentials);
    writeJson(SYNC_TIMESTAMP_KEY, new Date().toISOString());
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
    return localStorage.getItem(SYNC_TIMESTAMP_KEY);
  },

  async getProfile(): Promise<{ display_name: string | null } | null> {
    return readJson('@refugeeid_profile', null);
  },

  async setProfile(profile: { display_name: string | null }): Promise<void> {
    writeJson('@refugeeid_profile', profile);
  },

  async clearAll(): Promise<void> {
    try {
      localStorage.removeItem(CREDENTIALS_KEY);
      localStorage.removeItem('@refugeeid_profile');
      localStorage.removeItem(SYNC_TIMESTAMP_KEY);
      localStorage.removeItem(SHARE_HISTORY_KEY);
    } catch {}
  },

  async getShareHistory(): Promise<ShareHistoryEntry[]> {
    return readJson(SHARE_HISTORY_KEY, []);
  },

  async addShareHistory(entry: Omit<ShareHistoryEntry, 'id' | 'timestamp'>): Promise<void> {
    const history = await this.getShareHistory();
    const newEntry: ShareHistoryEntry = {
      ...entry,
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      timestamp: new Date().toISOString(),
    };
    const updated = [newEntry, ...history].slice(0, 100);
    writeJson(SHARE_HISTORY_KEY, updated);
  },

  async clearShareHistory(): Promise<void> {
    try {
      localStorage.removeItem(SHARE_HISTORY_KEY);
    } catch {}
  },
};
