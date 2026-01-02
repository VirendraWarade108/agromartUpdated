'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  Calendar,
  User,
  Share2,
  ArrowLeft,
  Clock,
  Tag,
  Heart,
  MessageCircle,
  Eye,
  AlertCircle,
} from 'lucide-react';
import { blogApi, handleApiError } from '@/lib/api';
import { showErrorToast } from '@/store/uiStore';
import { PageLoader } from '@/components/shared/LoadingSpinner';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: string;
  featured_image: string;
  category: string;
  tags: string[];
  likes: number;
  comments: number;
  views: number;
  published_at: string;
  reading_time: number;
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function BlogDetailPage({ params }: PageProps) {
  const router = useRouter();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [slug, setSlug] = useState<string>('');

  // Unwrap params
  useEffect(() => {
    params.then((p) => setSlug(p.slug));
  }, [params]);

  // Fetch blog post
  useEffect(() => {
    if (!slug) return;
    fetchBlogPost();
  }, [slug]);

  const fetchBlogPost = async () => {
    setIsLoading(true);
    try {
      const response = await blogApi.getBySlug(slug);

      if (response.data.success) {
        setPost(response.data.data);
      }
    } catch (error) {
      const message = handleApiError(error);
      showErrorToast(message, 'Failed to load blog post');
      router.push('/blog');
    } finally {
      setIsLoading(false);
    }
  };

  // Share functionality
  const handleShare = async () => {
    if (!post) return;

    const url = window.location.href;
    const text = `Check out this blog post: ${post.title}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.excerpt,
          url: url,
        });
      } catch (error) {
        // User cancelled or error
      }
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    }
  };

  if (isLoading) {
    return <PageLoader message="Loading blog post..." />;
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Blog Post Not Found</h2>
          <p className="text-gray-600 mb-6">The blog post you're looking for doesn't exist.</p>
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  const publishedDate = new Date(post.published_at);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-slate-900 via-green-900 to-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-green-300 hover:text-green-200 font-semibold mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Blog
          </Link>

          {/* Category Badge */}
          <span className="inline-block px-4 py-2 bg-green-600 text-white rounded-full text-sm font-bold mb-4">
            {post.category}
          </span>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-black mb-4 leading-tight"
          >
            {post.title}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-green-100 mb-8"
          >
            {post.excerpt}
          </motion.p>

          {/* Meta Information */}
          <div className="flex flex-wrap gap-6 text-green-200">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5" />
              <span className="font-semibold">{post.author}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              <span className="font-semibold">
                {publishedDate.toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <span className="font-semibold">{post.reading_time} min read</span>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Image */}
      {post.featured_image && (
        <div className="relative w-full h-96 bg-gray-200">
          <Image
            src={post.featured_image}
            alt={post.title}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Engagement Stats */}
        <div className="flex items-center gap-6 mb-8 pb-8 border-b-2 border-gray-200">
          <div className="flex items-center gap-2 text-gray-600">
            <Eye className="w-5 h-5" />
            <span className="font-semibold">{post.views.toLocaleString()} views</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Heart className="w-5 h-5" />
            <span className="font-semibold">{post.likes.toLocaleString()} likes</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <MessageCircle className="w-5 h-5" />
            <span className="font-semibold">{post.comments} comments</span>
          </div>
        </div>

        {/* Article Content */}
        <article
          className="prose prose-lg max-w-none mb-12
            prose-headings:font-black prose-headings:text-gray-900
            prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-6
            prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-4
            prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-6
            prose-ul:my-6 prose-ul:space-y-2
            prose-li:text-gray-700
            prose-strong:text-gray-900 prose-strong:font-bold
            prose-a:text-green-600 prose-a:no-underline hover:prose-a:underline"
        >
          <div dangerouslySetInnerHTML={{ __html: post.content }} />
        </article>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6 mb-12">
            <div className="flex items-center gap-2 mb-4">
              <Tag className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-black text-gray-900">Tags</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/blog?tag=${tag}`}
                  className="px-4 py-2 bg-white hover:bg-green-100 text-green-700 font-bold rounded-full text-sm border-2 border-green-200 hover:border-green-400 transition-all"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Share Section */}
        <div className="bg-gray-50 rounded-2xl border-2 border-gray-200 p-8 mb-12">
          <h3 className="text-2xl font-black text-gray-900 mb-4">Share this post</h3>
          <p className="text-gray-600 mb-6">
            Found this helpful? Share it with others who might benefit!
          </p>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-xl transition-all shadow-lg"
            >
              <Share2 className="w-5 h-5" />
              Share Post
            </button>
            <Link
              href="/blog"
              className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-gray-100 text-gray-900 font-bold rounded-xl border-2 border-gray-200 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
              More Articles
            </Link>
          </div>
        </div>

        {/* Author Info */}
        <div className="bg-gradient-to-br from-slate-50 to-green-50 border-2 border-gray-200 rounded-2xl p-8">
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 bg-gradient-to-br from-green-600 to-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-3xl font-black text-white">
                {post.author.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h3 className="text-2xl font-black text-gray-900 mb-2">{post.author}</h3>
              <p className="text-gray-600 leading-relaxed">
                Contributing author sharing insights on sustainable farming practices and
                agricultural innovations.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
