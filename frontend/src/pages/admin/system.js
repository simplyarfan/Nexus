import React from 'react';

import { motion } from 'framer-motion';
import { useRouter } from 'next/router';

export default function SystemHealth() {
  const router = useRouter();

  const metrics = [
    {
      category: 'Server',
      items: [
        { label: 'Status', value: 'Online', status: 'healthy' },
        { label: 'Uptime', value: '45 days', status: 'healthy' },
        { label: 'Response Time', value: '45ms', status: 'healthy' },
      ],
    },
    {
      category: 'Database',
      items: [
        { label: 'Status', value: 'Healthy', status: 'healthy' },
        { label: 'Connections', value: '12/100', status: 'healthy' },
        { label: 'Queries/sec', value: '847', status: 'healthy' },
      ],
    },
    {
      category: 'API',
      items: [
        { label: 'Total Requests', value: '15.2K', status: 'healthy' },
        { label: 'Success Rate', value: '99.8%', status: 'healthy' },
        { label: 'Avg Response', value: '78ms', status: 'healthy' },
      ],
    },
    {
      category: 'Storage',
      items: [
        { label: 'Total Batches', value: '45', status: 'healthy' },
        { label: 'Total Files', value: '324', status: 'healthy' },
        { label: 'Storage Used', value: '245MB', status: 'healthy' },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/superadmin')}
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
                <div className="w-10 h-10 rounded-lg bg-green-500/10 text-green-600 flex items-center justify-center">
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
                    <span className="text-sm font-semibold text-gray-900">{item.value}</span>
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
