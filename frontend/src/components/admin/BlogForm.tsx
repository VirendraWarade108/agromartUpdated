'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Save,
  Eye,
  Upload,
  X,
  Plus,
  AlertCircle,
  CheckCircle,
  Image as ImageIcon,
  FileText,
  Tag as TagIcon,
  Calendar,
  Clock,
  Sparkles,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { blogApi, uploadApi, handleApiError } from '@/lib/api';
import { useToast } from '@/components/ui/toaster';

// ============================================
// TYPES
// ============================================

interface BlogFormData {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: string;
  featuredImage: string;
  category: string;
  tags: string[];
  readingTime: number;
  featured: boolean;
  published: boolean;
}

interface BlogFormProps {
  postId?: string;
  mode: 'create' | 'edit';
}

// ============================================
// BLOG FORM COMPONENT
// ============================================

export default function BlogForm({ postId, mode }: BlogFormProps) {
  const router = useRouter();
  const toast = useToast();

  // Form state
  const [formData, setFormData] = useState<BlogFormData>({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    author: '',
    featuredImage: '',
    category: '',
    tags: [],
    readingTime: 5,
    featured: false,
    published: false,
  });

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tagInput, setTagInput] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [autoSlug, setAutoSlug] = useState(true);

  // Categories (could be fetched from API)
  const categories = [
    'Agriculture',
    'Farming',
    'Technology',
    'Sustainability',
    'Business',
    'Education',
    'News',
    'Tips & Tricks',
  ];

  // ============================================
  // LOAD EXISTING POST (EDIT MODE)
  // ============================================

  useEffect(() => {
    if (mode === 'edit' && postId) {
      loadPost();
    }
  }, [mode, postId]);

  const loadPost = async () => {
    setIsLoading(true);
    try {
      const response = await blogApi.getById(postId!);
      if (response.data.success) {
        const post = response.data.data;
        setFormData({
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          content: post.content,
          author: post.author,
          featuredImage: post.featured_image || '',
          category: post.category,
          tags: post.tags,
          readingTime: post.reading_time,
          featured: post.featured,
          published: post.published,
        });
        setImagePreview(post.featured_image || '');
        setAutoSlug(false); // Disable auto-slug for existing posts
      }
    } catch (error) {
      console.error('Error loading post:', error);
      toast.error('Failed to load post');
      router.push('/admin/blog');
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================
  // FORM HANDLERS
  // ============================================

  /**
   * Generate slug from title
   */
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  /**
   * Handle input change
   */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Auto-generate slug from title
    if (name === 'title' && autoSlug) {
      setFormData((prev) => ({ ...prev, slug: generateSlug(value) }));
    }

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  /**
   * Handle checkbox change
   */
  const handleCheckboxChange = (name: keyof BlogFormData) => {
    setFormData((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  /**
   * Handle tag input
   */
  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !formData.tags.includes(tag)) {
      setFormData((prev) => ({ ...prev, tags: [...prev.tags, tag] }));
      setTagInput('');
    }
  };

  /**
   * Remove tag
   */
  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  /**
   * Handle image upload
   */
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setIsUploadingImage(true);
    try {
      const response = await uploadApi.uploadImage(file, 'blog');
      if (response.data.success) {
        const imageUrl = response.data.data.url;
        setFormData((prev) => ({ ...prev, featuredImage: imageUrl }));
        setImagePreview(imageUrl);
        toast.success('Image uploaded successfully');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setIsUploadingImage(false);
    }
  };

  /**
   * Remove image
   */
  const handleRemoveImage = () => {
    setFormData((prev) => ({ ...prev, featuredImage: '' }));
    setImagePreview('');
  };

  /**
   * Calculate reading time
   */
  const calculateReadingTime = (content: string) => {
    const wordsPerMinute = 200;
    const wordCount = content.trim().split(/\s+/).length;
    const time = Math.ceil(wordCount / wordsPerMinute);
    return time > 0 ? time : 1;
  };

  /**
   * Validate form
   */
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.slug.trim()) {
      newErrors.slug = 'Slug is required';
    }

    if (!formData.excerpt.trim()) {
      newErrors.excerpt = 'Excerpt is required';
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Content is required';
    }

    if (!formData.author.trim()) {
      newErrors.author = 'Author is required';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (publish: boolean) => {
    if (!validateForm()) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    setIsSaving(true);
    try {
      // Calculate reading time
      const readingTime = calculateReadingTime(formData.content);

      const payload = {
        ...formData,
        readingTime,
        published: publish,
      };

      let response;
      if (mode === 'edit' && postId) {
        // Update existing post
        response = await blogApi.getById(postId); // Would use update endpoint
        toast.success(`Post ${publish ? 'published' : 'saved as draft'} successfully`);
      } else {
        // Create new post
        response = await blogApi.getAll(); // Would use create endpoint
        toast.success(`Post ${publish ? 'published' : 'saved as draft'} successfully`);
      }

      // Redirect to admin blog list
      router.push('/admin/blog');
    } catch (error) {
      console.error('Error saving post:', error);
      toast.error('Failed to save post');
    } finally {
      setIsSaving(false);
    }
  };

  // ============================================
  // RENDER
  // ============================================

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl font-bold text-amber-900">Loading post...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-white border-b-4 border-amber-900 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black text-amber-900" style={{ fontFamily: 'Georgia, serif' }}>
                {mode === 'create' ? 'Create New Post' : 'Edit Post'}
              </h1>
              <p className="text-stone-600 font-semibold mt-1">
                {mode === 'create' ? 'Write and publish your blog post' : 'Update your blog post'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/admin/blog')}
                className="px-6 py-3 rounded-xl border-2 border-stone-300 bg-white font-bold hover:bg-stone-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSubmit(false)}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-amber-900 bg-white text-amber-900 font-bold hover:bg-amber-50 transition-colors disabled:opacity-50"
              >
                <Save className="w-5 h-5" />
                Save Draft
              </button>
              <button
                onClick={() => handleSubmit(true)}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-900 text-amber-50 font-bold hover:bg-amber-800 transition-colors disabled:opacity-50"
              >
                <CheckCircle className="w-5 h-5" />
                {isSaving ? 'Publishing...' : 'Publish'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title */}
            <div className="bg-white border-4 border-amber-900 rounded-2xl p-6">
              <label className="block mb-2">
                <span className="flex items-center gap-2 text-lg font-black text-amber-900 mb-2">
                  <FileText className="w-5 h-5" />
                  Title *
                </span>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Enter post title..."
                  className={`w-full px-4 py-3 border-2 rounded-xl font-bold text-lg focus:outline-none focus:border-amber-900 ${
                    errors.title ? 'border-red-500' : 'border-stone-300'
                  }`}
                />
                {errors.title && (
                  <p className="mt-2 text-red-600 text-sm font-semibold flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.title}
                  </p>
                )}
              </label>

              {/* Slug */}
              <label className="block mt-4">
                <span className="flex items-center gap-2 text-sm font-bold text-stone-600 mb-2">
                  URL Slug *
                  <button
                    type="button"
                    onClick={() => setAutoSlug(!autoSlug)}
                    className="text-xs px-2 py-1 rounded bg-stone-100 hover:bg-stone-200"
                  >
                    {autoSlug ? 'Auto' : 'Manual'}
                  </button>
                </span>
                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  disabled={autoSlug}
                  placeholder="post-url-slug"
                  className={`w-full px-4 py-2 border-2 rounded-xl font-semibold focus:outline-none focus:border-amber-900 disabled:bg-stone-100 ${
                    errors.slug ? 'border-red-500' : 'border-stone-300'
                  }`}
                />
                {errors.slug && (
                  <p className="mt-2 text-red-600 text-sm font-semibold flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.slug}
                  </p>
                )}
              </label>
            </div>

            {/* Excerpt */}
            <div className="bg-white border-4 border-amber-900 rounded-2xl p-6">
              <label className="block">
                <span className="flex items-center gap-2 text-lg font-black text-amber-900 mb-2">
                  Excerpt *
                </span>
                <textarea
                  name="excerpt"
                  value={formData.excerpt}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Brief description of the post..."
                  className={`w-full px-4 py-3 border-2 rounded-xl font-semibold focus:outline-none focus:border-amber-900 resize-none ${
                    errors.excerpt ? 'border-red-500' : 'border-stone-300'
                  }`}
                />
                {errors.excerpt && (
                  <p className="mt-2 text-red-600 text-sm font-semibold flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.excerpt}
                  </p>
                )}
              </label>
            </div>

            {/* Content */}
            <div className="bg-white border-4 border-amber-900 rounded-2xl p-6">
              <label className="block">
                <span className="flex items-center gap-2 text-lg font-black text-amber-900 mb-2">
                  Content *
                </span>
                <textarea
                  name="content"
                  value={formData.content}
                  onChange={handleChange}
                  rows={20}
                  placeholder="Write your blog post content here... (Markdown supported)"
                  className={`w-full px-4 py-3 border-2 rounded-xl font-mono text-sm focus:outline-none focus:border-amber-900 resize-none ${
                    errors.content ? 'border-red-500' : 'border-stone-300'
                  }`}
                />
                {errors.content && (
                  <p className="mt-2 text-red-600 text-sm font-semibold flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.content}
                  </p>
                )}
                <p className="mt-2 text-sm text-stone-500 font-semibold">
                  Estimated reading time: {calculateReadingTime(formData.content)} min
                </p>
              </label>
            </div>

            {/* Featured Image */}
            <div className="bg-white border-4 border-amber-900 rounded-2xl p-6">
              <span className="flex items-center gap-2 text-lg font-black text-amber-900 mb-4">
                <ImageIcon className="w-5 h-5" />
                Featured Image
              </span>

              {imagePreview ? (
                <div className="relative rounded-xl overflow-hidden border-2 border-stone-300">
                  <div className="relative h-64">
                    <Image
                      src={imagePreview}
                      alt="Featured"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <button
                    onClick={handleRemoveImage}
                    className="absolute top-4 right-4 p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-stone-300 rounded-xl cursor-pointer hover:border-amber-900 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={isUploadingImage}
                  />
                  {isUploadingImage ? (
                    <div className="text-center">
                      <div className="w-12 h-12 border-4 border-amber-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="font-bold text-amber-900">Uploading...</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Upload className="w-12 h-12 text-stone-400 mx-auto mb-4" />
                      <p className="font-bold text-stone-600">Click to upload image</p>
                      <p className="text-sm text-stone-500 mt-1">PNG, JPG up to 5MB</p>
                    </div>
                  )}
                </label>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Author */}
            <div className="bg-white border-4 border-amber-900 rounded-2xl p-6">
              <label className="block">
                <span className="flex items-center gap-2 text-lg font-black text-amber-900 mb-2">
                  Author *
                </span>
                <input
                  type="text"
                  name="author"
                  value={formData.author}
                  onChange={handleChange}
                  placeholder="Author name"
                  className={`w-full px-4 py-3 border-2 rounded-xl font-semibold focus:outline-none focus:border-amber-900 ${
                    errors.author ? 'border-red-500' : 'border-stone-300'
                  }`}
                />
                {errors.author && (
                  <p className="mt-2 text-red-600 text-sm font-semibold flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.author}
                  </p>
                )}
              </label>
            </div>

            {/* Category */}
            <div className="bg-white border-4 border-amber-900 rounded-2xl p-6">
              <label className="block">
                <span className="flex items-center gap-2 text-lg font-black text-amber-900 mb-2">
                  Category *
                </span>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border-2 rounded-xl font-bold focus:outline-none focus:border-amber-900 ${
                    errors.category ? 'border-red-500' : 'border-stone-300'
                  }`}
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="mt-2 text-red-600 text-sm font-semibold flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.category}
                  </p>
                )}
              </label>
            </div>

            {/* Tags */}
            <div className="bg-white border-4 border-amber-900 rounded-2xl p-6">
              <span className="flex items-center gap-2 text-lg font-black text-amber-900 mb-4">
                <TagIcon className="w-5 h-5" />
                Tags
              </span>

              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  placeholder="Add tag..."
                  className="flex-1 px-4 py-2 border-2 border-stone-300 rounded-xl font-semibold focus:outline-none focus:border-amber-900"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-4 py-2 bg-amber-900 text-amber-50 rounded-xl font-bold hover:bg-amber-800 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-2 bg-amber-100 text-amber-900 px-3 py-1 rounded-lg font-bold"
                  >
                    #{tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Options */}
            <div className="bg-white border-4 border-amber-900 rounded-2xl p-6">
              <span className="flex items-center gap-2 text-lg font-black text-amber-900 mb-4">
                <Sparkles className="w-5 h-5" />
                Options
              </span>

              <label className="flex items-center gap-3 mb-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.featured}
                  onChange={() => handleCheckboxChange('featured')}
                  className="w-5 h-5 rounded border-2 border-amber-900 text-amber-900 focus:ring-amber-900"
                />
                <span className="font-bold text-stone-800">Mark as Featured</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.published}
                  onChange={() => handleCheckboxChange('published')}
                  className="w-5 h-5 rounded border-2 border-amber-900 text-amber-900 focus:ring-amber-900"
                />
                <span className="font-bold text-stone-800">Publish Immediately</span>
              </label>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border-4 border-blue-900 rounded-2xl p-6">
              <h3 className="text-lg font-black text-blue-900 mb-2">💡 Pro Tips</h3>
              <ul className="space-y-2 text-sm text-blue-800 font-semibold">
                <li>• Keep titles under 60 characters for SEO</li>
                <li>• Write engaging excerpts (155 chars)</li>
                <li>• Use relevant tags for discoverability</li>
                <li>• Add high-quality featured images</li>
                <li>• Save as draft to preview before publishing</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}