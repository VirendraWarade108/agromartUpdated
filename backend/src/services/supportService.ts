import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';

// ============================================
// CONTACT MESSAGE FUNCTIONS
// ============================================

/**
 * Submit contact message
 */
export const submitContactMessage = async (messageData: {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}) => {
  const contactMessage = await prisma.contactMessage.create({
    data: messageData,
  });

  return contactMessage;
};

/**
 * Get all contact messages (Admin)
 */
export const getAllContactMessages = async (filters?: {
  status?: string;
  page?: number;
  limit?: number;
}) => {
  const { status, page = 1, limit = 20 } = filters || {};
  const skip = (page - 1) * limit;

  const where: any = {};
  if (status) where.status = status;

  const [messages, total] = await Promise.all([
    prisma.contactMessage.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.contactMessage.count({ where }),
  ]);

  return {
    messages,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Update contact message status (Admin)
 */
export const updateMessageStatus = async (
  messageId: string,
  status: string
) => {
  const message = await prisma.contactMessage.update({
    where: { id: messageId },
    data: { status },
  });

  return message;
};

/**
 * Delete contact message (Admin)
 */
export const deleteContactMessage = async (messageId: string) => {
  await prisma.contactMessage.delete({
    where: { id: messageId },
  });

  return { message: 'Contact message deleted successfully' };
};

// ============================================
// NEWSLETTER FUNCTIONS
// ============================================

/**
 * Subscribe to newsletter
 */
export const subscribeToNewsletter = async (email: string) => {
  // Check if already subscribed
  const existing = await prisma.newsletter.findUnique({
    where: { email },
  });

  if (existing) {
    if (existing.isActive) {
      throw new AppError('Email already subscribed', 400);
    } else {
      // Reactivate subscription
      const updated = await prisma.newsletter.update({
        where: { email },
        data: {
          isActive: true,
          unsubscribedAt: null,
        },
      });
      return updated;
    }
  }

  // Create new subscription
  const subscription = await prisma.newsletter.create({
    data: { email },
  });

  return subscription;
};

/**
 * Unsubscribe from newsletter
 */
export const unsubscribeFromNewsletter = async (email: string) => {
  const subscription = await prisma.newsletter.findUnique({
    where: { email },
  });

  if (!subscription) {
    throw new AppError('Email not found', 404);
  }

  const updated = await prisma.newsletter.update({
    where: { email },
    data: {
      isActive: false,
      unsubscribedAt: new Date(),
    },
  });

  return updated;
};

/**
 * Get all newsletter subscribers (Admin)
 */
export const getAllSubscribers = async (filters?: {
  isActive?: boolean;
  page?: number;
  limit?: number;
}) => {
  const { isActive, page = 1, limit = 50 } = filters || {};
  const skip = (page - 1) * limit;

  const where: any = {};
  if (isActive !== undefined) where.isActive = isActive;

  const [subscribers, total] = await Promise.all([
    prisma.newsletter.findMany({
      where,
      skip,
      take: limit,
      orderBy: { subscribedAt: 'desc' },
    }),
    prisma.newsletter.count({ where }),
  ]);

  return {
    subscribers,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get newsletter statistics (Admin)
 */
export const getNewsletterStats = async () => {
  const [totalSubscribers, activeSubscribers, unsubscribed] = await Promise.all([
    prisma.newsletter.count(),
    prisma.newsletter.count({ where: { isActive: true } }),
    prisma.newsletter.count({ where: { isActive: false } }),
  ]);

  return {
    totalSubscribers,
    activeSubscribers,
    unsubscribed,
  };
};

// ============================================
// FAQ FUNCTIONS
// ============================================

/**
 * Get all FAQs (Public)
 */
export const getAllFAQs = async (category?: string) => {
  const where: any = { isActive: true };
  if (category) where.category = category;

  const faqs = await prisma.fAQ.findMany({
    where,
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
  });

  return faqs;
};

/**
 * Get FAQ by ID (Public)
 */
export const getFAQById = async (id: string) => {
  const faq = await prisma.fAQ.findUnique({
    where: { id },
  });

  if (!faq) {
    throw new AppError('FAQ not found', 404);
  }

  return faq;
};

/**
 * Create FAQ (Admin)
 */
export const createFAQ = async (faqData: {
  question: string;
  answer: string;
  category: string;
  order?: number;
  isActive?: boolean;
}) => {
  const faq = await prisma.fAQ.create({
    data: faqData,
  });

  return faq;
};

/**
 * Update FAQ (Admin)
 */
export const updateFAQ = async (
  id: string,
  updateData: {
    question?: string;
    answer?: string;
    category?: string;
    order?: number;
    isActive?: boolean;
  }
) => {
  const faq = await prisma.fAQ.update({
    where: { id },
    data: updateData,
  });

  return faq;
};

/**
 * Delete FAQ (Admin)
 */
export const deleteFAQ = async (id: string) => {
  await prisma.fAQ.delete({
    where: { id },
  });

  return { message: 'FAQ deleted successfully' };
};

/**
 * Get FAQ categories (Public)
 */
export const getFAQCategories = async () => {
  const faqs = await prisma.fAQ.findMany({
    where: { isActive: true },
    select: { category: true },
    distinct: ['category'],
  });

  return faqs.map((f) => f.category);
};