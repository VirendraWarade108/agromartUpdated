'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Product {
	id: string;
	name: string;
	price: number;
	stock: number;
	image?: string;
	createdAt: string;
}

export default function VendorDashboard() {
	const router = useRouter();
	const [vendorId, setVendorId] = useState<string>('');
	const [products, setProducts] = useState<Product[]>([]);
	const [showAddForm, setShowAddForm] = useState(false);
	const [loading, setLoading] = useState(false);
	const [formData, setFormData] = useState({
		name: '',
		slug: '',
		price: '',
		originalPrice: '',
		description: '',
		image: '',
		stock: '',
	});

	useEffect(() => {
		const id = localStorage.getItem('vendorId');
		if (!id) {
			router.push('/vendor/login');
			return;
		}
		setVendorId(id);
		fetchProducts(id);
	}, [router]);

	const fetchProducts = async (id: string) => {
		try {
			const response = await fetch(`/api/vendor/${id}/products`);
			if (response.ok) {
				const data = await response.json();
				setProducts(data.data || []);
			}
		} catch (err) {
			console.error('Error fetching products:', err);
		}
	};

	const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleAddProduct = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);

		try {
			const response = await fetch(`/api/vendor/${vendorId}/products`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					...formData,
					price: parseInt(formData.price),
					originalPrice: formData.originalPrice ? parseInt(formData.originalPrice) : null,
					stock: parseInt(formData.stock),
				}),
			});

			if (!response.ok) {
				throw new Error('Failed to add product');
			}

			alert('Product added successfully!');
			setFormData({
				name: '',
				slug: '',
				price: '',
				originalPrice: '',
				description: '',
				image: '',
				stock: '',
			});
			setShowAddForm(false);
			fetchProducts(vendorId);
		} catch (err: any) {
			alert(err.message || 'Error adding product');
		} finally {
			setLoading(false);
		}
	};

	const handleDeleteProduct = async (productId: string) => {
		if (!confirm('Are you sure?')) return;

		try {
			const response = await fetch(`/api/vendor/${vendorId}/products/${productId}`, {
				method: 'DELETE',
			});

			if (!response.ok) throw new Error('Failed to delete');

			alert('Product deleted!');
			fetchProducts(vendorId);
		} catch (err: any) {
			alert(err.message || 'Error deleting product');
		}
	};

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Header */}
			<div className="bg-white shadow">
				<div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
					<div className="flex justify-between items-center">
						<h1 className="text-3xl font-bold text-gray-900">Vendor Dashboard</h1>
						<button
							onClick={() => {
								localStorage.removeItem('vendorToken');
								localStorage.removeItem('vendorId');
								router.push('/vendor/login');
							}}
							className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
						>
							Logout
						</button>
					</div>
				</div>
			</div>

			{/* Main Content */}
			<div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
				{/* Add Product Button */}
				<div className="mb-8">
					<button
						onClick={() => setShowAddForm(!showAddForm)}
						className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg"
					>
						{showAddForm ? '✕ Cancel' : '+ Add New Product'}
					</button>
				</div>

				{/* Add Product Form */}
				{showAddForm && (
					<div className="bg-white rounded-lg shadow-lg p-8 mb-8">
						<h2 className="text-2xl font-bold mb-6 text-gray-900">Add New Product</h2>

						<form onSubmit={handleAddProduct} className="space-y-6">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Product Name *
									</label>
									<input
										type="text"
										name="name"
										value={formData.name}
										onChange={handleChange}
										required
										className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
										placeholder="e.g., Premium Mango Seeds"
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Product Slug *
									</label>
									<input
										type="text"
										name="slug"
										value={formData.slug}
										onChange={handleChange}
										required
										className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
										placeholder="e.g., premium-mango-seeds"
									/>
								</div>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Description
								</label>
								<textarea
									name="description"
									value={formData.description}
									onChange={handleChange}
									rows={4}
									className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
									placeholder="Detailed product description..."
								/>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Price (₹) *
									</label>
									<input
										type="number"
										name="price"
										value={formData.price}
										onChange={handleChange}
										required
										className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
										placeholder="299"
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Original Price (₹)
									</label>
									<input
										type="number"
										name="originalPrice"
										value={formData.originalPrice}
										onChange={handleChange}
										className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
										placeholder="399"
									/>
								</div>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Stock Quantity *
									</label>
									<input
										type="number"
										name="stock"
										value={formData.stock}
										onChange={handleChange}
										required
										className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
										placeholder="100"
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Product Image URL
									</label>
									<input
										type="url"
										name="image"
										value={formData.image}
										onChange={handleChange}
										className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
										placeholder="https://example.com/image.jpg"
									/>
								</div>
							</div>

							<button
								type="submit"
								disabled={loading}
								className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-3 rounded-lg transition"
							>
								{loading ? 'Adding Product...' : 'Add Product'}
							</button>
						</form>
					</div>
				)}

				{/* Products List */}
				<div className="bg-white rounded-lg shadow-lg overflow-hidden">
					<div className="px-6 py-4 bg-gray-100 border-b">
						<h2 className="text-xl font-bold text-gray-900">
							Your Products ({products.length})
						</h2>
					</div>

					{products.length === 0 ? (
						<div className="p-6 text-center text-gray-500">
							No products yet. Add your first product!
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full">
								<thead className="bg-gray-50 border-b">
									<tr>
										<th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
											Product Name
										</th>
										<th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
											Price
										</th>
										<th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
											Stock
										</th>
										<th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
											Added
										</th>
										<th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
											Action
										</th>
									</tr>
								</thead>
								<tbody className="divide-y">
									{products.map((product) => (
										<tr key={product.id} className="hover:bg-gray-50">
											<td className="px-6 py-4 text-sm text-gray-900 font-medium">
												{product.name}
											</td>
											<td className="px-6 py-4 text-sm text-gray-600">
												₹{product.price}
											</td>
											<td className="px-6 py-4 text-sm text-gray-600">
												{product.stock} units
											</td>
											<td className="px-6 py-4 text-sm text-gray-600">
												{new Date(product.createdAt).toLocaleDateString()}
											</td>
											<td className="px-6 py-4 text-sm">
												<button
													onClick={() => handleDeleteProduct(product.id)}
													className="text-red-600 hover:text-red-700 font-semibold"
												>
													Delete
												</button>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
