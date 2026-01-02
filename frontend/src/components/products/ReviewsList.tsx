'use client';

import { useState, useEffect } from 'react';
import { Star, ThumbsUp, AlertCircle, Loader2, CheckCircle, Edit2, Trash2 } from 'lucide-react';
import { productApi, handleApiError } from '@/lib/api';
import { showSuccessToast, showErrorToast } from '@/store/uiStore';
import useAuthStore from '@/store/authStore';
import ReviewForm from './ReviewForm';

// ============================================
// INTERFACES
// ============================================
interface Review {
  id: string;
  rating: number;
  title?: string;
  comment: string;
  images?: string[];
  isVerifiedPurchase: boolean;
  helpfulCount: number;
  createdAt: string;
  user: {
    id: string;
    fullName: string;
    email: string;
  };
}

interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

interface ReviewsListProps {
  productId: string;
  productName: string;
}

type SortBy = 'recent' | 'helpful' | 'rating_high' | 'rating_low';

// ============================================
// REVIEWS LIST COMPONENT
// ============================================
export default function ReviewsList({ productId, productName }: ReviewsListProps) {
  const { user } = useAuthStore();

  // State
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortBy>('recent');
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  // UI State
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);
  const [markingHelpfulId, setMarkingHelpfulId] = useState<string | null>(null);

  // User's review check
  const [userReview, setUserReview] = useState<Review | null>(null);

  // ============================================
  // FETCH STATS
  // ============================================
  const fetchStats = async () => {
    try {
      const response = await productApi.getReviewStats(productId);
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch review stats:', error);
    }
  };

  // ============================================
  // FETCH REVIEWS
  // ============================================
  const fetchReviews = async (reset = false) => {
    const currentPage = reset ? 1 : page;
    
    if (reset) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const response = await productApi.getReviews(productId, {
        rating: filterRating || undefined,
        sortBy,
        page: currentPage,
        limit: 10,
      });

      if (response.data.success) {
        const data = response.data.data;
        const newReviews = data.reviews || [];
        
        if (reset) {
          setReviews(newReviews);
        } else {
          setReviews([...reviews, ...newReviews]);
        }

        // Check pagination
        const pagination = data.pagination;
        if (pagination) {
          setHasMore(pagination.hasNext || false);
        } else {
          setHasMore(false);
        }

        // Find user's review
        if (user) {
          const userRev = newReviews.find((r: Review) => r.user.id === user.id);
          if (userRev) {
            setUserReview(userRev);
          }
        }
      }
    } catch (error) {
      const message = handleApiError(error);
      showErrorToast(message, 'Failed to load reviews');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  // ============================================
  // INITIAL LOAD
  // ============================================
  useEffect(() => {
    fetchStats();
    fetchReviews(true);
  }, [productId, sortBy, filterRating]);

  // ============================================
  // LOAD MORE
  // ============================================
  const handleLoadMore = () => {
    setPage(page + 1);
    fetchReviews(false);
  };

  // ============================================
  // MARK AS HELPFUL
  // ============================================
  const handleMarkHelpful = async (reviewId: string) => {
    setMarkingHelpfulId(reviewId);
    
    try {
      const response = await productApi.markReviewHelpful(reviewId);
      
      if (response.data.success) {
        // Optimistically update UI
        setReviews(reviews.map(r => 
          r.id === reviewId 
            ? { ...r, helpfulCount: response.data.data.helpfulCount }
            : r
        ));
        showSuccessToast('Marked as helpful', 'Thanks!');
      }
    } catch (error) {
      const message = handleApiError(error);
      showErrorToast(message, 'Failed to mark helpful');
    } finally {
      setMarkingHelpfulId(null);
    }
  };

  // ============================================
  // DELETE REVIEW
  // ============================================
  const handleDelete = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete this review?')) {
      return;
    }

    setDeletingReviewId(reviewId);

    try {
      const response = await productApi.deleteReview(reviewId);
      
      if (response.data.success) {
        // Remove from list
        setReviews(reviews.filter(r => r.id !== reviewId));
        setUserReview(null);
        showSuccessToast('Review deleted', 'Success');
        
        // Refresh stats
        await fetchStats();
      }
    } catch (error) {
      const message = handleApiError(error);
      showErrorToast(message, 'Failed to delete review');
    } finally {
      setDeletingReviewId(null);
    }
  };

  // ============================================
  // HANDLE REVIEW SUCCESS
  // ============================================
  const handleReviewSuccess = async () => {
    setShowReviewForm(false);
    setEditingReview(null);
    
    // Refresh reviews and stats
    await fetchStats();
    await fetchReviews(true);
  };

  // ============================================
  // RENDER RATING BAR
  // ============================================
  const renderRatingBar = (stars: number, count: number, total: number) => {
    const percentage = total > 0 ? (count / total) * 100 : 0;

    return (
      <button
        onClick={() => setFilterRating(filterRating === stars ? null : stars)}
        className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg transition-all ${
          filterRating === stars
            ? 'bg-green-100 border-2 border-green-500'
            : 'hover:bg-gray-50 border-2 border-transparent'
        }`}
      >
        <span className="text-sm font-bold text-gray-700 w-8">{stars} ⭐</span>
        <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className="bg-yellow-400 h-full transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-sm font-bold text-gray-600 w-10 text-right">{count}</span>
      </button>
    );
  };

  // ============================================
  // RENDER
  // ============================================
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Section */}
      {stats && (
        <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-lg">
          <h2 className="text-2xl font-black text-gray-900 mb-6">Customer Reviews</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Overall Rating */}
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-5xl font-black text-gray-900">
                  {stats.averageRating.toFixed(1)}
                </div>
                <div className="flex items-center justify-center gap-1 mt-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-5 h-5 ${
                        star <= Math.round(stats.averageRating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-sm text-gray-600 font-semibold mt-1">
                  {stats.totalReviews} {stats.totalReviews === 1 ? 'review' : 'reviews'}
                </p>
              </div>
            </div>

            {/* Rating Distribution */}
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((stars) =>
                renderRatingBar(
                  stars,
                  stats.ratingDistribution[stars as keyof typeof stats.ratingDistribution],
                  stats.totalReviews
                )
              )}
            </div>
          </div>

          {/* Write Review Button */}
          {user && !userReview && !showReviewForm && (
            <button
              onClick={() => setShowReviewForm(true)}
              className="mt-6 w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-xl transition-all"
            >
              Write a Review
            </button>
          )}

          {/* User's Review Indicator */}
          {userReview && !showReviewForm && (
            <div className="mt-6 p-4 bg-green-50 border-2 border-green-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-bold text-green-900">You reviewed this product</span>
              </div>
              <button
                onClick={() => setEditingReview(userReview)}
                className="px-4 py-2 bg-white hover:bg-gray-50 text-green-700 font-bold rounded-lg transition-all border-2 border-green-200"
              >
                Edit Review
              </button>
            </div>
          )}
        </div>
      )}

      {/* Review Form */}
      {(showReviewForm || editingReview) && (
        <ReviewForm
          productId={productId}
          productName={productName}
          existingReview={editingReview || undefined}
          onSuccess={handleReviewSuccess}
          onCancel={() => {
            setShowReviewForm(false);
            setEditingReview(null);
          }}
        />
      )}

      {/* Filters and Sort */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-gray-700">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="px-4 py-2 border-2 border-gray-200 rounded-lg font-semibold focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none transition-all"
          >
            <option value="recent">Most Recent</option>
            <option value="helpful">Most Helpful</option>
            <option value="rating_high">Highest Rating</option>
            <option value="rating_low">Lowest Rating</option>
          </select>
        </div>

        {filterRating && (
          <button
            onClick={() => setFilterRating(null)}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg transition-all"
          >
            Clear Filter
          </button>
        )}
      </div>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-gray-200 p-12 text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Reviews Yet</h3>
          <p className="text-gray-600 font-semibold">
            {filterRating
              ? `No ${filterRating}-star reviews found`
              : 'Be the first to review this product!'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-lg hover:shadow-xl transition-shadow"
            >
              {/* Review Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-gray-900">{review.user.fullName}</span>
                    {review.isVerifiedPurchase && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded">
                        Verified Purchase
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= review.rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600 font-semibold">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Actions for own review */}
                {user && user.id === review.user.id && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditingReview(review)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Edit review"
                    >
                      <Edit2 className="w-4 h-4 text-gray-600" />
                    </button>
                    <button
                      onClick={() => handleDelete(review.id)}
                      disabled={deletingReviewId === review.id}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Delete review"
                    >
                      {deletingReviewId === review.id ? (
                        <Loader2 className="w-4 h-4 text-red-600 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4 text-red-600" />
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Review Title */}
              {review.title && (
                <h4 className="font-bold text-gray-900 text-lg mb-2">{review.title}</h4>
              )}

              {/* Review Comment */}
              <p className="text-gray-700 leading-relaxed mb-4">{review.comment}</p>

              {/* Review Images */}
              {review.images && review.images.length > 0 && (
                <div className="flex gap-2 mb-4">
                  {review.images.map((img, idx) => (
                    <div
                      key={idx}
                      className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-2xl border-2 border-gray-200"
                    >
                      {img}
                    </div>
                  ))}
                </div>
              )}

              {/* Helpful Button */}
              <button
                onClick={() => handleMarkHelpful(review.id)}
                disabled={markingHelpfulId === review.id}
                className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-all disabled:opacity-50"
              >
                {markingHelpfulId === review.id ? (
                  <Loader2 className="w-4 h-4 animate-spin text-gray-600" />
                ) : (
                  <ThumbsUp className="w-4 h-4 text-gray-600" />
                )}
                <span className="text-sm font-semibold text-gray-700">
                  Helpful ({review.helpfulCount})
                </span>
              </button>
            </div>
          ))}

          {/* Load More */}
          {hasMore && (
            <button
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              className="w-full px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoadingMore ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Loading...
                </>
              ) : (
                'Load More Reviews'
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}