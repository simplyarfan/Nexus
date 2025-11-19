import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/router';
import { AnimatePresence, motion } from 'framer-motion';
import { notificationsAPI } from '../../utils/notificationsAPI';
import {
  Users,
  FileText,
  Calendar,
  Settings,
  LogOut,
  User,
  Brain,
  MessageSquare,
  BarChart3,
  Bell,
  Search,
  Plus,
  Menu,
  X,
  ChevronRight,
  ChevronUp,
  Target,
} from 'lucide-react';

export default function SalesDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);

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
      setNotifications(result.data?.notifications || []);
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

  const aiAgents = [
    {
      id: 'email-composer',
      name: 'Email Composer',
      description: 'AI-powered email composition and templates',
      icon: FileText,
      color: 'from-primary to-primary', // UPDATED TO GREEN THEME
      route: '/email-composer',
    },
    {
      id: 'lead-analyzer',
      name: 'Lead Analyzer',
      description: 'Analyze and score potential leads',
      icon: Target,
      color: 'from-primary to-primary', // UPDATED TO GREEN THEME
      route: '/lead-analyzer',
    },
  ];

  const quickActions = [
    { name: 'Create Ticket', icon: Plus, route: '/support/create-ticket' },
    { name: 'My Tickets', icon: MessageSquare, route: '/support/my-tickets' },
    { name: 'Profile Settings', icon: User, route: '/profile' },
  ];

  return (
    <div className="min-h-screen bg-secondary">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-card shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary rounded-lg flex items-center justify-center">
              <div className="w-4 h-4 bg-card rounded-sm transform rotate-45"></div>
            </div>
            <span className="text-xl font-bold text-foreground">Nexus</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-lg hover:bg-muted"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="mt-6 px-3">
          <div className="space-y-1">
            <div className="px-3 py-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                AI Agents
              </p>
            </div>
            {aiAgents.map((agent) => (
              <button
                key={agent.id}
                onClick={() => router.push(agent.route)}
                className="w-full flex items-center px-3 py-3 text-left text-muted-foreground rounded-lg hover:bg-muted transition-colors group"
              >
                <div
                  className={`w-10 h-10 bg-gradient-to-br ${agent.color} rounded-lg flex items-center justify-center mr-3`}
                >
                  <agent.icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{agent.name}</p>
                  <p className="text-xs text-muted-foreground">{agent.description}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-muted-foreground" />
              </button>
            ))}
          </div>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
          <div className="relative">
            {/* Dropdown Menu */}
            {userDropdownOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-card border border-border rounded-lg shadow-lg py-2">
                {quickActions.map((action) => (
                  <button
                    key={action.name}
                    onClick={() => {
                      router.push(action.route);
                      setUserDropdownOpen(false);
                    }}
                    className="w-full flex items-center px-4 py-2 text-left text-muted-foreground hover:bg-muted transition-colors"
                  >
                    <action.icon className="w-4 h-4 mr-3 text-muted-foreground" />
                    <span className="text-sm font-medium">{action.name}</span>
                  </button>
                ))}
                <div className="border-t border-border my-1"></div>
                <button
                  onClick={() => {
                    handleLogout();
                    setUserDropdownOpen(false);
                  }}
                  className="w-full flex items-center px-4 py-2 text-left text-red-500 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4 mr-3 text-red-500" />
                  <span className="text-sm font-medium">Logout</span>
                </button>
              </div>
            )}

            {/* User Profile Button */}
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-muted transition-colors"
            >
              {user?.profile_picture_url ? (
                <img
                  src={user.profile_picture_url}
                  alt="Profile"
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xs font-semibold">
                  {user?.first_name?.[0]?.toUpperCase() || ''}
                  {user?.last_name?.[0]?.toUpperCase() || ''}
                </div>
              )}
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium text-foreground truncate">{user?.name}</p>
                <p className="text-xs text-muted-foreground truncate">Sales & Marketing</p>
              </div>
              <ChevronUp
                className={`w-4 h-4 text-muted-foreground transition-transform ${userDropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 min-h-screen">
        {/* Top bar */}
        <div className="bg-card shadow-sm border-b border-border">
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-muted"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-foreground">Sales Dashboard</h1>
                <p className="text-sm text-muted-foreground">Welcome back, {user?.first_name}!</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                />
              </div>
              <div className="relative">
                <button
                  onClick={handleNotificationClick}
                  className="relative p-2 text-muted-foreground hover:text-muted-foreground rounded-lg hover:bg-muted"
                >
                  <Bell className="w-5 h-5" />
                  {notifications.length > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-600 rounded-full"></span>
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

        {/* Dashboard content */}
        <div className="p-6 pb-20">
          {/* Welcome section */}
          <div className="bg-gradient-to-r from-primary to-primary rounded-2xl p-8 text-white mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">Sales Intelligence Hub</h2>
                <p className="text-primary-foreground">
                  Access your AI-powered sales tools and automation systems
                </p>
              </div>
              <div className="hidden md:block">
                <div className="w-24 h-24 bg-card bg-opacity-20 rounded-full flex items-center justify-center">
                  <Brain className="w-12 h-12 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* AI Agents Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {aiAgents.map((agent) => (
              <div
                key={agent.id}
                onClick={() => router.push(agent.route)}
                className="bg-card rounded-xl p-6 shadow-sm border border-border hover:shadow-md transition-shadow cursor-pointer group"
              >
                <div className="flex items-start space-x-4">
                  <div
                    className={`w-12 h-12 bg-gradient-to-br ${agent.color} rounded-xl flex items-center justify-center flex-shrink-0`}
                  >
                    <agent.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground mb-2">{agent.name}</h3>
                    <p className="text-muted-foreground text-sm mb-4">{agent.description}</p>
                    <div className="flex items-center text-primary text-sm font-medium group-hover:text-primary">
                      <span>Launch Agent</span>
                      <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
