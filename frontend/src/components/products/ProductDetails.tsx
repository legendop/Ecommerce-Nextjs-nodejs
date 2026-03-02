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
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
  const { addToCart } = useCart();

  // Handle listing-based structure
  const listings = product.listings || product.items || [];
  const activeListings = listings.filter((l: { isActive?: boolean; stock?: number }) => l.isActive !== false);

  // Get selected or first available listing
  const selectedListing = activeListings.find((l: { id?: string }) => l.id?.toString() === selectedListingId)
    || activeListings.find((l: { stock?: number }) => (l.stock || 0) > 0)
    || activeListings[0];

  const price = selectedListing?.price ?? product.price ?? 0;
  const stock = selectedListing?.stock ?? product.stock ?? 0;
  const comparePrice = selectedListing?.discountAmount
    ? Number(price) + Number(selectedListing.discountAmount)
    : product.comparePrice ?? product.compareAtPrice ?? null;
  const discount = comparePrice
    ? calculateDiscount(Number(comparePrice), Number(price))
    : 0;

  // Get all images or fallback
  const images = product.images?.length > 0
    ? product.images.map((img: { imageUrl: string }) => img.imageUrl)
    : product.imageUrl
      ? [product.imageUrl]
      : [];

  const [selectedImage, setSelectedImage] = useState(images[0] || '');

  const handleAddToCart = () => {
    // Add listingId to the product for cart
    const productWithListing = selectedListing
      ? { ...product, listingId: selectedListing.id, price: selectedListing.price }
      : product;
    addToCart(productWithListing, quantity);
    toast.success(`${product.name} added to cart`);
  };

  return (
    <div className="lg:grid lg:grid-cols-2 lg:gap-12">
      {/* Images */}
      <div>
        <div className="relative aspect-square bg-brand-pink-light rounded-3xl overflow-hidden">
          {selectedImage ? (
            <Image
              src={selectedImage}
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
        {/* Thumbnail Gallery */}
        {images.length > 1 && (
          <div className="flex gap-2 mt-4 overflow-x-auto">
            {images.map((img: string, idx: number) => (
              <button
                key={idx}
                onClick={() => setSelectedImage(img)}
                className={`relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors ${
                  selectedImage === img ? 'border-brand-pink' : 'border-transparent hover:border-gray-300'
                }`}
              >
                <Image src={img} alt={`${product.name} ${idx + 1}`} fill className="object-cover" />
              </button>
            ))}
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

        {/* Size Selection */}
        {activeListings.length > 1 && (
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Size/Variant
            </label>
            <div className="flex flex-wrap gap-2">
              {activeListings.map((listing: { id?: string; size?: string; price?: number; stock?: number }) => (
                <button
                  key={listing.id}
                  onClick={() => setSelectedListingId(listing.id?.toString() || null)}
                  disabled={(listing.stock || 0) <= 0}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    selectedListing?.id === listing.id
                      ? 'bg-brand-pink text-white border-brand-pink'
                      : (listing.stock || 0) > 0
                        ? 'bg-white text-gray-700 border-gray-300 hover:border-brand-pink'
                        : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                  }`}
                >
                  {listing.size || 'Default'}
                  <span className="ml-1 text-xs opacity-80">
                    ({formatPrice(listing.price || 0)})
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

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

        {selectedListing?.skuCode && (
          <p className="mt-6 text-xs text-gray-400">SKU: {selectedListing.skuCode}</p>
        )}
      </div>
    </div>
  );
}
