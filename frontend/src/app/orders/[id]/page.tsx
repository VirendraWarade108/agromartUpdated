'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  Package,
  ChevronLeft,
  MapPin,
  Phone,
  Mail,
  Calendar,
  CreditCard,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  Download,
  AlertCircle,
} from 'lucide-react';
import { orderApi, handleApiError } from '@/lib/api';
import { showErrorToast, showSuccessToast } from '@/store/uiStore';
import { PageLoader } from '@/components/shared/LoadingSpinner';
import { formatPrice, formatDate } from '@/lib/utils';
import AuthGuard from '@/components/shared/AuthGuard';

interface Order {
  id: string;
  total: number;
  status: string;
  coupon?: {
    code: string;
    discount: number;
  };
  createdAt: string;
  updatedAt: string;
  items: Array<{
    id: string;
    quantity: number;
    price: number;
    product: {
      id: string;
      name: string;
      slug: string;
      image?: string;
      price: number;
    };
  }>;
  user: {
    id: string;
    fullName: string;
    email: string;
    phone?: string;
  };
}

interface PageProps {
  params: Promise<{ id: string }>;
}

function OrderDetailPageContent({ params }: PageProps) {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [orderId, setOrderId] = useState<string>('');

  // Unwrap params
  useEffect(() => {
    params.then((p) => setOrderId(p.id));
  }, [params]);

  // Fetch order
  useEffect(() => {
    if (!orderId) return;
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    setIsLoading(true);
    try {
      const response = await orderApi.getById(orderId);

      if (response.data.success) {
        setOrder(response.data.data);
      }
    } catch (error) {
      const message = handleApiError(error);
      showErrorToast(message, 'Failed to load order');
      router.push('/orders');
    } finally {
      setIsLoading(false);
    }
  };

  // Cancel order
  const handleCancelOrder = async () => {
    if (!order) return;

    if (!confirm('Are you sure you want to cancel this order?')) return;

    setIsCancelling(true);
    try {
      await orderApi.cancel(order.id);
      showSuccessToast('Order cancelled successfully', 'Success');
      fetchOrder(); // Refresh order data
    } catch (error) {
      const message = handleApiError(error);
      showErrorToast(message, 'Failed to cancel order');
    } finally {
      setIsCancelling(false);
    }
  };

  // Get status display
  const getStatusDisplay = (status: string) => {
    const displays: Record<
      string,
      { color: string; bgColor: string; icon: any; label: string }
    > = {
      pending: {
        color: 'text-yellow-700',
        bgColor: 'bg-yellow-100',
        icon: Clock,
        label: 'Pending',
      },
      processing: {
        color: 'text-blue-700',
        bgColor: 'bg-blue-100',
        icon: Package,
        label: 'Processing',
      },
      paid: {
        color: 'text-green-700',
        bgColor: 'bg-green-100',
        icon: CheckCircle,
        label: 'Paid',
      },
      shipped: {
        color: 'text-indigo-700',
        bgColor: 'bg-indigo-100',
        icon: Truck,
        label: 'Shipped',
      },
      delivered: {
        color: 'text-green-700',
        bgColor: 'bg-green-100',
        icon: CheckCircle,
        label: 'Delivered',
      },
      cancelled: {
        color: 'text-red-700',
        bgColor: 'bg-red-100',
        icon: XCircle,
        label: 'Cancelled',
      },
      failed: {
        color: 'text-red-700',
        bgColor: 'bg-red-100',
        icon: XCircle,
        label: 'Failed',
      },
    };
    return displays[status] || displays.pending;
  };

  if (isLoading) {
    return <PageLoader message="Loading order details..." />;
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h2>
          <p className="text-gray-600 mb-6">The order you're looking for doesn't exist.</p>
          <Link
            href="/orders"
            className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  const statusDisplay = getStatusDisplay(order.status);
  const StatusIcon = statusDisplay.icon;
  const canCancel = ['pending', 'processing'].includes(order.status);

  // Calculate subtotal
  const subtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = order.coupon?.discount || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50">
      {/* Header */}
      <div className="bg-white border-b-2 border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/orders"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-green-600 font-semibold transition-colors mb-4"
          >
            <ChevronLeft className="w-5 h-5" />
            Back to Orders
          </Link>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
                <Package className="w-8 h-8 text-green-600" />
                Order #{order.id.slice(0, 8)}
              </h1>
              <p className="text-gray-600 font-semibold mt-1 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Placed on {formatDate(order.createdAt)}
              </p>
            </div>
            <div
              className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold ${statusDisplay.bgColor} ${statusDisplay.color}`}
            >
              <StatusIcon className="w-5 h-5" />
              {statusDisplay.label}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b-2 border-gray-200">
                <h2 className="text-xl font-black text-gray-900">Order Items</h2>
              </div>
              <div className="divide-y-2 divide-gray-200">
                {order.items.map((item) => (
                  <div key={item.id} className="p-6 flex items-center gap-6">
                    <div className="relative w-24 h-24 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                      {item.product.image ? (
                        <Image
                          src={item.product.image}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <Package className="w-12 h-12 text-gray-400 absolute inset-0 m-auto" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/products/${item.product.id}`}
                        className="text-lg font-bold text-gray-900 hover:text-green-600 transition-colors line-clamp-2"
                      >
                        {item.product.name}
                      </Link>
                      <p className="text-gray-600 font-semibold mt-1">
                        Quantity: {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-gray-900">
                        {formatPrice(item.price)}
                      </p>
                      <p className="text-sm text-gray-600 font-semibold">per item</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Customer Info */}
            <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg p-6">
              <h2 className="text-xl font-black text-gray-900 mb-4">Customer Information</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-gray-700">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <span className="font-semibold">{order.user.email}</span>
                </div>
                {order.user.phone && (
                  <div className="flex items-center gap-3 text-gray-700">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <span className="font-semibold">{order.user.phone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Order Summary */}
            <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg p-6">
              <h2 className="text-xl font-black text-gray-900 mb-6">Order Summary</h2>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600 font-semibold">Subtotal</span>
                  <span className="font-bold text-gray-900">{formatPrice(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span className="font-semibold">Discount ({order.coupon?.code})</span>
                    <span className="font-bold">-{formatPrice(discount)}</span>
                  </div>
                )}
                <div className="pt-4 border-t-2 border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-black text-gray-900">Total</span>
                    <span className="text-2xl font-black text-green-600">
                      {formatPrice(order.total)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              {canCancel && (
                <button
                  onClick={handleCancelOrder}
                  disabled={isCancelling}
                  className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCancelling ? 'Cancelling...' : 'Cancel Order'}
                </button>
              )}
              {order.status === 'delivered' && (
                <button className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold rounded-xl transition-all">
                  <Download className="w-5 h-5" />
                  Download Invoice
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrderDetailPage({ params }: PageProps) {
  return (
    <AuthGuard>
      <OrderDetailPageContent params={params} />
    </AuthGuard>
  );
}