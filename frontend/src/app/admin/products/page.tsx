'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Package, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Search,
  X
} from 'lucide-react';
import { productApi, adminApi, handleApiError } from '@/lib/api';
import { showSuccessToast, showErrorToast } from '@/store/uiStore';
import { DataTable, Column } from '@/components/admin/DataTable';
import { ProductForm } from '@/components/admin/ProductForm';
import { formatPrice } from '@/lib/utils';

/**
 * Product Interface
 */
interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  originalPrice?: number;
  stock: number;
  image?: string;
  images?: string[];
  category?: {
    id: string;
    name: string;
  };
  categoryId?: string;
  vendor?: {
    businessName: string;
  };
  createdAt: string;
  updatedAt: string;
}

/**
 * Admin Products Page
 */
export default function AdminProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  /**
   * Fetch products
   */
  useEffect(() => {
    fetchProducts();
  }, [pagination.page, pagination.limit, searchQuery]);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (searchQuery) {
        params.search = searchQuery;
      }

      const response = await productApi.getAll(params);

      if (response.data.success) {
        const data = response.data.data;
        
        // Handle both paginated and non-paginated responses
        if (Array.isArray(data)) {
          setProducts(data);
          setPagination((prev) => ({
            ...prev,
            total: data.length,
            totalPages: Math.ceil(data.length / prev.limit),
          }));
        } else if (data.products) {
          setProducts(data.products);
          setPagination((prev) => ({
            ...prev,
            total: data.pagination?.total || data.products.length,
            totalPages: data.pagination?.totalPages || Math.ceil(data.products.length / prev.limit),
          }));
        } else {
          setProducts([]);
        }
      }
    } catch (error) {
      const message = handleApiError(error);
      showErrorToast(message, 'Failed to load products');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle search
   */
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  /**
   * Handle page change
   */
  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  /**
   * Handle limit change
   */
  const handleLimitChange = (limit: number) => {
    setPagination((prev) => ({ ...prev, limit, page: 1 }));
  };

  /**
   * Handle create product
   */
  const handleCreateProduct = async (data: any) => {
    setIsSubmitting(true);
    try {
      const response = await adminApi.createProduct(data);

      if (response.data.success) {
        showSuccessToast('Product created successfully', 'Success');
        setShowForm(false);
        fetchProducts();
      }
    } catch (error) {
      const message = handleApiError(error);
      showErrorToast(message, 'Failed to create product');
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle update product
   */
  const handleUpdateProduct = async (data: any) => {
    if (!editingProduct) return;

    setIsSubmitting(true);
    try {
      const response = await adminApi.updateProduct(editingProduct.id, data);

      if (response.data.success) {
        showSuccessToast('Product updated successfully', 'Success');
        setShowForm(false);
        setEditingProduct(null);
        fetchProducts();
      }
    } catch (error) {
      const message = handleApiError(error);
      showErrorToast(message, 'Failed to update product');
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle delete product
   */
  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      const response = await adminApi.deleteProduct(productId);

      if (response.data.success) {
        showSuccessToast('Product deleted successfully', 'Success');
        fetchProducts();
      }
    } catch (error) {
      const message = handleApiError(error);
      showErrorToast(message, 'Failed to delete product');
    }
  };

  /**
   * Handle edit product
   */
  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  /**
   * Handle cancel form
   */
  const handleCancelForm = () => {
    setShowForm(false);
    setEditingProduct(null);
  };

  /**
   * Define table columns
   */
  const columns: Column<Product>[] = [
    {
      key: 'image',
      label: 'Image',
      width: '80px',
      render: (value, row) => (
        <div className="w-12 h-12 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl overflow-hidden flex-shrink-0">
          <img
            src={row.image || row.images?.[0] || '/placeholder.png'}
            alt={row.name}
            className="w-full h-full object-cover"
          />
        </div>
      ),
    },
    {
      key: 'name',
      label: 'Product Name',
      sortable: true,
      render: (value, row) => (
        <div>
          <p className="font-bold text-gray-900">{row.name}</p>
          <p className="text-sm text-gray-600 font-semibold">{row.slug}</p>
        </div>
      ),
    },
    {
      key: 'category.name',
      label: 'Category',
      sortable: true,
      render: (value) => (
        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-bold">
          {value || 'N/A'}
        </span>
      ),
    },
    {
      key: 'price',
      label: 'Price',
      sortable: true,
      align: 'right',
      render: (value, row) => (
        <div className="text-right">
          <p className="font-black text-gray-900">{formatPrice(row.price)}</p>
          {row.originalPrice && (
            <p className="text-sm text-gray-500 line-through font-semibold">
              {formatPrice(row.originalPrice)}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'stock',
      label: 'Stock',
      sortable: true,
      align: 'center',
      render: (value) => (
        <span
          className={`inline-block px-3 py-1 rounded-lg text-sm font-bold ${
            value > 10
              ? 'bg-green-100 text-green-700'
              : value > 0
              ? 'bg-yellow-100 text-yellow-700'
              : 'bg-red-100 text-red-700'
          }`}
        >
          {value}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      render: (value, row) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => router.push(`/products/${row.slug}`)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="View Product"
          >
            <Eye className="w-5 h-5 text-blue-600" />
          </button>
          <button
            onClick={() => handleEditProduct(row)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Edit Product"
          >
            <Edit className="w-5 h-5 text-green-600" />
          </button>
          <button
            onClick={() => handleDeleteProduct(row.id)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Delete Product"
          >
            <Trash2 className="w-5 h-5 text-red-600" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-white flex items-center gap-3">
              <Package className="w-8 h-8 text-green-400" />
              Products Management
            </h1>
            <p className="text-gray-300 font-semibold mt-1">
              Manage your product inventory ({products.length} products)
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            disabled={showForm}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-50"
          >
            <Plus className="w-5 h-5" />
            Add Product
          </button>
        </div>

        {/* Product Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b-2 border-gray-200 px-8 py-4 flex items-center justify-between">
                <h2 className="text-2xl font-black text-gray-900">
                  {editingProduct ? 'Edit Product' : 'Create New Product'}
                </h2>
                <button
                  onClick={handleCancelForm}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-gray-600" />
                </button>
              </div>
              <div className="p-8">
                <ProductForm
                  initialData={
                    editingProduct
                      ? {
                          name: editingProduct.name,
                          slug: editingProduct.slug,
                          description: editingProduct.description,
                          price: editingProduct.price,
                          originalPrice: editingProduct.originalPrice,
                          categoryId: editingProduct.categoryId || editingProduct.category?.id,
                          stock: editingProduct.stock,
                          image: editingProduct.image,
                          images: editingProduct.images,
                        }
                      : undefined
                  }
                  isLoading={isSubmitting}
                  onSubmit={editingProduct ? handleUpdateProduct : handleCreateProduct}
                  onCancel={handleCancelForm}
                  submitLabel={editingProduct ? 'Update Product' : 'Create Product'}
                  title=""
                />
              </div>
            </div>
          </div>
        )}

        {/* Products Table */}
        <DataTable
          data={products}
          columns={columns}
          isLoading={isLoading}
          emptyMessage="No products found"
          pagination={pagination}
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
          onSearch={handleSearch}
          onRefresh={fetchProducts}
          searchPlaceholder="Search products by name or slug..."
          showSearch={true}
          showRefresh={true}
          showExport={false}
          rowKey={(row) => row.id}
        />

        {/* Summary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              label: 'Total Products',
              value: products.length,
              color: 'text-blue-600',
              icon: Package,
            },
            {
              label: 'In Stock',
              value: products.filter((p) => p.stock > 0).length,
              color: 'text-green-600',
              icon: Package,
            },
            {
              label: 'Low Stock',
              value: products.filter((p) => p.stock > 0 && p.stock <= 10).length,
              color: 'text-yellow-600',
              icon: Package,
            },
            {
              label: 'Out of Stock',
              value: products.filter((p) => p.stock === 0).length,
              color: 'text-red-600',
              icon: Package,
            },
          ].map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg p-6"
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="text-gray-600 font-bold text-sm">{stat.label}</p>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
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