'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Heart, Trash2, ShoppingCart, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { userApi, handleApiError } from '@/lib/api';
import { showSuccessToast, showErrorToast } from '@/store/uiStore';
import { PageLoader } from '@/components/shared/LoadingSpinner';
import AuthGuard from '@/components/shared/AuthGuard';
import useCart from '@/hooks/useCart';
import { formatPrice } from '@/lib/utils';

// ============================================
// INTERFACES
// ============================================
interface WishlistItem {
  id: string;
  productId: string;
  createdAt: string;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    originalPrice?: number;
    stock: number;
    image?: string;
    images?: any;
    rating?: number;
    reviewCount?: number;
    category?: {
      id: string;
      name: string;
    };
  };
}

// ============================================
// WISHLIST CONTENT COMPONENT
// ============================================
function WishlistContent() {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [addingToCartId, setAddingToCartId] = useState<string | null>(null);
  const { addItem: addToCart } = useCart();

  // ============================================
  // FETCH WISHLIST
  // ============================================
  const fetchWishlist = async () => {
    setIsLoading(true);
    try {
      const response = await userApi.getWishlist();
      
      if (response.data.success) {
        setWishlist(response.data.data || []);
      } else {
        throw new Error(response.data.error?.message || 'Failed to load wishlist');
      }
    } catch (error) {
      const message = handleApiError(error);
      showErrorToast(message, 'Failed to load wishlist');
      setWishlist([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchWishlist();
  }, []);

  // ============================================
  // REMOVE FROM WISHLIST
  // ============================================
  const handleRemove = async (productId: string) => {
    setRemovingId(productId);
    
    try {
      const response = await userApi.removeFromWishlist(productId);
      
      if (response.data.success) {
        // Optimistically update UI
        setWishlist(wishlist.filter((item) => item.product.id !== productId));
        showSuccessToast('Removed from wishlist', 'Success');
      } else {
        throw new Error(response.data.error?.message || 'Failed to remove');
      }
    } catch (error) {
      const message = handleApiError(error);
      showErrorToast(message, 'Failed to remove');
    } finally {
      setRemovingId(null);
    }
  };

  // ============================================
  // ADD TO CART
  // ============================================
  const handleAddToCart = async (item: WishlistItem) => {
    const product = item.product;

    // Check stock
    if (!product.stock || product.stock === 0) {
      showErrorToast('Product is out of stock', 'Cannot add to cart');
      return;
    }

    setAddingToCartId(product.id);

    try {
      // Add to cart using hook
      const success = await addToCart(product.id, 1);

      if (success) {
        // Remove from wishlist after successful cart addition
        await handleRemove(product.id);
        showSuccessToast('Moved to cart', 'Success');
      }
    } catch (error) {
      const message = handleApiError(error);
      showErrorToast(message, 'Failed to add to cart');
    } finally {
      setAddingToCartId(null);
    }
  };

  // ============================================
  // CLEAR WISHLIST
  // ============================================
  const handleClearWishlist = async () => {
    if (!confirm('Are you sure you want to clear your entire wishlist?')) {
      return;
    }

    try {
      const response = await userApi.clearWishlist();
      
      if (response.data.success) {
        setWishlist([]);
        showSuccessToast('Wishlist cleared', 'Success');
      } else {
        throw new Error(response.data.error?.message || 'Failed to clear wishlist');
      }
    } catch (error) {
      const message = handleApiError(error);
      showErrorToast(message, 'Failed to clear wishlist');
    }
  };

  // ============================================
  // MOVE ALL TO CART
  // ============================================
  const handleMoveAllToCart = async () => {
    if (wishlist.length === 0) return;

    if (!confirm(`Move all ${wishlist.length} items to cart?`)) {
      return;
    }

    const productIds = wishlist
      .filter(item => item.product.stock && item.product.stock > 0)
      .map(item => item.product.id);

    if (productIds.length === 0) {
      showErrorToast('No items available to add to cart', 'All out of stock');
      return;
    }

    try {
      const response = await userApi.moveWishlistToCart(productIds);
      
      if (response.data.success) {
        const result = response.data.data;
        
        // Update wishlist by removing moved items
        setWishlist(wishlist.filter(
          item => !result.added.includes(item.product.id)
        ));

        showSuccessToast(
          `${result.added.length} items moved to cart`,
          result.failed.length > 0 
            ? `${result.failed.length} items failed`
            : 'Success'
        );
      } else {
        throw new Error(response.data.error?.message || 'Failed to move items');
      }
    } catch (error) {
      const message = handleApiError(error);
      showErrorToast(message, 'Failed to move items');
    }
  };

  // ============================================
  // GET DISPLAY IMAGE
  // ============================================
  const getDisplayImage = (product: WishlistItem['product']): string => {
    if (product.image) return product.image;
    if (product.images && typeof product.images === 'object' && Array.isArray(product.images)) {
      return product.images[0] || '🌾';
    }
    return '🌾';
  };

  // ============================================
  // CALCULATE DISCOUNT
  // ============================================
  const calculateDiscount = (price: number, originalPrice?: number): number => {
    if (!originalPrice || originalPrice <= price) return 0;
    return Math.round(((originalPrice - price) / originalPrice) * 100);
  };

  // ============================================
  // LOADING STATE
  // ============================================
  if (isLoading) {
    return <PageLoader message="Loading wishlist..." />;
  }

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-4xl font-black text-white flex items-center gap-3 mb-2">
                <Heart className="w-8 h-8 text-red-400" />
                My Wishlist
              </h1>
              <p className="text-gray-300 font-semibold">
                {wishlist.length} item{wishlist.length !== 1 ? 's' : ''} saved
              </p>
            </div>

            {/* Action Buttons */}
            {wishlist.length > 0 && (
              <div className="flex gap-3">
                <button
                  onClick={handleMoveAllToCart}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-xl transition-all flex items-center gap-2"
                >
                  <ShoppingCart className="w-5 h-5" />
                  Move All to Cart
                </button>
                <button
                  onClick={handleClearWishlist}
                  className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all flex items-center gap-2"
                >
                  <Trash2 className="w-5 h-5" />
                  Clear All
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Wishlist Items */}
        {wishlist.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlist.map((item) => {
              const product = item.product;
              const discount = calculateDiscount(product.price, product.originalPrice);
              const displayImage = getDisplayImage(product);
              const isOutOfStock = !product.stock || product.stock === 0;
              const isProcessing = removingId === product.id || addingToCartId === product.id;

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg hover:shadow-2xl hover:border-green-400 transition-all overflow-hidden"
                >
                  {/* Image */}
                  <Link
                    href={`/products/${product.id}`}
                    className="block bg-gradient-to-br from-green-50 to-emerald-50 p-8 hover:scale-105 transition-transform relative"
                  >
                    <div className="text-7xl text-center">{displayImage}</div>
                    
                    {/* Discount Badge */}
                    {discount > 0 && (
                      <div className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                        {discount}% OFF
                      </div>
                    )}

                    {/* Out of Stock Overlay */}
                    {isOutOfStock && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-white font-bold text-lg">Out of Stock</span>
                      </div>
                    )}
                  </Link>

                  {/* Content */}
                  <div className="p-6">
                    {/* Category */}
                    {product.category && (
                      <span className="inline-block px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full mb-2">
                        {product.category.name}
                      </span>
                    )}

                    {/* Title */}
                    <Link
                      href={`/products/${product.id}`}
                      className="text-lg font-bold text-gray-900 hover:text-green-600 transition-colors line-clamp-2 block mb-3"
                    >
                      {product.name}
                    </Link>

                    {/* Rating */}
                    {product.rating !== null && product.rating !== undefined && (
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded">
                          <span className="text-sm font-bold text-gray-900">
                            ⭐ {product.rating.toFixed(1)}
                          </span>
                        </div>
                        <span className="text-xs text-gray-600">
                          ({product.reviewCount || 0} reviews)
                        </span>
                      </div>
                    )}

                    {/* Price */}
                    <div className="mb-4">
                      <div className="flex items-baseline gap-2">
                        <p className="text-2xl font-black text-green-600">
                          {formatPrice(product.price)}
                        </p>
                        {product.originalPrice && product.originalPrice > product.price && (
                          <p className="text-sm font-bold text-gray-400 line-through">
                            {formatPrice(product.originalPrice)}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Stock Status */}
                    {isOutOfStock ? (
                      <p className="text-sm text-red-600 font-bold mb-4 bg-red-50 px-3 py-2 rounded text-center">
                        ⚠️ Out of Stock
                      </p>
                    ) : (
                      <p className="text-sm text-green-600 font-bold mb-4 bg-green-50 px-3 py-2 rounded text-center">
                        ✓ In Stock ({product.stock} available)
                      </p>
                    )}

                    {/* Actions */}
                    <div className="space-y-2">
                      <button
                        onClick={() => handleAddToCart(item)}
                        disabled={isOutOfStock || isProcessing}
                        className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                      >
                        {addingToCartId === product.id ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Adding...
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="w-5 h-5" />
                            Add to Cart
                          </>
                        )}
                      </button>
                      
                      <button
                        onClick={() => handleRemove(product.id)}
                        disabled={isProcessing}
                        className="w-full px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50 font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                      >
                        {removingId === product.id ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Removing...
                          </>
                        ) : (
                          <>
                            <Trash2 className="w-4 h-4" />
                            Remove
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // Empty State
          <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-xl p-16 text-center">
            <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Wishlist is Empty</h2>
            <p className="text-gray-600 font-semibold mb-6">
              Start adding your favorite products to your wishlist!
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all"
            >
              Continue Shopping
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================
export default function WishlistPage() {
  return (
    <AuthGuard requireAuth={true}>
      <WishlistContent />
    </AuthGuard>
  );
}