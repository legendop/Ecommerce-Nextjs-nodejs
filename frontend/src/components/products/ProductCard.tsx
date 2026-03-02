'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/types';
import { formatPrice, calculateDiscount } from '@/lib/utils';
import { useCart } from '@/hooks/useCart';
import toast from 'react-hot-toast';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Add with first active listing
    const listings = product.listings || product.items || [];
    const activeListings = listings.filter((l: { isActive?: boolean; stock?: number }) => l.isActive !== false && (l.stock || 0) > 0);
    const firstListing = activeListings[0] || listings[0];
    addToCart(product, 1, firstListing);
    toast.success(`${product.name} added to cart`);
  };

  // Handle listing-based product structure
  const listings = product.listings || product.items || [];
  const activeListings = listings.filter((l: { isActive?: boolean; stock?: number }) => l.isActive !== false && (l.stock || 0) > 0);
  const firstListing = activeListings[0] || listings[0];

  // Get price from listing
  const price = firstListing?.price ?? product.price ?? 0;
  const stock = activeListings.reduce((sum: number, l: { stock?: number }) => sum + (l.stock || 0), 0) || product.totalStock || product.stock || 0;
  const comparePrice = firstListing?.discountAmount
    ? Number(price) + Number(firstListing.discountAmount)
    : product.comparePrice ?? product.compareAtPrice ?? null;
  const discount = comparePrice
    ? calculateDiscount(Number(comparePrice), Number(price))
    : 0;

  // Get image from firstImage or images array
  const imageUrl = product.firstImage || product.images?.[0]?.imageUrl || product.imageUrl;

  return (
    <div className="card group flex flex-col">
      <Link href={`/product/${product.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-brand-pink-light">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl">
              🧸
            </div>
          )}
          {discount > 0 && (
            <div className="absolute top-3 left-3 bg-brand-pink text-white text-xs font-bold px-2.5 py-1 rounded-full shadow">
              {discount}% OFF
            </div>
          )}
          {stock <= 0 && (
            <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
              <span className="bg-gray-700 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                Out of Stock
              </span>
            </div>
          )}
        </div>
      </Link>

      <div className="p-4 flex flex-col flex-1">
        <Link href={`/product/${product.slug}`}>
          <h3 className="font-semibold text-brand-purple mb-1 line-clamp-2 hover:text-brand-pink transition-colors text-sm leading-snug">
            {product.name}
          </h3>
        </Link>

        <div className="flex items-baseline gap-2 mt-auto pt-3">
          <span className="text-lg font-bold text-brand-purple">
            {formatPrice(price)}
          </span>
          {comparePrice && (
            <span className="text-sm text-gray-400 line-through">
              {formatPrice(Number(comparePrice))}
            </span>
          )}
        </div>

        <button
          onClick={handleAddToCart}
          disabled={stock <= 0}
          className="w-full mt-3 btn-pink text-sm py-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {stock > 0 ? '+ Add to Cart' : 'Out of Stock'}
        </button>
      </div>
    </div>
  );
}
