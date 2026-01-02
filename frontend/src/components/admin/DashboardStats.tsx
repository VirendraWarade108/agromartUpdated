import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, Package, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { formatPrice, formatCompactNumber } from '@/lib/utils';

export interface StatCard {
  label: string;
  value: number | string;
  change?: number;
  changeLabel?: string;
  icon: any;
  color: string;
  bgColor: string;
  trend?: 'up' | 'down' | 'neutral';
}

export interface DashboardStatsProps {
  stats?: {
    totalRevenue?: number;
    totalOrders?: number;
    totalCustomers?: number;
    totalProducts?: number;
    revenueGrowth?: number;
    ordersGrowth?: number;
    customersGrowth?: number;
    productsGrowth?: number;
  };
  isLoading?: boolean;
  className?: string;
}

/**
 * DashboardStats Component
 * Displays key metrics and KPIs for admin dashboard
 */
export default function DashboardStats({
  stats = {},
  isLoading = false,
  className = '',
}: DashboardStatsProps) {
  
  /**
   * Build stat cards from data
   */
  const statCards: StatCard[] = [
    {
      label: 'Total Revenue',
      value: stats.totalRevenue ? formatPrice(stats.totalRevenue) : '₹0',
      change: stats.revenueGrowth || 0,
      changeLabel: 'vs last month',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      trend: (stats.revenueGrowth || 0) >= 0 ? 'up' : 'down',
    },
    {
      label: 'Total Orders',
      value: stats.totalOrders ? formatCompactNumber(stats.totalOrders) : '0',
      change: stats.ordersGrowth || 0,
      changeLabel: 'vs last month',
      icon: ShoppingCart,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      trend: (stats.ordersGrowth || 0) >= 0 ? 'up' : 'down',
    },
    {
      label: 'Total Customers',
      value: stats.totalCustomers ? formatCompactNumber(stats.totalCustomers) : '0',
      change: stats.customersGrowth || 0,
      changeLabel: 'vs last month',
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      trend: (stats.customersGrowth || 0) >= 0 ? 'up' : 'down',
    },
    {
      label: 'Total Products',
      value: stats.totalProducts ? formatCompactNumber(stats.totalProducts) : '0',
      change: stats.productsGrowth || 0,
      changeLabel: 'vs last month',
      icon: Package,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      trend: (stats.productsGrowth || 0) >= 0 ? 'up' : 'down',
    },
  ];

  /**
   * Loading skeleton
   */
  if (isLoading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border-2 border-gray-200 p-6 animate-pulse"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
              <div className="w-16 h-6 bg-gray-200 rounded-lg"></div>
            </div>
            <div className="h-8 bg-gray-200 rounded w-24 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-32"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}>
      {statCards.map((stat, idx) => (
        <StatCardComponent key={idx} stat={stat} />
      ))}
    </div>
  );
}

/**
 * Individual Stat Card Component
 */
function StatCardComponent({ stat }: { stat: StatCard }) {
  const TrendIcon = stat.trend === 'up' ? ArrowUpRight : ArrowDownRight;
  const trendColor = stat.trend === 'up' ? 'text-green-600' : 'text-red-600';
  const trendBg = stat.trend === 'up' ? 'bg-green-100' : 'bg-red-100';

  return (
    <div className="relative group">
      {/* Glow Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-blue-500/10 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-300 opacity-50"></div>
      
      {/* Card */}
      <div className="relative bg-white rounded-2xl border-2 border-gray-200 group-hover:border-green-400 p-6 transition-all duration-300 shadow-lg group-hover:shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          {/* Icon */}
          <div className={`w-14 h-14 ${stat.bgColor} rounded-xl flex items-center justify-center shadow-md`}>
            <stat.icon className={`w-7 h-7 ${stat.color}`} />
          </div>

          {/* Change Badge */}
          {stat.change !== undefined && (
            <div className={`flex items-center gap-1 px-3 py-1 ${trendBg} rounded-lg`}>
              <TrendIcon className={`w-4 h-4 ${trendColor}`} />
              <span className={`text-sm font-bold ${trendColor}`}>
                {Math.abs(stat.change)}%
              </span>
            </div>
          )}
        </div>

        {/* Value */}
        <div className="mb-2">
          <div className="text-3xl font-black text-gray-900 mb-1">
            {stat.value}
          </div>
          <div className="text-sm font-semibold text-gray-600">
            {stat.label}
          </div>
        </div>

        {/* Change Label */}
        {stat.changeLabel && (
          <div className="text-xs font-semibold text-gray-500">
            {stat.changeLabel}
          </div>
        )}

        {/* Trend Line (Visual Element) */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-green-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-b-2xl"></div>
      </div>
    </div>
  );
}

/**
 * Compact Dashboard Stats - For smaller spaces
 */
export function CompactDashboardStats({
  stats = {},
  isLoading = false,
}: {
  stats?: DashboardStatsProps['stats'];
  isLoading?: boolean;
}) {
  const quickStats = [
    {
      label: 'Revenue',
      value: stats.totalRevenue ? formatPrice(stats.totalRevenue) : '₹0',
      icon: DollarSign,
      color: 'text-green-600',
    },
    {
      label: 'Orders',
      value: stats.totalOrders || '0',
      icon: ShoppingCart,
      color: 'text-blue-600',
    },
    {
      label: 'Customers',
      value: stats.totalCustomers || '0',
      icon: Users,
      color: 'text-purple-600',
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex-1 bg-white rounded-xl border-2 border-gray-200 p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
            <div className="h-6 bg-gray-200 rounded w-24"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      {quickStats.map((stat, idx) => (
        <div
          key={idx}
          className="flex-1 bg-white rounded-xl border-2 border-gray-200 hover:border-green-400 p-4 transition-all shadow-md hover:shadow-lg"
        >
          <div className="flex items-center gap-3">
            <stat.icon className={`w-6 h-6 ${stat.color}`} />
            <div>
              <div className="text-xs font-semibold text-gray-600">
                {stat.label}
              </div>
              <div className="text-lg font-black text-gray-900">
                {stat.value}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Stat Card with Chart - For detailed metrics
 */
export function StatCardWithChart({
  stat,
  chartData,
}: {
  stat: StatCard;
  chartData?: number[];
}) {
  return (
    <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-lg hover:shadow-2xl transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center`}>
          <stat.icon className={`w-6 h-6 ${stat.color}`} />
        </div>
        {stat.change !== undefined && (
          <div className={`flex items-center gap-1 px-2 py-1 ${stat.trend === 'up' ? 'bg-green-100' : 'bg-red-100'} rounded-lg`}>
            <TrendingUp className={`w-4 h-4 ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`} />
            <span className={`text-xs font-bold ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
              {Math.abs(stat.change)}%
            </span>
          </div>
        )}
      </div>

      <div className="text-3xl font-black text-gray-900 mb-1">
        {stat.value}
      </div>
      <div className="text-sm font-semibold text-gray-600 mb-4">
        {stat.label}
      </div>

      {/* Simple Chart Visualization */}
      {chartData && (
        <div className="flex items-end gap-1 h-16">
          {chartData.map((value, idx) => (
            <div
              key={idx}
              className="flex-1 bg-gradient-to-t from-green-500 to-emerald-500 rounded-t opacity-60 hover:opacity-100 transition-opacity"
              style={{ height: `${(value / Math.max(...chartData)) * 100}%` }}
            ></div>
          ))}
        </div>
      )}
    </div>
  );
}