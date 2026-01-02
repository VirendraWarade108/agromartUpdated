import React from 'react';
import { motion } from 'framer-motion';
import {
  Package,
  CheckCircle,
  Clock,
  Truck,
  MapPin,
  XCircle,
  RefreshCw,
  PackageCheck,
  ShoppingCart,
  CreditCard,
  PackageX,
  AlertCircle,
} from 'lucide-react';

/**
 * Order Status Type
 */
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

/**
 * Timeline Event Interface
 */
interface TimelineEvent {
  status: OrderStatus;
  message: string;
  location?: string;
  timestamp: string;
  isCompleted: boolean;
}

/**
 * Order Timeline Props
 */
interface OrderTimelineProps {
  currentStatus: OrderStatus;
  events?: TimelineEvent[];
  estimatedDelivery?: string;
  trackingUrl?: string;
  className?: string;
}

/**
 * Status Configuration
 */
const statusConfig: Record<
  OrderStatus,
  {
    label: string;
    icon: React.ElementType;
    color: string;
    bgColor: string;
    borderColor: string;
  }
> = {
  pending: {
    label: 'Order Placed',
    icon: ShoppingCart,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
  },
  confirmed: {
    label: 'Order Confirmed',
    icon: CheckCircle,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  processing: {
    label: 'Processing',
    icon: Package,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
  },
  shipped: {
    label: 'Shipped',
    icon: Truck,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
  },
  delivered: {
    label: 'Delivered',
    icon: PackageCheck,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
  },
  cancelled: {
    label: 'Cancelled',
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
  },
  refunded: {
    label: 'Refunded',
    icon: RefreshCw,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
  },
};

/**
 * Default Timeline Steps (Normal Flow)
 */
const defaultSteps: OrderStatus[] = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
];

/**
 * Format Date/Time
 */
const formatDateTime = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    return dateString;
  }
};

/**
 * Get Status Index
 */
const getStatusIndex = (status: OrderStatus): number => {
  const index = defaultSteps.indexOf(status);
  return index === -1 ? 0 : index;
};

/**
 * OrderTimeline Component
 */
