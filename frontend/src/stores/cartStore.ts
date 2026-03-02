import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem } from '@/types';

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'total'>) => void;
  removeItem: (productId: string, listingId?: string) => void;
  updateQuantity: (productId: string, quantity: number, listingId?: string) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getSubtotal: () => number;
  getItemsForValidation: () => Array<{ listingId: string; quantity: number }>;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        set((state) => {
          // Match by listingId if available, otherwise by productId
          const existingItem = state.items.find(
            (i) => (item.listingId && i.listingId === item.listingId) || i.productId === item.productId
          );

          if (existingItem) {
            return {
              items: state.items.map((i) =>
                (item.listingId && i.listingId === item.listingId) || i.productId === item.productId
                  ? {
                      ...i,
                      quantity: Math.min(i.quantity + item.quantity, i.stock),
                      total: i.price * Math.min(i.quantity + item.quantity, i.stock),
                    }
                  : i
              ),
            };
          }

          return {
            items: [
              ...state.items,
              { ...item, quantity: Math.min(item.quantity, item.stock), total: item.price * item.quantity },
            ],
          };
        });
      },

      removeItem: (productId, listingId?: string) => {
        set((state) => ({
          items: state.items.filter((i) =>
            listingId ? i.listingId !== listingId : i.productId !== productId
          ),
        }));
      },

      updateQuantity: (productId, quantity, listingId?: string) => {
        set((state) => ({
          items: state.items.map((i) =>
            (listingId ? i.listingId === listingId : i.productId === productId)
              ? { ...i, quantity: Math.max(0, Math.min(quantity, i.stock)), total: i.price * Math.max(0, Math.min(quantity, i.stock)) }
              : i
          ).filter((i) => i.quantity > 0),
        }));
      },

      clearCart: () => set({ items: [] }),

      getTotalItems: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },

      getSubtotal: () => {
        return get().items.reduce((sum, item) => sum + item.total, 0);
      },

      getItemsForValidation: () => {
        return get().items.map((item) => ({
          listingId: item.listingId || item.productId,
          quantity: item.quantity,
        }));
      },
    }),
    {
      name: 'cart-storage',
    }
  )
);
