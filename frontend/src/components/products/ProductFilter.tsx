import React, { useState } from 'react';
import { SlidersHorizontal, X, ChevronDown, ChevronUp, Star } from 'lucide-react';
import { ProductFilters } from '@/hooks/useProducts';
import { formatPrice } from '@/lib/utils';

export interface ProductFilterProps {
  filters: ProductFilters;
  onFilterChange: (key: keyof ProductFilters, value: any) => void;
  onResetFilters: () => void;
  categories?: Array<{ id: string; name: string; count: number; icon?: string }>;
  showMobileToggle?: boolean;
  onClose?: () => void;
  className?: string;
}

/**
 * ProductFilter Component
 * Advanced filtering sidebar for products with categories, price, rating, etc.
 */
export default function ProductFilter({
  filters,
  onFilterChange,
  onResetFilters,
  categories = [],
  showMobileToggle = false,
  onClose,
  className = '',
}: ProductFilterProps) {
  const [expandedSections, setExpandedSections] = useState({
    categories: true,
    price: true,
    rating: true,
    availability: true,
  });

  /**
   * Toggle section expansion
   */
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  /**
   * Handle price range change
   */
  const handlePriceChange = (value: number) => {
    onFilterChange('maxPrice', value);
  };

  /**
   * Quick price filters
   */
  const quickPriceFilters = [
    { label: 'Under ₹1,000', max: 1000 },
    { label: '₹1K - ₹5K', min: 1000, max: 5000 },
    { label: '₹5K - ₹10K', min: 5000, max: 10000 },
    { label: 'Above ₹10K', min: 10000 },
  ];

  /**
   * Apply quick price filter
   */
  const applyQuickPrice = (min?: number, max?: number) => {
    if (min !== undefined) onFilterChange('minPrice', min);
    if (max !== undefined) onFilterChange('maxPrice', max);
    if (min === undefined) onFilterChange('minPrice', 0);
    if (max === undefined) onFilterChange('maxPrice', 100000);
  };

  /**
   * Check if filter is active
   */
  const hasActiveFilters = () => {
    return (
      filters.category ||
      filters.minPrice ||
      filters.maxPrice ||
      filters.inStock !== undefined ||
      filters.rating
    );
  };

  return (
    <div className={`bg-white rounded-2xl border-2 border-gray-200 shadow-xl ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b-2 border-gray-200">
        <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
          <SlidersHorizontal className="w-6 h-6 text-green-600" />
          Filters
        </h2>
        <div className="flex items-center gap-2">
          {hasActiveFilters() && (
            <button
              onClick={onResetFilters}
              className="px-4 py-2 text-sm bg-red-50 text-red-600 hover:bg-red-100 font-bold rounded-lg transition-all"
            >
              Reset All
            </button>
          )}
          {showMobileToggle && onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <div className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
        {/* Categories */}
        {categories.length > 0 && (
          <div>
            <button
              onClick={() => toggleSection('categories')}
              className="w-full flex items-center justify-between mb-4"
            >
              <h3 className="text-lg font-bold text-gray-900">Categories</h3>
              {expandedSections.categories ? (
                <ChevronUp className="w-5 h-5 text-gray-600" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-600" />
              )}
            </button>

            {expandedSections.categories && (
              <div className="space-y-2">
                {/* All Categories Option */}
                <button
                  onClick={() => onFilterChange('category', undefined)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold transition-all ${
                    !filters.category
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span>All Products</span>
                  <span
                    className={`text-sm px-2 py-1 rounded-lg ${
                      !filters.category ? 'bg-white/20' : 'bg-gray-200'
                    }`}
                  >
                    {categories.reduce((sum, cat) => sum + cat.count, 0)}
                  </span>
                </button>

                {/* Category List */}
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => onFilterChange('category', cat.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
                      filters.category === cat.id
                        ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {cat.icon && <span className="text-2xl">{cat.icon}</span>}
                    <span className="flex-1 text-left">{cat.name}</span>
                    <span
                      className={`text-sm px-2 py-1 rounded-lg ${
                        filters.category === cat.id ? 'bg-white/20' : 'bg-gray-200'
                      }`}
                    >
                      {cat.count}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Price Range */}
        <div>
          <button
            onClick={() => toggleSection('price')}
            className="w-full flex items-center justify-between mb-4"
          >
            <h3 className="text-lg font-bold text-gray-900">Price Range</h3>
            {expandedSections.price ? (
              <ChevronUp className="w-5 h-5 text-gray-600" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-600" />
            )}
          </button>

          {expandedSections.price && (
            <div className="space-y-4">
              {/* Price Display */}
              <div className="flex items-center justify-between">
                <span className="text-gray-700 font-bold text-lg">
                  {formatPrice(filters.minPrice || 0)}
                </span>
                <span className="text-gray-500 font-semibold">to</span>
                <span className="text-gray-700 font-bold text-lg">
                  {formatPrice(filters.maxPrice || 100000)}
                </span>
              </div>

              {/* Price Slider */}
              <input
                type="range"
                min="0"
                max="100000"
                step="1000"
                value={filters.maxPrice || 100000}
                onChange={(e) => handlePriceChange(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
              />

              {/* Quick Price Filters */}
              <div className="grid grid-cols-2 gap-2">
                {quickPriceFilters.map((pf, idx) => (
                  <button
                    key={idx}
                    onClick={() => applyQuickPrice(pf.min, pf.max)}
                    className={`px-3 py-2 rounded-lg text-sm font-bold transition-all ${
                      (filters.minPrice === (pf.min || 0) && filters.maxPrice === pf.max) ||
                      (!filters.minPrice && !filters.maxPrice && pf.max === undefined)
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {pf.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Rating Filter */}
        <div>
          <button
            onClick={() => toggleSection('rating')}
            className="w-full flex items-center justify-between mb-4"
          >
            <h3 className="text-lg font-bold text-gray-900">Customer Rating</h3>
            {expandedSections.rating ? (
              <ChevronUp className="w-5 h-5 text-gray-600" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-600" />
            )}
          </button>

          {expandedSections.rating && (
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => (
                <button
                  key={rating}
                  onClick={() =>
                    onFilterChange('rating', filters.rating === rating ? undefined : rating)
                  }
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
                    filters.rating === rating
                      ? 'bg-yellow-50 border-2 border-yellow-400 text-gray-900'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-2 border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-1">
                    {Array.from({ length: rating }).map((_, idx) => (
                      <Star key={idx} className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                    ))}
                    {Array.from({ length: 5 - rating }).map((_, idx) => (
                      <Star key={idx} className="w-4 h-4 text-gray-300" />
                    ))}
                  </div>
                  <span className="text-sm">& Up</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Availability */}
        <div>
          <button
            onClick={() => toggleSection('availability')}
            className="w-full flex items-center justify-between mb-4"
          >
            <h3 className="text-lg font-bold text-gray-900">Availability</h3>
            {expandedSections.availability ? (
              <ChevronUp className="w-5 h-5 text-gray-600" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-600" />
            )}
          </button>

          {expandedSections.availability && (
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={filters.inStock === true}
                  onChange={(e) => onFilterChange('inStock', e.target.checked ? true : undefined)}
                  className="w-5 h-5 text-green-600 rounded border-2 border-gray-300 focus:ring-2 focus:ring-green-500 cursor-pointer"
                />
                <span className="text-gray-700 font-bold group-hover:text-green-600 transition-colors">
                  In Stock Only
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={filters.inStock === false}
                  onChange={(e) => onFilterChange('inStock', e.target.checked ? false : undefined)}
                  className="w-5 h-5 text-green-600 rounded border-2 border-gray-300 focus:ring-2 focus:ring-green-500 cursor-pointer"
                />
                <span className="text-gray-700 font-bold group-hover:text-green-600 transition-colors">
                  Include Out of Stock
                </span>
              </label>
            </div>
          )}
        </div>

        {/* Sort By */}
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4">Sort By</h3>
          <select
            value={filters.sortBy || 'popular'}
            onChange={(e) => onFilterChange('sortBy', e.target.value as any)}
            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl font-bold text-gray-900 focus:outline-none focus:border-green-400 cursor-pointer"
          >
            <option value="popular">Most Popular</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="rating">Highest Rated</option>
            <option value="newest">Newest First</option>
          </select>
        </div>
      </div>

      {/* Apply Button (Mobile) */}
      {showMobileToggle && onClose && (
        <div className="lg:hidden p-6 border-t-2 border-gray-200">
          <button
            onClick={onClose}
            className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-black text-lg rounded-2xl shadow-2xl"
          >
            Apply Filters
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Active Filters Display - Shows applied filters as badges
 */
export function ActiveFilters({
  filters,
  onRemoveFilter,
  categories = [],
}: {
  filters: ProductFilters;
  onRemoveFilter: (key: keyof ProductFilters) => void;
  categories?: Array<{ id: string; name: string }>;
}) {
  const activeFilters: Array<{ key: keyof ProductFilters; label: string }> = [];

  if (filters.category) {
    const cat = categories.find((c) => c.id === filters.category);
    activeFilters.push({
      key: 'category',
      label: `Category: ${cat?.name || filters.category}`,
    });
  }

  if (filters.minPrice || filters.maxPrice) {
    const min = filters.minPrice || 0;
    const max = filters.maxPrice || 100000;
    activeFilters.push({
      key: 'maxPrice',
      label: `${formatPrice(min)} - ${formatPrice(max)}`,
    });
  }

  if (filters.rating) {
    activeFilters.push({
      key: 'rating',
      label: `${filters.rating}★ & Up`,
    });
  }

  if (filters.inStock !== undefined) {
    activeFilters.push({
      key: 'inStock',
      label: filters.inStock ? 'In Stock' : 'Out of Stock',
    });
  }

  if (activeFilters.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-bold text-gray-900">Active Filters:</span>
      {activeFilters.map((filter) => (
        <button
          key={filter.key}
          onClick={() => onRemoveFilter(filter.key)}
          className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-700 rounded-lg font-bold text-sm hover:bg-green-200 transition-colors"
        >
          {filter.label}
          <X className="w-4 h-4" />
        </button>
      ))}
    </div>
  );
}