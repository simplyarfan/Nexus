import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import { usersAPI } from '../../utils/usersAPI';
import { supportAPI } from '../../utils/supportAPI';
import { notificationsAPI } from '../../utils/notificationsAPI';
import toast from 'react-hot-toast';

export default function SystemHealth() {
  const router = useRouter();
  const { user, isAdmin, isSuperAdmin, loading } = useAuth();
  const [metrics, setMetrics] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // Role check - redirect if not admin/superadmin
  useEffect(() => {
    if (!loading && user && !isAdmin && !isSuperAdmin) {
      router.replace('/');
    }
  }, [user, isAdmin, isSuperAdmin, loading, router]);

  // Fetch system metrics
  useEffect(() => {
    if (user && (isAdmin || isSuperAdmin)) {
      fetchSystemMetrics();
    }
  }, [user, isAdmin, isSuperAdmin]);

  const fetchSystemMetrics = async () => {
    try {
      setLoadingData(true);

      // Fetch data from all APIs
      const [usersResponse, ticketsResponse, notificationsResponse] = await Promise.all([
        usersAPI.getUsers({ limit: 1000 }),
        supportAPI.getMyTickets({ limit: 1000 }),
        notificationsAPI.getNotifications({ limit: 1000 }),
      ]);

      const allUsers = usersResponse.data.users || [];
      const allTickets = ticketsResponse.data.tickets || [];
      const allNotifications = notificationsResponse.data?.notifications || [];

      // Calculate metrics
      const activeUsers = allUsers.filter((u) => u.is_active !== false).length;
      const departments = [...new Set(allUsers.map((u) => u.department).filter(Boolean))];

      const openTickets = allTickets.filter(
        (t) => t.status === 'open' || t.status === 'pending',
      ).length;
      const resolvedTickets = allTickets.filter(
        (t) => t.status === 'resolved' || t.status === 'closed',
      ).length;
      const ticketSuccessRate =
        allTickets.length > 0 ? Math.round((resolvedTickets / allTickets.length) * 100) : 0;

      const unreadNotifications = allNotifications.filter((n) => !n.is_read).length;

      setMetrics([
        {
          category: 'Users',
          items: [
            { label: 'Total Users', value: allUsers.length.toString(), status: 'healthy' },
            { label: 'Active Users', value: activeUsers.toString(), status: 'healthy' },
            { label: 'Departments', value: departments.length.toString(), status: 'healthy' },
          ],
        },
        {
          category: 'Support System',
          items: [
            { label: 'Total Tickets', value: allTickets.length.toString(), status: 'healthy' },
            {
              label: 'Open Tickets',
              value: openTickets.toString(),
              status: openTickets > 20 ? 'warning' : 'healthy',
            },
            { label: 'Success Rate', value: `${ticketSuccessRate}%`, status: 'healthy' },
          ],
        },
        {
          category: 'Notifications',
          items: [
            { label: 'Total Sent', value: allNotifications.length.toString(), status: 'healthy' },
            { label: 'Unread', value: unreadNotifications.toString(), status: 'healthy' },
            { label: 'System Status', value: 'Active', status: 'healthy' },
          ],
        },
        {
          category: 'Database',
          items: [
            { label: 'Status', value: 'Connected', status: 'healthy' },
            {
              label: 'Total Records',
              value: (allUsers.length + allTickets.length + allNotifications.length).toString(),
              status: 'healthy',
            },
            { label: 'Health', value: 'Good', status: 'healthy' },
          ],
        },
      ]);
    } catch (error) {
      toast.error('Failed to load system metrics');
      setMetrics([
        {
          category: 'System',
          items: [
            { label: 'Status', value: 'Error', status: 'error' },
            { label: 'Message', value: 'Unable to fetch data', status: 'error' },
          ],
        },
      ]);
    } finally {
      setLoadingData(false);
    }
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
      </div>
    );
  }

  if (!isAdmin && !isSuperAdmin) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/admin')}
              className="p-2 hover:bg-green-50 rounded-lg transition-colors"
            >
              <svg
                className="w-5 h-5 text-gray-900"
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
              <h1 className="text-3xl font-bold text-gray-900">System Health</h1>
              <p className="text-gray-600 mt-1">Monitor system performance and status</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {metrics.map((metric, index) => (
            <motion.div
              key={metric.category}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white border border-gray-200 rounded-xl p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    metric.items.some((item) => item.status === 'error')
                      ? 'bg-red-500/10 text-red-600'
                      : metric.items.some((item) => item.status === 'warning')
                        ? 'bg-yellow-500/10 text-yellow-600'
                        : 'bg-green-500/10 text-green-600'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900">{metric.category}</h3>
              </div>
              <div className="space-y-4">
                {metric.items.map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{item.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">{item.value}</span>
                      {item.status === 'warning' && (
                        <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                      )}
                      {item.status === 'error' && (
                        <span className="w-2 h-2 rounded-full bg-red-500"></span>
                      )}
                      {item.status === 'healthy' && (
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
