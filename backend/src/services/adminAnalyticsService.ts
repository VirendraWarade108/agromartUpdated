import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';

/**
 * Get dashboard statistics
 * Overview stats for admin dashboard
 */
export const getDashboardStats = async () => {
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  // Get all counts and aggregates in parallel
  const [
    totalUsers,
    totalProducts,
    totalOrders,
    totalRevenue,
    thisMonthRevenue,
    lastMonthRevenue,
    thisMonthOrders,
    lastMonthOrders,
    pendingOrders,
    lowStockProducts,
    recentOrders,
  ] = await Promise.all([
    // Total users
    prisma.user.count(),

    // Total products
    prisma.product.count(),

    // Total orders
    prisma.order.count(),

    // Total revenue (all time)
    prisma.order.aggregate({
      _sum: { total: true },
      where: { status: { in: ['paid', 'delivered'] } },
    }),

    // This month revenue
    prisma.order.aggregate({
      _sum: { total: true },
      where: {
        status: { in: ['paid', 'delivered'] },
        createdAt: { gte: thisMonthStart },
      },
    }),

    // Last month revenue
    prisma.order.aggregate({
      _sum: { total: true },
      where: {
        status: { in: ['paid', 'delivered'] },
        createdAt: { gte: lastMonthStart, lte: lastMonthEnd },
      },
    }),

    // This month orders
    prisma.order.count({
      where: { createdAt: { gte: thisMonthStart } },
    }),

    // Last month orders
    prisma.order.count({
      where: { createdAt: { gte: lastMonthStart, lte: lastMonthEnd } },
    }),

    // Pending orders
    prisma.order.count({
      where: { status: 'pending' },
    }),

    // Low stock products
    prisma.product.count({
      where: { stock: { lte: 10, gt: 0 } },
    }),

    // Recent orders
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
          },
        },
      },
    }),
  ]);

  // Calculate growth percentages
  const revenueGrowth = lastMonthRevenue._sum.total
    ? ((thisMonthRevenue._sum.total || 0) - (lastMonthRevenue._sum.total || 0)) /
      (lastMonthRevenue._sum.total || 1) * 100
    : 0;

  const ordersGrowth = lastMonthOrders
    ? ((thisMonthOrders - lastMonthOrders) / lastMonthOrders) * 100
    : 0;

  return {
    overview: {
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue: totalRevenue._sum.total || 0,
      pendingOrders,
      lowStockProducts,
    },
    thisMonth: {
      revenue: thisMonthRevenue._sum.total || 0,
      orders: thisMonthOrders,
      revenueGrowth: Math.round(revenueGrowth * 100) / 100,
      ordersGrowth: Math.round(ordersGrowth * 100) / 100,
    },
    recentOrders,
  };
};

/**
 * Get sales report
 * Detailed sales data for charts and analysis
 */
