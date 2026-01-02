'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function VendorRegister() {
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [formData, setFormData] = useState({
		businessName: '',
		email: '',
		phone: '',
		password: '',
		confirmPassword: '',
		website: '',
		city: '',
		state: '',
		country: '',
	});

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError('');

		if (formData.password !== formData.confirmPassword) {
			setError('Passwords do not match');
			setLoading(false);
			return;
		}

		try {
			const response = await fetch('/api/vendor/register', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					businessName: formData.businessName,
					email: formData.email,
					phone: formData.phone,
					password: formData.password,
					website: formData.website || null,
					city: formData.city || null,
					state: formData.state || null,
					country: formData.country || null,
				}),
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.message || 'Registration failed');
			}

			alert('Registration successful! Please login.');
			router.push('/vendor/login');
		} catch (err: any) {
			setError(err.message || 'An error occurred');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-b from-green-50 to-white py-12 px-4">
			<div className="max-w-2xl mx-auto">
				<div className="bg-white rounded-lg shadow-lg p-8">
					<div className="text-center mb-8">
						<h1 className="text-4xl font-bold text-green-700 mb-2">
							Become a Wholesaler
						</h1>
						<p className="text-gray-600">List your products on AgroMart</p>
					</div>

					{error && (
						<div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
							{error}
						</div>
					)}

					<form onSubmit={handleSubmit} className="space-y-6">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Business Name *
							</label>
							<input
								type="text"
								name="businessName"
								value={formData.businessName}
								onChange={handleChange}
								required
								className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
								placeholder="Your business name"
							/>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Email *
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
									Phone *
								</label>
								<input
									type="tel"
									name="phone"
									value={formData.phone}
									onChange={handleChange}
									required
									className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
									placeholder="+91 XXXXXXXXXX"
								/>
							</div>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Password *
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

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Confirm Password *
								</label>
								<input
									type="password"
									name="confirmPassword"
									value={formData.confirmPassword}
									onChange={handleChange}
									required
									className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
									placeholder="••••••••"
								/>
							</div>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Website (Optional)
							</label>
							<input
								type="url"
								name="website"
								value={formData.website}
								onChange={handleChange}
								className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
								placeholder="https://yourwebsite.com"
							/>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									City (Optional)
								</label>
								<input
									type="text"
									name="city"
									value={formData.city}
									onChange={handleChange}
									className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
									placeholder="City"
								/>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									State (Optional)
								</label>
								<input
									type="text"
									name="state"
									value={formData.state}
									onChange={handleChange}
									className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
									placeholder="State"
								/>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Country (Optional)
								</label>
								<input
									type="text"
									name="country"
									value={formData.country}
									onChange={handleChange}
									className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
									placeholder="Country"
								/>
							</div>
						</div>

						<button
							type="submit"
							disabled={loading}
							className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-lg transition"
						>
							{loading ? 'Registering...' : 'Register as Wholesaler'}
						</button>
					</form>

					<p className="text-center mt-6 text-gray-600">
						Already have an account?{' '}
						<Link href="/vendor/login" className="text-green-600 hover:text-green-700 font-semibold">
							Login here
						</Link>
					</p>
				</div>
			</div>
		</div>
	);
}
