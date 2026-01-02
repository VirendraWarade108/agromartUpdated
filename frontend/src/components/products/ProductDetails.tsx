'use client';

import { useState, useEffect } from 'react';
import { X, Star, Heart, Share2, Truck, Shield, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { showErrorToast, showSuccessToast } from '@/store/uiStore';
import { wishlistApi, handleApiError } from '@/lib/api';
import useAuthStore from '@/store/authStore';

interface Review {
  id: string;
  author: string;
  rating: number;
  title: string;
  comment: string;
  date: string;
  verified: boolean;
}

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  rating: number;
  reviews: number;
  image: string;
  images: string[];
  description: string;
  stock: number;
  category: string;
  specifications?: {
    [key: string]: string;
  };
  seller?: string;
  reviewsList?: Review[];
}

interface ProductDetailsProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart?: (productId: string, quantity: number) => void;
}

export function ProductDetails({
  product,
  isOpen,
  onClose,
  onAddToCart,
}: ProductDetailsProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(product.image);
  const [expandedSection, setExpandedSection] = useState<'specs' | 'reviews' | null>(null);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isAddingToWishlist, setIsAddingToWishlist] = useState(false);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuthStore();

  // Check if product is in wishlist on mount
  useEffect(() => {
    const checkWishlistStatus = async () => {
      if (!isAuthenticated) return;
      
      try {
        const response = await wishlistApi.check(product.id);
        setIsInWishlist(response.data?.data?.inWishlist || false);
      } catch (error) {
        // Silently fail - not critical
        console.error('Failed to check wishlist status:', error);
      }
    };

    if (isOpen) {
      checkWishlistStatus();
    }
  }, [product.id, isOpen, isAuthenticated]);

  if (!isOpen) return null;

  const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);

  const handleAddToCart = async () => {
    if (quantity < 1 || quantity > product.stock) {
      showErrorToast('Invalid quantity', 'Please select a valid quantity');
      return;
    }

    setIsAddingToCart(true);
    try {
      const success = await addToCart({
        productId: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity,
        inStock: product.stock > 0,
        category: product.category,
      });

      if (success) {
        showSuccessToast(`${product.name} added to cart`);
        onClose();
      } else {
        showErrorToast('Failed to add to cart', 'Item could not be added');
      }
    } catch (error) {
      showErrorToast('Error', 'Failed to add to cart');
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleToggleWishlist = async () => {
    // Check authentication
    if (!isAuthenticated) {
      showErrorToast('Login Required', 'Please login to add items to wishlist');
      return;
    }

    setIsAddingToWishlist(true);
    try {
      if (isInWishlist) {
        // Remove from wishlist
        await wishlistApi.remove(product.id);
        setIsInWishlist(false);
        showSuccessToast('Removed from wishlist');
      } else {
        // Add to wishlist
        await wishlistApi.add(product.id);
        setIsInWishlist(true);
        showSuccessToast('Added to wishlist');
      }
    } catch (error) {
      const errorMessage = handleApiError(error);
      showErrorToast('Error', errorMessage);
    } finally {
      setIsAddingToWishlist(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: `Check out ${product.name} on AgroMart`,
          url: window.location.href,
        });
      } catch (error) {
        showErrorToast('Error', 'Failed to share');
      }
    } else {
      // Fallback - copy to clipboard
      await navigator.clipboard.writeText(window.location.href);
      showSuccessToast('Link copied to clipboard');
    }
  };

  const defaultReviews: Review[] = [
    {
      id: '1',
      author: 'Farmer John',
      rating: 5,
      title: 'Excellent Quality',
      comment: 'Best seeds I have used. High germination rate and healthy plants.',
      date: '2 weeks ago',
      verified: true,
    },
    {
      id: '2',
      author: 'Agriculture Expert',
      rating: 4,
      title: 'Good Value for Money',
      comment: 'Great quality at reasonable price. Delivery was quick.',
      date: '1 month ago',
      verified: true,
    },
    {
      id: '3',
      author: 'Ram Kumar',
      rating: 5,
      title: 'Highly Recommended',
      comment: 'Very satisfied with the product. Will order again.',
      date: '1.5 months ago',
      verified: true,
    },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4 py-8">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">{product.name}</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Close"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="grid md:grid-cols-2 gap-8">
                {/* Images */}
                <div>
                  <div className="mb-4 rounded-xl overflow-hidden bg-gray-100 aspect-square flex items-center justify-center">
                    <img
                      src={selectedImage}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Thumbnail Gallery */}
                  <div className="flex gap-2 overflow-x-auto">
                    {[product.image, ...(product.images || [])].map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedImage(img)}
                        className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                          selectedImage === img ? 'border-green-500' : 'border-gray-200'
                        }`}
                      >
                        <img src={img} alt={`${product.name} ${idx}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-6">
                  {/* Price & Rating */}
                  <div>
                    <div className="flex items-baseline gap-3 mb-3">
                      <span className="text-3xl font-bold text-gray-900">₹{product.price}</span>
                      <span className="text-lg text-gray-500 line-through">₹{product.originalPrice}</span>
                      {discount > 0 && (
                        <span className="px-3 py-1 bg-red-100 text-red-700 font-bold rounded-lg text-sm">
                          -{discount}%
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < Math.floor(product.rating)
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600">
                        {product.rating} ({product.reviews} reviews)
                      </span>
                    </div>
                  </div>

                  {/* Stock Status */}
                  <div>
                    {product.stock > 0 ? (
                      <p className="text-sm font-semibold text-green-600">✓ In Stock ({product.stock} available)</p>
                    ) : (
                      <p className="text-sm font-semibold text-red-600">Out of Stock</p>
                    )}
                  </div>

                  {/* Quantity Selector */}
                  {product.stock > 0 && (
                    <div className="flex items-center gap-4">
                      <label className="text-sm font-semibold text-gray-700">Quantity:</label>
                      <div className="flex items-center border-2 border-gray-200 rounded-lg">
                        <button
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          className="px-3 py-2 text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                          −
                        </button>
                        <input
                          type="number"
                          value={quantity}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 1;
                            setQuantity(Math.min(product.stock, Math.max(1, val)));
                          }}
                          className="w-16 text-center border-0 outline-none"
                          min="1"
                          max={product.stock}
                        />
                        <button
                          onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                          className="px-3 py-2 text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={handleAddToCart}
                      disabled={isAddingToCart || product.stock === 0}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isAddingToCart ? 'Adding...' : 'Add to Cart'}
                    </button>
                    <button
                      onClick={handleToggleWishlist}
                      disabled={isAddingToWishlist}
                      className={`p-3 border-2 rounded-xl transition-colors disabled:opacity-50 ${
                        isInWishlist
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                      aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                      title={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                    >
                      <Heart 
                        className={`w-6 h-6 ${
                          isInWishlist 
                            ? 'fill-red-500 text-red-500' 
                            : 'text-gray-600'
                        }`} 
                      />
                    </button>
                    <button
                      onClick={handleShare}
                      className="p-3 border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                      aria-label="Share product"
                    >
                      <Share2 className="w-6 h-6 text-gray-600" />
                    </button>
                  </div>

                  {/* Features */}
                  <div className="space-y-2 pt-4">
                    <div className="flex items-center gap-3 text-sm text-gray-700">
                      <Truck className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <span>Free shipping on orders above ₹5000</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-700">
                      <Shield className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <span>Quality guaranteed by AgroMart</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-700">
                      <RotateCcw className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <span>14-day money back guarantee</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              {product.description && (
                <div className="mt-8 pt-8 border-t border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Product Description</h3>
                  <p className="text-gray-700 leading-relaxed">{product.description}</p>
                </div>
              )}

              {/* Specifications */}
              {product.specifications && Object.keys(product.specifications).length > 0 && (
                <div className="mt-8 pt-8 border-t border-gray-200">
                  <button
                    onClick={() => setExpandedSection(expandedSection === 'specs' ? null : 'specs')}
                    className="flex items-center justify-between w-full"
                  >
                    <h3 className="text-lg font-bold text-gray-900">Specifications</h3>
                    {expandedSection === 'specs' ? (
                      <ChevronUp className="w-5 h-5 text-gray-600" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-600" />
                    )}
                  </button>

                  {expandedSection === 'specs' && (
                    <div className="mt-4 space-y-3">
                      {Object.entries(product.specifications).map(([key, value]) => (
                        <div key={key} className="flex justify-between py-2 border-b border-gray-100">
                          <span className="text-gray-600 font-medium">{key}</span>
                          <span className="text-gray-900 font-semibold">{value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Reviews */}
              {(product.reviewsList || defaultReviews).length > 0 && (
                <div className="mt-8 pt-8 border-t border-gray-200">
                  <button
                    onClick={() => setExpandedSection(expandedSection === 'reviews' ? null : 'reviews')}
                    className="flex items-center justify-between w-full mb-4"
                  >
                    <h3 className="text-lg font-bold text-gray-900">
                      Customer Reviews ({(product.reviewsList || defaultReviews).length})
                    </h3>
                    {expandedSection === 'reviews' ? (
                      <ChevronUp className="w-5 h-5 text-gray-600" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-600" />
                    )}
                  </button>

                  {expandedSection === 'reviews' && (
                    <div className="space-y-4">
                      {(product.reviewsList || defaultReviews).map((review) => (
                        <div key={review.id} className="p-4 bg-gray-50 rounded-xl">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-semibold text-gray-900">{review.title}</p>
                              <p className="text-sm text-gray-600">{review.author}</p>
                            </div>
                            {review.verified && (
                              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded">
                                Verified
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 mb-2">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < review.rating
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                            <span className="text-xs text-gray-600">{review.date}</span>
                          </div>

                          <p className="text-gray-700 text-sm">{review.comment}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}