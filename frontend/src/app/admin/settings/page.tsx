'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { settingsApi } from '@/lib/api';
import { useSettingsStore } from '@/stores/settingsStore';
import { clearSettingsStorage } from '@/lib/settings';
import toast from 'react-hot-toast';
import {
  Settings,
  Shield,
  Link,
  BarChart3,
  Package,
  Sparkles,
  Code,
  Store,
  Mail,
  Phone,
  MapPin,
  DollarSign,
  Truck,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Palette,
  Save,
  Loader2,
} from 'lucide-react';

interface Setting {
  id: number;
  key: string;
  value: string;
  type: string;
  description: string | null;
  isPublic: boolean;
}

const defaultSettings = {
  // General
  name: 'ShriToys',
  tagline: 'Your one-stop shop for everything',
  description: 'Bringing joy and imagination to children everywhere.',
  email: 'support@shritoys.com',
  phone: '+91 9876543210',
  address: '123 Toy Street, Mumbai, India',
  // Currency & Shipping
  currency: '₹',
  currencyCode: 'INR',
  freeShippingThreshold: '499',
  // Theme
  theme: JSON.stringify({
    primary: '#3b82f6',
    primaryDark: '#2563eb',
    primaryLight: '#dbeafe',
    secondary: '#1e3a5f',
    background: '#f0f9ff',
  }, null, 2),
  // Social
  social: JSON.stringify({
    facebook: 'https://facebook.com/shritoys',
    instagram: 'https://instagram.com/shritoys',
    twitter: 'https://twitter.com/shritoys',
    youtube: 'https://youtube.com/shritoys',
  }, null, 2),
  // SEO
  metaTitle: 'ShriToys - Quality Toys for Children',
  metaDescription: 'Shop the best toys for kids. Quality products, fast delivery, and great prices.',
  googleAnalyticsId: '',
  // Features
  enableReviews: 'true',
  enableWishlist: 'true',
  enableGuestCheckout: 'true',
  lowStockThreshold: '5',
  // Authentication
  enableRegistration: 'true',
  requireEmailVerification: 'false',
  sessionTimeout: '60',
  // Advanced
  maintenanceMode: 'false',
  cacheDuration: '3600',
};

