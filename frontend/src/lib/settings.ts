import { SiteConfig } from '@/stores/settingsStore';

const STORAGE_KEY = 'site-settings';
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour

interface CachedSettings {
  config: SiteConfig;
  timestamp: number;
}

export function getSettingsFromStorage(): SiteConfig | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const cached: CachedSettings = JSON.parse(stored);
    const isExpired = Date.now() - cached.timestamp > CACHE_DURATION_MS;

    if (isExpired) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return cached.config;
  } catch {
    return null;
  }
}

export function saveSettingsToStorage(config: SiteConfig): void {
  if (typeof window === 'undefined') return;

  try {
    const cached: CachedSettings = {
      config,
      timestamp: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cached));
  } catch {
    // Ignore storage errors
  }
}

export function clearSettingsStorage(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

export function isSettingsExpired(): boolean {
  if (typeof window === 'undefined') return true;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return true;

    const cached: CachedSettings = JSON.parse(stored);
    return Date.now() - cached.timestamp > CACHE_DURATION_MS;
  } catch {
    return true;
  }
}
