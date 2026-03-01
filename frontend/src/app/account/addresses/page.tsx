'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { addressesApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  HomeIcon,
  BuildingOfficeIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';

interface Address {
  id: string;
  label?: string;
  name?: string;
  phone?: string;
  line1: string;
  line2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country: string;
  isDefault: boolean;
}

const emptyForm = {
  label: '',
  name: '',
  phone: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  pincode: '',
  country: 'India',
  isDefault: false,
};

export default function AddressesPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login?returnUrl=/account/addresses');
      return;
    }
    fetchAddresses();
  }, [isAuthenticated, router]);

  const fetchAddresses = async () => {
    try {
      const response = await addressesApi.list();
      setAddresses(response.data.data || []);
    } catch {
      toast.error('Failed to fetch addresses');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAddress) {
        await addressesApi.update(editingAddress.id, formData);
        toast.success('Address updated');
      } else {
        await addressesApi.create(formData);
        toast.success('Address added');
      }
      setShowForm(false);
      setEditingAddress(null);
      setFormData(emptyForm);
      fetchAddresses();
    } catch {
      toast.error('Failed to save address');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this address?')) return;
    try {
      await addressesApi.delete(id);
      toast.success('Address deleted');
      fetchAddresses();
    } catch {
      toast.error('Failed to delete address');
    }
  };

  const openEditForm = (address: Address) => {
    setEditingAddress(address);
    setFormData({
      label: address.label || '',
      name: address.name || '',
      phone: address.phone || '',
      line1: address.line1,
      line2: address.line2 || '',
      city: address.city || '',
      state: address.state || '',
      pincode: address.pincode || '',
      country: address.country,
      isDefault: address.isDefault,
    });
    setShowForm(true);
  };

  const getAddressIcon = (label?: string) => {
    if (label?.toLowerCase().includes('office')) return <BuildingOfficeIcon className="h-5 w-5 text-brand-pink" />;
    if (label?.toLowerCase().includes('home')) return <HomeIcon className="h-5 w-5 text-brand-pink" />;
    return <MapPinIcon className="h-5 w-5 text-brand-pink" />;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" color="pink" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-brand-purple">My Addresses</h1>
        <Button
          variant="pink"
          icon={<PlusIcon className="h-4 w-4" />}
          onClick={() => { setEditingAddress(null); setFormData(emptyForm); setShowForm(true); }}
        >
          Add Address
        </Button>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="px-6 py-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-brand-purple">
                {editingAddress ? 'Edit Address' : 'Add New Address'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Label (Home / Office)"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  placeholder="Home"
                />
                <Input
                  label="Full Name *"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
                <Input
                  label="Phone *"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
                <div className="col-span-2">
                  <Input
                    label="Address Line 1 *"
                    value={formData.line1}
                    onChange={(e) => setFormData({ ...formData, line1: e.target.value })}
                    required
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    label="Address Line 2"
                    value={formData.line2}
                    onChange={(e) => setFormData({ ...formData, line2: e.target.value })}
                  />
                </div>
                <Input
                  label="City *"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  required
                />
                <Input
                  label="State *"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  required
                />
                <Input
                  label="PIN Code *"
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                  required
                />
                <Input
                  label="Country *"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  required
                />
                <div className="col-span-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isDefault}
                      onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                      className="rounded border-gray-300 text-brand-pink focus:ring-brand-pink"
                    />
                    <span className="text-sm text-brand-purple font-medium">Set as default address</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => { setShowForm(false); setEditingAddress(null); setFormData(emptyForm); }}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="pink">
                  {editingAddress ? 'Update' : 'Save'} Address
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Address List */}
      {addresses.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-gray-100">
          <div className="w-16 h-16 bg-brand-pink-light rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPinIcon className="h-8 w-8 text-brand-pink" />
          </div>
          <h3 className="text-lg font-semibold text-brand-purple mb-1">No addresses saved</h3>
          <p className="text-gray-400 text-sm mb-5">Add an address to make checkout faster</p>
          <Button variant="pink" onClick={() => setShowForm(true)}>Add Address</Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {addresses.map((address) => (
            <div
              key={address.id}
              className={`bg-white rounded-2xl border-2 p-5 ${
                address.isDefault ? 'border-brand-pink' : 'border-gray-100'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-brand-pink-light rounded-xl shrink-0">
                    {getAddressIcon(address.label)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-brand-purple">{address.label || 'Address'}</h3>
                      {address.isDefault && (
                        <span className="text-xs bg-brand-pink text-white px-2 py-0.5 rounded-full">Default</span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-brand-purple">{address.name}</p>
                    <p className="text-sm text-gray-400">{address.phone}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {address.line1}{address.line2 && `, ${address.line2}`}
                    </p>
                    <p className="text-sm text-gray-500">
                      {address.city}, {address.state} - {address.pincode}
                    </p>
                    <p className="text-sm text-gray-500">{address.country}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditForm(address)}
                    className="p-2 text-gray-300 hover:text-brand-pink transition-colors"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(address.id)}
                    className="p-2 text-gray-300 hover:text-red-400 transition-colors"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
