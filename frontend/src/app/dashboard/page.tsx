'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Package, Heart, MapPin, User, Settings, LogOut, ShoppingBag, TrendingUp, Clock, CheckCircle, Star, ChevronRight, Award, Truck } from 'lucide-react';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('overview');

  const user = {
    name: 'Rajesh Kumar',
    email: 'rajesh.kumar@email.com',
    phone: '+91 98765 43210',
    avatar: '👨‍🌾',
    memberSince: 'January 2023',
    totalOrders: 24,
    totalSpent: 125680
  };

  const stats = [
    { icon: ShoppingBag, label: 'Total Orders', value: '24', color: 'from-blue-500 to-cyan-600', bgColor: 'bg-blue-50' },
    { icon: Package, label: 'Active Orders', value: '3', color: 'from-green-500 to-emerald-600', bgColor: 'bg-green-50' },
    { icon: Heart, label: 'Wishlist Items', value: '12', color: 'from-pink-500 to-rose-600', bgColor: 'bg-pink-50' },
    { icon: Award, label: 'Reward Points', value: '2,540', color: 'from-yellow-500 to-orange-600', bgColor: 'bg-yellow-50' }
  ];

  const recentOrders = [
    { id: 'ORD-2024-001', date: '2024-11-20', status: 'Delivered', total: 8999, items: 3, image: '💦' },
    { id: 'ORD-2024-002', date: '2024-11-15', status: 'In Transit', total: 2499, items: 2, image: '🍅' },
    { id: 'ORD-2024-003', date: '2024-11-10', status: 'Processing', total: 1899, items: 1, image: '🌿' }
  ];

  const addresses = [
    { id: 1, type: 'Home', name: 'Rajesh Kumar', address: 'Plot No. 45, Village Rampur', city: 'Lucknow', state: 'Uttar Pradesh', pincode: '226001', isDefault: true },
    { id: 2, type: 'Farm', name: 'Kumar Farm', address: 'Khasra No. 123, Near Highway', city: 'Barabanki', state: 'Uttar Pradesh', pincode: '225001', isDefault: false }
  ];

  const menuItems = [
    { id: 'overview', icon: TrendingUp, label: 'Overview' },
    { id: 'orders', icon: Package, label: 'My Orders' },
    { id: 'wishlist', icon: Heart, label: 'Wishlist' },
    { id: 'addresses', icon: MapPin, label: 'Addresses' },
    { id: 'profile', icon: User, label: 'Profile' },
    { id: 'settings', icon: Settings, label: 'Settings' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Delivered': return 'bg-green-100 text-green-700 border-green-200';
      case 'In Transit': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Processing': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900">
      {/* Header */}
      <div className="bg-white/5 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-white">My Dashboard</h1>
              <p className="text-gray-300 font-semibold mt-1">Welcome back, {user.name}!</p>
            </div>
            <Link href="/products" className="hidden md:flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-xl transition-all shadow-lg">
              <ShoppingBag className="w-5 h-5" />
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-xl p-6 sticky top-24">
              {/* User Info */}
              <div className="text-center mb-8 pb-6 border-b-2 border-gray-200">
                <div className="text-7xl mb-4">{user.avatar}</div>
                <h2 className="text-xl font-black text-gray-900 mb-1">{user.name}</h2>
                <p className="text-gray-600 text-sm font-semibold mb-2">{user.email}</p>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-bold">
                  <CheckCircle className="w-4 h-4" />
                  Verified Member
                </div>
              </div>

              {/* Menu */}
              <nav className="space-y-2">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
                      activeTab === item.id
                        ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </button>
                ))}
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold bg-red-50 text-red-600 hover:bg-red-100 transition-all">
                  <LogOut className="w-5 h-5" />
                  Logout
                </button>
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-3">
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Stats Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {stats.map((stat, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="relative group"
                    >
                      <div className="bg-white rounded-2xl border-2 border-gray-200 hover:border-green-400 shadow-lg hover:shadow-xl transition-all p-6">
                        <div className={`w-14 h-14 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center mb-4 shadow-md`}>
                          <stat.icon className="w-7 h-7 text-white" />
                        </div>
                        <p className="text-gray-600 font-semibold text-sm mb-1">{stat.label}</p>
                        <p className="text-3xl font-black text-gray-900">{stat.value}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Recent Orders */}
                <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-xl p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-black text-gray-900">Recent Orders</h2>
                    <button
                      onClick={() => setActiveTab('orders')}
                      className="flex items-center gap-2 text-green-600 hover:text-green-700 font-bold transition-colors"
                    >
                      View All
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {recentOrders.map((order, idx) => (
                      <motion.div
                        key={order.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="flex items-center gap-6 p-6 bg-gray-50 rounded-xl border-2 border-gray-200 hover:border-green-400 transition-all"
                      >
                        <div className="w-16 h-16 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl flex items-center justify-center text-4xl flex-shrink-0">
                          {order.image}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-black text-gray-900">{order.id}</h3>
                            <span className={`px-3 py-1 rounded-lg text-xs font-bold border-2 ${getStatusColor(order.status)}`}>
                              {order.status}
                            </span>
                          </div>
                          <p className="text-gray-600 text-sm font-semibold">{order.items} items • {order.date}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-black text-gray-900">₹{order.total}</p>
                          <Link href={`/orders/${order.id}`} className="text-green-600 hover:text-green-700 font-bold text-sm">
                            View Details →
                          </Link>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl p-8 text-white shadow-2xl">
                    <Truck className="w-12 h-12 mb-4" />
                    <h3 className="text-2xl font-black mb-2">Track Your Order</h3>
                    <p className="text-green-100 font-semibold mb-6">Get real-time updates on your deliveries</p>
                    <button
                      onClick={() => setActiveTab('orders')}
                      className="px-6 py-3 bg-white text-green-600 font-bold rounded-xl hover:bg-gray-100 transition-all"
                    >
                      Track Now
                    </button>
                  </div>

                  <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl p-8 text-white shadow-2xl">
                    <Award className="w-12 h-12 mb-4" />
                    <h3 className="text-2xl font-black mb-2">Rewards Program</h3>
                    <p className="text-purple-100 font-semibold mb-6">Earn points on every purchase</p>
                    <button className="px-6 py-3 bg-white text-purple-600 font-bold rounded-xl hover:bg-gray-100 transition-all">
                      Learn More
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-xl p-8">
                <h2 className="text-2xl font-black text-gray-900 mb-6">All Orders</h2>
                <div className="space-y-4">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center gap-6 p-6 bg-gray-50 rounded-xl border-2 border-gray-200">
                      <div className="w-16 h-16 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl flex items-center justify-center text-4xl">
                        {order.image}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-black text-gray-900 mb-2">{order.id}</h3>
                        <p className="text-gray-600 text-sm font-semibold">{order.items} items • {order.date}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-lg text-xs font-bold border-2 ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                      <p className="text-2xl font-black text-gray-900">₹{order.total}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'addresses' && (
              <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-xl p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-black text-gray-900">Saved Addresses</h2>
                  <button className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-xl transition-all shadow-lg">
                    + Add New Address
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {addresses.map((address) => (
                    <div key={address.id} className="p-6 bg-gray-50 rounded-xl border-2 border-gray-200 hover:border-green-400 transition-all">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-black text-gray-900">{address.type}</h3>
                            {address.isDefault && (
                              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="font-bold text-gray-900">{address.name}</p>
                        </div>
                        <MapPin className="w-6 h-6 text-green-600" />
                      </div>
                      <p className="text-gray-700 font-semibold text-sm leading-relaxed mb-4">
                        {address.address}<br />
                        {address.city}, {address.state}<br />
                        PIN: {address.pincode}
                      </p>
                      <div className="flex gap-3">
                        <button className="flex-1 py-2 bg-white border-2 border-gray-200 hover:border-green-400 text-gray-900 font-bold rounded-lg transition-all">
                          Edit
                        </button>
                        <button className="flex-1 py-2 bg-white border-2 border-gray-200 hover:border-red-400 text-gray-900 font-bold rounded-lg transition-all">
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-xl p-8">
                <h2 className="text-2xl font-black text-gray-900 mb-6">Profile Information</h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">Full Name</label>
                    <input
                      type="text"
                      value={user.name}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-400 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">Email</label>
                    <input
                      type="email"
                      value={user.email}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-400 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">Phone</label>
                    <input
                      type="tel"
                      value={user.phone}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-400 font-semibold"
                    />
                  </div>
                  <button className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-black text-lg rounded-xl shadow-xl transition-all">
                    Save Changes
                  </button>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}