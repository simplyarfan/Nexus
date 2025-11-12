/**
 * Single Ticket Detail Page
 * View ticket details and add comments
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import { useApi } from '../../hooks/useApi';
import toast from 'react-hot-toast';

export default function TicketDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user, loading: authLoading } = useAuth();
  const { get, post, loading } = useApi();
  const [ticket, setTicket] = useState(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && id) {
      fetchTicket();
    }
  }, [user, id]);

  const fetchTicket = async () => {
    try {
      const data = await get(`/api/tickets/${id}`);
      setTicket(data.ticket);
    } catch (error) {
      toast.error('Failed to load ticket');
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setSubmitting(true);
    try {
      await post(`/api/tickets/${id}/comments`, { comment });
      toast.success('Comment added successfully');
      setComment('');
      fetchTicket(); // Refresh ticket data
    } catch (error) {
      toast.error('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      open: 'bg-blue-100 text-blue-800',
      'in-progress': 'bg-yellow-100 text-yellow-800',
      resolved: 'bg-accent text-primary',
      closed: 'bg-muted text-foreground',
    };
    return colors[status] || 'bg-muted text-foreground';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'text-primary',
      medium: 'text-yellow-600',
      high: 'text-orange-600',
      urgent: 'text-red-600',
    };
    return colors[priority] || 'text-muted-foreground';
  };

  if (authLoading || loading || !ticket) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading ticket...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Ticket #{ticket.id} - Enterprise AI Hub</title>
      </Head>

      <div className="min-h-screen bg-secondary py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <Link
            href="/tickets"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Tickets
          </Link>

          {/* Ticket Header */}
          <div className="bg-card shadow rounded-lg p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-foreground">{ticket.subject}</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Ticket #{ticket.id} • Created {new Date(ticket.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span
                  className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                    ticket.status,
                  )}`}
                >
                  {ticket.status}
                </span>
                <span className={`text-sm font-medium ${getPriorityColor(ticket.priority)}`}>
                  {ticket.priority}
                </span>
              </div>
            </div>

            {ticket.category && (
              <div className="mb-4">
                <span className="text-sm text-muted-foreground">Category:</span>
                <span className="ml-2 text-sm font-medium text-foreground">{ticket.category}</span>
              </div>
            )}

            <div className="prose max-w-none">
              <p className="text-muted-foreground">{ticket.description}</p>
            </div>
          </div>

          {/* Comments Section */}
          <div className="bg-card shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Comments ({ticket.comments?.length || 0})
            </h2>

            {/* Comments List */}
            {ticket.comments && ticket.comments.length > 0 ? (
              <div className="space-y-4 mb-6">
                {ticket.comments.map((c) => (
                  <div key={c.id} className="border-l-4 border-blue-500 pl-4 py-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-foreground">
                        {c.user?.first_name} {c.user?.last_name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(c.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{c.comment}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground mb-6">No comments yet.</p>
            )}

            {/* Add Comment Form */}
            {ticket.status !== 'closed' && (
              <form onSubmit={handleSubmitComment}>
                <label htmlFor="comment" className="block text-sm font-medium text-muted-foreground mb-2">
                  Add a comment
                </label>
                <textarea
                  id="comment"
                  rows="4"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-border rounded-md"
                  placeholder="Type your comment here..."
                />
                <div className="mt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={submitting || !comment.trim()}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Submitting...' : 'Submit Comment'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
