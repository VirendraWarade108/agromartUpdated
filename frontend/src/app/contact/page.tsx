'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Clock, Send, MessageCircle, User, Building, CheckCircle, Facebook, Twitter, Instagram, Linkedin, Youtube } from 'lucide-react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const contactInfo = [
    {
      icon: Phone,
      title: 'Call Us',
      details: ['1800-123-4567 (Toll Free)', '+91 11 2345 6789'],
      color: 'from-blue-500 to-cyan-600'
    },
    {
      icon: Mail,
      title: 'Email Us',
      details: ['support@agromart.com', 'sales@agromart.com'],
      color: 'from-green-500 to-emerald-600'
    },
    {
      icon: MapPin,
      title: 'Visit Us',
      details: ['123 Agriculture Hub', 'New Delhi, India 110001'],
      color: 'from-purple-500 to-pink-600'
    },
    {
      icon: Clock,
      title: 'Working Hours',
      details: ['Mon - Sat: 9:00 AM - 6:00 PM', 'Sunday: Closed'],
      color: 'from-orange-500 to-red-600'
    }
  ];

  const faqs = [
    { question: 'What are your delivery charges?', answer: 'Free delivery on all orders above ₹5000. For orders below ₹5000, delivery charges are ₹200.' },
    { question: 'Do you ship pan-India?', answer: 'Yes, we deliver to all states across India. Delivery typically takes 3-7 business days.' },
    { question: 'What is your return policy?', answer: 'We offer 7-day easy returns on most products. Products must be unused and in original packaging.' },
    { question: 'Are your products genuine?', answer: 'Yes, we guarantee 100% genuine products. All items are sourced directly from authorized manufacturers.' }
  ];

  const socialLinks = [
    { icon: Facebook, href: '#', label: 'Facebook', color: 'hover:bg-blue-600' },
    { icon: Twitter, href: '#', label: 'Twitter', color: 'hover:bg-sky-500' },
    { icon: Instagram, href: '#', label: 'Instagram', color: 'hover:bg-pink-600' },
    { icon: Linkedin, href: '#', label: 'LinkedIn', color: 'hover:bg-blue-700' },
    { icon: Youtube, href: '#', label: 'YouTube', color: 'hover:bg-red-600' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900">
      {/* Hero Section */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 opacity-40">
          <div className="absolute w-96 h-96 bg-green-500/30 rounded-full blur-3xl top-20 left-10 animate-pulse"></div>
          <div className="absolute w-96 h-96 bg-blue-500/30 rounded-full blur-3xl bottom-20 right-10 animate-pulse"></div>
        </div>

        <div className="relative max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-green-500/20 backdrop-blur-xl border-2 border-green-400/40 mb-8 shadow-lg">
              <MessageCircle className="w-5 h-5 text-green-300" />
              <span className="text-green-100 font-bold text-sm">WE'RE HERE TO HELP</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white mb-6 leading-tight">
              Get in Touch
            </h1>
            <p className="text-xl sm:text-2xl text-gray-200 max-w-3xl mx-auto leading-relaxed font-medium">
              Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="relative py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {contactInfo.map((info, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="relative group"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${info.color} rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-all duration-300`}></div>
                <div className="relative p-8 bg-white rounded-3xl border-2 border-gray-200 group-hover:border-green-400 transition-all duration-300 shadow-xl text-center h-full">
                  <div className={`w-16 h-16 bg-gradient-to-br ${info.color} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg`}>
                    <info.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-black text-gray-900 mb-3">{info.title}</h3>
                  {info.details.map((detail, i) => (
                    <p key={i} className="text-gray-700 font-semibold text-sm leading-relaxed">
                      {detail}
                    </p>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form & Map */}
      <section className="relative py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-3xl border-2 border-gray-200 shadow-2xl p-8"
            >
              <h2 className="text-3xl font-black text-gray-900 mb-6">Send us a Message</h2>
              
              {submitted ? (
                <div className="py-16 text-center">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 mb-3">Message Sent!</h3>
                  <p className="text-gray-600 font-semibold">We'll get back to you within 24 hours.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      Your Name *
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Enter your name"
                        required
                        className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-400 font-semibold text-gray-900 transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-2">
                        Email Address *
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="your@email.com"
                          required
                          className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-400 font-semibold text-gray-900 transition-all"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-2">
                        Phone Number
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="+91 98765 43210"
                          className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-400 font-semibold text-gray-900 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      Subject *
                    </label>
                    <div className="relative">
                      <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <select
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                        className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-400 font-semibold text-gray-900 transition-all appearance-none cursor-pointer"
                      >
                        <option value="">Select a subject</option>
                        <option value="product">Product Inquiry</option>
                        <option value="order">Order Status</option>
                        <option value="support">Technical Support</option>
                        <option value="partnership">Partnership</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      Your Message *
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Tell us how we can help you..."
                      required
                      rows={6}
                      className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-400 font-semibold text-gray-900 transition-all resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-black text-lg rounded-2xl shadow-2xl hover:scale-105 transition-all flex items-center justify-center gap-2"
                  >
                    <Send className="w-5 h-5" />
                    Send Message
                  </button>
                </form>
              )}
            </motion.div>

            {/* Map & Social */}
            <div className="space-y-8">
              {/* Map */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="bg-white rounded-3xl border-2 border-gray-200 shadow-2xl overflow-hidden"
              >
                <div className="h-80 bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="w-16 h-16 text-green-600 mx-auto mb-4" />
                    <h3 className="text-2xl font-black text-gray-900 mb-2">Visit Our Office</h3>
                    <p className="text-gray-700 font-semibold">123 Agriculture Hub</p>
                    <p className="text-gray-700 font-semibold">New Delhi, India 110001</p>
                  </div>
                </div>
              </motion.div>

              {/* Social Links */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="bg-white rounded-3xl border-2 border-gray-200 shadow-2xl p-8"
              >
                <h3 className="text-2xl font-black text-gray-900 mb-6">Connect With Us</h3>
                <div className="flex flex-wrap gap-4">
                  {socialLinks.map((social, idx) => (
                    <a
                      key={idx}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-3 px-6 py-3 bg-gray-100 ${social.color} text-gray-900 hover:text-white rounded-xl font-bold transition-all hover:scale-110 shadow-lg`}
                      aria-label={social.label}
                    >
                      <social.icon className="w-5 h-5" />
                      <span>{social.label}</span>
                    </a>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">Frequently Asked Questions</h2>
            <p className="text-xl text-gray-300 font-medium">Quick answers to common questions</p>
          </motion.div>

          <div className="space-y-6">
            {faqs.map((faq, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white rounded-2xl border-2 border-gray-200 shadow-xl p-8 hover:border-green-400 transition-all"
              >
                <h3 className="text-xl font-black text-gray-900 mb-3 flex items-start gap-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                    Q
                  </span>
                  {faq.question}
                </h3>
                <p className="text-gray-700 font-semibold leading-relaxed pl-11">
                  {faq.answer}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
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
              <h2 className="text-4xl font-black text-white mb-4">Still Have Questions?</h2>
              <p className="text-xl text-gray-200 mb-8 font-medium">
                Our customer support team is always ready to help you
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <a
                  href="tel:18001234567"
                  className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-2xl shadow-2xl hover:scale-105 transition-all flex items-center justify-center gap-2"
                >
                  <Phone className="w-5 h-5" />
                  Call Us Now
                </a>
                <a
                  href="mailto:support@agromart.com"
                  className="px-8 py-4 bg-white/10 backdrop-blur-xl border-2 border-white/30 text-white font-bold rounded-2xl hover:bg-white/20 transition-all flex items-center justify-center gap-2"
                >
                  <Mail className="w-5 h-5" />
                  Email Us
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}