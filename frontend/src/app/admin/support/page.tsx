'use client';

import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Clock,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Search,
  ChevronRight,
  User,
  UserCheck,
  X,
  Save,
} from 'lucide-react';
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

interface TicketStats {
  total: number;
  byStatus: {
    open: number;
    pending: number;
    resolved: number;
  };
  highPriority: number;
  unassigned: number;
}

interface AdminUser {
  id: string;
  fullName: string;
  email: string;
}

type ViewMode = 'list' | 'view';
type StatusFilter = 'ALL' | 'OPEN' | 'PENDING' | 'RESOLVED';
type PriorityFilter = 'ALL' | 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

const statusConfig = {
  OPEN: { label: 'Open', color: 'bg-blue-100 text-blue-800', icon: AlertCircle },
  PENDING: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  RESOLVED: { label: 'Resolved', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
};

const priorityConfig = {
  LOW: { label: 'Low', color: 'text-gray-600 bg-gray-100' },
  MEDIUM: { label: 'Medium', color: 'text-blue-600 bg-blue-100' },
  HIGH: { label: 'High', color: 'text-orange-600 bg-orange-100' },
  URGENT: { label: 'Urgent', color: 'text-red-600 bg-red-100' },
};

export default function AdminSupportPage() {
  const { isAuthenticated, isAdmin, isLoading: authLoading } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [assignmentFilter, setAssignmentFilter] = useState<string>('ALL');
  
  const [editingTicket, setEditingTicket] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<string>('');
  const [editAssignee, setEditAssignee] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      fetchData();
    }
  }, [isAuthenticated, isAdmin]);

  useEffect(() => {
    applyFilters();
  }, [tickets, statusFilter, priorityFilter, searchQuery, assignmentFilter]);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('access_token');

      if (!token) {
        throw new Error('Authentication required');
      }

      const [ticketsRes, statsRes, adminsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/support/admin/tickets`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/support/admin/tickets/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users?isAdmin=true`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const [ticketsData, statsData, adminsData] = await Promise.all([
        ticketsRes.json(),
        statsRes.json(),
        adminsRes.json(),
      ]);

      if (ticketsData.success) {
        setTickets(ticketsData.data || []);
      }

      if (statsData.success) {
        setStats(statsData.data);
      }

      if (adminsData.success) {
        setAdminUsers(adminsData.data?.users || []);
      }
    } catch (err: any) {
      console.error('Data fetch error:', err);
      setError(err.message || 'Failed to load data');
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

    if (assignmentFilter === 'UNASSIGNED') {
      filtered = filtered.filter((ticket) => !ticket.assignedTo);
    } else if (assignmentFilter !== 'ALL') {
      filtered = filtered.filter((ticket) => ticket.assignedTo?.id === assignmentFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (ticket) =>
          ticket.subject.toLowerCase().includes(query) ||
          ticket.description.toLowerCase().includes(query) ||
          ticket.user.fullName.toLowerCase().includes(query) ||
          ticket.user.email.toLowerCase().includes(query)
      );
    }

    setFilteredTickets(filtered);
  };

  const handleViewTicket = (ticketId: string) => {
    setSelectedTicketId(ticketId);
    setViewMode('view');
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedTicketId(null);
    fetchData();
  };

  const handleEditTicket = (ticket: Ticket) => {
    setEditingTicket(ticket.id);
    setEditStatus(ticket.status);
    setEditAssignee(ticket.assignedTo?.id || '');
  };

  const handleCancelEdit = () => {
    setEditingTicket(null);
    setEditStatus('');
    setEditAssignee('');
  };

  const handleSaveTicket = async (ticketId: string) => {
    setIsSaving(true);

    try {
      const token = localStorage.getItem('access_token');

      if (!token) {
        throw new Error('Authentication required');
      }

      const [statusRes, assignRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/support/tickets/${ticketId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: editStatus }),
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/support/admin/tickets/${ticketId}/assign`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ assignedToId: editAssignee || null }),
        }),
      ]);

      const [statusData, assignData] = await Promise.all([
        statusRes.json(),
        assignRes.json(),
      ]);

      if (statusData.success && assignData.success) {
        await fetchData();
        handleCancelEdit();
      } else {
        throw new Error('Failed to update ticket');
      }
    } catch (err: any) {
      console.error('Update error:', err);
      alert(err.message || 'Failed to update ticket');
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 max-w-md w-full text-center">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Admin Access Required
          </h2>
          <p className="text-gray-600">
            You need administrator privileges to access this page.
          </p>
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
            ← Back to All Tickets
          </button>
          <TicketThread ticketId={selectedTicketId} isAdmin={true} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Support Ticket Management
          </h1>
          <p className="text-gray-600">
            Manage and respond to all support tickets from users.
          </p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <p className="text-sm text-gray-600 mb-1">Total Tickets</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-blue-200 p-4">
              <p className="text-sm text-gray-600 mb-1">Open</p>
              <p className="text-2xl font-bold text-blue-600">{stats.byStatus.open}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-yellow-200 p-4">
              <p className="text-sm text-gray-600 mb-1">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.byStatus.pending}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-green-200 p-4">
              <p className="text-sm text-gray-600 mb-1">Resolved</p>
              <p className="text-2xl font-bold text-green-600">{stats.byStatus.resolved}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-red-200 p-4">
              <p className="text-sm text-gray-600 mb-1">High Priority</p>
              <p className="text-2xl font-bold text-red-600">{stats.highPriority}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
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

            <select
              value={assignmentFilter}
              onChange={(e) => setAssignmentFilter(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="ALL">All Assignments</option>
              <option value="UNASSIGNED">Unassigned</option>
              {adminUsers.map((admin) => (
                <option key={admin.id} value={admin.id}>
                  {admin.fullName}
                </option>
              ))}
            </select>

            <button
              onClick={() => {
                setStatusFilter('ALL');
                setPriorityFilter('ALL');
                setAssignmentFilter('ALL');
                setSearchQuery('');
              }}
              className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Clear Filters
            </button>
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
            <p className="text-gray-600">
              {tickets.length === 0
                ? 'No support tickets have been created yet.'
                : 'No tickets match your current filters.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTickets.map((ticket) => {
              const StatusIcon = statusConfig[ticket.status as keyof typeof statusConfig]?.icon || AlertCircle;
              const isEditing = editingTicket === ticket.id;

              return (
                <div
                  key={ticket.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => !isEditing && handleViewTicket(ticket.id)}
                    >
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 truncate">
                        {ticket.subject}
                      </h3>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {ticket.description}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1.5">
                          <User className="h-4 w-4" />
                          {ticket.user.fullName}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-4 w-4" />
                          {formatDate(ticket.createdAt)}
                        </span>
                        {ticket._count && ticket._count.comments > 0 && (
                          <span className="flex items-center gap-1.5">
                            <MessageSquare className="h-4 w-4" />
                            {ticket._count.comments}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 flex-shrink-0 min-w-[200px]">
                      {isEditing ? (
                        <>
                          <select
                            value={editStatus}
                            onChange={(e) => setEditStatus(e.target.value)}
                            className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                            disabled={isSaving}
                          >
                            <option value="OPEN">Open</option>
                            <option value="PENDING">Pending</option>
                            <option value="RESOLVED">Resolved</option>
                          </select>
                          <select
                            value={editAssignee}
                            onChange={(e) => setEditAssignee(e.target.value)}
                            className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                            disabled={isSaving}
                          >
                            <option value="">Unassigned</option>
                            {adminUsers.map((admin) => (
                              <option key={admin.id} value={admin.id}>
                                {admin.fullName}
                              </option>
                            ))}
                          </select>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSaveTicket(ticket.id)}
                              disabled={isSaving}
                              className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                            >
                              {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                              Save
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              disabled={isSaving}
                              className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
                              statusConfig[ticket.status as keyof typeof statusConfig]?.color || 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            <StatusIcon className="h-4 w-4" />
                            {statusConfig[ticket.status as keyof typeof statusConfig]?.label || ticket.status}
                          </span>
                          <span
                            className={`px-3 py-1.5 rounded text-sm font-medium ${
                              priorityConfig[ticket.priority as keyof typeof priorityConfig]?.color || 'text-gray-600 bg-gray-100'
                            }`}
                          >
                            {priorityConfig[ticket.priority as keyof typeof priorityConfig]?.label || ticket.priority}
                          </span>
                          {ticket.assignedTo ? (
                            <span className="text-xs text-gray-600 flex items-center gap-1">
                              <UserCheck className="h-3 w-3" />
                              {ticket.assignedTo.fullName}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">Unassigned</span>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditTicket(ticket);
                            }}
                            className="mt-1 text-sm text-green-600 hover:text-green-700 font-medium"
                          >
                            Edit
                          </button>
                        </>
                      )}
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