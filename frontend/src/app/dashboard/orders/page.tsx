'use client';
import React from "react";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Package,
  ChevronRight,
  Calendar,
  CreditCard,
  Loader,
  AlertCircle,
  ShoppingBag,
  Filter,
  Search,
  Eye,
  Download,
  RefreshCw,
} from 'lucide-react';
import { orderApi, handleApiError } from '@/lib/api';
import { showErrorToast, showSuccessToast } from '@/store/uiStore';
import { PageLoader } from '@/components/shared/LoadingSpinner';
import { formatPrice } from '@/lib/utils';
import { OrderStatus } from '@/components/orders/OrderTimeline';

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  price: number;
  subtotal: number;
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
  createdAt: string;
  updatedAt: string;
  deliveredAt?: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

const statusConfig: Record<
  OrderStatus,
  { label: string; color: string; bgColor: string }
> = {
  pending: {
    label: 'Pending',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100 border-yellow-200',
  },
  confirmed: {
    label: 'Confirmed',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100 border-blue-200',
  },
  processing: {
    label: 'Processing',
    color: 'text-purple-700',
    bgColor: 'bg-purple-100 border-purple-200',
  },
  shipped: {
    label: 'Shipped',
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-100 border-indigo-200',
  },
  delivered: {
    label: 'Delivered',
    color: 'text-green-700',
    bgColor: 'bg-green-100 border-green-200',
  },
  cancelled: {
    label: 'Cancelled',
    color: 'text-red-700',
    bgColor: 'bg-red-100 border-red-200',
  },
  refunded: {
    label: 'Refunded',
    color: 'text-orange-700',
    bgColor: 'bg-orange-100 border-orange-200',
  },
};

