import { prisma } from '../../config/prisma';

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

export async function getPublicSettings(): Promise<SiteConfig> {
  const settings = await prisma.setting.findMany({
    where: { isPublic: true },
  });

  const config = { ...defaultConfig };

  for (const setting of settings) {
    const key = setting.key as keyof SiteConfig;
    if (key === 'social' || key === 'theme') {
      try {
        (config as Record<string, unknown>)[key] = JSON.parse(setting.value);
      } catch {
        // ignore parse error
      }
    } else if (key === 'freeShippingThreshold') {
      config[key] = parseInt(setting.value, 10) || defaultConfig[key];
    } else if (key in config) {
      (config as Record<string, unknown>)[key] = setting.value;
    }
  }

  return config;
}

export async function getAllSettings() {
  return prisma.setting.findMany({
    orderBy: { key: 'asc' },
  });
}

export async function updateSetting(
  key: string,
  value: string,
  type: string = 'string',
  isPublic: boolean = true,
  description?: string
) {
  return prisma.setting.upsert({
    where: { key },
    update: { value, type, isPublic, description },
    create: { key, value, type, isPublic, description },
  });
}

export async function deleteSetting(key: string) {
  return prisma.setting.delete({
    where: { key },
  });
}
