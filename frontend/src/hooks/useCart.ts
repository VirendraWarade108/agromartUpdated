import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useCartStore, { CartItem } from '@/store/cartStore';
import useAuthStore from '@/store/authStore';
import { cartApi, handleApiError } from '@/lib/api';
import { showSuccessToast, showErrorToast, showWarningToast } from '@/store/uiStore';

interface AddToCartParams {
  productId: string;
  name: string;
  price: number;
  image: string;
  quantity?: number;
  inStock?: boolean;
  category?: string;
}

interface UseCartReturn {
  // State
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  couponCode: string | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  addToCart: (params: AddToCartParams) => Promise<boolean>;
  removeFromCart: (productId: string) => Promise<boolean>;
  updateQuantity: (productId: string, quantity: number) => Promise<boolean>;
  clearCart: () => Promise<boolean>;
  applyCoupon: (code: string) => Promise<boolean>;
  removeCoupon: () => Promise<boolean>;
  syncWithServer: () => Promise<void>;
  proceedToCheckout: () => void;
  
  // Computed
  isInCart: (productId: string) => boolean;
  getItemQuantity: (productId: string) => number;
  isEmpty: boolean;
  hasDiscount: boolean;
  freeShippingRemaining: number;
}

const SHIPPING_THRESHOLD = 5000;
const SHIPPING_COST = 200;

/**
 * Custom hook for shopping cart management
 * Handles all cart operations with local and server sync
 */
