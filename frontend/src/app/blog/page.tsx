'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, User, Clock, Eye, Heart, BookOpen, Tag, TrendingUp, ArrowRight } from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featured_image: string;
  category: string;
  author: string;
  published_at: string;
  reading_time: number;
  views: number;
  likes: number;
}

export default function BlogPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'All Posts', count: 24 },
    { id: 'farming-tips', name: 'Farming Tips', count: 8 },
    { id: 'crop-guide', name: 'Crop Guide', count: 6 },
    { id: 'technology', name: 'Technology', count: 5 },
    { id: 'success-stories', name: 'Success Stories', count: 3 },
    { id: 'news', name: 'Industry News', count: 2 }
  ];

  const featuredPost = {
    id: 1,
    title: 'Complete Guide to Organic Farming: Best Practices for 2024',
    excerpt: 'Learn the essential techniques and methods for successful organic farming. From soil preparation to harvest, we cover everything you need to know.',
    author: 'Dr. Amit Sharma',
    date: '2024-11-20',
    category: 'Farming Tips',
    image: '🌾',
    readTime: '12 min read',
    views: 2450,
    likes: 156
  };

  const blogPosts = [
    {
      id: 2,
      title: 'How to Increase Crop Yield Using Modern Techniques',
      excerpt: 'Discover proven methods to boost your agricultural productivity with smart farming techniques.',
      author: 'Priya Verma',
      date: '2024-11-18',
      category: 'Technology',
      image: '🚜',
      readTime: '8 min read',
      views: 1820,
      likes: 98
    },
    {
      id: 3,
      title: 'Monsoon Preparation: Essential Steps for Farmers',
      excerpt: 'Get your farm ready for the monsoon season with our comprehensive preparation checklist.',
      author: 'Rajesh Patel',
      date: '2024-11-15',
      category: 'Crop Guide',
      image: '🌧️',
      readTime: '6 min read',
      views: 1450,
      likes: 87
    },
    {
      id: 4,
      title: 'Success Story: How Ram Singh Doubled His Income',
      excerpt: 'An inspiring journey of a farmer who transformed his small farm into a profitable business.',
      author: 'Meera Singh',
      date: '2024-11-12',
      category: 'Success Stories',
      image: '🏆',
      readTime: '10 min read',
      views: 3200,
      likes: 245
    },
    {
      id: 5,
      title: 'Top 10 Seeds for Winter Planting in India',
      excerpt: 'Choose the best seeds for winter cultivation and maximize your harvest this season.',
      author: 'Dr. Suresh Kumar',
      date: '2024-11-10',
      category: 'Crop Guide',
      image: '🌱',
      readTime: '7 min read',
      views: 2100,
      likes: 132
    },
    {
      id: 6,
      title: 'Water Conservation Techniques for Sustainable Farming',
      excerpt: 'Learn effective irrigation methods that save water while maintaining crop health.',
      author: 'Anita Desai',
      date: '2024-11-08',
      category: 'Farming Tips',
      image: '💧',
      readTime: '9 min read',
      views: 1680,
      likes: 94
    },
    {
      id: 7,
      title: 'Understanding Soil Health and Nutrient Management',
      excerpt: 'A comprehensive guide to maintaining healthy soil for optimal crop production.',
      author: 'Dr. Vikram Reddy',
      date: '2024-11-05',
      category: 'Farming Tips',
      image: '🌍',
      readTime: '11 min read',
      views: 1920,
      likes: 118
    },
    {
      id: 8,
      title: 'Latest Agricultural Technology Trends in 2024',
      excerpt: 'Explore cutting-edge innovations that are revolutionizing modern agriculture.',
      author: 'Tech Agri Team',
      date: '2024-11-02',
      category: 'Technology',
      image: '🤖',
      readTime: '8 min read',
      views: 2800,
      likes: 201
    },
    {
      id: 9,
      title: 'Pest Control: Natural and Chemical Solutions',
      excerpt: 'Protect your crops with effective pest management strategies that work.',
      author: 'Dr. Kavita Joshi',
      date: '2024-10-30',
      category: 'Farming Tips',
      image: '🦗',
      readTime: '7 min read',
      views: 1550,
      likes: 89
    }
  ];

  const filteredPosts = blogPosts.filter(post => 
    (selectedCategory === 'all' || post.category.toLowerCase().replace(' ', '-') === selectedCategory) &&
    (searchQuery === '' || post.title.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const popularTags = ['Organic Farming', 'Irrigation', 'Crop Rotation', 'Fertilizers', 'Seeds', 'Technology', 'Sustainability'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900">
      {/* Hero Section */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 opacity-40">
          <div className="absolute w-96 h-96 bg-green-500/30 rounded-full blur-3xl top-20 left-10 animate-pulse"></div>
          <div className="absolute w-96 h-96 bg-blue-500/30 rounded-full blur-3xl bottom-20 right-10 animate-pulse"></div>
        </div>

        <div className="relative max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-green-500/20 backdrop-blur-xl border-2 border-green-400/40 mb-6 shadow-lg">
              <BookOpen className="w-5 h-5 text-green-300" />
              <span className="text-green-100 font-bold text-sm">AGROMART BLOG</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white mb-6 leading-tight">
              Farming Knowledge Hub
            </h1>
            <p className="text-xl text-gray-200 font-medium max-w-3xl mx-auto mb-8">
              Expert advice, practical tips, and inspiring stories from the world of agriculture
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300 opacity-60"></div>
                <div className="relative flex items-center bg-white rounded-2xl shadow-2xl overflow-hidden">
                  <Search className="absolute left-6 w-6 h-6 text-gray-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search articles..."
                    className="w-full pl-16 pr-6 py-5 bg-white text-gray-900 placeholder-gray-500 focus:outline-none text-lg font-medium"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="lg:w-80">
            <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-xl p-6 sticky top-24 space-y-8">
              {/* Categories */}
              <div>
                <h3 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
                  <Tag className="w-5 h-5 text-green-600" />
                  Categories
                </h3>
                <div className="space-y-2">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold transition-all ${
                        selectedCategory === cat.id
                          ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <span>{cat.name}</span>
                      <span className={`text-sm px-2 py-1 rounded-lg ${
                        selectedCategory === cat.id ? 'bg-white/20' : 'bg-gray-200'
                      }`}>
                        {cat.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Popular Tags */}
              <div>
                <h3 className="text-xl font-black text-gray-900 mb-4">Popular Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {popularTags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-2 bg-gray-100 hover:bg-green-100 text-gray-700 hover:text-green-700 text-sm font-bold rounded-lg transition-all cursor-pointer"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Newsletter */}
              <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-200">
                <h3 className="text-lg font-black text-gray-900 mb-2">Subscribe to Newsletter</h3>
                <p className="text-gray-700 text-sm font-semibold mb-4">Get the latest articles delivered to your inbox</p>
                <input
                  type="email"
                  placeholder="Your email"
                  className="w-full px-4 py-3 mb-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-400 font-semibold text-sm"
                />
                <button className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-xl transition-all">
                  Subscribe
                </button>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {/* Featured Post */}
            <div className="bg-white rounded-3xl border-2 border-gray-200 shadow-2xl overflow-hidden mb-12">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="p-8 md:p-12 flex flex-col justify-center">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm font-bold mb-4 self-start">
                    <TrendingUp className="w-4 h-4" />
                    Featured Article
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4 leading-tight">
                    {featuredPost.title}
                  </h2>
                  <p className="text-gray-700 font-semibold mb-6 leading-relaxed">
                    {featuredPost.excerpt}
                  </p>
                  <div className="flex items-center gap-6 mb-6">
                    <div className="flex items-center gap-2 text-gray-600">
                      <User className="w-4 h-4" />
                      <span className="text-sm font-semibold">{featuredPost.author}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm font-semibold">{featuredPost.readTime}</span>
                    </div>
                  </div>
                  <Link
                    href={`/blog/${featuredPost.id}`}
                    className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-xl transition-all shadow-lg self-start"
                  >
                    Read Article
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </div>
                <div className="bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center p-12">
                  <div className="text-9xl">{featuredPost.image}</div>
                </div>
              </div>
            </div>

            {/* Blog Grid */}
            <div className="mb-8">
              <h2 className="text-3xl font-black text-white mb-6">
                {selectedCategory === 'all' ? 'Latest Articles' : categories.find(c => c.id === selectedCategory)?.name}
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {filteredPosts.map((post, idx) => (
                <article
                  key={post.id}
                  className="bg-white rounded-2xl border-2 border-gray-200 hover:border-green-400 shadow-lg hover:shadow-2xl transition-all overflow-hidden group"
                >
                  <div className="p-8 bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center h-48">
                    <div className="text-7xl group-hover:scale-110 transition-transform">{post.image}</div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-lg">
                        {post.category}
                      </span>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span className="text-xs font-semibold">{post.readTime}</span>
                      </div>
                    </div>
                    <Link href={`/blog/${post.id}`}>
                      <h3 className="text-xl font-black text-gray-900 mb-3 group-hover:text-green-600 transition-colors leading-tight">
                        {post.title}
                      </h3>
                    </Link>
                    <p className="text-gray-700 font-semibold text-sm mb-4 line-clamp-2">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center justify-between pt-4 border-t-2 border-gray-100">
                      <div className="flex items-center gap-2 text-gray-600">
                        <User className="w-4 h-4" />
                        <span className="text-sm font-semibold">{post.author}</span>
                      </div>
                      <div className="flex items-center gap-4 text-gray-600">
                        <div className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          <span className="text-xs font-semibold">{post.views}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Heart className="w-4 h-4" />
                          <span className="text-xs font-semibold">{post.likes}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Pagination */}
            <div className="mt-12 flex justify-center">
              <div className="flex items-center gap-2 bg-white rounded-2xl border-2 border-gray-200 shadow-lg p-2">
                <button className="px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold text-gray-900 transition-all">
                  Previous
                </button>
                {[1, 2, 3, 4].map((page) => (
                  <button
                    key={page}
                    className={`w-12 h-12 rounded-xl font-bold transition-all ${
                      page === 1
                        ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg'
                        : 'bg-gray-50 text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button className="px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold text-gray-900 transition-all">
                  Next
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}