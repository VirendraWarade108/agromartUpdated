'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Save, X, Upload } from 'lucide-react';
import { adminApi, handleApiError, uploadApi } from '@/lib/api';
import { showSuccessToast, showErrorToast } from '@/store/uiStore';
import { PageLoader } from '@/components/shared/LoadingSpinner';
import { AdminGuard } from '@/components/shared/AuthGuard';

interface ProductForm {
  name: string;
  description: string;
  shortDescription: string;
  price: number;
  originalPrice: number;
  category: string;
  subCategory: string;
  image: string;
  inStock: boolean;
  stockCount: number;
  tags: string[];
}

const initialForm: ProductForm = {
  name: '',
  description: '',
  shortDescription: '',
  price: 0,
  originalPrice: 0,
  category: '',
  subCategory: '',
  image: '',
  inStock: true,
  stockCount: 0,
  tags: [],
};

function ProductFormContent() {
  const router = useRouter();
  const params = useParams();
  const productId = params?.id as string | undefined;
  const isEdit = !!productId;

  const [formData, setFormData] = useState<ProductForm>(initialForm);
  const [isLoading, setIsLoading] = useState(isEdit);
  const [isSaving, setIsSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');

  // Fetch product if editing
  useEffect(() => {
    if (isEdit && productId) {
      fetchProduct();
    }
  }, [isEdit, productId]);

  const fetchProduct = async () => {
    try {
      // In a real app, fetch from API
      // const response = await adminApi.getProduct(productId);
      setFormData(initialForm);
      setIsLoading(false);
    } catch (error) {
      const message = handleApiError(error);
      showErrorToast(message, 'Failed to load product');
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const response = await uploadApi.uploadImage(file, 'products');
      if (response.data.success) {
        setFormData({ ...formData, image: response.data.data.url });
        setImagePreview(response.data.data.url);
        showSuccessToast('Image uploaded successfully');
      }
    } catch (error) {
      const message = handleApiError(error);
      showErrorToast(message, 'Failed to upload image');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      if (isEdit && productId) {
        const response = await adminApi.updateProduct(productId, formData);
        if (response.data.success) {
          showSuccessToast('Product updated successfully');
          router.push('/admin/products');
        }
      } else {
        const response = await adminApi.createProduct(formData);
        if (response.data.success) {
          showSuccessToast('Product created successfully');
          router.push('/admin/products');
        }
      }
    } catch (error) {
      const message = handleApiError(error);
      showErrorToast(message, isEdit ? 'Failed to update product' : 'Failed to create product');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <PageLoader message="Loading product..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <h1 className="text-4xl font-black text-white mb-8">
          {isEdit ? 'Edit Product' : 'Add New Product'}
        </h1>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-xl p-8 space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Basic Information</h2>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Product Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-green-500"
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Price *
                </label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-green-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Original Price
                </label>
                <input
                  type="number"
                  value={formData.originalPrice}
                  onChange={(e) => setFormData({ ...formData, originalPrice: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-green-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Short Description
              </label>
              <textarea
                value={formData.shortDescription}
                onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-green-500"
                rows={2}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Full Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-green-500"
                rows={4}
              />
            </div>
          </div>

          {/* Category & Stock */}
          <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-xl p-8 space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Category & Inventory</h2>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Category *
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-green-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Stock Count *
                </label>
                <input
                  type="number"
                  value={formData.stockCount}
                  onChange={(e) => setFormData({ ...formData, stockCount: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-green-500"
                  required
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.inStock}
                onChange={(e) => setFormData({ ...formData, inStock: e.target.checked })}
                className="w-4 h-4 rounded"
              />
              <label className="font-bold text-gray-700">In Stock</label>
            </div>
          </div>

          {/* Image Upload */}
          <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Product Image</h2>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <label className="block">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <span className="cursor-pointer text-green-600 font-bold hover:text-green-700">
                  Click to upload or drag and drop
                </span>
              </label>
              <p className="text-xs text-gray-600 mt-2">PNG, JPG, GIF up to 10MB</p>
            </div>

            {imagePreview && (
              <div className="mt-4">
                <img src={imagePreview} alt="Preview" className="max-h-48 rounded-lg" />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              {isSaving ? 'Saving...' : 'Save Product'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-900 font-bold rounded-lg hover:bg-gray-300 transition-all flex items-center justify-center gap-2"
            >
              <X className="w-5 h-5" />
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProductFormPage() {
  return (
    <AdminGuard>
      <ProductFormContent />
    </AdminGuard>
  );
}
