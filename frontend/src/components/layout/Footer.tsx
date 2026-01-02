'use client';

import Link from 'next/link';
import { Leaf, Facebook, Twitter, Instagram, Youtube, Linkedin, Mail, Phone, MapPin, ArrowRight } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    company: [
      { name: 'About Us', href: '/about' },
      { name: 'Our Story', href: '/about' },
      { name: 'Careers', href: '#' },
      { name: 'Press', href: '#' },
      { name: 'Blog', href: '/blog' }
    ],
    shop: [
      { name: 'Seeds', href: '/categories/seeds' },
      { name: 'Fertilizers', href: '/categories/fertilizers' },
      { name: 'Equipment', href: '/categories/equipment' },
      { name: 'Pesticides', href: '/categories/pesticides' },
      { name: 'All Products', href: '/products' }
    ],
    support: [
      { name: 'Contact Us', href: '/contact' },
      { name: 'FAQs', href: '#' },
      { name: 'Shipping Info', href: '#' },
      { name: 'Returns', href: '#' },
      { name: 'Track Order', href: '/orders' }
    ],
    legal: [
      { name: 'Privacy Policy', href: '#' },
      { name: 'Terms of Service', href: '#' },
      { name: 'Refund Policy', href: '#' },
      { name: 'Cookie Policy', href: '#' }
    ]
  };

  const socialLinks = [
    { icon: Facebook, href: '#', color: 'hover:bg-blue-600' },
    { icon: Twitter, href: '#', color: 'hover:bg-sky-500' },
    { icon: Instagram, href: '#', color: 'hover:bg-pink-600' },
    { icon: Youtube, href: '#', color: 'hover:bg-red-600' },
    { icon: Linkedin, href: '#', color: 'hover:bg-blue-700' }
  ];

  const paymentMethods = ['💳 Visa', '💳 Mastercard', '📱 UPI', '💰 Cash on Delivery', '🏦 Net Banking'];

  return (
    <footer className="bg-gradient-to-br from-slate-900 via-green-900 to-slate-900 text-white">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-6 group">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Leaf className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-black">AgroMart</h2>
                <p className="text-sm text-green-300 font-bold">Grow Your Future</p>
              </div>
            </Link>
            <p className="text-gray-300 mb-6 leading-relaxed font-medium">
              India's most trusted agriculture marketplace. Providing quality seeds, fertilizers, and farming equipment to over 50,000+ farmers nationwide.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-green-400 flex-shrink-0" />
                <span className="text-gray-300 font-semibold">1800-123-4567</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-green-400 flex-shrink-0" />
                <span className="text-gray-300 font-semibold">support@agromart.com</span>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-green-400 flex-shrink-0 mt-1" />
                <span className="text-gray-300 font-semibold">123 Agriculture Hub, New Delhi, India 110001</span>
              </div>
            </div>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="text-lg font-black text-white mb-6 border-b-2 border-green-500 pb-2 inline-block">Company</h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.href}
                    className="text-gray-300 hover:text-green-400 font-medium transition-colors flex items-center gap-2 group"
                  >
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Shop Links */}
          <div>
            <h3 className="text-lg font-black text-white mb-6 border-b-2 border-green-500 pb-2 inline-block">Shop</h3>
            <ul className="space-y-3">
              {footerLinks.shop.map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.href}
                    className="text-gray-300 hover:text-green-400 font-medium transition-colors flex items-center gap-2 group"
                  >
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="text-lg font-black text-white mb-6 border-b-2 border-green-500 pb-2 inline-block">Support</h3>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.href}
                    className="text-gray-300 hover:text-green-400 font-medium transition-colors flex items-center gap-2 group"
                  >
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="text-lg font-black text-white mb-6 border-b-2 border-green-500 pb-2 inline-block">Legal</h3>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.href}
                    className="text-gray-300 hover:text-green-400 font-medium transition-colors flex items-center gap-2 group"
                  >
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Newsletter Section */}
        <div className="mt-16 pt-12 border-t-2 border-white/10">
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="text-3xl font-black text-white mb-4">Stay Updated</h3>
            <p className="text-gray-300 mb-6 font-medium">Subscribe to our newsletter for the latest offers, farming tips, and product updates.</p>
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-6 py-4 bg-white/10 backdrop-blur-xl border-2 border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-green-400 font-medium transition-all"
              />
              <button className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-xl text-white font-bold transition-all hover:scale-105 shadow-lg">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* Social Links */}
        <div className="mt-12 flex justify-center gap-4">
          {socialLinks.map((social, idx) => (
            <a
              key={idx}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`w-12 h-12 bg-white/10 backdrop-blur-xl border-2 border-white/20 rounded-xl flex items-center justify-center ${social.color} transition-all hover:scale-110`}
            >
              <social.icon className="w-5 h-5" />
            </a>
          ))}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t-2 border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            {/* Copyright */}
            <p className="text-gray-400 text-sm font-medium text-center md:text-left">
              © {currentYear} AgroMart. All rights reserved. Made with ❤️ for Indian Farmers.
            </p>

            {/* Payment Methods */}
            <div className="flex flex-wrap justify-center gap-4">
              {paymentMethods.map((method, idx) => (
                <div
                  key={idx}
                  className="px-4 py-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg text-sm font-bold text-gray-300"
                >
                  {method}
                </div>
              ))}
            </div>
          </div>

          {/* Trust Badges */}
          <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm">
            <div className="flex items-center gap-2 text-gray-400 font-semibold">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              SSL Secured
            </div>
            <div className="flex items-center gap-2 text-gray-400 font-semibold">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              100% Genuine Products
            </div>
            <div className="flex items-center gap-2 text-gray-400 font-semibold">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              Free Pan India Delivery
            </div>
            <div className="flex items-center gap-2 text-gray-400 font-semibold">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              24/7 Customer Support
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}