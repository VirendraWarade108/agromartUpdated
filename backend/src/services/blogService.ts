import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';

/**
 * Blog Service
 * Handles all blog-related business logic with RBAC enforcement
 */

// ============================================
// TYPES & INTERFACES
// ============================================

interface BlogPostCreateData {
  title: string;
  slug?: string;
  excerpt: string;
  content: string;
  author: string;
  featuredImage?: string;
  category: string;
  tags: string[];
  readingTime?: number;
  featured?: boolean;
  published?: boolean;
}

interface BlogPostUpdateData {
  title?: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  author?: string;
  featuredImage?: string;
  category?: string;
  tags?: string[];
  readingTime?: number;
  featured?: boolean;
  published?: boolean;
}

interface GetAllPostsOptions {
  page?: number;
  limit?: number;
  category?: string;
  published?: boolean;
  featured?: boolean;
  sortBy?: 'publishedAt' | 'views' | 'likes' | 'updatedAt' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Generate unique slug from title
 */
const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

/**
 * Ensure slug is unique by appending number if needed
 */
const ensureUniqueSlug = async (slug: string, excludeId?: string): Promise<string> => {
  let uniqueSlug = slug;
  let counter = 1;

  while (true) {
    const existing = await prisma.blogPost.findUnique({
      where: { slug: uniqueSlug },
      select: { id: true },
    });

    // If no conflict or it's the same post being updated, break
    if (!existing || (excludeId && existing.id === excludeId)) {
      break;
    }

    // Append counter and try again
    uniqueSlug = `${slug}-${counter}`;
    counter++;
  }

  return uniqueSlug;
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
  published: post.published,
  created_at: post.createdAt.toISOString(),
  updated_at: post.updatedAt.toISOString(),
});

// ============================================
// PUBLIC ENDPOINTS (NO AUTH REQUIRED)
// ============================================

/**
 * Get all published blog posts with pagination and filters
 * PUBLIC - Only returns published posts
 */
export const getAllPosts = async (options: GetAllPostsOptions = {}) => {
  const {
    page = 1,
    limit = 10,
    category,
    published = true,
    featured,
    sortBy = 'publishedAt',
    sortOrder = 'desc',
  } = options;

  const skip = (page - 1) * limit;

  // Build where clause
  const where: any = { published };

  if (category) {
    where.category = {
      equals: category,
      mode: 'insensitive',
    };
  }

  if (featured !== undefined) {
    where.featured = featured;
  }

  try {
    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
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
        hasMore: page * limit < total,
      },
    };
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    throw new AppError('Failed to fetch blog posts', 500);
  }
};

/**
 * Get single published blog post by ID
 * PUBLIC - Only returns published posts
 */
export const getPostById = async (id: string) => {
  if (!id || typeof id !== 'string') {
    throw new AppError('Invalid post ID', 400);
  }

  try {
    const post = await prisma.blogPost.findUnique({
      where: { id },
    });

    if (!post) {
      throw new AppError('Blog post not found', 404);
    }

    // Only allow published posts for public access
    if (!post.published) {
      throw new AppError('Blog post not found', 404);
    }

    // Increment views asynchronously (don't wait)
    prisma.blogPost
      .update({
        where: { id },
        data: { views: { increment: 1 } },
      })
      .catch((err) => console.error('Failed to increment views:', err));

    return transformBlogPost({ ...post, views: post.views + 1 });
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Error fetching blog post by ID:', error);
    throw new AppError('Failed to fetch blog post', 500);
  }
};

/**
 * Get single published blog post by slug
 * PUBLIC - Only returns published posts
 */
export const getPostBySlug = async (slug: string) => {
  if (!slug || typeof slug !== 'string') {
    throw new AppError('Invalid post slug', 400);
  }

  try {
    const post = await prisma.blogPost.findUnique({
      where: { slug },
    });

    if (!post) {
      throw new AppError('Blog post not found', 404);
    }

    // Only allow published posts for public access
    if (!post.published) {
      throw new AppError('Blog post not found', 404);
    }

    // Increment views asynchronously (don't wait)
    prisma.blogPost
      .update({
        where: { id: post.id },
        data: { views: { increment: 1 } },
      })
      .catch((err) => console.error('Failed to increment views:', err));

    return transformBlogPost({ ...post, views: post.views + 1 });
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Error fetching blog post by slug:', error);
    throw new AppError('Failed to fetch blog post', 500);
  }
};

