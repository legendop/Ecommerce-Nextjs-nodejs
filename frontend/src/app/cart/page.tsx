'use client';

import Image from 'next/image';
import Link from 'next/link';
import { TrashIcon, ShoppingCartIcon } from '@heroicons/react/24/outline';
import { useCart } from '@/hooks/useCart';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

export default function CartPage() {
  const { items, updateQuantity, removeItem, subtotal } = useCart();

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-24 h-24 bg-brand-pink-light rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingCartIcon className="h-12 w-12 text-brand-pink" />
          </div>
          <h1 className="text-2xl font-bold text-brand-purple mb-2">Your cart is empty</h1>
          <p className="text-gray-400 mb-8">Looks like you have not added anything yet.</p>
          <Link href="/products">
            <Button variant="pink" size="lg">Continue Shopping</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold text-brand-purple mb-8">Shopping Cart</h1>

      <div className="lg:grid lg:grid-cols-12 lg:gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-8 space-y-4">
          {items.map((item) => (
            <div key={item.productId} className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
              <div className="relative w-20 h-20 bg-brand-pink-light rounded-xl overflow-hidden shrink-0">
                {item.imageUrl ? (
                  <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">🧸</div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-brand-purple truncate">{item.name}</h3>
                <p className="text-brand-pink font-medium">{formatPrice(item.price)}</p>
              </div>

              <div className="flex items-center gap-1 border border-gray-200 rounded-full px-1">
                <button
                  onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                  className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-brand-pink-light text-brand-purple font-bold"
                >
                  −
                </button>
                <span className="w-7 text-center text-sm font-semibold text-brand-purple">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                  disabled={item.quantity >= item.stock}
                  className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-brand-pink-light text-brand-purple font-bold disabled:opacity-30"
                >
                  +
                </button>
              </div>

              <div className="text-right min-w-[80px]">
                <p className="font-bold text-brand-purple">{formatPrice(item.total)}</p>
              </div>

              <button
                onClick={() => removeItem(item.productId)}
                className="p-2 text-gray-300 hover:text-red-400 transition-colors"
              >
                <TrashIcon className="w-5 h-5" />
              </button>
            </div>
          ))}

          <div className="mt-4">
            <Link href="/products" className="text-brand-pink hover:underline text-sm font-medium">
              ← Continue Shopping
            </Link>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-4 mt-8 lg:mt-0">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-24">
            <h2 className="text-lg font-bold text-brand-purple mb-5">Order Summary</h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal ({items.reduce((a, i) => a + i.quantity, 0)} items)</span>
                <span className="text-brand-purple font-medium">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Shipping</span>
                <span className="text-green-600 font-medium">Calculated at checkout</span>
              </div>
            </div>

            <div className="border-t border-gray-100 mt-4 pt-4">
              <div className="flex justify-between text-lg font-bold text-brand-purple">
                <span>Total</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
            </div>

            <Link href="/checkout" className="block mt-5">
              <Button variant="pink" fullWidth size="lg">Proceed to Checkout</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
