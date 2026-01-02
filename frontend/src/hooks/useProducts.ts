import { useState, useCallback, useEffect } from 'react';
import { productApi, handleApiError } from '@/lib/api';
import { showErrorToast } from '@/store/uiStore';

export interface Product {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  shortDescription?: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  category: string;
  subCategory?: string;
  images?: string[];
  image: string; // Main display image
  inStock: boolean;
  stockCount?: number;
  rating: number;
  reviews: number;
  tags?: string[];
  brand?: string;
  features?: string[];
  specifications?: Record<string, string>;
  badge?: string;
  sales?: number;
}

export interface ProductFilters {
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  rating?: number;
  sortBy?: 'popular' | 'price-low' | 'price-high' | 'rating' | 'newest';
  page?: number;
  limit?: number;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface UseProductsReturn {
  // State
  products: Product[];
  product: Product | null;
  relatedProducts: Product[];
  featuredProducts: Product[];
  isLoading: boolean;
  error: string | null;
  pagination: PaginationInfo | null;
  
  // Actions
  fetchProducts: (filters?: ProductFilters) => Promise<void>;
  fetchProductById: (id: string) => Promise<void>;
  fetchProductBySlug: (slug: string) => Promise<void>;
  fetchRelatedProducts: (id: string) => Promise<void>;
  fetchFeaturedProducts: () => Promise<void>;
  searchProducts: (query: string, filters?: ProductFilters) => Promise<void>;
  clearError: () => void;
  resetProducts: () => void;
}

/**
 * Custom hook for products management
 * Handles product fetching, filtering, and search
 */
export function useProducts(): UseProductsReturn {
  const [products, setProducts] = useState<Product[]>([]);
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);

  /**
   * Clear error message
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Reset products list
   */
  const resetProducts = useCallback(() => {
    setProducts([]);
    setProduct(null);
    setRelatedProducts([]);
    setPagination(null);
    setError(null);
  }, []);

