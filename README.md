# AgroMart - Frontend

![AgroMart Logo](https://via.placeholder.com/150x150?text=AgroMart)

## 🌾 India's #1 Agriculture Marketplace

AgroMart is a modern, full-stack e-commerce platform built for the agriculture industry, connecting farmers with premium quality seeds, fertilizers, equipment, and farming supplies across India.

---

## ✨ Features

### 🛒 E-Commerce Features
- **Product Catalog** - Browse 1500+ agricultural products
- **Advanced Search** - Smart search with filters and voice search
- **Shopping Cart** - Real-time cart management with coupon codes
- **Secure Checkout** - Multiple payment options (Card, UPI, Net Banking, Wallet, COD)
- **Order Tracking** - Real-time order status and delivery tracking
- **Wishlist** - Save products for later

### 👤 User Features
- **Authentication** - Login, Register, Forgot Password
- **User Dashboard** - Order history, profile management
- **Address Management** - Multiple delivery addresses
- **Reviews & Ratings** - Product reviews and ratings
- **Reward Points** - Loyalty program

### 📱 UI/UX Features
- **Outstanding Design** - Modern, futuristic UI with glassmorphism
- **Responsive** - Mobile-first design, works on all devices
- **Dark Gradient Theme** - Beautiful gradient backgrounds
- **Smooth Animations** - Framer Motion animations
- **Micro-interactions** - Hover effects and transitions

### 📝 Content Features
- **Blog System** - Articles, farming tips, success stories
- **About Page** - Company information and team
- **Contact Page** - Contact form and support

### 🔐 Admin Features
- **Admin Dashboard** - Manage products, orders, users
- **Analytics** - Sales reports and statistics
- **Product Management** - Add, edit, delete products
- **Order Management** - Update order status

---

## 🚀 Tech Stack

### Frontend Framework
- **Next.js 15+** - React framework with App Router
- **React 19** - Latest React version
- **TypeScript** - Type-safe development

### Styling
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Beautiful UI components
- **Framer Motion** - Animation library

### State Management
- **Zustand** - Lightweight state management
- **React Context** - For global state

### Data Fetching
- **Axios** - HTTP client
- **React Query** (optional) - Server state management

### Form Handling
- **React Hook Form** (optional) - Form management
- **Zod** - Schema validation

### Icons & Assets
- **Lucide Icons** - Beautiful icon library

---

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn or pnpm

### Setup Steps

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/agromart.git
cd agromart/frontend
```

2. **Install dependencies**
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. **Create environment file**
```bash
cp .env.example .env.local
```

4. **Configure environment variables**
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

5. **Run development server**
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

6. **Open browser**
```
http://localhost:3000
```

---
---

## 🔧 Backend Setup

### Prerequisites
- Node.js 18+
- PostgreSQL database
- npm or yarn or pnpm

### Setup Steps

1. **Navigate to backend directory**
```bash
cd agromart/backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Create environment file**
```bash
cp .env.example .env
```

4. **Configure environment variables**
```env
DATABASE_URL="postgresql://user:password@localhost:5432/agromart"
JWT_SECRET="your-secret-key-here"
PORT=5000
```

5. **Setup database**
```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# (Optional) Seed database
npm run prisma:seed
```

6. **Run development server**
```bash
npm run dev
```

The backend will start at `http://localhost:5000/api`

### Production Deployment
```bash
# Build TypeScript
npm run build

# Start production server
npm start
```

**Note:** The legacy `server.js` file has been removed. Always use:
- **Development:** `npm run dev` (runs `src/server.ts` with hot-reload)
- **Production:** `npm run build && npm start` (compiles to `dist/server.js`)

---

## 🏗️ Project Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Home page
│   │   ├── about/             # About page
│   │   ├── products/          # Product pages
│   │   ├── cart/              # Cart page
│   │   ├── checkout/          # Checkout page
│   │   ├── auth/              # Authentication pages
│   │   ├── dashboard/         # User dashboard
│   │   ├── admin/             # Admin pages
│   │   ├── blog/              # Blog pages
│   │   └── contact/           # Contact page
│   ├── components/            # React components
│   │   ├── ui/               # shadcn/ui components
│   │   ├── layout/           # Layout components
│   │   ├── home/             # Home page components
│   │   ├── products/         # Product components
│   │   └── shared/           # Shared components
│   ├── lib/                   # Utilities
│   │   ├── utils.ts          # Helper functions
│   │   ├── api.ts            # API client
│   │   └── constants.ts      # Constants
│   ├── store/                 # Zustand stores
│   │   ├── cartStore.ts      # Cart state
│   │   ├── authStore.ts      # Auth state
│   │   └── uiStore.ts        # UI state
│   ├── hooks/                 # Custom hooks
│   ├── types/                 # TypeScript types
│   └── styles/               # Global styles
├── public/                    # Static assets
├── next.config.js            # Next.js config
├── tailwind.config.ts        # Tailwind config
├── tsconfig.json             # TypeScript config
└── package.json              # Dependencies
```

---

## 🎨 Design System

### Colors
- **Primary**: Green (#10B981) - Agriculture/Growth
- **Secondary**: Emerald (#059669)
- **Accent**: Cyan (#06B6D4)
- **Background**: Dark Gradient (Slate → Green → Slate)

### Typography
- **Font**: Inter (Google Fonts)
- **Headings**: Font-black (900 weight)
- **Body**: Font-medium/semibold

### Components
- **Buttons**: Gradient with hover scale
- **Cards**: White bg, shadow, border
- **Inputs**: Border focus on green
- **Animations**: Smooth transitions

---

## 🔌 API Integration

### API Client (`src/lib/api.ts`)

```typescript
import { authApi, productApi, cartApi, orderApi } from '@/lib/api';

// Login
const response = await authApi.login(email, password);

// Get products
const products = await productApi.getAll({ category: 'seeds' });

// Add to cart
await cartApi.add(productId, quantity);
```

### Authentication
- JWT tokens stored in localStorage
- Auto-refresh on token expiry
- Axios interceptors for auth headers

---

## 🗄️ State Management

### Cart Store
```typescript
import useCartStore from '@/store/cartStore';

const { items, addItem, removeItem, getTotal } = useCartStore();
```

### Auth Store
```typescript
import useAuthStore from '@/store/authStore';

const { user, login, logout, isAuthenticated } = useAuthStore();
```

### UI Store
```typescript
import useUIStore, { showSuccessToast } from '@/store/uiStore';

showSuccessToast('Product added to cart!');
```

---

## 🧪 Available Scripts

```bash
# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Check TypeScript types
```

---

## 📄 Pages Overview

| Page | Route | Description |
|------|-------|-------------|
| Home | `/` | Landing page with hero, categories, featured products |
| Products | `/products` | Product listing with filters |
| Product Details | `/products/[id]` | Single product page |
| Cart | `/cart` | Shopping cart |
| Checkout | `/checkout` | Order checkout |
| Login | `/auth/login` | User login |
| Register | `/auth/register` | User registration |
| Dashboard | `/dashboard` | User dashboard |
| Orders | `/orders` | Order history |
| About | `/about` | About company |
| Blog | `/blog` | Blog listing |
| Contact | `/contact` | Contact form |

---

## 🌟 Key Features Implementation

### Responsive Design
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Hamburger menu for mobile

### Performance
- Next.js App Router for optimal performance
- Image optimization with Next.js Image
- Code splitting and lazy loading
- Optimized bundle size

### SEO
- Meta tags on all pages
- Open Graph tags
- Structured data
- Sitemap generation

### Accessibility
- ARIA labels
- Keyboard navigation
- Focus states
- Screen reader support

---

## 🔐 Environment Variables

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional: Analytics
NEXT_PUBLIC_GA_ID=your-google-analytics-id

# Optional: Payment Gateway
NEXT_PUBLIC_STRIPE_KEY=your-stripe-publishable-key
```

---

## 🚢 Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Other Platforms
- Netlify
- AWS Amplify
- Railway
- Render

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License.

---

## 👥 Team

- **Project Lead**: Your Name
- **Design**: Design Team
- **Development**: Dev Team

---

## 📞 Support

- **Email**: support@agromart.com
- **Phone**: 1800-123-4567
- **Website**: https://agromart.com

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Framer Motion](https://www.framer.com/motion/)
- [Zustand](https://zustand-demo.pmnd.rs/)
- [Lucide Icons](https://lucide.dev/)

---

**Made with ❤️ for Indian Farmers**

🌾 Grow Your Future with AgroMart 🌾