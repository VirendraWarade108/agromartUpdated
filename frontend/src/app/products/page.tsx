'use client';

import { useState, useEffect } from 'react';
import { useProductList } from '@/hooks/useProducts';
import ProductGrid from '@/components/products/ProductGrid';
import ProductFilter, { ActiveFilters } from '@/components/products/ProductFilter';
import { PageLoader } from '@/components/shared/LoadingSpinner';

export default function ProductsPage() {
  const [showFilters, setShowFilters] = useState(false);

  // Use the product list hook with filters
  const {
    products,
    isLoading,
    error,
    pagination,
    filters,
    updateFilter,
    resetFilters,
    nextPage,
    prevPage,
    goToPage,
  } = useProductList({
    page: 1,
    limit: 12,
    sortBy: 'popular',
  });

  // Categories for filter
  const categories = [
    { id: 'seeds', name: 'Seeds', count: 500, icon: '🌱' },
    { id: 'fertilizers', name: 'Fertilizers', count: 300, icon: '🧪' },
    { id: 'equipment', name: 'Equipment', count: 200, icon: '🚜' },
    { id: 'pesticides', name: 'Pesticides', count: 150, icon: '🛡️' },
    { id: 'irrigation', name: 'Irrigation', count: 180, icon: '💧' },
    { id: 'tools', name: 'Tools', count: 250, icon: '🔧' },
  ];

  // View mode state
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-3xl font-black text-white mb-4">Oops! Something went wrong</h2>
          <p className="text-gray-300 font-semibold mb-8">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-xl transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900">
      {/* Hero Section */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 opacity-40">
          <div className="absolute w-96 h-96 bg-green-500/30 rounded-full blur-3xl top-20 left-10 animate-pulse"></div>
          <div className="absolute w-96 h-96 bg-blue-500/30 rounded-full blur-3xl bottom-20 right-10 animate-pulse"></div>
        </div>

        <div className="relative max-w-7xl mx-auto text-center">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white mb-4 leading-tight">
            Our Products
          </h1>
          <p className="text-xl text-gray-200 font-medium max-w-2xl mx-auto">
            Discover premium quality agricultural products for modern farming
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className={`lg:w-80 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <ProductFilter
              filters={filters}
              onFilterChange={updateFilter}
              onResetFilters={resetFilters}
              categories={categories}
              showMobileToggle={true}
              onClose={() => setShowFilters(false)}
            />
          </aside>

          {/* Products Grid */}
          <main className="flex-1">
            {/* Active Filters */}
            {(filters.category || filters.minPrice || filters.maxPrice || filters.rating || filters.inStock !== undefined) && (
              <div className="mb-6">
                <ActiveFilters
                  filters={filters}
                  onRemoveFilter={(key) => updateFilter(key, undefined)}
                  categories={categories}
                />
              </div>
            )}

            {/* Product Grid */}
            <ProductGrid
              products={products}
              isLoading={isLoading}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              showViewToggle={true}
              gridCols={4}
            />

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="mt-12 flex justify-center">
                <div className="flex items-center gap-2 bg-white rounded-2xl border-2 border-gray-200 shadow-lg p-2">
                  <button
                    onClick={prevPage}
                    disabled={!pagination.hasPrev}
                    className="px-6 py-3 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold text-gray-900 transition-all"
                  >
                    Previous
                  </button>
                  
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => goToPage(pageNum)}
                        className={`w-12 h-12 rounded-xl font-bold transition-all ${
                          pagination.page === pageNum
                            ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg'
                            : 'bg-gray-50 text-gray-900 hover:bg-gray-100'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={nextPage}
                    disabled={!pagination.hasNext}
                    className="px-6 py-3 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold text-gray-900 transition-all"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}