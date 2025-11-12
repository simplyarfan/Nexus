import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import { usersAPI } from '../../utils/usersAPI';
import { supportAPI } from '../../utils/supportAPI';
import toast from 'react-hot-toast';

export default function AnalyticsDashboard() {
  const router = useRouter();
  const { user, isAdmin, isSuperAdmin, loading } = useAuth();
  const [stats, setStats] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);

  // Role check - redirect if not admin/superadmin
  useEffect(() => {
    if (!loading && user && !isAdmin && !isSuperAdmin) {
      router.replace('/');
    }
  }, [user, isAdmin, isSuperAdmin, loading, router]);

  // Fetch real analytics data
  useEffect(() => {
    if (user && (isAdmin || isSuperAdmin)) {
      fetchAnalytics();
    }
  }, [user, isAdmin, isSuperAdmin]);

  const fetchAnalytics = async () => {
    try {
      setLoadingStats(true);

      // Fetch users data
      const usersResponse = await usersAPI.getUsers({ limit: 1000 });
      const allUsers = usersResponse.data.users || [];
      const totalUsers = allUsers.length;
      const activeUsers = allUsers.filter((u) => u.is_active !== false).length;

      // Fetch tickets data
      const ticketsResponse = await supportAPI.getMyTickets({ limit: 1000 });
      const allTickets = ticketsResponse.data.tickets || [];
      const totalTickets = allTickets.length;
      const resolvedTickets = allTickets.filter(
        (t) => t.status === 'resolved' || t.status === 'closed',
      ).length;
      const openTickets = allTickets.filter(
        (t) => t.status === 'open' || t.status === 'pending',
      ).length;
      const inProgressTickets = allTickets.filter((t) => t.status === 'in_progress').length;

      // Calculate percentages
      const resolvedPercentage =
        totalTickets > 0 ? Math.round((resolvedTickets / totalTickets) * 100) : 0;
      const activePercentage = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0;

      setStats([
        {
          label: 'Total Users',
          value: totalUsers.toString(),
          trend: `${activeUsers} active`,
          color: 'bg-blue-500/10 text-blue-600',
        },
        {
          label: 'Active Users',
          value: activeUsers.toString(),
          trend: `${activePercentage}%`,
          color: 'bg-green-500/10 text-green-600',
        },
        {
          label: 'Total Tickets',
          value: totalTickets.toString(),
          trend: `${openTickets} open`,
          color: 'bg-purple-500/10 text-purple-600',
        },
        {
          label: 'Resolved Tickets',
          value: resolvedTickets.toString(),
          trend: `${resolvedPercentage}%`,
          color: 'bg-green-50 text-green-900',
        },
        {
          label: 'In Progress',
          value: inProgressTickets.toString(),
          trend: 'Active',
          color: 'bg-yellow-500/10 text-yellow-600',
        },
        {
          label: 'Open Tickets',
          value: openTickets.toString(),
          trend: 'Pending',
          color: 'bg-orange-500/10 text-orange-600',
        },
      ]);
    } catch (error) {
      toast.error('Failed to load analytics data');
    } finally {
      setLoadingStats(false);
    }
  };

  if (loading || loadingStats) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
      </div>
    );
  }

  if (!isAdmin && !isSuperAdmin) return null;

  return (
    <div className="min-h-screen bg-secondary">
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/admin')}
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
            <div>
              <h1 className="text-3xl font-bold text-foreground">Analytics Dashboard</h1>
              <p className="text-muted-foreground mt-1">View system analytics and insights</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <span className="text-xs font-medium text-gray-500">{stat.trend}</span>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                <div
                  className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center`}
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
