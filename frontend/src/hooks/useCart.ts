'use client';

import { useCartStore } from '@/stores/cartStore';
import { Product } from '@/types';
import { useMemo } from 'react';

export function useCart() {
  // Subscribe to the store - this ensures re-renders when items change
  const items = useCartStore((state) => state.items);
  const addItem = useCartStore((state) => state.addItem);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const clearCart = useCartStore((state) => state.clearCart);

  const addToCart = (product: Product, quantity = 1, listing?: { id?: string; price?: number; stock?: number }) => {
    addItem({
      productId: product.id,
      listingId: product.listingId || listing?.id,
      name: product.name,
      price: Number(listing?.price ?? product.price ?? 0),
      quantity,
      stock: listing?.stock ?? product.stock ?? 0,
      imageUrl: product.firstImage || product.images?.[0]?.imageUrl || product.imageUrl,
    });
  };

  // Compute reactive values from items
  const totalItems = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);
  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.total, 0), [items]);
  const itemsForValidation = useMemo(() =>
    items.map((item) => ({
      listingId: item.listingId || item.productId,
      quantity: item.quantity,
    })),
    [items]
  );

  return {
    items,
    addToCart,
    removeItem,
    updateQuantity,
    clearCart,
    totalItems,
    subtotal,
    itemsForValidation,
  };
}
