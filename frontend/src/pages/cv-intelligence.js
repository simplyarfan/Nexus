import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeIn, scaleIn } from '@/lib/motion';
import Button from '@/components/ui/Button';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';

export default function CVIntelligencePage() {
  const router = useRouter();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'superadmin';
  const isAdmin = user?.role === 'admin';

  const getDashboardPath = () => {
    if (isSuperAdmin) return '/superadmin';
    if (isAdmin) return '/admin';
    return '/dashboard';
  };
  const [isDragging, setIsDragging] = useState(false);
  const [view, setView] = useState('batches');
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    show: false,
    batchId: null,
    batchName: '',
  });
  const [batchName, setBatchName] = useState('');
  const [cvFiles, setCvFiles] = useState([]);
  const [jdFile, setJdFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch CV batches from API
  useEffect(() => {
    const fetchBatches = async () => {
      try {
        setLoading(true);

        const response = await api.get('/cv-intelligence/batches');

        setBatches(response.data.data || []);
      } catch (error) {
        setBatches([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBatches();
  }, []);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    // Simulate file upload
    setView('batches');
  };

  const handleBatchClick = async (batch) => {
    try {
      const response = await api.get(`/cv-intelligence/batch/${batch.id}`);

      if (response.data.success) {
        const batchData = response.data.data;

        // Sort candidates by overall_score (highest to lowest)
        if (batchData.candidates && Array.isArray(batchData.candidates)) {
          batchData.candidates.sort((a, b) => {
            const scoreA = parseFloat(a.overall_score) || 0;
            const scoreB = parseFloat(b.overall_score) || 0;
            return scoreB - scoreA; // Descending order (best to worst)
          });
        }

        setSelectedBatch(batchData);
        setView('candidates');
      }
    } catch (error) {
      // Silent failure
    }
  };

  const handleDeleteBatch = async (e, batchId, batchName) => {
    e.stopPropagation(); // Prevent batch click when clicking delete
    setDeleteConfirmation({ show: true, batchId, batchName });
  };

  const confirmDelete = async () => {
    const { batchId } = deleteConfirmation;

    try {
      const response = await api.delete(`/cv-intelligence/batch/${batchId}`);

      if (response.data.success) {
        // Remove batch from state
        setBatches(batches.filter((b) => b.id !== batchId));
        setDeleteConfirmation({ show: false, batchId: null, batchName: '' });
      }
    } catch (error) {
      toast.error('Failed to delete batch from database. Please try again.');
      setDeleteConfirmation({ show: false, batchId: null, batchName: '' });
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmation({ show: false, batchId: null, batchName: '' });
  };

  const handleCandidateClick = (candidate) => {
    setSelectedCandidate(candidate);
  };

  const handleScheduleInterview = (e, candidate) => {
    e.stopPropagation(); // Prevent candidate detail expansion

    // Navigate to interview coordinator with pre-filled candidate data
    router.push({
      pathname: '/interview-coordinator',
      query: {
        candidateName: candidate.name,
        candidateEmail: candidate.email,
        candidatePhone: candidate.phone || '',
        candidateId: candidate.id,
        batchId: selectedBatch?.id || '',
        batchName: selectedBatch?.name || '',
      },
    });
  };

  const handleCvFilesChange = (e) => {
    const files = Array.from(e.target.files || []);
    setCvFiles(files);
  };

  const handleJdFileChange = (e) => {
    const file = e.target.files?.[0];
    setJdFile(file || null);
  };

  const handleProcessBatch = async () => {
    // Validation
    if (!batchName.trim()) {
      toast.error('Please enter a batch name');
      return;
    }
    if (cvFiles.length === 0) {
      toast.error('Please select at least one CV file');
      return;
    }
    if (!jdFile) {
      toast.error('Please select a job description file');
      return;
    }

    try {
      setIsProcessing(true);

      // Create batch first
      const batchResponse = await api.post('/cv-intelligence', {
        name: batchName.trim(),
      });

      if (!batchResponse.data.success) {
        throw new Error('Failed to create batch');
      }

      const batchId = batchResponse.data.data.batch.id;

      // Upload and process files
      const formData = new FormData();
      formData.append('jdFile', jdFile);
      cvFiles.forEach((file) => {
        formData.append('cvFiles', file);
      });

      const processResponse = await api.post(`/cv-intelligence/batch/${batchId}/process`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 600000, // 10 minutes
      });

      if (processResponse.data.success) {
        toast.success('Batch processed successfully!');

        // Reset form
        setBatchName('');
        setCvFiles([]);
        setJdFile(null);

        // Refresh batches and go back to list
        const refreshResponse = await api.get('/cv-intelligence/batches');
        setBatches(refreshResponse.data.data || []);
        setView('batches');
      } else {
        throw new Error(processResponse.data.message || 'Failed to process batch');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Failed to process batch');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="mb-4">
            <Link
              href={getDashboardPath()}
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to Dashboard
            </Link>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">CV Intelligence (HR-01)</h1>
              <p className="text-muted-foreground mt-1">
                AI-powered CV screening and candidate matching
              </p>
            </div>
            <div className="flex gap-3">
              {view === 'candidates' && (
                <Button variant="ghost" size="lg" onClick={() => setView('batches')}>
                  <svg
                    className="w-5 h-5 mr-2"
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
                  Back to Batches
                </Button>
              )}
              <Button variant="primary" size="lg" onClick={() => setView('upload')}>
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                New Batch
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {/* Batches List View */}
          {view === 'batches' && (
            <motion.div
              key="batches"
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-foreground mb-2">CV Batches</h2>
                <p className="text-muted-foreground">View and manage your CV screening batches</p>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : batches.length === 0 ? (
                <div className="bg-card border border-border rounded-2xl p-12 text-center">
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
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <h3 className="text-xl font-semibold text-foreground mb-2">No CV batches yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Upload CVs to start screening candidates with AI
                  </p>
                  <Button variant="primary" size="lg">
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    Upload CVs
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {batches.map((batch, index) => (
                    <motion.div
                      key={batch.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => batch.status === 'completed' && handleBatchClick(batch)}
                      className={`bg-card border border-border rounded-2xl p-6 ${
                        batch.status === 'completed'
                          ? 'cursor-pointer hover:shadow-lg transition-shadow'
                          : 'opacity-60'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                          <svg
                            className="w-6 h-6 text-primary"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-3 py-1 text-xs font-medium rounded-full capitalize ${
                              batch.status === 'completed'
                                ? 'bg-ring/10 text-ring'
                                : batch.status === 'processing'
                                  ? 'bg-primary/10 text-primary'
                                  : 'bg-destructive/10 text-destructive'
                            }`}
                          >
                            {batch.status}
                          </span>
                          <button
                            onClick={(e) => handleDeleteBatch(e, batch.id, batch.name)}
                            className="p-2 hover:bg-destructive/10 rounded-lg transition-colors"
                            title="Delete batch"
                          >
                            <svg
                              className="w-4 h-4 text-destructive"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>

                      <h3 className="text-lg font-semibold text-foreground mb-2">{batch.name}</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        {batch.processed_resumes} / {batch.total_resumes} CVs
                      </p>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Candidates Found:</span>
                          <span className="font-medium text-foreground">
                            {batch.candidate_count || 0}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Date Created:</span>
                          <span className="font-medium text-foreground">
                            {batch.created_at
                              ? new Date(batch.created_at).toLocaleDateString()
                              : 'N/A'}
                          </span>
                        </div>
                        {batch.status === 'completed' &&
                          batch.candidates &&
                          batch.candidates.length > 0 && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Top Match:</span>
                              <span className="font-medium text-primary">
                                {batch.candidates[0].overall_score}%
                              </span>
                            </div>
                          )}
                      </div>

                      {batch.status === 'completed' && (
                        <div className="mt-4 pt-4 border-t border-border">
                          <div className="flex items-center text-primary text-sm font-medium">
                            View Candidates
                            <svg
                              className="w-4 h-4 ml-2"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Upload View */}
          {view === 'upload' && (
            <motion.div
              key="upload"
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-foreground mb-2">Create New Batch</h2>
                  <p className="text-muted-foreground">
                    Upload CVs and job description to create a new screening batch
                  </p>
                </div>

                <div className="space-y-6">
                  {/* 1. Batch Name */}
                  <div className="bg-card border border-border rounded-2xl p-6">
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Batch Name
                    </label>
                    <input
                      type="text"
                      value={batchName}
                      onChange={(e) => setBatchName(e.target.value)}
                      placeholder="e.g., Sr. AI Developer - December 2024"
                      className="w-full px-4 py-2 bg-secondary text-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      The batch name should describe the role you're hiring for
                    </p>
                  </div>

                  {/* 2. CV Upload Area */}
                  <div className="bg-card border border-border rounded-2xl p-6">
                    <label className="block text-sm font-medium text-foreground mb-4">
                      Upload CVs
                    </label>
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                        isDragging
                          ? 'border-primary bg-primary/5'
                          : 'border-border bg-secondary hover:border-primary/50 hover:bg-accent'
                      }`}
                    >
                      <div className="flex justify-center mb-4">
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                          <svg
                            className="w-8 h-8 text-primary"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                        </div>
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        Drop CV files here or click to browse
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Upload 2-10 CVs • PDF, DOC, DOCX • Max 10MB each
                      </p>
                      <input
                        type="file"
                        id="cv-files"
                        multiple
                        accept=".pdf,.doc,.docx"
                        onChange={handleCvFilesChange}
                        className="hidden"
                      />
                      <label htmlFor="cv-files">
                        <Button variant="primary" size="md">
                          Select CV Files
                        </Button>
                      </label>
                      {cvFiles.length > 0 && (
                        <p className="text-sm text-green-600 mt-2">
                          ✓ {cvFiles.length} file{cvFiles.length > 1 ? 's' : ''} selected
                        </p>
                      )}
                    </div>
                  </div>

                  {/* 3. Job Description Upload Area */}
                  <div className="bg-card border border-border rounded-2xl p-6">
                    <label className="block text-sm font-medium text-foreground mb-4">
                      Upload Job Description
                    </label>
                    <div className="border-2 border-dashed rounded-xl p-8 text-center transition-all border-border bg-secondary hover:border-primary/50 hover:bg-accent">
                      <div className="flex justify-center mb-4">
                        <div className="w-16 h-16 bg-ring/10 rounded-full flex items-center justify-center">
                          <svg
                            className="w-8 h-8 text-ring"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                        </div>
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        Drop job description here or click to browse
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Upload 1 JD file • PDF, DOC, DOCX, TXT • Max 5MB
                      </p>
                      <input
                        type="file"
                        id="jd-file"
                        accept=".pdf,.doc,.docx,.txt"
                        onChange={handleJdFileChange}
                        className="hidden"
                      />
                      <label htmlFor="jd-file">
                        <Button variant="secondary" size="md">
                          Select JD File
                        </Button>
                      </label>
                      {jdFile && (
                        <p className="text-sm text-green-600 mt-2">
                          ✓ {jdFile.name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-8">
                  <Button
                    variant="primary"
                    size="lg"
                    className="flex-1"
                    onClick={handleProcessBatch}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-5 h-5 mr-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                          />
                        </svg>
                        Start AI Processing
                      </>
                    )}
                  </Button>
                  <Button
                    variant="secondary"
                    size="lg"
                    onClick={() => {
                      setView('batches');
                      setBatchName('');
                      setCvFiles([]);
                      setJdFile(null);
                    }}
                    disabled={isProcessing}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Candidates View */}
          {view === 'candidates' && selectedBatch && (
            <motion.div
              key="candidates"
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold text-foreground">{selectedBatch.name}</h2>
                  <span className="px-3 py-1 text-xs font-medium bg-ring/10 text-ring rounded-full">
                    {selectedBatch.candidates.length} Candidates
                  </span>
                </div>
                <p className="text-muted-foreground">Candidates ranked by match score</p>
              </div>

              {selectedBatch?.candidates?.length === 0 ? (
                <div className="bg-card border border-border rounded-2xl p-12 text-center">
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
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    No candidates processed yet
                  </h3>
                  <p className="text-muted-foreground">
                    Candidates will appear here once CV processing is complete
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedBatch?.candidates?.map((candidate, index) => (
                    <motion.div
                      key={candidate.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => handleCandidateClick(candidate)}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center text-foreground font-semibold">
                              {candidate.name && typeof candidate.name === 'string'
                                ? candidate.name
                                    .split(' ')
                                    .map((n) => n[0])
                                    .join('')
                                : 'N/A'}
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-foreground">
                                {candidate.name}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {candidate.email} {candidate.phone && `• ${candidate.phone}`}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex flex-col items-end gap-2">
                          {/* Ranking Badge */}
                          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                            <span className="text-xl font-bold text-primary-foreground">
                              #{index + 1}
                            </span>
                          </div>
                          {/* Match Score */}
                          <div className="text-2xl font-bold text-primary">
                            {candidate.overall_score}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Email</p>
                          <p className="text-sm font-medium text-foreground">
                            {candidate.email || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Phone</p>
                          <p className="text-sm font-medium text-foreground">
                            {candidate.phone || 'N/A'}
                          </p>
                        </div>
                      </div>

                      {candidate.profile_json &&
                        (() => {
                          try {
                            const profile =
                              typeof candidate.profile_json === 'string'
                                ? JSON.parse(candidate.profile_json)
                                : candidate.profile_json;
                            const skills = profile.skills || profile.matched_skills || [];

                            return skills.length > 0 ? (
                              <div className="mb-4">
                                <p className="text-xs text-muted-foreground mb-2">
                                  Skills ({skills.length})
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {skills.slice(0, 8).map((skill, idx) => (
                                    <span
                                      key={idx}
                                      className="px-3 py-1 text-xs font-medium bg-ring/10 text-ring rounded-full"
                                    >
                                      {skill}
                                    </span>
                                  ))}
                                  {skills.length > 8 && (
                                    <span className="px-3 py-1 text-xs font-medium bg-accent text-foreground rounded-full">
                                      +{skills.length - 8} more
                                    </span>
                                  )}
                                </div>
                              </div>
                            ) : null;
                          } catch (e) {
                            return null;
                          }
                        })()}

                      <div className="flex gap-3">
                        <Button
                          variant="primary"
                          size="md"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCandidateClick(candidate);
                          }}
                        >
                          View Full Profile
                        </Button>
                        <Button
                          variant="secondary"
                          size="md"
                          onClick={(e) => handleScheduleInterview(e, candidate)}
                        >
                          Schedule Interview
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Candidate Detail Modal */}
      <AnimatePresence>
        {selectedCandidate &&
          (() => {
            // Parse profile_json
            let profile = {};
            try {
              profile =
                typeof selectedCandidate.profile_json === 'string'
                  ? JSON.parse(selectedCandidate.profile_json)
                  : selectedCandidate.profile_json || {};
            } catch (e) {
              // Silent failure
            }

            // Safely extract arrays and ensure they only contain strings
            const rawSkills = profile.skills || profile.matched_skills || [];
            const skills = Array.isArray(rawSkills)
              ? rawSkills.filter((s) => typeof s === 'string')
              : [];

            // Ensure experience is a string
            const experience =
              typeof profile.experience === 'string'
                ? profile.experience
                : typeof profile.years_of_experience === 'string'
                  ? profile.years_of_experience
                  : typeof profile.years_of_experience === 'number'
                    ? `${profile.years_of_experience} years`
                    : 'N/A';

            // Ensure professional assessment is a string - try multiple possible fields
            const professionalAssessment =
              typeof profile.professional_assessment === 'string' &&
              profile.professional_assessment.trim()
                ? profile.professional_assessment
                : typeof profile.summary === 'string' && profile.summary.trim()
                  ? profile.summary
                  : typeof profile.assessment === 'string' && profile.assessment.trim()
                    ? profile.assessment
                    : typeof profile.bio === 'string' && profile.bio.trim()
                      ? profile.bio
                      : 'No professional assessment available in database';

            // Ensure education is a string
            const education = typeof profile.education === 'string' ? profile.education : '';

            return (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={() => setSelectedCandidate(null)}
              >
                <motion.div
                  initial={{ scale: 0.95, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.95, y: 20 }}
                  className="bg-card border border-border rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Modal Header */}
                  <div className="sticky top-0 bg-card border-b border-border p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-2xl font-bold">
                        {selectedCandidate.name && typeof selectedCandidate.name === 'string'
                          ? selectedCandidate.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                          : 'N/A'}
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-foreground">
                          {selectedCandidate.name}
                        </h2>
                        <p className="text-sm text-muted-foreground">{experience} of experience</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedCandidate(null)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>

                  {/* Modal Content */}
                  <div className="p-6 space-y-6">
                    {/* Match Score */}
                    <div className="bg-accent rounded-xl p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-foreground mb-1">
                            Overall Match Score
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Based on skills, experience, and qualifications
                          </p>
                        </div>
                        <div className="text-5xl font-bold text-primary">
                          {selectedCandidate.overall_score || 'N/A'}
                        </div>
                      </div>
                    </div>

                    {/* Contact Information */}
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-4">
                        Contact Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center gap-3 p-3 bg-accent rounded-lg">
                          <svg
                            className="w-5 h-5 text-muted-foreground"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                            />
                          </svg>
                          <div>
                            <p className="text-xs text-muted-foreground">Email</p>
                            <p className="text-sm font-medium text-foreground">
                              {selectedCandidate.email}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-accent rounded-lg">
                          <svg
                            className="w-5 h-5 text-muted-foreground"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                            />
                          </svg>
                          <div>
                            <p className="text-xs text-muted-foreground">Phone</p>
                            <p className="text-sm font-medium text-foreground">
                              {selectedCandidate.phone}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-accent rounded-lg">
                          <svg
                            className="w-5 h-5 text-muted-foreground"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                          <div>
                            <p className="text-xs text-muted-foreground">Location</p>
                            <p className="text-sm font-medium text-foreground">
                              {selectedCandidate.location}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Professional Assessment */}
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-4">
                        Professional Assessment
                      </h3>
                      <div className="p-4 bg-accent rounded-lg">
                        <p className="text-sm text-foreground leading-relaxed">
                          {professionalAssessment}
                        </p>
                      </div>
                    </div>

                    {/* Skills Analysis */}
                    {skills.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-4">
                          Skills Analysis
                        </h3>

                        {/* Skills Match Visualization */}
                        <div className="mb-6">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-muted-foreground">
                              Overall Match Score
                            </span>
                            <span className="text-sm font-semibold text-primary">
                              {selectedCandidate.overall_score || 'N/A'}
                            </span>
                          </div>
                          <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ width: `${selectedCandidate.overall_score || 0}%` }}
                            />
                          </div>
                        </div>

                        {/* Skills */}
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                            <div className="w-2 h-2 bg-ring rounded-full" />
                            Skills ({skills.length})
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {skills.map((skill, idx) => (
                              <span
                                key={idx}
                                className="px-3 py-1.5 text-xs font-medium bg-ring/10 text-ring rounded-full"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Experience Timeline */}
                    {profile.experience_timeline &&
                      Array.isArray(profile.experience_timeline) &&
                      profile.experience_timeline.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold text-foreground mb-4">
                            Professional Experience
                          </h3>
                          <div className="space-y-4">
                            {profile.experience_timeline.map((exp, idx) => {
                              // Ensure exp is an object and not a primitive
                              if (typeof exp !== 'object' || exp === null) return null;

                              // Extract string values safely
                              const role =
                                typeof exp.role === 'string'
                                  ? exp.role
                                  : typeof exp.title === 'string'
                                    ? exp.title
                                    : 'Position';
                              const company =
                                typeof exp.company === 'string' ? exp.company : 'Company';
                              const period =
                                typeof exp.period === 'string'
                                  ? exp.period
                                  : typeof exp.duration === 'string'
                                    ? exp.duration
                                    : typeof exp.startDate === 'string' &&
                                        typeof exp.endDate === 'string'
                                      ? `${exp.startDate} - ${exp.endDate}`
                                      : '';

                              return (
                                <div key={idx} className="flex gap-4">
                                  <div className="flex flex-col items-center">
                                    <div className="w-3 h-3 bg-primary rounded-full" />
                                    {idx < profile.experience_timeline.length - 1 && (
                                      <div className="w-0.5 h-full bg-border mt-1" />
                                    )}
                                  </div>
                                  <div className="flex-1 pb-6">
                                    <p className="text-sm font-semibold text-foreground">{role}</p>
                                    <p className="text-sm text-muted-foreground">{company}</p>
                                    {period && (
                                      <p className="text-xs text-muted-foreground mt-1">{period}</p>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                    {/* Education */}
                    {education && (
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-4">
                          Education & Qualifications
                        </h3>
                        <div className="p-4 bg-accent rounded-lg">
                          <div className="flex items-start gap-3">
                            <svg
                              className="w-6 h-6 text-primary mt-0.5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 14l9-5-9-5-9 5 9 5z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
                              />
                            </svg>
                            <div>
                              <p className="text-sm font-medium text-foreground">{education}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {experience} of experience
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Certifications */}
                    {profile.certifications &&
                      Array.isArray(profile.certifications) &&
                      profile.certifications.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold text-foreground mb-4">
                            Certifications
                          </h3>
                          <div className="space-y-2">
                            {profile.certifications.map((cert, idx) => {
                              // Convert cert to string if it's an object
                              const certText =
                                typeof cert === 'string'
                                  ? cert
                                  : typeof cert === 'object' && cert !== null && cert.name
                                    ? cert.name
                                    : 'Certification';

                              return (
                                <div
                                  key={idx}
                                  className="flex items-center gap-3 p-3 bg-accent rounded-lg"
                                >
                                  <svg
                                    className="w-5 h-5 text-ring"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                                    />
                                  </svg>
                                  <span className="text-sm font-medium text-foreground">
                                    {certText}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                    {/* Actions */}
                    <div className="pt-6 border-t border-border">
                      <Button
                        variant="primary"
                        size="lg"
                        className="w-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleScheduleInterview(e, selectedCandidate);
                        }}
                      >
                        Schedule Interview
                      </Button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            );
          })()}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmation.show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={cancelDelete}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-card border border-border rounded-2xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Warning Icon */}
              <div className="flex items-center justify-center w-16 h-16 bg-destructive/10 rounded-full mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-destructive"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>

              {/* Modal Content */}
              <h3 className="text-2xl font-bold text-foreground text-center mb-2">Delete Batch?</h3>
              <p className="text-muted-foreground text-center mb-6">
                Are you sure you want to delete{' '}
                <span className="font-semibold text-foreground">
                  "{deleteConfirmation.batchName}"
                </span>
                ?
                <br />
                <span className="text-sm text-destructive">
                  This will permanently delete the batch and all associated candidates from the
                  database.
                </span>
              </p>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={cancelDelete}
                  className="flex-1 px-4 py-3 bg-secondary text-secondary-foreground rounded-xl hover:bg-secondary/80 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-3 bg-destructive text-destructive-foreground rounded-xl hover:bg-destructive/90 transition-colors font-medium"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
