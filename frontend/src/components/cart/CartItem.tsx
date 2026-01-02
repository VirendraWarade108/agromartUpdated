import React, { useState } from 'react';
import Link from 'next/link';
import { Trash2, Plus, Minus, Heart, AlertCircle } from 'lucide-react';
import { CartItem as CartItemType } from '@/store/cartStore';
import { formatPrice } from '@/lib/utils';
import { showErrorToast } from '@/store/uiStore';

export interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (productId: string, quantity: number) => void | Promise<boolean>;
  onRemove: (productId: string) => void | Promise<boolean>;
  onMoveToWishlist?: (productId: string) => void | Promise<boolean>;
  isUpdating?: boolean;
  variant?: 'default' | 'compact' | 'checkout';
  showActions?: boolean;
}

/**
 * CartItem Component
 * Displays individual cart item with quantity controls and actions
 */
export default function CartItem({
  item,
  onUpdateQuantity,
  onRemove,
  onMoveToWishlist,
  isUpdating = false,
  variant = 'default',
  showActions = true,
}: CartItemProps) {
  const [isRemoving, setIsRemoving] = useState(false);
  const [isUpdatingQuantity, setIsUpdatingQuantity] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  /**
   * Handle quantity increment
   */
  const handleIncrement = async () => {
    if (item.quantity >= 50 || isUpdatingQuantity) return;
    await updateQuantity(item.quantity + 1);
  };

  /**
   * Handle quantity decrement
   */
  const handleDecrement = async () => {
    if (item.quantity <= 1 || isUpdatingQuantity) return;
    await updateQuantity(item.quantity - 1);
  };

  /**
   * Handle quantity change via direct input
   */
  const handleQuantityInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (isNaN(value) || value < 1 || value > 50) return;
    await updateQuantity(value);
  };

  /**
   * Update quantity with error handling
   */
  const updateQuantity = async (newQuantity: number) => {
    if (newQuantity === item.quantity) return;
    
    setIsUpdatingQuantity(true);
    try {
      const success = await onUpdateQuantity(item.productId, newQuantity);
      if (!success) {
        showErrorToast('Failed to update quantity');
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
      showErrorToast('Failed to update quantity');
    } finally {
      setIsUpdatingQuantity(false);
    }
  };

  /**
   * Handle remove with confirmation
   */
  const handleRemove = async () => {
    setIsRemoving(true);
    try {
      const success = await onRemove(item.productId);
      if (!success) {
        showErrorToast('Failed to remove item from cart');
      }
    } catch (error) {
      console.error('Error removing item:', error);
      showErrorToast('Failed to remove item from cart');
    } finally {
      setIsRemoving(false);
      setShowRemoveConfirm(false);
    }
  };

  /**
   * Handle move to wishlist
   */
  const handleMoveToWishlist = async () => {
    try {
      if (onMoveToWishlist) {
        const success = await onMoveToWishlist(item.productId);
        if (success) {
          await onRemove(item.productId);
        } else {
          showErrorToast('Failed to save to wishlist');
        }
      }
    } catch (error) {
      console.error('Error moving to wishlist:', error);
      showErrorToast('Failed to save to wishlist');
    }
  };

  // Calculate subtotal
  const subtotal = item.price * item.quantity;

  // Variant-specific styles
  const containerStyles = {
    default: 'p-6',
    compact: 'p-4',
    checkout: 'p-4 bg-gray-50',
  };

  const imageStyles = {
    default: 'w-32 h-32',
    compact: 'w-20 h-20',
    checkout: 'w-16 h-16',
  };

  return (
    <div
      className={`
        relative bg-white rounded-2xl border-2 border-gray-200 
        hover:border-green-400 transition-all shadow-lg
        ${containerStyles[variant]}
        ${!item.inStock ? 'opacity-60' : ''}
        ${isRemoving ? 'animate-pulse' : ''}
      `}
    >
      {/* Out of Stock Banner */}
      {!item.inStock && (
        <div className="absolute top-0 left-0 right-0 bg-red-600 text-white text-center py-2 rounded-t-2xl">
          <div className="flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm font-bold">Out of Stock</span>
          </div>
        </div>
      )}

      <div className={`flex gap-6 ${!item.inStock ? 'mt-10' : ''}`}>
        {/* Product Image */}
        <Link
          href={`/products/${item.productId}`}
          className={`
            ${imageStyles[variant]} 
            bg-gradient-to-br from-green-50 to-emerald-50 
            rounded-xl flex items-center justify-center 
            flex-shrink-0 hover:scale-105 transition-transform
            border-2 border-gray-200
          `}
        >
          <div className="text-6xl">{item.image}</div>
        </Link>

        {/* Product Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0 pr-4">
              {/* Product Name */}
              <Link
                href={`/products/${item.productId}`}
                className="text-lg font-bold text-gray-900 hover:text-green-600 transition-colors block mb-1 truncate"
              >
                {item.name}
              </Link>

              {/* Category */}
              {item.category && variant !== 'compact' && (
                <p className="text-sm text-gray-600 font-semibold mb-2">
                  Category: {item.category}
                </p>
              )}

              {/* Price */}
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-2xl font-black text-green-600">
                  {formatPrice(item.price)}
                </span>
                <span className="text-sm text-gray-600 font-semibold">per unit</span>
              </div>

              {/* Stock Status */}
              {item.inStock ? (
                <p className="text-sm text-green-600 font-bold">✓ In Stock</p>
              ) : (
                <p className="text-sm text-red-600 font-bold">⚠️ Currently Unavailable</p>
              )}
            </div>

            {/* Remove Button (Desktop) */}
            {showActions && (
              <button
                onClick={handleRemove}
                disabled={isRemoving}
                className="hidden sm:flex items-center justify-center w-10 h-10 text-red-600 hover:bg-red-50 rounded-lg transition-all flex-shrink-0"
                title="Remove item"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Quantity Controls & Subtotal */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {/* Quantity Selector */}
            <div className="flex items-center bg-gray-100 rounded-xl border-2 border-gray-200">
              <button
                onClick={handleDecrement}
                disabled={item.quantity <= 1 || isUpdatingQuantity || !item.inStock}
                className="p-3 hover:bg-gray-200 transition-colors rounded-l-xl disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Decrease quantity"
              >
                <Minus className="w-4 h-4 text-gray-900" />
              </button>
              <input
                type="number"
                min="1"
                max="50"
                value={item.quantity}
                onChange={handleQuantityInput}
                disabled={isUpdatingQuantity || !item.inStock}
                className="w-16 px-2 text-lg font-black text-gray-900 bg-transparent border-0 text-center focus:outline-none disabled:opacity-50"
              />
              <button
                onClick={handleIncrement}
                disabled={item.quantity >= 50 || isUpdatingQuantity || !item.inStock}
                className="p-3 hover:bg-gray-200 transition-colors rounded-r-xl disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Increase quantity"
              >
                <Plus className="w-4 h-4 text-gray-900" />
              </button>
            </div>

            {/* Subtotal */}
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-600 font-semibold">Subtotal</p>
                <p className="text-2xl font-black text-green-600">
                  {formatPrice(item.price * item.quantity)}
                </p>
              </div>
            </div>
          </div>

          {/* Actions (Mobile & Additional) */}
          {showActions && variant !== 'checkout' && (
            <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t-2 border-gray-100">
              {/* Move to Wishlist */}
              {onMoveToWishlist && item.inStock && (
                <button
                  onClick={handleMoveToWishlist}
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-all font-semibold text-sm"
                >
                  <Heart className="w-4 h-4" />
                  <span>Save for Later</span>
                </button>
              )}

              {/* Remove (Mobile) */}
              <button
                onClick={() => setShowRemoveConfirm(!showRemoveConfirm)}
                className="sm:hidden flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-all font-semibold text-sm"
              >
                <Trash2 className="w-4 h-4" />
                <span>Remove</span>
              </button>

              {/* Remove Confirmation (Mobile) */}
              {showRemoveConfirm && (
                <div className="sm:hidden flex items-center gap-2 w-full">
                  <button
                    onClick={handleRemove}
                    disabled={isRemoving}
                    className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg font-semibold text-sm hover:bg-red-700 disabled:opacity-50"
                  >
                    {isRemoving ? 'Removing...' : 'Confirm Remove'}
                  </button>
                  <button
                    onClick={() => setShowRemoveConfirm(false)}
                    disabled={isRemoving}
                    className="flex-1 px-3 py-2 bg-gray-200 text-gray-900 rounded-lg font-semibold text-sm hover:bg-gray-300 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {/* Quantity Info */}
              {item.quantity >= 10 && (
                <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold">
                  <span>🎉 Bulk order!</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Loading Overlay */}
      {isUpdating && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-2xl flex items-center justify-center">
          <div className="flex items-center gap-2 text-gray-900">
            <div className="w-5 h-5 border-3 border-green-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="font-semibold">Updating...</span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Compact Cart Item - For cart drawer/preview
 */
export function CompactCartItem({
  item,
  onUpdateQuantity,
  onRemove,
}: {
  item: CartItemType;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
}) {
  return (
    <CartItem
      item={item}
      onUpdateQuantity={onUpdateQuantity}
      onRemove={onRemove}
      variant="compact"
      showActions={false}
    />
  );
}

/**
 * Checkout Cart Item - For checkout page (read-only)
 */
export function CheckoutCartItem({ item }: { item: CartItemType }) {
  return (
    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
      {/* Image */}
      <div className="w-16 h-16 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
        <div className="text-4xl">{item.image}</div>
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-gray-900 text-sm truncate mb-1">
          {item.name}
        </h4>
        <p className="text-sm text-gray-600 font-semibold">
          {formatPrice(item.price)} × {item.quantity}
        </p>
      </div>

      {/* Subtotal */}
      <div className="text-right">
        <p className="text-lg font-black text-gray-900">
          {formatPrice(item.price * item.quantity)}
        </p>
      </div>
    </div>
  );
}