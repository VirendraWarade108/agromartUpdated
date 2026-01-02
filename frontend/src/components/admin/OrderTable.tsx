'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Eye, 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Truck,
  MoreVertical,
  Download
} from 'lucide-react';
import { formatPrice, formatDate } from '@/lib/utils';

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
  shippingAddress?: any;
  createdAt: string;
  updatedAt: string;
  deliveredAt?: string;
}

/**
 * OrderTable Props
 */
interface OrderTableProps {
  orders: Order[];
  isLoading?: boolean;
  onStatusUpdate?: (orderId: string, newStatus: OrderStatus) => void;
  onViewDetails?: (orderId: string) => void;
  onDownloadInvoice?: (orderId: string) => void;
  showActions?: boolean;
}

/**
 * Reusable Order Table Component
 */
export function OrderTable({
  orders,
  isLoading = false,
  onStatusUpdate,
  onViewDetails,
  onDownloadInvoice,
  showActions = true,
}: OrderTableProps) {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  /**
   * Get status display info
   */
  const getStatusDisplay = (status: OrderStatus) => {
    const displays: Record<OrderStatus, { color: string; icon: any; label: string }> = {
      pending: { 
        color: 'bg-yellow-100 text-yellow-700 border-yellow-200', 
        icon: Clock, 
        label: 'Pending' 
      },
      confirmed: { 
        color: 'bg-blue-100 text-blue-700 border-blue-200', 
        icon: CheckCircle, 
        label: 'Confirmed' 
      },
      processing: { 
        color: 'bg-purple-100 text-purple-700 border-purple-200', 
        icon: Package, 
        label: 'Processing' 
      },
      shipped: { 
        color: 'bg-indigo-100 text-indigo-700 border-indigo-200', 
        icon: Truck, 
        label: 'Shipped' 
      },
      delivered: { 
        color: 'bg-green-100 text-green-700 border-green-200', 
        icon: CheckCircle, 
        label: 'Delivered' 
      },
      cancelled: { 
        color: 'bg-red-100 text-red-700 border-red-200', 
        icon: XCircle, 
        label: 'Cancelled' 
      },
      paid: { 
        color: 'bg-emerald-100 text-emerald-700 border-emerald-200', 
        icon: CheckCircle, 
        label: 'Paid' 
      },
      failed: { 
        color: 'bg-red-100 text-red-700 border-red-200', 
        icon: XCircle, 
        label: 'Failed' 
      },
    };
    return displays[status] || displays.pending;
  };

  /**
   * Available status options for update
   */
  const statusOptions: OrderStatus[] = [
    'pending',
    'confirmed',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
  ];

  /**
   * Handle status change
   */
  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    if (onStatusUpdate) {
      onStatusUpdate(orderId, newStatus);
    }
    setActiveDropdown(null);
  };

  /**
   * Toggle dropdown
   */
  const toggleDropdown = (orderId: string) => {
    setActiveDropdown(activeDropdown === orderId ? null : orderId);
  };

  /**
   * Close dropdown when clicking outside
   */
  const handleClickOutside = () => {
    setActiveDropdown(null);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-xl p-12">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
          <p className="text-gray-600 font-semibold">Loading orders...</p>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-xl p-12">
        <div className="flex flex-col items-center gap-3">
          <Package className="w-12 h-12 text-gray-400" />
          <p className="text-gray-600 font-bold">No orders found</p>
          <p className="text-gray-500 text-sm font-semibold">
            Orders will appear here when customers make purchases
          </p>
        </div>
      </div>
    );
  }

  return (
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
                Date
              </th>
              {showActions && (
                <th className="px-6 py-4 text-right text-sm font-black text-gray-900">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {orders.map((order) => {
              const statusDisplay = getStatusDisplay(order.status);
              const StatusIcon = statusDisplay.icon;

              return (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  {/* Order Number */}
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-black text-gray-900">
                        {order.orderNumber || `ORD-${order.id.substring(0, 8)}`}
                      </p>
                      <p className="text-sm text-gray-600 font-semibold">
                        ID: {order.id.substring(0, 12)}...
                      </p>
                    </div>
                  </td>

                  {/* Customer */}
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-bold text-gray-900">
                        {order.user?.fullName || 'N/A'}
                      </p>
                      <p className="text-sm text-gray-600 font-semibold">
                        {order.user?.email || 'N/A'}
                      </p>
                    </div>
                  </td>

                  {/* Items */}
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-900">
                      {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                    </p>
                  </td>

                  {/* Total */}
                  <td className="px-6 py-4">
                    <p className="font-black text-gray-900 text-lg">
                      {formatPrice(order.total)}
                    </p>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    <div className="relative">
                      <button
                        onClick={() => onStatusUpdate && toggleDropdown(order.id)}
                        disabled={!onStatusUpdate}
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-bold border-2 ${statusDisplay.color} ${
                          onStatusUpdate ? 'cursor-pointer hover:opacity-80' : 'cursor-default'
                        } transition-all`}
                      >
                        <StatusIcon className="w-4 h-4" />
                        {statusDisplay.label}
                      </button>

                      {/* Status Dropdown */}
                      {onStatusUpdate && activeDropdown === order.id && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={handleClickOutside}
                          />
                          <div className="absolute top-full left-0 mt-2 w-48 bg-white border-2 border-gray-200 rounded-xl shadow-2xl z-20 overflow-hidden">
                            {statusOptions.map((status) => {
                              const display = getStatusDisplay(status);
                              const Icon = display.icon;
                              
                              return (
                                <button
                                  key={status}
                                  onClick={() => handleStatusChange(order.id, status)}
                                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
                                >
                                  <Icon className={`w-4 h-4 ${display.color.split(' ')[1]}`} />
                                  <span className="font-bold text-gray-900 text-sm">
                                    {display.label}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  </td>

                  {/* Date */}
                  <td className="px-6 py-4">
                    <p className="text-sm font-semibold text-gray-900">
                      {formatDate(order.createdAt)}
                    </p>
                  </td>

                  {/* Actions */}
                  {showActions && (
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {onViewDetails && (
                          <button
                            onClick={() => onViewDetails(order.id)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-5 h-5 text-blue-600" />
                          </button>
                        )}
                        {onDownloadInvoice && (
                          <button
                            onClick={() => onDownloadInvoice(order.id)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Download Invoice"
                          >
                            <Download className="w-5 h-5 text-green-600" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default OrderTable;