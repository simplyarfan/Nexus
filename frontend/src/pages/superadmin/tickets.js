import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import { supportAPI } from '../../utils/supportAPI';
import toast from 'react-hot-toast';

export default function SupportManagement() {
  const router = useRouter();
  const { user, isAdmin, isSuperAdmin, loading: authLoading } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [resolution, setResolution] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 50 });

  // Role check
  useEffect(() => {
    if (!authLoading && user && !isAdmin && !isSuperAdmin) {
      router.replace('/');
    }
  }, [user, isAdmin, isSuperAdmin, authLoading, router]);

  // Fetch tickets
  useEffect(() => {
    if (isAdmin || isSuperAdmin) {
      fetchTickets();
    }
  }, [isAdmin, isSuperAdmin, pagination.page, statusFilter, priorityFilter]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (statusFilter !== 'all') params.status = statusFilter;
      if (priorityFilter !== 'all') params.priority = priorityFilter;

      // Use getAllTickets for superadmins
      const result = await supportAPI.getAllTickets(params);
      console.log('API Response:', result);
      console.log('Tickets:', result.data?.data?.tickets || result.data?.tickets);

      // Handle both response structures
      const tickets = result.data?.data?.tickets || result.data?.tickets || [];
      const paginationData = result.data?.data?.pagination || result.data?.pagination || {};

      setTickets(tickets);
      setPagination((prev) => ({ ...prev, ...paginationData }));
    } catch (error) {
      console.error('Failed to load tickets:', error);
      toast.error('Failed to load tickets: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const openTicketDetails = async (ticket) => {
    try {
      setSelectedTicket(ticket);
      setShowTicketModal(true);

      // Fetch ticket details with comments
      const result = await supportAPI.getTicketDetails(ticket.id);
      setComments(result.data.comments || []);
    } catch (error) {
      toast.error('Failed to load ticket details');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setIsSubmitting(true);
      await supportAPI.addComment(selectedTicket.id, newComment);
      toast.success('Comment added successfully');

      // Refresh comments
      const result = await supportAPI.getTicketDetails(selectedTicket.id);
      setComments(result.data.comments || []);
      setNewComment('');
    } catch (error) {
      toast.error('Failed to add comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangeStatus = async (ticketId, newStatus) => {
    try {
      await supportAPI.updateTicketStatus(ticketId, newStatus);
      toast.success('Ticket status updated');
      fetchTickets();
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, status: newStatus });
      }
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleResolveTicket = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await supportAPI.resolveTicket(selectedTicket.id, resolution);
      toast.success('Ticket resolved successfully');
      setShowResolveModal(false);
      setShowTicketModal(false);
      fetchTickets();
    } catch (error) {
      toast.error('Failed to resolve ticket');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open':
        return 'text-blue-500 bg-transparent border-blue-500';
      case 'in_progress':
        return 'text-orange-500 bg-transparent border-orange-500';
      case 'resolved':
        return 'text-emerald-500 bg-transparent border-emerald-500';
      case 'closed':
        return 'text-gray-500 bg-transparent border-gray-500';
      default:
        return 'text-gray-500 bg-transparent border-gray-500';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-500 bg-transparent border-red-500';
      case 'high':
        return 'text-red-500 bg-transparent border-red-500';
      case 'medium':
        return 'text-amber-500 bg-transparent border-amber-500';
      case 'low':
        return 'text-emerald-500 bg-transparent border-emerald-500';
      default:
        return 'text-gray-500 bg-transparent border-gray-500';
    }
  };

  if (authLoading || (!isAdmin && !isSuperAdmin)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.user?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push(isSuperAdmin ? '/superadmin' : '/admin')}
              className="p-2 hover:bg-accent rounded-lg transition-colors"
            >
              <svg
                className="w-5 h-5 text-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Support Tickets</h1>
              <p className="text-muted-foreground mt-1">Manage and respond to support tickets</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Filters */}
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  placeholder="Search tickets by subject or user..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-3 w-full bg-secondary border border-border text-foreground rounded-lg focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-3 bg-secondary border border-border text-foreground rounded-lg focus:ring-2 focus:ring-ring"
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div className="sm:w-48">
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full px-4 py-3 bg-secondary border border-border text-foreground rounded-lg focus:ring-2 focus:ring-ring"
              >
                <option value="all">All Priority</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tickets Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-secondary">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase">
                      Ticket
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase">
                      User
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase">
                      Priority
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase">
                      Created
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredTickets.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <p className="text-muted-foreground">No tickets found</p>
                      </td>
                    </tr>
                  ) : (
                    filteredTickets.map((ticket) => (
                      <motion.tr
                        key={ticket.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-secondary transition-colors cursor-pointer"
                        onClick={() => router.push(`/superadmin/tickets/${ticket.id}`)}
                      >
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-foreground">
                            {ticket.subject}
                          </div>
                          <div className="text-sm text-muted-foreground line-clamp-1">
                            {ticket.description}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-foreground">
                            {ticket.user?.first_name} {ticket.user?.last_name}
                          </div>
                          <div className="text-sm text-muted-foreground">{ticket.user?.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={
                              'inline-flex px-4 py-1.5 text-xs font-semibold uppercase rounded-full border-2 ' +
                              getPriorityColor(ticket.priority)
                            }
                          >
                            {ticket.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={
                              'inline-flex px-4 py-1.5 text-xs font-semibold uppercase rounded-full border-2 ' +
                              getStatusColor(ticket.status)
                            }
                          >
                            {ticket.status?.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                          {new Date(ticket.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/superadmin/tickets/${ticket.id}`);
                            }}
                            className="text-primary hover:text-primary"
                          >
                            View
                          </button>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Ticket Details Modal */}
      <AnimatePresence>
        {showTicketModal && selectedTicket && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card rounded-xl p-6 w-full max-w-3xl my-8"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    {selectedTicket.subject}
                  </h2>
                  <div className="flex items-center gap-4">
                    <span
                      className={
                        'inline-flex px-4 py-1.5 text-xs font-semibold uppercase rounded-full border-2 ' +
                        getStatusColor(selectedTicket.status)
                      }
                    >
                      {selectedTicket.status?.replace('_', ' ')}
                    </span>
                    <span
                      className={
                        'inline-flex px-4 py-1.5 text-xs font-semibold uppercase rounded-full border-2 ' +
                        getPriorityColor(selectedTicket.priority)
                      }
                    >
                      {selectedTicket.priority}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setShowTicketModal(false)}
                  className="text-muted-foreground hover:text-muted-foreground"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* User Info */}
              <div className="mb-6 p-4 bg-secondary rounded-lg">
                <p className="text-sm text-muted-foreground">Submitted by:</p>
                <p className="text-sm font-medium text-foreground">
                  {selectedTicket.user?.first_name} {selectedTicket.user?.last_name} (
                  {selectedTicket.user?.email})
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(selectedTicket.created_at).toLocaleString()}
                </p>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-foreground mb-2">Description</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {selectedTicket.description}
                </p>
              </div>

              {/* Comments */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-foreground mb-4">
                  Comments ({comments.length})
                </h3>
                <div className="space-y-4 max-h-64 overflow-y-auto mb-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="p-4 bg-secondary rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-foreground">
                          {comment.first_name} {comment.last_name}
                          {comment.role !== 'user' && (
                            <span className="ml-2 text-xs text-primary">({comment.role})</span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(comment.created_at).toLocaleString()}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {comment.comment}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Add Comment Form */}
                <form onSubmit={handleAddComment} className="space-y-4">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    rows={3}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring"
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting || !newComment.trim()}
                    className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-primary disabled:opacity-50"
                  >
                    {isSubmitting ? 'Adding...' : 'Add Comment'}
                  </button>
                </form>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-border">
                <select
                  value={selectedTicket.status}
                  onChange={(e) => handleChangeStatus(selectedTicket.id, e.target.value)}
                  className="px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring"
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
                <button
                  onClick={() => setShowResolveModal(true)}
                  className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-primary"
                >
                  Resolve Ticket
                </button>
                <button
                  onClick={() => setShowTicketModal(false)}
                  className="ml-auto px-4 py-2 border border-border text-muted-foreground rounded-lg hover:bg-secondary"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Resolve Ticket Modal */}
      <AnimatePresence>
        {showResolveModal && selectedTicket && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card rounded-xl p-6 w-full max-w-md"
            >
              <h2 className="text-2xl font-bold text-foreground mb-4">Resolve Ticket</h2>
              <form onSubmit={handleResolveTicket} className="space-y-4">
                <textarea
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  placeholder="Resolution notes (optional)..."
                  rows={4}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring"
                />
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowResolveModal(false)}
                    className="flex-1 px-4 py-2 border border-border text-muted-foreground rounded-lg hover:bg-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 bg-accent text-white rounded-lg hover:bg-primary disabled:opacity-50"
                  >
                    {isSubmitting ? 'Resolving...' : 'Resolve'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
