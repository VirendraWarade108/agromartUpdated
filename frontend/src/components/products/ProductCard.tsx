import React, { useState } from 'react';
import Link from 'next/link';
import { ShoppingCart, Heart, Star, Eye, TrendingUp, Zap } from 'lucide-react';
import { Product } from '@/hooks/useProducts';
import { formatPrice, calculateDiscount } from '@/lib/utils';
import useCart from '@/hooks/useCart';
import { showSuccessToast, showWarningToast } from '@/store/uiStore';

export interface ProductCardProps {
  product: Product;
  variant?: 'default' | 'compact' | 'featured' | 'list';
  showQuickView?: boolean;
  onQuickView?: (product: Product) => void;
  onAddToWishlist?: (productId: string) => void;
  className?: string;
}

/**
 * ProductCard Component
 * Displays product information with add to cart and wishlist functionality
 */
export default function ProductCard({
  product,
  variant = 'default',
  showQuickView = false,
  onQuickView,
  onAddToWishlist,
  className = '',
}: ProductCardProps) {
  const { addToCart, isInCart } = useCart();
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isAddingToWishlist, setIsAddingToWishlist] = useState(false);

  /**
   * Handle add to cart with debounce
   */
  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!product.inStock) {
      showWarningToast('This product is currently out of stock');
      return;
    }

    if (isInCart(product.id)) {
      showWarningToast('Product is already in your cart');
      return;
    }

    // Prevent double-click
    if (isAddingToCart) {
      return;
    }

    setIsAddingToCart(true);

    const success = await addToCart({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: 1,
      inStock: product.inStock,
      category: product.category,
    });

    setIsAddingToCart(false);

    if (success) {
      showSuccessToast(`${product.name} added to cart`);
    }
  };

  /**
   * Handle wishlist toggle
   */
  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Prevent double-click
    if (isAddingToWishlist) {
      return;
    }

    setIsAddingToWishlist(true);
    const wasWishlisted = isWishlisted;
    
    try {
      setIsWishlisted(!isWishlisted);
      
      if (onAddToWishlist) {
        await onAddToWishlist(product.id);
      }

      showSuccessToast(
        !wasWishlisted ? 'Added to wishlist' : 'Removed from wishlist'
      );
    } catch (error) {
      // Revert on error
      setIsWishlisted(wasWishlisted);
      showWarningToast('Failed to update wishlist');
    } finally {
      setIsAddingToWishlist(false);
    }
  };

  /**
   * Handle quick view
   */
  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (onQuickView) {
      onQuickView(product);
    }
  };

  // Calculate discount percentage if applicable
  const discountPercentage = product.originalPrice
    ? calculateDiscount(product.originalPrice, product.price)
    : product.discount || 0;

  // List variant (horizontal layout)
  if (variant === 'list') {
    return (
      <Link
        href={`/products/${product.id}`}
        className={`flex gap-6 bg-white rounded-2xl border-2 border-gray-200 hover:border-green-400 shadow-lg hover:shadow-2xl transition-all p-6 ${className}`}
      >
        {/* Image */}
        <div className="w-32 h-32 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
          <div className="text-7xl">{product.image}</div>
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          {/* Badge */}
          {product.badge && (
            <span className="inline-block px-3 py-1 bg-green-500/20 text-green-700 text-xs font-bold rounded-lg mb-2">
              {product.badge}
            </span>
          )}

          {/* Title */}
          <h3 className="text-xl font-bold text-gray-900 mb-2 hover:text-green-600 transition-colors">
            {product.name}
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg">
              <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
              <span className="text-sm font-black text-gray-900">{product.rating}</span>
            </div>
            <span className="text-sm text-gray-600 font-bold">({product.reviews} reviews)</span>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-3xl font-black text-green-600">
              {formatPrice(product.price)}
            </span>
            {product.originalPrice && (
              <span className="text-base text-gray-400 line-through font-bold">
                {formatPrice(product.originalPrice)}
              </span>
            )}
            {discountPercentage > 0 && (
              <span className="px-2 py-1 bg-red-100 text-red-600 text-xs font-bold rounded">
                -{discountPercentage}%
              </span>
            )}
          </div>

          {/* Stock & Sales */}
          <div className="flex items-center gap-4 mb-4">
            {product.inStock ? (
              <span className="text-sm text-green-600 font-bold">✓ In Stock</span>
            ) : (
              <span className="text-sm text-red-600 font-bold">⚠️ Out of Stock</span>
            )}
            {product.sales && (
              <span className="text-sm text-gray-600 font-semibold flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                {product.sales}+ sold
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleAddToCart}
              disabled={!product.inStock || isAddingToCart}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold rounded-xl transition-all disabled:cursor-not-allowed flex items-center gap-2"
            >
              <ShoppingCart className="w-5 h-5" />
              {isAddingToCart ? 'Adding...' : 'Add to Cart'}
            </button>
            <button
              onClick={handleWishlist}
              disabled={isAddingToWishlist}
              className="p-3 border-2 border-gray-200 hover:border-pink-400 hover:bg-pink-50 rounded-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
              title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-pink-500 text-pink-500' : 'text-gray-600'}`} />
            </button>
          </div>
        </div>
      </Link>
    );
  }

  // Grid variants (vertical layout)
  return (
    <Link
      href={`/products/${product.id}`}
      className={`relative group bg-white rounded-2xl border-2 border-gray-200 hover:border-green-400 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden ${className}`}
    >
      {/* Badges */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        {product.badge && (
          <span className="px-3 py-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-xs font-black rounded-lg shadow-lg">
            {product.badge}
          </span>
        )}
        {discountPercentage > 0 && (
          <span className="px-3 py-1 bg-red-600 text-white text-sm font-black rounded-lg shadow-lg">
            -{discountPercentage}%
          </span>
        )}
      </div>

      {/* Quick Actions */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        {/* Wishlist */}
        <button
          onClick={handleWishlist}
          disabled={isAddingToWishlist}
          className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-pink-50 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-60 disabled:cursor-not-allowed"
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-pink-500 text-pink-500' : 'text-gray-600'}`} />
        </button>

        {/* Quick View */}
        {showQuickView && onQuickView && (
          <button
            onClick={handleQuickView}
            className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-blue-50 transition-all opacity-0 group-hover:opacity-100"
            aria-label="Quick view product"
            title="Quick view"
          >
            <Eye className="w-5 h-5 text-gray-600" />
          </button>
        )}
      </div>

      {/* Product Image */}
      <div className={`bg-gradient-to-br from-green-50 to-emerald-50 ${variant === 'compact' ? 'p-6 h-40' : 'p-8 h-56'} flex items-center justify-center group-hover:scale-105 transition-transform`}>
        <div className={`${variant === 'compact' ? 'text-7xl' : 'text-8xl'} drop-shadow-lg`}>
          {product.image}
        </div>
      </div>

      {/* Product Info */}
      <div className={`${variant === 'compact' ? 'p-4' : 'p-6'} bg-white`}>
        {/* Rating */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-1 bg-yellow-50 px-3 py-1 rounded-lg border border-yellow-200">
            <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
            <span className="text-sm font-black text-gray-900">{product.rating}</span>
          </div>
          <span className="text-sm text-gray-600 font-bold">({product.reviews})</span>
        </div>

        {/* Title */}
        <h3 className={`${variant === 'compact' ? 'text-base' : 'text-lg'} font-bold text-gray-900 mb-3 group-hover:text-green-600 transition-colors line-clamp-2 min-h-[3rem]`}>
          {product.name}
        </h3>

        {/* Price */}
        <div className="flex items-baseline gap-2 mb-4">
          <span className={`${variant === 'compact' ? 'text-2xl' : 'text-3xl'} font-black text-green-600`}>
            {formatPrice(product.price)}
          </span>
          {product.originalPrice && (
            <span className="text-base text-gray-400 line-through font-bold">
              {formatPrice(product.originalPrice)}
            </span>
          )}
        </div>

        {/* Stock Status */}
        {product.inStock ? (
          <p className="text-sm text-green-600 font-black mb-4 bg-green-50 px-3 py-2 rounded-lg border border-green-200">
            ✓ In Stock
          </p>
        ) : (
          <p className="text-sm text-red-600 font-black mb-4 bg-red-50 px-3 py-2 rounded-lg border border-red-200">
            ⚠️ Out of Stock
          </p>
        )}

        {/* Add to Cart Button */}
        <button
          onClick={handleAddToCart}
          disabled={!product.inStock || isAddingToCart}
          className={`w-full ${variant === 'compact' ? 'py-2.5' : 'py-3'} bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold rounded-xl transition-all group-hover:scale-105 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-2`}
        >
          {isAddingToCart ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Adding...</span>
            </>
          ) : (
            <>
              <ShoppingCart className="w-5 h-5" />
              <span>Add to Cart</span>
            </>
          )}
        </button>

        {/* Sales Badge */}
        {product.sales && variant !== 'compact' && (
          <div className="mt-4 pt-4 border-t-2 border-gray-100">
            <p className="text-sm text-gray-600 font-bold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              {product.sales}+ sold this month
            </p>
          </div>
        )}
      </div>

      {/* Hover Overlay Effect */}
      <div className="absolute inset-0 bg-gradient-to-t from-green-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
    </Link>
  );
}

/**
 * Featured Product Card - Larger with special styling
 */
export function FeaturedProductCard({ product }: { product: Product }) {
  return (
    <ProductCard
      product={product}
      variant="featured"
      showQuickView
      className="transform hover:scale-105"
    />
  );
}

/**
 * Compact Product Card - Smaller for grids
 */
export function CompactProductCard({ product }: { product: Product }) {
  return <ProductCard product={product} variant="compact" />;
}