const tabs = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'auth', label: 'Authentication', icon: Shield },
  { id: 'integrations', label: 'Integrations', icon: Link },
  { id: 'seo', label: 'SEO & Analytics', icon: BarChart3 },
  { id: 'products', label: 'Product Display', icon: Package },
  { id: 'features', label: 'Features', icon: Sparkles },
  { id: 'advanced', label: 'Advanced', icon: Code },
];

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState<Record<string, string>>(defaultSettings);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { refresh } = useSettingsStore();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const response = await settingsApi.getAll();
      if (response.data.success) {
        const dbSettings: Setting[] = response.data.data;
        const settingsMap: Record<string, string> = { ...defaultSettings };
        dbSettings.forEach((s) => {
          settingsMap[s.key] = s.value;
        });
        setSettings(settingsMap);
      }
    } catch {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const settingsToSave = Object.entries(settings).map(([key, value]) => ({
        key,
        value,
        type: ['social', 'theme'].includes(key) ? 'json' : 'string',
        isPublic: true,
        description: `Site ${key}`,
      }));

      await settingsApi.bulkUpdate(
        settingsToSave.reduce((acc, s) => ({ ...acc, [s.key]: s }), {})
      );

      // Clear cache and refresh store to update all components
      clearSettingsStorage();
      await refresh();

      toast.success('Settings saved successfully');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const updateThemeColor = (colorKey: string, colorValue: string) => {
    try {
      const currentTheme = JSON.parse(settings.theme || '{}');
      const newTheme = { ...currentTheme, [colorKey]: colorValue };
      handleChange('theme', JSON.stringify(newTheme, null, 2));
    } catch {
      // ignore parse error
    }
  };

  const colorInput = (colorKey: string, label: string, value: string) => (
    <div className="flex items-center gap-3">
      <input
        type="color"
        value={value}
        onChange={(e) => updateThemeColor(colorKey, e.target.value)}
        className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0"
      />
      <div className="flex-1">
        <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
        <input
          type="text"
          value={value}
          onChange={(e) => updateThemeColor(colorKey, e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white"
        />
      </div>
    </div>
  );

  const inputField = (
    key: string,
    label: string,
    type: 'text' | 'email' | 'number' | 'textarea' = 'text',
    placeholder?: string,
    icon?: React.ReactNode
  ) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        {type === 'textarea' ? (
          <textarea
            value={settings[key] || ''}
            onChange={(e) => handleChange(key, e.target.value)}
            rows={3}
            placeholder={placeholder}
            className={`w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${icon ? 'pl-10' : ''}`}
          />
        ) : (
          <input
            type={type}
            value={settings[key] || ''}
            onChange={(e) => handleChange(key, e.target.value)}
            placeholder={placeholder}
            className={`w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${icon ? 'pl-10' : ''}`}
          />
        )}
      </div>
    </div>
  );

  const toggleField = (key: string, label: string, description?: string) => (
    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
        {description && (
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        )}
      </div>
      <button
        onClick={() => handleChange(key, settings[key] === 'true' ? 'false' : 'true')}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          settings[key] === 'true'
            ? 'bg-blue-600'
            : 'bg-gray-200 dark:bg-gray-600'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            settings[key] === 'true' ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  const theme = JSON.parse(settings.theme || '{}');

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Settings className="w-7 h-7 text-blue-600" />
              Store Settings
            </h1>
            <p className="text-gray-500 mt-1">Manage your store configuration and preferences</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 transition-all shadow-lg"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Tabs */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <nav className="flex flex-col">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                        activeTab === tab.id
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-r-2 border-blue-600'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              {/* General Tab */}
              {activeTab === 'general' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-2 mb-6">
                    <Store className="w-5 h-5 text-blue-600" />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">General Information</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {inputField('name', 'Store Name', 'text', 'Enter store name', <Store className="w-4 h-4" />)}
                    {inputField('tagline', 'Tagline', 'text', 'Your store tagline')}
                    <div className="md:col-span-2">
                      {inputField('description', 'Description', 'textarea', 'Describe your store')}
                    </div>
                    {inputField('email', 'Email Address', 'email', 'support@example.com', <Mail className="w-4 h-4" />)}
                    {inputField('phone', 'Phone Number', 'text', '+1 234 567 890', <Phone className="w-4 h-4" />)}
                    <div className="md:col-span-2">
                      {inputField('address', 'Address', 'textarea', 'Store address', <MapPin className="w-4 h-4" />)}
                    </div>
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <div className="flex items-center gap-2 mb-4">
                      <DollarSign className="w-5 h-5 text-green-600" />
                      <h3 className="text-md font-semibold text-gray-900 dark:text-white">Currency & Shipping</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {inputField('currency', 'Currency Symbol', 'text', '₹')}
                      {inputField('currencyCode', 'Currency Code', 'text', 'INR')}
                      {inputField('freeShippingThreshold', 'Free Shipping Threshold', 'number', '499', <Truck className="w-4 h-4" />)}
                    </div>
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Palette className="w-5 h-5 text-purple-600" />
                      <h3 className="text-md font-semibold text-gray-900 dark:text-white">Theme Colors</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {colorInput('primary', 'Primary Color', theme.primary || '#3b82f6')}
                      {colorInput('primaryDark', 'Primary Dark', theme.primaryDark || '#2563eb')}
                      {colorInput('primaryLight', 'Primary Light', theme.primaryLight || '#dbeafe')}
                      {colorInput('secondary', 'Secondary', theme.secondary || '#1e3a5f')}
                      {colorInput('background', 'Background', theme.background || '#f0f9ff')}
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Theme JSON (Advanced)
                      </label>
                      <textarea
                        value={settings.theme}
                        onChange={(e) => handleChange('theme', e.target.value)}
                        rows={5}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-mono bg-gray-50 dark:bg-gray-900"
                      />
                    </div>
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Link className="w-5 h-5 text-blue-600" />
                      <h3 className="text-md font-semibold text-gray-900 dark:text-white">Social Media Links</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Facebook className="w-5 h-5 text-blue-600" />
                        <input
                          type="url"
                          value={JSON.parse(settings.social || '{}').facebook || ''}
                          onChange={(e) => {
                            const social = JSON.parse(settings.social || '{}');
                            social.facebook = e.target.value;
                            handleChange('social', JSON.stringify(social, null, 2));
                          }}
                          placeholder="Facebook URL"
                          className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm"
                        />
                      </div>
                      <div className="flex items-center gap-3">
                        <Instagram className="w-5 h-5 text-pink-600" />
                        <input
                          type="url"
                          value={JSON.parse(settings.social || '{}').instagram || ''}
                          onChange={(e) => {
                            const social = JSON.parse(settings.social || '{}');
                            social.instagram = e.target.value;
                            handleChange('social', JSON.stringify(social, null, 2));
                          }}
                          placeholder="Instagram URL"
                          className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm"
                        />
                      </div>
                      <div className="flex items-center gap-3">
                        <Twitter className="w-5 h-5 text-sky-500" />
                        <input
                          type="url"
                          value={JSON.parse(settings.social || '{}').twitter || ''}
                          onChange={(e) => {
                            const social = JSON.parse(settings.social || '{}');
                            social.twitter = e.target.value;
                            handleChange('social', JSON.stringify(social, null, 2));
                          }}
                          placeholder="Twitter URL"
                          className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm"
                        />
                      </div>
                      <div className="flex items-center gap-3">
                        <Youtube className="w-5 h-5 text-red-600" />
                        <input
                          type="url"
                          value={JSON.parse(settings.social || '{}').youtube || ''}
                          onChange={(e) => {
                            const social = JSON.parse(settings.social || '{}');
                            social.youtube = e.target.value;
                            handleChange('social', JSON.stringify(social, null, 2));
                          }}
                          placeholder="YouTube URL"
                          className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Authentication Tab */}
              {activeTab === 'auth' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-2 mb-6">
                    <Shield className="w-5 h-5 text-blue-600" />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Authentication Settings</h2>
                  </div>

                  <div className="space-y-4">
                    {toggleField('enableRegistration', 'Enable User Registration', 'Allow new users to register on the site')}
                    {toggleField('requireEmailVerification', 'Require Email Verification', 'New users must verify their email before accessing the site')}
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Session Timeout (minutes)
                      </label>
                      <input
                        type="number"
                        value={settings.sessionTimeout || '60'}
                        onChange={(e) => handleChange('sessionTimeout', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Integrations Tab */}
              {activeTab === 'integrations' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-2 mb-6">
                    <Link className="w-5 h-5 text-blue-600" />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Third-party Integrations</h2>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <h3 className="font-medium text-gray-900 dark:text-white mb-2">Payment Gateway</h3>
                      <p className="text-sm text-gray-500 mb-4">Configure your payment provider settings</p>
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 p-3 rounded text-sm">
                        Payment gateway configuration coming soon
                      </div>
                    </div>
                    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <h3 className="font-medium text-gray-900 dark:text-white mb-2">Email Service</h3>
                      <p className="text-sm text-gray-500 mb-4">Configure email provider for notifications</p>
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 p-3 rounded text-sm">
                        Email service configuration coming soon
                      </div>
                    </div>
                    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <h3 className="font-medium text-gray-900 dark:text-white mb-2">SMS Gateway</h3>
                      <p className="text-sm text-gray-500 mb-4">Configure SMS provider for order notifications</p>
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 p-3 rounded text-sm">
                        SMS gateway configuration coming soon
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SEO Tab */}
              {activeTab === 'seo' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-2 mb-6">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">SEO & Analytics</h2>
                  </div>

                  <div className="space-y-4">
                    {inputField('metaTitle', 'Meta Title', 'text', 'ShriToys - Quality Toys for Children')}
                    {inputField('metaDescription', 'Meta Description', 'textarea', 'Brief description for search engines')}
                    {inputField('googleAnalyticsId', 'Google Analytics ID', 'text', 'G-XXXXXXXXXX')}
                  </div>
                </div>
              )}

              {/* Product Display Tab */}
              {activeTab === 'products' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-2 mb-6">
                    <Package className="w-5 h-5 text-blue-600" />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Product Display Settings</h2>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Low Stock Threshold
                      </label>
                      <input
                        type="number"
                        value={settings.lowStockThreshold || '5'}
                        onChange={(e) => handleChange('lowStockThreshold', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm"
                      />
                      <p className="text-xs text-gray-500 mt-1">Show low stock warning when inventory falls below this number</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Features Tab */}
              {activeTab === 'features' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-2 mb-6">
                    <Sparkles className="w-5 h-5 text-blue-600" />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Feature Toggles</h2>
                  </div>

                  <div className="space-y-4">
                    {toggleField('enableReviews', 'Product Reviews', 'Allow customers to leave reviews on products')}
                    {toggleField('enableWishlist', 'Wishlist Feature', 'Enable wishlist functionality for users')}
                    {toggleField('enableGuestCheckout', 'Guest Checkout', 'Allow checkout without creating an account')}
                  </div>
                </div>
              )}

              {/* Advanced Tab */}
              {activeTab === 'advanced' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-2 mb-6">
                    <Code className="w-5 h-5 text-blue-600" />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Advanced Settings</h2>
                  </div>

                  <div className="space-y-4">
                    {toggleField('maintenanceMode', 'Maintenance Mode', 'Put the site in maintenance mode (only admins can access)')}
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Cache Duration (seconds)
                      </label>
                      <input
                        type="number"
                        value={settings.cacheDuration || '3600'}
                        onChange={(e) => handleChange('cacheDuration', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
