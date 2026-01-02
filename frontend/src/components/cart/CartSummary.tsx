import React, { useState } from 'react';
import { Tag, Truck, Shield, ArrowRight, X, Package, Gift } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import useCart from '@/hooks/useCart';

export interface CartSummaryProps {
  showCoupon?: boolean;
  showShippingInfo?: boolean;
  showActions?: boolean;
  onCheckout?: () => void;
  className?: string;
  variant?: 'default' | 'sticky' | 'checkout';
}

/**
 * CartSummary Component
 * Displays cart totals, coupon input, and checkout actions
 */
export default function CartSummary({
  showCoupon = true,
  showShippingInfo = true,
  showActions = true,
  onCheckout,
  className = '',
  variant = 'default',
}: CartSummaryProps) {
  const {
    itemCount,
    subtotal,
    discount,
    shipping,
    total,
    couponCode,
    applyCoupon,
    removeCoupon,
    freeShippingRemaining,
    proceedToCheckout,
  } = useCart();

  const [couponInput, setCouponInput] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  /**
   * Handle coupon application
   */
  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;

    setIsApplyingCoupon(true);
    await applyCoupon(couponInput);
    setIsApplyingCoupon(false);
  };

  /**
   * Handle coupon removal
   */
  const handleRemoveCoupon = async () => {
    await removeCoupon();
    setCouponInput('');
  };

  /**
   * Handle checkout
   */
  const handleCheckout = () => {
    if (onCheckout) {
      onCheckout();
    } else {
      proceedToCheckout();
    }
  };

  const isSticky = variant === 'sticky';

  return (
    <div
      className={`
        bg-white rounded-2xl border-2 border-gray-200 shadow-2xl p-6
        ${isSticky ? 'sticky top-24' : ''}
        ${className}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-6 border-b-2 border-gray-200">
        <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
          <Package className="w-6 h-6 text-green-600" />
          Order Summary
        </h2>
        {itemCount > 0 && (
          <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-bold rounded-lg">
            {itemCount} {itemCount === 1 ? 'item' : 'items'}
          </span>
        )}
      </div>

      {/* Coupon Section */}
      {showCoupon && (
        <div className="mb-6">
          <label className="block text-sm font-bold text-gray-900 mb-2">
            Have a coupon code?
          </label>
          
          {couponCode ? (
            /* Applied Coupon */
            <div className="flex items-center justify-between p-4 bg-green-50 border-2 border-green-200 rounded-xl">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-bold text-green-700">{couponCode}</p>
                  <p className="text-xs text-green-600 font-semibold">Coupon applied!</p>
                </div>
              </div>
              <button
                onClick={handleRemoveCoupon}
                className="p-2 hover:bg-green-100 rounded-lg transition-colors"
                title="Remove coupon"
              >
                <X className="w-4 h-4 text-green-700" />
              </button>
            </div>
          ) : (
            /* Coupon Input */
            <div className="flex gap-3">
              <input
                type="text"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                onKeyPress={(e) => e.key === 'Enter' && handleApplyCoupon()}
                placeholder="Enter code"
                className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-400 font-semibold text-gray-900 uppercase"
              />
              <button
                onClick={handleApplyCoupon}
                disabled={!couponInput.trim() || isApplyingCoupon}
                className="px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {isApplyingCoupon ? 'Applying...' : 'Apply'}
              </button>
            </div>
          )}

          {/* Sample Coupons */}
          {!couponCode && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-700 font-semibold mb-2">Try these codes:</p>
              <div className="flex flex-wrap gap-2">
                {['SAVE10', 'SAVE20', 'WELCOME'].map((code) => (
                  <button
                    key={code}
                    onClick={() => setCouponInput(code)}
                    className="px-2 py-1 bg-white border border-blue-300 text-blue-700 text-xs font-bold rounded hover:bg-blue-100 transition-colors"
                  >
                    {code}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Free Shipping Progress */}
      {showShippingInfo && freeShippingRemaining > 0 && (
        <div className="mb-6 p-4 bg-orange-50 border-2 border-orange-200 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Truck className="w-5 h-5 text-orange-600" />
            <p className="text-sm font-bold text-orange-900">
              Add {formatPrice(freeShippingRemaining)} more for FREE delivery!
            </p>
          </div>
          <div className="w-full h-2 bg-orange-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-500 to-orange-600 transition-all duration-300"
              style={{ width: `${Math.min((subtotal / 5000) * 100, 100)}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Price Breakdown */}
      <div className="space-y-4 mb-6">
        {/* Subtotal */}
        <div className="flex justify-between text-gray-700">
          <span className="font-semibold">Subtotal ({itemCount} items)</span>
          <span className="font-bold text-lg">{formatPrice(subtotal)}</span>
        </div>

        {/* Discount */}
        {discount > 0 && (
          <div className="flex justify-between text-green-600">
            <span className="font-semibold flex items-center gap-2">
              <Gift className="w-4 h-4" />
              Discount
            </span>
            <span className="font-bold text-lg">-{formatPrice(discount)}</span>
          </div>
        )}

        {/* Shipping */}
        <div className="flex justify-between text-gray-700">
          <span className="font-semibold flex items-center gap-2">
            <Truck className="w-4 h-4" />
            Shipping
          </span>
          <span className={`font-bold text-lg ${shipping === 0 ? 'text-green-600' : ''}`}>
            {shipping === 0 ? 'FREE' : formatPrice(shipping)}
          </span>
        </div>

        {/* Tax Info */}
        <div className="text-xs text-gray-600 font-semibold">
          * All prices include applicable taxes
        </div>
      </div>

      {/* Total */}
      <div className="pt-6 border-t-2 border-gray-200 mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xl font-black text-gray-900">Total</span>
          <span className="text-3xl font-black text-green-600">{formatPrice(total)}</span>
        </div>
        <p className="text-sm text-gray-600 font-semibold text-right">
          You save {formatPrice(discount + (freeShippingRemaining <= 0 ? 200 : 0))}
        </p>
      </div>

      {/* Actions */}
      {showActions && (
        <div className="space-y-3">
          <button
            onClick={handleCheckout}
            disabled={itemCount === 0}
            className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-black text-lg rounded-2xl shadow-2xl hover:scale-105 transition-all disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            Proceed to Checkout
            <ArrowRight className="w-5 h-5" />
          </button>

          {variant !== 'checkout' && (
            <a
              href="/products"
              className="block w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold rounded-xl transition-all text-center"
            >
              Continue Shopping
            </a>
          )}
        </div>
      )}

      {/* Trust Badges */}
      {showShippingInfo && (
        <div className="mt-6 pt-6 border-t-2 border-gray-100 space-y-3">
          {[
            { icon: Shield, text: '100% Secure Checkout' },
            { icon: Truck, text: 'Fast & Reliable Delivery' },
            { icon: Package, text: '7 Day Easy Returns' },
          ].map((badge, idx) => (
            <div key={idx} className="flex items-center gap-3 text-gray-700">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <badge.icon className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-sm font-bold">{badge.text}</span>
            </div>
          ))}
        </div>
      )}

      {/* Payment Methods */}
      {variant === 'checkout' && (
        <div className="mt-6 pt-6 border-t-2 border-gray-100">
          <p className="text-sm font-bold text-gray-900 mb-3">We Accept</p>
          <div className="flex flex-wrap gap-2">
            {['💳 Cards', '📱 UPI', '🏦 Banking', '💰 COD'].map((method, idx) => (
              <div
                key={idx}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-700"
              >
                {method}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="mt-6 p-4 bg-gray-50 rounded-xl text-center">
        <p className="text-sm text-gray-600 font-semibold">
          Need help? Call us at{' '}
          <a href="tel:18001234567" className="text-green-600 font-bold hover:underline">
            1800-123-4567
          </a>
        </p>
      </div>
    </div>
  );
}

/**
 * Sticky Cart Summary - For cart page
 */
export function StickyCartSummary() {
  return <CartSummary variant="sticky" />;
}

/**
 * Checkout Summary - For checkout page
 */
export function CheckoutSummary({
  onProceed,
}: {
  onProceed: () => void;
}) {
  return (
    <CartSummary
      variant="checkout"
      showCoupon={false}
      showActions={true}
      onCheckout={onProceed}
    />
  );
}

/**
 * Mini Cart Summary - For cart drawer
 */
export function MiniCartSummary() {
  return (
    <CartSummary
      showCoupon={false}
      showShippingInfo={false}
      className="p-4"
    />
  );
}