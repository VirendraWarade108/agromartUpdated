import { useState, useEffect, useCallback } from 'react';
import { cartApi, productApi, handleApiError } from '@/lib/api';
import { showSuccessToast, showErrorToast } from '@/store/uiStore';

/**
 * Cart Item Interface
 */
interface CartItem {
  id: string;
  cartId: string;
  productId: string;
  quantity: number;
  createdAt: string;
  updatedAt: string;
  product?: {
    id: string;
    name: string;
    slug: string;
    price: number;
    originalPrice?: number;
    image?: string;
    stock: number;
  };
}

/**
 * Cart Interface
 */
interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  coupon?: {
    code: string;
    type: string;
    value: number;
    discount: number;
  };
  createdAt: string;
  updatedAt: string;
}

/**
 * Cart Summary
 */
interface CartSummary {
  subtotal: number;
  discount: number;
  tax: number;
  shipping: number;
  total: number;
  itemCount: number;
}

/**
 * useCart Hook Return Type
 */
interface UseCartReturn {
  // State
  cart: Cart | null;
  items: CartItem[];
  summary: CartSummary;
  isLoading: boolean;
  isUpdating: boolean;
  error: string | null;

  // Actions
  fetchCart: () => Promise<void>;
  addItem: (productId: string, quantity?: number) => Promise<boolean>;
  updateQuantity: (itemId: string, quantity: number) => Promise<boolean>;
  removeItem: (itemId: string) => Promise<boolean>;
  clearCart: () => Promise<boolean>;
  applyCoupon: (code: string) => Promise<boolean>;
  removeCoupon: () => Promise<boolean>;
  refreshCart: () => Promise<void>;

  // Computed
  isEmpty: boolean;
  hasItems: boolean;
  couponCode: string | null;
}

/**
 * Custom hook for cart management
 */
