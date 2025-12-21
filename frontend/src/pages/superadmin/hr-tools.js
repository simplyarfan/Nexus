import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import { tokenManager } from '../../utils/api';
import { hrAnalyticsAPI } from '../../utils/hrAnalyticsAPI';
import toast from 'react-hot-toast';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from 'recharts';

const CHART_COLORS = {
  selected: '#10b981',
  rejected: '#ef4444',
  primary: '#6366f1',
};

const DATE_RANGE_OPTIONS = [
  { value: 'all', label: 'All Time' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 90 Days' },
];

export default function RecruitmentTools() {
  const router = useRouter();
  const { user, isSuperAdmin, loading } = useAuth();

  // Tab state
  const [activeTab, setActiveTab] = useState('interviews'); // 'cv-processing' or 'interviews'

  // CV Processing state (existing)
  const [kpiData, setKpiData] = useState([]);
  const [loadingKPI, setLoadingKPI] = useState(true);

  // Interview Analytics state (new)
  const [dateRange, setDateRange] = useState('all');
  const [recruitmentStats, setHrStats] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [interviews, setInterviews] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [loadingInterviews, setLoadingInterviews] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });

  // Role check - redirect if not superadmin
  useEffect(() => {
    if (!loading && user && !isSuperAdmin) {
      router.replace('/');
    }
  }, [user, isSuperAdmin, loading, router]);

  // Fetch CV Processing KPIs (existing functionality)
  useEffect(() => {
    if (user && isSuperAdmin && activeTab === 'cv-processing') {
      fetchRecruitmentKPIs();
    }
  }, [user, isSuperAdmin, activeTab]);

  // Fetch Interview Analytics
  useEffect(() => {
    if (user && isSuperAdmin && activeTab === 'interviews') {
      fetchInterviewAnalytics();
    }
  }, [user, isSuperAdmin, activeTab, dateRange]);

  // Fetch interviews table data
  useEffect(() => {
    if (user && isSuperAdmin && activeTab === 'interviews') {
      fetchInterviews();
    }
  }, [user, isSuperAdmin, activeTab, dateRange, selectedUserId, pagination.page]);

  const fetchRecruitmentKPIs = async () => {
    try {
      setLoadingKPI(true);
      const token = tokenManager.getAccessToken();

      if (!token) {
        setLoadingKPI(false);
        return;
      }

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
      if (!API_BASE_URL) {
        setLoadingKPI(false);
        return;
      }

      const batchesResponse = await fetch(`${API_BASE_URL}/api/cv-intelligence/batches`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (batchesResponse.ok) {
        const batchesResult = await batchesResponse.json();
        const batches = batchesResult.data || [];

        const userKPIs = {};

        batches.forEach((batch) => {
          const userName = batch.created_by_name || 'Unknown User';

          if (!userKPIs[userName]) {
            userKPIs[userName] = {
              processed: 0,
              selected: 0,
              rejected: 0,
            };
          }

          const candidateCount = batch.candidate_count || 0;
          userKPIs[userName].processed += candidateCount;

          if (batch.status === 'completed') {
            const selectedCount = Math.round(candidateCount * 0.3);
            const rejectedCount = candidateCount - selectedCount;
            userKPIs[userName].selected += selectedCount;
            userKPIs[userName].rejected += rejectedCount;
          }
        });

        const kpiArray = Object.keys(userKPIs).map((userName) => ({
          name: userName,
          ...userKPIs[userName],
        }));

        setKpiData(kpiArray);
      }
    } catch (error) {
      toast.error('Failed to load CV processing KPIs');
    } finally {
      setLoadingKPI(false);
    }
  };

  const fetchInterviewAnalytics = async () => {
    try {
      setLoadingInterviews(true);
      const [statsResponse, outcomesResponse] = await Promise.all([
        hrAnalyticsAPI.getHRUserStats(dateRange),
        hrAnalyticsAPI.getOutcomeStats(dateRange),
      ]);

      if (statsResponse.success) {
        setHrStats(statsResponse.data);
      }

      if (outcomesResponse.success) {
        setChartData(outcomesResponse.data);
      }
    } catch (error) {
      toast.error('Failed to load interview analytics');
    } finally {
      setLoadingInterviews(false);
    }
  };

  const fetchInterviews = async () => {
    try {
      const response = await hrAnalyticsAPI.getAllInterviews({
        page: pagination.page,
        limit: pagination.limit,
        dateRange,
        userId: selectedUserId || undefined,
      });

      if (response.success) {
        setInterviews(response.data.interviews || []);
        setPagination((prev) => ({
          ...prev,
          total: response.data.pagination.total,
          totalPages: response.data.pagination.totalPages,
        }));
      }
    } catch (error) {
      // Silently fail for table data
    }
  };

  const getMaxValue = (metric) => {
    if (kpiData.length === 0) return 100;
    return Math.max(...kpiData.map((item) => item[metric]), 100);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getOutcomeBadge = (outcome) => {
    if (outcome === 'selected') {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-emerald-500/10 text-emerald-500">
          Selected
        </span>
      );
    }
    if (outcome === 'rejected') {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-500/10 text-red-500">
          Rejected
        </span>
      );
    }
    return (
      <span className="px-2 py-1 text-xs font-medium rounded-full bg-muted text-muted-foreground">
        Pending
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
      </div>
    );
  }

  if (!isSuperAdmin) return null;

  // Pie chart data - filter by selected user if one is selected
  const getPieData = () => {
    if (!chartData?.chartData?.length) return [];

    if (selectedUserId) {
      const userData = chartData.chartData.find(u => String(u.user_id) === String(selectedUserId));
      if (!userData) return [];
      return [
        { name: 'Selected', value: userData.selected || 0 },
        { name: 'Rejected', value: userData.rejected || 0 },
      ];
    }

    // Use totals for all users
    if (chartData?.totals?.selected || chartData?.totals?.rejected) {
      return [
        { name: 'Selected', value: chartData.totals.selected || 0 },
        { name: 'Rejected', value: chartData.totals.rejected || 0 },
      ];
    }
    return [];
  };

  const pieData = getPieData();

  // Bar chart data - show totals when no user selected, individual user data when filtered
  const getBarChartData = () => {
    if (!chartData?.chartData?.length) return [];

    if (selectedUserId) {
      // Show specific user's data
      return chartData.chartData.filter(u => String(u.user_id) === String(selectedUserId));
    }

    // Show total across all users
    return [{
      name: 'All Interviews',
      selected: chartData.totals?.selected || 0,
      rejected: chartData.totals?.rejected || 0,
    }];
  };

  const barChartData = getBarChartData();

  // Get stats for display - either totals or specific user
  const getDisplayStats = () => {
    if (!recruitmentStats) return { total_interviews: 0, total_selected: 0, total_rejected: 0, selection_rate: 0 };

    if (selectedUserId) {
      const userData = recruitmentStats.users?.find(u => String(u.user_id) === String(selectedUserId));
      if (userData) {
        return {
          total_interviews: userData.total_interviews || 0,
          total_selected: userData.selected_count || 0,
          total_rejected: userData.rejected_count || 0,
          selection_rate: userData.selection_rate || 0,
        };
      }
    }

    // Return totals
    return {
      total_interviews: recruitmentStats.summary?.total_interviews || 0,
      total_selected: recruitmentStats.summary?.total_selected || 0,
      total_rejected: recruitmentStats.summary?.total_rejected || 0,
      selection_rate: recruitmentStats.summary?.overall_selection_rate || 0,
    };
  };

  const displayStats = getDisplayStats();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/superadmin')}
              className="p-2 hover:bg-accent rounded-lg transition-colors"
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
              <h1 className="text-3xl font-bold text-foreground">Recruitment Tools</h1>
              <p className="text-muted-foreground mt-1">Track recruitment KPIs and performance metrics</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('interviews')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'interviews'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Interview Analytics
            </button>
            <button
              onClick={() => setActiveTab('cv-processing')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'cv-processing'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              CV Processing
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Interview Analytics Tab */}
        {activeTab === 'interviews' && (
          <div className="space-y-8">
            {/* Date Range Filter */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">Interview Performance</h2>
              <select
                value={dateRange}
                onChange={(e) => {
                  setDateRange(e.target.value);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className="bg-background border border-border rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                {DATE_RANGE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {loadingInterviews && !recruitmentStats ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                {/* Summary Stats */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid grid-cols-1 md:grid-cols-4 gap-6"
                >
                  <div className="bg-card border border-border rounded-xl p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Total Interviews</p>
                        <p className="text-2xl font-bold text-foreground">
                          {displayStats.total_interviews}
                        </p>
                      </div>
                      <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="bg-card border border-border rounded-xl p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Selected</p>
                        <p className="text-2xl font-bold text-emerald-500">
                          {displayStats.total_selected}
                        </p>
                      </div>
                      <div className="w-12 h-12 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="bg-card border border-border rounded-xl p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Rejected</p>
                        <p className="text-2xl font-bold text-red-500">
                          {displayStats.total_rejected}
                        </p>
                      </div>
                      <div className="w-12 h-12 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="bg-card border border-border rounded-xl p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Selection Rate</p>
                        <p className="text-2xl font-bold text-foreground">
                          {displayStats.selection_rate}%
                        </p>
                      </div>
                      <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Bar Chart */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-card border border-border rounded-xl p-6"
                  >
                    <h3 className="text-lg font-semibold text-foreground mb-4">
                      Selections vs Rejections by Recruiter
                    </h3>
                    {barChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                          data={barChartData}
                          margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis
                            dataKey="name"
                            tick={{ fill: 'currentColor', fontSize: 12 }}
                            tickLine={{ stroke: 'currentColor' }}
                          />
                          <YAxis tick={{ fill: 'currentColor', fontSize: 12 }} tickLine={{ stroke: 'currentColor' }} />
                          <Legend />
                          <Bar dataKey="selected" fill={CHART_COLORS.selected} name="Selected" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="rejected" fill={CHART_COLORS.rejected} name="Rejected" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                        No interview outcome data available
                      </div>
                    )}
                  </motion.div>

                  {/* Pie Chart */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-card border border-border rounded-xl p-6"
                  >
                    <h3 className="text-lg font-semibold text-foreground mb-4">Overall Selection Rate</h3>
                    {pieData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            labelLine={true}
                            label={({ name, percent, value }) => `${name}: ${value} (${(percent * 100).toFixed(1)}%)`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            <Cell fill={CHART_COLORS.selected} />
                            <Cell fill={CHART_COLORS.rejected} />
                          </Pie>
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                        No outcome data available
                      </div>
                    )}
                  </motion.div>
                </div>

                {/* Interviews Table */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-card border border-border rounded-xl"
                >
                  <div className="p-4 border-b border-border flex items-center justify-between relative z-30">
                    <h3 className="text-lg font-semibold text-foreground">Interview Activity</h3>
                    <div className="relative">
                      <button
                        onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                        className="flex items-center gap-2 bg-background border border-border rounded-lg px-4 py-2 text-sm hover:bg-muted transition-colors min-w-[180px] justify-between"
                      >
                        <span className="text-foreground">
                          {selectedUserId
                            ? recruitmentStats?.users?.filter(u => u.role === 'user').find(u => String(u.user_id) === String(selectedUserId))
                              ? `${recruitmentStats.users.filter(u => u.role === 'user').find(u => String(u.user_id) === String(selectedUserId)).first_name} ${recruitmentStats.users.filter(u => u.role === 'user').find(u => String(u.user_id) === String(selectedUserId)).last_name}`
                              : 'All Recruiters'
                            : 'All Recruiters'}
                        </span>
                        <svg
                          className={`w-4 h-4 text-muted-foreground transition-transform ${userDropdownOpen ? 'rotate-180' : ''}`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {userDropdownOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setUserDropdownOpen(false)}
                          />
                          <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-lg shadow-xl z-50 py-1 max-h-64 overflow-y-auto">
                            <button
                              onClick={() => {
                                setSelectedUserId('');
                                setPagination((prev) => ({ ...prev, page: 1 }));
                                setUserDropdownOpen(false);
                              }}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-muted transition-colors"
                            >
                              <span className={`w-4 h-4 flex items-center justify-center ${!selectedUserId ? 'text-primary' : 'text-transparent'}`}>
                                {!selectedUserId && (
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </span>
                              <span className={`${!selectedUserId ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                                All Recruiters
                              </span>
                            </button>
                            {recruitmentStats?.users?.filter(u => u.role === 'user').map((u) => (
                              <button
                                key={u.user_id}
                                onClick={() => {
                                  setSelectedUserId(String(u.user_id));
                                  setPagination((prev) => ({ ...prev, page: 1 }));
                                  setUserDropdownOpen(false);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-muted transition-colors"
                              >
                                <span className={`w-4 h-4 flex items-center justify-center ${String(selectedUserId) === String(u.user_id) ? 'text-primary' : 'text-transparent'}`}>
                                  {String(selectedUserId) === String(u.user_id) && (
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </span>
                                <span className={`${String(selectedUserId) === String(u.user_id) ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                                  {u.first_name} {u.last_name}
                                </span>
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Interviewer
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Candidate
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Position
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Outcome
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {interviews.length > 0 ? (
                          interviews.map((interview) => (
                            <tr key={interview.interview_id} className="hover:bg-muted/50">
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className="text-sm text-foreground">
                                  {interview.interviewer_name || '-'}
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div>
                                  <div className="text-sm font-medium text-foreground">
                                    {interview.candidate_name}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {interview.candidate_email}
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className="text-sm text-foreground">{interview.job_title}</span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className="text-sm text-muted-foreground">
                                  {formatDate(interview.scheduled_time)}
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                {getOutcomeBadge(interview.outcome)}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="5" className="px-4 py-8 text-center text-muted-foreground">
                              No interviews found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {pagination.totalPages > 1 && (
                    <div className="p-4 border-t border-border flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                          disabled={pagination.page === 1}
                          className="px-3 py-1 text-sm border border-border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                          disabled={pagination.page === pagination.totalPages}
                          className="px-3 py-1 text-sm border border-border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              </>
            )}
          </div>
        )}

        {/* CV Processing Tab (existing functionality) */}
        {activeTab === 'cv-processing' && (
          <>
            {loadingKPI ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : kpiData.length === 0 ? (
              <div className="bg-card border border-border rounded-xl p-12 text-center">
                <svg
                  className="w-16 h-16 text-muted-foreground mx-auto mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                <h3 className="text-lg font-medium text-foreground mb-2">No CV Processing Data Available</h3>
                <p className="text-muted-foreground">
                  Start processing candidates to see KPI metrics here.
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Candidates Processed */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card border border-border rounded-xl p-6"
                >
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-foreground mb-1">Candidates Processed</h2>
                    <p className="text-sm text-muted-foreground">
                      Total number of candidates processed by each recruiter
                    </p>
                  </div>
                  <div className="space-y-4">
                    {kpiData.map((person, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-foreground">{person.name}</span>
                          <span className="text-sm font-bold text-primary">{person.processed}</span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-3">
                          <div
                            className="bg-primary h-3 rounded-full transition-all duration-500"
                            style={{
                              width: `${(person.processed / getMaxValue('processed')) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Candidates Selected */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-card border border-border rounded-xl p-6"
                >
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-foreground mb-1">Candidates Selected</h2>
                    <p className="text-sm text-muted-foreground">
                      Number of candidates selected/shortlisted by each recruiter
                    </p>
                  </div>
                  <div className="space-y-4">
                    {kpiData.map((person, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-foreground">{person.name}</span>
                          <span className="text-sm font-bold text-emerald-500">{person.selected}</span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-3">
                          <div
                            className="bg-emerald-500 h-3 rounded-full transition-all duration-500"
                            style={{
                              width: `${(person.selected / getMaxValue('selected')) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Candidates Rejected */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-card border border-border rounded-xl p-6"
                >
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-foreground mb-1">Candidates Rejected</h2>
                    <p className="text-sm text-muted-foreground">
                      Number of candidates rejected by each recruiter
                    </p>
                  </div>
                  <div className="space-y-4">
                    {kpiData.map((person, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-foreground">{person.name}</span>
                          <span className="text-sm font-bold text-red-500">{person.rejected}</span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-3">
                          <div
                            className="bg-red-500 h-3 rounded-full transition-all duration-500"
                            style={{
                              width: `${(person.rejected / getMaxValue('rejected')) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Summary Stats */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="grid grid-cols-1 md:grid-cols-3 gap-6"
                >
                  <div className="bg-card border border-border rounded-xl p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Total Processed</p>
                        <p className="text-2xl font-bold text-foreground">
                          {kpiData.reduce((sum, p) => sum + p.processed, 0)}
                        </p>
                      </div>
                      <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="bg-card border border-border rounded-xl p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Total Selected</p>
                        <p className="text-2xl font-bold text-foreground">
                          {kpiData.reduce((sum, p) => sum + p.selected, 0)}
                        </p>
                      </div>
                      <div className="w-12 h-12 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="bg-card border border-border rounded-xl p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Total Rejected</p>
                        <p className="text-2xl font-bold text-foreground">
                          {kpiData.reduce((sum, p) => sum + p.rejected, 0)}
                        </p>
                      </div>
                      <div className="w-12 h-12 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