export const getSalesReport = async (filters?: {
  startDate?: string;
  endDate?: string;
  groupBy?: 'day' | 'week' | 'month';
}) => {
  const { startDate, endDate, groupBy = 'day' } = filters || {};

  // Default to last 30 days if no dates provided
  const end = endDate ? new Date(endDate) : new Date();
  const start = startDate
    ? new Date(startDate)
    : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Get orders in date range
  const orders = await prisma.order.findMany({
    where: {
      createdAt: {
        gte: start,
        lte: end,
      },
      status: { in: ['paid', 'delivered'] },
    },
    select: {
      id: true,
      total: true,
      createdAt: true,
      status: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  // Group data by time period
  const groupedData: Record<string, { date: string; revenue: number; orders: number }> = {};

  orders.forEach((order) => {
    let key: string;
    const date = new Date(order.createdAt);

    if (groupBy === 'day') {
      key = date.toISOString().split('T')[0]; // YYYY-MM-DD
    } else if (groupBy === 'week') {
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      key = weekStart.toISOString().split('T')[0];
    } else {
      // month
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }

    if (!groupedData[key]) {
      groupedData[key] = { date: key, revenue: 0, orders: 0 };
    }

    groupedData[key].revenue += order.total;
    groupedData[key].orders += 1;
  });

  // Convert to array and sort
  const salesData = Object.values(groupedData).sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  // Calculate totals
  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  const totalOrders = orders.length;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  return {
    summary: {
      totalRevenue,
      totalOrders,
      averageOrderValue: Math.round(averageOrderValue * 100) / 100,
      period: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
    },
    salesData,
  };
};

/**
 * Get product performance
 * Top selling products and categories
 */
export const getProductPerformance = async (limit: number = 10) => {
  // Get top selling products
  const topProducts = await prisma.orderItem.groupBy({
    by: ['productId'],
    _sum: {
      quantity: true,
      price: true,
    },
    _count: {
      productId: true,
    },
    orderBy: {
      _sum: {
        quantity: 'desc',
      },
    },
    take: limit,
  });

  // Get product details
  const productsWithDetails = await Promise.all(
    topProducts.map(async (item) => {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        select: {
          id: true,
          name: true,
          slug: true,
          image: true,
          price: true,
          category: {
            select: {
              name: true,
            },
          },
        },
      });

      return {
        product,
        totalQuantitySold: item._sum.quantity || 0,
        totalRevenue: (item._sum.price || 0) * (item._sum.quantity || 0),
        orderCount: item._count.productId,
      };
    })
  );

  // Get category performance
  const categoryPerformance = await prisma.product.findMany({
    select: {
      categoryId: true,
      category: {
        select: {
          id: true,
          name: true,
        },
      },
      orderItems: {
        select: {
          quantity: true,
          price: true,
        },
      },
    },
  });

  // Group by category
  const categoryStats: Record<string, { name: string; revenue: number; items: number }> = {};

  categoryPerformance.forEach((product) => {
    if (!product.category) return;

    const catId = product.category.id;
    if (!categoryStats[catId]) {
      categoryStats[catId] = {
        name: product.category.name,
        revenue: 0,
        items: 0,
      };
    }

    product.orderItems.forEach((item) => {
      categoryStats[catId].revenue += item.price * item.quantity;
      categoryStats[catId].items += item.quantity;
    });
  });

  const topCategories = Object.values(categoryStats)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  return {
    topProducts: productsWithDetails,
    topCategories,
  };
};

/**
 * Get user statistics
 * User growth and activity metrics
 */
export const getUserStatistics = async () => {
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [
    totalUsers,
    newUsersThisMonth,
    newUsersLastMonth,
    activeUsers,
    topCustomers,
  ] = await Promise.all([
    // Total users
    prisma.user.count(),

    // New users this month
    prisma.user.count({
      where: { createdAt: { gte: thisMonthStart } },
    }),

    // New users last month
    prisma.user.count({
      where: {
        createdAt: {
          gte: lastMonthStart,
          lt: thisMonthStart,
        },
      },
    }),

    // Active users (placed order in last 30 days)
    prisma.user.count({
      where: {
        orders: {
          some: {
            createdAt: {
              gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
            },
          },
        },
      },
    }),

    // Top customers by order value
    prisma.user.findMany({
      select: {
        id: true,
        fullName: true,
        email: true,
        _count: {
          select: { orders: true },
        },
        orders: {
          select: { total: true },
          where: { status: { in: ['paid', 'delivered'] } },
        },
      },
      take: 10,
    }),
  ]);

  // Calculate total spent for each customer
  const topCustomersWithSpend = topCustomers
    .map((user) => ({
      id: user.id,
      name: user.fullName,
      email: user.email,
      orderCount: user._count.orders,
      totalSpent: user.orders.reduce((sum, order) => sum + order.total, 0),
    }))
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 5);

  const userGrowth = newUsersLastMonth
    ? ((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth) * 100
    : 0;

  return {
    totalUsers,
    newUsersThisMonth,
    userGrowth: Math.round(userGrowth * 100) / 100,
    activeUsers,
    topCustomers: topCustomersWithSpend,
  };
};