export function useCart(): UseCartReturn {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Get cart state from store
  const {
    items,
    couponCode,
    discount,
    addItem: storeAddItem,
    removeItem: storeRemoveItem,
    updateQuantity: storeUpdateQuantity,
    clearCart: storeClearCart,
    applyCoupon: storeApplyCoupon,
    removeCoupon: storeRemoveCoupon,
    getItemCount,
    getSubtotal,
    getShipping,
    getTotal,
    isInCart: storeIsInCart,
    getItemQuantity: storeGetItemQuantity,
  } = useCartStore();

  /**
   * Clear error message
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Add item to cart
   * Syncs with server if user is authenticated
   */
  const addToCart = useCallback(async (params: AddToCartParams): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      // Check if product is in stock
      if (params.inStock === false) {
        showWarningToast('This product is currently out of stock');
        return false;
      }

      // Add to local store first for immediate UI update
      storeAddItem({
        id: `cart-${params.productId}`,
        productId: params.productId,
        name: params.name,
        price: params.price,
        image: params.image,
        quantity: params.quantity || 1,
        inStock: params.inStock ?? true, // Default to true if not specified
        category: params.category,
      });

      // Sync with server if authenticated
      if (isAuthenticated) {
        try {
          await cartApi.add(params.productId, params.quantity || 1);
        } catch (syncError) {
          console.error('Failed to sync with server:', syncError);
          // Continue anyway - local cart is updated
        }
      }

      showSuccessToast(`${params.name} added to cart`);
      return true;
    } catch (err: any) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      showErrorToast(errorMessage, 'Failed to add to cart');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, storeAddItem]);

  /**
   * Remove item from cart
   */
  const removeFromCart = useCallback(async (productId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      // Get item name before removing
      const item = items.find((i) => i.productId === productId);
      
      // Remove from local store
      storeRemoveItem(productId);

      // Sync with server if authenticated
      if (isAuthenticated && item) {
        try {
          await cartApi.remove(item.id);
        } catch (syncError) {
          console.error('Failed to sync with server:', syncError);
        }
      }

      showSuccessToast(`${item?.name || 'Item'} removed from cart`);
      return true;
    } catch (err: any) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      showErrorToast(errorMessage, 'Failed to remove item');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [items, isAuthenticated, storeRemoveItem]);

  /**
   * Update item quantity
   */
  const updateQuantity = useCallback(async (
    productId: string,
    quantity: number
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      if (quantity < 1) {
        return await removeFromCart(productId);
      }

      // Get item
      const item = items.find((i) => i.productId === productId);
      
      if (!item) {
        throw new Error('Item not found in cart');
      }

      // Check stock availability (in a real app, this would be a server check)
      if (quantity > 50) {
        showWarningToast('Maximum quantity is 50 per item');
        return false;
      }

      // Update local store
      storeUpdateQuantity(productId, quantity);

      // Sync with server if authenticated
      if (isAuthenticated) {
        try {
          await cartApi.update(item.id, quantity);
        } catch (syncError) {
          console.error('Failed to sync with server:', syncError);
        }
      }

      return true;
    } catch (err: any) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      showErrorToast(errorMessage, 'Failed to update quantity');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [items, isAuthenticated, storeUpdateQuantity, removeFromCart]);

  /**
   * Clear entire cart
   */
  const clearCart = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      // Clear local store
      storeClearCart();

      // Sync with server if authenticated
      if (isAuthenticated) {
        try {
          await cartApi.clear();
        } catch (syncError) {
          console.error('Failed to sync with server:', syncError);
        }
      }

      showSuccessToast('Cart cleared');
      return true;
    } catch (err: any) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      showErrorToast(errorMessage, 'Failed to clear cart');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, storeClearCart]);

  /**
   * Apply coupon code
   * Validates with server first before applying to local store
   */
  const applyCoupon = useCallback(async (code: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      if (!code || code.trim() === '') {
        showWarningToast('Please enter a coupon code');
        return false;
      }

      // Validate with server first if authenticated
      let discountAmount = 0;
      if (isAuthenticated) {
        try {
          const response = await cartApi.applyCoupon(code);
          if (response.data.success && response.data.data.discount) {
            discountAmount = response.data.data.discount;
          } else {
            showWarningToast('Invalid or expired coupon code');
            return false;
          }
        } catch (syncError) {
          console.error('Failed to validate coupon with server:', syncError);
          showErrorToast('Invalid coupon code');
          return false;
        }
      } else {
        // For unauthenticated users, apply locally
        storeApplyCoupon(code);
      }

      // Apply to local store (only after server validation)
      storeApplyCoupon(code);

      showSuccessToast(`Coupon "${code}" applied! You saved ₹${discountAmount}`);
      return true;
    } catch (err: any) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      showErrorToast(errorMessage, 'Failed to apply coupon');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, storeApplyCoupon, storeRemoveCoupon]);

  /**
   * Remove applied coupon
   */
  const removeCoupon = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      // Remove from local store
      storeRemoveCoupon();

      // Sync with server if authenticated
      if (isAuthenticated) {
        try {
          await cartApi.removeCoupon();
        } catch (syncError) {
          console.error('Failed to sync with server:', syncError);
        }
      }

      showSuccessToast('Coupon removed');
      return true;
    } catch (err: any) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      showErrorToast(errorMessage, 'Failed to remove coupon');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, storeRemoveCoupon]);

  /**
   * Sync local cart with server
   * Called when user logs in or on page load
   */
  const syncWithServer = useCallback(async (): Promise<void> => {
    if (!isAuthenticated) return;

    try {
      setIsLoading(true);
      
      // Fetch cart from server
      const response = await cartApi.get();
      
      if (response.data.success && response.data.data.items) {
        const serverItems = response.data.data.items;
        
        // Clear local cart first to avoid duplicates
        storeClearCart();
        
        // Add server items to local cart
        // Backend already transforms the response with: thumbnail, inStock, category string, price at item level
        serverItems.forEach((serverItem: any) => {
          storeAddItem({
            id: serverItem.id,
            productId: serverItem.productId,
            name: serverItem.product.name,
            price: serverItem.price,                     // ✅ Backend provides price at item level
            image: serverItem.product.thumbnail,         // ✅ Backend transforms image -> thumbnail
            quantity: serverItem.quantity,
            inStock: serverItem.product.inStock,         // ✅ Backend transforms stock -> inStock boolean
            category: serverItem.product.category,       // ✅ Backend transforms category object -> string
          });
        });
      }
    } catch (err) {
      console.error('Failed to sync cart with server:', err);
      // Don't show error to user - cart sync is background operation
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, storeAddItem, storeClearCart]);
  
  /**
   * Proceed to checkout
   * Validates cart and redirects
   */
  const proceedToCheckout = useCallback(() => {
    if (items.length === 0) {
      showWarningToast('Your cart is empty');
      return;
    }

    // Check if all items are in stock
    const outOfStockItems = items.filter((item) => !item.inStock);
    if (outOfStockItems.length > 0) {
      showWarningToast(
        `Some items in your cart are out of stock. Please remove them to continue.`
      );
      return;
    }

    // Redirect to checkout
    router.push('/checkout');
  }, [items, router]);

  /**
   * Sync cart with server when user logs in
   */
  useEffect(() => {
    if (isAuthenticated) {
      syncWithServer();
    }
  }, [isAuthenticated, syncWithServer]);

  // Calculate derived values
  const itemCount = getItemCount();
  const subtotal = getSubtotal();
  const shipping = getShipping();
  const total = getTotal();
  const isEmpty = items.length === 0;
  const hasDiscount = discount > 0;
  const freeShippingRemaining = Math.max(0, SHIPPING_THRESHOLD - subtotal);

  return {
    // State
    items,
    itemCount,
    subtotal,
    discount,
    shipping,
    total,
    couponCode,
    isLoading,
    error,
    
    // Actions
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    applyCoupon,
    removeCoupon,
    syncWithServer,
    proceedToCheckout,
    
    // Computed
    isInCart: storeIsInCart,
    getItemQuantity: storeGetItemQuantity,
    isEmpty,
    hasDiscount,
    freeShippingRemaining,
  };
}

export default useCart;