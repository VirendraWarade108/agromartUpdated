import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());

// Products data
const products = [
	{
		id: 'p1',
		name: 'Premium Tomato Seeds',
		slug: 'premium-tomato-seeds',
		price: 199,
		originalPrice: 249,
		rating: 4.7,
		reviews: 34,
		image: '/images/products/tomato.jpg',
		images: ['/images/products/tomato.jpg'],
		description: 'High-yield hybrid tomato seeds.',
		stock: 150,
	},
	{
		id: 'p2',
		name: 'Organic Fertilizer 5kg',
		slug: 'organic-fertilizer-5kg',
		price: 499,
		originalPrice: 599,
		rating: 4.5,
		reviews: 18,
		image: '/images/products/fertilizer.jpg',
		images: ['/images/products/fertilizer.jpg'],
		description: 'Slow release organic fertilizer.',
		stock: 89,
	},
];

// Categories data
const categories = [
	{ id: '1', name: 'Seeds', icon: '🌾', description: 'High-quality seeds' },
	{ id: '2', name: 'Fertilizers', icon: '🌱', description: 'Organic and chemical fertilizers' },
	{ id: '3', name: 'Tools', icon: '🛠️', description: 'Farm tools and equipment' },
];

// Blog data
const blogPosts = [
	{
		id: 'b1',
		title: 'Complete Guide to Organic Farming in 2025',
		slug: 'organic-farming-guide',
		excerpt: 'Learn everything you need to know about sustainable organic farming practices.',
		content: '<p>Full guide content...</p>',
		author: 'Dr. Rajesh Kumar',
		featured_image: '/images/blog/organic.jpg',
		category: 'Farming Tips',
		tags: ['organic', 'sustainable'],
		likes: 245,
		comments: 32,
		views: 1280,
		published_at: '2025-01-01T00:00:00Z',
		reading_time: 8,
	},
];

// Cart and orders
let cartItems: any[] = [];
let cartCoupon: any = null;
let orders: any[] = [];

// Helper
const ok = (res: any, data: any) => res.json({ success: true, data });

// Root endpoint
app.get('/api', (_req, res) => {
	res.json({
		status: 'ok',
		message: 'AgroMart API Server',
		endpoints: {
			health: '/api/health',
			products: '/api/products',
			categories: '/api/categories',
			blog: '/api/blog',
			cart: '/api/cart',
			checkout: '/api/checkout',
			orders: '/api/orders',
		},
	});
});

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// Products
app.get('/api/products', (_req, res) => ok(res, products));

app.get('/api/products/:id', (req, res) => {
	const p = products.find((x) => x.id === req.params.id || x.slug === req.params.id);
	if (!p) return res.status(404).json({ success: false, message: 'Not found' });
	return ok(res, p);
});

// Categories
app.get('/api/categories', (_req, res) => ok(res, categories));

app.post('/api/admin/categories', (req, res) => {
	const { name, description, icon } = req.body;
	const cat = { id: String(Date.now()), name, description, icon };
	categories.push(cat);
	return ok(res, cat);
});

app.put('/api/admin/categories/:id', (req, res) => {
	const idx = categories.findIndex((c) => c.id === req.params.id);
	if (idx === -1) return res.status(404).json({ success: false, message: 'Not found' });
	categories[idx] = { ...categories[idx], ...req.body };
	return ok(res, categories[idx]);
});

app.delete('/api/admin/categories/:id', (req, res) => {
	const idx = categories.findIndex((c) => c.id === req.params.id);
	if (idx === -1) return res.status(404).json({ success: false, message: 'Not found' });
	const deleted = categories.splice(idx, 1)[0];
	return ok(res, deleted);
});

// Blog
app.get('/api/blog', (_req, res) => ok(res, blogPosts));

app.get('/api/blog/:slug', (req, res) => {
	const post = blogPosts.find((p) => p.slug === req.params.slug);
	if (!post) return res.status(404).json({ success: false, message: 'Not found' });
	return ok(res, post);
});

// Cart endpoints
app.get('/api/cart', (_req, res) => ok(res, { items: cartItems, coupon: cartCoupon }));

app.post('/api/cart/add', (req, res) => {
	const { id, name, price, image, quantity = 1 } = req.body;
	const existing = cartItems.find((i) => i.id === id);
	if (existing) {
		existing.quantity += quantity;
	} else {
		cartItems.push({ id, name, price, quantity, image });
	}
	return ok(res, { items: cartItems, coupon: cartCoupon });
});

app.put('/api/cart/items/:id', (req, res) => {
	const { quantity } = req.body;
	const item = cartItems.find((i) => i.id === req.params.id);
	if (!item) return res.status(404).json({ success: false, message: 'Not found' });
	if (quantity !== undefined) item.quantity = quantity;
	return ok(res, { items: cartItems, coupon: cartCoupon });
});

app.delete('/api/cart/items/:id', (req, res) => {
	const idx = cartItems.findIndex((i) => i.id === req.params.id);
	if (idx === -1) return res.status(404).json({ success: false, message: 'Not found' });
	cartItems.splice(idx, 1);
	return ok(res, { items: cartItems, coupon: cartCoupon });
});

// Coupon
const VALID_COUPONS: Record<string, number> = { SAVE20: 20, SAVE10: 10, WELCOME5: 5 };

app.post('/api/cart/coupon', (req, res) => {
	const { code } = req.body;
	const discount = VALID_COUPONS[code?.toUpperCase()];
	if (!discount) return res.status(400).json({ success: false, message: 'Invalid coupon' });
	cartCoupon = { code: code.toUpperCase(), discount };
	return ok(res, { items: cartItems, coupon: cartCoupon });
});

app.delete('/api/cart/coupon', (_req, res) => {
	cartCoupon = null;
	return ok(res, { items: cartItems, coupon: cartCoupon });
});

// Checkout
app.post('/api/checkout', (req, res) => {
	if (!cartItems.length) return res.status(400).json({ success: false, message: 'Cart empty' });

	let subtotal = 0;
	cartItems.forEach((item) => {
		subtotal += item.price * item.quantity;
	});

	const discount = cartCoupon ? (subtotal * cartCoupon.discount) / 100 : 0;
	const total = subtotal - discount;

	const order = {
		id: 'ORDER-' + Date.now(),
		items: [...cartItems],
		subtotal,
		discount,
		total,
		coupon: cartCoupon?.code || null,
		paymentMethod: req.body?.paymentMethod || 'mock',
		shippingAddress: req.body?.shippingAddress || null,
		status: 'pending',
		createdAt: new Date().toISOString(),
	};

	orders.push(order);
	cartItems = [];
	cartCoupon = null;

	return ok(res, { order, success: true });
});

// Orders
app.get('/api/orders', (_req, res) => ok(res, orders));

app.get('/api/orders/:id', (req, res) => {
	const o = orders.find((x) => x.id === req.params.id);
	if (!o) return res.status(404).json({ success: false, message: 'Not found' });
	return ok(res, o);
});

// Auth refresh
app.post('/api/auth/refresh', (req, res) => {
	const { refreshToken } = req.body;
	if (!refreshToken) return res.status(401).json({ success: false, message: 'No token' });
	return ok(res, { accessToken: 'mock-access-token-' + Date.now() });
});

// Start
const server = app.listen(PORT, () => {
	console.log(`Server running on http://localhost:${PORT}/api`);
});
