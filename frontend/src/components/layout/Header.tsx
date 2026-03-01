'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingCartIcon, UserIcon, Bars3Icon, XMarkIcon, BuildingStorefrontIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { useSettingsStore } from '@/stores/settingsStore';

export function Header() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const { totalItems } = useCart();
  const { config: siteConfig, initialize } = useSettingsStore();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  useEffect(() => {
    setIsMounted(true);
    initialize();
  }, [initialize]);

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Shop All', href: '/products' },
    { name: 'Categories', href: '/categories' },
  ];

  return (
    <div className="sticky top-0 z-50">
      {/* Announcement Bar */}
      <div className="announcement-bar text-white text-center py-2 text-sm font-medium px-4 overflow-hidden">
        <span className="inline-flex items-center gap-6">
          <span>🎉 Free Shipping on Orders Above {siteConfig?.currency || '₹'}{siteConfig?.freeShippingThreshold || 499}</span>
          <span className="hidden sm:inline">✨ New Arrivals Every Week</span>
          <span className="hidden md:inline">🎁 Gift Wrapping Available</span>
        </span>
      </div>

      {/* Main Header */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-label="Top">
          <div className="flex items-center justify-between h-16">
            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 text-brand-purple hover:text-brand-pink"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>

            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center gap-2">
                <span className="text-2xl font-bold text-brand-purple tracking-tight">
                  {!isMounted ? 'ShriToys' : (
                    <>
                      {(siteConfig?.name || 'ShriToys').split(' ').slice(0, -1).join(' ')}
                      <span className="text-brand-pink">
                        {(siteConfig?.name || 'ShriToys').split(' ').slice(-1)}
                      </span>
                    </>
                  )}
                </span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-brand-purple hover:text-brand-pink font-medium text-sm transition-colors"
                >
                  {item.name}
                </Link>
              ))}
            </div>

            {/* Right side icons */}
            <div className="flex items-center space-x-2">
              {/* Search */}
              <button className="p-2 text-brand-purple hover:text-brand-pink transition-colors">
                <MagnifyingGlassIcon className="h-5 w-5" />
              </button>

              {/* Admin Toggle */}
              {isAuthenticated && user?.role === 'ADMIN' && (
                <Link
                  href="/admin"
                  className="hidden sm:flex items-center gap-1 px-3 py-1.5 bg-brand-purple text-white text-sm font-medium rounded-full hover:bg-brand-pink-dark transition-colors"
                >
                  <BuildingStorefrontIcon className="h-4 w-4" />
                  Admin
                </Link>
              )}

              {/* Cart */}
              <Link href="/cart" className="relative p-2 text-brand-purple hover:text-brand-pink transition-colors">
                <ShoppingCartIcon className="h-5 w-5" />
                {isMounted && totalItems > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-brand-pink text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-bold">
                    {totalItems}
                  </span>
                )}
              </Link>

              {/* User */}
              {isAuthenticated ? (
                <div className="relative group">
                  <button className="p-2 text-brand-purple hover:text-brand-pink transition-colors">
                    <UserIcon className="h-5 w-5" />
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-lg py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all border border-gray-100">
                    <Link href="/account" className="block px-4 py-2 text-sm text-brand-purple hover:bg-brand-pink-light hover:text-brand-pink-dark">
                      My Account
                    </Link>
                    <Link href="/orders" className="block px-4 py-2 text-sm text-brand-purple hover:bg-brand-pink-light hover:text-brand-pink-dark">
                      My Orders
                    </Link>
                    {user?.role === 'ADMIN' && (
                      <Link href="/admin" className="block px-4 py-2 text-sm text-brand-purple hover:bg-brand-pink-light hover:text-brand-pink-dark">
                        Admin Dashboard
                      </Link>
                    )}
                    <hr className="my-1 border-gray-100" />
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              ) : (
                <Link href="/auth/login" className="p-2 text-brand-purple hover:text-brand-pink transition-colors">
                  <UserIcon className="h-5 w-5" />
                </Link>
              )}
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-100">
              <div className="flex flex-col space-y-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="px-4 py-2 text-brand-purple hover:text-brand-pink hover:bg-brand-pink-light rounded-lg font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </nav>
      </header>
    </div>
  );
}
