'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BarChart3, Package, ShoppingCart, Users, TrendingUp, LogOut, Settings, Home } from 'lucide-react';

interface Stats {
	totalRevenue: number;
	totalOrders: number;
	totalCustomers: number;
	totalProducts: number;
	totalVendors: number;
}

export default function AdminDashboard() {
	const router = useRouter();
	const [adminId, setAdminId] = useState<string>('');
	const [stats, setStats] = useState<Stats>({
		totalRevenue: 0,
		totalOrders: 0,
		totalCustomers: 0,
		totalProducts: 0,
		totalVendors: 0,
	});
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const id = localStorage.getItem('adminId');
		if (!id) {
			router.push('/admin/login');
			return;
		}
		setAdminId(id);
		fetchStats();
	}, [router]);

	const fetchStats = async () => {
		try {
			const response = await fetch('/api/admin/stats');
			if (response.ok) {
				const data = await response.json();
				setStats(data.data || {});
			}
		} catch (err) {
			console.error('Error fetching stats:', err);
		} finally {
			setLoading(false);
		}
	};

	const StatCard = ({ title, value, icon: Icon, color }: any) => (
		<div className={`bg-white rounded-lg shadow-lg p-6 border-l-4 ${color}`}>
			<div className="flex items-center justify-between">
				<div>
					<p className="text-gray-600 text-sm font-medium">{title}</p>
					<p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
				</div>
				<div className={`p-3 rounded-lg ${color.replace('border', 'bg').replace('border-', 'bg-')}`}>
					<Icon className="w-8 h-8 text-white" />
				</div>
			</div>
		</div>
	);

	const MenuCard = ({ title, description, icon: Icon, href, color }: any) => (
		<Link href={href}>
			<div className={`bg-white rounded-lg shadow-lg p-6 hover:shadow-xl hover:scale-105 transition-all cursor-pointer border-t-4 ${color}`}>
				<div className="flex items-start gap-4">
					<div className={`p-3 rounded-lg ${color.replace('border', 'bg').replace('border-', 'bg-')}`}>
						<Icon className="w-6 h-6 text-white" />
					</div>
					<div>
						<h3 className="font-bold text-gray-900 text-lg">{title}</h3>
						<p className="text-gray-600 text-sm mt-1">{description}</p>
					</div>
				</div>
			</div>
		</Link>
	);

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Header */}
			<div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg">
				<div className="max-w-7xl mx-auto px-6 py-6">
					<div className="flex justify-between items-center">
						<div className="flex items-center gap-3">
							<div className="p-2 bg-white bg-opacity-20 rounded-lg">
								<BarChart3 className="w-6 h-6" />
							</div>
							<h1 className="text-3xl font-bold">Admin Control Panel</h1>
						</div>
						<button
							onClick={() => {
								localStorage.removeItem('adminId');
								localStorage.removeItem('adminToken');
								router.push('/admin/login');
							}}
							className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg transition"
						>
							<LogOut className="w-5 h-5" />
							Logout
						</button>
					</div>
				</div>
			</div>

			{/* Main Content */}
			<div className="max-w-7xl mx-auto px-6 py-8">
				{/* Statistics */}
				<div className="mb-8">
					<h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard Overview</h2>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
						<StatCard
							title="Total Revenue"
							value={`₹${stats.totalRevenue.toLocaleString()}`}
							icon={TrendingUp}
							color="border-green-500 bg-green-100"
						/>
						<StatCard
							title="Total Orders"
							value={stats.totalOrders}
							icon={ShoppingCart}
							color="border-blue-500 bg-blue-100"
						/>
						<StatCard
							title="Total Customers"
							value={stats.totalCustomers}
							icon={Users}
							color="border-purple-500 bg-purple-100"
						/>
						<StatCard
							title="Total Products"
							value={stats.totalProducts}
							icon={Package}
							color="border-orange-500 bg-orange-100"
						/>
						<StatCard
							title="Active Vendors"
							value={stats.totalVendors}
							icon={BarChart3}
							color="border-pink-500 bg-pink-100"
						/>
					</div>
				</div>

				{/* Management Sections */}
				<div className="mb-8">
					<h2 className="text-2xl font-bold text-gray-900 mb-6">Management</h2>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<MenuCard
							title="📦 Products Management"
							description="View, add, edit, and delete products from all vendors"
							icon={Package}
							href="/admin/products"
							color="border-blue-500 bg-blue-50"
						/>
						<MenuCard
							title="🏪 Categories Management"
							description="Manage product categories and organize inventory"
							icon={BarChart3}
							href="/admin/categories"
							color="border-green-500 bg-green-50"
						/>
						<MenuCard
							title="📋 Orders Management"
							description="View all orders, update status, and track shipments"
							icon={ShoppingCart}
							href="/admin/orders"
							color="border-orange-500 bg-orange-50"
						/>
						<MenuCard
							title="👥 Users & Vendors"
							description="Manage customers and wholesaler accounts"
							icon={Users}
							href="/admin/users"
							color="border-purple-500 bg-purple-50"
						/>
						<MenuCard
							title="📊 Analytics"
							description="View sales reports, trends, and performance metrics"
							icon={TrendingUp}
							href="/admin/analytics"
							color="border-pink-500 bg-pink-50"
						/>
						<MenuCard
							title="⚙️ Settings"
							description="Configure website settings and preferences"
							icon={Settings}
							href="/admin/settings"
							color="border-red-500 bg-red-50"
						/>
					</div>
				</div>

				{/* Quick Actions */}
				<div className="bg-white rounded-lg shadow-lg p-8">
					<h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<Link href="/admin/products?action=add">
							<button className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition">
								+ Add New Product
							</button>
						</Link>
						<Link href="/admin/categories?action=add">
							<button className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition">
								+ Add Category
							</button>
						</Link>
						<Link href="/admin/users?type=vendor">
							<button className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition">
								View Vendors
							</button>
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
}
