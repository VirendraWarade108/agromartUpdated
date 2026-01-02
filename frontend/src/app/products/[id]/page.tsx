'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  ShoppingCart,
  Heart,
  Star,
  Truck,
  Shield,
  Package,
  ChevronLeft,
  Plus,
  Minus,
  Check,
  AlertCircle,
} from 'lucide-react';
import { productApi, handleApiError, cartApi, userApi } from '@/lib/api';
import { showSuccessToast, showErrorToast } from '@/store/uiStore';
import { PageLoader } from '@/components/shared/LoadingSpinner';
import { formatPrice } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  originalPrice?: number;
  rating?: number;
  reviewCount?: number;
  image?: string;
  images?: string[];
  stock: number;
  category?: {
    id: string;
    name: string;
  };
  vendor?: {
    businessName: string;
  };
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ProductDetailPage({ params }: PageProps) {
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [isTogglingWishlist, setIsTogglingWishlist] = useState(false);

  // Unwrap params
  const [productId, setProductId] = useState<string>('');

  useEffect(() => {
    params.then((p) => setProductId(p.id));
  }, [params]);

  // Fetch product
  useEffect(() => {
    if (!productId) return;
    fetchProduct();
  }, [productId]);

  const fetchProduct = async () => {
    setIsLoading(true);
    try {
      const response = await productApi.getById(productId);

      if (response.data.success) {
        setProduct(response.data.data);
      }
    } catch (error) {
      const message = handleApiError(error);
      showErrorToast(message, 'Failed to load product');
      router.push('/products');
    } finally {
      setIsLoading(false);
    }
  };

  // Add to cart
  const handleAddToCart = async () => {
    if (!product) return;

    setIsAddingToCart(true);
    try {
      await cartApi.add(product.id, quantity);
      showSuccessToast('Product added to cart', 'Success');
    } catch (error) {
      const message = handleApiError(error);
      showErrorToast(message, 'Failed to add to cart');
    } finally {
      setIsAddingToCart(false);
    }
  };

  // Toggle wishlist
  const handleToggleWishlist = async () => {
    if (!product) return;

    setIsTogglingWishlist(true);
    try {
      if (isInWishlist) {
        await userApi.removeFromWishlist(product.id);
        setIsInWishlist(false);
        showSuccessToast('Removed from wishlist', 'Success');
      } else {
        await userApi.addToWishlist(product.id);
        setIsInWishlist(true);
        showSuccessToast('Added to wishlist', 'Success');
      }
    } catch (error) {
      const message = handleApiError(error);
      showErrorToast(message, 'Action failed');
    } finally {
      setIsTogglingWishlist(false);
    }
  };

  if (isLoading) {
    return <PageLoader message="Loading product details..." />;
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h2>
          <p className="text-gray-600 mb-6">The product you're looking for doesn't exist.</p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  const images = product.images || (product.image ? [product.image] : ['/images/placeholder.jpg']);
  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50">
      {/* Back Button */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Link
          href="/products"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-green-600 font-semibold transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          Back to Products
        </Link>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative bg-white rounded-2xl border-2 border-gray-200 overflow-hidden aspect-square"
            >
              <Image
                src={images[selectedImage]}
                alt={product.name}
                fill
                className="object-cover"
                priority
              />
              {discount > 0 && (
                <div className="absolute top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg">
                  {discount}% OFF
                </div>
              )}
              {product.stock === 0 && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">Out of Stock</span>
                </div>
              )}
            </motion.div>

            {/* Thumbnail Images */}
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                      selectedImage === idx
                        ? 'border-green-500 ring-4 ring-green-100'
                        : 'border-gray-200 hover:border-green-300'
                    }`}
                  >
                    <Image src={img} alt={`${product.name} ${idx + 1}`} fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Category */}
            {product.category && (
              <Link
                href={`/products?category=${product.category.id}`}
                className="inline-block px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-bold hover:bg-green-200 transition-colors"
              >
                {product.category.name}
              </Link>
            )}

            {/* Title */}
            <h1 className="text-4xl font-black text-gray-900">{product.name}</h1>

            {/* Rating */}
            {product.rating && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.floor(product.rating!)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-gray-600 font-semibold">
                  {product.rating} ({product.reviewCount || 0} reviews)
                </span>
              </div>
            )}

            {/* Price */}
            <div className="space-y-2">
              <div className="flex items-baseline gap-4">
                <span className="text-4xl font-black text-green-600">
                  {formatPrice(product.price)}
                </span>
                {product.originalPrice && (
                  <span className="text-2xl font-bold text-gray-400 line-through">
                    {formatPrice(product.originalPrice)}
                  </span>
                )}
              </div>
              {product.vendor && (
                <p className="text-sm text-gray-600 font-semibold">
                  Sold by: <span className="text-gray-900">{product.vendor.businessName}</span>
                </p>
              )}
            </div>

            {/* Stock Status */}
            <div className="flex items-center gap-2">
              {product.stock > 0 ? (
                <>
                  <Check className="w-5 h-5 text-green-600" />
                  <span className="text-green-600 font-bold">
                    In Stock ({product.stock} available)
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <span className="text-red-600 font-bold">Out of Stock</span>
                </>
              )}
            </div>

            {/* Quantity Selector */}
            {product.stock > 0 && (
              <div className="flex items-center gap-4">
                <span className="text-gray-700 font-bold">Quantity:</span>
                <div className="flex items-center gap-3 bg-gray-100 rounded-xl p-2">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="w-10 h-10 flex items-center justify-center bg-white rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <span className="w-12 text-center font-bold text-lg">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    disabled={quantity >= product.stock}
                    className="w-10 h-10 flex items-center justify-center bg-white rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0 || isAddingToCart}
                className="flex-1 flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-xl transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingCart className="w-5 h-5" />
                {isAddingToCart ? 'Adding...' : 'Add to Cart'}
              </button>
              <button
                onClick={handleToggleWishlist}
                disabled={isTogglingWishlist}
                className={`p-4 rounded-xl border-2 transition-all ${
                  isInWishlist
                    ? 'bg-red-50 border-red-500 text-red-600'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-red-500 hover:text-red-600'
                }`}
              >
                <Heart className={`w-6 h-6 ${isInWishlist ? 'fill-current' : ''}`} />
              </button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t-2 border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Truck className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">Free Delivery</p>
                  <p className="text-xs text-gray-600">On orders above ₹500</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Shield className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">Secure Payment</p>
                  <p className="text-xs text-gray-600">100% safe checkout</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Package className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">Quality Product</p>
                  <p className="text-xs text-gray-600">Genuine & verified</p>
                </div>
              </div>
            </div>

            {/* Description */}
            {product.description && (
              <div className="pt-6 border-t-2 border-gray-200">
                <h2 className="text-2xl font-black text-gray-900 mb-4">Description</h2>
                <p className="text-gray-700 leading-relaxed">{product.description}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}