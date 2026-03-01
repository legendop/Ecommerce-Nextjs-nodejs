'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Product } from '@/types';
import { formatPrice, calculateDiscount } from '@/lib/utils';
import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ShoppingCartIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface ProductDetailsProps {
  product: Product;
}

export function ProductDetails({ product }: ProductDetailsProps) {
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();

  const price = product.price ?? 0;
  const stock = product.stock ?? 0;
  const comparePrice = product.comparePrice ?? product.compareAtPrice ?? null;
  const discount = comparePrice
    ? calculateDiscount(Number(comparePrice), price)
    : 0;

  const handleAddToCart = () => {
    addToCart(product, quantity);
    toast.success(`${product.name} added to cart`);
  };

  return (
    <div className="lg:grid lg:grid-cols-2 lg:gap-12">
      {/* Image */}
      <div className="relative aspect-square bg-brand-pink-light rounded-3xl overflow-hidden">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-8xl">🧸</div>
        )}
        {discount > 0 && (
          <div className="absolute top-4 left-4">
            <Badge variant="pink" size="md">{discount}% OFF</Badge>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="mt-8 lg:mt-0">
        {product.category && (
          <p className="text-sm text-brand-pink font-semibold uppercase tracking-wider mb-2">
            {product.category.name}
          </p>
        )}

        <h1 className="text-3xl font-bold text-brand-purple leading-tight">{product.name}</h1>

        <div className="mt-4 flex items-baseline gap-3">
          <span className="text-3xl font-bold text-brand-purple">
            {formatPrice(price)}
          </span>
          {comparePrice && (
            <>
              <span className="text-lg text-gray-400 line-through">
                {formatPrice(Number(comparePrice))}
              </span>
              <Badge variant="success" size="md">{discount}% off</Badge>
            </>
          )}
        </div>

        <div className="mt-4">
          <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
            <span className={`w-2 h-2 rounded-full ${stock > 0 ? 'bg-green-500' : 'bg-red-500'}`} />
            {stock > 0 ? `In Stock (${stock} available)` : 'Out of Stock'}
          </span>
        </div>

        {(product.description || product.shortDescription) && (
          <div className="mt-6 text-gray-500 text-sm leading-relaxed border-t border-gray-100 pt-6">
            {product.description || product.shortDescription}
          </div>
        )}

        {stock > 0 && (
          <div className="mt-8 flex items-center gap-4">
            <div className="flex items-center border-2 border-gray-200 rounded-full overflow-hidden">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-4 py-2 hover:bg-brand-pink-light text-brand-purple font-bold text-lg transition-colors"
              >
                −
              </button>
              <span className="px-4 py-2 w-12 text-center font-bold text-brand-purple">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(stock, quantity + 1))}
                className="px-4 py-2 hover:bg-brand-pink-light text-brand-purple font-bold text-lg transition-colors"
              >
                +
              </button>
            </div>

            <Button
              variant="pink"
              onClick={handleAddToCart}
              size="lg"
              icon={<ShoppingCartIcon className="h-5 w-5" />}
              className="flex-1"
            >
              Add to Cart
            </Button>
          </div>
        )}

        {/* Trust badges */}
        <div className="mt-8 grid grid-cols-3 gap-3">
          {[
            { icon: '🚚', text: 'Free Delivery' },
            { icon: '↩️', text: 'Easy Returns' },
            { icon: '🛡️', text: 'Safe & Secure' },
          ].map((b) => (
            <div key={b.text} className="bg-brand-pink-light rounded-2xl p-3 text-center">
              <span className="text-xl">{b.icon}</span>
              <p className="text-xs text-gray-500 mt-1">{b.text}</p>
            </div>
          ))}
        </div>

        {product.sku && (
          <p className="mt-6 text-xs text-gray-400">SKU: {product.sku}</p>
        )}
      </div>
    </div>
  );
}
