'use client';

import { AdminGuard } from '@/components/shared/AuthGuard';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  BarChart3, 
  Settings,
  Tags,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';
import useAuth from '@/hooks/useAuth';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGuard>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </AdminGuard>
  );
}

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navigation = [
    {
      name: 'Dashboard',
      href: '/admin',
      icon: LayoutDashboard,
      current: pathname === '/admin',
    },
    {
      name: 'Products',
      href: '/admin/products',
      icon: Package,
      current: pathname?.startsWith('/admin/products'),
    },
    {
      name: 'Orders',
      href: '/admin/orders',
      icon: ShoppingCart,
      current: pathname?.startsWith('/admin/orders'),
    },
    {
      name: 'Users',
      href: '/admin/users',
      icon: Users,
      current: pathname?.startsWith('/admin/users'),
    },
    {
      name: 'Categories',
      href: '/admin/categories',
      icon: Tags,
      current: pathname?.startsWith('/admin/categories'),
    },
    {
      name: 'Analytics',
      href: '/admin/analytics',
      icon: BarChart3,
      current: pathname?.startsWith('/admin/analytics'),
    },
  ];

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      await logout();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-40 h-screen transition-transform
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 w-64 bg-slate-900/90 backdrop-blur-xl border-r border-white/10
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <Link href="/admin" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl font-black">A</span>
              </div>
              <div>
                <h2 className="text-white font-black text-lg">AgroMart</h2>
                <p className="text-green-400 text-xs font-bold">Admin Panel</p>
              </div>
            </Link>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden text-white hover:text-green-400 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* User Info */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center text-white text-xl font-black">
                {user?.fullName?.charAt(0) || 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold truncate">{user?.fullName}</p>
                <p className="text-green-400 text-sm font-semibold">Administrator</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all
                    ${
                      item.current
                        ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg'
                        : 'text-gray-300 hover:bg-white/10 hover:text-white'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Logout Button */}
          <div className="p-4 border-t border-white/10">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Mobile Header */}
        <div className="lg:hidden sticky top-0 z-30 bg-slate-900/90 backdrop-blur-xl border-b border-white/10">
          <div className="flex items-center justify-between p-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="text-white hover:text-green-400 transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-white font-black text-lg">Admin Panel</h1>
            <div className="w-6" /> {/* Spacer */}
          </div>
        </div>

        {/* Page Content */}
        <main className="min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
}