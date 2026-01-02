'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ShoppingCart, 
  TrendingUp,
  Download,
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  Package
} from 'lucide-react';
import { adminApi, handleApiError } from '@/lib/api';
import { showSuccessToast, showErrorToast } from '@/store/uiStore';
import { OrderTable } from '@/components/admin/OrderTable';
import { formatPrice } from '@/lib/utils';

/**
 * Order Status Type
 */
type OrderStatus = 
  | 'pending' 
  | 'confirmed' 
  | 'processing' 
  | 'shipped' 
  | 'delivered' 
  | 'cancelled'
  | 'paid'
  | 'failed';

/**
 * Order Interface
 */
interface Order {
  id: string;
  orderNumber?: string;
  userId: string;
  user?: {
    id: string;
    fullName: string;
    email: string;
  };
  items: Array<{
    id: string;
    productId: string;
    quantity: number;
    price: number;
    product?: {
      id: string;
      name: string;
      slug: string;
      image?: string;
    };
  }>;
  total: number;
  status: OrderStatus;
  paymentMethod?: string;
  paymentStatus?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Admin Orders Page
 */
export default function AdminOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  /**
   * Fetch orders
   */
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
        
        // Handle both array and object responses
        if (Array.isArray(data)) {
          setOrders(data);
        } else if (data.orders) {
          setOrders(data.orders);
        } else {
          setOrders([]);
        }
      }
    } catch (error) {
      const message = handleApiError(error);
      showErrorToast(message, 'Failed to load orders');
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle status update
   */
  const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const response = await adminApi.updateOrderStatus(orderId, newStatus);
      
      if (response.data.success) {
        showSuccessToast(`Order status updated to ${newStatus}`, 'Success');
        fetchOrders();
      }
    } catch (error) {
      const message = handleApiError(error);
      showErrorToast(message, 'Failed to update status');
    }
  };

  /**
   * Handle view order details
   */
  const handleViewDetails = (orderId: string) => {
    router.push(`/admin/orders/${orderId}`);
  };

  /**
   * Handle download invoice
   */
  const handleDownloadInvoice = async (orderId: string) => {
    try {
      // Create a temporary link to download the invoice
      const link = document.createElement('a');
      link.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/orders/${orderId}/invoice`;
      link.download = `invoice-${orderId}.pdf`;
      link.target = '_blank';
      
      // Get auth token
      const token = localStorage.getItem('access_token');
      if (token) {
        link.setAttribute('Authorization', `Bearer ${token}`);
      }
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showSuccessToast('Invoice download started', 'Success');
    } catch (error) {
      const message = handleApiError(error);
      showErrorToast(message, 'Failed to download invoice');
    }
  };

  /**
   * Handle export orders
   */
  const handleExportOrders = () => {
    // TODO: Implement export functionality
    showSuccessToast('Export functionality coming soon', 'Info');
  };

  /**
   * Filter orders by search query
   */
  const filteredOrders = orders.filter((order) => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    const orderNumber = order.orderNumber || `ORD-${order.id.substring(0, 8)}`;
    const customerName = order.user?.fullName?.toLowerCase() || '';
    const customerEmail = order.user?.email?.toLowerCase() || '';
    
    return (
      orderNumber.toLowerCase().includes(query) ||
      customerName.includes(query) ||
      customerEmail.includes(query) ||
      order.id.toLowerCase().includes(query)
    );
  });

  /**
   * Status filter options
   */
  const statusOptions = [
    { value: 'all', label: 'All Orders', count: orders.length },
    { 
      value: 'pending', 
      label: 'Pending', 
      count: orders.filter(o => o.status === 'pending').length 
    },
    { 
      value: 'confirmed', 
      label: 'Confirmed', 
      count: orders.filter(o => o.status === 'confirmed').length 
    },
    { 
      value: 'processing', 
      label: 'Processing', 
      count: orders.filter(o => o.status === 'processing').length 
    },
    { 
      value: 'shipped', 
      label: 'Shipped', 
      count: orders.filter(o => o.status === 'shipped').length 
    },
    { 
      value: 'delivered', 
      label: 'Delivered', 
      count: orders.filter(o => o.status === 'delivered').length 
    },
    { 
      value: 'cancelled', 
      label: 'Cancelled', 
      count: orders.filter(o => o.status === 'cancelled').length 
    },
  ];

  /**
   * Calculate summary statistics
   */
  const totalRevenue = orders
    .filter(o => o.status === 'delivered' || o.status === 'paid')
    .reduce((sum, o) => sum + o.total, 0);
  
  const pendingOrders = orders.filter(
    o => ['pending', 'confirmed', 'processing'].includes(o.status)
  ).length;
  
  const completedOrders = orders.filter(o => o.status === 'delivered').length;

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

        {/* Search & Actions */}
        <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-xl p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
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
            <button 
              onClick={handleExportOrders}
              className="flex items-center gap-2 px-6 py-3 border-2 border-gray-200 hover:border-green-400 rounded-xl font-bold text-gray-900 transition-all"
            >
              <Download className="w-5 h-5" />
              Export
            </button>
          </div>
        </div>

        {/* Orders Table */}
        <OrderTable
          orders={filteredOrders}
          isLoading={isLoading}
          onStatusUpdate={handleStatusUpdate}
          onViewDetails={handleViewDetails}
          onDownloadInvoice={handleDownloadInvoice}
          showActions={true}
        />

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
              label: 'Pending', 
              value: pendingOrders, 
              color: 'text-purple-600',
              icon: Clock
            },
            { 
              label: 'Completed', 
              value: completedOrders, 
              color: 'text-green-600',
              icon: CheckCircle
            },
            { 
              label: 'Revenue', 
              value: formatPrice(totalRevenue), 
              color: 'text-orange-600',
              icon: TrendingUp
            },
          ].map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div 
                key={idx} 
                className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg p-6"
              >
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