export const OrderTimeline: React.FC<OrderTimelineProps> = ({
  currentStatus,
  events = [],
  estimatedDelivery,
  trackingUrl,
  className = '',
}) => {
  const currentIndex = getStatusIndex(currentStatus);
  const isCancelled = currentStatus === 'cancelled';
  const isRefunded = currentStatus === 'refunded';
  const isCompleted = currentStatus === 'delivered';

  // Determine which steps to show
  const stepsToShow = isCancelled || isRefunded 
    ? [currentStatus] 
    : defaultSteps;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Current Status Card */}
      <div
        className={`p-6 rounded-2xl border-2 ${
          statusConfig[currentStatus].bgColor
        } ${statusConfig[currentStatus].borderColor}`}
      >
        <div className="flex items-center gap-4">
          <div
            className={`w-16 h-16 rounded-xl ${
              statusConfig[currentStatus].bgColor
            } border-2 ${
              statusConfig[currentStatus].borderColor
            } flex items-center justify-center`}
          >
            {React.createElement(statusConfig[currentStatus].icon, {
              className: `w-8 h-8 ${statusConfig[currentStatus].color}`,
            })}
          </div>
          <div className="flex-1">
            <h3
              className={`text-2xl font-black ${
                statusConfig[currentStatus].color
              }`}
            >
              {statusConfig[currentStatus].label}
            </h3>
            <p className="text-gray-700 font-semibold mt-1">
              {isCancelled && 'Your order has been cancelled'}
              {isRefunded && 'Your order has been refunded'}
              {isCompleted && 'Your order has been delivered'}
              {!isCancelled &&
                !isRefunded &&
                !isCompleted &&
                'Your order is being processed'}
            </p>
          </div>
        </div>
      </div>

      {/* Estimated Delivery */}
      {estimatedDelivery && !isCancelled && !isRefunded && !isCompleted && (
        <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm font-bold text-blue-900">
                Estimated Delivery
              </p>
              <p className="text-sm text-blue-700 font-semibold">
                {formatDateTime(estimatedDelivery)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tracking URL */}
      {trackingUrl && !isCancelled && !isRefunded && (
        <a
          href={trackingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block p-4 bg-indigo-50 border-2 border-indigo-200 rounded-xl hover:bg-indigo-100 transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-indigo-600" />
              <div>
                <p className="text-sm font-bold text-indigo-900">
                  Track Your Package
                </p>
                <p className="text-xs text-indigo-700 font-semibold">
                  Click to view live tracking
                </p>
              </div>
            </div>
            <AlertCircle className="w-5 h-5 text-indigo-600" />
          </div>
        </a>
      )}

      {/* Timeline Steps */}
      {!isCancelled && !isRefunded && (
        <div className="relative">
          <div className="space-y-6">
            {stepsToShow.map((status, index) => {
              const config = statusConfig[status];
              const isActive = index <= currentIndex;
              const isCurrent = index === currentIndex;

              return (
                <motion.div
                  key={status}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative flex items-start gap-4"
                >
                  {/* Connector Line */}
                  {index < stepsToShow.length - 1 && (
                    <div
                      className={`absolute left-6 top-12 w-0.5 h-12 ${
                        isActive ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                    ></div>
                  )}

                  {/* Icon */}
                  <div
                    className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      isActive
                        ? `${config.bgColor} ${config.borderColor}`
                        : 'bg-gray-50 border-gray-200'
                    } ${isCurrent ? 'ring-4 ring-green-100' : ''}`}
                  >
                    {React.createElement(config.icon, {
                      className: `w-6 h-6 ${
                        isActive ? config.color : 'text-gray-400'
                      }`,
                    })}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pt-1">
                    <h4
                      className={`font-bold text-lg ${
                        isActive ? 'text-gray-900' : 'text-gray-400'
                      }`}
                    >
                      {config.label}
                    </h4>
                    {isCurrent && (
                      <p className="text-sm text-gray-600 font-semibold mt-1">
                        Current Status
                      </p>
                    )}
                    {!isActive && index > currentIndex && (
                      <p className="text-sm text-gray-400 font-semibold mt-1">
                        Pending
                      </p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Detailed Events */}
      {events && events.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-xl font-black text-gray-900">Order History</h4>
          <div className="space-y-3">
            {events.map((event, index) => {
              const config = statusConfig[event.status] || statusConfig.pending;

              return (
                <motion.div
                  key={`${event.status}-${index}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-4 rounded-xl border-2 ${
                    event.isCompleted
                      ? `${config.bgColor} ${config.borderColor}`
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        event.isCompleted
                          ? config.bgColor
                          : 'bg-gray-100'
                      }`}
                    >
                      {React.createElement(config.icon, {
                        className: `w-5 h-5 ${
                          event.isCompleted ? config.color : 'text-gray-400'
                        }`,
                      })}
                    </div>
                    <div className="flex-1">
                      <p
                        className={`font-bold ${
                          event.isCompleted
                            ? 'text-gray-900'
                            : 'text-gray-500'
                        }`}
                      >
                        {event.message}
                      </p>
                      {event.location && (
                        <p className="text-sm text-gray-600 font-semibold flex items-center gap-1 mt-1">
                          <MapPin className="w-4 h-4" />
                          {event.location}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 font-semibold mt-1">
                        {formatDateTime(event.timestamp)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Cancelled/Refunded Message */}
      {(isCancelled || isRefunded) && (
        <div
          className={`p-6 rounded-xl border-2 ${
            isCancelled
              ? 'bg-red-50 border-red-200'
              : 'bg-orange-50 border-orange-200'
          }`}
        >
          <div className="flex items-start gap-3">
            {isCancelled ? (
              <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
            ) : (
              <RefreshCw className="w-6 h-6 text-orange-600 flex-shrink-0" />
            )}
            <div>
              <h4
                className={`font-bold ${
                  isCancelled ? 'text-red-900' : 'text-orange-900'
                }`}
              >
                {isCancelled ? 'Order Cancelled' : 'Order Refunded'}
              </h4>
              <p
                className={`text-sm font-semibold mt-1 ${
                  isCancelled ? 'text-red-700' : 'text-orange-700'
                }`}
              >
                {isCancelled
                  ? 'This order has been cancelled. If you were charged, you will receive a refund within 5-7 business days.'
                  : 'Your refund has been processed and will be credited to your original payment method within 5-7 business days.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderTimeline;