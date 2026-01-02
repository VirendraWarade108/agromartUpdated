'use client';

import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  User,
  Clock,
  AlertCircle,
  Loader2,
  Send,
  Lock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

interface TicketThreadProps {
  ticketId: string;
  isAdmin?: boolean;
}

interface TicketUser {
  id: string;
  fullName: string;
  email: string;
}

interface Comment {
  id: string;
  message: string;
  isInternal: boolean;
  createdAt: string;
  user: TicketUser;
}

interface Ticket {
  id: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  user: TicketUser;
  assignedTo: TicketUser | null;
  comments: Comment[];
}

const statusConfig = {
  OPEN: { label: 'Open', color: 'bg-blue-100 text-blue-800', icon: AlertCircle },
  PENDING: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  RESOLVED: { label: 'Resolved', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
};

const priorityConfig = {
  LOW: { label: 'Low', color: 'text-gray-600' },
  MEDIUM: { label: 'Medium', color: 'text-blue-600' },
  HIGH: { label: 'High', color: 'text-orange-600' },
  URGENT: { label: 'Urgent', color: 'text-red-600' },
};

export default function TicketThread({ ticketId, isAdmin = false }: TicketThreadProps) {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchTicket();
  }, [ticketId]);

  const fetchTicket = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('access_token');

      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/support/tickets/${ticketId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to load ticket');
      }

      if (data.success) {
        setTicket(data.data);
      } else {
        throw new Error(data.message || 'Failed to load ticket');
      }
    } catch (err: any) {
      console.error('Ticket fetch error:', err);
      setError(err.message || 'Failed to load ticket');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newComment.trim()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('access_token');

      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/support/tickets/${ticketId}/comments`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            message: newComment.trim(),
            isInternal: isAdmin && isInternal,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to add comment');
      }

      if (data.success) {
        setNewComment('');
        setIsInternal(false);
        await fetchTicket();
      } else {
        throw new Error(data.message || 'Failed to add comment');
      }
    } catch (err: any) {
      console.error('Comment submission error:', err);
      alert(err.message || 'Failed to add comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="flex items-center justify-center gap-3 text-gray-600">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading ticket...</span>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="flex items-start gap-3 text-red-600">
          <AlertCircle className="h-6 w-6 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold mb-1">Error Loading Ticket</h3>
            <p className="text-sm text-red-700">{error || 'Ticket not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  const StatusIcon = statusConfig[ticket.status as keyof typeof statusConfig]?.icon || AlertCircle;

  return (
    <div className="space-y-6">
      {/* Ticket Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {ticket.subject}
            </h1>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1.5">
                <User className="h-4 w-4" />
                {ticket.user.fullName}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {formatDate(ticket.createdAt)}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
                statusConfig[ticket.status as keyof typeof statusConfig]?.color || 'bg-gray-100 text-gray-800'
              }`}
            >
              <StatusIcon className="h-4 w-4" />
              {statusConfig[ticket.status as keyof typeof statusConfig]?.label || ticket.status}
            </span>
            <span
              className={`text-sm font-medium ${
                priorityConfig[ticket.priority as keyof typeof priorityConfig]?.color || 'text-gray-600'
              }`}
            >
              {priorityConfig[ticket.priority as keyof typeof priorityConfig]?.label || ticket.priority} Priority
            </span>
          </div>
        </div>

        {ticket.assignedTo && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Assigned to: <span className="font-medium text-gray-900">{ticket.assignedTo.fullName}</span>
            </p>
          </div>
        )}
      </div>

      {/* Original Message */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-start gap-4">
          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
            <User className="h-5 w-5 text-green-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-semibold text-gray-900">
                {ticket.user.fullName}
              </span>
              <span className="text-sm text-gray-500">
                {formatDate(ticket.createdAt)}
              </span>
            </div>
            <div className="text-gray-700 whitespace-pre-wrap">
              {ticket.description}
            </div>
          </div>
        </div>
      </div>

      {/* Comments */}
      {ticket.comments && ticket.comments.length > 0 && (
        <div className="space-y-4">
          {ticket.comments.map((comment) => (
            <div
              key={comment.id}
              className={`rounded-lg shadow-sm border p-6 ${
                comment.isInternal
                  ? 'bg-amber-50 border-amber-200'
                  : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    comment.isInternal ? 'bg-amber-100' : 'bg-blue-100'
                  }`}
                >
                  {comment.isInternal ? (
                    <Lock className="h-5 w-5 text-amber-600" />
                  ) : (
                    <User className="h-5 w-5 text-blue-600" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-gray-900">
                      {comment.user.fullName}
                    </span>
                    {comment.isInternal && (
                      <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                        Internal Note
                      </span>
                    )}
                    <span className="text-sm text-gray-500">
                      {formatDate(comment.createdAt)}
                    </span>
                  </div>
                  <div className="text-gray-700 whitespace-pre-wrap">
                    {comment.message}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Comment Form */}
      {ticket.status !== 'RESOLVED' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Add Comment
          </h3>
          <form onSubmit={handleAddComment} className="space-y-4">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Type your message here..."
              rows={4}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
              disabled={isSubmitting}
            />

            {isAdmin && (
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={isInternal}
                  onChange={(e) => setIsInternal(e.target.checked)}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  disabled={isSubmitting}
                />
                <Lock className="h-4 w-4 text-amber-600" />
                <span>Mark as internal note (visible to admins only)</span>
              </label>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting || !newComment.trim()}
                className="bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Posting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Post Comment
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {ticket.status === 'RESOLVED' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
          <p className="text-sm text-green-800">
            This ticket has been resolved and is now closed for comments.
          </p>
        </div>
      )}
    </div>
  );
}