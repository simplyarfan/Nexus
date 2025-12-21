import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import { usersAPI } from '../../utils/usersAPI';
import { supportAPI } from '../../utils/supportAPI';
import { notificationsAPI } from '../../utils/notificationsAPI';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const { user, isAdmin, isSuperAdmin, loading, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    openTickets: 0,
    resolvedToday: 0,
  });
  const [notifications, setNotifications] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const router = useRouter();

  // Admin role check - redirect if not admin or superadmin
  useEffect(() => {
    if (!loading && user && !isAdmin && !isSuperAdmin) {
      router.replace('/');
    }
  }, [user, isAdmin, isSuperAdmin, loading, router]);

  // Fetch dashboard data
  useEffect(() => {
    if (user && (isAdmin || isSuperAdmin)) {
      fetchDashboardData();
    }
  }, [user, isAdmin, isSuperAdmin]);

  const fetchDashboardData = async () => {
    try {
      setLoadingData(true);

      // Fetch all data in parallel (admins get ALL tickets and notifications - backend handles this based on role)
      const [usersResponse, ticketsResponse, notificationsResponse] = await Promise.all([
        usersAPI.getUsers({ limit: 1000 }),
        supportAPI.getMyTickets({ limit: 1000 }),
        notificationsAPI.getNotifications({ limit: 10, unread_only: true, all: true }),
      ]);

      const allUsers = usersResponse.data.users || [];
      const allTickets = ticketsResponse.data.tickets || [];
      const userNotifications = notificationsResponse.data.notifications || [];

      // Calculate stats
      const openTickets = allTickets.filter(
        (t) => t.status === 'open' || t.status === 'pending',
      ).length;

      // Get tickets resolved today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const resolvedToday = allTickets.filter((t) => {
        if (t.status !== 'resolved' && t.status !== 'closed') return false;
        const resolvedDate = new Date(t.updated_at);
        return resolvedDate >= today;
      }).length;

      setStats({
        totalUsers: allUsers.length,
        openTickets,
        resolvedToday,
      });

      setNotifications(userNotifications);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoadingData(false);
    }
  };

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </div>
      </div>
    );
  }

  // Don't render if not authorized
  if (!isAdmin && !isSuperAdmin) {
    return null;
  }

  const formatNotificationTime = (createdAt) => {
    const now = new Date();
    const notifDate = new Date(createdAt);
    const diffMs = now - notifDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setNotifications([]);
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark notifications as read');
    }
  };

  const aiAgents = [
    {
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
      title: 'CV Intelligence',
      description: 'AI-powered CV screening',
      href: '/cv-intelligence',
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ),
      title: 'Interview Coordinator',
      description: 'Schedule and manage interviews',
      href: '/interviews',
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      ),
      title: 'Candidates',
      description: 'View and manage candidate profiles',
      href: '/candidates',
    },
  ];

  const agents = [
    {
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ),
      title: 'User Management',
      description: 'Manage users and permissions',
      href: '/admin/users',
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ),
      title: 'Support Tickets',
      description: 'View and manage support requests',
      href: '/admin/tickets',
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
      title: 'Analytics',
      description: 'View reports and insights',
      href: '/admin/analytics',
    },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Backdrop for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Fixed */}
      <div
        className={`w-64 bg-sidebar border-r border-sidebar-border flex flex-col fixed h-screen ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform z-50`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center">
              <img src="/images/logo_N.png" alt="Nexus" className="w-10 h-10 object-contain" />
            </div>
            <span className="text-xl font-bold text-foreground">Nexus</span>
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* AI Agents Section */}
          <div className="mb-6">
            <p className="text-xs font-semibold text-sidebar-foreground uppercase tracking-wider mb-3">
              AI AGENTS
            </p>
            <div className="space-y-2">
              {aiAgents.map((item) => (
                <button
                  key={item.href}
                  onClick={() => router.push(item.href)}
                  className="w-full flex items-start gap-3 p-3 rounded-lg transition-colors text-sidebar-foreground hover:bg-sidebar-accent group"
                >
                  <div className="flex-shrink-0 mt-0.5">{item.icon}</div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-foreground">{item.title}</p>
                  </div>
                  <svg
                    className="w-4 h-4 flex-shrink-0 mt-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              ))}
            </div>
          </div>

          {/* Admin Tools Section */}
          <div className="mb-4">
            <p className="text-xs font-semibold text-sidebar-foreground uppercase tracking-wider mb-3">
              ADMIN TOOLS
            </p>
            <div className="space-y-2">
              {agents.map((item) => (
                <button
                  key={item.href}
                  onClick={() => router.push(item.href)}
                  className="w-full flex items-start gap-3 p-3 rounded-lg transition-colors text-sidebar-foreground hover:bg-sidebar-accent group"
                >
                  <div className="flex-shrink-0 mt-0.5">{item.icon}</div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-foreground">{item.title}</p>
                  </div>
                  <svg
                    className="w-4 h-4 flex-shrink-0 mt-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* User Menu */}
        <div className="p-4 border-t border-sidebar-border relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-sidebar-accent transition-colors min-w-0"
          >
            <div className="w-10 h-10 min-w-[2.5rem] bg-muted rounded-full flex items-center justify-center flex-shrink-0">
              <svg
                className="w-6 h-6 text-muted-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {user?.first_name && user?.last_name
                  ? `${user.first_name} ${user.last_name}`
                  : user?.name || 'Admin'}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email || 'admin@nexus.com'}
              </p>
            </div>
            <svg
              className="w-4 h-4 text-sidebar-foreground flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          <AnimatePresence>
            {showUserMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute bottom-full left-4 right-4 mb-2 bg-card border border-border rounded-lg shadow-lg overflow-hidden z-50"
                >
                  <button
                    onClick={() => router.push('/profile')}
                    className="w-full px-4 py-3 text-left hover:bg-secondary transition-colors flex items-center gap-3"
                  >
                    <svg
                      className="w-5 h-5 text-muted-foreground"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    <span className="text-sm text-foreground">Profile Settings</span>
                  </button>
                  <div className="border-t border-border" />
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-3 text-left hover:bg-secondary transition-colors flex items-center gap-3"
                  >
                    <svg
                      className="w-5 h-5 text-red-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    <span className="text-sm text-red-500">Logout</span>
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Main Content - Add left margin to account for fixed sidebar */}
      <div className="flex-1 lg:ml-64 overflow-auto">
        <div className="min-h-screen bg-background">
          {/* Clean Header with Notifications */}
          <div className="border-b border-border bg-card sticky top-0 z-30">
            <div className="max-w-7xl mx-auto px-8 py-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="lg:hidden p-2 hover:bg-secondary rounded-lg"
                    aria-label="Toggle sidebar"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 12h16M4 18h16"
                      />
                    </svg>
                  </button>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <h1 className="text-4xl font-bold text-foreground mb-2">Admin Dashboard</h1>
                    <p className="text-muted-foreground text-lg">Manage your platform</p>
                  </motion.div>
                </div>

                {/* Notifications Bell */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-3 rounded-lg hover:bg-secondary transition-colors"
                  >
                    <svg
                      className="w-6 h-6 text-foreground"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                      />
                    </svg>
                    {/* Notification Badge */}
                    {notifications.length > 0 && (
                      <span className="absolute top-2 right-2 w-2 h-2 bg-red-600 rounded-full"></span>
                    )}
                  </button>

                  <AnimatePresence>
                    {showNotifications && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setShowNotifications(false)}
                        />
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute right-0 top-full mt-2 w-96 bg-card border border-border rounded-lg shadow-lg overflow-hidden z-50"
                        >
                          <div className="p-4 border-b border-border flex items-center justify-between">
                            <h3 className="font-semibold text-foreground">Notifications</h3>
                            {notifications.length > 0 && (
                              <button
                                onClick={handleMarkAllAsRead}
                                className="text-xs text-primary hover:opacity-80 font-medium"
                              >
                                Mark all as read
                              </button>
                            )}
                          </div>
                          <div className="max-h-96 overflow-y-auto">
                            {notifications.length === 0 ? (
                              <div className="p-8 text-center text-muted-foreground">
                                <p className="text-sm">No unread notifications</p>
                              </div>
                            ) : (
                              notifications.map((notification) => (
                                <div
                                  key={notification.id}
                                  className="p-4 hover:bg-secondary transition-colors border-b border-border last:border-0"
                                >
                                  <p className="font-medium text-foreground text-sm">
                                    {notification.title}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {notification.message}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-2">
                                    {formatNotificationTime(notification.created_at)}
                                  </p>
                                </div>
                              ))
                            )}
                          </div>
                          <div className="p-3 border-t border-border text-center">
                            <button
                              onClick={() => router.push('/notifications')}
                              className="text-sm text-primary hover:opacity-80"
                            >
                              View all notifications
                            </button>
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>

          {/* Management Tools Section */}
          <div className="max-w-7xl mx-auto px-8 py-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-2">Management Tools</h2>
              <p className="text-muted-foreground">
                Access administrative tools and manage platform resources
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {agents.map((agent, index) => (
                <motion.div
                  key={agent.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                  onClick={() => router.push(agent.href)}
                  className="bg-card border-2 border-border rounded-2xl p-8 hover:border-primary hover:shadow-xl transition-all cursor-pointer group relative overflow-hidden"
                >
                  {/* Subtle gradient overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  <div className="relative z-10">
                    <div className="flex flex-col items-center text-center mb-6">
                      <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground flex-shrink-0 group-hover:scale-110 transition-transform shadow-lg mb-4">
                        {agent.icon}
                      </div>
                      <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                        {agent.title}
                      </h3>
                      <p className="text-muted-foreground text-sm">{agent.description}</p>
                    </div>

                    <div className="flex items-center justify-center pt-4 border-t border-border">
                      <div className="inline-flex items-center gap-2 text-primary font-medium group-hover:gap-3 transition-all">
                        <span>Access Tool</span>
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
                            d="M13 7l5 5m0 0l-5 5m5-5H6"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
