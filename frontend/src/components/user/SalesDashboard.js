import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/router';
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
      id: 'lead-generator',
      name: 'Lead Generator',
      description: 'Generate and qualify leads automatically',
      icon: Target,
      color: 'from-green-600 to-green-600', // UPDATED TO GREEN THEME
      route: '/lead-generator',
    },
    {
      id: 'campaign-optimizer',
      name: 'Campaign Optimizer',
      description: 'Optimize marketing campaigns for better ROI',
      icon: BarChart3,
      color: 'from-green-400 to-green-600', // UPDATED TO GREEN THEME
      route: '/campaign-optimizer',
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
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
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
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
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
                  <p className="text-xs text-gray-500">{agent.description}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-muted-foreground" />
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
                    <action.icon className="w-4 h-4 mr-3 text-gray-400" />
                    <span className="text-sm font-medium">{action.name}</span>
                  </button>
                ))}
                <div className="border-t border-border my-1"></div>
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
              className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-muted transition-colors"
            >
              <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium text-foreground truncate">{user?.name}</p>
                <p className="text-xs text-gray-500 truncate">Sales & Marketing</p>
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
                <h1 className="text-xl font-semibold text-foreground">Sales & Marketing Dashboard</h1>
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
              <button className="p-2 text-gray-400 hover:text-muted-foreground rounded-lg hover:bg-muted">
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
                <h2 className="text-2xl font-bold mb-2">Sales Intelligence Hub</h2>
                <p className="text-green-100">
                  Access your AI-powered sales tools and campaign management systems
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
                    <div className="flex items-center text-green-600 text-sm font-medium group-hover:text-green-700">
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
