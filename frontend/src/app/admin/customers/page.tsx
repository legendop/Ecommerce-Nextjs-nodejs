'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usersApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import { UserCircleIcon } from '@heroicons/react/24/outline';

interface User {
  id: string;
  name?: string;
  phone: string;
  email?: string;
  role: string;
  createdAt: string;
}

export default function AdminCustomersPage() {
  const router = useRouter();
  const { isAuthenticated, isAdmin } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) { router.push('/auth/login?returnUrl=/admin/customers'); return; }
    if (!isAdmin) { router.push('/'); return; }
    fetchUsers();
  }, [isAuthenticated, isAdmin, router]);

  const fetchUsers = async () => {
    try {
      const res = await usersApi.list({ limit: 100 });
      setUsers(res.data.data || []);
    } catch {
      toast.error('Failed to fetch customers');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-pink" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
            <p className="text-sm text-gray-400 mt-1">{users.length} registered customers</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-brand-pink-light rounded-full flex items-center justify-center">
                        <UserCircleIcon className="h-5 w-5 text-brand-pink" />
                      </div>
                      <span className="font-medium text-gray-900">{user.name || 'Unnamed'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{user.phone}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{user.email || '—'}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      user.role === 'ADMIN' ? 'bg-brand-pink-light text-brand-pink-dark' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{formatDate(user.createdAt)}</td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">No customers yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
