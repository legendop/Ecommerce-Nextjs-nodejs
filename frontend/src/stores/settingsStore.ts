import { create } from 'zustand';
import { settingsApi } from '@/lib/api';
import {
  getSettingsFromStorage,
  saveSettingsToStorage,
  clearSettingsStorage,
  isSettingsExpired,
} from '@/lib/settings';

export interface SiteConfig {
  name: string;
  tagline: string;
  description: string;
  email: string;
  phone: string;
  address: string;
  currency: string;
  currencyCode: string;
  freeShippingThreshold: number;
  social: {
    facebook: string;
    instagram: string;
    twitter: string;
    youtube: string;
  };
  theme: {
    primary: string;
    primaryDark: string;
    primaryLight: string;
    secondary: string;
    background: string;
  };
}

const defaultConfig: SiteConfig = {
  name: 'ShriToys',
  tagline: 'Your one-stop shop for everything',
  description: 'Bringing joy and imagination to children everywhere. Quality toys, trusted by parents since 2010.',
  email: 'support@shritoys.com',
  phone: '+91 9876543210',
  address: '123 Toy Street, Mumbai, India',
  currency: '₹',
  currencyCode: 'INR',
  freeShippingThreshold: 499,
  social: {
    facebook: 'https://facebook.com/shritoys',
    instagram: 'https://instagram.com/shritoys',
    twitter: 'https://twitter.com/shritoys',
    youtube: 'https://youtube.com/shritoys',
  },
  theme: {
    primary: '#3b82f6',
    primaryDark: '#2563eb',
    primaryLight: '#dbeafe',
    secondary: '#1e3a5f',
    background: '#f0f9ff',
  },
};

interface SettingsState {
  config: SiteConfig;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
  // Only fetches if not in storage or expired
  initialize: () => Promise<void>;
  // Forces a fresh fetch from API
  refresh: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  config: defaultConfig,
  isLoading: false,
  error: null,
  isInitialized: false,

  initialize: async () => {
    const { isInitialized } = get();

    // If already initialized this session, use cached data
    if (isInitialized) {
      return;
    }

    // Check if this is a fresh page load (new tab or hard reload)
    const isFreshLoad = typeof window !== 'undefined' && !sessionStorage.getItem('settings_session');

    if (isFreshLoad) {
      // Mark session as started
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('settings_session', 'true');
      }

      // On fresh load: fetch from API first
      set({ isLoading: true, error: null });

      try {
        const response = await settingsApi.getPublic();
        if (response.data.success && response.data.data) {
          const mergedConfig = { ...defaultConfig, ...response.data.data };
          set({ config: mergedConfig, isLoading: false, isInitialized: true });
          saveSettingsToStorage(mergedConfig);
          return;
        }
      } catch (error) {
        console.error('Failed to fetch settings on load:', error);
        // Fall through to use cache
      }
    }

    // Try localStorage (for tab switches or if API failed)
    if (typeof window !== 'undefined') {
      const cached = getSettingsFromStorage();
      if (cached) {
        set({ config: cached, isLoading: false, isInitialized: true });
        return;
      }
    }

    // Last resort: use defaults
    set({ isInitialized: true });
  },

  refresh: async () => {
    set({ isLoading: true, error: null });

    try {
      const response = await settingsApi.getPublic();
      if (response.data.success && response.data.data) {
        const mergedConfig = { ...defaultConfig, ...response.data.data };
        set({ config: mergedConfig, isLoading: false, isInitialized: true });
        saveSettingsToStorage(mergedConfig);
      }
    } catch (error) {
      console.error('Failed to refresh settings:', error);
      const cached = getSettingsFromStorage();
      if (cached) {
        set({ config: cached, error: null, isLoading: false });
      } else {
        set({ error: 'Failed to refresh settings', isLoading: false });
      }
    }
  },
}));

// Note: Components should call initialize() in useEffect to load settings
