import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import {
  Users,
  MessageSquare,
  Settings,
  Shield,
  FileText,
  Calendar,
  Award,
  BarChart3,
  Target,
  TrendingUp,
  DollarSign,
  Building2,
  Sparkles,
  User,
} from 'lucide-react';

const AdminDashboard = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedDepartment, setSelectedDepartment] = useState('all');

  // All agents from all departments with GREEN THEME GRADIENTS
  const allAgents = {
    hr: [
      {
        id: 'cv_intelligence',
        name: 'CV Intelligence',
        description: 'AI-powered resume parsing, analysis & ranking',
        icon: FileText,
        status: 'active',
        metrics: { processed: 1247, timeSaved: '312h', accuracy: '94.5%' },
        features: ['Parse PDFs/Word', 'Skill Matching', 'Auto-Ranking', '+1 more'],
        gradient: 'from-green-500 to-green-500', // GREEN THEME
        department: 'Human Resources',
      },
      {
        id: 'interview_coordinator',
        name: 'Interview Coordinator',
        description: 'Smart scheduling & interview automation',
        icon: Calendar,
        status: 'active',
        metrics: { scheduled: 89, conflictsAvoided: 23, satisfaction: '4.8/5' },
        features: ['Calendar Sync', 'Auto-Reminders', 'Panel Coordination', '+1 more'],
        gradient: 'from-green-600 to-green-500', // GREEN THEME
        department: 'Human Resources',
      },
      {
        id: 'onboarding_assistant',
        name: 'Onboarding Assistant',
        description: 'Streamlined employee onboarding workflows',
        icon: Award,
        status: 'active',
        metrics: { onboarded: 34, completion: '98.2%', avgTime: '2 days' },
        features: ['Custom Plans', 'Task Tracking', 'Document Generation', '+1 more'],
        gradient: 'from-green-500 to-green-500', // GREEN THEME
        department: 'Human Resources',
      },
      {
        id: 'hr_analytics',
        name: 'HR Analytics Engine',
        description: 'Advanced people analytics & insights',
        icon: BarChart3,
        status: 'beta',
        metrics: { reports: 156, insights: 42, predictions: '91.3%' },
        features: ['Turnover Prediction', 'Performance Analytics', 'DEI Metrics', '+1 more'],
        gradient: 'from-green-400 to-green-600', // GREEN THEME
        department: 'Human Resources',
      },
    ],
    finance: [
      {
        id: 'invoice_processor',
        name: 'Invoice Processor',
        description: 'Automated invoice processing with OCR',
        icon: FileText,
        status: 'coming_soon',
        metrics: { pending: 0, processed: 0, accuracy: 'N/A' },
        features: ['OCR Scanning', 'GL Coding', 'Approval Workflow', '+1 more'],
        gradient: 'from-green-500 to-green-600', // GREEN THEME
        department: 'Finance',
      },
      {
        id: 'expense_auditor',
        name: 'Expense Auditor',
        description: 'Intelligent expense report validation',
        icon: Shield,
        status: 'coming_soon',
        metrics: { audited: 0, flagged: 0, savings: '$0' },
        features: ['Policy Checking', 'Receipt Validation', 'Anomaly Detection', '+1 more'],
        gradient: 'from-green-500 to-green-600', // GREEN THEME
        department: 'Finance',
      },
      {
        id: 'financial_reporter',
        name: 'Financial Reporter',
        description: 'Natural language financial analysis',
        icon: BarChart3,
        status: 'coming_soon',
        metrics: { reports: 0, insights: 0, forecasts: 'N/A' },
        features: ['Custom Reports', 'Variance Analysis', 'Forecasting', '+1 more'],
        gradient: 'from-green-400 to-green-500', // GREEN THEME
        department: 'Finance',
      },
    ],
    sales: [
      {
        id: 'lead_qualifier',
        name: 'Lead Qualifier',
        description: 'AI-powered lead scoring & enrichment',
        icon: Target,
        status: 'coming_soon',
        metrics: { qualified: 0, scored: 0, conversion: '0%' },
        features: ['Lead Scoring', 'Data Enrichment', 'Intent Signals', '+1 more'],
        gradient: 'from-green-600 to-green-600', // GREEN THEME
        department: 'Sales & Marketing',
      },
      {
        id: 'proposal_generator',
        name: 'Proposal Generator',
        description: 'Automated proposal creation',
        icon: FileText,
        status: 'coming_soon',
        metrics: { proposals: 0, winRate: '0%', avgValue: '$0' },
        features: ['Template Library', 'Pricing Engine', 'E-Signatures', '+1 more'],
        gradient: 'from-red-600 to-green-500', // GREEN THEME
        department: 'Sales & Marketing',
      },
      {
        id: 'campaign_analyzer',
        name: 'Campaign Analyzer',
        description: 'Multi-channel campaign analytics',
        icon: TrendingUp,
        status: 'coming_soon',
        metrics: { campaigns: 0, roi: '0%', reach: '0' },
        features: ['ROI Analysis', 'Attribution', 'A/B Testing', '+1 more'],
        gradient: 'from-green-600 to-green-600', // GREEN THEME
        department: 'Sales & Marketing',
      },
    ],
  };

  const departments = [
    { id: 'all', name: 'All Departments', count: 10 },
    { id: 'hr', name: 'Human Resources', count: 4 },
    { id: 'finance', name: 'Finance', count: 3 },
    { id: 'sales', name: 'Sales & Marketing', count: 3 },
  ];

  const getFilteredAgents = () => {
    if (selectedDepartment === 'all') {
      return [...allAgents.hr, ...allAgents.finance, ...allAgents.sales];
    }
    return allAgents[selectedDepartment] || [];
  };

  const AgentCard = ({ agent }) => {
    const IconComponent = agent.icon;

    return (
      <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-green-200/50 p-6 transition-all duration-300 hover:scale-105 hover:shadow-2xl relative overflow-hidden">
        {/* Background gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 to-green-50/30 pointer-events-none" />

        {/* Department badge */}
        <div className="absolute top-4 right-4 z-10">
          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs font-medium">
            {agent.department}
          </span>
        </div>

        {/* Status badge */}
        <div className="absolute top-4 left-4 z-10">
          {agent.status === 'active' && (
            <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs font-medium">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
              Active
            </div>
          )}
          {agent.status === 'beta' && (
            <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs font-medium">
              <Sparkles className="w-3 h-3" />
              Beta
            </div>
          )}
          {agent.status === 'coming_soon' && (
            <div className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs font-medium">
              Coming Soon
            </div>
          )}
        </div>

        {/* Header */}
        <div className="mb-5 mt-6 relative z-10">
          <div
            className={`w-12 h-12 rounded-xl bg-gradient-to-br ${agent.gradient} flex items-center justify-center mb-4 shadow-lg`}
          >
            <IconComponent className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-lg font-semibold mb-1 text-gray-900">{agent.name}</h3>
          <p className="text-sm text-gray-700 leading-relaxed">{agent.description}</p>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-3 mb-5 relative z-10">
          {Object.entries(agent.metrics).map(([key, value], idx) => (
            <div key={idx} className="text-center">
              <div
                className={`text-lg font-bold ${agent.status === 'active' ? 'text-gray-900' : 'text-gray-500'}`}
              >
                {value}
              </div>
              <div className="text-xs text-gray-500 capitalize">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </div>
            </div>
          ))}
        </div>

        {/* Features */}
        <div className="flex flex-wrap gap-1.5 mb-5 relative z-10">
          {agent.features.map((feature, idx) => (
            <span
              key={idx}
              className={`text-xs px-2.5 py-1.5 rounded-lg font-medium ${
                agent.status === 'active'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              {feature}
            </span>
          ))}
        </div>

        {/* Action button */}
        <button
          className={`w-full py-2.5 rounded-lg font-medium transition-all duration-200 text-sm relative z-10 ${
            agent.status === 'active'
              ? `bg-gradient-to-r ${agent.gradient} text-white hover:shadow-lg hover:scale-[1.02]`
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          }`}
          onClick={() => {
            if (agent.status === 'active') {
              if (agent.id === 'cv_intelligence') {
                window.open('/cv-intelligence', '_blank');
              } else {
                window.open(`/agent/${agent.id}`, '_blank');
              }
            }
          }}
          disabled={agent.status !== 'active'}
        >
          {agent.status === 'active' ? 'Launch Agent' : 'Coming Soon'}
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-red-50 to-green-50 relative overflow-hidden">
      {/* Background decorative elements - GREEN THEME */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-32 w-80 h-80 bg-green-400 rounded-full mix-blend-multiply filter blur-xl opacity-20"></div>
        <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-red-400 rounded-full mix-blend-multiply filter blur-xl opacity-20"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-green-400 rounded-full mix-blend-multiply filter blur-xl opacity-10"></div>
      </div>

      <main className="relative z-10 max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-green-200/50 p-8 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mr-4">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                  <p className="text-gray-600">
                    Welcome back, {user?.first_name}! Manage all departments and support.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push('/admin/users')}
                  className="flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:shadow-lg transition-all"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Manage Users
                </button>
                <button
                  onClick={() => router.push('/admin/tickets')}
                  className="flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:shadow-lg transition-all"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Support Tickets
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Department Filter */}
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">All Department Agents</h2>
            <div className="flex flex-wrap gap-4">
              {departments.map((dept) => (
                <button
                  key={dept.id}
                  onClick={() => setSelectedDepartment(dept.id)}
                  className={`px-4 py-2 rounded-xl font-medium transition-all ${
                    selectedDepartment === dept.id
                      ? 'bg-gradient-to-r from-green-500 to-green-500 text-white shadow-lg'
                      : 'bg-white/80 text-gray-700 hover:bg-white border border-green-200/50'
                  }`}
                >
                  {dept.name} ({dept.count})
                </button>
              ))}
            </div>
          </div>

          {/* Agents Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {getFilteredAgents().map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
