'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ShoppingCart, 
  Search, 
  Filter,
  Download,
  Eye,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import { orderApi, adminApi, handleApiError } from '@/lib/api';
import { showSuccessToast, showErrorToast } from '@/store/uiStore';
import { TableSkeleton } from '@/components/shared/LoadingSpinner';
import { formatPrice, formatDate } from '@/lib/utils';

interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  items: any[];
  total: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentMethod: string;
  paymentStatus: 'pending' | 'completed' | 'failed';
  shippingAddress: any;
  createdAt: string;
  deliveredAt?: string;
}

export default function AdminOrdersPage() {
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

      const response = await adminApi.getAllOrders(params);
      
      if (response.data.success) {
        const data = response.data.data;
        setOrders(Array.isArray(data) ? data : data.orders || []);
      }
    } catch (error) {
      const message = handleApiError(error);
      showErrorToast(message, 'Failed to load orders');
     } finally {
      setIsLoading(false);
    }
  };

  // Update order status
  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      await adminApi.updateOrderStatus(orderId, newStatus);
      showSuccessToast(`Order status updated to ${newStatus}`);
      fetchOrders();
    } catch (error) {
      const message = handleApiError(error);
      showErrorToast(message, 'Update Failed');
    }
  };

  // Filter orders by search
  const filteredOrders = orders.filter((order) =>
    order.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.customerEmail?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Status options
  const statusOptions = [
    { value: 'all', label: 'All Orders', count: orders.length },
    { value: 'pending', label: 'Pending', count: orders.filter(o => o.status === 'pending').length },
    { value: 'confirmed', label: 'Confirmed', count: orders.filter(o => o.status === 'confirmed').length },
    { value: 'processing', label: 'Processing', count: orders.filter(o => o.status === 'processing').length },
    { value: 'shipped', label: 'Shipped', count: orders.filter(o => o.status === 'shipped').length },
    { value: 'delivered', label: 'Delivered', count: orders.filter(o => o.status === 'delivered').length },
    { value: 'cancelled', label: 'Cancelled', count: orders.filter(o => o.status === 'cancelled').length },
  ];

  // Get status color and icon
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
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="h-10 w-64 bg-white/10 rounded-xl animate-pulse mb-2"></div>
            <div className="h-6 w-96 bg-white/10 rounded-lg animate-pulse"></div>
          </div>
          <TableSkeleton rows={10} cols={6} />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <ShoppingCart className="w-8 h-8 text-green-400" />
            Orders Management
          </h1>
          <p className="text-gray-300 font-semibold mt-1">
            View and manage customer orders ({filteredOrders.length} orders)
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-xl p-2">
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setSelectedStatus(option.value)}
                className={`
                  px-4 py-2 rounded-xl font-bold text-sm transition-all
                  ${selectedStatus === option.value
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }
                `}
              >
                {option.label} ({option.count})
              </button>
            ))}
          </div>
        </div>

        {/* Search & Actions */}
        <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-xl p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by order number, customer name, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-400 font-semibold text-gray-900"
                />
              </div>
            </div>

            {/* Export Button */}
            <button className="flex items-center gap-2 px-6 py-3 border-2 border-gray-200 hover:border-green-400 rounded-xl font-bold text-gray-900 transition-all">
              <Download className="w-5 h-5" />
              Export
            </button>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-black text-gray-900">
                    Order
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-black text-gray-900">
                    Customer
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-black text-gray-900">
                    Items
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-black text-gray-900">
                    Total
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-black text-gray-900">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-black text-gray-900">
                    Payment
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-black text-gray-900">
                    Date
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-black text-gray-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <ShoppingCart className="w-12 h-12 text-gray-400" />
                        <p className="text-gray-600 font-bold">No orders found</p>
                        <p className="text-gray-500 text-sm font-semibold">
                          {searchQuery ? 'Try different search terms' : 'Orders will appear here when customers make purchases'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                    const statusDisplay = getStatusDisplay(order.status);
                    const StatusIcon = statusDisplay.icon;

                    return (
                      <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                        {/* Order Number */}
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-black text-gray-900">{order.orderNumber || `ORD-${order.id.substring(0, 8)}`}</p>
                            <p className="text-sm text-gray-600 font-semibold">ID: {order.id}</p>
                          </div>
                        </td>

                        {/* Customer */}
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-bold text-gray-900">{order.customerName || 'N/A'}</p>
                            <p className="text-sm text-gray-600 font-semibold">{order.customerEmail || 'N/A'}</p>
                          </div>
                        </td>

                        {/* Items */}
                        <td className="px-6 py-4">
                          <p className="font-bold text-gray-900">{order.items.length} items</p>
                        </td>

                        {/* Total */}
                        <td className="px-6 py-4">
                          <p className="font-black text-gray-900 text-lg">{formatPrice(order.total)}</p>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-bold border-2 ${statusDisplay.color}`}>
                            <StatusIcon className="w-4 h-4" />
                            {statusDisplay.label}
                          </span>
                        </td>

                        {/* Payment */}
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-bold text-gray-900 capitalize">{order.paymentMethod || 'N/A'}</p>
                            <span className={`text-xs font-bold ${order.paymentStatus === 'completed' ? 'text-green-600' : 'text-yellow-600'}`}>
                              {order.paymentStatus || 'pending'}
                            </span>
                          </div>
                        </td>

                        {/* Date */}
                        <td className="px-6 py-4">
                          <p className="text-sm font-semibold text-gray-900">
                            {formatDate(order.createdAt)}
                          </p>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/admin/orders/${order.id}`}
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-5 h-5 text-blue-600" />
                            </Link>
                            <button
                              onClick={() => {
                                // Show status update modal
                                alert('Status update modal would open here');
                              }}
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Update Status"
                            >
                              <ChevronRight className="w-5 h-5 text-gray-600" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { 
              label: 'Total Orders', 
              value: orders.length, 
              color: 'text-blue-600',
              icon: ShoppingCart
            },
            { 
              label: 'Processing', 
              value: orders.filter(o => ['pending', 'confirmed', 'processing'].includes(o.status)).length, 
              color: 'text-purple-600',
              icon: Clock
            },
            { 
              label: 'Completed', 
              value: orders.filter(o => o.status === 'delivered').length, 
              color: 'text-green-600',
              icon: CheckCircle
            },
            { 
              label: 'Revenue', 
              value: formatPrice(orders.reduce((sum, o) => sum + o.total, 0)), 
              color: 'text-orange-600',
              icon: TrendingUp
            },
          ].map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div key={idx} className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg p-6">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-gray-600 font-bold text-sm">{stat.label}</p>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <p className={`text-3xl font-black ${stat.color}`}>{stat.value}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}