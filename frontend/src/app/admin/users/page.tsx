'use client';

import { useState, useEffect } from 'react';
import { Users, Search, Trash2, Shield, User as UserIcon } from 'lucide-react';
import { adminApi, handleApiError } from '@/lib/api';
import { showSuccessToast, showErrorToast } from '@/store/uiStore';
import { PageLoader } from '@/components/shared/LoadingSpinner';
import { AdminGuard } from '@/components/shared/AuthGuard';
import { formatDate } from '@/lib/utils';

interface User {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  isAdmin: boolean;
  createdAt: string;
  _count?: {
    orders: number;
  };
}

function UsersContent() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await adminApi.getAllUsers();

      if (response.data.success) {
        const data = response.data.data;
        setUsers(Array.isArray(data) ? data : data.users || []);
      }
    } catch (error) {
      const message = handleApiError(error);
      showErrorToast(message, 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    setDeletingId(userId);
    try {
      const response = await adminApi.deleteUser(userId);
      if (response.data.success) {
        setUsers(users.filter((u) => u.id !== userId));
        showSuccessToast('User deleted successfully');
      }
    } catch (error) {
      const message = handleApiError(error);
      showErrorToast(message, 'Failed to delete user');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredUsers = users.filter((u) =>
    u.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return <PageLoader message="Loading users..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black text-white flex items-center gap-3">
            <Users className="w-8 h-8 text-green-400" />
            User Management
          </h1>
          <p className="text-gray-300 font-semibold mt-2">
            {filteredUsers.length} users registered
          </p>
        </div>

        {/* Search */}
        <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-xl p-6 mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-400 font-semibold text-gray-900"
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b-2 border-gray-200">
                  <th className="px-6 py-4 text-left text-sm font-black text-gray-900">User</th>
                  <th className="px-6 py-4 text-left text-sm font-black text-gray-900">Contact</th>
                  <th className="px-6 py-4 text-left text-sm font-black text-gray-900">Role</th>
                  <th className="px-6 py-4 text-left text-sm font-black text-gray-900">Orders</th>
                  <th className="px-6 py-4 text-left text-sm font-black text-gray-900">Joined</th>
                  <th className="px-6 py-4 text-center text-sm font-black text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600 font-bold">No users found</p>
                      <p className="text-gray-500 text-sm font-semibold mt-1">
                        {searchQuery ? 'Try different search terms' : 'No users registered yet'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      {/* User */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-bold text-lg">
                              {user.fullName?.charAt(0).toUpperCase() || 'U'}
                            </span>
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{user.fullName || 'N/A'}</p>
                            <p className="text-sm text-gray-600 font-semibold">{user.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="px-6 py-4">
                        <p className="text-gray-600 font-semibold">{user.phone || 'N/A'}</p>
                      </td>

                      {/* Role */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold ${
                            user.isAdmin
                              ? 'bg-purple-100 text-purple-700 border-2 border-purple-200'
                              : 'bg-blue-100 text-blue-700 border-2 border-blue-200'
                          }`}
                        >
                          {user.isAdmin ? <Shield className="w-4 h-4" /> : <UserIcon className="w-4 h-4" />}
                          {user.isAdmin ? 'Admin' : 'User'}
                        </span>
                      </td>

                      {/* Orders */}
                      <td className="px-6 py-4">
                        <p className="font-bold text-gray-900">
                          {user._count?.orders || 0} orders
                        </p>
                      </td>

                      {/* Joined Date */}
                      <td className="px-6 py-4">
                        <p className="text-gray-600 font-semibold text-sm">
                          {formatDate(user.createdAt)}
                        </p>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleDelete(user.id)}
                            disabled={deletingId === user.id || user.isAdmin}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title={user.isAdmin ? 'Cannot delete admin users' : 'Delete user'}
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          {[
            {
              label: 'Total Users',
              value: users.length,
              icon: Users,
              color: 'text-blue-600',
              bgColor: 'bg-blue-100',
            },
            {
              label: 'Admin Users',
              value: users.filter((u) => u.isAdmin).length,
              icon: Shield,
              color: 'text-purple-600',
              bgColor: 'bg-purple-100',
            },
            {
              label: 'Regular Users',
              value: users.filter((u) => !u.isAdmin).length,
              icon: UserIcon,
              color: 'text-green-600',
              bgColor: 'bg-green-100',
            },
            {
              label: 'Total Orders',
              value: users.reduce((sum, u) => sum + (u._count?.orders || 0), 0),
              icon: Users,
              color: 'text-orange-600',
              bgColor: 'bg-orange-100',
            },
          ].map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div key={idx} className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg p-6">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-gray-600 font-bold text-sm">{stat.label}</p>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
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

export default function AdminUsersPage() {
  return (
    <AdminGuard>
      <UsersContent />
    </AdminGuard>
  );
}