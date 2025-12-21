import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import { useAuth } from '../../../contexts/AuthContext';
import { supportAPI } from '../../../utils/supportAPI';
import toast from 'react-hot-toast';

export default function TicketDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user, isSuperAdmin, loading: authLoading } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInternal, setIsInternal] = useState(false);

  // Role check
  useEffect(() => {
    if (!authLoading && user && !isSuperAdmin) {
      router.replace('/');
    }
  }, [user, isSuperAdmin, authLoading, router]);

  // Fetch data when authenticated and ID is available
  useEffect(() => {
    if (isSuperAdmin && id) {
      fetchTicketDetails();
    }
  }, [isSuperAdmin, id]);

  const fetchTicketDetails = async () => {
    try {
      setLoading(true);
      const result = await supportAPI.getTicketDetails(id);
      setTicket(result.data.ticket);
      setComments(result.data.comments || []);
    } catch (error) {
      toast.error('Failed to load ticket details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setIsSubmitting(true);
      await supportAPI.addComment(id, newComment, isInternal);
      toast.success('Comment added successfully');

      // Refresh ticket details
      await fetchTicketDetails();
      setNewComment('');
      setIsInternal(false);
    } catch (error) {
      toast.error('Failed to add comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangeStatus = async (newStatus) => {
    try {
      await supportAPI.updateTicketStatus(id, newStatus);
      toast.success('Status updated successfully');

      // Update local state
      setTicket({ ...ticket, status: newStatus });
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleDeleteTicket = async () => {
    if (!confirm('Are you sure you want to delete this ticket? This action cannot be undone.')) {
      return;
    }

    try {
      await supportAPI.deleteTicket(id);
      toast.success('Ticket deleted successfully');
      router.push('/superadmin/tickets');
    } catch (error) {
      toast.error('Failed to delete ticket');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open':
        return 'bg-blue-500/10 text-blue-600 border border-blue-500/20';
      case 'in_progress':
        return 'bg-amber-500/10 text-amber-600 border border-amber-500/20';
      case 'resolved':
        return 'bg-green-500/10 text-green-600 border border-green-500/20';
      case 'closed':
        return 'bg-gray-500/10 text-gray-600 border border-gray-500/20';
      default:
        return 'bg-gray-500/10 text-gray-600 border border-gray-500/20';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500/10 text-red-600 border border-red-500/20';
      case 'high':
        return 'bg-orange-500/10 text-orange-600 border border-orange-500/20';
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-600 border border-yellow-500/20';
      case 'low':
        return 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20';
      default:
        return 'bg-gray-500/10 text-gray-600 border border-gray-500/20';
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">Ticket Not Found</h2>
          <button onClick={() => router.push('/superadmin/tickets')}>Back to Tickets</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Back Button */}
          <button
            onClick={() => router.push('/superadmin/tickets')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <svg
              className="w-4 h-4"
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
            <span className="text-sm font-medium">Back to Tickets</span>
          </button>

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-foreground">{ticket.subject}</h1>
                <span className="text-muted-foreground">#{id}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Created by {ticket.user?.first_name} {ticket.user?.last_name} on{' '}
                {new Date(ticket.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>


      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Ticket Description */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-xl p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-foreground font-semibold">
                    {ticket.user?.first_name?.[0]}
                    {ticket.user?.last_name?.[0]}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-foreground">
                    {ticket.user?.first_name} {ticket.user?.last_name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(ticket.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
              <p className="text-muted-foreground whitespace-pre-wrap">{ticket.description}</p>
            </motion.div>

            {/* Activity / Comments */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card border border-border rounded-xl p-6"
            >
              <h2 className="text-xl font-bold text-foreground mb-6">Activity</h2>

              {/* Comments List */}
              <div className="space-y-6 mb-6">
                {comments.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No comments yet</p>
                ) : (
                  comments.map((comment, index) => (
                    <div key={comment.id} className="flex gap-3">
                      <div className="flex-shrink-0">
                        {index === 0 ? (
                          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                            <svg
                              className="w-4 h-4 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 4v16m8-8H4"
                              />
                            </svg>
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                            <span className="text-xs text-muted-foreground">
                              {comment.first_name?.[0]}
                              {comment.last_name?.[0]}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-foreground">
                            {comment.first_name} {comment.last_name}
                          </span>
                          {comment.role !== 'user' && (
                            <span className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded">
                              {comment.role}
                            </span>
                          )}
                          {comment.is_internal && (
                            <span className="px-2 py-0.5 text-xs bg-green-500/10 text-green-600 border border-green-500/20 rounded">
                              Internal Note
                            </span>
                          )}
                          <span className="text-sm text-muted-foreground">
                            {new Date(comment.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-muted-foreground whitespace-pre-wrap">
                          {comment.comment}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Add Reply Form */}
              <form onSubmit={handleAddComment} className="border-t border-border pt-6">
                <label className="block text-sm font-medium text-foreground mb-2">Add Reply</label>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Type your reply..."
                  rows={3}
                  className="w-full px-4 py-3 bg-background border border-border text-foreground rounded-lg focus:ring-2 focus:ring-ring resize-none"
                />
                <div className="flex justify-between items-center mt-4">
                  <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isInternal}
                      onChange={(e) => setIsInternal(e.target.checked)}
                      className="rounded border-border"
                    />
                    Internal note (not visible to user)
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setNewComment('')}
                      className="px-4 py-2 text-sm font-medium text-muted-foreground bg-background border border-border rounded-lg hover:bg-muted transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || !newComment.trim()}
                      className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isSubmitting ? 'Sending...' : 'Send Reply'}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-card border border-border rounded-xl p-6"
            >
              <h3 className="text-sm font-semibold text-foreground mb-3">Status</h3>
              <select
                value={ticket.status}
                onChange={(e) => handleChangeStatus(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border text-foreground rounded-lg focus:ring-2 focus:ring-ring"
              >
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </motion.div>

            {/* Priority */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-card border border-border rounded-xl p-6"
            >
              <h3 className="text-sm font-semibold text-foreground mb-3">Priority</h3>
              <span
                className={`inline-flex px-3 py-1.5 text-sm font-semibold rounded-lg ${getPriorityColor(
                  ticket.priority,
                )}`}
              >
                {ticket.priority}
              </span>
            </motion.div>

            {/* User Information */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card border border-border rounded-xl p-6"
            >
              <h3 className="text-sm font-semibold text-foreground mb-3">User Information</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Name</p>
                  <p className="text-sm text-foreground">
                    {ticket.user?.first_name} {ticket.user?.last_name}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Email</p>
                  <p className="text-sm text-foreground">{ticket.user?.email}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Assigned To</p>
                  <p className="text-sm text-foreground">
                    {ticket.assigned_to?.first_name || 'Admin User'}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Ticket Details */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-card border border-border rounded-xl p-6"
            >
              <h3 className="text-sm font-semibold text-foreground mb-3">Ticket Details</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Created</p>
                  <p className="text-sm text-foreground">
                    {new Date(ticket.created_at).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Last Updated</p>
                  <p className="text-sm text-foreground">
                    {new Date(ticket.updated_at).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Ticket ID</p>
                  <p className="text-sm text-foreground">#{id}</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
