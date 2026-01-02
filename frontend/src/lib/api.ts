import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

/**
 * Create axios instance with default config
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor - Add auth token
 */
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Track refresh token promise to prevent multiple refresh attempts
let refreshPromise: Promise<string | null> | null = null;

/**
 * Refresh access token
 */
const refreshAccessToken = async (): Promise<string | null> => {
  // If already refreshing, wait for existing promise
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      return null;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
        refreshToken,
      });
      
      if (response.data?.data?.accessToken) {
        const newAccessToken = response.data.data.accessToken;
        localStorage.setItem('access_token', newAccessToken);
        return newAccessToken;
      } else {
        throw new Error('Invalid refresh response');
      }
    } catch (error) {
      // Refresh failed, clear auth
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/auth/login';
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

/**
 * Response interceptor - Handle errors and token refresh
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalConfig = error.config as AxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalConfig?._retry) {
      originalConfig._retry = true;
      
      const newToken = await refreshAccessToken();
      if (newToken && originalConfig) {
        originalConfig.headers = originalConfig.headers || {};
        originalConfig.headers.Authorization = `Bearer ${newToken}`;
        return apiClient.request(originalConfig);
      }
    }

    return Promise.reject(error);
  }
);

/**
 * API Error handler with better response validation
 */
export const handleApiError = (error: any): string => {
  // Handle axios error response
  if (error.response) {
    const data = error.response.data;
    return data?.message || data?.error || 'An error occurred';
  }
  
  // Handle network error (no response)
  if (error.request && !error.response) {
    return 'No response from server. Check your connection.';
  }
  
  // Handle request setup error
  if (error.message === 'Network Error') {
    return 'Network error. Please check your internet connection.';
  }
  
  return error.message || 'An unexpected error occurred';
};

// ============================================
// AUTH ENDPOINTS
// ============================================

export const authApi = {
  login: (email: string, password: string) => 
    apiClient.post('/auth/login', { email, password }),
  
  register: (data: { fullName: string; email: string; phone: string; password: string }) => 
    apiClient.post('/auth/register', data),
  
  logout: () => 
    apiClient.post('/auth/logout'),
  
  forgotPassword: (email: string) => 
    apiClient.post('/auth/forgot-password', { email }),
  
  resetPassword: (token: string, newPassword: string) => 
    apiClient.post('/auth/reset-password', { token, newPassword }),
  
  verifyEmail: (token: string) => 
    apiClient.post('/auth/verify-email', { token }),
  
  refreshToken: (refreshToken: string) => 
    apiClient.post('/auth/refresh', { refreshToken }),
  
  getProfile: () => 
    apiClient.get('/auth/profile'),
  
  updateProfile: (data: any) => 
    apiClient.put('/auth/profile', data),
};

// ============================================
// PRODUCT ENDPOINTS
// ============================================

export const productApi = {
  getAll: (params?: { 
    page?: number; 
    limit?: number; 
    category?: string; 
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: string;
  }) => 
    apiClient.get('/products', { params }),
  
  getById: (id: string) => 
    apiClient.get(`/products/${id}`),
  
  getByCategory: (category: string, params?: any) => 
    apiClient.get(`/products/category/${category}`, { params }),
  
  search: (query: string, params?: any) => 
    apiClient.get('/products/search', { params: { q: query, ...params } }),
  
  getFeatured: () => 
    apiClient.get('/products/featured'),
  
  getRelated: (id: string) => 
    apiClient.get(`/products/${id}/related`),
  
  getReviews: (id: string) => 
    apiClient.get(`/products/${id}/reviews`),
  
  addReview: (id: string, data: { rating: number; comment: string }) => 
    apiClient.post(`/products/${id}/reviews`, data),
};

// ============================================
// WISHLIST ENDPOINTS
// ============================================

export const wishlistApi = {
  get: () => 
    apiClient.get('/users/wishlist'),
  
  add: (productId: string) => 
    apiClient.post('/users/wishlist', { productId }),
  
  remove: (productId: string) => 
    apiClient.delete(`/users/wishlist/${productId}`),
  
  check: (productId: string) => 
    apiClient.get(`/users/wishlist/check/${productId}`),
  
  count: () => 
    apiClient.get('/users/wishlist/count'),
  
  clear: () => 
    apiClient.delete('/users/wishlist'),
  
  moveToCart: (productIds?: string[]) => 
    apiClient.post('/users/wishlist/move-to-cart', { productIds }),
};

// ============================================
// CART ENDPOINTS
// ============================================

export const cartApi = {
  get: () => 
    apiClient.get('/cart'),
  
  add: (productId: string, quantity: number) => 
    apiClient.post('/cart/add', { productId, quantity }),
  
  update: (itemId: string, quantity: number) => 
    apiClient.put(`/cart/items/${itemId}`, { quantity }),
  
  remove: (itemId: string) => 
    apiClient.delete(`/cart/items/${itemId}`),
  
  clear: () => 
    apiClient.delete('/cart'),
  
  applyCoupon: (code: string) => 
    apiClient.post('/cart/coupon', { code }),
  
  removeCoupon: () => 
    apiClient.delete('/cart/coupon'),
};

// ============================================
// ORDER ENDPOINTS
// ============================================

export const orderApi = {
  getAll: (params?: { page?: number; limit?: number; status?: string }) => 
    apiClient.get('/orders', { params }),
  
  getById: (id: string) => 
    apiClient.get(`/orders/${id}`),
  
  create: (data: {
    shippingAddress: any;
    paymentMethod: string;
    items: any[];
  }) => 
    apiClient.post('/orders', data),
  
  cancel: (id: string) => 
    apiClient.put(`/orders/${id}/cancel`),
  
  track: (id: string) => 
    apiClient.get(`/orders/${id}/track`),
  
  getInvoice: (id: string) => 
    apiClient.get(`/orders/${id}/invoice`, { responseType: 'blob' }),
};

// ============================================
// CATEGORY ENDPOINTS
// ============================================

export const categoryApi = {
  getAll: () => 
    apiClient.get('/categories'),
  
  getById: (id: string) => 
    apiClient.get(`/categories/${id}`),
  
  getProducts: (id: string, params?: any) => 
    apiClient.get(`/categories/${id}/products`, { params }),
};

// ============================================
// USER/DASHBOARD ENDPOINTS
// ============================================

export const userApi = {
  getProfile: () => 
    apiClient.get('/users/profile'),
  
  updateProfile: (data: any) => 
    apiClient.put('/users/profile', data),
  
  changePassword: (currentPassword: string, newPassword: string) => 
    apiClient.put('/users/password', { currentPassword, newPassword }),
  
  getAddresses: () => 
    apiClient.get('/users/addresses'),
  
  addAddress: (data: any) => 
    apiClient.post('/users/addresses', data),
  
  updateAddress: (id: string, data: any) => 
    apiClient.put(`/users/addresses/${id}`, data),
  
  deleteAddress: (id: string) => 
    apiClient.delete(`/users/addresses/${id}`),
  
  setDefaultAddress: (id: string) => 
    apiClient.put(`/users/addresses/${id}/default`),
  
  // ✅ DEPRECATED - Use wishlistApi instead
  getWishlist: () => 
    apiClient.get('/users/wishlist'),
  
  addToWishlist: (productId: string) => 
    apiClient.post('/users/wishlist', { productId }),
  
  removeFromWishlist: (productId: string) => 
    apiClient.delete(`/users/wishlist/${productId}`),
  
  getOrderHistory: () => 
    apiClient.get('/users/orders'),
};

// ============================================
// PAYMENT ENDPOINTS
// ============================================

export const paymentApi = {
  createIntent: (amount: number, orderId: string) => 
    apiClient.post('/payment/create-intent', { amount, orderId }),
  
  verify: (paymentId: string, orderId: string) => 
    apiClient.post('/payment/verify', { paymentId, orderId }),
  
  getStatus: (orderId: string) => 
    apiClient.get(`/payment/status/${orderId}`),
};

// ============================================
// BLOG ENDPOINTS
// ============================================

export const blogApi = {
  getAll: (params?: { page?: number; limit?: number; category?: string }) => 
    apiClient.get('/blog', { params }),
  
  getById: (id: string) => 
    apiClient.get(`/blog/${id}`),
  
  getBySlug: (slug: string) => 
    apiClient.get(`/blog/slug/${slug}`),
  
  getCategories: () => 
    apiClient.get('/blog/categories'),
  
  getFeatured: () => 
    apiClient.get('/blog/featured'),
  
  search: (query: string) => 
    apiClient.get('/blog/search', { params: { q: query } }),
};

// ============================================
// CONTACT/SUPPORT ENDPOINTS
// ============================================

export const supportApi = {
  sendMessage: (data: {
    name: string;
    email: string;
    phone?: string;
    subject: string;
    message: string;
  }) => 
    apiClient.post('/support/contact', data),
  
  subscribe: (email: string) => 
    apiClient.post('/support/newsletter', { email }),
  
  getFAQs: () => 
    apiClient.get('/support/faqs'),
};

// ============================================
// ADMIN ENDPOINTS
// ============================================

export const adminApi = {
  // Products
  createProduct: (data: any) => 
    apiClient.post('/admin/products', data),
  
  updateProduct: (id: string, data: any) => 
    apiClient.put(`/admin/products/${id}`, data),
  
  deleteProduct: (id: string) => 
    apiClient.delete(`/admin/products/${id}`),
  
  // Categories
  createCategory: (data: any) => 
    apiClient.post('/admin/categories', data),
  
  updateCategory: (id: string, data: any) => 
    apiClient.put(`/admin/categories/${id}`, data),
  
  deleteCategory: (id: string) => 
    apiClient.delete(`/admin/categories/${id}`),
  
  // Orders
  getAllOrders: (params?: any) => 
    apiClient.get('/admin/orders', { params }),
  
  updateOrderStatus: (id: string, status: string) => 
    apiClient.put(`/admin/orders/${id}/status`, { status }),
  
  // Users
  getAllUsers: (params?: any) => 
    apiClient.get('/admin/users', { params }),
  
  updateUser: (id: string, data: any) => 
    apiClient.put(`/admin/users/${id}`, data),
  
  deleteUser: (id: string) => 
    apiClient.delete(`/admin/users/${id}`),
  
  // Analytics
  getDashboardStats: () => 
    apiClient.get('/admin/analytics/dashboard'),
  
  getSalesReport: (params?: { startDate?: string; endDate?: string }) => 
    apiClient.get('/admin/analytics/sales', { params }),
};

// ============================================
// FILE UPLOAD
// ============================================

export const uploadApi = {
  uploadImage: (file: File, folder?: string) => {
    const formData = new FormData();
    formData.append('image', file);
    if (folder) formData.append('folder', folder);
    
    return apiClient.post('/upload/image', formData, {
      headers: { 
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  uploadMultiple: (files: File[], folder?: string) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('images', file));
    if (folder) formData.append('folder', folder);
    
    return apiClient.post('/upload/multiple', formData, {
      headers: { 
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

// ============================================
// EXPORT API CLIENT
// ============================================

// Lightweight wrapper to expose friendly methods used by UI
export const api = {
  // cart
  getCart: async () => {
    const res = await cartApi.get();
    return res.data.data;
  },
  addToCart: async (productId: string, quantity = 1) => {
    const res = await cartApi.add(productId, quantity);
    return res.data.data;
  },
  applyCoupon: async (code: string) => {
    const res = await cartApi.applyCoupon(code);
    return res.data.data;
  },
  checkout: async (payload: { paymentMethod: string; shippingAddress: any }) => {
    const res = await apiClient.post('/checkout', payload);
    return res.data.data;
  },
  // orders
  getOrders: async () => {
    const res = await orderApi.getAll();
    return res.data.data;
  },
};

export default apiClient;