'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus,
  MessageSquare,
  Clock,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Filter,
  Search,
  ChevronRight,
} from 'lucide-react';
import TicketForm from '@/components/support/TicketForm';
import TicketThread from '@/components/support/TicketThread';
import { useAuth } from '@/hooks/useAuth';

interface TicketUser {
  id: string;
  fullName: string;
  email: string;
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
  _count?: {
    comments: number;
  };
}

type ViewMode = 'list' | 'create' | 'view';
type StatusFilter = 'ALL' | 'OPEN' | 'PENDING' | 'RESOLVED';
type PriorityFilter = 'ALL' | 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

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

export default function UserSupportPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      fetchTickets();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    applyFilters();
  }, [tickets, statusFilter, priorityFilter, searchQuery]);

  const fetchTickets = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('access_token');

      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/support/tickets`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to load tickets');
      }

      if (data.success) {
        setTickets(data.data || []);
      } else {
        throw new Error(data.message || 'Failed to load tickets');
      }
    } catch (err: any) {
      console.error('Tickets fetch error:', err);
      setError(err.message || 'Failed to load tickets');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...tickets];

    if (statusFilter !== 'ALL') {
      filtered = filtered.filter((ticket) => ticket.status === statusFilter);
    }

    if (priorityFilter !== 'ALL') {
      filtered = filtered.filter((ticket) => ticket.priority === priorityFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (ticket) =>
          ticket.subject.toLowerCase().includes(query) ||
          ticket.description.toLowerCase().includes(query)
      );
    }

    setFilteredTickets(filtered);
  };

  const handleTicketCreated = (ticket: Ticket) => {
    setTickets((prev) => [ticket, ...prev]);
    setViewMode('view');
    setSelectedTicketId(ticket.id);
  };

  const handleViewTicket = (ticketId: string) => {
    setSelectedTicketId(ticketId);
    setViewMode('view');
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedTicketId(null);
    fetchTickets();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusCounts = () => {
    return {
      open: tickets.filter((t) => t.status === 'OPEN').length,
      pending: tickets.filter((t) => t.status === 'PENDING').length,
      resolved: tickets.filter((t) => t.status === 'RESOLVED').length,
    };
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 max-w-md w-full text-center">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Authentication Required
          </h2>
          <p className="text-gray-600">Please log in to access support tickets.</p>
        </div>
      </div>
    );
  }

  if (viewMode === 'create') {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={handleBackToList}
            className="mb-6 text-green-600 hover:text-green-700 font-medium flex items-center gap-2"
          >
            ← Back to Tickets
          </button>
          <TicketForm onSuccess={handleTicketCreated} onCancel={handleBackToList} />
        </div>
      </div>
    );
  }

  if (viewMode === 'view' && selectedTicketId) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={handleBackToList}
            className="mb-6 text-green-600 hover:text-green-700 font-medium flex items-center gap-2"
          >
            ← Back to Tickets
          </button>
          <TicketThread ticketId={selectedTicketId} isAdmin={false} />
        </div>
      </div>
    );
  }

  const statusCounts = getStatusCounts();

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Support Tickets</h1>
          <p className="text-gray-600">
            Manage your support tickets and get help from our team.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-600 mb-1">Total Tickets</p>
            <p className="text-2xl font-bold text-gray-900">{tickets.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-blue-200 p-4">
            <p className="text-sm text-gray-600 mb-1">Open</p>
            <p className="text-2xl font-bold text-blue-600">{statusCounts.open}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-yellow-200 p-4">
            <p className="text-sm text-gray-600 mb-1">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">{statusCounts.pending}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-green-200 p-4">
            <p className="text-sm text-gray-600 mb-1">Resolved</p>
            <p className="text-2xl font-bold text-green-600">{statusCounts.resolved}</p>
          </div>
        </div>

        {/* Actions & Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <button
              onClick={() => setViewMode('create')}
              className="bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Create New Ticket
            </button>

            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search tickets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="ALL">All Status</option>
              <option value="OPEN">Open</option>
              <option value="PENDING">Pending</option>
              <option value="RESOLVED">Resolved</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as PriorityFilter)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="ALL">All Priority</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>
        </div>

        {/* Tickets List */}
        {isLoading ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-green-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading tickets...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="flex items-start gap-3 text-red-600">
              <AlertCircle className="h-6 w-6 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold mb-1">Error Loading Tickets</h3>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Tickets Found</h3>
            <p className="text-gray-600 mb-6">
              {tickets.length === 0
                ? "You haven't created any support tickets yet."
                : 'No tickets match your current filters.'}
            </p>
            {tickets.length === 0 && (
              <button
                onClick={() => setViewMode('create')}
                className="bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 px-6 rounded-lg transition-colors inline-flex items-center gap-2"
              >
                <Plus className="h-5 w-5" />
                Create Your First Ticket
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTickets.map((ticket) => {
              const StatusIcon = statusConfig[ticket.status as keyof typeof statusConfig]?.icon || AlertCircle;
              
              return (
                <div
                  key={ticket.id}
                  onClick={() => handleViewTicket(ticket.id)}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 truncate">
                        {ticket.subject}
                      </h3>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {ticket.description}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-4 w-4" />
                          {formatDate(ticket.createdAt)}
                        </span>
                        {ticket._count && ticket._count.comments > 0 && (
                          <span className="flex items-center gap-1.5">
                            <MessageSquare className="h-4 w-4" />
                            {ticket._count.comments} {ticket._count.comments === 1 ? 'comment' : 'comments'}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
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
                        {priorityConfig[ticket.priority as keyof typeof priorityConfig]?.label || ticket.priority}
                      </span>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}