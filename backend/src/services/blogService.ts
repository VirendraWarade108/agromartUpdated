import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';

/**
 * Get all blog posts with pagination and filters
 */
export const getAllPosts = async (options: {
  page?: number;
  limit?: number;
  category?: string;
  published?: boolean;
}) => {
  const { page = 1, limit = 10, category, published = true } = options;
  const skip = (page - 1) * limit;

  const where: any = { published };

  if (category) {
    where.category = {
      equals: category,
      mode: 'insensitive',
    };
  }

  const [posts, total] = await Promise.all([
    prisma.blogPost.findMany({
      where,
      skip,
      take: limit,
      orderBy: { publishedAt: 'desc' },
    }),
    prisma.blogPost.count({ where }),
  ]);

  return {
    posts: posts.map(transformBlogPost),
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get blog post by ID
 */
export const getPostById = async (id: string) => {
  const post = await prisma.blogPost.findUnique({
    where: { id },
  });

  if (!post) {
    throw new AppError('Blog post not found', 404);
  }

  // Increment views
  await prisma.blogPost.update({
    where: { id },
    data: { views: { increment: 1 } },
  });

  return transformBlogPost({ ...post, views: post.views + 1 });
};

/**
 * Get blog post by slug
 */
export const getPostBySlug = async (slug: string) => {
  const post = await prisma.blogPost.findUnique({
    where: { slug },
  });

  if (!post) {
    throw new AppError('Blog post not found', 404);
  }

  // Increment views
  await prisma.blogPost.update({
    where: { id: post.id },
    data: { views: { increment: 1 } },
  });

  return transformBlogPost({ ...post, views: post.views + 1 });
};

/**
 * Get blog categories with post counts
 */
export const getCategories = async () => {
  const posts = await prisma.blogPost.findMany({
    where: { published: true },
    select: { category: true },
  });

  const categoryMap = new Map<string, number>();

  posts.forEach((post) => {
    const count = categoryMap.get(post.category) || 0;
    categoryMap.set(post.category, count + 1);
  });

  const categories = Array.from(categoryMap.entries()).map(([name, count]) => ({
    name,
    count,
  }));

  return categories.sort((a, b) => b.count - a.count);
};

/**
 * Get featured blog posts
 */
export const getFeaturedPosts = async (limit: number = 4) => {
  const posts = await prisma.blogPost.findMany({
    where: {
      featured: true,
      published: true,
    },
    take: limit,
    orderBy: { publishedAt: 'desc' },
  });

  return posts.map(transformBlogPost);
};

/**
 * Search blog posts
 */
export const searchPosts = async (query: string) => {
  const posts = await prisma.blogPost.findMany({
    where: {
      published: true,
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { excerpt: { contains: query, mode: 'insensitive' } },
        { content: { contains: query, mode: 'insensitive' } },
        { category: { contains: query, mode: 'insensitive' } },
        { tags: { has: query.toLowerCase() } },
      ],
    },
    orderBy: { publishedAt: 'desc' },
  });

  return posts.map(transformBlogPost);
};

/**
 * Create blog post (Admin)
 */
export const createPost = async (data: {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: string;
  featuredImage?: string;
  category: string;
  tags: string[];
  readingTime?: number;
  featured?: boolean;
  published?: boolean;
}) => {
  // Check if slug already exists
  const existing = await prisma.blogPost.findUnique({
    where: { slug: data.slug },
  });

  if (existing) {
    throw new AppError('Blog post with this slug already exists', 400);
  }

  const post = await prisma.blogPost.create({
    data: {
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt,
      content: data.content,
      author: data.author,
      featuredImage: data.featuredImage,
      category: data.category,
      tags: data.tags,
      readingTime: data.readingTime || 5,
      featured: data.featured || false,
      published: data.published !== undefined ? data.published : true,
    },
  });

  return transformBlogPost(post);
};

/**
 * Update blog post (Admin)
 */
export const updatePost = async (
  id: string,
  data: Partial<{
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    author: string;
    featuredImage: string;
    category: string;
    tags: string[];
    readingTime: number;
    featured: boolean;
    published: boolean;
  }>
) => {
  // Check if post exists
  const existing = await prisma.blogPost.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new AppError('Blog post not found', 404);
  }

  // If updating slug, check for duplicates
  if (data.slug && data.slug !== existing.slug) {
    const slugExists = await prisma.blogPost.findUnique({
      where: { slug: data.slug },
    });

    if (slugExists) {
      throw new AppError('Blog post with this slug already exists', 400);
    }
  }

  const post = await prisma.blogPost.update({
    where: { id },
    data,
  });

  return transformBlogPost(post);
};

/**
 * Delete blog post (Admin)
 */
export const deletePost = async (id: string) => {
  const existing = await prisma.blogPost.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new AppError('Blog post not found', 404);
  }

  await prisma.blogPost.delete({
    where: { id },
  });
};

/**
 * Transform blog post to match frontend format
 */
const transformBlogPost = (post: any) => ({
  id: post.id,
  title: post.title,
  slug: post.slug,
  excerpt: post.excerpt,
  content: post.content,
  author: post.author,
  featured_image: post.featuredImage,
  category: post.category,
  tags: post.tags,
  likes: post.likes,
  comments: post.comments,
  views: post.views,
  published_at: post.publishedAt.toISOString(),
  reading_time: post.readingTime,
  featured: post.featured,
});