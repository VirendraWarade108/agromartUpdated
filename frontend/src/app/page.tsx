'use client';

import { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ShoppingCart, Search, Leaf, TrendingUp, Shield, Truck, Clock, Star, ArrowRight, Sparkles, ChevronRight, Package, Users, Award, Zap } from 'lucide-react';

export default function HomePage() {
  const [scrollY, setScrollY] = useState(0);
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.8]);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const categories = [
    { name: 'Seeds', icon: '🌱', color: 'from-green-500 to-emerald-600', count: '500+' },
    { name: 'Fertilizers', icon: '🧪', color: 'from-blue-500 to-cyan-600', count: '300+' },
    { name: 'Equipment', icon: '🚜', color: 'from-orange-500 to-red-600', count: '200+' },
    { name: 'Pesticides', icon: '🛡️', color: 'from-purple-500 to-pink-600', count: '150+' },
    { name: 'Irrigation', icon: '💧', color: 'from-cyan-500 to-blue-600', count: '180+' },
    { name: 'Tools', icon: '🔧', color: 'from-yellow-500 to-orange-600', count: '250+' }
  ];

  const featuredProducts = [
    { id: 1, name: 'Premium Hybrid Seeds', price: 2499, rating: 4.8, image: '🌾', sales: 1200, discount: 20 },
    { id: 2, name: 'Organic Fertilizer Pro', price: 1899, rating: 4.9, image: '🌿', sales: 890, discount: 15 },
    { id: 3, name: 'Smart Irrigation Kit', price: 8999, rating: 4.7, image: '💦', sales: 650, discount: 25 },
    { id: 4, name: 'Power Tiller Machine', price: 45999, rating: 4.6, image: '⚙️', sales: 320, discount: 10 }
  ];

  const testimonials = [
    { name: 'Rajesh Kumar', location: 'Punjab', text: 'Best quality seeds and equipment. My yield increased by 40%!', rating: 5, avatar: '👨‍🌾' },
    { name: 'Priya Sharma', location: 'Maharashtra', text: 'Fast delivery and genuine products. Highly recommended!', rating: 5, avatar: '👩‍🌾' },
    { name: 'Anil Patel', location: 'Gujarat', text: 'Affordable prices and excellent customer service.', rating: 5, avatar: '👨' }
  ];

  const stats = [
    { label: 'Happy Farmers', value: '50K+', icon: Users, color: 'text-green-400' },
    { label: 'Products', value: '1500+', icon: Package, color: 'text-blue-400' },
    { label: 'Years Experience', value: '15+', icon: Award, color: 'text-purple-400' },
    { label: 'Daily Orders', value: '500+', icon: TrendingUp, color: 'text-orange-400' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900 overflow-hidden">
      {/* Hero Section - Improved Contrast & Hierarchy */}
      <motion.section 
        style={{ opacity, scale }}
        className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8"
      >
        {/* Animated Background - Slightly Dimmed */}
        <div className="absolute inset-0 overflow-hidden opacity-60">
          <div className="absolute w-96 h-96 bg-green-500/20 rounded-full blur-3xl animate-pulse top-20 left-10"></div>
          <div className="absolute w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse bottom-20 right-10 animation-delay-2000"></div>
          <div className="absolute w-64 h-64 bg-purple-500/20 rounded-full blur-3xl animate-pulse top-1/2 left-1/2 animation-delay-4000"></div>
        </div>

        <div className="relative z-10 max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
            {/* Trust Badge */}
            <div className="mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-green-500/20 backdrop-blur-xl border-2 border-green-400/40 mb-8 shadow-lg shadow-green-500/20">
              <Sparkles className="w-5 h-5 text-green-300" />
              <span className="text-green-100 font-bold text-sm tracking-wide">INDIA'S #1 AGRICULTURE MARKETPLACE</span>
            </div>
            
            {/* Hero Headline - Improved Hierarchy & Contrast */}
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-2xl rounded-3xl -z-10"></div>
              <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black text-white mb-4 leading-tight px-8 py-6">
                Grow Your Farm
              </h1>
            </div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-8 leading-tight">
              <span className="bg-gradient-to-r from-green-300 via-emerald-300 to-cyan-300 text-transparent bg-clip-text drop-shadow-2xl">
                Grow Your Future
              </span>
            </h2>
            
            <p className="text-xl sm:text-2xl text-gray-200 mb-12 max-w-3xl mx-auto leading-relaxed font-medium">
              Premium quality seeds, fertilizers, and equipment delivered to your doorstep. Trusted by 50,000+ farmers across India.
            </p>

            {/* Search Bar - Improved Contrast & Accessibility */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="max-w-2xl mx-auto mb-12"
            >
              <label htmlFor="hero-search" className="sr-only">Search for seeds, fertilizers, equipment</label>
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300 opacity-60 group-focus-within:opacity-80"></div>
                <div className="relative flex items-center bg-white rounded-2xl border-2 border-transparent focus-within:border-green-400 overflow-hidden shadow-2xl transition-all duration-300">
                  <Search className="absolute left-6 w-6 h-6 text-gray-500" />
                  <input
                    id="hero-search"
                    type="text"
                    placeholder="Search for seeds, fertilizers, equipment..."
                    className="w-full pl-16 pr-6 py-5 bg-white text-gray-900 placeholder-gray-500 focus:outline-none text-lg font-medium"
                    aria-label="Search products"
                  />
                  <button 
                    className="m-2 px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-xl text-white font-bold transition-all duration-300 hover:scale-105 flex items-center gap-2 shadow-lg focus:outline-none focus:ring-4 focus:ring-green-400/50"
                    aria-label="Search"
                  >
                    Search
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>

            {/* CTA Buttons - Primary CTA Dominant */}
            <div className="flex flex-wrap justify-center gap-6 mb-16">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-12 py-5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-2xl text-white font-black text-xl shadow-2xl shadow-green-600/60 flex items-center gap-3 border-2 border-green-400 focus:outline-none focus:ring-4 focus:ring-green-400/50 transition-all"
              >
                <ShoppingCart className="w-7 h-7" />
                Shop Now
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-10 py-5 bg-transparent backdrop-blur-xl hover:bg-white/10 rounded-2xl text-white font-bold text-lg border-2 border-white/40 hover:border-white/60 flex items-center gap-3 focus:outline-none focus:ring-4 focus:ring-white/30 transition-all"
              >
                <Leaf className="w-6 h-6" />
                Learn More
              </motion.button>
            </div>
          </motion.div>

          {/* Trust Badges - Improved Contrast */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="flex flex-wrap justify-center gap-6"
          >
            {[
              { icon: Shield, text: '100% Genuine' },
              { icon: Truck, text: 'Free Delivery' },
              { icon: Clock, text: '24/7 Support' },
              { icon: Award, text: 'Top Rated' }
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 px-8 py-4 bg-slate-900/70 backdrop-blur-xl rounded-xl border-2 border-white/20 shadow-lg">
                <item.icon className="w-6 h-6 text-green-300" />
                <span className="text-white font-bold text-base">{item.text}</span>
              </div>
            ))}
          </motion.div>
        </div>


      </motion.section>

      {/* Stats Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                <div className="relative p-8 bg-slate-900/50 backdrop-blur-2xl rounded-3xl border-2 border-white/20 hover:border-white/30 transition-all duration-300 text-center shadow-xl">
                  <stat.icon className={`w-12 h-12 ${stat.color} mx-auto mb-4`} />
                  <div className="text-4xl font-black text-white mb-2">{stat.value}</div>
                  <div className="text-gray-300 font-semibold">{stat.label}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section - Improved Icon Size & Contrast */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-black text-white mb-4">Shop by Category</h2>
            <p className="text-xl text-gray-300 font-medium">Everything you need for modern farming</p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {categories.map((cat, idx) => (
              <motion.button
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="relative group cursor-pointer focus:outline-none focus:ring-4 focus:ring-green-400/50 rounded-3xl"
                aria-label={`Browse ${cat.name}`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${cat.color} rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-all duration-300`}></div>
                <div className="relative p-8 bg-slate-900/60 backdrop-blur-2xl rounded-3xl border-2 border-white/20 group-hover:border-white/40 transition-all duration-300 text-center">
                  <div className="text-7xl mb-4 drop-shadow-2xl">{cat.icon}</div>
                  <h3 className="text-xl font-bold text-white mb-2">{cat.name}</h3>
                  <p className="text-green-300 font-bold text-sm">{cat.count} Items</p>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products - Improved Card Contrast & Hierarchy */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex justify-between items-center mb-16"
          >
            <div>
              <h2 className="text-5xl font-black text-white mb-4">Featured Products</h2>
              <p className="text-xl text-gray-300 font-medium">Top picks for this season</p>
            </div>
            <button className="hidden md:flex items-center gap-2 px-6 py-3 bg-slate-900/60 backdrop-blur-xl rounded-xl border-2 border-white/30 text-white font-bold hover:bg-white/10 hover:border-white/50 transition-all focus:outline-none focus:ring-4 focus:ring-white/30">
              View All
              <ChevronRight className="w-5 h-5" />
            </button>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredProducts.map((product, idx) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ y: -10 }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                <div className="relative bg-white rounded-3xl border-2 border-gray-200 group-hover:border-green-400 overflow-hidden transition-all duration-300 shadow-xl">
                  {product.discount > 0 && (
                    <div className="absolute top-4 right-4 z-10 px-4 py-2 bg-red-600 rounded-xl text-white text-sm font-black shadow-lg">
                      -{product.discount}%
                    </div>
                  )}
                  <div className="p-8 text-center bg-gradient-to-br from-gray-50 to-white">
                    <div className="text-8xl mb-4 drop-shadow-lg">{product.image}</div>
                  </div>
                  <div className="p-6 bg-white">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1 bg-yellow-50 px-3 py-1 rounded-lg">
                        <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                        <span className="text-gray-900 font-bold text-sm">{product.rating}</span>
                      </div>
                      <div className="text-gray-600 text-sm font-semibold">{product.sales} sold</div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4 min-h-[3rem]">{product.name}</h3>
                    <div className="flex items-baseline gap-2 mb-4">
                      <div className="text-3xl font-black text-green-600">₹{product.price}</div>
                      {product.discount > 0 && (
                        <div className="text-lg text-gray-400 line-through font-semibold">₹{Math.round(product.price / (1 - product.discount / 100))}</div>
                      )}
                    </div>
                    <button className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-xl text-white font-bold flex items-center justify-center gap-2 transition-all duration-300 group-hover:scale-105 shadow-lg focus:outline-none focus:ring-4 focus:ring-green-400/50">
                      <ShoppingCart className="w-5 h-5" />
                      Add to Cart
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials - Improved Readability */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-black text-white mb-4">What Farmers Say</h2>
            <p className="text-xl text-gray-300 font-medium">Trusted by thousands across India</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-blue-500/10 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                <div className="relative p-8 bg-white rounded-3xl border-2 border-gray-200 group-hover:border-green-400 transition-all duration-300 shadow-xl">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-yellow-500 text-yellow-500" />
                    ))}
                  </div>
                  <p className="text-gray-700 text-lg mb-6 leading-relaxed font-medium">"{testimonial.text}"</p>
                  <div className="flex items-center gap-4 pt-4 border-t-2 border-gray-100">
                    <div className="text-5xl">{testimonial.avatar}</div>
                    <div>
                      <div className="font-bold text-gray-900 text-lg">{testimonial.name}</div>
                      <div className="text-gray-600 text-sm font-semibold">{testimonial.location}</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-3xl blur-2xl opacity-40"></div>
            <div className="relative p-12 bg-slate-900/70 backdrop-blur-2xl rounded-3xl border-2 border-white/30 text-center shadow-2xl">
              <Zap className="w-16 h-16 text-yellow-400 mx-auto mb-6 drop-shadow-lg" />
              <h2 className="text-4xl font-black text-white mb-4">Get Exclusive Deals</h2>
              <p className="text-xl text-gray-200 mb-8 font-medium">Subscribe to our newsletter for latest offers and farming tips</p>
              <div className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-6 py-4 bg-white rounded-xl border-2 border-transparent focus:border-green-400 text-gray-900 placeholder-gray-500 focus:outline-none font-medium shadow-lg transition-all"
                  aria-label="Email address"
                />
                <button className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-xl text-white font-bold transition-all duration-300 hover:scale-105 shadow-lg focus:outline-none focus:ring-4 focus:ring-green-400/50">
                  Subscribe
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}