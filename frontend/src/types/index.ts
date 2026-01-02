// ============================================
// USER TYPES
// ============================================

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  avatar?: string;
  role: 'user' | 'admin';
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile extends User {
  addresses: Address[];
  wishlist: string[];
  orderHistory: Order[];
  rewardPoints: number;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// ============================================
// PRODUCT TYPES
// ============================================

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  category: string;
  subCategory?: string;
  images: string[];
  thumbnail: string;
  inStock: boolean;
  stockCount: number;
  rating: number;
  reviewCount: number;
  tags: string[];
  brand?: string;
  sku?: string;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  features: string[];
  specifications: Record<string, string>;
  isFeatured: boolean;
  isNew: boolean;
  isBestSeller: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductReview {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  images?: string[];
  isVerified: boolean;
  helpful: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  rating?: number;
  tags?: string[];
  sortBy?: 'popular' | 'price-low' | 'price-high' | 'rating' | 'newest';
  page?: number;
  limit?: number;
}

// ============================================
// CATEGORY TYPES
// ============================================

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  icon?: string;
  parentId?: string;
  productCount: number;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// CART TYPES
// ============================================

export interface CartItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  couponCode?: string;
  shipping: number;
  tax: number;
  total: number;
  createdAt: string;
  updatedAt: string;
}

export interface Coupon {
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minOrderValue?: number;
  maxDiscount?: number;
  validFrom: string;
  validUntil: string;
  usageLimit?: number;
  usedCount: number;
  isActive: boolean;
}

// ============================================
// ORDER TYPES
// ============================================

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  shippingAddress: Address;
  billingAddress?: Address;
  trackingNumber?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  deliveredAt?: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export type OrderStatus = 
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export type PaymentMethod = 
  | 'card'
  | 'upi'
  | 'netbanking'
  | 'wallet'
  | 'cod';

export type PaymentStatus = 
  | 'pending'
  | 'completed'
  | 'failed'
  | 'refunded';

export interface OrderTracking {
  orderId: string;
  status: OrderStatus;
  timeline: OrderTrackingEvent[];
  estimatedDelivery?: string;
  trackingUrl?: string;
}

export interface OrderTrackingEvent {
  status: OrderStatus;
  message: string;
  location?: string;
  timestamp: string;
}

// ============================================
// ADDRESS TYPES
// ============================================

export interface Address {
  id: string;
  userId?: string;
  type: 'home' | 'office' | 'other';
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// PAYMENT TYPES
// ============================================

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  orderId: string;
  clientSecret: string;
  status: PaymentStatus;
}

export interface PaymentDetails {
  method: PaymentMethod;
  transactionId?: string;
  cardLast4?: string;
  upiId?: string;
  bankName?: string;
}

// ============================================
// BLOG TYPES
// ============================================

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  category: string;
  tags: string[];
  featuredImage: string;
  readTime: number;
  views: number;
  likes: number;
  comments: number;
  isPublished: boolean;
  isFeatured: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BlogComment {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  parentId?: string;
  replies?: BlogComment[];
  createdAt: string;
  updatedAt: string;
}

// ============================================
// WISHLIST TYPES
// ============================================

export interface WishlistItem {
  id: string;
  userId: string;
  productId: string;
  product: Product;
  addedAt: string;
}

// ============================================
// NOTIFICATION TYPES
// ============================================

export interface Notification {
  id: string;
  userId: string;
  type: 'order' | 'payment' | 'product' | 'promotional' | 'system';
  title: string;
  message: string;
  icon?: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

// ============================================
// ANALYTICS TYPES
// ============================================

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  revenueGrowth: number;
  ordersGrowth: number;
  customersGrowth: number;
  productsGrowth: number;
}

export interface SalesReport {
  date: string;
  revenue: number;
  orders: number;
  customers: number;
}

// ============================================
// RESPONSE TYPES
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ApiError {
  success: false;
  error: string;
  message: string;
  statusCode: number;
}

// ============================================
// FORM TYPES
// ============================================

export interface LoginFormData {
  email: string;
  password: string;
  remember?: boolean;
}

export interface RegisterFormData {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  agree: boolean;
}

export interface CheckoutFormData {
  shippingAddress: Address;
  billingAddress?: Address;
  paymentMethod: PaymentMethod;
  notes?: string;
}

export interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

// ============================================
// UI STATE TYPES
// ============================================

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number;
}

export interface ModalState {
  isOpen: boolean;
  type?: 'cart' | 'auth' | 'address' | 'product' | 'filter';
  data?: any;
}

export interface LoadingState {
  isLoading: boolean;
  message?: string;
}

// ============================================
// SEARCH TYPES
// ============================================

export interface SearchResult {
  products: Product[];
  categories: Category[];
  totalResults: number;
  suggestions: string[];
}

export interface SearchFilters {
  query: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  rating?: number;
  sortBy?: string;
}

// ============================================
// SETTINGS TYPES
// ============================================

export interface UserSettings {
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
    orderUpdates: boolean;
    promotions: boolean;
    newsletter: boolean;
  };
  privacy: {
    showProfile: boolean;
    showOrders: boolean;
  };
  preferences: {
    language: string;
    currency: string;
    theme: 'light' | 'dark' | 'auto';
  };
}

// ============================================
// SOCIAL TYPES
// ============================================

export interface SocialLink {
  platform: 'facebook' | 'twitter' | 'instagram' | 'linkedin' | 'youtube';
  url: string;
  icon: string;
}

// ============================================
// FAQ TYPES
// ============================================

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
  isPublished: boolean;
}

// ============================================
// NEWSLETTER TYPES
// ============================================

export interface NewsletterSubscription {
  id: string;
  email: string;
  isActive: boolean;
  subscribedAt: string;
}