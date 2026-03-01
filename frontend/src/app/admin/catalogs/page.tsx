'use client';

import { AdminLayout } from '@/components/admin/AdminLayout';

export default function AdminCatalogsPage() {
  return (
    <AdminLayout>
      <div className="flex flex-col items-center justify-center h-96">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Catalogs</h1>
        <p className="text-gray-600">Catalog management coming soon.</p>
        <p className="text-sm text-gray-500 mt-2">
          Use Products page for now to manage items.
        </p>
      </div>
    </AdminLayout>
  );
}
