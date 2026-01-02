'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CreditCard, Wallet, Building, Smartphone, Lock, ChevronLeft, CheckCircle, MapPin, User, Mail, Phone, Home, Truck, Package } from 'lucide-react';
import { api, productApi, handleApiError } from '@/lib/api';
import { showErrorToast, showSuccessToast } from '@/store/uiStore';
import { PageLoader } from '@/components/shared/LoadingSpinner';

export default function CheckoutPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [loading, setLoading] = useState(false);
  const [isLoadingCart, setIsLoadingCart] = useState(true);
  const [cart, setCart] = useState<any>(null);
  const [cartItems, setCartItems] = useState<any[]>([]);
  
  const [shippingInfo, setShippingInfo] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    landmark: ''
  });

  // Fetch cart from backend
  useEffect(() => {
    const fetchCart = async () => {
      setIsLoadingCart(true);
      try {
        const data = await api.getCart();
        setCart(data);
        
        // Fetch full product details for cart items
        if (data.items && data.items.length > 0) {
          const itemsWithDetails = await Promise.all(
            data.items.map(async (item: any) => {
              try {
                const productResponse = await productApi.getById(item.productId);
                const product = productResponse.data.data;
                return {
                  ...item,
                  name: product.name,
                  price: product.price,
                  image: product.images?.[0] || '/placeholder.png',
                };
              } catch (error) {
                console.error(`Failed to fetch product ${item.productId}:`, error);
                return {
                  ...item,
                  name: `Product ${item.productId}`,
                  price: 0,
                  image: '/placeholder.png',
                };
              }
            })
          );
          setCartItems(itemsWithDetails);
        } else {
          setCartItems([]);
        }
      } catch (err) {
        console.error('Failed to fetch cart:', err);
        const message = handleApiError(err);
        showErrorToast(message, 'Failed to load cart');
        setCartItems([]);
      } finally {
        setIsLoadingCart(false);
      }
    };
    fetchCart();
  }, []);

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discountAmount = cart?.coupon ? Math.round(subtotal * (cart.coupon.discount || 0) * 100) / 100 : 0;
  const shipping = 0;
  const total = subtotal - discountAmount + shipping;

  const paymentMethods = [
    { id: 'card', name: 'Credit/Debit Card', icon: CreditCard, description: 'Visa, Mastercard, RuPay' },
    { id: 'upi', name: 'UPI', icon: Smartphone, description: 'Google Pay, PhonePe, Paytm' },
    { id: 'netbanking', name: 'Net Banking', icon: Building, description: 'All major banks' },
    { id: 'wallet', name: 'Wallet', icon: Wallet, description: 'Paytm, PhonePe Wallet' },
    { id: 'cod', name: 'Cash on Delivery', icon: Package, description: 'Pay when you receive' }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShippingInfo({ ...shippingInfo, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      setStep(2);
    } else {
      // Process payment — call checkout API
      setLoading(true);
      try {
        const result = await api.checkout({
          paymentMethod,
          shippingAddress: shippingInfo,
        });
        showSuccessToast(`Order placed successfully! Order ID: ${result.order.id}`);
        router.push('/dashboard/orders');
      } catch (err) {
        const message = handleApiError(err);
        showErrorToast(message, 'Checkout failed');
      } finally {
        setLoading(false);
      }
    }
  };

  if (isLoadingCart) {
    return <PageLoader message="Loading checkout..." />;
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-24 h-24 text-gray-400 mx-auto mb-6" />
          <h2 className="text-3xl font-black text-white mb-4">Your cart is empty</h2>
          <p className="text-gray-300 font-semibold mb-8">Add items to your cart before checking out</p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-xl transition-all shadow-lg"
          >
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900">
      {/* Header */}
      <div className="bg-white/5 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/cart" className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all">
                <ChevronLeft className="w-6 h-6 text-white" />
              </Link>
              <div>
                <h1 className="text-3xl sm:text-4xl font-black text-white flex items-center gap-3">
                  <Lock className="w-8 h-8 text-green-400" />
                  Secure Checkout
                </h1>
                <p className="text-gray-300 font-semibold mt-1">Complete your order securely</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Progress Steps */}
        <div className="mb-12">
          <div className="flex items-center justify-center gap-4 mb-6">
            {[
              { num: 1, label: 'Shipping', icon: Truck },
              { num: 2, label: 'Payment', icon: CreditCard }
            ].map((s, idx) => (
              <div key={s.num} className="flex items-center">
                <div className={`flex items-center gap-3 px-6 py-3 rounded-xl transition-all ${
                  step >= s.num 
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg' 
                    : 'bg-white/10 backdrop-blur-xl text-gray-400 border-2 border-white/20'
                }`}>
                  {step > s.num ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    <s.icon className="w-6 h-6" />
                  )}
                  <div>
                    <p className="text-xs font-semibold opacity-80">Step {s.num}</p>
                    <p className="font-black">{s.label}</p>
                  </div>
                </div>
                {idx < 1 && (
                  <div className={`w-16 h-1 mx-2 ${step > s.num ? 'bg-green-500' : 'bg-white/20'}`}></div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit}>
              {step === 1 ? (
                /* Shipping Information */
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white rounded-2xl border-2 border-gray-200 shadow-2xl p-8"
                >
                  <h2 className="text-3xl font-black text-gray-900 mb-6 flex items-center gap-3">
                    <MapPin className="w-8 h-8 text-green-600" />
                    Shipping Information
                  </h2>

                  <div className="space-y-6">
                    {/* Full Name */}
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-2">
                        Full Name *
                      </label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          name="fullName"
                          value={shippingInfo.fullName}
                          onChange={handleInputChange}
                          placeholder="Enter your full name"
                          required
                          className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-400 font-semibold text-gray-900 transition-all"
                        />
                      </div>
                    </div>

                    {/* Email & Phone */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">
                          Email Address *
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="email"
                            name="email"
                            value={shippingInfo.email}
                            onChange={handleInputChange}
                            placeholder="your@email.com"
                            required
                            className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-400 font-semibold text-gray-900 transition-all"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">
                          Phone Number *
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="tel"
                            name="phone"
                            value={shippingInfo.phone}
                            onChange={handleInputChange}
                            placeholder="+91 98765 43210"
                            required
                            className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-400 font-semibold text-gray-900 transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Address */}
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-2">
                        Complete Address *
                      </label>
                      <div className="relative">
                        <Home className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          name="address"
                          value={shippingInfo.address}
                          onChange={handleInputChange}
                          placeholder="House no., Street, Area"
                          required
                          className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-400 font-semibold text-gray-900 transition-all"
                        />
                      </div>
                    </div>

                    {/* City, State, Pincode */}
                    <div className="grid md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">
                          City *
                        </label>
                        <input
                          type="text"
                          name="city"
                          value={shippingInfo.city}
                          onChange={handleInputChange}
                          placeholder="City"
                          required
                          className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-400 font-semibold text-gray-900 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">
                          State *
                        </label>
                        <input
                          type="text"
                          name="state"
                          value={shippingInfo.state}
                          onChange={handleInputChange}
                          placeholder="State"
                          required
                          className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-400 font-semibold text-gray-900 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">
                          Pincode *
                        </label>
                        <input
                          type="text"
                          name="pincode"
                          value={shippingInfo.pincode}
                          onChange={handleInputChange}
                          placeholder="110001"
                          required
                          className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-400 font-semibold text-gray-900 transition-all"
                        />
                      </div>
                    </div>

                    {/* Landmark */}
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-2">
                        Landmark (Optional)
                      </label>
                      <input
                        type="text"
                        name="landmark"
                        value={shippingInfo.landmark}
                        onChange={handleInputChange}
                        placeholder="Near famous location"
                        className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-400 font-semibold text-gray-900 transition-all"
                      />
                    </div>

                    {/* Continue Button */}
                    <button
                      type="submit"
                      className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-black text-lg rounded-2xl shadow-2xl hover:scale-105 transition-all"
                    >
                      Continue to Payment
                    </button>
                  </div>
                </motion.div>
              ) : (
                /* Payment Method */
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white rounded-2xl border-2 border-gray-200 shadow-2xl p-8"
                >
                  <h2 className="text-3xl font-black text-gray-900 mb-6 flex items-center gap-3">
                    <CreditCard className="w-8 h-8 text-green-600" />
                    Payment Method
                  </h2>

                  <div className="space-y-4 mb-8">
                    {paymentMethods.map((method) => (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setPaymentMethod(method.id)}
                        className={`w-full flex items-center gap-4 p-6 border-2 rounded-2xl transition-all ${
                          paymentMethod === method.id
                            ? 'border-green-500 bg-green-50 shadow-lg'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          paymentMethod === method.id ? 'bg-green-600' : 'bg-gray-100'
                        }`}>
                          <method.icon className={`w-6 h-6 ${
                            paymentMethod === method.id ? 'text-white' : 'text-gray-600'
                          }`} />
                        </div>
                        <div className="flex-1 text-left">
                          <h3 className="font-bold text-gray-900 text-lg">{method.name}</h3>
                          <p className="text-sm text-gray-600 font-semibold">{method.description}</p>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          paymentMethod === method.id ? 'border-green-600' : 'border-gray-300'
                        }`}>
                          {paymentMethod === method.id && (
                            <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Payment Form (Card) */}
                  {paymentMethod === 'card' && (
                    <div className="space-y-6 mb-8 p-6 bg-gray-50 rounded-xl border-2 border-gray-200">
                      <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">
                          Card Number
                        </label>
                        <input
                          type="text"
                          placeholder="1234 5678 9012 3456"
                          className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-400 font-semibold text-gray-900"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-gray-900 mb-2">
                            Expiry Date
                          </label>
                          <input
                            type="text"
                            placeholder="MM/YY"
                            className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-400 font-semibold text-gray-900"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-900 mb-2">
                            CVV
                          </label>
                          <input
                            type="text"
                            placeholder="123"
                            className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-400 font-semibold text-gray-900"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* UPI Form */}
                  {paymentMethod === 'upi' && (
                    <div className="space-y-6 mb-8 p-6 bg-gray-50 rounded-xl border-2 border-gray-200">
                      <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">
                          UPI ID
                        </label>
                        <input
                          type="text"
                          placeholder="yourname@upi"
                          className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-400 font-semibold text-gray-900"
                        />
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="flex-1 py-4 bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold rounded-xl transition-all"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-black text-lg rounded-2xl shadow-2xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Processing...' : 'Place Order'}
                    </button>
                  </div>
                </motion.div>
              )}
            </form>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-2xl p-6 sticky top-24">
              <h3 className="text-2xl font-black text-gray-900 mb-6">Order Summary</h3>

              {/* Cart Items */}
              <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-900 text-sm truncate">{item.name}</h4>
                      <p className="text-sm text-gray-600 font-semibold">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-bold text-gray-900">₹{(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 pb-6 mb-6 border-b-2 border-gray-200">
                <div className="flex justify-between text-gray-700">
                  <span className="font-semibold">Subtotal</span>
                  <span className="font-bold">₹{subtotal.toFixed(2)}</span>
                </div>
                {cart?.coupon && (
                  <div className="flex justify-between text-green-600">
                    <span className="font-semibold">Discount ({(cart.coupon.discount * 100).toFixed(0)}%)</span>
                    <span className="font-bold">-₹{discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-700">
                  <span className="font-semibold">Shipping</span>
                  <span className="font-bold text-green-600">{shipping === 0 ? 'FREE' : `₹${shipping}`}</span>
                </div>
              </div>

              {/* Total */}
              <div className="flex justify-between items-center mb-6">
                <span className="text-xl font-black text-gray-900">Total</span>
                <span className="text-3xl font-black text-green-600">₹{total.toFixed(2)}</span>
              </div>

              {/* Security Badge */}
              <div className="p-4 bg-green-50 rounded-xl border-2 border-green-200 text-center">
                <Lock className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-sm font-bold text-green-900">Secure Payment</p>
                <p className="text-xs text-green-700 font-semibold">Your data is protected</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}