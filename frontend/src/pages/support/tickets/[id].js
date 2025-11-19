import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import { useAuth } from '../../../contexts/AuthContext';
import { supportAPI } from '../../../utils/supportAPI';
import toast from 'react-hot-toast';

export default function UserTicketDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user, loading: authLoading } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [activities, setActivities] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Role check - only allow regular users
  useEffect(() => {
    if (!authLoading && user && (user.role === 'admin' || user.role === 'superadmin')) {
      router.replace('/');
    }
  }, [user, authLoading, router]);

  // Fetch ticket details
  useEffect(() => {
    if (id && user && user.role !== 'admin' && user.role !== 'superadmin') {
      fetchTicketDetails();
    }
  }, [id, user]);

  const fetchTicketDetails = async () => {
    try {
      setLoading(true);
      const result = await supportAPI.getTicketDetails(id);

      // Verify ticket belongs to current user
      if (result.data.ticket.user_id !== user.id) {
        toast.error('You do not have permission to view this ticket');
        router.push('/support');
        return;
      }

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
        profile_picture_url: result.data.ticket.user?.profile_picture_url,
        first_name: result.data.ticket.user?.first_name,
        last_name: result.data.ticket.user?.last_name,
      });

      // Add comments and status changes (exclude internal notes)
      (result.data.comments || []).forEach((comment) => {
        // Skip internal notes for regular users
        if (comment.is_internal) {
          return;
        }

        // Check if it's a system comment (status change)
        const isStatusChange =
          comment.is_system || comment.comment?.includes('Status changed from');

        activityList.push({
          id: comment.id,
          type: isStatusChange ? 'status' : 'comment',
          user: `${comment.first_name} ${comment.last_name}`,
          timestamp: comment.created_at,
          content: comment.comment,
          role: comment.role,
          profile_picture_url: comment.profile_picture_url,
          first_name: comment.first_name,
          last_name: comment.last_name,
        });
      });

      // Sort by timestamp
      activityList.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

      setActivities(activityList);
    } catch (error) {
      toast.error('Failed to load ticket details');
      router.push('/support');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setIsSubmitting(true);
      await supportAPI.addComment(id, newComment);
      toast.success('Comment added successfully');

      // Refresh ticket details
      await fetchTicketDetails();
      setNewComment('');
    } catch (error) {
      toast.error('Failed to add comment');
    } finally {
      setIsSubmitting(false);
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

  const getStatusLabel = (status) => {
    switch (status) {
      case 'open':
        return 'Open';
      case 'in_progress':
        return 'In Progress';
      case 'resolved':
        return 'Resolved';
      case 'closed':
        return 'Closed';
      default:
        return status;
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
              onClick={() => router.push('/support')}
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
                Created on {new Date(ticket.created_at).toLocaleDateString()}
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
              <div className="flex items-center gap-3 mb-4">
                {ticket.user?.profile_picture_url ? (
                  <img
                    src={ticket.user.profile_picture_url}
                    alt={`${ticket.user.first_name} ${ticket.user.last_name}`}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-semibold">
                    {ticket.user?.first_name?.[0]?.toUpperCase() || ''}
                    {ticket.user?.last_name?.[0]?.toUpperCase() || ''}
                  </div>
                )}
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
                          {activity.profile_picture_url ? (
                            <img
                              src={activity.profile_picture_url}
                              alt={`${activity.first_name} ${activity.last_name}`}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-semibold">
                              {activity.first_name?.[0]?.toUpperCase() || ''}
                              {activity.last_name?.[0]?.toUpperCase() || ''}
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-foreground">{activity.user}</span>
                            {activity.role && activity.role !== 'user' && (
                              <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded">
                                {activity.role}
                              </span>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {new Date(activity.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <div
                            className={`${activity.type === 'comment' ? 'bg-muted/50 rounded-lg p-4 mt-2' : ''}`}
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
                <label className="block text-sm font-medium text-foreground mb-2">
                  Add Comment
                </label>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Type your comment..."
                  rows={3}
                  className="w-full px-4 py-3 bg-background border border-border text-foreground rounded-lg focus:ring-2 focus:ring-ring resize-none"
                />
                <div className="flex justify-end items-center mt-4 gap-2">
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
                    {isSubmitting ? 'Sending...' : 'Send Comment'}
                  </button>
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
                  <span
                    className={`inline-flex px-3 py-1.5 text-sm font-semibold rounded-lg ${getStatusColor(
                      ticket.status,
                    )}`}
                  >
                    {getStatusLabel(ticket.status)}
                  </span>
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

            {/* Ticket Details */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-card border border-border rounded-xl p-6"
            >
              <h3 className="text-sm font-semibold text-foreground mb-3">Ticket Details</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Ticket ID</p>
                  <p className="text-sm text-foreground">#{id}</p>
                </div>
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
                {ticket.category && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Category</p>
                    <p className="text-sm text-foreground">{ticket.category}</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
