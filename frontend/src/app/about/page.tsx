'use client';

import { motion } from 'framer-motion';
import { Leaf, Target, Eye, Award, Users, TrendingUp, Heart, Shield, Truck, Clock, CheckCircle, Sprout, Globe, Zap } from 'lucide-react';

export default function AboutPage() {
  const values = [
    {
      icon: Heart,
      title: 'Customer First',
      description: 'We prioritize farmer satisfaction above everything else',
      color: 'from-red-500 to-pink-600'
    },
    {
      icon: Shield,
      title: 'Quality Assured',
      description: '100% genuine products with guaranteed authenticity',
      color: 'from-blue-500 to-cyan-600'
    },
    {
      icon: Leaf,
      title: 'Sustainability',
      description: 'Promoting eco-friendly and sustainable farming practices',
      color: 'from-green-500 to-emerald-600'
    },
    {
      icon: Zap,
      title: 'Innovation',
      description: 'Bringing modern technology to traditional farming',
      color: 'from-yellow-500 to-orange-600'
    }
  ];

  const milestones = [
    { year: '2009', title: 'Founded', description: 'Started with a vision to empower farmers' },
    { year: '2012', title: '1000+ Farmers', description: 'Reached our first thousand happy customers' },
    { year: '2016', title: 'Pan-India Delivery', description: 'Expanded operations across all states' },
    { year: '2020', title: '50,000+ Farmers', description: 'Became India\'s most trusted agro platform' },
    { year: '2024', title: 'Digital Revolution', description: 'Launched AI-powered farming solutions' }
  ];

  const stats = [
    { value: '50,000+', label: 'Happy Farmers', icon: Users, color: 'text-green-500' },
    { value: '1,500+', label: 'Products', icon: Package, color: 'text-blue-500' },
    { value: '28 States', label: 'Coverage', icon: Globe, color: 'text-purple-500' },
    { value: '15+ Years', label: 'Experience', icon: Award, color: 'text-orange-500' }
  ];

  const team = [
    { name: 'Rajesh Verma', role: 'Founder & CEO', avatar: '👨‍💼', description: 'Agricultural Engineer with 20+ years experience' },
    { name: 'Priya Sharma', role: 'Chief Operations Officer', avatar: '👩‍💼', description: 'Expert in supply chain & logistics' },
    { name: 'Anil Kumar', role: 'Head of Technology', avatar: '👨‍💻', description: 'Building India\'s smartest agro-tech platform' },
    { name: 'Meera Patel', role: 'Customer Success Lead', avatar: '👩‍🌾', description: 'Ensuring every farmer gets the best service' }
  ];

  const achievements = [
    'Best Agriculture E-commerce Platform 2023',
    'Startup India Recognition',
    'ISO 9001:2015 Certified',
    'Featured in Forbes India',
    'Winner - Digital Innovation Award 2024',
    'Partner with 200+ Agricultural Universities'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900">
      {/* Hero Section */}
      <section className="relative py-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
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
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-green-500/20 backdrop-blur-xl border-2 border-green-400/40 mb-8">
              <Leaf className="w-5 h-5 text-green-300" />
              <span className="text-green-100 font-bold text-sm">ABOUT AGROMART</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white mb-6 leading-tight">
              Empowering Farmers,
              <br />
              <span className="bg-gradient-to-r from-green-300 via-emerald-300 to-cyan-300 text-transparent bg-clip-text">
                Growing Together
              </span>
            </h1>

            <p className="text-xl sm:text-2xl text-gray-200 max-w-3xl mx-auto leading-relaxed font-medium">
              For over 15 years, we've been India's most trusted partner in agriculture, providing quality products and innovative solutions to farmers nationwide.
            </p>
          </motion.div>
        </div>
      </section>

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
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                <div className="relative p-8 bg-white rounded-3xl border-2 border-gray-200 group-hover:border-green-400 transition-all duration-300 text-center shadow-xl">
                  <stat.icon className={`w-12 h-12 ${stat.color} mx-auto mb-4`} />
                  <div className="text-4xl font-black text-gray-900 mb-2">{stat.value}</div>
                  <div className="text-gray-600 font-semibold">{stat.label}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative group h-full"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
              <div className="relative p-10 bg-white rounded-3xl border-2 border-gray-200 group-hover:border-green-400 transition-all duration-300 shadow-xl h-full flex flex-col">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                  <Target className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-black text-gray-900 mb-4">Our Mission</h2>
                <p className="text-gray-700 text-lg leading-relaxed font-medium flex-1">
                  To revolutionize Indian agriculture by providing farmers with easy access to quality products, modern technology, and expert knowledge, ensuring sustainable growth and prosperity for farming communities across the nation.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative group h-full"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
              <div className="relative p-10 bg-white rounded-3xl border-2 border-gray-200 group-hover:border-blue-400 transition-all duration-300 shadow-xl h-full flex flex-col">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                  <Eye className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-black text-gray-900 mb-4">Our Vision</h2>
                <p className="text-gray-700 text-lg leading-relaxed font-medium flex-1">
                  To become the world's most trusted agriculture platform, empowering millions of farmers with innovative solutions that bridge the gap between traditional wisdom and modern technology, creating a sustainable future for global agriculture.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-black text-white mb-4">Our Core Values</h2>
            <p className="text-xl text-gray-300 font-medium">The principles that guide everything we do</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="relative group h-full"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${value.color} rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-all duration-300`}></div>
                <div className="relative p-8 bg-white rounded-3xl border-2 border-gray-200 group-hover:border-green-400 transition-all duration-300 shadow-xl text-center h-full flex flex-col">
                  <div className={`w-16 h-16 bg-gradient-to-br ${value.color} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg`}>
                    <value.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{value.title}</h3>
                  <p className="text-gray-600 leading-relaxed font-medium flex-1">{value.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Journey Timeline */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-black text-white mb-4">Our Journey</h2>
            <p className="text-xl text-gray-300 font-medium">Milestones that shaped AgroMart</p>
          </motion.div>

          <div className="relative">
            <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-gradient-to-b from-green-500 to-emerald-600 hidden lg:block"></div>

            <div className="space-y-12">
              {milestones.map((milestone, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: idx % 2 === 0 ? -30 : 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className={`flex items-center gap-8 ${idx % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'}`}
                >
                  <div className="flex-1">
                    <div className={`relative group ${idx % 2 === 0 ? 'lg:text-right' : ''}`}>
                      <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                      <div className="relative p-8 bg-white rounded-3xl border-2 border-gray-200 group-hover:border-green-400 transition-all duration-300 shadow-xl">
                        <div className="text-5xl font-black text-green-600 mb-2">{milestone.year}</div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">{milestone.title}</h3>
                        <p className="text-gray-600 font-medium">{milestone.description}</p>
                      </div>
                    </div>
                  </div>

                  <div className="hidden lg:flex w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full items-center justify-center shadow-lg border-4 border-slate-900 z-10 flex-shrink-0">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>

                  <div className="flex-1"></div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-black text-white mb-4">Meet Our Team</h2>
            <p className="text-xl text-gray-300 font-medium">The people behind AgroMart's success</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="relative group h-full"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                <div className="relative bg-white rounded-3xl border-2 border-gray-200 group-hover:border-green-400 transition-all duration-300 shadow-xl overflow-hidden h-full flex flex-col">
                  <div className="p-8 text-center bg-gradient-to-br from-green-50 to-emerald-50">
                    <div className="text-8xl mb-4">{member.avatar}</div>
                  </div>
                  <div className="p-6 bg-white flex-1 flex flex-col">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{member.name}</h3>
                    <p className="text-green-600 font-bold text-sm mb-3">{member.role}</p>
                    <p className="text-gray-600 text-sm leading-relaxed font-medium flex-1">{member.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Achievements */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-black text-white mb-4">Awards & Recognition</h2>
            <p className="text-xl text-gray-300 font-medium">Celebrating our achievements</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {achievements.map((achievement, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
                className="relative group h-full"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-2xl blur-lg group-hover:blur-xl transition-all duration-300"></div>
                <div className="relative p-6 bg-white rounded-2xl border-2 border-gray-200 group-hover:border-yellow-400 transition-all duration-300 shadow-lg flex items-center gap-4 h-full">
                  <Award className="w-8 h-8 text-yellow-600 flex-shrink-0" />
                  <p className="text-gray-900 font-bold text-sm">{achievement}</p>
                </div>
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
              <h2 className="text-4xl font-black text-white mb-4">Join the AgroMart Family</h2>
              <p className="text-xl text-gray-200 mb-8 font-medium">Experience the difference with India's most trusted agriculture platform</p>
              <button className="px-12 py-5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-2xl text-white font-black text-xl shadow-2xl shadow-green-600/60 border-2 border-green-400 focus:outline-none focus:ring-4 focus:ring-green-400/50 transition-all hover:scale-105">
                Start Shopping
              </button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

const Package = Sprout;