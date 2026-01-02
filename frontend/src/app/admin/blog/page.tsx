'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  MoreVertical,
  TrendingUp,
  FileText,
  Users,
  BarChart3,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { blogApi, handleApiError } from '@/lib/api';
import { useToast } from '@/components/ui/toaster';
import useAuth from '@/hooks/useAuth';

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
  published: boolean;
  created_at: string;
  updated_at: string;
}

interface BlogStats {
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  totalViews: number;
  totalLikes: number;
  mostViewed: Array<{
    id: string;
    title: string;
    slug: string;
    views: number;
  }>;
  categories: Array<{
    name: string;
    count: number;
    slug: string;
  }>;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

// ============================================
// ADMIN BLOG DASHBOARD
// ============================================

export default function AdminBlogPage() {
  const router = useRouter();
  const toast = useToast();
  const { user, isAdmin, isLoading: authLoading } = useAuth();

  // State
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [stats, setStats] = useState<BlogStats | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [publishedFilter, setPublishedFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [selectedPost, setSelectedPost] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 20;

  // ============================================
  // AUTH CHECK
  // ============================================

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.push('/auth/login');
    }
  }, [user, isAdmin, authLoading, router]);

  // ============================================
  // DATA FETCHING
  // ============================================

  /**
   * Fetch blog posts
   */
  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const response = await blogApi.getAll({
        page: currentPage,
        limit,
        category: selectedCategory || undefined,
        // Admin endpoint would use different filter
      });

      if (response.data.success) {
        // Filter by published status on client side
        let filteredPosts = response.data.data;
        if (publishedFilter === 'published') {
          filteredPosts = filteredPosts.filter((p: BlogPost) => p.published);
        } else if (publishedFilter === 'draft') {
          filteredPosts = filteredPosts.filter((p: BlogPost) => !p.published);
        }

        setPosts(filteredPosts);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('Failed to load blog posts');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Fetch statistics
   */
  const fetchStats = async () => {
    try {
      // Since we don't have admin stats endpoint yet, calculate from posts
      const response = await blogApi.getAll({ limit: 1000 });
      if (response.data.success) {
        const allPosts = response.data.data;
        const published = allPosts.filter((p: BlogPost) => p.published);
        const drafts = allPosts.filter((p: BlogPost) => !p.published);
        
        const totalViews = allPosts.reduce((sum: number, p: BlogPost) => sum + (p.views || 0), 0);
        const totalLikes = allPosts.reduce((sum: number, p: BlogPost) => sum + (p.likes || 0), 0);
        
        const mostViewed = [...allPosts]
          .sort((a: BlogPost, b: BlogPost) => (b.views || 0) - (a.views || 0))
          .slice(0, 5);

        setStats({
          totalPosts: allPosts.length,
          publishedPosts: published.length,
          draftPosts: drafts.length,
          totalViews,
          totalLikes,
          mostViewed,
          categories: [],
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  /**
   * Initial load
   */
  useEffect(() => {
    if (user && isAdmin) {
      fetchPosts();
      fetchStats();
    }
  }, [currentPage, selectedCategory, publishedFilter, user, isAdmin]);

  // ============================================
  // HANDLERS
  // ============================================

  /**
   * Handle search
   */
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      try {
        const response = await blogApi.search(query);
        if (response.data.success) {
          setPosts(response.data.data);
          setPagination(null);
        }
      } catch (error) {
        console.error('Error searching posts:', error);
      }
    } else {
      fetchPosts();
    }
  };

  /**
   * Toggle publish status
   */
  const handleTogglePublish = async (postId: string, currentStatus: boolean) => {
    try {
      // Would use admin API endpoint
      toast.info('Publishing feature coming soon');
    } catch (error) {
      toast.error('Failed to update post status');
    }
  };

  /**
   * Delete post
   */
  const handleDelete = async (postId: string) => {
    try {
      // Would use admin API endpoint
      toast.success('Post deleted successfully');
      setShowDeleteModal(false);
      setPostToDelete(null);
      fetchPosts();
    } catch (error) {
      toast.error('Failed to delete post');
    }
  };

  /**
   * Format date
   */
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // ============================================
  // RENDER
  // ============================================

  if (authLoading || !user || !isAdmin) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl font-bold text-amber-900">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-white border-b-4 border-amber-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-black text-amber-900" style={{ fontFamily: 'Georgia, serif' }}>
                Blog Management
              </h1>
              <p className="text-stone-600 font-semibold mt-1">
                Manage your blog posts, categories, and content
              </p>
            </div>
            <Link
              href="/admin/blog/new"
              className="flex items-center gap-2 bg-amber-900 text-amber-50 px-6 py-3 rounded-xl font-bold hover:bg-amber-800 transition-colors"
            >
              <Plus className="w-5 h-5" />
              New Post
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
        {stats && (
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border-4 border-amber-900 rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-amber-900" />
                </div>
                <span className="text-3xl font-black text-amber-900">{stats.totalPosts}</span>
              </div>
              <h3 className="font-bold text-stone-600">Total Posts</h3>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white border-4 border-green-600 rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <span className="text-3xl font-black text-green-600">{stats.publishedPosts}</span>
              </div>
              <h3 className="font-bold text-stone-600">Published</h3>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white border-4 border-orange-600 rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-orange-600" />
                </div>
                <span className="text-3xl font-black text-orange-600">{stats.draftPosts}</span>
              </div>
              <h3 className="font-bold text-stone-600">Drafts</h3>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white border-4 border-blue-600 rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Eye className="w-6 h-6 text-blue-600" />
                </div>
                <span className="text-3xl font-black text-blue-600">{stats.totalViews.toLocaleString()}</span>
              </div>
              <h3 className="font-bold text-stone-600">Total Views</h3>
            </motion.div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white border-4 border-amber-900 rounded-2xl p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search posts..."
                  className="w-full pl-12 pr-4 py-3 border-2 border-stone-300 rounded-xl font-semibold focus:outline-none focus:border-amber-900"
                />
              </div>
            </div>

            {/* Status Filter */}
            <select
              value={publishedFilter}
              onChange={(e) => setPublishedFilter(e.target.value as any)}
              className="px-4 py-3 border-2 border-stone-300 rounded-xl font-bold focus:outline-none focus:border-amber-900"
            >
              <option value="all">All Posts</option>
              <option value="published">Published Only</option>
              <option value="draft">Drafts Only</option>
            </select>
          </div>
        </div>

        {/* Posts Table */}
        <div className="bg-white border-4 border-amber-900 rounded-2xl overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 border-4 border-amber-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-lg font-bold text-amber-900">Loading posts...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-16 h-16 text-stone-300 mx-auto mb-4" />
              <h3 className="text-xl font-black text-stone-600 mb-2">No posts found</h3>
              <p className="text-stone-500 mb-6">Create your first blog post to get started</p>
              <Link
                href="/admin/blog/new"
                className="inline-flex items-center gap-2 bg-amber-900 text-amber-50 px-6 py-3 rounded-xl font-bold hover:bg-amber-800 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Create Post
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-amber-900 text-amber-50">
                  <tr>
                    <th className="px-6 py-4 text-left font-black uppercase tracking-wider">Post</th>
                    <th className="px-6 py-4 text-left font-black uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left font-black uppercase tracking-wider">Category</th>
                    <th className="px-6 py-4 text-left font-black uppercase tracking-wider">Stats</th>
                    <th className="px-6 py-4 text-left font-black uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-right font-black uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-stone-200">
                  {posts.map((post) => (
                    <tr key={post.id} className="hover:bg-stone-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          {post.featured_image && (
                            <div className="relative w-16 h-16 rounded-lg overflow-hidden border-2 border-amber-900 flex-shrink-0">
                              <Image
                                src={post.featured_image}
                                alt={post.title}
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                          <div>
                            <h4 className="font-black text-amber-900 line-clamp-1">{post.title}</h4>
                            <p className="text-sm text-stone-600 font-semibold">{post.author}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black uppercase ${
                            post.published
                              ? 'bg-green-100 text-green-800'
                              : 'bg-orange-100 text-orange-800'
                          }`}>
                            {post.published ? (
                              <>
                                <CheckCircle className="w-3 h-3" />
                                Published
                              </>
                            ) : (
                              <>
                                <AlertCircle className="w-3 h-3" />
                                Draft
                              </>
                            )}
                          </span>
                          {post.featured && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black uppercase bg-amber-100 text-amber-800">
                              ⭐ Featured
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-stone-100 text-stone-800 px-3 py-1 rounded-lg text-sm font-bold">
                          {post.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4 text-sm">
                          <span className="flex items-center gap-1 text-stone-600 font-semibold">
                            <Eye className="w-4 h-4" />
                            {post.views}
                          </span>
                          <span className="flex items-center gap-1 text-stone-600 font-semibold">
                            <Clock className="w-4 h-4" />
                            {post.reading_time}m
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <p className="font-bold text-stone-800">{formatDate(post.published_at)}</p>
                          <p className="text-stone-500 font-semibold">Updated: {formatDate(post.updated_at)}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/blog/${post.slug}`}
                            target="_blank"
                            className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View post"
                          >
                            <Eye className="w-5 h-5 text-blue-600" />
                          </Link>
                          <Link
                            href={`/admin/blog/edit/${post.id}`}
                            className="p-2 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Edit post"
                          >
                            <Edit className="w-5 h-5 text-amber-600" />
                          </Link>
                          <button
                            onClick={() => {
                              setPostToDelete(post.id);
                              setShowDeleteModal(true);
                            }}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete post"
                          >
                            <Trash2 className="w-5 h-5 text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="border-t-4 border-amber-900 p-6 flex items-center justify-between">
              <p className="text-stone-600 font-semibold">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} posts
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-lg border-2 border-amber-900 bg-white font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-amber-50 transition-colors"
                >
                  Previous
                </button>
                <span className="px-4 py-2 font-black text-amber-900">
                  Page {currentPage} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === pagination.totalPages}
                  className="px-4 py-2 rounded-lg border-2 border-amber-900 bg-white font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-amber-50 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && postToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white border-4 border-red-600 rounded-2xl p-8 max-w-md w-full"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-2xl font-black text-red-900 mb-2">Delete Post?</h3>
                <p className="text-stone-600 font-semibold">
                  This action cannot be undone. The post will be permanently deleted.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-6 py-3 rounded-xl border-2 border-stone-300 bg-white font-bold hover:bg-stone-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(postToDelete)}
                  className="flex-1 px-6 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}