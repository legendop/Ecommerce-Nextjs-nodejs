'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { analyticsApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useSettingsStore } from '@/stores/settingsStore';
import { formatPrice } from '@/lib/utils';
import { DashboardStats } from '@/types';
import {
  ShoppingBagIcon,
  UsersIcon,
  CurrencyRupeeIcon,
  EyeIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { isAuthenticated, isAdmin } = useAuth();
  const { config: siteConfig, initialize } = useSettingsStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const primaryColor = siteConfig?.theme?.primary || '#3b82f6';

  const fetchStats = async () => {
    try {
      const response = await analyticsApi.getDashboard();
      setStats(response.data.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initialize();
    if (!isAuthenticated) {
      router.push('/auth/login?returnUrl=/admin');
      return;
    }
    if (!isAdmin) {
      router.push('/');
      return;
    }
    fetchStats();
  }, [isAuthenticated, isAdmin, router]);

  if (isLoading || !stats) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div
            className="animate-spin rounded-full h-12 w-12 border-b-2"
            style={{ borderColor: primaryColor }}
          ></div>
        </div>
      </AdminLayout>
    );
  }

  const statCards = [
    {
      name: 'Total Revenue',
      value: formatPrice(Number(stats.totalRevenue)),
      icon: CurrencyRupeeIcon,
      change: '+12%',
      changeType: 'positive' as const,
      href: '/admin/orders',
    },
    {
      name: 'Total Orders',
      value: stats.totalOrders.toString(),
      icon: ShoppingBagIcon,
      change: '+8%',
      changeType: 'positive' as const,
      href: '/admin/orders',
    },
    {
      name: 'Total Customers',
      value: stats.totalUsers.toString(),
      icon: UsersIcon,
      change: '+24%',
      changeType: 'positive' as const,
      href: '/admin/customers',
    },
    {
      name: 'Store Visits',
      value: stats.totalVisits.toString(),
      icon: EyeIcon,
      change: '-2%',
      changeType: 'negative' as const,
      href: '/admin/analytics',
    },
  ];

  return (
    <AdminLayout>
      {/* Welcome Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Welcome back!</h2>
        <p className="text-gray-600">Here&apos;s what&apos;s happening with your store today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card) => (
          <Link
            key={card.name}
            href={card.href}
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{card.name}</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{card.value}</p>
                <div className="mt-2 flex items-center text-sm">
                  {card.changeType === 'positive' ? (
                    <ArrowUpIcon className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <ArrowDownIcon className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span
                    className={
                      card.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                    }
                  >
                    {card.change}
                  </span>
                  <span className="text-gray-500 ml-2">vs last month</span>
                </div>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: `${primaryColor}10` }}>
                <card.icon className="h-6 w-6" style={{ color: primaryColor }} />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Today's Stats */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Today&apos;s Overview</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Orders</p>
                <p className="text-2xl font-bold text-gray-900">{stats.todayOrders}</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatPrice(Number(stats.todayRevenue))}
                </p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Visits</p>
                <p className="text-2xl font-bold text-gray-900">{stats.todayVisits}</p>
              </div>
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Top Selling Products</h3>
              <Link
                href="/admin/products"
                className="text-sm hover:opacity-80"
                style={{ color: primaryColor }}
              >
                View all
              </Link>
            </div>
            <div className="divide-y divide-gray-100">
              {stats.topProducts.map((product, index) => (
                <div key={product.productId} className="py-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600 font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{product.productName}</p>
                      <p className="text-sm text-gray-500">{product.totalSold} units sold</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">
                      {formatPrice(Number(product.totalSold) * 100)}
                    </p>
                  </div>
                </div>
              ))}
              {stats.topProducts.length === 0 && (
                <p className="py-8 text-center text-gray-500">No sales data yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link
                href="/admin/products/new"
                className="flex items-center gap-3 p-3 rounded-lg transition-colors"
                style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = `${primaryColor}25`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = `${primaryColor}15`;
                }}
              >
                <ShoppingBagIcon className="h-5 w-5" />
                <span className="font-medium">Add New Product</span>
              </Link>
              <Link
                href="/admin/catalogs/new"
                className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <ShoppingBagIcon className="h-5 w-5" />
                <span className="font-medium">Create Catalog</span>
              </Link>
              <Link
                href="/admin/categories/new"
                className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <EyeIcon className="h-5 w-5" />
                <span className="font-medium">Add Category</span>
              </Link>
              <Link
                href="/"
                className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <EyeIcon className="h-5 w-5" />
                <span className="font-medium">Preview Store</span>
              </Link>
            </div>
          </div>

          {/* Order Status */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Status</h3>
            <div className="space-y-3">
              {Object.entries(stats.orderStatusCounts || {}).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{status}</span>
                  <span className="px-2 py-1 text-xs font-medium bg-gray-100 rounded-full">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
