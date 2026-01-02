'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useAuth from '@/hooks/useAuth';
import DashboardStats from '@/components/admin/DashboardStats';
import { PageLoader } from '@/components/shared/LoadingSpinner';
import { BarChart3, Package, ShoppingCart, Users, TrendingUp } from 'lucide-react';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, isAdmin } = useAuth();
  const [stats, setStats] = useState({
    totalRevenue: 1256780,
    totalOrders: 3456,
    totalCustomers: 8920,
    totalProducts: 1234,
    revenueGrowth: 12.5,
    ordersGrowth: 8.3,
    customersGrowth: 15.2,
    productsGrowth: 3.1,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is admin
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push('/auth/login');
      } else if (!isAdmin) {
        router.push('/dashboard');
      } else {
        // Load dashboard stats
        loadDashboardStats();
      }
    }
  }, [isAuthenticated, isAdmin, authLoading, router]);

  const loadDashboardStats = async () => {
    try {
      // In a real app, fetch from API
      // const response = await adminApi.getDashboardStats();
      // setStats(response.data.data);
      
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
      setIsLoading(false);
    }
  };

  // Show loading while checking auth
  if (authLoading) {
    return <PageLoader message="Loading dashboard..." />;
  }

  // Show nothing if redirecting
  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900">
      {/* Header */}
      <div className="bg-white/5 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-white flex items-center gap-3">
                <BarChart3 className="w-8 h-8 text-green-400" />
                Admin Dashboard
              </h1>
              <p className="text-gray-300 font-semibold mt-1">
                Welcome back, {user?.fullName}!
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        {/* Dashboard Stats */}
        <DashboardStats stats={stats} isLoading={isLoading} />

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: 'Manage Products',
              description: 'Add, edit, or remove products',
              icon: Package,
              href: '/admin/products',
              color: 'from-green-500 to-emerald-600',
            },
            {
              title: 'View Orders',
              description: 'Process and track orders',
              icon: ShoppingCart,
              href: '/admin/orders',
              color: 'from-blue-500 to-cyan-600',
            },
            {
              title: 'Manage Users',
              description: 'View and manage customers',
              icon: Users,
              href: '/admin/users',
              color: 'from-purple-500 to-pink-600',
            },
            {
              title: 'Analytics',
              description: 'View detailed reports',
              icon: TrendingUp,
              href: '/admin/analytics',
              color: 'from-orange-500 to-red-600',
            },
          ].map((action, idx) => (
            <a
              key={idx}
              href={action.href}
              className="group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 rounded-2xl blur-xl group-hover:blur-2xl transition-all"></div>
              <div className="relative bg-white rounded-2xl border-2 border-gray-200 group-hover:border-green-400 p-6 transition-all shadow-lg group-hover:shadow-2xl">
                <div
                  className={`w-14 h-14 bg-gradient-to-br ${action.color} rounded-xl flex items-center justify-center mb-4 shadow-md`}
                >
                  <action.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-2">
                  {action.title}
                </h3>
                <p className="text-gray-600 font-semibold text-sm">
                  {action.description}
                </p>
              </div>
            </a>
          ))}
        </div>

        {/* Recent Activity Placeholder */}
        <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-xl p-6">
          <h2 className="text-2xl font-black text-gray-900 mb-4">
            Recent Activity
          </h2>
          <p className="text-gray-600 font-semibold">
            Recent orders and activities will appear here...
          </p>
        </div>
      </div>
    </div>
  );
}