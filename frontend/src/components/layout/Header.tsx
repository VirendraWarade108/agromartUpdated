'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, User, Heart, Search, Menu, X, Leaf, Phone, Mail, MapPin, ChevronDown } from 'lucide-react';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [cartCount] = useState(3);

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Products', href: '/products' },
    { name: 'About', href: '/about' },
    { name: 'Blog', href: '/blog' },
    { name: 'Contact', href: '/contact' }
  ];

  const vendorLinks = [
    { name: 'For Wholesalers', href: '/vendor/register', highlight: true },
    { name: 'Vendor Login', href: '/vendor/login' }
  ];

  const categories = [
    { name: 'Seeds', href: '/categories/seeds', icon: '🌱', color: 'hover:bg-green-50' },
    { name: 'Fertilizers', href: '/categories/fertilizers', icon: '🧪', color: 'hover:bg-blue-50' },
    { name: 'Equipment', href: '/categories/equipment', icon: '🚜', color: 'hover:bg-orange-50' },
    { name: 'Pesticides', href: '/categories/pesticides', icon: '🛡️', color: 'hover:bg-purple-50' },
    { name: 'Irrigation', href: '/categories/irrigation', icon: '💧', color: 'hover:bg-cyan-50' },
    { name: 'Tools', href: '/categories/tools', icon: '🔧', color: 'hover:bg-yellow-50' }
  ];

  return (
    <>
      {/* Top Bar */}
      <div className="bg-green-600 text-white py-2 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between text-sm font-semibold gap-2">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              <span>1800-123-4567</span>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <Mail className="w-4 h-4" />
              <span>support@agromart.com</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            <span>Free Delivery Pan India</span>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-50 bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Leaf className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-gray-900">AgroMart</h1>
                <p className="text-xs text-green-600 font-bold">Grow Your Future</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-gray-700 hover:text-green-600 font-bold text-base transition-colors relative group"
                >
                  {link.name}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-green-600 group-hover:w-full transition-all duration-300"></span>
                </Link>
              ))}

              {/* Vendor Link */}
              <Link
                href="/vendor/register"
                className="text-orange-600 hover:text-orange-700 font-bold text-base transition-colors relative group"
              >
                Sell with Us
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-orange-600 group-hover:w-full transition-all duration-300"></span>
              </Link>
              
              {/* Categories Dropdown */}
              <div className="relative">
                <button
                  onMouseEnter={() => setIsCategoriesOpen(true)}
                  onMouseLeave={() => setIsCategoriesOpen(false)}
                  className="flex items-center gap-2 text-gray-700 hover:text-green-600 font-bold text-base transition-colors relative group"
                >
                  Categories
                  <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isCategoriesOpen ? 'rotate-180' : ''}`} />
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-green-600 group-hover:w-full transition-all duration-300"></span>
                </button>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {isCategoriesOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                      onMouseEnter={() => setIsCategoriesOpen(true)}
                      onMouseLeave={() => setIsCategoriesOpen(false)}
                      className="absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border-2 border-gray-200 overflow-hidden z-50"
                    >
                      <div className="py-2">
                        {categories.map((category) => (
                          <Link
                            key={category.name}
                            href={category.href}
                            className={`flex items-center gap-3 px-6 py-3 ${category.color} transition-colors`}
                          >
                            <span className="text-2xl">{category.icon}</span>
                            <span className="font-bold text-gray-900">{category.name}</span>
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-4">
              {/* Search */}
              <button className="hidden md:flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                <Search className="w-5 h-5 text-gray-600" />
              </button>

              {/* Wishlist */}
              <Link 
                href="/dashboard/wishlist"
                className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Heart className="w-6 h-6 text-gray-700" />
              </Link>

              {/* Cart */}
              <Link 
                href="/cart"
                className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ShoppingCart className="w-6 h-6 text-gray-700" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* User */}
              <Link 
                href="/auth/login"
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-lg transition-all hover:scale-105 shadow-lg"
              >
                <User className="w-5 h-5" />
                <span>Login</span>
              </Link>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {isMenuOpen ? (
                  <X className="w-6 h-6 text-gray-700" />
                ) : (
                  <Menu className="w-6 h-6 text-gray-700" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="lg:hidden border-t border-gray-200 overflow-hidden"
            >
              <nav className="px-4 py-4 space-y-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setIsMenuOpen(false)}
                    className="block px-4 py-3 text-gray-700 hover:bg-green-50 hover:text-green-600 font-bold rounded-lg transition-colors"
                  >
                    {link.name}
                  </Link>
                ))}

                {/* Vendor Links Mobile */}
                <div className="pt-2 border-t border-gray-200">
                  <p className="px-4 py-2 text-sm font-black text-gray-900">For Sellers</p>
                  {vendorLinks.map((link) => (
                    <Link
                      key={link.name}
                      href={link.href}
                      onClick={() => setIsMenuOpen(false)}
                      className={`block px-4 py-3 font-bold rounded-lg transition-colors ${
                        link.highlight
                          ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                          : 'text-gray-700 hover:bg-orange-50 hover:text-orange-600'
                      }`}
                    >
                      {link.name}
                    </Link>
                  ))}
                </div>
                
                {/* Mobile Categories */}
                <div className="pt-2 border-t border-gray-200">
                  <p className="px-4 py-2 text-sm font-black text-gray-900">Categories</p>
                  {categories.map((category) => (
                    <Link
                      key={category.name}
                      href={category.href}
                      onClick={() => setIsMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 ${category.color} rounded-lg transition-colors`}
                    >
                      <span className="text-xl">{category.icon}</span>
                      <span className="font-bold text-gray-900">{category.name}</span>
                    </Link>
                  ))}
                </div>

                <Link
                  href="/auth/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-lg text-center"
                >
                  Login / Register
                </Link>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}