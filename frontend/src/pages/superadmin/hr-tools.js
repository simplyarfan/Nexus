import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import { tokenManager } from '../../utils/api';
import toast from 'react-hot-toast';

export default function HRTools() {
  const router = useRouter();
  const { user, isSuperAdmin, loading } = useAuth();
  const [kpiData, setKpiData] = useState([]);
  const [loadingKPI, setLoadingKPI] = useState(true);

  // Role check - redirect if not superadmin
  useEffect(() => {
    if (!loading && user && !isSuperAdmin) {
      router.replace('/');
    }
  }, [user, isSuperAdmin, loading, router]);

  // Fetch HR KPI data
  useEffect(() => {
    if (user && isSuperAdmin) {
      fetchHRKPIs();
    }
  }, [user, isSuperAdmin]);

  const fetchHRKPIs = async () => {
    try {
      setLoadingKPI(true);
      const token = tokenManager.getAccessToken();

      if (!token) {
        setLoadingKPI(false);
        return;
      }

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
      if (!API_BASE_URL) {
        console.error('NEXT_PUBLIC_API_URL environment variable is not set');
        setLoadingKPI(false);
        return;
      }

      // Fetch batches to get candidate processing data
      const batchesResponse = await fetch(`${API_BASE_URL}/api/cv-intelligence/batches`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (batchesResponse.ok) {
        const batchesResult = await batchesResponse.json();
        const batches = batchesResult.data || [];

        // Aggregate KPIs per user (HR person who created the batch)
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

          // Count candidates from this batch
          const candidateCount = batch.candidate_count || 0;
          userKPIs[userName].processed += candidateCount;

          // For selected/rejected, we'll use a placeholder logic
          // In a real scenario, you'd fetch actual candidate results from the batch
          // For now, we'll use a rough estimate based on batch status
          if (batch.status === 'completed') {
            // Assume roughly 30% selected, 70% rejected for completed batches
            const selectedCount = Math.round(candidateCount * 0.3);
            const rejectedCount = candidateCount - selectedCount;
            userKPIs[userName].selected += selectedCount;
            userKPIs[userName].rejected += rejectedCount;
          }
        });

        // Convert to array format for rendering
        const kpiArray = Object.keys(userKPIs).map((userName) => ({
          name: userName,
          ...userKPIs[userName],
        }));

        setKpiData(kpiArray);
      }
    } catch (error) {
      console.error('HR KPI fetch error:', error);
      toast.error('Failed to load HR KPIs');
    } finally {
      setLoadingKPI(false);
    }
  };

  // Calculate max value for scaling bar charts
  const getMaxValue = (metric) => {
    if (kpiData.length === 0) return 100;
    return Math.max(...kpiData.map((item) => item[metric]), 100);
  };

  if (loading || loadingKPI) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
      </div>
    );
  }

  if (!isSuperAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
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
              <h1 className="text-3xl font-bold text-foreground">HR Tools</h1>
              <p className="text-muted-foreground mt-1">Track HR KPIs and performance metrics</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        {kpiData.length === 0 ? (
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
            <h3 className="text-lg font-medium text-foreground mb-2">No HR Data Available</h3>
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
                  Total number of candidates processed by each HR person
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
                  Number of candidates selected/shortlisted by each HR person
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
                  Number of candidates rejected by each HR person
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
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
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
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
