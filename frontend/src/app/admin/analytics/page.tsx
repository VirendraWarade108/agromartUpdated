'use client';

import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, DollarSign, ShoppingCart, Users } from 'lucide-react';
import { adminApi, handleApiError } from '@/lib/api';
import { showErrorToast } from '@/store/uiStore';
import { PageLoader } from '@/components/shared/LoadingSpinner';
import { AdminGuard } from '@/components/shared/AuthGuard';
import { formatPrice } from '@/lib/utils';

interface AnalyticsData {
  revenue: {
    today: number;
    week: number;
    month: number;
    year: number;
  };
  orders: {
    total: number;
    pending: number;
    completed: number;
    cancelled: number;
  };
  customers: {
    total: number;
    new: number;
    active: number;
  };
  products: {
    total: number;
    inStock: number;
    lowStock: number;
  };
  topProducts: Array<{
    name: string;
    sales: number;
    revenue: number;
  }>;
}

function AnalyticsContent() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState('month');

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const response = await adminApi.getDashboardStats();
      
      if (response.data.success) {
        setData(response.data.data);
      }
    } catch (error) {
      const message = handleApiError(error);
      showErrorToast(message, 'Failed to load analytics');
     } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <PageLoader message="Loading analytics..." />;
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="w-24 h-24 text-gray-400 mx-auto mb-6" />
          <h2 className="text-3xl font-black text-white mb-4">No Analytics Data Available</h2>
          <p className="text-gray-300 font-semibold mb-8">Unable to load analytics data. Please try again later.</p>
          <button
            onClick={fetchAnalytics}
            className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-xl transition-all shadow-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const stats = [
    {
      label: 'Total Revenue',
      value: formatPrice(data.revenue.month),
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      label: 'Total Orders',
      value: data.orders.total.toLocaleString(),
      icon: ShoppingCart,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      label: 'Active Customers',
      value: data.customers.active.toLocaleString(),
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      label: 'Products In Stock',
      value: data.products.inStock.toLocaleString(),
      icon: ShoppingCart,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-black text-white flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-green-400" />
            Analytics Dashboard
          </h1>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-green-400"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="bg-white rounded-2xl border-2 border-gray-200 shadow-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-gray-600 font-bold text-sm">{stat.label}</h3>
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
                <p className="text-3xl font-black text-gray-900">{stat.value}</p>
                <div className="flex items-center gap-1 mt-3 text-green-600 font-bold text-sm">
                  <TrendingUp className="w-4 h-4" />
                  <span>+12.5% from last period</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Order Status */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-xl p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Order Status</h2>
            <div className="space-y-4">
              {[
                { label: 'Completed', value: data.orders.completed, color: 'bg-green-500' },
                { label: 'Pending', value: data.orders.pending, color: 'bg-yellow-500' },
                { label: 'Cancelled', value: data.orders.cancelled, color: 'bg-red-500' },
              ].map((status) => (
                <div key={status.label}>
                  <div className="flex justify-between mb-2">
                    <span className="font-bold text-gray-900">{status.label}</span>
                    <span className="font-bold text-gray-900">
                      {status.value} ({((status.value / data.orders.total) * 100).toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${status.color}`}
                      style={{ width: `${(status.value / data.orders.total) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Revenue Breakdown */}
          <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-xl p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Revenue Breakdown</h2>
            <div className="space-y-3">
              {[
                { label: 'Today', value: data.revenue.today },
                { label: 'This Week', value: data.revenue.week },
                { label: 'This Month', value: data.revenue.month },
                { label: 'This Year', value: data.revenue.year },
              ].map((period) => (
                <div key={period.label} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-bold text-gray-900">{period.label}</span>
                  <span className="font-black text-green-600">{formatPrice(period.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-xl p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Top Selling Products</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left px-4 py-3 font-bold text-gray-900">Product</th>
                  <th className="text-right px-4 py-3 font-bold text-gray-900">Sales</th>
                  <th className="text-right px-4 py-3 font-bold text-gray-900">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {data.topProducts.map((product, idx) => (
                  <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-4 py-3 font-bold text-gray-900">{product.name}</td>
                    <td className="text-right px-4 py-3 font-bold text-gray-900">
                      {product.sales} units
                    </td>
                    <td className="text-right px-4 py-3 font-bold text-green-600">
                      {formatPrice(product.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminAnalyticsPage() {
  return (
    <AdminGuard>
      <AnalyticsContent />
    </AdminGuard>
  );
}