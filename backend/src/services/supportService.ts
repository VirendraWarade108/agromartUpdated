import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';

// ============================================
// TYPES & ENUMS
// ============================================

export enum TicketStatus {
  OPEN = 'OPEN',
  PENDING = 'PENDING',
  RESOLVED = 'RESOLVED'
}

export enum TicketPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

interface CreateTicketData {
  userId: string;
  subject: string;
  description: string;
  priority?: TicketPriority;
  attachments?: string[];
}

interface CreateCommentData {
  ticketId: string;
  userId: string;
  message: string;
  isInternal?: boolean;
  isAdmin?: boolean;
}

interface UpdateTicketData {
  subject?: string;
  description?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  assignedToId?: string | null;
}

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
  const existing = await prisma.newsletter.findUnique({
    where: { email },
  });

  if (existing) {
    if (existing.isActive) {
      throw new AppError('Email already subscribed', 400);
    } else {
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

// ============================================
// SUPPORT TICKET FUNCTIONS
// ============================================

/**
 * Create support ticket (User)
 */
export const createTicket = async (data: CreateTicketData) => {
  try {
    const ticket = await prisma.supportTicket.create({
      data: {
        userId: data.userId,
        subject: data.subject,
        description: data.description,
        status: TicketStatus.OPEN,
        priority: data.priority || TicketPriority.MEDIUM,
        attachments: data.attachments || [],
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    return ticket;
  } catch (error: any) {
    throw new AppError('Failed to create ticket', 500, 'INTERNAL_ERROR');
  }
};

/**
 * Get user's tickets
 */
export const getUserTickets = async (
  userId: string,
  filters?: {
    status?: TicketStatus;
    priority?: TicketPriority;
    page?: number;
    limit?: number;
  }
) => {
  const { status, priority, page = 1, limit = 20 } = filters || {};
  const skip = (page - 1) * limit;

  const where: any = { userId };
  if (status) where.status = status;
  if (priority) where.priority = priority;

  try {
    const [tickets, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          _count: {
            select: {
              comments: true,
            },
          },
        },
      }),
      prisma.supportTicket.count({ where }),
    ]);

    return {
      tickets,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error: any) {
    throw new AppError('Failed to fetch tickets', 500, 'INTERNAL_ERROR');
  }
};

/**
 * Get all tickets (Admin)
 */
export const getAllTickets = async (filters?: {
  status?: TicketStatus;
  priority?: TicketPriority;
  assignedToId?: string;
  page?: number;
  limit?: number;
}) => {
  const { status, priority, assignedToId, page = 1, limit = 20 } = filters || {};
  const skip = (page - 1) * limit;

  const where: any = {};
  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (assignedToId) where.assignedToId = assignedToId;

  try {
    const [tickets, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          _count: {
            select: {
              comments: true,
            },
          },
        },
      }),
      prisma.supportTicket.count({ where }),
    ]);

    return {
      tickets,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error: any) {
    throw new AppError('Failed to fetch tickets', 500, 'INTERNAL_ERROR');
  }
};

/**
 * Get ticket by ID with ownership check
 */
export const getTicketById = async (
  ticketId: string,
  userId: string,
  isAdmin: boolean
) => {
  try {
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        comments: {
          where: isAdmin ? {} : { isInternal: false },
          orderBy: { createdAt: 'asc' },
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!ticket) {
      throw new AppError('Ticket not found', 404, 'NOT_FOUND');
    }

    if (!isAdmin && ticket.userId !== userId) {
      throw new AppError('Access denied', 403, 'FORBIDDEN');
    }

    return ticket;
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to fetch ticket', 500, 'INTERNAL_ERROR');
  }
};

/**
 * Update ticket (Admin or Owner for limited fields)
 */
export const updateTicket = async (
  ticketId: string,
  userId: string,
  isAdmin: boolean,
  data: UpdateTicketData
) => {
  try {
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new AppError('Ticket not found', 404, 'NOT_FOUND');
    }

    if (!isAdmin && ticket.userId !== userId) {
      throw new AppError('Access denied', 403, 'FORBIDDEN');
    }

    if (!isAdmin && (data.status || data.assignedToId !== undefined)) {
      throw new AppError(
        'Only admins can change status or assignment',
        403,
        'FORBIDDEN'
      );
    }

    if (data.status) {
      validateStatusTransition(ticket.status, data.status);
    }

    const updated = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        subject: data.subject,
        description: data.description,
        status: data.status,
        priority: data.priority,
        assignedToId: data.assignedToId,
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    return updated;
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to update ticket', 500, 'INTERNAL_ERROR');
  }
};

