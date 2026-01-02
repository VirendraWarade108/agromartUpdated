'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ShoppingCart, ChevronLeft, Sparkles } from 'lucide-react';
import useCart from '@/hooks/useCart';
import CartItem from '@/components/cart/CartItem';
import { StickyCartSummary } from '@/components/cart/CartSummary';

export default function CartPage() {
  const {
    items,
    updateQuantity,
    removeFromCart,
    clearCart,
    isLoading,
    isEmpty,
  } = useCart();

  const [removingItems, setRemovingItems] = useState<Set<string>>(new Set());

  // Handle item removal with loading state
  const handleRemove = async (productId: string): Promise<boolean> => {
    setRemovingItems((prev) => new Set(prev).add(productId));
    try {
      await removeFromCart(productId);
      return true;
    } catch (err) {
      return false;
    } finally {
      setRemovingItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  // Handle clear cart
  const handleClearCart = async () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      await clearCart();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900">
      {/* Header */}
      <div className="bg-white/5 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/products"
                className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all"
              >
                <ChevronLeft className="w-6 h-6 text-white" />
              </Link>
              <div>
                <h1 className="text-3xl sm:text-4xl font-black text-white flex items-center gap-3">
                  <ShoppingCart className="w-8 h-8 text-green-400" />
                  Shopping Cart
                </h1>
                <p className="text-gray-300 font-semibold mt-1">
                  {items.length} {items.length === 1 ? 'item' : 'items'} in your cart
                </p>
              </div>
            </div>
            <Link
              href="/products"
              className="hidden md:flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-xl border-2 border-white/20 text-white font-bold rounded-xl hover:bg-white/20 transition-all"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {isEmpty ? (
          /* Empty Cart */
          <div className="text-center py-20">
            <div className="w-32 h-32 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingCart className="w-16 h-16 text-gray-400" />
            </div>
            <h2 className="text-3xl font-black text-white mb-4">Your Cart is Empty</h2>
            <p className="text-gray-300 text-lg mb-8 font-medium">
              Add some products to get started!
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-2xl shadow-2xl hover:scale-105 transition-all"
            >
              <Sparkles className="w-5 h-5" />
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-6">
              {/* Trust Badges */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                  { icon: '🚚', text: 'Free Delivery', subtext: 'On orders ₹5000+' },
                  { icon: '🔒', text: '100% Secure', subtext: 'Payment protected' },
                  { icon: '🎁', text: 'Special Offers', subtext: 'Save more today' },
                ].map((badge, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl text-center"
                  >
                    <div className="text-3xl mb-2">{badge.icon}</div>
                    <p className="text-white font-bold text-sm">{badge.text}</p>
                    <p className="text-gray-400 text-xs font-semibold">{badge.subtext}</p>
                  </div>
                ))}
              </div>

              {/* Clear Cart Button */}
              {items.length > 1 && (
                <div className="flex justify-end">
                  <button
                    onClick={handleClearCart}
                    className="px-4 py-2 text-red-400 hover:text-red-300 font-bold text-sm transition-colors"
                  >
                    Clear Cart
                  </button>
                </div>
              )}

              {/* Cart Items List */}
              {items.map((item) => (
                <CartItem
                  key={item.id}
                  item={item}
                  onUpdateQuantity={updateQuantity}
                  onRemove={handleRemove}
                  isUpdating={removingItems.has(item.productId)}
                />
              ))}
            </div>

            {/* Cart Summary Sidebar */}
            <div className="lg:col-span-1">
              <StickyCartSummary />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}