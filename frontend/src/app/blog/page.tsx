'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Search, Calendar, Clock, Tag, TrendingUp, Sparkles, ArrowRight, Filter, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { blogApi, handleApiError } from '@/lib/api';

// ============================================
// TYPES
// ============================================

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  author: string;
  featured_image?: string;
  category: string;
  tags: string[];
  views: number;
  likes: number;
  comments: number;
  published_at: string;
  reading_time: number;
  featured: boolean;
}

interface Category {
  name: string;
  count: number;
  slug: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

// ============================================
// BLOG LISTING PAGE
// ============================================

export default function BlogPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [featuredPosts, setFeaturedPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Get params from URL
  const page = Number(searchParams.get('page')) || 1;
  const category = searchParams.get('category') || null;
  const search = searchParams.get('search') || null;

  // ============================================
  // DATA FETCHING
  // ============================================

  /**
   * Fetch blog posts
   */
  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      // If searching, use search endpoint
      if (search) {
        const response = await blogApi.search(search);
        if (response.data.success) {
          setPosts(response.data.data);
          setPagination(null); // Search doesn't have pagination
        }
      } else {
        // Regular listing
        const response = await blogApi.getAll({
          page,
          limit: 12,
          category: category || undefined,
        });

        if (response.data.success) {
          setPosts(response.data.data);
          setPagination(response.data.pagination);
        }
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Fetch featured posts
   */
  const fetchFeaturedPosts = async () => {
    try {
      const response = await blogApi.getFeatured();
      if (response.data.success) {
        setFeaturedPosts(response.data.data.slice(0, 3));
      }
    } catch (error) {
      console.error('Error fetching featured posts:', error);
    }
  };

  /**
   * Fetch categories
   */
  const fetchCategories = async () => {
    try {
      const response = await blogApi.getCategories();
      if (response.data.success) {
        setCategories(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  /**
   * Initial load
   */
  useEffect(() => {
    fetchPosts();
    fetchFeaturedPosts();
    fetchCategories();
  }, [page, category, search]);

  // ============================================
  // HANDLERS
  // ============================================

  /**
   * Handle search
   */
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const params = new URLSearchParams();
      params.set('search', searchQuery.trim());
      router.push(`/blog?${params.toString()}`);
    }
  };

  /**
   * Handle category filter
   */
  const handleCategoryFilter = (categoryName: string) => {
    if (selectedCategory === categoryName) {
      setSelectedCategory(null);
      router.push('/blog');
    } else {
      setSelectedCategory(categoryName);
      const params = new URLSearchParams();
      params.set('category', categoryName);
      router.push(`/blog?${params.toString()}`);
    }
  };

  /**
   * Clear filters
   */
  const clearFilters = () => {
    setSelectedCategory(null);
    setSearchQuery('');
    router.push('/blog');
  };

  /**
   * Handle pagination
   */
  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams();
    params.set('page', String(newPage));
    if (category) params.set('category', category);
    if (search) params.set('search', search);
    router.push(`/blog?${params.toString()}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-amber-50 via-stone-100 to-orange-50 border-b-4 border-amber-900">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23000000" fill-opacity="1"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v6h6V4z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 bg-amber-900 text-amber-50 px-6 py-2 rounded-full font-bold text-sm mb-6 tracking-wider">
              <Sparkles className="w-4 h-4" />
              AGROMART JOURNAL
            </div>
            <h1 className="text-6xl md:text-7xl font-black text-amber-900 mb-6 tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>
              Cultivating Knowledge
            </h1>
            <p className="text-xl text-stone-700 max-w-2xl mx-auto font-medium leading-relaxed" style={{ fontFamily: 'Georgia, serif' }}>
              Stories, insights, and innovations from the world of sustainable agriculture
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="mt-12 max-w-2xl mx-auto">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search articles..."
                  className="w-full px-6 py-5 pl-14 rounded-2xl border-4 border-amber-900 bg-white text-lg font-semibold placeholder:text-stone-400 focus:outline-none focus:ring-4 focus:ring-amber-300"
                />
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-amber-900" />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-amber-900 text-amber-50 px-6 py-3 rounded-xl font-bold hover:bg-amber-800 transition-colors"
                >
                  Search
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </section>

      {/* Featured Posts */}
      {featuredPosts.length > 0 && !search && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center gap-3 mb-8">
            <TrendingUp className="w-8 h-8 text-amber-900" />
            <h2 className="text-4xl font-black text-amber-900" style={{ fontFamily: 'Georgia, serif' }}>
              Featured Stories
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {featuredPosts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link href={`/blog/${post.slug}`}>
                  <div className="group relative bg-white border-4 border-amber-900 rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
                    {post.featured_image && (
                      <div className="relative h-64 overflow-hidden">
                        <Image
                          src={post.featured_image}
                          alt={post.title}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-amber-900/80 to-transparent"></div>
                        <div className="absolute bottom-4 left-4 bg-amber-500 text-amber-950 px-4 py-2 rounded-lg font-black text-sm">
                          FEATURED
                        </div>
                      </div>
                    )}
                    <div className="p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="bg-amber-100 text-amber-900 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">
                          {post.category}
                        </span>
                      </div>
                      <h3 className="text-2xl font-black text-amber-900 mb-3 line-clamp-2 group-hover:text-amber-700 transition-colors" style={{ fontFamily: 'Georgia, serif' }}>
                        {post.title}
                      </h3>
                      <p className="text-stone-600 line-clamp-2 mb-4 font-medium">
                        {post.excerpt}
                      </p>
                      <div className="flex items-center justify-between text-sm text-stone-500">
                        <span className="font-semibold">{post.author}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {post.reading_time} min
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Sidebar */}
          <aside className="lg:w-80 flex-shrink-0">
            <div className="sticky top-24">
              {/* Categories */}
              <div className="bg-white border-4 border-amber-900 rounded-2xl p-6 mb-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-black text-amber-900" style={{ fontFamily: 'Georgia, serif' }}>
                    Categories
                  </h3>
                  {(selectedCategory || search) && (
                    <button
                      onClick={clearFilters}
                      className="text-sm font-bold text-amber-700 hover:text-amber-900 flex items-center gap-1"
                    >
                      <X className="w-4 h-4" />
                      Clear
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  {categories.map((cat) => (
                    <button
                      key={cat.name}
                      onClick={() => handleCategoryFilter(cat.name)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl font-bold transition-all ${
                        selectedCategory === cat.name || category === cat.name
                          ? 'bg-amber-900 text-amber-50'
                          : 'bg-stone-50 text-amber-900 hover:bg-amber-100'
                      }`}
                    >
                      <span>{cat.name}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-black ${
                        selectedCategory === cat.name || category === cat.name
                          ? 'bg-amber-700'
                          : 'bg-amber-200 text-amber-900'
                      }`}>
                        {cat.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Active Filters */}
              {(search || category) && (
                <div className="bg-amber-50 border-4 border-amber-900 rounded-2xl p-6">
                  <h3 className="text-lg font-black text-amber-900 mb-4">
                    Active Filters
                  </h3>
                  <div className="space-y-2">
                    {search && (
                      <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border-2 border-amber-900">
                        <Search className="w-4 h-4 text-amber-900" />
                        <span className="font-semibold text-sm">{search}</span>
                      </div>
                    )}
                    {category && (
                      <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border-2 border-amber-900">
                        <Filter className="w-4 h-4 text-amber-900" />
                        <span className="font-semibold text-sm">{category}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </aside>

          {/* Posts Grid */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-black text-amber-900" style={{ fontFamily: 'Georgia, serif' }}>
                {search ? `Search Results for "${search}"` : category ? `${category} Articles` : 'All Articles'}
              </h2>
              {pagination && (
                <span className="text-stone-600 font-semibold">
                  {pagination.total} articles
                </span>
              )}
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="grid md:grid-cols-2 gap-8">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-white border-4 border-stone-200 rounded-2xl p-6 animate-pulse">
                    <div className="h-48 bg-stone-200 rounded-xl mb-4"></div>
                    <div className="h-6 bg-stone-200 rounded w-3/4 mb-3"></div>
                    <div className="h-4 bg-stone-200 rounded w-full mb-2"></div>
                    <div className="h-4 bg-stone-200 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            )}

            {/* Posts Grid */}
            {!isLoading && posts.length > 0 && (
              <div className="grid md:grid-cols-2 gap-8">
                {posts.map((post, index) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link href={`/blog/${post.slug}`}>
                      <div className="group bg-white border-4 border-amber-900 rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 h-full flex flex-col">
                        {post.featured_image && (
                          <div className="relative h-56 overflow-hidden">
                            <Image
                              src={post.featured_image}
                              alt={post.title}
                              fill
                              className="object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                          </div>
                        )}
                        <div className="p-6 flex-1 flex flex-col">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="bg-amber-100 text-amber-900 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">
                              {post.category}
                            </span>
                          </div>
                          <h3 className="text-2xl font-black text-amber-900 mb-3 line-clamp-2 group-hover:text-amber-700 transition-colors" style={{ fontFamily: 'Georgia, serif' }}>
                            {post.title}
                          </h3>
                          <p className="text-stone-600 line-clamp-3 mb-4 font-medium flex-1">
                            {post.excerpt}
                          </p>
                          <div className="flex items-center justify-between text-sm pt-4 border-t-2 border-stone-100">
                            <span className="font-semibold text-stone-700">{post.author}</span>
                            <span className="flex items-center gap-1 text-stone-500">
                              <Clock className="w-4 h-4" />
                              {post.reading_time} min
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!isLoading && posts.length === 0 && (
              <div className="text-center py-20">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-amber-100 rounded-full mb-6">
                  <Search className="w-10 h-10 text-amber-900" />
                </div>
                <h3 className="text-2xl font-black text-amber-900 mb-3">
                  No articles found
                </h3>
                <p className="text-stone-600 mb-6">
                  Try adjusting your search or filters
                </p>
                <button
                  onClick={clearFilters}
                  className="bg-amber-900 text-amber-50 px-6 py-3 rounded-xl font-bold hover:bg-amber-800 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            )}

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-12">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 rounded-xl border-4 border-amber-900 bg-white font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-amber-50 transition-colors"
                >
                  Previous
                </button>
                <div className="flex items-center gap-2">
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`w-12 h-12 rounded-xl font-black transition-colors ${
                        pageNum === pagination.page
                          ? 'bg-amber-900 text-amber-50 border-4 border-amber-900'
                          : 'bg-white text-amber-900 border-4 border-amber-900 hover:bg-amber-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-4 py-2 rounded-xl border-4 border-amber-900 bg-white font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-amber-50 transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}