'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  Package,
  MapPin,
  CreditCard,
  Calendar,
  Download,
  XCircle,
  Loader,
  AlertCircle,
  Phone,
  Mail,
  Home,
  Receipt,
} from 'lucide-react';
import { orderApi, handleApiError } from '@/lib/api';
import { showErrorToast, showSuccessToast } from '@/store/uiStore';
import { PageLoader } from '@/components/shared/LoadingSpinner';
import { formatPrice } from '@/lib/utils';
import OrderTimeline, { OrderStatus } from '@/components/orders/OrderTimeline';

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  price: number;
  subtotal: number;
}

interface Address {
  fullName?: string;
  name?: string;
  phone: string;
  email?: string;
  addressLine1?: string;
  address?: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  country?: string;
}

interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  status: OrderStatus;
  paymentMethod: string;
  paymentStatus: string;
  shippingAddress: Address;
  billingAddress?: Address;
  trackingNumber?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  deliveredAt?: string;
}

interface TrackingEvent {
  status: OrderStatus;
  message: string;
  location?: string;
  timestamp: string;
  isCompleted: boolean;
}

interface OrderTracking {
  orderId: string;
  status: OrderStatus;
  timeline: TrackingEvent[];
  estimatedDelivery?: string;
  trackingUrl?: string;
}

const paymentMethodLabels: Record<string, string> = {
  card: 'Credit/Debit Card',
  upi: 'UPI',
  netbanking: 'Net Banking',
  wallet: 'Wallet',
  cod: 'Cash on Delivery',
};

const paymentStatusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'text-yellow-600 bg-yellow-50' },
  completed: { label: 'Completed', color: 'text-green-600 bg-green-50' },
  failed: { label: 'Failed', color: 'text-red-600 bg-red-50' },
  refunded: { label: 'Refunded', color: 'text-orange-600 bg-orange-50' },
};

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [tracking, setTracking] = useState<OrderTracking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
      fetchOrderTracking();
    }
  }, [orderId]);

  const fetchOrderDetails = async () => {
    setIsLoading(true);
    try {
      const response = await orderApi.getById(orderId);

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch order');
      }

      setOrder(response.data.data);
    } catch (err) {
      const message = handleApiError(err);
      showErrorToast(message, 'Failed to load order');
      console.error('Failed to fetch order:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOrderTracking = async () => {
    try {
      const response = await orderApi.track(orderId);

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch tracking');
      }

      setTracking(response.data.data);
    } catch (err) {
      console.error('Failed to fetch tracking:', err);
      // Non-critical error, don't show toast
    }
  };

  const handleCancelOrder = async () => {
    if (!order) return;

    const confirmed = window.confirm(
      'Are you sure you want to cancel this order? This action cannot be undone.'
    );

    if (!confirmed) return;

    setIsCancelling(true);
    try {
      const response = await orderApi.cancel(orderId);

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to cancel order');
      }

      showSuccessToast('Order cancelled successfully', 'Success');
      await fetchOrderDetails();
      await fetchOrderTracking();
    } catch (err) {
      const message = handleApiError(err);
      showErrorToast(message, 'Failed to cancel order');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleDownloadInvoice = async () => {
    if (!order) return;

    setIsDownloading(true);
    try {
      const response = await orderApi.getInvoice(orderId);

      // Create blob from response
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${order.orderNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showSuccessToast('Invoice downloaded successfully', 'Success');
    } catch (err) {
      const message = handleApiError(err);
      showErrorToast(message, 'Failed to download invoice');
    } finally {
      setIsDownloading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch (error) {
      return dateString;
    }
  };

  if (isLoading) {
    return <PageLoader message="Loading order details..." />;
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-24 h-24 text-gray-400 mx-auto mb-6" />
          <h2 className="text-3xl font-black text-white mb-4">Order Not Found</h2>
          <p className="text-gray-300 font-semibold mb-8">
            The order you're looking for doesn't exist or you don't have access to it.
          </p>
          <Link
            href="/dashboard/orders"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-xl transition-all shadow-lg"
          >
            View All Orders
          </Link>
        </div>
      </div>
    );
  }

  const canCancel = ['pending', 'confirmed', 'processing'].includes(order.status);
  const address = order.shippingAddress;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900">
      {/* Header */}
      <div className="bg-white/5 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all"
              >
                <ChevronLeft className="w-6 h-6 text-white" />
              </button>
              <div>
                <h1 className="text-3xl sm:text-4xl font-black text-white flex items-center gap-3">
                  <Package className="w-8 h-8 text-green-400" />
                  Order Details
                </h1>
                <p className="text-gray-300 font-semibold mt-1">
                  Order #{order.orderNumber}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleDownloadInvoice}
                disabled={isDownloading}
                className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDownloading ? (
                  <Loader className="w-5 h-5 animate-spin" />
                ) : (
                  <Download className="w-5 h-5" />
                )}
                Invoice
              </button>
              {canCancel && (
                <button
                  onClick={handleCancelOrder}
                  disabled={isCancelling}
                  className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCancelling ? (
                    <Loader className="w-5 h-5 animate-spin" />
                  ) : (
                    <XCircle className="w-5 h-5" />
                  )}
                  Cancel Order
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Order Timeline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border-2 border-gray-200 shadow-2xl p-8"
            >
              <h2 className="text-2xl font-black text-gray-900 mb-6">Order Status</h2>
              <OrderTimeline
                currentStatus={order.status}
                events={tracking?.timeline}
                estimatedDelivery={tracking?.estimatedDelivery}
                trackingUrl={tracking?.trackingUrl}
              />
            </motion.div>

            {/* Order Items */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl border-2 border-gray-200 shadow-2xl p-8"
            >
              <h2 className="text-2xl font-black text-gray-900 mb-6">Order Items</h2>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl"
                  >
                    <div className="w-20 h-20 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
                      <img
                        src={item.productImage || '/placeholder.png'}
                        alt={item.productName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 text-lg">
                        {item.productName}
                      </h3>
                      <p className="text-sm text-gray-600 font-semibold">
                        Quantity: {item.quantity}
                      </p>
                      <p className="text-sm text-gray-600 font-semibold">
                        Price: {formatPrice(item.price)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-black text-gray-900">
                        {formatPrice(item.subtotal)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Shipping Address */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl border-2 border-gray-200 shadow-2xl p-8"
            >
              <h2 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-3">
                <MapPin className="w-6 h-6 text-green-600" />
                Shipping Address
              </h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Home className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-gray-900">
                      {address.fullName || address.name || 'N/A'}
                    </p>
                    <p className="text-gray-700 font-semibold">
                      {address.addressLine1 || address.address || 'N/A'}
                    </p>
                    {address.addressLine2 && (
                      <p className="text-gray-700 font-semibold">{address.addressLine2}</p>
                    )}
                    {address.landmark && (
                      <p className="text-gray-600 font-semibold text-sm">
                        Landmark: {address.landmark}
                      </p>
                    )}
                    <p className="text-gray-700 font-semibold">
                      {address.city}, {address.state} - {address.pincode}
                    </p>
                    {address.country && (
                      <p className="text-gray-700 font-semibold">{address.country}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <p className="text-gray-700 font-semibold">{address.phone}</p>
                </div>
                {address.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    <p className="text-gray-700 font-semibold">{address.email}</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Notes */}
            {order.notes && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-2xl border-2 border-gray-200 shadow-2xl p-8"
              >
                <h2 className="text-2xl font-black text-gray-900 mb-4">Order Notes</h2>
                <p className="text-gray-700 font-semibold">{order.notes}</p>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Order Summary */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl border-2 border-gray-200 shadow-2xl p-6 sticky top-24"
            >
              <h3 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-2">
                <Receipt className="w-6 h-6 text-green-600" />
                Order Summary
              </h3>

              {/* Order Info */}
              <div className="space-y-4 mb-6 pb-6 border-b-2 border-gray-200">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600 font-semibold">Order Date</p>
                    <p className="font-bold text-gray-900">{formatDate(order.createdAt)}</p>
                  </div>
                </div>
                {order.deliveredAt && (
                  <div className="flex items-center gap-3">
                    <Package className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600 font-semibold">Delivered On</p>
                      <p className="font-bold text-gray-900">
                        {formatDate(order.deliveredAt)}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Info */}
              <div className="space-y-4 mb-6 pb-6 border-b-2 border-gray-200">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600 font-semibold">Payment Method</p>
                    <p className="font-bold text-gray-900">
                      {paymentMethodLabels[order.paymentMethod] || order.paymentMethod}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-semibold mb-2">Payment Status</p>
                  <span
                    className={`inline-block px-3 py-1 rounded-lg text-sm font-bold ${
                      paymentStatusLabels[order.paymentStatus]?.color ||
                      'text-gray-600 bg-gray-50'
                    }`}
                  >
                    {paymentStatusLabels[order.paymentStatus]?.label ||
                      order.paymentStatus}
                  </span>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 mb-6 pb-6 border-b-2 border-gray-200">
                <div className="flex justify-between text-gray-700">
                  <span className="font-semibold">Subtotal</span>
                  <span className="font-bold">{formatPrice(order.subtotal)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span className="font-semibold">Discount</span>
                    <span className="font-bold">-{formatPrice(order.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-700">
                  <span className="font-semibold">Tax (GST)</span>
                  <span className="font-bold">{formatPrice(order.tax)}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span className="font-semibold">Shipping</span>
                  <span className="font-bold text-green-600">
                    {order.shipping === 0 ? 'FREE' : formatPrice(order.shipping)}
                  </span>
                </div>
              </div>

              {/* Total */}
              <div className="flex justify-between items-center">
                <span className="text-xl font-black text-gray-900">Total</span>
                <span className="text-3xl font-black text-green-600">
                  {formatPrice(order.total)}
                </span>
              </div>
            </motion.div>

            {/* Help Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-200 shadow-xl p-6"
            >
              <h4 className="text-lg font-black text-blue-900 mb-3">Need Help?</h4>
              <p className="text-sm text-blue-700 font-semibold mb-4">
                Contact our support team for assistance with your order.
              </p>
              <Link
                href="/contact"
                className="block w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-center transition-all"
              >
                Contact Support
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}