

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';

export default function AnalyticsDashboard() {
  const router = useRouter();

  const stats = [
    { label: 'Total Users', value: '847', trend: '+12%', color: 'bg-green-500/10 text-green-600' },
    { label: 'Active Users', value: '593', trend: '+8%', color: 'bg-green-500/10 text-green-600' },
    { label: 'Total Tickets', value: '234', trend: '+15%', color: 'bg-green-500/20 text-green-600' },
    { label: 'Resolved Tickets', value: '189', trend: '+20%', color: 'bg-green-50 text-green-900' },
    { label: 'CV Batches', value: '45', trend: '+5%', color: 'bg-green-500/10 text-green-600' },
    { label: 'System Health', value: 'Good', trend: '99.9%', color: 'bg-green-500/10 text-green-600' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/superadmin')} className="p-2 hover:bg-green-50 rounded-lg transition-colors">
              <svg className="w-5 h-5 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
              <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
              <p className="text-gray-600 mt-1">View system analytics and insights</p>
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
              className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-600">{stat.label}</p>
                <span className="text-xs text-green-600 font-medium">↑ {stat.trend}</span>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                <div className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center`}>
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
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
