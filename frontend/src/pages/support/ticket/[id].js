import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/router';

export default function TicketDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [ticketStatus, setTicketStatus] = useState('open');
  const [replyText, setReplyText] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Mock ticket data - replace with API call
  const ticket = {
    id: id || 'TICKET-001',
    subject: 'Login Issue - Cannot access account',
    description:
      'I am unable to log into my account. When I enter my credentials, I get an error message saying "Invalid credentials" even though I am sure my password is correct. I have tried resetting my password multiple times but the issue persists.',
    user_name: 'John Doe',
    user_email: 'john@example.com',
    status: ticketStatus,
    priority: 'high',
    created_at: '2024-01-15T10:30:00',
    updated_at: '2024-01-15T14:45:00',
    assigned_to: 'Admin User',
  };

  // Mock comments/activity
  const activities = [
    {
      id: 1,
      type: 'created',
      user: 'John Doe',
      timestamp: '2024-01-15T10:30:00',
      content: 'Ticket created',
    },
    {
      id: 2,
      type: 'comment',
      user: 'Admin User',
      timestamp: '2024-01-15T11:15:00',
      content:
        'Hi John, I can see your account. Let me check the authentication logs to see what might be causing this issue.',
      isInternal: false,
    },
    {
      id: 3,
      type: 'internal',
      user: 'Admin User',
      timestamp: '2024-01-15T11:20:00',
      content: 'Found multiple failed login attempts from the same IP. Possible account lockout.',
      isInternal: true,
    },
    {
      id: 4,
      type: 'status',
      user: 'Admin User',
      timestamp: '2024-01-15T11:25:00',
      content: 'Status changed from Open to In Progress',
    },
    {
      id: 5,
      type: 'comment',
      user: 'Admin User',
      timestamp: '2024-01-15T14:45:00',
      content:
        'I have reset your account lockout. Please try logging in again. Your account should now work properly.',
      isInternal: false,
    },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'open':
        return 'bg-green-50 text-green-900 border-accent';
      case 'in_progress':
        return 'bg-green-500/10 text-green-600 border-primary/20';
      case 'resolved':
        return 'bg-green-500/10 text-green-600 border-primary/20';
      case 'closed':
        return 'bg-muted text-muted-foreground border-border';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500/10 text-red-600 border-destructive/20';
      case 'medium':
        return 'bg-green-50 text-green-900 border-accent';
      case 'low':
        return 'bg-green-500/10 text-green-600 border-primary/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    // Handle reply submission

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setReplyText('');
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-secondary">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/superadmin/tickets')}
              className="p-2 hover:bg-green-50 rounded-lg transition-colors"
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
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-foreground">{ticket.subject}</h1>
                <span className="text-sm text-muted-foreground">#{ticket.id}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Created by {ticket.user_name} • {new Date(ticket.created_at).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Ticket Details & Activity */}
          <div className="lg:col-span-2 space-y-6">
            {/* Ticket Description */}
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                    <span className="text-lg font-medium text-white">{ticket.user_name[0]}</span>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-foreground">{ticket.user_name}</h3>
                    <span className="text-xs text-muted-foreground">
                      {new Date(ticket.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-foreground leading-relaxed">{ticket.description}</p>
                </div>
              </div>
            </div>

            {/* Activity Timeline */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-lg font-bold text-foreground mb-6">Activity</h3>
              <div className="space-y-6">
                {activities.map((activity, index) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="relative"
                  >
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
                          <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                            <span className="text-sm font-medium text-white">
                              {activity.user[0]}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-foreground">{activity.user}</span>
                          {activity.isInternal && (
                            <span className="text-xs px-2 py-0.5 bg-green-50 text-green-900 border border-accent rounded-full">
                              Internal Note
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
                            className={`text-sm ${activity.type === 'status' ? 'text-muted-foreground italic' : 'text-foreground'}`}
                          >
                            {activity.content}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Reply Form */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-lg font-bold text-foreground mb-4">Add Reply</h3>
              <form onSubmit={handleReply} className="space-y-4">
                <div>
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your reply..."
                    rows={5}
                    className="w-full px-4 py-3 bg-secondary border border-border text-foreground placeholder-muted-foreground rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isInternal}
                      onChange={(e) => setIsInternal(e.target.checked)}
                      className="w-4 h-4 rounded border-border text-green-600 focus:ring-primary"
                    />
                    <span className="text-sm text-foreground">
                      Internal note (not visible to user)
                    </span>
                  </label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      className="px-4 py-2.5 text-foreground hover:bg-green-50 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-4 py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-500/90 transition-colors font-medium inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                        />
                      </svg>
                      {isLoading ? 'Sending...' : 'Send Reply'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* Sidebar - Ticket Info */}
          <div className="space-y-6">
            {/* Status & Priority */}
            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Status</label>
                <select
                  value={ticketStatus}
                  onChange={(e) => setTicketStatus(e.target.value)}
                  className="w-full px-4 py-2.5 bg-secondary border border-border text-foreground rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Priority</label>
                <div
                  className={`inline-flex px-4 py-2 rounded-lg border ${getPriorityColor(ticket.priority)}`}
                >
                  <span className="font-semibold capitalize">{ticket.priority}</span>
                </div>
              </div>
            </div>

            {/* User Information */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-lg font-bold text-foreground mb-4">User Information</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Name</p>
                  <p className="text-sm font-medium text-foreground">{ticket.user_name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Email</p>
                  <p className="text-sm font-medium text-foreground">{ticket.user_email}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Assigned To</p>
                  <p className="text-sm font-medium text-foreground">{ticket.assigned_to}</p>
                </div>
              </div>
            </div>

            {/* Ticket Details */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-lg font-bold text-foreground mb-4">Ticket Details</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Created</p>
                  <p className="text-sm font-medium text-foreground">
                    {new Date(ticket.created_at).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Last Updated</p>
                  <p className="text-sm font-medium text-foreground">
                    {new Date(ticket.updated_at).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Ticket ID</p>
                  <p className="text-sm font-medium text-foreground">#{ticket.id}</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-lg font-bold text-foreground mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full px-4 py-2.5 bg-secondary hover:bg-green-50 border border-border text-foreground rounded-lg transition-colors text-sm font-medium inline-flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  Assign to Me
                </button>
                <button className="w-full px-4 py-2.5 bg-green-500/10 hover:bg-green-500/20 border border-primary/20 text-green-600 rounded-lg transition-colors text-sm font-medium inline-flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Mark
                </button>
                <button className="w-full px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-destructive/20 text-red-600 rounded-lg transition-colors text-sm font-medium inline-flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  Delete Ticket
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
