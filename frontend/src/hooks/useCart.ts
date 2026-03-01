'use client';

import { useCartStore } from '@/stores/cartStore';
import { Product } from '@/types';

export function useCart() {
  const store = useCartStore();

  const addToCart = (product: Product, quantity = 1) => {
    store.addItem({
      productId: product.id,
      name: product.name,
      price: Number(product.price ?? 0),
      quantity,
      stock: product.stock ?? 0,
      imageUrl: product.imageUrl,
    });
  };

  return {
    items: store.items,
    addToCart,
    removeItem: store.removeItem,
    updateQuantity: store.updateQuantity,
    clearCart: store.clearCart,
    totalItems: store.getTotalItems(),
    subtotal: store.getSubtotal(),
    itemsForValidation: store.getItemsForValidation(),
  };
}
