'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Layers } from 'lucide-react';
import { categoryApi, adminApi, handleApiError } from '@/lib/api';
import { showSuccessToast, showErrorToast } from '@/store/uiStore';
import { PageLoader } from '@/components/shared/LoadingSpinner';
import { AdminGuard } from '@/components/shared/AuthGuard';

interface Category {
  id: string;
  name: string;
  icon?: string;
  description?: string;
  _count?: {
    products: number;
  };
}

function CategoriesContent() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const response = await categoryApi.getAll();

      if (response.data.success) {
        setCategories(response.data.data || []);
      }
    } catch (error) {
      const message = handleApiError(error);
      showErrorToast(message, 'Failed to load categories');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingId('new');
    setFormData({ name: '', description: '', icon: '' });
  };

  const handleEdit = (category: Category) => {
    setEditingId(category.id);
    setFormData({
      name: category.name,
      description: category.description || '',
      icon: category.icon || '',
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      showErrorToast('Category name is required', 'Validation Error');
      return;
    }

    setIsSaving(true);
    try {
      if (editingId === 'new') {
        const response = await adminApi.createCategory({
          name: formData.name,
          description: formData.description,
          icon: formData.icon,
        });
        if (response?.data?.success) {
          await fetchCategories();
          showSuccessToast('Category added successfully');
          setEditingId(null);
        }
      } else if (editingId) {
        const response = await adminApi.updateCategory(editingId, {
          name: formData.name,
          description: formData.description,
          icon: formData.icon,
        });
        if (response?.data?.success) {
          await fetchCategories();
          showSuccessToast('Category updated successfully');
          setEditingId(null);
        }
      }
    } catch (error) {
      const message = handleApiError(error);
      showErrorToast(message, 'Failed to save category');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId);
    const productCount = category?._count?.products || 0;

    if (productCount > 0) {
      showErrorToast(
        `Cannot delete category with ${productCount} products. Remove products first.`,
        'Delete Failed'
      );
      return;
    }

    if (!window.confirm('Are you sure you want to delete this category?')) {
      return;
    }

    setDeletingId(categoryId);
    try {
      const response = await adminApi.deleteCategory(categoryId);
      if (response?.data?.success) {
        await fetchCategories();
        showSuccessToast('Category deleted successfully');
      }
    } catch (error) {
      const message = handleApiError(error);
      showErrorToast(message, 'Failed to delete category');
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return <PageLoader message="Loading categories..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-black text-white flex items-center gap-3">
              <Layers className="w-8 h-8 text-green-400" />
              Category Management
            </h1>
            <p className="text-gray-300 font-semibold mt-2">
              {categories.length} categories
            </p>
          </div>
          <button
            onClick={handleAdd}
            className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all flex items-center gap-2 shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Add Category
          </button>
        </div>

        {/* Add/Edit Form */}
        {editingId && (
          <form onSubmit={handleSave} className="bg-white rounded-2xl border-2 border-gray-200 shadow-xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {editingId === 'new' ? 'Add New Category' : 'Edit Category'}
            </h2>
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Category Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g., Seeds, Fertilizers"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-green-500 font-semibold"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Icon (Emoji)
                </label>
                <input
                  type="text"
                  placeholder="🌾"
                  maxLength={2}
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-green-500 text-2xl text-center"
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  placeholder="Brief description of this category"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-green-500 font-semibold"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Saving...' : 'Save Category'}
              </button>
              <button
                type="button"
                onClick={() => setEditingId(null)}
                className="px-6 py-3 bg-gray-200 text-gray-900 font-bold rounded-xl hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Categories Grid */}
        {categories.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-xl p-16 text-center">
            <Layers className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No Categories Yet</h3>
            <p className="text-gray-600 font-semibold mb-6">
              Start by adding your first product category
            </p>
            <button
              onClick={handleAdd}
              className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-all"
            >
              <Plus className="w-5 h-5" />
              Add First Category
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => (
              <div
                key={category.id}
                className="bg-white rounded-2xl border-2 border-gray-200 shadow-xl p-6 hover:shadow-2xl hover:border-green-400 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="text-5xl">{category.icon || '📦'}</div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(category)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit category"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(category.id)}
                      disabled={deletingId === category.id}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Delete category"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-2">{category.name}</h3>
                {category.description && (
                  <p className="text-sm text-gray-600 font-semibold mb-4">
                    {category.description}
                  </p>
                )}
                <p className="text-sm text-green-600 font-bold">
                  {category._count?.products || 0} products
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminCategoriesPage() {
  return (
    <AdminGuard>
      <CategoriesContent />
    </AdminGuard>
  );
}