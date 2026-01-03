'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Search, Calendar, Clock, Tag, TrendingUp, Sparkles, ArrowRight, Filter, X, Leaf, BookOpen } from 'lucide-react';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Get params from URL
  const page = Number(searchParams.get('page')) || 1;
  const category = searchParams.get('category') || null;
  const search = searchParams.get('search') || null;

  // ============================================
  // DATA FETCHING
  // ============================================

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      if (search) {
        const response = await blogApi.search(search);
        if (response.data.success) {
          setPosts(response.data.data);
          setPagination(null);
        }
      } else {
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

  useEffect(() => {
    fetchPosts();
    fetchFeaturedPosts();
    fetchCategories();
  }, [page, category, search]);

  // ============================================
  // HANDLERS
  // ============================================

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const params = new URLSearchParams();
      params.set('search', searchQuery.trim());
      router.push(`/blog?${params.toString()}`);
    }
  };

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

  const clearFilters = () => {
    setSelectedCategory(null);
    setSearchQuery('');
    router.push('/blog');
  };

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900">
      {/* Hero Section */}
      <section className="relative py-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 opacity-40">
          <div className="absolute w-96 h-96 bg-green-500/30 rounded-full blur-3xl top-20 left-10 animate-pulse"></div>
          <div className="absolute w-96 h-96 bg-blue-500/30 rounded-full blur-3xl bottom-20 right-10 animate-pulse"></div>
        </div>

        <div className="relative max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-green-500/20 backdrop-blur-xl border-2 border-green-400/40 mb-8">
              <BookOpen className="w-5 h-5 text-green-300" />
              <span className="text-green-100 font-bold text-sm tracking-wide">AGROMART BLOG</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white mb-6 leading-tight">
              Knowledge Hub
            </h1>
            <h2 className="text-4xl sm:text-5xl font-extrabold mb-8 leading-tight">
              <span className="bg-gradient-to-r from-green-300 via-emerald-300 to-cyan-300 text-transparent bg-clip-text">
                for Modern Farmers
              </span>
            </h2>

            <p className="text-xl sm:text-2xl text-gray-200 mb-12 max-w-3xl mx-auto leading-relaxed font-medium">
              Expert insights, farming tips, and latest innovations in agriculture
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-12">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300 opacity-60"></div>
                <div className="relative flex items-center bg-white rounded-2xl border-2 border-transparent focus-within:border-green-400 overflow-hidden shadow-2xl">
                  <Search className="absolute left-6 w-6 h-6 text-gray-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search articles..."
                    className="w-full pl-16 pr-6 py-5 bg-white text-gray-900 placeholder-gray-500 focus:outline-none text-lg font-medium"
                  />
                  <button
                    type="submit"
                    className="m-2 px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-xl text-white font-bold transition-all flex items-center gap-2"
                  >
                    Search
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      </section>

      {/* Featured Posts */}
      {featuredPosts.length > 0 && !search && (
        <section className="relative py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-12"
            >
              <div className="flex items-center gap-3 mb-4">
                <Sparkles className="w-8 h-8 text-green-400" />
                <h2 className="text-5xl font-black text-white">Featured Stories</h2>
              </div>
              <p className="text-xl text-gray-300 font-medium">Top picks for this season</p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {featuredPosts.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="relative group"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                  <Link href={`/blog/${post.slug}`}>
                    <div className="relative bg-white rounded-3xl border-2 border-gray-200 group-hover:border-green-400 overflow-hidden transition-all duration-300 shadow-xl">
                      {post.featured_image && (
                        <div className="relative h-56 overflow-hidden">
                          <Image
                            src={post.featured_image}
                            alt={post.title}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                          <div className="absolute top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-xl font-black text-sm shadow-lg">
                            FEATURED
                          </div>
                        </div>
                      )}
                      <div className="p-6">
                        <div className="bg-green-100 text-green-900 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider inline-block mb-3">
                          {post.category}
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-green-600 transition-colors">
                          {post.title}
                        </h3>
                        <p className="text-gray-600 line-clamp-2 mb-4 font-medium">
                          {post.excerpt}
                        </p>
                        <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t-2 border-gray-100">
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
          </div>
        </section>
      )}

      {/* Main Content */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-12">
            {/* Sidebar */}
            <aside className="lg:w-80 flex-shrink-0">
              <div className="sticky top-24">
                {/* Categories */}
                <div className="relative group mb-8">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-blue-500/10 rounded-3xl blur-xl"></div>
                  <div className="relative bg-slate-900/60 backdrop-blur-2xl rounded-3xl border-2 border-white/20 p-6 shadow-xl">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-2xl font-black text-white">Categories</h3>
                      {(selectedCategory || search) && (
                        <button
                          onClick={clearFilters}
                          className="text-sm font-bold text-green-300 hover:text-green-200 flex items-center gap-1"
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
                              ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg'
                              : 'bg-white/10 text-white hover:bg-white/20'
                          }`}
                        >
                          <span>{cat.name}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-black ${
                            selectedCategory === cat.name || category === cat.name
                              ? 'bg-white/20'
                              : 'bg-green-500/30 text-green-300'
                          }`}>
                            {cat.count}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Active Filters */}
                {(search || category) && (
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-3xl blur-xl"></div>
                    <div className="relative bg-slate-900/60 backdrop-blur-2xl rounded-3xl border-2 border-white/20 p-6 shadow-xl">
                      <h3 className="text-lg font-black text-white mb-4">Active Filters</h3>
                      <div className="space-y-2">
                        {search && (
                          <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-lg">
                            <Search className="w-4 h-4 text-green-300" />
                            <span className="font-semibold text-sm text-white">{search}</span>
                          </div>
                        )}
                        {category && (
                          <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-lg">
                            <Filter className="w-4 h-4 text-green-300" />
                            <span className="font-semibold text-sm text-white">{category}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </aside>

            {/* Posts Grid */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-4xl font-black text-white">
                  {search ? `Search: "${search}"` : category ? `${category}` : 'All Articles'}
                </h2>
                {pagination && (
                  <span className="text-gray-300 font-semibold">
                    {pagination.total} articles
                  </span>
                )}
              </div>

              {/* Loading State */}
              {isLoading && (
                <div className="grid md:grid-cols-2 gap-8">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 animate-pulse">
                      <div className="h-48 bg-white/20 rounded-xl mb-4"></div>
                      <div className="h-6 bg-white/20 rounded w-3/4 mb-3"></div>
                      <div className="h-4 bg-white/20 rounded w-full mb-2"></div>
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
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.05 }}
                      className="relative group"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                      <Link href={`/blog/${post.slug}`}>
                        <div className="relative bg-white rounded-3xl border-2 border-gray-200 group-hover:border-green-400 overflow-hidden transition-all duration-300 shadow-xl h-full flex flex-col">
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
                            <div className="bg-green-100 text-green-900 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider inline-block mb-3 w-fit">
                              {post.category}
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-green-600 transition-colors">
                              {post.title}
                            </h3>
                            <p className="text-gray-600 line-clamp-3 mb-4 font-medium flex-1">
                              {post.excerpt}
                            </p>
                            <div className="flex items-center justify-between text-sm pt-4 border-t-2 border-gray-100">
                              <span className="font-semibold text-gray-700">{post.author}</span>
                              <span className="flex items-center gap-1 text-gray-500">
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
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-xl rounded-full mb-6">
                    <Search className="w-10 h-10 text-green-400" />
                  </div>
                  <h3 className="text-3xl font-black text-white mb-3">No articles found</h3>
                  <p className="text-gray-300 mb-6">Try adjusting your search or filters</p>
                  <button
                    onClick={clearFilters}
                    className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-xl text-white font-bold transition-all shadow-lg"
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
                    className="px-6 py-3 rounded-xl bg-white/10 backdrop-blur-xl border-2 border-white/20 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition-all"
                  >
                    Previous
                  </button>
                  <div className="flex items-center gap-2">
                    {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => i + 1).map((pageNum) => (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-12 h-12 rounded-xl font-black transition-all ${
                          pageNum === pagination.page
                            ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg'
                            : 'bg-white/10 backdrop-blur-xl text-white border-2 border-white/20 hover:bg-white/20'
                        }`}
                      >
                        {pageNum}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className="px-6 py-3 rounded-xl bg-white/10 backdrop-blur-xl border-2 border-white/20 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition-all"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}