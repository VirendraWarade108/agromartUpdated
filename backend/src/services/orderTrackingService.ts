import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { OrderStatus } from '../validators/order';

/**
 * Canonical order status transition rules
 * Enforces valid state machine transitions
 */
const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['paid', 'cancelled', 'failed'],
  paid: ['processing', 'cancelled', 'refunded'],
  processing: ['shipped', 'cancelled', 'refunded'],
  shipped: ['delivered'],
  delivered: ['refunded'],
  cancelled: [], // terminal state
  refunded: [], // terminal state
  failed: ['cancelled'],
};

/**
 * Validates if a status transition is allowed
 * @param fromStatus - Current order status
 * @param toStatus - Desired new status
 * @returns true if transition is valid, false otherwise
 */
const isValidOrderTransition = (fromStatus: OrderStatus, toStatus: OrderStatus): boolean => {
  // Allow transitions to same status (idempotent updates)
  if (fromStatus === toStatus) {
    return true;
  }

  const allowedTransitions = VALID_TRANSITIONS[fromStatus];
  return allowedTransitions.includes(toStatus);
};

/**
 * Get order tracking history
 */
export const getOrderTracking = async (orderId: string, userId?: string) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      tracking: {
        orderBy: { timestamp: 'asc' },
      },
    },
  });

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  if (userId && order.userId !== userId) {
    throw new AppError('Unauthorized to access this order', 403);
  }

  return order.tracking;
};

/**
 * Add tracking update (Admin)
 * Validates status transitions and updates order status
 */
export const addTrackingUpdate = async (trackingData: {
  orderId: string;
  status: OrderStatus;
  location?: string;
  description: string;
  metadata?: any;
}) => {
  const validStatuses: OrderStatus[] = [
    'pending',
    'paid',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
    'refunded',
    'failed'
  ];

  if (!validStatuses.includes(trackingData.status)) {
    throw new AppError(`Invalid order status: ${trackingData.status}`, 400);
  }

  const order = await prisma.order.findUnique({
    where: { id: trackingData.orderId },
  });

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  // Enforce state machine transition rules
  const currentStatus = order.status as OrderStatus;
  if (!isValidOrderTransition(currentStatus, trackingData.status)) {
    throw new AppError(
      `Invalid status transition: cannot move from "${order.status}" to "${trackingData.status}"`,
      400
    );
  }

  // Create tracking entry
  const tracking = await prisma.orderTracking.create({
    data: {
      orderId: trackingData.orderId,
      status: trackingData.status,
      location: trackingData.location || null,
      description: trackingData.description,
      metadata: trackingData.metadata || null,
    },
  });

  // Update order status
  await prisma.order.update({
    where: { id: trackingData.orderId },
    data: { status: trackingData.status },
  });

  return tracking;
};

/**
 * Get latest tracking status
 */
export const getLatestTracking = async (orderId: string) => {
  const latestTracking = await prisma.orderTracking.findFirst({
    where: { orderId },
    orderBy: { timestamp: 'desc' },
  });

  if (!latestTracking) {
    throw new AppError('No tracking information found', 404);
  }

  return latestTracking;
};

/**
 * Get all orders by status (Admin)
 */
export const getOrdersByStatus = async (status: OrderStatus) => {
  const validStatuses: OrderStatus[] = [
    'pending',
    'paid',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
    'refunded',
    'failed'
  ];

  if (!validStatuses.includes(status)) {
    throw new AppError(`Invalid order status: ${status}`, 400);
  }

  const orders = await prisma.order.findMany({
    where: { status },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          fullName: true,
        },
      },
      tracking: {
        orderBy: { timestamp: 'desc' },
        take: 1,
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return orders;
};

/**
 * Bulk update order status (Admin)
 * Validates each status transition before updating
 */
export const bulkUpdateOrderStatus = async (
  updates: Array<{
    orderId: string;
    status: OrderStatus;
    description: string;
    location?: string;
  }>
) => {
  const validStatuses: OrderStatus[] = [
    'pending',
    'paid',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
    'refunded',
    'failed'
  ];

  const results = await Promise.all(
    updates.map(async (update) => {
      try {
        // Validate status
        if (!validStatuses.includes(update.status)) {
          return {
            success: false,
            orderId: update.orderId,
            error: `Invalid status: ${update.status}`,
          };
        }

        // Fetch current order status to validate transition
        const order = await prisma.order.findUnique({
          where: { id: update.orderId },
        });

        if (!order) {
          return {
            success: false,
            orderId: update.orderId,
            error: 'Order not found',
          };
        }

        // Validate transition
        const currentStatus = order.status as OrderStatus;
        if (!isValidOrderTransition(currentStatus, update.status)) {
          return {
            success: false,
            orderId: update.orderId,
            error: `Invalid transition from "${order.status}" to "${update.status}"`,
          };
        }

        const tracking = await addTrackingUpdate({
          orderId: update.orderId,
          status: update.status,
          description: update.description,
          location: update.location,
        });
        return { success: true, orderId: update.orderId, tracking };
      } catch (error) {
        return {
          success: false,
          orderId: update.orderId,
          error: error instanceof Error ? error.message : 'Update failed',
        };
      }
    })
  );

  const succeeded = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  return {
    total: updates.length,
    succeeded: succeeded.length,
    failed: failed.length,
    results,
  };
};

/**
 * Get tracking timeline with estimated delivery
 * Uses canonical order status flow
 */
export const getTrackingTimeline = async (orderId: string, userId?: string) => {
  const tracking = await getOrderTracking(orderId, userId);

  // Canonical status flow for successful orders
  const statusFlow: OrderStatus[] = [
    'pending',
    'paid',
    'processing',
    'shipped',
    'delivered',
  ];

  const timeline = statusFlow.map((status) => {
    const trackingEntry = tracking.find((t) => t.status === status);
    return {
      status,
      completed: !!trackingEntry,
      timestamp: trackingEntry?.timestamp || null,
      description: trackingEntry?.description || null,
      location: trackingEntry?.location || null,
    };
  });

  // Calculate estimated delivery from shipped date
  const shippedEntry = tracking.find((t) => t.status === 'shipped');
  let estimatedDelivery: Date | null = null;
  if (shippedEntry) {
    const deliveryDate = new Date(shippedEntry.timestamp);
    deliveryDate.setDate(deliveryDate.getDate() + 4); // 4 days from shipped
    estimatedDelivery = deliveryDate;
  }

  // Get current status from last tracking entry, default to 'pending'
  const currentStatus: OrderStatus = tracking.length > 0 
    ? (tracking[tracking.length - 1]?.status as OrderStatus) 
    : 'pending';

  return {
    timeline,
    estimatedDelivery,
    currentStatus,
  };
};