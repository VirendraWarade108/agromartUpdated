'use client';

import { useState, useEffect } from 'react';
import { X, Upload, Image as ImageIcon, Loader, AlertCircle } from 'lucide-react';
import { categoryApi, handleApiError } from '@/lib/api';
import { showErrorToast } from '@/store/uiStore';

/**
 * Product Form Data
 */
interface ProductFormData {
  name: string;
  slug: string;
  description: string;
  price: number;
  originalPrice?: number;
  categoryId: string;
  stock: number;
  image?: string;
  images?: string[];
}

/**
 * Product Form Props
 */
interface ProductFormProps {
  initialData?: Partial<ProductFormData>;
  isLoading?: boolean;
  onSubmit: (data: ProductFormData) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
  title?: string;
}

/**
 * Category Interface
 */
interface Category {
  id: string;
  name: string;
  description?: string;
}

/**
 * Reusable Product Form Component
 */
export function ProductForm({
  initialData,
  isLoading = false,
  onSubmit,
  onCancel,
  submitLabel = 'Create Product',
  title = 'Product Information',
}: ProductFormProps) {
  const [formData, setFormData] = useState<ProductFormData>({
    name: initialData?.name || '',
    slug: initialData?.slug || '',
    description: initialData?.description || '',
    price: initialData?.price || 0,
    originalPrice: initialData?.originalPrice,
    categoryId: initialData?.categoryId || '',
    stock: initialData?.stock || 0,
    image: initialData?.image,
    images: initialData?.images || [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [isFetchingCategories, setIsFetchingCategories] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(
    initialData?.image || null
  );

  /**
   * Fetch categories on mount
   */
  useEffect(() => {
    fetchCategories();
  }, []);

  /**
   * Auto-generate slug from name
   */
  useEffect(() => {
    if (!initialData?.slug && formData.name) {
      const slug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setFormData((prev) => ({ ...prev, slug }));
    }
  }, [formData.name, initialData?.slug]);

  /**
   * Fetch categories from API
   */
  const fetchCategories = async () => {
    setIsFetchingCategories(true);
    try {
      const response = await categoryApi.getAll();
      if (response.data.success) {
        setCategories(response.data.data || []);
      }
    } catch (err) {
      const message = handleApiError(err);
      showErrorToast(message, 'Failed to load categories');
    } finally {
      setIsFetchingCategories(false);
    }
  };

  /**
   * Handle input change
   */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    let processedValue: string | number = value;

    // Handle number inputs
    if (type === 'number') {
      processedValue = value === '' ? 0 : parseFloat(value);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: processedValue,
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  /**
   * Handle image upload (mock implementation)
   */
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showErrorToast('Please select a valid image file', 'Invalid File');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showErrorToast('Image size must be less than 5MB', 'File Too Large');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setImagePreview(result);
      setFormData((prev) => ({ ...prev, image: result }));
    };
    reader.readAsDataURL(file);
  };

  /**
   * Remove image
   */
  const handleRemoveImage = () => {
    setImagePreview(null);
    setFormData((prev) => ({ ...prev, image: undefined }));
  };

  /**
   * Validate form
   */
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }

    if (!formData.slug.trim()) {
      newErrors.slug = 'Product slug is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (formData.price <= 0) {
      newErrors.price = 'Price must be greater than 0';
    }

    if (formData.originalPrice && formData.originalPrice < formData.price) {
      newErrors.originalPrice = 'Original price must be greater than sale price';
    }

    if (!formData.categoryId) {
      newErrors.categoryId = 'Please select a category';
    }

    if (formData.stock < 0) {
      newErrors.stock = 'Stock cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      showErrorToast('Please fix all validation errors', 'Validation Failed');
      return;
    }

    try {
      await onSubmit(formData);
    } catch (err) {
      // Error is handled by parent component
    }
  };

  return (
    <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-2xl p-8">
      <h2 className="text-3xl font-black text-gray-900 mb-6">{title}</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Product Name */}
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">
            Product Name *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter product name"
            disabled={isLoading}
            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:border-green-400 font-semibold text-gray-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              errors.name ? 'border-red-500' : 'border-gray-200'
            }`}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.name}
            </p>
          )}
        </div>

        {/* Slug */}
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">
            Slug *
          </label>
          <input
            type="text"
            name="slug"
            value={formData.slug}
            onChange={handleChange}
            placeholder="product-slug"
            disabled={isLoading}
            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:border-green-400 font-semibold text-gray-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              errors.slug ? 'border-red-500' : 'border-gray-200'
            }`}
          />
          {errors.slug && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.slug}
            </p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">
            Description *
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Enter product description"
            rows={4}
            disabled={isLoading}
            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:border-green-400 font-semibold text-gray-900 transition-all resize-none disabled:opacity-50 disabled:cursor-not-allowed ${
              errors.description ? 'border-red-500' : 'border-gray-200'
            }`}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.description}
            </p>
          )}
        </div>

        {/* Price & Original Price */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Price (₹) *
            </label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              placeholder="0.00"
              min="0"
              step="0.01"
              disabled={isLoading}
              className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:border-green-400 font-semibold text-gray-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                errors.price ? 'border-red-500' : 'border-gray-200'
              }`}
            />
            {errors.price && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.price}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Original Price (₹)
            </label>
            <input
              type="number"
              name="originalPrice"
              value={formData.originalPrice || ''}
              onChange={handleChange}
              placeholder="0.00"
              min="0"
              step="0.01"
              disabled={isLoading}
              className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:border-green-400 font-semibold text-gray-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                errors.originalPrice ? 'border-red-500' : 'border-gray-200'
              }`}
            />
            {errors.originalPrice && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.originalPrice}
              </p>
            )}
          </div>
        </div>

        {/* Category & Stock */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Category *
            </label>
            <select
              name="categoryId"
              value={formData.categoryId}
              onChange={handleChange}
              disabled={isLoading || isFetchingCategories}
              className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:border-green-400 font-semibold text-gray-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                errors.categoryId ? 'border-red-500' : 'border-gray-200'
              }`}
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {errors.categoryId && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.categoryId}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Stock Quantity *
            </label>
            <input
              type="number"
              name="stock"
              value={formData.stock}
              onChange={handleChange}
              placeholder="0"
              min="0"
              disabled={isLoading}
              className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:border-green-400 font-semibold text-gray-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                errors.stock ? 'border-red-500' : 'border-gray-200'
              }`}
            />
            {errors.stock && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.stock}
              </p>
            )}
          </div>
        </div>

        {/* Image Upload */}
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">
            Product Image
          </label>
          
          {imagePreview ? (
            <div className="relative w-full h-64 bg-gray-100 rounded-xl border-2 border-gray-200 overflow-hidden">
              <img
                src={imagePreview}
                alt="Product preview"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                disabled={isLoading}
                className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <label className="block w-full h-64 border-2 border-dashed border-gray-300 rounded-xl hover:border-green-400 transition-all cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={isLoading}
                className="hidden"
              />
              <div className="h-full flex flex-col items-center justify-center gap-3">
                <Upload className="w-12 h-12 text-gray-400" />
                <p className="text-gray-600 font-bold">Click to upload image</p>
                <p className="text-sm text-gray-500 font-semibold">
                  PNG, JPG up to 5MB
                </p>
              </div>
            </label>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-6 border-t-2 border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              submitLabel
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ProductForm;