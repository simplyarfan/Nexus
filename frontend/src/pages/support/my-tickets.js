import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import Head from 'next/head';
import {
  ArrowLeft,
  Plus,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Settings,
  LogOut,
  Search,
  Eye,
} from 'lucide-react';
import { supportAPI } from '../../utils/supportAPI';
import toast from 'react-hot-toast';

export default function MyTickets() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/landing');
    } catch (error) {
      // Silent failure
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const response = await supportAPI.getMyTickets();
      if (response.data && response.data.success) {
        // Data structure: { success: true, data: { tickets: [], pagination: {} } }
        setTickets(response.data.data?.tickets || []);
      } else {
        toast.error('Failed to load tickets');
      }
    } catch (error) {
      toast.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'open':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'in_progress':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case 'resolved':
        return <CheckCircle className="w-4 h-4 text-primary" />;
      case 'closed':
        return <CheckCircle className="w-4 h-4 text-muted-foreground" />;
      default:
        return <MessageSquare className="w-4 h-4 text-muted-foreground" />;
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

  const filteredTickets = tickets.filter((ticket) => {
    const matchesFilter = filter === 'all' || ticket.status === filter;
    const matchesSearch =
      ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const statusCounts = {
    all: tickets.length,
    open: tickets.filter((t) => t.status === 'open').length,
    in_progress: tickets.filter((t) => t.status === 'in_progress').length,
    resolved: tickets.filter((t) => t.status === 'resolved').length,
    closed: tickets.filter((t) => t.status === 'closed').length,
  };

  return (
    <>
      <Head>
        <title>My Support Tickets - Nexus</title>
        <meta name="description" content="View and manage your support tickets" />
      </Head>

      <div className="min-h-screen bg-background">
        {/* Top Navigation */}
        <div className="bg-card shadow-sm border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push('/')}
                  className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary rounded-lg flex items-center justify-center">
                    <div className="w-4 h-4 bg-card rounded-sm transform rotate-45"></div>
                  </div>
                  <div>
                    <h1 className="text-xl font-semibold text-foreground">My Support Tickets</h1>
                    <p className="text-sm text-muted-foreground">Track your support requests</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{user?.name}</span>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => router.push('/profile')}
                    className="p-2 text-muted-foreground hover:text-muted-foreground rounded-lg hover:bg-secondary transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-muted-foreground hover:text-muted-foreground rounded-lg hover:bg-secondary transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Filters and Search */}
          <div className="bg-card rounded-xl shadow-sm border border-border p-6 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'all', label: 'All Tickets' },
                  { key: 'open', label: 'Open' },
                  { key: 'in_progress', label: 'In Progress' },
                  { key: 'resolved', label: 'Resolved' },
                  { key: 'closed', label: 'Closed' },
                ].map((status) => (
                  <button
                    key={status.key}
                    onClick={() => setFilter(status.key)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filter === status.key
                        ? 'bg-accent text-primary'
                        : 'text-muted-foreground hover:bg-secondary'
                    }`}
                  >
                    {status.label} ({statusCounts[status.key]})
                  </button>
                ))}
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search tickets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-secondary text-foreground border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent w-64"
                />
              </div>
            </div>
          </div>

          {/* Tickets List */}
          <div className="space-y-4">
            {loading ? (
              <div className="bg-card rounded-xl shadow-sm border border-border p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading tickets...</p>
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="bg-card rounded-xl shadow-sm border border-border p-8 text-center">
                <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No tickets found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery || filter !== 'all'
                    ? 'No tickets match your current filters.'
                    : "You haven't created any support tickets yet."}
                </p>
                <button
                  onClick={() => router.push('/support/create-ticket')}
                  className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-primary to-primary text-white rounded-lg hover:from-primary hover:to-primary transition-colors font-medium"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Ticket
                </button>
              </div>
            ) : (
              filteredTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="bg-card rounded-xl shadow-sm border border-border p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      {/* User Profile Picture */}
                      <div className="flex-shrink-0 mt-1">
                        {ticket.user?.profile_picture_url ? (
                          <img
                            src={ticket.user.profile_picture_url}
                            alt={`${ticket.user.first_name} ${ticket.user.last_name}`}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xs font-semibold">
                            {ticket.user?.first_name?.[0]?.toUpperCase() || ''}
                            {ticket.user?.last_name?.[0]?.toUpperCase() || ''}
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-foreground">
                            {ticket.subject}
                          </h3>
                          <span
                            className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase border-2 ${getStatusColor(ticket.status)}`}
                          >
                            {ticket.status.replace('_', ' ')}
                          </span>
                          <span
                            className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase border-2 ${getPriorityColor(ticket.priority)}`}
                          >
                            {ticket.priority}
                          </span>
                        </div>
                        <p className="text-muted-foreground mb-4 line-clamp-2">
                          {ticket.description}
                        </p>
                        <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(ticket.status)}
                            <span>Ticket #{ticket.id}</span>
                          </div>
                          <span>Created {new Date(ticket.created_at).toLocaleDateString()}</span>
                          <span>Category: {ticket.category}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => router.push(`/support/tickets/${ticket.id}`)}
                      className="flex items-center px-4 py-2 text-primary hover:bg-accent rounded-lg transition-colors font-medium"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
