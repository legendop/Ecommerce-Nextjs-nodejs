'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useSettingsStore } from '@/stores/settingsStore';
import {
  Squares2X2Icon,
  CubeIcon,
  ShoppingBagIcon,
  UsersIcon,
  Cog6ToothIcon,
  BuildingStorefrontIcon,
  ArrowLeftOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  ShoppingCartIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/admin', icon: Squares2X2Icon },
  { name: 'Products', href: '/admin/products', icon: CubeIcon },
  { name: 'Catalogs', href: '/admin/catalogs', icon: ShoppingCartIcon },
  { name: 'Categories', href: '/admin/categories', icon: BuildingStorefrontIcon },
  { name: 'Orders', href: '/admin/orders', icon: ShoppingBagIcon },
  { name: 'Customers', href: '/admin/customers', icon: UsersIcon },
  { name: 'Reviews', href: '/admin/reviews', icon: EyeIcon },
  { name: 'Settings', href: '/admin/settings', icon: Cog6ToothIcon },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { logout } = useAuth();
  const { config: siteConfig, initialize } = useSettingsStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  const primaryColor = siteConfig?.theme?.primary || '#3b82f6';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-900/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-gray-900 text-white transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-800">
          <Link href="/admin" className="text-xl font-bold">
            Admin Panel
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-md hover:bg-gray-800"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <nav className="px-4 py-4 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
                style={isActive ? { backgroundColor: primaryColor } : undefined}
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800">
          <Link
            href="/"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <BuildingStorefrontIcon className="h-5 w-5" />
            View Store
          </Link>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors mt-1"
          >
            <ArrowLeftOnRectangleIcon className="h-5 w-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white shadow-sm">
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-md hover:bg-gray-100"
              >
                <Bars3Icon className="h-5 w-5" />
              </button>
              <h1 className="text-lg font-semibold text-gray-900 hidden sm:block">
                {navigation.find((n) => pathname?.startsWith(n.href))?.name || 'Dashboard'}
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="hidden sm:flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                <BuildingStorefrontIcon className="h-4 w-4" />
                Preview Store
              </Link>
              <div className="h-4 w-px bg-gray-200 hidden sm:block" />
              <div className="flex items-center gap-2">
                <div
                className="h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                style={{ backgroundColor: primaryColor }}
              >
                  A
                </div>
                <span className="text-sm font-medium text-gray-700 hidden md:block">Admin</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