export default function DashboardOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, currentPage]);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const params: {
        page: number;
        limit: number;
        status?: string;
      } = {
        page: currentPage,
        limit: 10,
      };

      if (statusFilter && statusFilter !== 'all') {
        params.status = statusFilter;
      }

      const response = await orderApi.getAll(params);

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch orders');
      }

      const ordersData = response.data.data || [];
      const paginationData = response.data.pagination;

      setOrders(ordersData);
      setPagination(paginationData || null);
    } catch (err) {
      const message = handleApiError(err);
      showErrorToast(message, 'Failed to load orders');
      console.error('Failed to fetch orders:', err);
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchOrders();
    setIsRefreshing(false);
    showSuccessToast('Orders refreshed', 'Success');
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch (error) {
      return dateString;
    }
  };

  const getItemsCount = (order: Order): number => {
    return order.items.reduce((sum, item) => sum + item.quantity, 0);
  };

  // Filter orders by search query
  const filteredOrders = searchQuery
    ? orders.filter(
        (order) =>
          order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.items.some((item) =>
            item.productName.toLowerCase().includes(searchQuery.toLowerCase())
          )
      )
    : orders;

  if (isLoading && orders.length === 0) {
    return <PageLoader message="Loading your orders..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900">
      {/* Header */}
      <div className="bg-white/5 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-white flex items-center gap-3">
                <ShoppingBag className="w-8 h-8 text-green-400" />
                My Orders
              </h1>
              <p className="text-gray-300 font-semibold mt-1">
                View and manage your orders
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw
                className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`}
              />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Filters */}
        <div className="mb-8 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by order number or product name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-400 font-semibold text-gray-900 transition-all"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-3 overflow-x-auto pb-2">
            <div className="flex items-center gap-2 flex-shrink-0">
              <Filter className="w-5 h-5 text-white" />
              <span className="text-white font-bold">Filter:</span>
            </div>
            {[
              { value: 'all', label: 'All Orders' },
              { value: 'pending', label: 'Pending' },
              { value: 'confirmed', label: 'Confirmed' },
              { value: 'processing', label: 'Processing' },
              { value: 'shipped', label: 'Shipped' },
              { value: 'delivered', label: 'Delivered' },
              { value: 'cancelled', label: 'Cancelled' },
            ].map((filter) => (
              <button
                key={filter.value}
                onClick={() => {
                  setStatusFilter(filter.value);
                  setCurrentPage(1);
                }}
                className={`px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${
                  statusFilter === filter.value
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-24 h-24 text-gray-400 mx-auto mb-6" />
            <h2 className="text-3xl font-black text-white mb-4">No Orders Found</h2>
            <p className="text-gray-300 font-semibold mb-8">
              {searchQuery
                ? 'No orders match your search criteria'
                : statusFilter !== 'all'
                ? `You don't have any ${statusFilter} orders`
                : "You haven't placed any orders yet"}
            </p>
            {statusFilter === 'all' && !searchQuery && (
              <Link
                href="/products"
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-xl transition-all shadow-lg"
              >
                Start Shopping
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-2xl border-2 border-gray-200 shadow-xl overflow-hidden hover:shadow-2xl transition-all"
              >
                <div className="p-6">
                  {/* Order Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-black text-gray-900">
                          Order #{order.orderNumber}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-lg text-sm font-bold border-2 ${
                            statusConfig[order.status].bgColor
                          } ${statusConfig[order.status].color}`}
                        >
                          {statusConfig[order.status].label}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 font-semibold">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(order.createdAt)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Package className="w-4 h-4" />
                          {getItemsCount(order)} {getItemsCount(order) === 1 ? 'item' : 'items'}
                        </div>
                        <div className="flex items-center gap-1">
                          <CreditCard className="w-4 h-4" />
                          {order.paymentMethod.toUpperCase()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600 font-semibold mb-1">
                        Total Amount
                      </p>
                      <p className="text-2xl font-black text-green-600">
                        {formatPrice(order.total)}
                      </p>
                    </div>
                  </div>

                  {/* Order Items Preview */}
                  <div className="mb-4">
                    <div className="flex items-center gap-3 overflow-x-auto pb-2">
                      {order.items.slice(0, 4).map((item) => (
                        <div
                          key={item.id}
                          className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg overflow-hidden"
                        >
                          <img
                            src={item.productImage || '/placeholder.png'}
                            alt={item.productName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                      {order.items.length > 4 && (
                        <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                          <span className="text-sm font-bold text-gray-600">
                            +{order.items.length - 4}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 pt-4 border-t-2 border-gray-100">
                    <Link
                      href={`/orders/${order.id}`}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-xl transition-all shadow-lg"
                    >
                      <Eye className="w-5 h-5" />
                      View Details
                    </Link>
                    <button
                      onClick={async () => {
                        try {
                          const response = await orderApi.getInvoice(order.id);
                          const blob = new Blob([response.data], {
                            type: 'application/pdf',
                          });
                          const url = window.URL.createObjectURL(blob);
                          const link = document.createElement('a');
                          link.href = url;
                          link.download = `invoice-${order.orderNumber}.pdf`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          window.URL.revokeObjectURL(url);
                          showSuccessToast('Invoice downloaded', 'Success');
                        } catch (err) {
                          const message = handleApiError(err);
                          showErrorToast(message, 'Download failed');
                        }
                      }}
                      className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold rounded-xl transition-all flex items-center gap-2"
                    >
                      <Download className="w-5 h-5" />
                      Invoice
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="mt-12 flex items-center justify-center gap-4">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={!pagination.hasPrev}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <div className="flex items-center gap-2">
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                .filter(
                  (page) =>
                    page === 1 ||
                    page === pagination.totalPages ||
                    Math.abs(page - currentPage) <= 1
                )
                .map((page, index, array) => (
                  <React.Fragment key={page}>
                    {index > 0 && array[index - 1] !== page - 1 && (
                      <span className="text-white font-bold">...</span>
                    )}
                    <button
                      onClick={() => handlePageChange(page)}
                      className={`w-12 h-12 rounded-xl font-bold transition-all ${
                        currentPage === page
                          ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg'
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      {page}
                    </button>
                  </React.Fragment>
                ))}
            </div>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={!pagination.hasNext}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}

        {/* Summary Stats */}
        {orders.length > 0 && (
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl border-2 border-white/20 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300 font-semibold mb-1">Total Orders</p>
                  <p className="text-3xl font-black text-white">
                    {pagination?.total || orders.length}
                  </p>
                </div>
                <Package className="w-12 h-12 text-green-400" />
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl border-2 border-white/20 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300 font-semibold mb-1">Active Orders</p>
                  <p className="text-3xl font-black text-white">
                    {
                      orders.filter((o) =>
                        ['pending', 'confirmed', 'processing', 'shipped'].includes(
                          o.status
                        )
                      ).length
                    }
                  </p>
                </div>
                <Loader className="w-12 h-12 text-blue-400" />
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl border-2 border-white/20 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300 font-semibold mb-1">Delivered</p>
                  <p className="text-3xl font-black text-white">
                    {orders.filter((o) => o.status === 'delivered').length}
                  </p>
                </div>
                <Package className="w-12 h-12 text-green-400" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}