/**
 * Get blog categories with post counts
 * PUBLIC - Only counts published posts
 */
export const getCategories = async () => {
  try {
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
      slug: generateSlug(name),
    }));

    return categories.sort((a, b) => b.count - a.count);
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw new AppError('Failed to fetch categories', 500);
  }
};

/**
 * Get featured blog posts
 * PUBLIC - Only returns published posts
 */
export const getFeaturedPosts = async (limit: number = 4) => {
  try {
    const posts = await prisma.blogPost.findMany({
      where: {
        featured: true,
        published: true,
      },
      take: limit,
      orderBy: { publishedAt: 'desc' },
    });

    return posts.map(transformBlogPost);
  } catch (error) {
    console.error('Error fetching featured posts:', error);
    throw new AppError('Failed to fetch featured posts', 500);
  }
};

/**
 * Search published blog posts
 * PUBLIC - Only searches published posts
 */
export const searchPosts = async (query: string) => {
  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    throw new AppError('Search query is required', 400);
  }

  const searchQuery = query.trim();

  try {
    const posts = await prisma.blogPost.findMany({
      where: {
        published: true,
        OR: [
          { title: { contains: searchQuery, mode: 'insensitive' } },
          { excerpt: { contains: searchQuery, mode: 'insensitive' } },
          { content: { contains: searchQuery, mode: 'insensitive' } },
          { category: { contains: searchQuery, mode: 'insensitive' } },
          { tags: { has: searchQuery.toLowerCase() } },
          { author: { contains: searchQuery, mode: 'insensitive' } },
        ],
      },
      orderBy: { publishedAt: 'desc' },
      take: 50, // Limit search results
    });

    return posts.map(transformBlogPost);
  } catch (error) {
    console.error('Error searching blog posts:', error);
    throw new AppError('Failed to search blog posts', 500);
  }
};

// ============================================
// ADMIN ENDPOINTS (REQUIRE ADMIN AUTH)
// ============================================

/**
 * Get all blog posts (including drafts) - ADMIN ONLY
 */
export const getAllPostsAdmin = async (options: GetAllPostsOptions = {}) => {
  const {
    page = 1,
    limit = 20,
    category,
    published,
    featured,
    sortBy = 'updatedAt',
    sortOrder = 'desc',
  } = options;

  const skip = (page - 1) * limit;

  // Build where clause
  const where: any = {};

  if (category) {
    where.category = {
      equals: category,
      mode: 'insensitive',
    };
  }

  if (published !== undefined) {
    where.published = published;
  }

  if (featured !== undefined) {
    where.featured = featured;
  }

  try {
    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
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
        hasMore: page * limit < total,
      },
    };
  } catch (error) {
    console.error('Error fetching admin blog posts:', error);
    throw new AppError('Failed to fetch blog posts', 500);
  }
};

/**
 * Get single blog post by ID (including drafts) - ADMIN ONLY
 */
export const getPostByIdAdmin = async (id: string) => {
  if (!id || typeof id !== 'string') {
    throw new AppError('Invalid post ID', 400);
  }

  try {
    const post = await prisma.blogPost.findUnique({
      where: { id },
    });

    if (!post) {
      throw new AppError('Blog post not found', 404);
    }

    return transformBlogPost(post);
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Error fetching admin blog post by ID:', error);
    throw new AppError('Failed to fetch blog post', 500);
  }
};

/**
 * Create blog post - ADMIN ONLY
 */
export const createPost = async (data: BlogPostCreateData) => {
  // Validate required fields
  if (!data.title || !data.excerpt || !data.content || !data.author || !data.category) {
    throw new AppError('Missing required fields', 400);
  }

  // Generate slug if not provided
  let slug = data.slug || generateSlug(data.title);

  // Ensure slug is unique
  slug = await ensureUniqueSlug(slug);

  // Validate tags
  const tags = Array.isArray(data.tags) ? data.tags : [];

  try {
    const post = await prisma.blogPost.create({
      data: {
        title: data.title.trim(),
        slug,
        excerpt: data.excerpt.trim(),
        content: data.content,
        author: data.author.trim(),
        featuredImage: data.featuredImage || null,
        category: data.category.trim(),
        tags,
        readingTime: data.readingTime || 5,
        featured: data.featured || false,
        published: data.published !== undefined ? data.published : false,
      },
    });

    return transformBlogPost(post);
  } catch (error) {
    console.error('Error creating blog post:', error);
    throw new AppError('Failed to create blog post', 500);
  }
};

