'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Calendar, 
  Clock, 
  Eye, 
  Heart, 
  MessageCircle, 
  Share2, 
  ArrowLeft, 
  Tag,
  User,
  TrendingUp,
  Facebook,
  Twitter,
  Linkedin,
  Link2,
  Check
} from 'lucide-react';
import { motion, useScroll, useSpring } from 'framer-motion';
import { blogApi, handleApiError } from '@/lib/api';
import { useToast } from '@/components/ui/toaster';

// ============================================
// TYPES
// ============================================

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
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

// ============================================
// BLOG POST DETAIL PAGE
// ============================================

export default function BlogPostPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const slug = params.slug as string;

  // State
  const [post, setPost] = useState<BlogPost | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  // Reading progress
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  // ============================================
  // DATA FETCHING
  // ============================================

  /**
   * Fetch blog post by slug
   */
  const fetchPost = async () => {
    setIsLoading(true);
    try {
      const response = await blogApi.getBySlug(slug);
      if (response.data.success) {
        setPost(response.data.data);
        // Fetch related posts based on category
        fetchRelatedPosts(response.data.data.category);
      }
    } catch (error) {
      console.error('Error fetching post:', error);
      toast.error('Failed to load blog post');
      router.push('/blog');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Fetch related posts
   */
  const fetchRelatedPosts = async (category: string) => {
    try {
      const response = await blogApi.getAll({ category, limit: 3 });
      if (response.data.success) {
        // Filter out current post
        const related = response.data.data.filter((p: BlogPost) => p.slug !== slug).slice(0, 3);
        setRelatedPosts(related);
      }
    } catch (error) {
      console.error('Error fetching related posts:', error);
    }
  };

  /**
   * Initial load
   */
  useEffect(() => {
    if (slug) {
      fetchPost();
    }
  }, [slug]);

  // ============================================
  // HANDLERS
  // ============================================

  /**
   * Share on social media
   */
  const handleShare = (platform: string) => {
    const url = window.location.href;
    const title = post?.title || '';
    
    const urls: Record<string, string> = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    };

    if (urls[platform]) {
      window.open(urls[platform], '_blank', 'width=600,height=400');
    }

    setShowShareMenu(false);
  };

  /**
   * Copy link to clipboard
   */
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  /**
   * Format date
   */
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // ============================================
  // RENDER
  // ============================================

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl font-bold text-amber-900">Loading article...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-3xl font-black text-amber-900 mb-4">Article not found</h2>
          <Link href="/blog" className="text-amber-700 font-bold hover:underline">
            ← Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Reading Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-2 bg-amber-500 origin-left z-50"
        style={{ scaleX }}
      />

      {/* Back Button */}
      <div className="bg-white border-b-4 border-amber-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link 
            href="/blog"
            className="inline-flex items-center gap-2 text-amber-900 font-bold hover:text-amber-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Blog
          </Link>
        </div>
      </div>

      {/* Article Header */}
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          {/* Category Badge */}
          <div className="flex items-center gap-3 mb-6">
            <span className="bg-amber-500 text-amber-950 px-4 py-2 rounded-lg font-black text-sm uppercase tracking-wider">
              {post.category}
            </span>
            {post.featured && (
              <span className="bg-gradient-to-r from-amber-400 to-orange-500 text-white px-4 py-2 rounded-lg font-black text-sm uppercase tracking-wider">
                ⭐ Featured
              </span>
            )}
          </div>

          {/* Title */}
          <h1 
            className="text-5xl md:text-6xl font-black text-amber-900 mb-6 leading-tight"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            {post.title}
          </h1>

          {/* Excerpt */}
          <p className="text-2xl text-stone-700 leading-relaxed mb-8" style={{ fontFamily: 'Georgia, serif' }}>
            {post.excerpt}
          </p>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-6 text-stone-600 pb-8 border-b-4 border-amber-900">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5" />
              <span className="font-bold">{post.author}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              <span className="font-semibold">{formatDate(post.published_at)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <span className="font-semibold">{post.reading_time} min read</span>
            </div>
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              <span className="font-semibold">{post.views.toLocaleString()} views</span>
            </div>
          </div>

          {/* Social Actions */}
          <div className="flex items-center justify-between mt-8">
            <div className="flex items-center gap-4">
              <button className="flex items-center gap-2 bg-white border-4 border-amber-900 rounded-xl px-6 py-3 font-bold hover:bg-amber-50 transition-colors">
                <Heart className="w-5 h-5" />
                <span>{post.likes}</span>
              </button>
              <button className="flex items-center gap-2 bg-white border-4 border-amber-900 rounded-xl px-6 py-3 font-bold hover:bg-amber-50 transition-colors">
                <MessageCircle className="w-5 h-5" />
                <span>{post.comments}</span>
              </button>
            </div>

            {/* Share Button */}
            <div className="relative">
              <button
                onClick={() => setShowShareMenu(!showShareMenu)}
                className="flex items-center gap-2 bg-amber-900 text-amber-50 border-4 border-amber-900 rounded-xl px-6 py-3 font-bold hover:bg-amber-800 transition-colors"
              >
                <Share2 className="w-5 h-5" />
                Share
              </button>

              {/* Share Menu */}
              {showShareMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute right-0 mt-2 bg-white border-4 border-amber-900 rounded-xl p-4 shadow-2xl z-10 w-64"
                >
                  <div className="space-y-2">
                    <button
                      onClick={() => handleShare('facebook')}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-50 transition-colors text-left font-bold"
                    >
                      <Facebook className="w-5 h-5 text-blue-600" />
                      Share on Facebook
                    </button>
                    <button
                      onClick={() => handleShare('twitter')}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-sky-50 transition-colors text-left font-bold"
                    >
                      <Twitter className="w-5 h-5 text-sky-500" />
                      Share on Twitter
                    </button>
                    <button
                      onClick={() => handleShare('linkedin')}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-50 transition-colors text-left font-bold"
                    >
                      <Linkedin className="w-5 h-5 text-blue-700" />
                      Share on LinkedIn
                    </button>
                    <button
                      onClick={handleCopyLink}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-amber-50 transition-colors text-left font-bold"
                    >
                      {copied ? (
                        <>
                          <Check className="w-5 h-5 text-green-600" />
                          Link Copied!
                        </>
                      ) : (
                        <>
                          <Link2 className="w-5 h-5 text-amber-900" />
                          Copy Link
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Featured Image */}
        {post.featured_image && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="relative h-[500px] rounded-2xl overflow-hidden border-4 border-amber-900 mb-12"
          >
            <Image
              src={post.featured_image}
              alt={post.title}
              fill
              className="object-cover"
              priority
            />
          </motion.div>
        )}

        {/* Article Content */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="prose prose-lg prose-stone max-w-none mb-12"
          style={{ fontFamily: 'Georgia, serif' }}
        >
          <div 
            className="text-lg leading-relaxed text-stone-800"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </motion.div>

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="mb-12 pb-12 border-b-4 border-amber-900">
            <div className="flex items-center gap-2 mb-4">
              <Tag className="w-5 h-5 text-amber-900" />
              <h3 className="text-xl font-black text-amber-900">Tags</h3>
            </div>
            <div className="flex flex-wrap gap-3">
              {post.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/blog?search=${encodeURIComponent(tag)}`}
                  className="bg-amber-100 hover:bg-amber-200 text-amber-900 px-4 py-2 rounded-lg font-bold transition-colors"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Author Bio */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-4 border-amber-900 rounded-2xl p-8 mb-12">
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 bg-amber-900 rounded-full flex items-center justify-center text-amber-50 font-black text-2xl flex-shrink-0">
              {post.author.charAt(0)}
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-black text-amber-900 mb-2" style={{ fontFamily: 'Georgia, serif' }}>
                About {post.author}
              </h3>
              <p className="text-stone-700 leading-relaxed font-medium">
                A passionate writer and agricultural expert dedicated to sharing knowledge 
                about sustainable farming practices and innovations in the agricultural sector.
              </p>
            </div>
          </div>
        </div>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-8">
              <TrendingUp className="w-8 h-8 text-amber-900" />
              <h2 className="text-3xl font-black text-amber-900" style={{ fontFamily: 'Georgia, serif' }}>
                Related Articles
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {relatedPosts.map((relatedPost) => (
                <Link key={relatedPost.id} href={`/blog/${relatedPost.slug}`}>
                  <div className="group bg-white border-4 border-amber-900 rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                    {relatedPost.featured_image && (
                      <div className="relative h-48 overflow-hidden">
                        <Image
                          src={relatedPost.featured_image}
                          alt={relatedPost.title}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      </div>
                    )}
                    <div className="p-6">
                      <div className="bg-amber-100 text-amber-900 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider inline-block mb-3">
                        {relatedPost.category}
                      </div>
                      <h3 className="text-xl font-black text-amber-900 mb-2 line-clamp-2 group-hover:text-amber-700 transition-colors" style={{ fontFamily: 'Georgia, serif' }}>
                        {relatedPost.title}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-stone-500">
                        <Clock className="w-4 h-4" />
                        <span className="font-semibold">{relatedPost.reading_time} min</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>

      {/* Bottom CTA */}
      <div className="bg-gradient-to-br from-amber-900 to-orange-800 border-t-4 border-amber-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-4xl font-black text-amber-50 mb-4" style={{ fontFamily: 'Georgia, serif' }}>
            Enjoyed this article?
          </h2>
          <p className="text-xl text-amber-100 mb-8 font-medium">
            Explore more stories and insights from our journal
          </p>
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 bg-amber-50 text-amber-900 px-8 py-4 rounded-xl font-black text-lg hover:bg-white transition-colors"
          >
            Browse All Articles
            <ArrowLeft className="w-5 h-5 rotate-180" />
          </Link>
        </div>
      </div>
    </div>
  );
}