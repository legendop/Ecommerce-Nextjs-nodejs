'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSettingsStore } from '@/stores/settingsStore';

export function Footer() {
  const currentYear = new Date().getFullYear();
  const [isMounted, setIsMounted] = useState(false);
  const { config: siteConfig, initialize } = useSettingsStore();

  useEffect(() => {
    setIsMounted(true);
    initialize();
  }, [initialize]);

  return (
    <footer className="bg-brand-purple text-white">
      {/* Top wave decoration */}
      <div className="bg-brand-pink-light h-6 rounded-b-[50%]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-1">
            <h3 className="text-2xl font-bold mb-2">
              {!isMounted ? 'ShriToys' : (siteConfig?.name || 'ShriToys').split(' ').map((word, i, arr) => (
                <span key={i}>
                  {i === arr.length - 1 ? (
                    <span className="text-brand-pink">{word}</span>
                  ) : (
                    word
                  )}
                </span>
              ))}
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">
              {!isMounted ? 'Bringing joy and imagination to children everywhere.' : (siteConfig?.description || 'Bringing joy and imagination to children everywhere.')}
            </p>
            <div className="flex gap-3">
              {['📘', '📸', '🐦', '▶️'].map((icon, i) => (
                <button key={i} className="w-8 h-8 rounded-full bg-white/10 hover:bg-brand-pink transition-colors flex items-center justify-center text-sm">
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4 text-brand-pink">Quick Links</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/" className="hover:text-brand-pink transition-colors">Home</Link></li>
              <li><Link href="/products" className="hover:text-brand-pink transition-colors">Shop All</Link></li>
              <li><Link href="/categories" className="hover:text-brand-pink transition-colors">Categories</Link></li>
              <li><Link href="/products?sale=true" className="hover:text-brand-pink transition-colors">Sale</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold mb-4 text-brand-pink">Support</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/contact" className="hover:text-brand-pink transition-colors">Contact Us</Link></li>
              <li><Link href="/faq" className="hover:text-brand-pink transition-colors">FAQ</Link></li>
              <li><Link href="/shipping" className="hover:text-brand-pink transition-colors">Shipping Info</Link></li>
              <li><Link href="/returns" className="hover:text-brand-pink transition-colors">Returns & Refunds</Link></li>
            </ul>
          </div>

          {/* Contact & Newsletter */}
          <div>
            <h4 className="font-semibold mb-4 text-brand-pink">Stay in Touch</h4>
            <ul className="space-y-2 text-sm text-gray-400 mb-4">
              <li className="flex items-center gap-2">
                <span>📧</span>
                <span>{siteConfig?.email || 'support@shritoys.com'}</span>
              </li>
              <li className="flex items-center gap-2">
                <span>📞</span>
                <span>{siteConfig?.phone || '+91 9876543210'}</span>
              </li>
            </ul>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Your email"
                className="flex-1 min-w-0 px-3 py-2 rounded-full text-sm bg-white/10 text-white placeholder-gray-500 border border-white/10 focus:outline-none focus:border-brand-pink"
              />
              <button className="px-4 py-2 bg-brand-pink rounded-full text-sm font-medium hover:bg-brand-pink-dark transition-colors whitespace-nowrap">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <p>&copy; {currentYear} {siteConfig?.name || 'ShriToys'}. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-brand-pink transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-brand-pink transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
