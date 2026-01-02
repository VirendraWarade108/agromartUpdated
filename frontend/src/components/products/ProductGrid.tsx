import React from 'react';
import { LayoutGrid, List, Package } from 'lucide-react';
import { Product } from '@/hooks/useProducts';
import ProductCard, { CompactProductCard } from './ProductCard';
import { ProductGridSkeleton, SectionLoader } from '../shared/LoadingSpinner';

export interface ProductGridProps {
  products: Product[];
  isLoading?: boolean;
  viewMode?: 'grid' | 'list';
  onViewModeChange?: (mode: 'grid' | 'list') => void;
  showViewToggle?: boolean;
  emptyMessage?: string;
  emptySubtext?: string;
  gridCols?: 2 | 3 | 4 | 5;
  onQuickView?: (product: Product) => void;
  onAddToWishlist?: (productId: string) => void;
  className?: string;
}

/**
 * ProductGrid Component
 * Displays products in grid or list layout with loading states
 */
export default function ProductGrid({
  products,
  isLoading = false,
  viewMode = 'grid',
  onViewModeChange,
  showViewToggle = true,
  emptyMessage = 'No products found',
  emptySubtext = 'Try adjusting your filters or search terms',
  gridCols = 4,
  onQuickView,
  onAddToWishlist,
  className = '',
}: ProductGridProps) {
  
  /**
   * Get grid column classes based on cols prop
   */
  const getGridClasses = () => {
    const colClasses = {
      2: 'md:grid-cols-2',
      3: 'md:grid-cols-2 lg:grid-cols-3',
      4: 'md:grid-cols-2 lg:grid-cols-4',
      5: 'md:grid-cols-2 lg:grid-cols-5',
    };
    return `grid ${colClasses[gridCols]} gap-6`;
  };

  /**
   * Render view toggle
   */
  const renderViewToggle = () => {
    if (!showViewToggle || !onViewModeChange) return null;

    return (
      <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
        <button
          onClick={() => onViewModeChange('grid')}
          className={`p-2 rounded-lg transition-all ${
            viewMode === 'grid' 
              ? 'bg-white shadow-md text-green-600' 
              : 'text-gray-600 hover:bg-gray-200'
          }`}
          title="Grid view"
        >
          <LayoutGrid className="w-5 h-5" />
        </button>
        <button
          onClick={() => onViewModeChange('list')}
          className={`p-2 rounded-lg transition-all ${
            viewMode === 'list' 
              ? 'bg-white shadow-md text-green-600' 
              : 'text-gray-600 hover:bg-gray-200'
          }`}
          title="List view"
        >
          <List className="w-5 h-5" />
        </button>
      </div>
    );
  };

  /**
   * Render loading state
   */
  if (isLoading) {
    return (
      <div className={className}>
        {showViewToggle && (
          <div className="flex items-center justify-between mb-6">
            <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse"></div>
            {renderViewToggle()}
          </div>
        )}
        <ProductGridSkeleton count={gridCols * 2} />
      </div>
    );
  }

  /**
   * Render empty state
   */
  if (!products || products.length === 0) {
    return (
      <div className={className}>
        {showViewToggle && (
          <div className="flex items-center justify-between mb-6">
            <p className="text-gray-700 font-bold text-lg">
              <span className="text-green-600">0</span> Products Found
            </p>
            {renderViewToggle()}
          </div>
        )}
        
        <div className="bg-white rounded-2xl border-2 border-gray-200 p-16 text-center">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Package className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-2xl font-black text-gray-900 mb-2">
            {emptyMessage}
          </h3>
          <p className="text-gray-600 font-semibold mb-8">
            {emptySubtext}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="/products"
              className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-xl transition-all shadow-lg"
            >
              Browse All Products
            </a>
            <a
              href="/"
              className="px-8 py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold rounded-xl transition-all"
            >
              Go to Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  /**
   * Render products
   */
  return (
    <div className={className}>
      {/* Header with count and view toggle */}
      {showViewToggle && (
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-700 font-bold text-lg">
            <span className="text-green-600">{products.length}</span> Products Found
          </p>
          {renderViewToggle()}
        </div>
      )}

      {/* Product Grid/List */}
      <div className={viewMode === 'grid' ? getGridClasses() : 'space-y-6'}>
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            variant={viewMode === 'list' ? 'list' : 'default'}
            showQuickView={!!onQuickView}
            onQuickView={onQuickView}
            onAddToWishlist={onAddToWishlist}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Compact Product Grid - For related products, featured sections
 */
export function CompactProductGrid({
  products,
  title,
  isLoading = false,
  cols = 4,
  maxItems,
  showViewAll = false,
  viewAllLink = '/products',
  className = '',
}: {
  products: Product[];
  title?: string;
  isLoading?: boolean;
  cols?: 2 | 3 | 4 | 5;
  maxItems?: number;
  showViewAll?: boolean;
  viewAllLink?: string;
  className?: string;
}) {
  const displayProducts = maxItems ? products.slice(0, maxItems) : products;

  if (isLoading) {
    return (
      <div className={className}>
        {title && <h2 className="text-3xl font-black text-white mb-6">{title}</h2>}
        <ProductGridSkeleton count={cols} />
      </div>
    );
  }

  if (products.length === 0) return null;

  const colClasses = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-2 lg:grid-cols-5',
  };

  return (
    <div className={className}>
      {/* Section Header */}
      {(title || showViewAll) && (
        <div className="flex items-center justify-between mb-6">
          {title && <h2 className="text-3xl font-black text-white">{title}</h2>}
          {showViewAll && (
            <a
              href={viewAllLink}
              className="flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-xl border-2 border-white/30 text-white font-bold rounded-xl hover:bg-white/20 transition-all"
            >
              View All
              <LayoutGrid className="w-5 h-5" />
            </a>
          )}
        </div>
      )}

      {/* Product Grid */}
      <div className={`grid ${colClasses[cols]} gap-6`}>
        {displayProducts.map((product) => (
          <CompactProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}

/**
 * Featured Products Grid - For homepage sections
 */
export function FeaturedProductsGrid({
  products,
  isLoading = false,
  className = '',
}: {
  products: Product[];
  isLoading?: boolean;
  className?: string;
}) {
  return (
    <CompactProductGrid
      products={products}
      title="Featured Products"
      isLoading={isLoading}
      cols={4}
      maxItems={8}
      showViewAll={true}
      viewAllLink="/products?featured=true"
      className={className}
    />
  );
}

/**
 * Related Products Grid - For product detail pages
 */
export function RelatedProductsGrid({
  products,
  isLoading = false,
  className = '',
}: {
  products: Product[];
  isLoading?: boolean;
  className?: string;
}) {
  if (products.length === 0 && !isLoading) return null;

  return (
    <CompactProductGrid
      products={products}
      title="You May Also Like"
      isLoading={isLoading}
      cols={4}
      maxItems={4}
      showViewAll={false}
      className={className}
    />
  );
}

/**
 * Category Products Grid - For category pages
 */
export function CategoryProductsGrid({
  products,
  categoryName,
  isLoading = false,
  viewMode = 'grid',
  onViewModeChange,
  className = '',
}: {
  products: Product[];
  categoryName: string;
  isLoading?: boolean;
  viewMode?: 'grid' | 'list';
  onViewModeChange?: (mode: 'grid' | 'list') => void;
  className?: string;
}) {
  return (
    <ProductGrid
      products={products}
      isLoading={isLoading}
      viewMode={viewMode}
      onViewModeChange={onViewModeChange}
      showViewToggle={true}
      emptyMessage={`No products found in ${categoryName}`}
      emptySubtext="Check back later for new products"
      gridCols={4}
      className={className}
    />
  );
}

/**
 * Search Results Grid - For search pages
 */
export function SearchResultsGrid({
  products,
  searchQuery,
  isLoading = false,
  viewMode = 'grid',
  onViewModeChange,
  className = '',
}: {
  products: Product[];
  searchQuery: string;
  isLoading?: boolean;
  viewMode?: 'grid' | 'list';
  onViewModeChange?: (mode: 'grid' | 'list') => void;
  className?: string;
}) {
  return (
    <ProductGrid
      products={products}
      isLoading={isLoading}
      viewMode={viewMode}
      onViewModeChange={onViewModeChange}
      showViewToggle={true}
      emptyMessage={`No results for "${searchQuery}"`}
      emptySubtext="Try different keywords or browse our categories"
      gridCols={4}
      className={className}
    />
  );
}