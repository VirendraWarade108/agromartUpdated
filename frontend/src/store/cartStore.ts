import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  inStock: boolean;
  category?: string;
}

export interface CartState {
  items: CartItem[];
  couponCode: string | null;
  discount: number;
  syncError: string | null;

  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => boolean;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  applyCoupon: (code: string, discountAmount?: number) => void;
  removeCoupon: () => void;

  getItemCount: () => number;
  getSubtotal: () => number;
  getTotal: () => number;
  getShipping: () => number;
  isInCart: (productId: string) => boolean;
  getItemQuantity: (productId: string) => number;

  syncWithServer: () => Promise<void>;
  setSyncError: (error: string | null) => void;
}

const SHIPPING_THRESHOLD = 5000;
const SHIPPING_COST = 200;

const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      couponCode: null,
      discount: 0,
      syncError: null,

      addItem: (item) => {
        const quantity = item.quantity || 1;
        
        if (quantity < 1 || quantity > 50) {
          console.warn('Invalid quantity:', quantity);
          return false;
        }

        if (get().items.some(i => i.id === item.id)) {
          console.warn('Duplicate item ID:', item.id);
          return false;
        }

        const existing = get().items.find((i) => i.productId === item.productId);

        if (existing) {
          const newQuantity = existing.quantity + quantity;
          if (newQuantity > 50) {
            console.warn('Quantity exceeds maximum');
            return false;
          }
          
          set({
            items: get().items.map((i) =>
              i.productId === item.productId
                ? { ...i, quantity: newQuantity }
                : i
            ),
          });
        } else {
          set({
            items: [
              ...get().items,
              { ...item, quantity }
            ]
          });
        }
        return true;
      },

      removeItem: (productId) =>
        set({ items: get().items.filter((i) => i.productId !== productId) }),

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) return get().removeItem(productId);
        set({
          items: get().items.map((i) =>
            i.productId === productId ? { ...i, quantity } : i
          ),
        });
      },

      clearCart: () => set({ items: [], couponCode: null, discount: 0 }),

      applyCoupon: (code, discountAmount = 0) => {
        set({ couponCode: code, discount: discountAmount });
      },

      removeCoupon: () => set({ couponCode: null, discount: 0 }),

      getItemCount: () =>
        get().items.reduce((t, i) => t + i.quantity, 0),

      getSubtotal: () =>
        get().items.reduce((t, i) => t + i.price * i.quantity, 0),

      getShipping: () =>
        get().getSubtotal() >= SHIPPING_THRESHOLD ? 0 : SHIPPING_COST,

      getTotal: () =>
        get().getSubtotal() + get().getShipping() - get().discount,

      isInCart: (productId) =>
        get().items.some((i) => i.productId === productId),

      getItemQuantity: (productId) =>
        get().items.find((i) => i.productId === productId)?.quantity || 0,

      syncWithServer: async () => {
        const token = localStorage.getItem("access_token");
        if (!token) return;

        try {
          set({ syncError: null });
          
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cart/sync`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ items: get().items }),
          });

          if (!response.ok) {
            throw new Error(`Sync failed with status ${response.status}`);
          }

          console.log("Cart synced with backend");

        } catch (err: any) {
          const errorMessage = err?.message || 'Cart sync failed';
          console.error("Cart sync failed:", errorMessage);
          set({ syncError: errorMessage });
        }
      },

      setSyncError: (error) => set({ syncError: error }),
    }),
    {
      name: 'agromart-cart-storage',
      partialize: (state) => ({
        items: state.items,
        couponCode: state.couponCode,
        discount: state.discount,
      }),
    }
  )
);

export default useCartStore;
