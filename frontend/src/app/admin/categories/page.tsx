'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { categoriesApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Category } from '@/types';
import toast from 'react-hot-toast';
import { PlusIcon, PencilIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { generateSlug } from '@/lib/utils';

export default function AdminCategoriesPage() {
  const router = useRouter();
  const { isAuthenticated, isAdmin } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ name: '', slug: '', description: '' });

  useEffect(() => {
    if (!isAuthenticated) { router.push('/auth/login?returnUrl=/admin/categories'); return; }
    if (!isAdmin) { router.push('/'); return; }
    fetchCategories();
  }, [isAuthenticated, isAdmin, router]);

  const fetchCategories = async () => {
    try {
      const res = await categoriesApi.list();
      setCategories(res.data.data || []);
    } catch {
      toast.error('Failed to fetch categories');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({ ...prev, name, slug: editingCategory ? prev.slug : generateSlug(name) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await categoriesApi.update(editingCategory.id, formData);
        toast.success('Category updated');
      } else {
        await categoriesApi.create(formData);
        toast.success('Category created');
      }
      setShowModal(false);
      setEditingCategory(null);
      setFormData({ name: '', slug: '', description: '' });
      fetchCategories();
    } catch {
      toast.error('Failed to save category');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this category?')) return;
    try {
      await categoriesApi.delete(id);
      toast.success('Category deleted');
      fetchCategories();
    } catch {
      toast.error('Failed to delete category');
    }
  };

  const openEdit = (cat: Category) => {
    setEditingCategory(cat);
    setFormData({ name: cat.name, slug: cat.slug, description: cat.description || '' });
    setShowModal(true);
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
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <Button
            variant="pink"
            icon={<PlusIcon className="h-4 w-4" />}
            onClick={() => { setEditingCategory(null); setFormData({ name: '', slug: '', description: '' }); setShowModal(true); }}
          >
            Add Category
          </Button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Slug</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Products</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{cat.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{cat.slug}</td>
                  <td className="px-6 py-4 text-right text-sm text-gray-500">{cat.productCount || 0}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => openEdit(cat)} className="text-gray-400 hover:text-brand-pink mr-3 transition-colors">
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button onClick={() => handleDelete(cat.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-400">No categories yet</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl max-w-md w-full shadow-xl">
              <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">{editingCategory ? 'Edit Category' : 'Add Category'}</h2>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                <Input
                  label="Name *"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                />
                <Input
                  label="Slug *"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  required
                />
                <div>
                  <label className="block text-sm font-medium text-brand-purple mb-1.5">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="block w-full rounded-2xl border border-gray-200 px-4 py-2.5 text-sm text-brand-purple focus:outline-none focus:ring-2 focus:ring-brand-pink focus:border-brand-pink"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
                  <Button type="submit" variant="pink">{editingCategory ? 'Update' : 'Create'}</Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
