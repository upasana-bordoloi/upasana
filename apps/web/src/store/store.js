import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Cart Store
export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      addToCart: (painting) => {
        const currentItems = get().items;
        const exists = currentItems.some((item) => item.id === painting.id);
        if (!exists) {
          set({ items: [...currentItems, painting] });
        }
      },
      removeFromCart: (id) => {
        set({ items: get().items.filter((item) => item.id !== id) });
      },
      clearCart: () => set({ items: [] }),
    }),
    {
      name: 'gallery-cart-storage',
    }
  )
);

// Auth Store
export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      setAuth: (user, token) => set({ user, token }),
      logout: async () => {
        try {
          // Fire logout endpoint
          await fetch('/api/auth/logout', { method: 'POST' });
        } catch (e) {
          console.error('Logout request failed:', e);
        }
        set({ user: null, token: null });
      },
    }),
    {
      name: 'gallery-auth-storage',
    }
  )
);

// Toast Store for Global Notifications
export const useToastStore = create((set) => ({
  open: false,
  message: '',
  severity: 'success', // 'success' | 'error' | 'warning' | 'info'
  showToast: (message, severity = 'success') => set({ open: true, message, severity }),
  closeToast: () => set({ open: false })
}));