/**
 * Validate status transition
 */
const validateStatusTransition = (
  currentStatus: string,
  newStatus: TicketStatus
) => {
  const validTransitions: Record<string, TicketStatus[]> = {
    [TicketStatus.OPEN]: [TicketStatus.PENDING, TicketStatus.RESOLVED],
    [TicketStatus.PENDING]: [TicketStatus.OPEN, TicketStatus.RESOLVED],
    [TicketStatus.RESOLVED]: [TicketStatus.OPEN],
  };

  const allowed = validTransitions[currentStatus];
  if (!allowed || !allowed.includes(newStatus)) {
    throw new AppError(
      `Invalid status transition from ${currentStatus} to ${newStatus}`,
      400,
      'INVALID_STATE'
    );
  }
};

/**
 * Add comment to ticket
 */
export const addComment = async (data: CreateCommentData) => {
  try {
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: data.ticketId },
    });

    if (!ticket) {
      throw new AppError('Ticket not found', 404, 'NOT_FOUND');
    }

    if (!data.isAdmin && ticket.userId !== data.userId) {
      throw new AppError('Access denied', 403, 'FORBIDDEN');
    }

    if (!data.isAdmin && data.isInternal) {
      throw new AppError(
        'Only admins can add internal notes',
        403,
        'FORBIDDEN'
      );
    }

    const comment = await prisma.ticketComment.create({
      data: {
        ticketId: data.ticketId,
        userId: data.userId,
        message: data.message,
        isInternal: data.isInternal || false,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    await prisma.supportTicket.update({
      where: { id: data.ticketId },
      data: { updatedAt: new Date() },
    });

    return comment;
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to add comment', 500, 'INTERNAL_ERROR');
  }
};

/**
 * Assign ticket to admin (Admin only)
 */
export const assignTicket = async (
  ticketId: string,
  assignedToId: string | null
) => {
  try {
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new AppError('Ticket not found', 404, 'NOT_FOUND');
    }

    if (assignedToId) {
      const admin = await prisma.user.findUnique({
        where: { id: assignedToId },
      });

      if (!admin || !admin.isAdmin) {
        throw new AppError('Invalid admin user', 400, 'INVALID_STATE');
      }
    }

    const updated = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        assignedToId,
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    return updated;
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to assign ticket', 500, 'INTERNAL_ERROR');
  }
};

/**
 * Get ticket statistics (Admin)
 */
export const getTicketStats = async () => {
  try {
    const [total, open, pending, resolved, highPriority, unassigned] = await Promise.all([
      prisma.supportTicket.count(),
      prisma.supportTicket.count({ where: { status: TicketStatus.OPEN } }),
      prisma.supportTicket.count({ where: { status: TicketStatus.PENDING } }),
      prisma.supportTicket.count({ where: { status: TicketStatus.RESOLVED } }),
      prisma.supportTicket.count({
        where: {
          priority: {
            in: [TicketPriority.HIGH, TicketPriority.URGENT],
          },
        },
      }),
      prisma.supportTicket.count({ where: { assignedToId: null } }),
    ]);

    return {
      total,
      byStatus: {
        open,
        pending,
        resolved,
      },
      highPriority,
      unassigned,
    };
  } catch (error: any) {
    throw new AppError('Failed to fetch ticket stats', 500, 'INTERNAL_ERROR');
  }
};

/**
 * Delete ticket (Admin only)
 */
export const deleteTicket = async (ticketId: string) => {
  try {
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new AppError('Ticket not found', 404, 'NOT_FOUND');
    }

    await prisma.supportTicket.delete({
      where: { id: ticketId },
    });

    return { message: 'Ticket deleted successfully' };
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to delete ticket', 500, 'INTERNAL_ERROR');
  }
};