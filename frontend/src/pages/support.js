

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { fadeIn, scaleIn } from '../lib/motion';
import ButtonGreen from '../components/ui/ButtonGreen';

export default function SupportPage() {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const tickets = [
    {
      id: 'TKT-001',
      title: 'Unable to access CV upload feature',
      description: 'Getting error when trying to upload candidate CV files',
      status: 'Open',
      priority: 'High',
      category: 'Technical',
      created: '2024-12-05',
      assignedTo: 'Tech Support',
      messages,
    },
    {
      id: 'TKT-002',
      title: 'Calendar sync not working',
      description: 'Interview calendar not syncing with Google Calendar',
      status: 'In Progress',
      priority: 'Medium',
      category: 'Integration',
      created: '2024-12-04',
      assignedTo: 'John Smith',
      messages,
    },
    {
      id: 'TKT-003',
      title: 'Request for additional user licenses',
      description: 'Need to add 5 more users to the platform',
      status: 'Resolved',
      priority: 'Low',
      category: 'Account',
      created: '2024-12-03',
      assignedTo: 'Sarah Johnson',
      messages,
    },
    {
      id: 'TKT-004',
      title: 'Email notifications not received',
      description: 'Not receiving interview reminder emails',
      status: 'Open',
      priority: 'Medium',
      category: 'Technical',
      created: '2024-12-02',
      assignedTo: 'Tech Support',
      messages,
    },
  ];

  const stats = [
    { label: 'Open Tickets', value, color: 'text-red-600' },
    { label: 'In Progress', value, color: 'text-green-500' },
    { label: 'Resolved', value, color: 'text-green-600' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="mb-4">
            <a href="/dashboard" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors">
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </a>
          </div>
          <div className="flex items-center justify-between">
            
              <h1 className="text-3xl font-bold text-gray-900">Support Tickets</h1>
              <p className="text-gray-600 mt-1">Manage and track support requests</p>
            </div>
            <ButtonGreen variant="primary" size="lg">
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Ticket
            </ButtonGreen>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              variants={scaleIn}
              initial="hidden"
              animate="visible"
              transition={{ delay * 0.1 }}
              className="bg-white border border-gray-200 rounded-2xl p-6"
            >
              <p className="text-sm text-gray-600 mb-2">{stat.label}</p>
              <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <motion.div
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          className="bg-white border border-gray-200 rounded-2xl p-6 mb-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-900 mb-2">Search</label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tickets..."
                  className="w-full pl-10 pr-4 py-2 bg-secondary text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Status Filter */}
            
              <label className="block text-sm font-medium text-gray-900 mb-2">Status</label>
              <select className="w-full px-4 py-2 bg-secondary text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ring">
                All Status</option>
                Open</option>
                In Progress</option>
                Resolved</option>
              </select>
            </div>

            {/* Priority Filter */}
            
              <label className="block text-sm font-medium text-gray-900 mb-2">Priority</label>
              <select className="w-full px-4 py-2 bg-secondary text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ring">
                All Priorities</option>
                High</option>
                Medium</option>
                Low</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Tickets List */}
        <div className="space-y-4">
          {tickets.map((ticket, index) => (
            <motion.div
              key={ticket.id}
              initial={{ opacity, y }}
              animate={{ opacity, y }}
              transition={{ delay.3 + index * 0.05 }}
              className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-mono text-gray-600">{ticket.id}</span>
                    <span
                      className={`px-3 py-1 text-xs font-medium rounded-full ${
                        ticket.priority === 'High'
                          ? 'bg-red-600/10 text-red-600'
                          .priority === 'Medium'
                            ? 'bg-green-500/10 text-green-500'
                            : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {ticket.priority}
                    </span>
                    <span className="px-3 py-1 text-xs font-medium bg-gray-50 text-gray-900 rounded-full">
                      {ticket.category}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{ticket.title}</h3>
                  <p className="text-sm text-gray-600">{ticket.description}</p>
                </div>
                <span
                  className={`px-3 py-1 text-xs font-medium rounded-full flex-shrink-0 ${
                    ticket.status === 'Open'
                      ? 'bg-red-600/10 text-red-600'
                      .status === 'In Progress'
                        ? 'bg-green-500/10 text-green-500'
                        : 'bg-green-500/10 text-green-600'
                  }`}
                >
                  {ticket.status}
                </span>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex items-center gap-6 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    {ticket.assignedTo}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    {ticket.messages} messages</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {new Date(ticket.created).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <ButtonGreen variant="primary" size="sm">
                    View Details
                  </ButtonGreen>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
