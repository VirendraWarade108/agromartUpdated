'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Package, Search, Filter, Eye, Download, Calendar, TrendingUp, Clock, CheckCircle, XCircle, Truck, ChevronRight } from 'lucide-react';
import { orderApi, handleApiError } from '@/lib/api';
import { showErrorToast } from '@/store/uiStore';
import { PageLoader, TableSkeleton } from '@/components/shared/LoadingSpinner';
import { formatPrice, formatDate } from '@/lib/utils';
import AuthGuard from '@/components/shared/AuthGuard';

interface Order {
  id: string;
  orderNumber: string;
  items: any[];
  total: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentMethod: string;
  paymentStatus: 'pending' | 'completed' | 'failed';
  shippingAddress: any;
  createdAt: string;
  deliveredAt?: string;
}

function OrdersPageContent() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Fetch orders
  useEffect(() => {
    fetchOrders();
  }, [selectedStatus]);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const params: any = { limit: 100 };
      if (selectedStatus !== 'all') {
        params.status = selectedStatus;
      }

      const response = await orderApi.getAll(params);
      
      if (response.data.success) {
        const data = response.data.data;
        setOrders(Array.isArray(data) ? data : data.orders || []);
      }
    } catch (error) {
      const message = handleApiError(error);
      showErrorToast(message, 'Failed to load orders');
    // Only show mock data in development
    } finally {
      setIsLoading(false);
    }
  };

  // Filter orders by search
  const filteredOrders = orders.filter((order) =>
    order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Status options
  const statusOptions = [
    { value: 'all', label: 'All Orders', count: orders.length },
    { value: 'pending', label: 'Pending', count: orders.filter(o => o.status === 'pending').length },
    { value: 'processing', label: 'Processing', count: orders.filter(o => o.status === 'processing').length },
    { value: 'shipped', label: 'Shipped', count: orders.filter(o => o.status === 'shipped').length },
    { value: 'delivered', label: 'Delivered', count: orders.filter(o => o.status === 'delivered').length },
  ];

  // Get status display
  const getStatusDisplay = (status: string) => {
    const displays: Record<string, { color: string; icon: any; label: string }> = {
      pending: { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Clock, label: 'Pending' },
      confirmed: { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: CheckCircle, label: 'Confirmed' },
      processing: { color: 'bg-purple-100 text-purple-700 border-purple-200', icon: Package, label: 'Processing' },
      shipped: { color: 'bg-indigo-100 text-indigo-700 border-indigo-200', icon: Truck, label: 'Shipped' },
      delivered: { color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle, label: 'Delivered' },
      cancelled: { color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle, label: 'Cancelled' },
    };
    return displays[status] || displays.pending;
  };

  if (isLoading) {
    return <PageLoader message="Loading your orders..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900">
      {/* Header */}
      <div className="bg-white/5 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <Package className="w-8 h-8 text-green-400" />
            My Orders
          </h1>
          <p className="text-gray-300 font-semibold mt-1">
            Track and manage your orders ({filteredOrders.length} orders)
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
        {/* Status Filter Tabs */}
        <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-xl p-2">
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setSelectedStatus(option.value)}
                className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                  selectedStatus === option.value
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                {option.label} ({option.count})
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-xl p-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by order number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-400 font-semibold text-gray-900"
            />
          </div>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-xl p-16 text-center">
            <Package className="w-24 h-24 text-gray-400 mx-auto mb-6" />
            <h3 className="text-2xl font-black text-gray-900 mb-2">No Orders Found</h3>
            <p className="text-gray-600 font-semibold mb-8">
              {searchQuery ? 'Try different search terms' : 'Start shopping to see your orders here'}
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-xl transition-all shadow-lg"
            >
              Browse Products
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order) => {
              const statusDisplay = getStatusDisplay(order.status);
              const StatusIcon = statusDisplay.icon;

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl border-2 border-gray-200 hover:border-green-400 shadow-lg hover:shadow-2xl transition-all overflow-hidden"
                >
                  {/* Order Header */}
                  <div className="p-6 bg-gray-50 border-b-2 border-gray-200">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl flex items-center justify-center">
                          <Package className="w-8 h-8 text-green-600" />
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-gray-900">{order.orderNumber}</h3>
                          <p className="text-sm text-gray-600 font-semibold flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {formatDate(order.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold border-2 ${statusDisplay.color}`}>
                          <StatusIcon className="w-4 h-4" />
                          {statusDisplay.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Order Body */}
                  <div className="p-6">
                    <div className="grid md:grid-cols-3 gap-6 mb-6">
                      <div>
                        <p className="text-sm text-gray-600 font-semibold mb-1">Items</p>
                        <p className="text-lg font-black text-gray-900">{order.items.length} items</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 font-semibold mb-1">Total Amount</p>
                        <p className="text-lg font-black text-green-600">{formatPrice(order.total)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 font-semibold mb-1">Payment</p>
                        <p className="text-lg font-bold text-gray-900 capitalize">{order.paymentMethod || 'N/A'}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Link
                        href={`/orders/${order.id}`}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-xl transition-all shadow-lg"
                      >
                        <Eye className="w-5 h-5" />
                        View Details
                      </Link>
                      {order.status === 'delivered' && (
                        <button className="flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold rounded-xl transition-all">
                          <Download className="w-5 h-5" />
                          Invoice
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function OrdersPage() {
  return (
    <AuthGuard>
      <OrdersPageContent />
    </AuthGuard>
  );
}