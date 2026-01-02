'use client';

import { useState } from 'react';
import { Star, X, Upload, Loader2 } from 'lucide-react';
import { productApi, handleApiError } from '@/lib/api';
import { showSuccessToast, showErrorToast } from '@/store/uiStore';

// ============================================
// INTERFACES
// ============================================
interface ReviewFormProps {
  productId: string;
  productName: string;
  existingReview?: {
    id: string;
    rating: number;
    title?: string;
    comment: string;
    images?: string[];
  };
  onSuccess?: () => void;
  onCancel?: () => void;
}

// ============================================
// REVIEW FORM COMPONENT
// ============================================
export default function ReviewForm({
  productId,
  productName,
  existingReview,
  onSuccess,
  onCancel,
}: ReviewFormProps) {
  const isEditing = !!existingReview;

  // Form state
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState(existingReview?.title || '');
  const [comment, setComment] = useState(existingReview?.comment || '');
  const [images, setImages] = useState<string[]>(existingReview?.images || []);
  
  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{
    rating?: string;
    comment?: string;
  }>({});

  // ============================================
  // VALIDATION
  // ============================================
  const validate = (): boolean => {
    const newErrors: typeof errors = {};

    if (rating === 0) {
      newErrors.rating = 'Please select a rating';
    }

    if (!comment.trim()) {
      newErrors.comment = 'Please write a comment';
    } else if (comment.trim().length < 10) {
      newErrors.comment = 'Comment must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ============================================
  // HANDLE SUBMIT
  // ============================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditing && existingReview) {
        // Update existing review
        const response = await productApi.updateReview(existingReview.id, {
          rating,
          title: title.trim() || undefined,
          comment: comment.trim(),
          images: images.length > 0 ? images : undefined,
        });

        if (response.data.success) {
          showSuccessToast('Review updated successfully', 'Success');
          onSuccess?.();
        } else {
          throw new Error(response.data.error?.message || 'Failed to update review');
        }
      } else {
        // Create new review
        const response = await productApi.createReview(productId, {
          rating,
          title: title.trim() || undefined,
          comment: comment.trim(),
          images: images.length > 0 ? images : undefined,
        });

        if (response.data.success) {
          showSuccessToast('Review submitted successfully', 'Success');
          
          // Reset form
          setRating(0);
          setTitle('');
          setComment('');
          setImages([]);
          setErrors({});
          
          onSuccess?.();
        } else {
          throw new Error(response.data.error?.message || 'Failed to submit review');
        }
      }
    } catch (error) {
      const message = handleApiError(error);
      showErrorToast(message, 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================
  // HANDLE IMAGE UPLOAD
  // ============================================
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // For now, we'll store emoji placeholders
    // In production, you'd upload to cloud storage and get URLs
    const newImages = Array.from(files).slice(0, 3 - images.length).map((file) => {
      return '📷'; // Placeholder emoji
    });

    setImages([...images, ...newImages]);
  };

  // ============================================
  // REMOVE IMAGE
  // ============================================
  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-lg">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-2xl font-black text-gray-900">
          {isEditing ? 'Edit Your Review' : 'Write a Review'}
        </h3>
        <p className="text-gray-600 font-semibold mt-1">{productName}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Rating */}
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">
            Rating <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={`w-8 h-8 ${
                    star <= (hoverRating || rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
            {rating > 0 && (
              <span className="ml-2 text-sm font-bold text-gray-700">
                {rating} {rating === 1 ? 'star' : 'stars'}
              </span>
            )}
          </div>
          {errors.rating && (
            <p className="text-red-600 text-sm font-semibold mt-1">{errors.rating}</p>
          )}
        </div>

        {/* Title (Optional) */}
        <div>
          <label htmlFor="review-title" className="block text-sm font-bold text-gray-900 mb-2">
            Review Title (Optional)
          </label>
          <input
            id="review-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
            placeholder="Sum up your experience"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 outline-none transition-all font-medium"
          />
        </div>

        {/* Comment */}
        <div>
          <label htmlFor="review-comment" className="block text-sm font-bold text-gray-900 mb-2">
            Your Review <span className="text-red-500">*</span>
          </label>
          <textarea
            id="review-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={5}
            maxLength={1000}
            placeholder="Share your experience with this product..."
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 outline-none transition-all resize-none font-medium"
          />
          <div className="flex justify-between items-center mt-1">
            <div>
              {errors.comment && (
                <p className="text-red-600 text-sm font-semibold">{errors.comment}</p>
              )}
            </div>
            <p className="text-xs text-gray-500 font-semibold">
              {comment.length}/1000 characters
            </p>
          </div>
        </div>

        {/* Images (Optional) */}
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">
            Photos (Optional) - Max 3
          </label>
          <div className="flex flex-wrap gap-3">
            {images.map((img, index) => (
              <div key={index} className="relative group">
                <div className="w-20 h-20 bg-gray-100 rounded-xl flex items-center justify-center text-3xl border-2 border-gray-200">
                  {img}
                </div>
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            
            {images.length < 3 && (
              <label className="w-20 h-20 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-green-500 hover:bg-green-50 transition-all">
                <Upload className="w-5 h-5 text-gray-400" />
                <span className="text-xs text-gray-500 font-semibold mt-1">Upload</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Note: Image upload is simulated with emojis in this demo
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {isEditing ? 'Updating...' : 'Submitting...'}
              </>
            ) : (
              <>{isEditing ? 'Update Review' : 'Submit Review'}</>
            )}
          </button>
          
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-all disabled:opacity-50"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}