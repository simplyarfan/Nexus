import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import Head from 'next/head';
import { supportAPI } from '../../utils/api';
import ErrorBoundary from '../../components/shared/ErrorBoundary';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
  Search,
  Filter,
  MessageCircle,
  MessageSquare,
  User,
  Calendar,
  Tag,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  LifeBuoy,
  ArrowLeft,
  Eye,
  Reply,
  Sparkles,
} from 'lucide-react';

export default function TicketsManagement() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  useEffect(() => {
    if (!loading && (!user || user.email !== 'syedarfan@securemaxtech.com')) {
      router.push('/');
      return;
    }
    if (user) {
      fetchTickets();
    }
  }, [user, loading, router]);

  const fetchTickets = async () => {
    try {
      setIsLoading(true);
      console.log('🎫 Fetching support tickets...');

      const response = await supportAPI.getAllTickets();
      console.log('📋 Tickets API response:', response);

      if (response && response.data && response.data.data) {
        // Backend returns: { success: true, data: { tickets: [...], pagination: {...} } }
        const ticketData = response.data.data.tickets || [];
        const paginationData = response.data.data.pagination || {};

        console.log('🎫 Setting tickets:', ticketData);
        console.log('📄 Pagination:', paginationData);
        setTickets(Array.isArray(ticketData) ? ticketData : []);
      } else {
        console.log('⚠️ No ticket data in response, setting empty array');
        console.log('Response structure:', response);
        setTickets([]);
      }
    } catch (error) {
      console.error('❌ Error fetching tickets:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      toast.error(`Failed to fetch tickets: ${error.response?.data?.message || error.message}`);
      setTickets([]);
    } finally {
      setIsLoading(false);
    }
  };

  const updateTicketStatus = async (ticketId, newStatus) => {
    try {
      console.log('🔧 Updating ticket status:', ticketId, 'to:', newStatus);

      // Optimistically update the UI immediately
      setTickets((prevTickets) =>
        prevTickets.map((ticket) =>
          ticket.id === ticketId
            ? { ...ticket, status: newStatus, updated_at: new Date().toISOString() }
            : ticket,
        ),
      );

      const response = await supportAPI.updateTicketStatus(ticketId, newStatus);
      console.log('📝 Update response:', response);

      // Check if response is successful
      const isSuccess = response?.data?.success || response?.success;

      if (isSuccess) {
        toast.success('Ticket status updated');
        // Refresh in background to ensure consistency
        setTimeout(() => fetchTickets(), 500);
      } else {
        // Revert optimistic update on failure
        fetchTickets();
        const errorMessage =
          response?.data?.message || response?.message || 'Failed to update ticket status';
        console.error('❌ Update failed:', response);
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('❌ Error updating ticket status:', error);
      console.error('Error details:', error.response?.data);

      // Check if the error is actually a successful update (status 200)
      if (error.response?.status === 200 || error.response?.data?.success) {
        toast.success('Ticket status updated');
        setTimeout(() => fetchTickets(), 500);
      } else {
        // Revert optimistic update on failure
        fetchTickets();
        toast.error(
          `Failed to update ticket status: ${error.response?.data?.message || error.message}`,
        );
      }
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'open':
        return <AlertCircle className="w-4 h-4 text-yellow-400" />;
      case 'in_progress':
        return <Clock className="w-4 h-4 text-blue-400" />;
      case 'resolved':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'closed':
        return <XCircle className="w-4 h-4 text-gray-400" />;
      default:
        return <MessageCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.user_email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-white">Loading tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50 relative overflow-hidden">
        <Head>
          <title>Support Tickets - SimpleAI</title>
          <meta name="description" content="Manage user support requests and tickets" />
        </Head>

        <div className="relative z-10">
          <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Back to Dashboard Button */}
            <motion.div
              className="mb-6"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <motion.button
                onClick={() => router.push('/')}
                className="flex items-center text-gray-600 hover:text-gray-800 bg-white border border-gray-200 px-4 py-2 rounded-lg transition-all duration-200 hover:bg-gray-50 shadow-sm"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </motion.button>
            </motion.div>

            {/* Header */}
            <motion.div
              className="mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <LifeBuoy className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900">Support Management</h1>
                      <p className="text-gray-600">Manage and respond to user support tickets</p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {filteredTickets.length} ticket{filteredTickets.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Filters */}
            <motion.div
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search tickets..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-3 w-full bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                </div>
                <div className="lg:w-48">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 text-gray-900 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="all">All Status</option>
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
                <div className="lg:w-48">
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 text-gray-900 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="all">All Priority</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>
            </motion.div>

            {/* Tickets List */}
            <motion.div
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400"></div>
                  <span className="ml-3 text-gray-400">Loading tickets...</span>
                </div>
              ) : filteredTickets.length === 0 ? (
                <div className="text-center py-12">
                  <LifeBuoy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-white mb-2">No tickets found</h3>
                  <p className="text-gray-400">Try adjusting your search or filters</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ticket
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Priority
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredTickets.map((ticket) => (
                        <tr key={ticket.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              {getStatusIcon(ticket.status)}
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">
                                  {ticket.subject}
                                </div>
                                <div className="text-sm text-gray-500">#{ticket.id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-8 w-8">
                                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-green-400 to-blue-400 flex items-center justify-center">
                                  <span className="text-xs font-medium text-white">
                                    {ticket.user_name?.[0] || 'U'}
                                  </span>
                                </div>
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-white">
                                  {ticket.user_name}
                                </div>
                                <div className="text-sm text-gray-400">{ticket.user_email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(ticket.status)}`}
                            >
                              {ticket.status?.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(ticket.priority)}`}
                            >
                              {ticket.priority}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {new Date(ticket.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => router.push(`/support/ticket/${ticket.id}`)}
                                className="text-blue-400 hover:text-blue-300 p-1 rounded"
                                title="View ticket"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <select
                                value={ticket.status}
                                onChange={(e) => updateTicketStatus(ticket.id, e.target.value)}
                                className="text-xs bg-white/10 border border-white/20 text-white rounded px-2 py-1"
                              >
                                <option value="open">Open</option>
                                <option value="in_progress">In Progress</option>
                                <option value="resolved">Resolved</option>
                                <option value="closed">Closed</option>
                              </select>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          </main>
        </div>
      </div>
    </ErrorBoundary>
  );
}
