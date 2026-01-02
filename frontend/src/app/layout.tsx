import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '../styles/globals.css'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Toaster from '@/components/ui/toaster'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AgroMart - India\'s #1 Agriculture Marketplace',
  description: 'Premium quality seeds, fertilizers, and farming equipment delivered to your doorstep. Trusted by 50,000+ farmers across India.',
  keywords: 'agriculture, farming, seeds, fertilizers, farming equipment, agro products, India',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Toast Notifications - Positioned at top-right */}
        <Toaster />
        
        {/* Main App Structure */}
        <Header />
        <main className="min-h-screen">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}