export function useCart(): UseCartReturn {
  const [cart, setCart] = useState<Cart | null>(null);
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Calculate cart summary
   */
  const calculateSummary = useCallback((): CartSummary => {
    if (!items || items.length === 0) {
      return {
        subtotal: 0,
        discount: 0,
        tax: 0,
        shipping: 0,
        total: 0,
        itemCount: 0,
      };
    }

    const subtotal = items.reduce(
      (sum, item) => sum + (item.product?.price || 0) * item.quantity,
      0
    );

    const discount = cart?.coupon?.discount
      ? Math.round(subtotal * cart.coupon.discount * 100) / 100
      : 0;

    const FREE_SHIPPING_THRESHOLD = 5000;
    const STANDARD_SHIPPING_FEE = 200;
    const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_FEE;

    const GST_RATE = 0.18;
    const taxableAmount = subtotal - discount;
    const tax = Math.round(taxableAmount * GST_RATE * 100) / 100;

    const total = subtotal - discount + shipping + tax;

    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

    return {
      subtotal,
      discount,
      tax,
      shipping,
      total,
      itemCount,
    };
  }, [items, cart?.coupon]);

  const summary = calculateSummary();

  /**
   * Fetch cart from API
   */
  const fetchCart = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await cartApi.get();

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch cart');
      }

      const cartData = response.data.data;
      setCart(cartData);

      // Fetch product details for each cart item
      if (cartData.items && cartData.items.length > 0) {
        const itemsWithProducts = await Promise.all(
          cartData.items.map(async (item: CartItem) => {
            try {
              const productResponse = await productApi.getById(item.productId);
              const product = productResponse.data.data;

              return {
                ...item,
                product: {
                  id: product.id,
                  name: product.name,
                  slug: product.slug,
                  price: product.price,
                  originalPrice: product.originalPrice,
                  image: product.image || product.images?.[0],
                  stock: product.stock || 0,
                },
              };
            } catch (err) {
              console.error(`Failed to fetch product ${item.productId}:`, err);
              return item;
            }
          })
        );

        setItems(itemsWithProducts);
      } else {
        setItems([]);
      }
    } catch (err) {
      const message = handleApiError(err);
      setError(message);
      console.error('Failed to fetch cart:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Add item to cart
   */
  const addItem = useCallback(
    async (productId: string, quantity: number = 1): Promise<boolean> => {
      setIsUpdating(true);
      setError(null);

      try {
        const response = await cartApi.add(productId, quantity);

        if (!response.data.success) {
          throw new Error(response.data.message || 'Failed to add item');
        }

        showSuccessToast('Item added to cart', 'Success');
        await fetchCart();
        return true;
      } catch (err) {
        const message = handleApiError(err);
        setError(message);
        showErrorToast(message, 'Failed to add item');
        return false;
      } finally {
        setIsUpdating(false);
      }
    },
    [fetchCart]
  );

  /**
   * Update item quantity
   */
  const updateQuantity = useCallback(
    async (itemId: string, quantity: number): Promise<boolean> => {
      if (quantity < 1) {
        return removeItem(itemId);
      }

      setIsUpdating(true);
      setError(null);

      try {
        const response = await cartApi.update(itemId, quantity);

        if (!response.data.success) {
          throw new Error(response.data.message || 'Failed to update quantity');
        }

        await fetchCart();
        return true;
      } catch (err) {
        const message = handleApiError(err);
        setError(message);
        showErrorToast(message, 'Failed to update quantity');
        return false;
      } finally {
        setIsUpdating(false);
      }
    },
    [fetchCart]
  );

  /**
   * Remove item from cart
   */
  const removeItem = useCallback(
    async (itemId: string): Promise<boolean> => {
      setIsUpdating(true);
      setError(null);

      try {
        const response = await cartApi.remove(itemId);

        if (!response.data.success) {
          throw new Error(response.data.message || 'Failed to remove item');
        }

        showSuccessToast('Item removed from cart', 'Success');
        await fetchCart();
        return true;
      } catch (err) {
        const message = handleApiError(err);
        setError(message);
        showErrorToast(message, 'Failed to remove item');
        return false;
      } finally {
        setIsUpdating(false);
      }
    },
    [fetchCart]
  );

  /**
   * Clear cart
   */
  const clearCart = useCallback(async (): Promise<boolean> => {
    setIsUpdating(true);
    setError(null);

    try {
      const response = await cartApi.clear();

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to clear cart');
      }

      showSuccessToast('Cart cleared', 'Success');
      setCart(null);
      setItems([]);
      return true;
    } catch (err) {
      const message = handleApiError(err);
      setError(message);
      showErrorToast(message, 'Failed to clear cart');
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, []);

  /**
   * Apply coupon code
   */
  const applyCoupon = useCallback(
    async (code: string): Promise<boolean> => {
      if (!code || code.trim() === '') {
        showErrorToast('Please enter a coupon code', 'Invalid Coupon');
        return false;
      }

      setIsUpdating(true);
      setError(null);

      try {
        const response = await cartApi.applyCoupon(code);

        if (!response.data.success) {
          throw new Error(response.data.message || 'Failed to apply coupon');
        }

        const couponData = response.data.data;
        showSuccessToast(
          `Coupon applied! You saved ${
            couponData.discount ? `₹${couponData.discount.toFixed(2)}` : ''
          }`,
          'Success'
        );

        await fetchCart();
        return true;
      } catch (err) {
        const message = handleApiError(err);
        setError(message);
        showErrorToast(message, 'Invalid Coupon');
        return false;
      } finally {
        setIsUpdating(false);
      }
    },
    [fetchCart]
  );

  /**
   * Remove coupon code
   */
  const removeCoupon = useCallback(async (): Promise<boolean> => {
    setIsUpdating(true);
    setError(null);

    try {
      const response = await cartApi.removeCoupon();

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to remove coupon');
      }

      showSuccessToast('Coupon removed', 'Success');
      await fetchCart();
      return true;
    } catch (err) {
      const message = handleApiError(err);
      setError(message);
      showErrorToast(message, 'Failed to remove coupon');
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, [fetchCart]);

  /**
   * Refresh cart data
   */
  const refreshCart = useCallback(async (): Promise<void> => {
    await fetchCart();
  }, [fetchCart]);

  /**
   * Fetch cart on mount
   */
  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  return {
    // State
    cart,
    items,
    summary,
    isLoading,
    isUpdating,
    error,

    // Actions
    fetchCart,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    applyCoupon,
    removeCoupon,
    refreshCart,

    // Computed
    isEmpty: items.length === 0,
    hasItems: items.length > 0,
    couponCode: cart?.coupon?.code || null,
  };
}

export default useCart;