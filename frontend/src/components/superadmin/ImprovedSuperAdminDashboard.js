import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import Head from 'next/head';
import { adminAPI } from '../../utils/api';
import toast from 'react-hot-toast';
import {
  Users,
  LifeBuoy,
  BarChart3,
  Server,
  Settings,
  LogOut,
  Menu,
  Search,
  Bell,
  User,
  Plus,
  MessageSquare,
  ChevronRight,
  Brain,
  ChevronUp,
} from 'lucide-react';

export default function ImprovedSuperAdminDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeTickets: 0,
    systemHealth: 'Loading...',
    uptime: '0%',
  });

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/auth/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const adminTools = [
    {
      id: 'users',
      name: 'User Management',
      description: 'Manage users, roles, and permissions',
      icon: Users,
      color: 'from-green-500 to-green-600', // UPDATED TO ORANGE THEME
      route: '/admin/users',
    },
    {
      id: 'tickets',
      name: 'Support Management',
      description: 'Handle support tickets and requests',
      icon: LifeBuoy,
      color: 'from-red-500 to-green-600', // UPDATED TO ORANGE THEME
      route: '/admin/tickets',
    },
    {
      id: 'analytics',
      name: 'Analytics Dashboard',
      description: 'View system analytics and insights',
      icon: BarChart3,
      color: 'from-green-400 to-green-600', // UPDATED TO ORANGE THEME
      route: '/admin/analytics',
    },
    {
      id: 'system',
      name: 'System Health',
      description: 'Monitor system performance and status',
      icon: Server,
      color: 'from-green-600 to-green-600', // UPDATED TO ORANGE THEME
      route: '/admin/system',
    },
  ];

  const quickActions = [
    { name: 'Create Ticket', icon: Plus, route: '/support/create-ticket' },
    { name: 'My Tickets', icon: MessageSquare, route: '/support/my-tickets' },
    { name: 'Profile Settings', icon: User, route: '/profile' },
  ];

  // Fetch stats on component mount
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await adminAPI.getStats();
        if (response.data) {
          setStats(response.data);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
  }, []);

  return (
    <>
      <Head>
        <title>SuperAdmin Dashboard - Nexus AI Platform</title>
        <meta name="description" content="SuperAdmin control panel for managing the AI platform" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Mobile sidebar backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div
          className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <div className="w-4 h-4 bg-white rounded-sm transform rotate-45"></div>
              </div>
              <span className="text-xl font-bold text-gray-900">Nexus</span>
            </div>
          </div>

          <nav className="mt-6 px-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Admin Tools
              </p>
              {adminTools.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => router.push(tool.route)}
                  className="w-full flex items-center px-3 py-3 text-left text-gray-700 rounded-lg hover:bg-gray-100 transition-colors group"
                >
                  <div
                    className={`w-10 h-10 bg-gradient-to-br ${tool.color} rounded-lg flex items-center justify-center mr-3`}
                  >
                    <tool.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{tool.name}</p>
                    <p className="text-xs text-gray-500">{tool.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </nav>

          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
            <div className="relative">
              {/* Dropdown Menu */}
              {userDropdownOpen && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg py-2">
                  {quickActions.map((action) => (
                    <button
                      key={action.name}
                      onClick={() => {
                        router.push(action.route);
                        setUserDropdownOpen(false);
                      }}
                      className="w-full flex items-center px-4 py-2 text-left text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <action.icon className="w-4 h-4 mr-3 text-gray-400" />
                      <span className="text-sm font-medium">{action.name}</span>
                    </button>
                  ))}
                  <div className="border-t border-gray-200 my-1"></div>
                  <button
                    onClick={() => {
                      handleLogout();
                      setUserDropdownOpen(false);
                    }}
                    className="w-full flex items-center px-4 py-2 text-left text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4 mr-3" />
                    <span className="text-sm font-medium">Logout</span>
                  </button>
                </div>
              )}

              {/* User Profile Button */}
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-gray-600" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
                  <p className="text-xs text-gray-500 truncate">SuperAdmin</p>
                </div>
                <ChevronUp
                  className={`w-4 h-4 text-gray-400 transition-transform ${userDropdownOpen ? 'rotate-180' : ''}`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="lg:pl-64 min-h-screen">
          {/* Top bar */}
          <div className="bg-white shadow-sm border-b border-gray-200">
            <div className="flex items-center justify-between h-16 px-6">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">SuperAdmin Dashboard</h1>
                  <p className="text-sm text-gray-500">Welcome back, {user?.first_name}!</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search..."
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                  <Bell className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Dashboard content */}
          <div className="p-6 pb-20">
            {/* Welcome section */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-8 text-white mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2">SuperAdmin Control Center</h2>
                  <p className="text-orange-100">
                    Manage your AI platform with full administrative access
                  </p>
                </div>
                <div className="hidden md:block">
                  <div className="w-24 h-24 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <Brain className="w-12 h-12 text-white" />
                  </div>
                </div>
              </div>
            </div>

            {/* Admin Tools Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {adminTools.map((tool) => (
                <div
                  key={tool.id}
                  onClick={() => router.push(tool.route)}
                  className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer group"
                >
                  <div className="flex items-start space-x-4">
                    <div
                      className={`w-12 h-12 bg-gradient-to-br ${tool.color} rounded-xl flex items-center justify-center flex-shrink-0`}
                    >
                      <tool.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{tool.name}</h3>
                      <p className="text-gray-600 text-sm mb-4">{tool.description}</p>
                      <div className="flex items-center text-green-600 text-sm font-medium group-hover:text-green-700">
                        <span>Access Tool</span>
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
    </>
  );
}
