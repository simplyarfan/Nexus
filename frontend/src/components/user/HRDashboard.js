import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/router';
import { tokenManager } from '../../utils/api';
import { notificationsAPI } from '../../utils/notificationsAPI';

export default function HRDashboard() {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState({
    totalCandidates: 0,
    scheduledInterviews: 0,
    openPositions: 0,
  });
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { user, logout } = useAuth();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const token = tokenManager.getAccessToken();

        if (!token) {
          setLoading(false);
          return;
        }

        // Use environment variable for API URL (required)
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
        if (!API_BASE_URL) {
          console.error('NEXT_PUBLIC_API_URL environment variable is not set');
          setLoading(false);
          return;
        }

        const candidatesResponse = await fetch(`${API_BASE_URL}/api/candidates/stats`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        const positionsResponse = await fetch(`${API_BASE_URL}/api/job-positions/stats`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        const interviewsResponse = await fetch(
          `${API_BASE_URL}/api/interview-coordinator/interviews`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          },
        );

        let totalCandidates = 0;
        let openPositions = 0;
        let scheduledInterviews = 0;

        if (candidatesResponse.ok) {
          const candidatesResult = await candidatesResponse.json();
          totalCandidates = candidatesResult.stats?.total || 0;
        }

        if (positionsResponse.ok) {
          const positionsResult = await positionsResponse.json();
          const positionsData = positionsResult.data || {};
          openPositions = positionsData.open || 0;
        }

        if (interviewsResponse.ok) {
          const interviewsResult = await interviewsResponse.json();
          const interviews = interviewsResult.data || [];
          scheduledInterviews = interviews.filter((i) => i.status === 'scheduled').length;
        }

        setStats({
          totalCandidates,
          openPositions,
          scheduledInterviews,
        });
      } catch (error) {
        // Intentionally empty - loading state handled by finally block, fallback stats (0) shown on failure
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Fetch notifications separately with unread_only filter
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setNotifications([]);
        const result = await notificationsAPI.getNotifications({ limit: 5, unread_only: true });
        setNotifications(result.data?.notifications || []);
      } catch (error) {
        setNotifications([]);
      }
    };

    fetchNotifications();
  }, []);

  const fetchNotificationsData = async () => {
    try {
      const result = await notificationsAPI.getNotifications({ limit: 5, unread_only: true });
      const fetchedNotifications = result.data?.notifications || [];
      console.log('Fetched notifications:', fetchedNotifications);
      setNotifications(fetchedNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
    }
  };

  const handleMarkAsRead = async (notificationId, e) => {
    e.stopPropagation();
    try {
      await notificationsAPI.markAsRead(notificationId);
      await fetchNotificationsData();
    } catch (error) {
      // Silent failure
    }
  };

  const handleNotificationClick = () => {
    // Refresh notifications when dropdown opens
    if (!showNotifications) {
      fetchNotificationsData();
    }
    setShowNotifications(!showNotifications);
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/landing');
    } catch (error) {
      // Intentionally empty - user is redirected regardless, error is non-critical
    }
  };

  const agents = [
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
      description: 'Browse and manage all candidate profiles with AI matching',
      href: '/candidates',
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      ),
      title: 'Open Positions',
      description: 'Create and manage job positions with AI-powered JD parsing',
      href: '/job-positions',
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
      description: 'Schedule and manage interview processes',
      href: '/interviews',
    },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`w-64 bg-sidebar border-r border-sidebar-border flex flex-col fixed h-screen ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform z-50`}
      >
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center">
              <img src="/images/logo_N.png" alt="Nexus" className="w-10 h-10 object-contain" />
            </div>
            <span className="text-xl font-bold text-foreground">Nexus</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-4">
            <p className="text-xs font-semibold text-sidebar-foreground uppercase tracking-wider mb-3">
              AI AGENTS
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

        <div className="p-4 border-t border-sidebar-border relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-sidebar-accent transition-colors"
          >
            {user?.profile_picture_url ? (
              <img
                src={user.profile_picture_url}
                alt="Profile"
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-semibold">
                {user?.first_name?.[0]?.toUpperCase() || ''}
                {user?.last_name?.[0]?.toUpperCase() || ''}
              </div>
            )}
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-foreground">
                {user?.first_name && user?.last_name
                  ? `${user.first_name} ${user.last_name}`
                  : user?.email || 'User'}
              </p>
              <p className="text-xs text-muted-foreground">{user?.department || 'HR Department'}</p>
            </div>
            <svg
              className="w-4 h-4 text-sidebar-foreground"
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
                    onClick={() => router.push('/support/create-ticket')}
                    className="w-full px-4 py-3 text-left hover:bg-muted transition-colors flex items-center gap-3"
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
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    <span className="text-sm text-foreground">Create Ticket</span>
                  </button>
                  <button
                    onClick={() => router.push('/support/my-tickets')}
                    className="w-full px-4 py-3 text-left hover:bg-muted transition-colors flex items-center gap-3"
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
                        d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                      />
                    </svg>
                    <span className="text-sm text-foreground">My Tickets</span>
                  </button>
                  <button
                    onClick={() => router.push('/profile')}
                    className="w-full px-4 py-3 text-left hover:bg-muted transition-colors flex items-center gap-3"
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
                    className="w-full px-4 py-3 text-left hover:bg-muted transition-colors flex items-center gap-3"
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

      <div className="flex-1 lg:ml-64 overflow-auto">
        <div className="min-h-screen bg-background">
          <div className="border-b border-border bg-card sticky top-0 z-30">
            <div className="max-w-7xl mx-auto px-8 py-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="lg:hidden p-2 hover:bg-muted rounded-lg"
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
                    <h1 className="text-4xl font-bold text-foreground mb-2">Recruitment Dashboard</h1>
                    <p className="text-muted-foreground text-lg">
                      Welcome back! Manage your AI-powered recruitment tools
                    </p>
                  </motion.div>
                </div>

                <div className="relative">
                  <button
                    onClick={handleNotificationClick}
                    className="relative p-3 rounded-lg hover:bg-muted transition-colors"
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
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute right-0 top-full mt-2 w-96 bg-card border border-border rounded-lg shadow-lg overflow-hidden z-50"
                        >
                          <div className="p-4 border-b border-border">
                            <h3 className="font-semibold text-foreground">Notifications</h3>
                          </div>
                          <div className="max-h-96 overflow-y-auto">
                            {notifications.length > 0 ? (
                              notifications.map((notification, index) => (
                                <div
                                  key={notification.id || index}
                                  className="p-4 hover:bg-muted transition-colors border-b border-border last:border-0"
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1">
                                      <p className="font-medium text-foreground text-sm">
                                        {notification.title}
                                      </p>
                                      <p className="text-xs text-muted-foreground mt-1">
                                        {notification.message}
                                      </p>
                                      <p className="text-xs text-muted-foreground mt-2">
                                        {new Date(notification.created_at).toLocaleString()}
                                      </p>
                                    </div>
                                    <button
                                      onClick={(e) => handleMarkAsRead(notification.id, e)}
                                      className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors flex-shrink-0"
                                      title="Mark as read"
                                    >
                                      ✓
                                    </button>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="p-8 text-center">
                                <p className="text-sm text-muted-foreground">
                                  No notifications yet
                                </p>
                              </div>
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

          <div className="max-w-7xl mx-auto px-8 py-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-2">AI-Powered Tools</h2>
              <p className="text-muted-foreground">
                Launch intelligent agents to automate your recruitment workflow
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {agents.map((agent, index) => (
                <motion.div
                  key={agent.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                  onClick={() => router.push(agent.href)}
                  className="bg-card border-2 border-border rounded-2xl p-8 hover:border-primary hover:shadow-xl transition-all cursor-pointer group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  <div className="relative z-10">
                    <div className="flex items-start gap-6 mb-6">
                      <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground flex-shrink-0 group-hover:scale-110 transition-transform shadow-lg">
                        {agent.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                          {agent.title}
                        </h3>
                        <p className="text-muted-foreground">{agent.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <div className="inline-flex items-center gap-2 text-primary font-medium group-hover:gap-3 transition-all">
                        <span>Launch Agent</span>
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
                      {agent.title === 'Candidates' && (
                        <div className="text-xs font-semibold text-primary bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20">
                          {loading ? '...' : stats.totalCandidates}{' '}
                          {stats.totalCandidates === 1 ? 'Candidate' : 'Candidates'}
                        </div>
                      )}
                      {agent.title === 'Open Positions' && (
                        <div className="text-xs font-semibold text-primary bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20">
                          {loading ? '...' : stats.openPositions}{' '}
                          {stats.openPositions === 1 ? 'Position' : 'Positions'}
                        </div>
                      )}
                      {agent.title === 'Interview Coordinator' && (
                        <div className="text-xs font-semibold text-primary bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20">
                          {loading ? '...' : stats.scheduledInterviews} Scheduled
                        </div>
                      )}
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
