'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function VendorLogin() {
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [formData, setFormData] = useState({ email: '', password: '' });

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError('');

		try {
			const response = await fetch('/api/vendor/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(formData),
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.message || 'Login failed');
			}

			const data = await response.json();
			localStorage.setItem('vendorToken', data.data.token);
			localStorage.setItem('vendorId', data.data.id);
			router.push('/vendor/dashboard');
		} catch (err: any) {
			setError(err.message || 'An error occurred');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center py-12 px-4">
			<div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
				<div className="text-center mb-8">
					<h1 className="text-3xl font-bold text-green-700 mb-2">
						Vendor Login
					</h1>
					<p className="text-gray-600">Access your wholesaler dashboard</p>
				</div>

				{error && (
					<div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
						{error}
					</div>
				)}

				<form onSubmit={handleSubmit} className="space-y-6">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Email
						</label>
						<input
							type="email"
							name="email"
							value={formData.email}
							onChange={handleChange}
							required
							className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
							placeholder="your@email.com"
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Password
						</label>
						<input
							type="password"
							name="password"
							value={formData.password}
							onChange={handleChange}
							required
							className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
							placeholder="••••••••"
						/>
					</div>

					<button
						type="submit"
						disabled={loading}
						className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg transition"
					>
						{loading ? 'Logging in...' : 'Login'}
					</button>
				</form>

				<p className="text-center mt-6 text-gray-600">
					Don't have an account?{' '}
					<Link href="/vendor/register" className="text-green-600 hover:text-green-700 font-semibold">
						Register here
					</Link>
				</p>
			</div>
		</div>
	);
}
