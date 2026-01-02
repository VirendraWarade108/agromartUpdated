import React, { useState } from 'react';
import { CreditCard, Smartphone, Building, Wallet, Package, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import { PaymentMethod } from '@/types';

export interface PaymentFormProps {
  amount: number;
  onSubmit: (method: PaymentMethod, details?: any) => void;
  isProcessing?: boolean;
  className?: string;
}

interface PaymentMethodOption {
  id: PaymentMethod;
  name: string;
  icon: any;
  description: string;
  color: string;
}

/**
 * PaymentForm Component
 * Handles payment method selection and payment details
 */
export default function PaymentForm({
  amount,
  onSubmit,
  isProcessing = false,
  className = '',
}: PaymentFormProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('card');
  const [cardDetails, setCardDetails] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: '',
  });
  const [upiId, setUpiId] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  /**
   * Payment methods configuration
   */
  const paymentMethods: PaymentMethodOption[] = [
    {
      id: 'card',
      name: 'Credit/Debit Card',
      icon: CreditCard,
      description: 'Visa, Mastercard, RuPay',
      color: 'from-blue-500 to-cyan-600',
    },
    {
      id: 'upi',
      name: 'UPI',
      icon: Smartphone,
      description: 'Google Pay, PhonePe, Paytm',
      color: 'from-green-500 to-emerald-600',
    },
    {
      id: 'netbanking',
      name: 'Net Banking',
      icon: Building,
      description: 'All major banks',
      color: 'from-purple-500 to-pink-600',
    },
    {
      id: 'wallet',
      name: 'Wallet',
      icon: Wallet,
      description: 'Paytm, PhonePe Wallet',
      color: 'from-orange-500 to-red-600',
    },
    {
      id: 'cod',
      name: 'Cash on Delivery',
      icon: Package,
      description: 'Pay when you receive',
      color: 'from-yellow-500 to-orange-600',
    },
  ];

  /**
   * Handle card input change
   */
  const handleCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;

    // Format card number (add spaces every 4 digits)
    if (name === 'number') {
      formattedValue = value
        .replace(/\s/g, '')
        .replace(/(\d{4})/g, '$1 ')
        .trim()
        .slice(0, 19);
    }

    // Format expiry (MM/YY)
    if (name === 'expiry') {
      formattedValue = value
        .replace(/\D/g, '')
        .replace(/(\d{2})(\d)/, '$1/$2')
        .slice(0, 5);
    }

    // Format CVV (3-4 digits)
    if (name === 'cvv') {
      formattedValue = value.replace(/\D/g, '').slice(0, 4);
    }

    setCardDetails((prev) => ({
      ...prev,
      [name]: formattedValue,
    }));

    // Clear error
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  /**
   * Validate card details
   */
  const validateCard = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!cardDetails.number || cardDetails.number.replace(/\s/g, '').length < 16) {
      newErrors.number = 'Please enter a valid 16-digit card number';
    }

    if (!cardDetails.name.trim()) {
      newErrors.name = 'Cardholder name is required';
    }

    if (!cardDetails.expiry || !/^\d{2}\/\d{2}$/.test(cardDetails.expiry)) {
      newErrors.expiry = 'Please enter a valid expiry date (MM/YY)';
    }

    if (!cardDetails.cvv || cardDetails.cvv.length < 3) {
      newErrors.cvv = 'Please enter a valid CVV';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Validate UPI ID
   */
  const validateUPI = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!upiId.trim()) {
      newErrors.upi = 'UPI ID is required';
    } else if (!/^[\w.-]+@[\w.-]+$/.test(upiId)) {
      newErrors.upi = 'Please enter a valid UPI ID (e.g., name@upi)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate based on payment method
    let isValid = true;

    if (selectedMethod === 'card') {
      isValid = validateCard();
    } else if (selectedMethod === 'upi') {
      isValid = validateUPI();
    }

    if (!isValid) return;

    // Submit payment
    const details =
      selectedMethod === 'card'
        ? cardDetails
        : selectedMethod === 'upi'
        ? { upiId }
        : undefined;

    onSubmit(selectedMethod, details);
  };

  return (
    <div className={`bg-white rounded-2xl border-2 border-gray-200 shadow-xl ${className}`}>
      {/* Header */}
      <div className="p-6 border-b-2 border-gray-200">
        <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
          <Lock className="w-7 h-7 text-green-600" />
          Payment Method
        </h2>
        <p className="text-gray-600 font-semibold mt-2">
          Choose your preferred payment method
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Payment Method Selection */}
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-4">
            Select Payment Method
          </label>
          <div className="space-y-3">
            {paymentMethods.map((method) => (
              <button
                key={method.id}
                type="button"
                onClick={() => setSelectedMethod(method.id)}
                className={`w-full flex items-center gap-4 p-5 border-2 rounded-2xl transition-all ${
                  selectedMethod === method.id
                    ? 'border-green-500 bg-green-50 shadow-lg'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div
                  className={`w-14 h-14 rounded-xl flex items-center justify-center bg-gradient-to-br ${method.color}`}
                >
                  <method.icon className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-bold text-gray-900 text-lg">{method.name}</h3>
                  <p className="text-sm text-gray-600 font-semibold">{method.description}</p>
                </div>
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    selectedMethod === method.id
                      ? 'border-green-600 bg-green-600'
                      : 'border-gray-300'
                  }`}
                >
                  {selectedMethod === method.id && (
                    <CheckCircle className="w-4 h-4 text-white" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Card Details Form */}
        {selectedMethod === 'card' && (
          <div className="space-y-6 p-6 bg-gray-50 rounded-xl border-2 border-gray-200">
            <h3 className="font-bold text-gray-900 text-lg">Enter Card Details</h3>

            {/* Card Number */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Card Number *
              </label>
              <input
                type="text"
                name="number"
                value={cardDetails.number}
                onChange={handleCardChange}
                placeholder="1234 5678 9012 3456"
                className={`w-full px-4 py-4 border-2 rounded-xl focus:outline-none font-semibold text-gray-900 transition-all ${
                  errors.number ? 'border-red-500' : 'border-gray-200 focus:border-green-400'
                }`}
              />
              {errors.number && (
                <p className="text-red-600 text-sm font-semibold mt-1">{errors.number}</p>
              )}
            </div>

            {/* Cardholder Name */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Cardholder Name *
              </label>
              <input
                type="text"
                name="name"
                value={cardDetails.name}
                onChange={handleCardChange}
                placeholder="Name on card"
                className={`w-full px-4 py-4 border-2 rounded-xl focus:outline-none font-semibold text-gray-900 transition-all ${
                  errors.name ? 'border-red-500' : 'border-gray-200 focus:border-green-400'
                }`}
              />
              {errors.name && (
                <p className="text-red-600 text-sm font-semibold mt-1">{errors.name}</p>
              )}
            </div>

            {/* Expiry and CVV */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Expiry Date *
                </label>
                <input
                  type="text"
                  name="expiry"
                  value={cardDetails.expiry}
                  onChange={handleCardChange}
                  placeholder="MM/YY"
                  className={`w-full px-4 py-4 border-2 rounded-xl focus:outline-none font-semibold text-gray-900 transition-all ${
                    errors.expiry ? 'border-red-500' : 'border-gray-200 focus:border-green-400'
                  }`}
                />
                {errors.expiry && (
                  <p className="text-red-600 text-sm font-semibold mt-1">{errors.expiry}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">CVV *</label>
                <input
                  type="password"
                  name="cvv"
                  value={cardDetails.cvv}
                  onChange={handleCardChange}
                  placeholder="123"
                  maxLength={4}
                  className={`w-full px-4 py-4 border-2 rounded-xl focus:outline-none font-semibold text-gray-900 transition-all ${
                    errors.cvv ? 'border-red-500' : 'border-gray-200 focus:border-green-400'
                  }`}
                />
                {errors.cvv && (
                  <p className="text-red-600 text-sm font-semibold mt-1">{errors.cvv}</p>
                )}
              </div>
            </div>

            {/* Security Info */}
            <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <Lock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="text-blue-900 font-bold">Your card details are secure</p>
                <p className="text-blue-700 font-semibold">
                  We use SSL encryption to protect your payment information
                </p>
              </div>
            </div>
          </div>
        )}

        {/* UPI Form */}
        {selectedMethod === 'upi' && (
          <div className="space-y-6 p-6 bg-gray-50 rounded-xl border-2 border-gray-200">
            <h3 className="font-bold text-gray-900 text-lg">Enter UPI Details</h3>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">UPI ID *</label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => {
                  setUpiId(e.target.value);
                  if (errors.upi) {
                    setErrors((prev) => {
                      const newErrors = { ...prev };
                      delete newErrors.upi;
                      return newErrors;
                    });
                  }
                }}
                placeholder="yourname@upi"
                className={`w-full px-4 py-4 border-2 rounded-xl focus:outline-none font-semibold text-gray-900 transition-all ${
                  errors.upi ? 'border-red-500' : 'border-gray-200 focus:border-green-400'
                }`}
              />
              {errors.upi && (
                <p className="text-red-600 text-sm font-semibold mt-1">{errors.upi}</p>
              )}
            </div>

            {/* UPI Apps */}
            <div>
              <p className="text-sm font-bold text-gray-900 mb-3">Popular UPI Apps</p>
              <div className="grid grid-cols-3 gap-3">
                {['Google Pay', 'PhonePe', 'Paytm'].map((app) => (
                  <div
                    key={app}
                    className="p-3 bg-white border-2 border-gray-200 rounded-xl text-center"
                  >
                    <p className="text-sm font-bold text-gray-900">{app}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Net Banking */}
        {selectedMethod === 'netbanking' && (
          <div className="p-6 bg-gray-50 rounded-xl border-2 border-gray-200">
            <h3 className="font-bold text-gray-900 text-lg mb-4">Select Your Bank</h3>
            <p className="text-gray-600 font-semibold mb-4">
              You will be redirected to your bank's secure payment page
            </p>
            <select className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-400 font-semibold text-gray-900 cursor-pointer">
              <option value="">Choose your bank</option>
              <option>State Bank of India</option>
              <option>HDFC Bank</option>
              <option>ICICI Bank</option>
              <option>Axis Bank</option>
              <option>Kotak Mahindra Bank</option>
              <option>Punjab National Bank</option>
              <option>Bank of Baroda</option>
            </select>
          </div>
        )}

        {/* Wallet */}
        {selectedMethod === 'wallet' && (
          <div className="p-6 bg-gray-50 rounded-xl border-2 border-gray-200">
            <h3 className="font-bold text-gray-900 text-lg mb-4">Select Wallet</h3>
            <div className="grid grid-cols-2 gap-3">
              {['Paytm', 'PhonePe', 'Amazon Pay', 'Mobikwik'].map((wallet) => (
                <button
                  key={wallet}
                  type="button"
                  className="p-4 bg-white border-2 border-gray-200 hover:border-green-400 rounded-xl font-bold text-gray-900 transition-all"
                >
                  {wallet}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Cash on Delivery Info */}
        {selectedMethod === 'cod' && (
          <div className="p-6 bg-yellow-50 rounded-xl border-2 border-yellow-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-yellow-900 text-lg mb-2">
                  Cash on Delivery Available
                </h3>
                <p className="text-yellow-800 font-semibold text-sm">
                  Pay ₹{amount.toLocaleString('en-IN')} in cash when your order is delivered.
                  Please keep exact change ready.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isProcessing}
          className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-black text-lg rounded-2xl shadow-2xl hover:scale-105 transition-all disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isProcessing ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Processing Payment...
            </>
          ) : (
            <>
              <Lock className="w-5 h-5" />
              Pay ₹{amount.toLocaleString('en-IN')}
            </>
          )}
        </button>

        {/* Security Badge */}
        <div className="p-4 bg-gray-50 rounded-xl text-center border-2 border-gray-200">
          <div className="flex items-center justify-center gap-2 text-gray-700">
            <Lock className="w-5 h-5 text-green-600" />
            <span className="text-sm font-bold">
              256-bit SSL Secured Payment • PCI DSS Compliant
            </span>
          </div>
        </div>
      </form>
    </div>
  );
}