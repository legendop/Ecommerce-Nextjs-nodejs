'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { Button } from '@/components/ui/Button';
import { useSettingsStore } from '@/stores/settingsStore';

export default function OrderSuccessPage() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('order');
  const { config: siteConfig, initialize } = useSettingsStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-pink-light px-4">
      <div className="text-center max-w-md bg-white rounded-3xl shadow-lg p-10">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircleIcon className="h-12 w-12 text-green-500" />
        </div>

        <h1 className="text-2xl font-bold text-brand-purple mb-2">Order Placed!</h1>
        <p className="text-gray-400 mb-6">
          Thank you for shopping with {siteConfig.name}. We&apos;ll notify you once your order is on its way.
        </p>

        {orderNumber && (
          <div className="bg-brand-pink-light rounded-2xl px-5 py-3 mb-8 inline-block">
            <p className="text-sm text-gray-500">Order Number</p>
            <p className="text-lg font-bold text-brand-pink">{orderNumber}</p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <Link href="/orders">
            <Button variant="pink" fullWidth>View My Orders</Button>
          </Link>
          <Link href="/products">
            <Button variant="secondary" fullWidth>Continue Shopping</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
