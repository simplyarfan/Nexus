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
  const [activities, setActivities] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Role check
  useEffect(() => {
    if (!authLoading && user && !isSuperAdmin) {
      router.replace('/');
    }
  }, [user, isSuperAdmin, authLoading, router]);

  // Fetch ticket details
  useEffect(() => {
    if (id && isSuperAdmin) {
      fetchTicketDetails();
    }
  }, [id, isSuperAdmin]);

  const fetchTicketDetails = async () => {
    try {
      setLoading(true);
      const result = await supportAPI.getTicketDetails(id);
      setTicket(result.data.ticket);
      setComments(result.data.comments || []);

      // Build activity timeline from ticket data and comments
      const activityList = [];

      // Add ticket creation
      activityList.push({
        id: `created-${result.data.ticket.id}`,
        type: 'created',
        user: `${result.data.ticket.user?.first_name} ${result.data.ticket.user?.last_name}`,
        timestamp: result.data.ticket.created_at,
        content: 'Ticket created',
      });

      // Add comments and status changes
      (result.data.comments || []).forEach((comment) => {
        // Check if it's a system comment (status change)
        const isStatusChange =
          comment.is_system || comment.comment?.includes('Status changed from');

        activityList.push({
          id: comment.id,
          type: isStatusChange ? 'status' : comment.is_internal ? 'internal' : 'comment',
          user: `${comment.first_name} ${comment.last_name}`,
          timestamp: comment.created_at,
          content: comment.comment,
          isInternal: comment.is_internal,
          role: comment.role,
        });
      });

      // Sort by timestamp
      activityList.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

      setActivities(activityList);
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
      await supportAPI.addComment(id, newComment, isInternalNote);
      toast.success(
        isInternalNote ? 'Internal note added successfully' : 'Comment added successfully',
      );

      // Refresh ticket details
      await fetchTicketDetails();
      setNewComment('');
      setIsInternalNote(false);
    } catch (error) {
      toast.error('Failed to add comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangeStatus = async (newStatus) => {
    try {
      const oldStatus = ticket.status;
      await supportAPI.updateTicketStatus(id, newStatus);
      toast.success('Status updated successfully');

      // Refresh ticket details to get updated activities
      await fetchTicketDetails();
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
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/superadmin/tickets')}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
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
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-foreground">{ticket.subject}</h1>
                <span className="text-muted-foreground">#{id}</span>
              </div>
              <p className="text-muted-foreground mt-1">
                Created by {ticket.user?.first_name} {ticket.user?.last_name} on{' '}
                {new Date(ticket.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
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

            {/* Activity Timeline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card border border-border rounded-xl p-6"
            >
              <h2 className="text-xl font-bold text-foreground mb-6">Activity</h2>

              {/* Activity List */}
              <div className="space-y-6 mb-6">
                {activities.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No activity yet</p>
                ) : (
                  activities.map((activity, index) => (
                    <div key={activity.id} className="relative">
                      {/* Timeline Line */}
                      {index !== activities.length - 1 && (
                        <div className="absolute left-6 top-14 w-0.5 h-full bg-border" />
                      )}

                      <div className="flex gap-4">
                        {/* Avatar/Icon */}
                        <div className="flex-shrink-0">
                          {activity.type === 'created' || activity.type === 'status' ? (
                            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                              <svg
                                className="w-5 h-5 text-muted-foreground"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                {activity.type === 'created' ? (
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 4v16m8-8H4"
                                  />
                                ) : (
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                  />
                                )}
                              </svg>
                            </div>
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                              <span className="text-sm font-medium text-foreground">
                                {activity.user?.[0] || 'A'}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-foreground">{activity.user}</span>
                            {activity.isInternal && (
                              <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded-full">
                                Internal Note
                              </span>
                            )}
                            {activity.role && activity.role !== 'user' && !activity.isInternal && (
                              <span className="text-xs px-2 py-0.5 bg-muted text-muted-foreground rounded">
                                {activity.role}
                              </span>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {new Date(activity.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <div
                            className={`${activity.type === 'comment' || activity.type === 'internal' ? 'bg-muted/50 rounded-lg p-4 mt-2' : ''}`}
                          >
                            <p
                              className={`text-sm ${activity.type === 'status' ? 'text-muted-foreground italic' : 'text-foreground'} whitespace-pre-wrap`}
                            >
                              {activity.content}
                            </p>
                          </div>
                        </div>
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
                      checked={isInternalNote}
                      onChange={(e) => setIsInternalNote(e.target.checked)}
                      className="rounded border-border"
                    />
                    Internal note (not visible to user)
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setNewComment('');
                        setIsInternalNote(false);
                      }}
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
            {/* Status & Priority */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-card border border-border rounded-xl p-6"
            >
              <div className="space-y-4">
                <div>
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
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3">Priority</h3>
                  <span
                    className={`inline-flex px-3 py-1.5 text-sm font-semibold rounded-lg ${getPriorityColor(
                      ticket.priority,
                    )}`}
                  >
                    {ticket.priority}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* User Information */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 }}
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
