'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Heart, Trash2, ShoppingCart, ArrowRight } from 'lucide-react';
import { userApi, handleApiError } from '@/lib/api';
import { showSuccessToast, showErrorToast } from '@/store/uiStore';
import { PageLoader } from '@/components/shared/LoadingSpinner';
import AuthGuard from '@/components/shared/AuthGuard';
import useCart from '@/hooks/useCart';
import { formatPrice } from '@/lib/utils';

interface WishlistItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  image: string;
  inStock: boolean;
  rating: number;
  reviews: number;
  category: string;
}

function WishlistContent() {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const { addToCart } = useCart();

  // Fetch wishlist on mount
  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    setIsLoading(true);
    try {
      const response = await userApi.getWishlist();
      if (response.data.success) {
        setWishlist(response.data.data || []);
      }
    } catch (error) {
      const message = handleApiError(error);
      showErrorToast(message, 'Failed to load wishlist');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle remove from wishlist
  const handleRemove = async (productId: string) => {
    setRemovingId(productId);
    try {
      const response = await userApi.removeFromWishlist(productId);
      if (response.data.success) {
        setWishlist(wishlist.filter((item) => item.productId !== productId));
        showSuccessToast('Removed from wishlist');
      }
    } catch (error) {
      const message = handleApiError(error);
      showErrorToast(message, 'Failed to remove');
    } finally {
      setRemovingId(null);
    }
  };

  // Handle add to cart
  const handleAddToCart = async (item: WishlistItem) => {
    if (!item.inStock) {
      showErrorToast('Product is out of stock');
      return;
    }

    const success = await addToCart({
      productId: item.productId,
      name: item.name,
      price: item.price,
      image: item.image,
      quantity: 1,
      inStock: item.inStock,
      category: item.category,
    });

    if (success) {
      await handleRemove(item.productId);
    }
  };

  if (isLoading) {
    return <PageLoader message="Loading wishlist..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black text-white flex items-center gap-3 mb-2">
            <Heart className="w-8 h-8 text-red-400" />
            My Wishlist
          </h1>
          <p className="text-gray-300 font-semibold">
            {wishlist.length} item{wishlist.length !== 1 ? 's' : ''} saved
          </p>
        </div>

        {wishlist.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlist.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg hover:shadow-2xl hover:border-green-400 transition-all overflow-hidden"
              >
                {/* Image */}
                <Link
                  href={`/products/${item.productId}`}
                  className="block bg-gradient-to-br from-green-50 to-emerald-50 p-8 hover:scale-105 transition-transform"
                >
                  <div className="text-7xl text-center">{item.image}</div>
                </Link>

                {/* Content */}
                <div className="p-6">
                  {/* Title */}
                  <Link
                    href={`/products/${item.productId}`}
                    className="text-lg font-bold text-gray-900 hover:text-green-600 transition-colors line-clamp-2 block mb-3"
                  >
                    {item.name}
                  </Link>

                  {/* Rating */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded">
                      <span className="text-sm font-bold text-gray-900">⭐ {item.rating}</span>
                    </div>
                    <span className="text-xs text-gray-600">({item.reviews} reviews)</span>
                  </div>

                  {/* Price */}
                  <div className="mb-4">
                    <p className="text-2xl font-black text-green-600">{formatPrice(item.price)}</p>
                  </div>

                  {/* Stock Status */}
                  {item.inStock ? (
                    <p className="text-sm text-green-600 font-bold mb-4 bg-green-50 px-3 py-2 rounded text-center">
                      ✓ In Stock
                    </p>
                  ) : (
                    <p className="text-sm text-red-600 font-bold mb-4 bg-red-50 px-3 py-2 rounded text-center">
                      ⚠️ Out of Stock
                    </p>
                  )}

                  {/* Actions */}
                  <div className="space-y-2">
                    <button
                      onClick={() => handleAddToCart(item)}
                      disabled={!item.inStock || removingId === item.productId}
                      className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                      <ShoppingCart className="w-5 h-5" />
                      Add to Cart
                    </button>
                    <button
                      onClick={() => handleRemove(item.productId)}
                      disabled={removingId === item.productId}
                      className="w-full px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50 font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      {removingId === item.productId ? 'Removing...' : 'Remove'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
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

export default function WishlistPage() {
  return (
    <AuthGuard requireAuth={true}>
      <WishlistContent />
    </AuthGuard>
  );
}
