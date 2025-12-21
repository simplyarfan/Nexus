import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/router';
import { notificationsAPI } from '../../utils/notificationsAPI';

export default function WaitingDashboard() {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const router = useRouter();
  const { user, logout } = useAuth();

  // Fetch notifications
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
      setNotifications(fetchedNotifications);
    } catch (error) {
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
              STATUS
            </p>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <svg
                  className="w-5 h-5 text-amber-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">
                  Pending Assignment
                </p>
              </div>
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
              <p className="text-xs text-muted-foreground">Pending Assignment</p>
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
                    <h1 className="text-4xl font-bold text-foreground mb-2">
                      Waiting for Assignment
                    </h1>
                    <p className="text-muted-foreground text-lg">
                      Welcome, {user?.first_name}! Your account is being reviewed.
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
                                <p className="text-sm text-muted-foreground">No notifications yet</p>
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
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-card border-2 border-border rounded-2xl p-8"
            >
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-8 h-8 text-amber-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    Welcome to Nexus AI Platform!
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    Your account is currently being reviewed by our admin team. Once approved,
                    you&apos;ll be assigned to a department and gain access to AI-powered tools
                    designed specifically for your role.
                  </p>
                  <div className="bg-muted rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">
                      <span className="font-semibold text-foreground">What happens next?</span> Our
                      admin team will review your account and assign you to the appropriate
                      department based on your role and responsibilities. You&apos;ll receive a
                      notification once your department has been assigned.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                onClick={() => router.push('/profile')}
                className="bg-card border-2 border-border rounded-2xl p-6 hover:border-primary hover:shadow-xl transition-all cursor-pointer group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <svg
                      className="w-6 h-6 text-primary"
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
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                      Complete Your Profile
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Add more details to your account while you wait for department assignment.
                    </p>
                  </div>
                  <svg
                    className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors"
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
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                onClick={() => router.push('/support/create-ticket')}
                className="bg-card border-2 border-border rounded-2xl p-6 hover:border-primary hover:shadow-xl transition-all cursor-pointer group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <svg
                      className="w-6 h-6 text-blue-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                      Need Help?
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      If you have questions or need assistance, our support team is here to help.
                    </p>
                  </div>
                  <svg
                    className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors"
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
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