  /**
   * Fetch products with filters
   */
  const fetchProducts = useCallback(async (filters?: ProductFilters): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await productApi.getAll(filters);
      
      if (response.data.success) {
        const data = response.data.data;
        
        // Handle paginated response
        if (Array.isArray(data)) {
          setProducts(data);
        } else if (data.products) {
          setProducts(data.products);
          
          // Set pagination if available
          if (data.pagination) {
            setPagination(data.pagination);
          }
        }
      } else {
        setError('Failed to fetch products');
      }
    } catch (err: any) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      showErrorToast(errorMessage, 'Failed to load products');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fetch single product by ID
   */
  const fetchProductById = useCallback(async (id: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await productApi.getById(id);
      
      if (response.data.success) {
        setProduct(response.data.data);
      } else {
        setError('Product not found');
        setProduct(null);
      }
    } catch (err: any) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      showErrorToast(errorMessage, 'Failed to load product');
      setProduct(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fetch single product by slug
   * Note: Currently uses ID as fallback. Backend should implement /api/products/slug/:slug endpoint
   */
  const fetchProductBySlug = useCallback(async (slug: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await productApi.getById(slug);
      
      if (response.data.success) {
        setProduct(response.data.data);
      } else {
        setError('Product not found');
        setProduct(null);
      }
    } catch (err: any) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      showErrorToast(errorMessage, 'Failed to load product');
      setProduct(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fetch related products
   */
  const fetchRelatedProducts = useCallback(async (id: string): Promise<void> => {
    try {
      const response = await productApi.getRelated(id);
      
      if (response.data.success) {
        setRelatedProducts(response.data.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch related products:', err);
      // Don't show error to user - related products are optional
      setRelatedProducts([]);
    }
  }, []);

  /**
   * Fetch featured products
   */
  const fetchFeaturedProducts = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await productApi.getFeatured();
      
      if (response.data.success) {
        setFeaturedProducts(response.data.data);
      } else {
        setError('Failed to fetch featured products');
      }
    } catch (err: any) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      showErrorToast(errorMessage, 'Failed to load featured products');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Search products
   * Returns empty list if no results found
   */
  const searchProducts = useCallback(async (
    query: string,
    filters?: ProductFilters
  ): Promise<void> => {
    if (!query || query.trim() === '') {
      // If empty query, fetch all products
      await fetchProducts(filters);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await productApi.search(query, filters);
      
      if (response.data.success) {
        const data = response.data.data;
        
        // Handle different response formats
        if (Array.isArray(data)) {
          setProducts(data);
          if (data.length === 0) {
            setError('No products found matching your search');
          }
        } else if (data.products) {
          setProducts(data.products);
          
          if (data.pagination) {
            setPagination(data.pagination);
          }
          
          if (data.products.length === 0) {
            setError('No products found matching your search');
          }
        }
      } else {
        setProducts([]);
        setError('No products found');
      }
    } catch (err: any) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      showErrorToast(errorMessage, 'Search failed');
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, [fetchProducts]);

  return {
    // State
    products,
    product,
    relatedProducts,
    featuredProducts,
    isLoading,
    error,
    pagination,
    
    // Actions
    fetchProducts,
    fetchProductById,
    fetchProductBySlug,
    fetchRelatedProducts,
    fetchFeaturedProducts,
    searchProducts,
    clearError,
    resetProducts,
  };
}

/**
 * Hook for single product with related products
 * Convenience hook that fetches both product and related products
 */
export function useProduct(id: string | null) {
  const {
    product,
    relatedProducts,
    isLoading,
    error,
    fetchProductById,
    fetchRelatedProducts,
    clearError,
  } = useProducts();

  useEffect(() => {
    if (id) {
      // Fetch product
      fetchProductById(id);
      
      // Fetch related products
      fetchRelatedProducts(id);
    }
  }, [id, fetchProductById, fetchRelatedProducts]);

  return {
    product,
    relatedProducts,
    isLoading,
    error,
    clearError,
    refetch: () => {
      if (id) {
        fetchProductById(id);
        fetchRelatedProducts(id);
      }
    },
  };
}

/**
 * Hook for product list with filters
 * Convenience hook that manages filters and pagination
 */
export function useProductList(initialFilters?: ProductFilters) {
  const {
    products,
    isLoading,
    error,
    pagination,
    fetchProducts,
    clearError,
    resetProducts,
  } = useProducts();

  const [filters, setFilters] = useState<ProductFilters>(initialFilters || {});

  // Fetch products when filters change
  useEffect(() => {
    fetchProducts(filters);
  }, [filters, fetchProducts]);

  // Update specific filter
  const updateFilter = useCallback((key: keyof ProductFilters, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: key === 'page' ? value : 1, // Reset to page 1 if not page change
    }));
  }, []);

  // Reset all filters
  const resetFilters = useCallback(() => {
    setFilters(initialFilters || {});
    resetProducts();
  }, [initialFilters, resetProducts]);

  // Pagination helpers
  const goToPage = useCallback((page: number) => {
    updateFilter('page', page);
  }, [updateFilter]);

  const nextPage = useCallback(() => {
    if (pagination?.hasNext) {
      goToPage(pagination.page + 1);
    }
  }, [pagination, goToPage]);

  const prevPage = useCallback(() => {
    if (pagination?.hasPrev) {
      goToPage(pagination.page - 1);
    }
  }, [pagination, goToPage]);

  return {
    products,
    isLoading,
    error,
    pagination,
    filters,
    updateFilter,
    resetFilters,
    clearError,
    goToPage,
    nextPage,
    prevPage,
    refetch: () => fetchProducts(filters),
  };
}

/**
 * Hook for product search
 * Convenience hook for search functionality with debouncing
 */
export function useProductSearch(initialQuery: string = '') {
  const {
    products,
    isLoading,
    error,
    pagination,
    searchProducts,
    clearError,
  } = useProducts();

  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [query]);

  // Perform search when debounced query changes
  useEffect(() => {
    if (debouncedQuery) {
      searchProducts(debouncedQuery);
    }
  }, [debouncedQuery, searchProducts]);

  return {
    products,
    isLoading,
    error,
    pagination,
    query,
    setQuery,
    clearError,
    clearSearch: () => {
      setQuery('');
      setDebouncedQuery('');
    },
  };
}

export default useProducts;