/**
 * Update blog post - ADMIN ONLY
 */
export const updatePost = async (id: string, data: BlogPostUpdateData) => {
  if (!id || typeof id !== 'string') {
    throw new AppError('Invalid post ID', 400);
  }

  try {
    // Check if post exists
    const existing = await prisma.blogPost.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new AppError('Blog post not found', 404);
    }

    // If updating slug, validate and ensure uniqueness
    let slug = data.slug;
    if (slug) {
      slug = generateSlug(slug);
      slug = await ensureUniqueSlug(slug, id);
    }

    // Build update data object (only include provided fields)
    const updateData: any = {};

    if (data.title !== undefined) updateData.title = data.title.trim();
    if (slug !== undefined) updateData.slug = slug;
    if (data.excerpt !== undefined) updateData.excerpt = data.excerpt.trim();
    if (data.content !== undefined) updateData.content = data.content;
    if (data.author !== undefined) updateData.author = data.author.trim();
    if (data.featuredImage !== undefined) updateData.featuredImage = data.featuredImage || null;
    if (data.category !== undefined) updateData.category = data.category.trim();
    if (data.tags !== undefined) updateData.tags = Array.isArray(data.tags) ? data.tags : [];
    if (data.readingTime !== undefined) updateData.readingTime = data.readingTime;
    if (data.featured !== undefined) updateData.featured = data.featured;
    if (data.published !== undefined) updateData.published = data.published;

    const post = await prisma.blogPost.update({
      where: { id },
      data: updateData,
    });

    return transformBlogPost(post);
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Error updating blog post:', error);
    throw new AppError('Failed to update blog post', 500);
  }
};

/**
 * Delete blog post - ADMIN ONLY
 */
export const deletePost = async (id: string) => {
  if (!id || typeof id !== 'string') {
    throw new AppError('Invalid post ID', 400);
  }

  try {
    const existing = await prisma.blogPost.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new AppError('Blog post not found', 404);
    }

    await prisma.blogPost.delete({
      where: { id },
    });

    return { success: true, message: 'Blog post deleted successfully' };
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Error deleting blog post:', error);
    throw new AppError('Failed to delete blog post', 500);
  }
};

/**
 * Toggle publish status - ADMIN ONLY
 */
export const togglePublishStatus = async (id: string) => {
  if (!id || typeof id !== 'string') {
    throw new AppError('Invalid post ID', 400);
  }

  try {
    const existing = await prisma.blogPost.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new AppError('Blog post not found', 404);
    }

    const post = await prisma.blogPost.update({
      where: { id },
      data: { published: !existing.published },
    });

    return transformBlogPost(post);
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Error toggling publish status:', error);
    throw new AppError('Failed to toggle publish status', 500);
  }
};

/**
 * Get blog statistics - ADMIN ONLY
 */
export const getBlogStats = async () => {
  try {
    const [totalPosts, publishedPosts, draftPosts, totalViews, totalLikes] = await Promise.all([
      prisma.blogPost.count(),
      prisma.blogPost.count({ where: { published: true } }),
      prisma.blogPost.count({ where: { published: false } }),
      prisma.blogPost.aggregate({
        _sum: { views: true },
      }),
      prisma.blogPost.aggregate({
        _sum: { likes: true },
      }),
    ]);

    // Get most viewed posts
    const mostViewed = await prisma.blogPost.findMany({
      where: { published: true },
      orderBy: { views: 'desc' },
      take: 5,
      select: {
        id: true,
        title: true,
        slug: true,
        views: true,
      },
    });

    // Get categories
    const categories = await getCategories();

    return {
      totalPosts,
      publishedPosts,
      draftPosts,
      totalViews: totalViews._sum.views || 0,
      totalLikes: totalLikes._sum.likes || 0,
      mostViewed,
      categories,
    };
  } catch (error) {
    console.error('Error fetching blog stats:', error);
    throw new AppError('Failed to fetch blog statistics', 500);
  }
};