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
    return '/';
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
  const [processingProgress, setProcessingProgress] = useState(null);

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

        // Sort candidates by rank (ASC - lower rank number = better candidate)
        // Fallback to overall_score if rank is not available
        if (batchData.candidates && Array.isArray(batchData.candidates)) {
          batchData.candidates.sort((a, b) => {
            // Use rank from ChatGPT if available (lower is better)
            const rankA = parseFloat(a.overall_score) || parseFloat(a.rank) || 999;
            const rankB = parseFloat(b.overall_score) || parseFloat(b.rank) || 999;

            // If ranks are equal, sort by ID for consistency
            if (rankA === rankB) {
              return (a.id || '').localeCompare(b.id || '');
            }

            return rankA - rankB; // Ascending order (rank 1 is best)
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

  const handleViewFullProfile = async (e, candidate) => {
    e.stopPropagation();

    try {
      // Fetch candidate profile by email
      const response = await api.get(`/api/candidates?search=${encodeURIComponent(candidate.email)}&limit=1`);

      if (response.data.success && response.data.candidates && response.data.candidates.length > 0) {
        // Navigate to candidate profile page
        const candidateProfile = response.data.candidates[0];
        router.push(`/candidates/${candidateProfile.id}`);
      } else {
        // No profile found, show modal as fallback
        toast.error('Candidate profile not found. This candidate may not have been processed yet.');
        setSelectedCandidate(candidate);
      }
    } catch (error) {
      console.error('Error fetching candidate profile:', error);
      toast.error('Failed to load candidate profile');
    }
  };

  const handleScheduleInterview = (e, candidate) => {
    e.stopPropagation(); // Prevent candidate detail expansion

    // Navigate to interviews page with pre-filled candidate data
    router.push({
      pathname: '/interviews',
      query: {
        candidateName: candidate.name,
        candidateEmail: candidate.email,
        position: selectedBatch?.name || '',
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

  const handleRemoveCvFile = (indexToRemove) => {
    setCvFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
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
      setProcessingProgress({ step: 1, message: 'Creating batch...' });

      // Create batch first
      const batchResponse = await api.post('/cv-intelligence', {
        name: batchName.trim(),
      });

      if (!batchResponse.data.success) {
        throw new Error('Failed to create batch');
      }

      const batchId = batchResponse.data.data.batchId;

      setProcessingProgress({ step: 2, message: 'Uploading files...' });

      // Upload and process files
      const formData = new FormData();
      formData.append('jdFile', jdFile);
      cvFiles.forEach((file) => {
        formData.append('cvFiles', file);
      });

      setProcessingProgress({ step: 3, message: 'Analyzing CVs with AI...' });

      const processResponse = await api.post(
        `/cv-intelligence/batch/${batchId}/process`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 600000, // 10 minutes
        },
      );

      if (processResponse.data.success) {
        setProcessingProgress({ step: 4, message: 'Processing complete!' });

        // Check if there were any errors during processing
        const responseData = processResponse.data.data;
        const hasErrors = responseData?.errors && responseData.errors.length > 0;

        if (hasErrors) {
          // Show warning for partial success
          const errorCount = responseData.errors.length;
          const successCount = responseData.processed || 0;
          toast.warning(
            `Batch processed with warnings: ${successCount} CVs processed, ${errorCount} failed. Check logs for details.`,
            { duration: 6000 },
          );
          console.error('CV Processing Errors:', responseData.errors);
        } else {
          toast.success('Batch processed successfully!');
        }

        // Reset form
        setBatchName('');
        setCvFiles([]);
        setJdFile(null);

        // Refresh batches and go back to list
        const refreshResponse = await api.get('/cv-intelligence/batches');
        setBatches(refreshResponse.data.data || []);
        setView('batches');
      } else {
        // Processing failed
        const errorData = processResponse.data.data;
        const errorMessage = processResponse.data.message || 'Failed to process batch';

        // Show detailed error if available
        if (errorData?.errors && errorData.errors.length > 0) {
          console.error('CV Processing Errors:', errorData.errors);
          const errorSummary = errorData.errors.map((e) => `${e.file}: ${e.error}`).join('\n');
          toast.error(
            `${errorMessage}\n\nErrors:\n${errorSummary.substring(0, 200)}${errorSummary.length > 200 ? '...' : ''}`,
            { duration: 8000 },
          );
        } else {
          toast.error(errorMessage);
        }

        throw new Error(errorMessage);
      }
    } catch (error) {
      // Handle network or other errors
      const errorMessage =
        error.response?.data?.message || error.message || 'Failed to process batch';
      const errorData = error.response?.data?.data;

      if (errorData?.errors && errorData.errors.length > 0) {
        console.error('CV Processing Errors:', errorData.errors);
        toast.error(`${errorMessage} - Check console for detailed errors`, { duration: 6000 });
      } else {
        toast.error(errorMessage);
      }

      setProcessingProgress(null);
    } finally {
      setIsProcessing(false);
      setTimeout(() => setProcessingProgress(null), 2000);
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
              Back to Home
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
                      onClick={() =>
                        (batch.status === 'completed' ||
                          batch.status === 'completed_with_warnings') &&
                        handleBatchClick(batch)
                      }
                      className={`bg-card border border-border rounded-2xl p-6 ${
                        batch.status === 'completed' || batch.status === 'completed_with_warnings'
                          ? 'cursor-pointer hover:shadow-lg transition-shadow'
                          : 'opacity-60 cursor-not-allowed'
                      }`}
                      title={
                        batch.status === 'failed'
                          ? 'This batch failed to process. Check logs for details.'
                          : ''
                      }
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
                            className={`px-3 py-1 text-xs font-medium rounded-full ${
                              batch.status === 'completed'
                                ? 'bg-ring/10 text-ring capitalize'
                                : batch.status === 'completed_with_warnings'
                                  ? 'bg-yellow-500/10 text-yellow-600'
                                  : batch.status === 'processing'
                                    ? 'bg-primary/10 text-primary capitalize'
                                    : 'bg-destructive/10 text-destructive capitalize'
                            }`}
                          >
                            {batch.status === 'completed_with_warnings'
                              ? 'Completed (Warnings)'
                              : batch.status}
                          </span>
                          <button
                            onClick={(e) => handleDeleteBatch(e, batch.id, batch.name)}
                            className="p-2 hover:bg-destructive/10 rounded-lg transition-colors"
                            title="Delete batch"
                          >
                            <svg
                              className="w-4 h-4 text-red-500"
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
                                {batch.candidates[0].name || 'Unknown'}
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
                      The batch name should describe the role you&apos;re hiring for
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
                      <label
                        htmlFor="cv-files"
                        className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:opacity-90 transition-all cursor-pointer"
                      >
                        Select CV Files
                      </label>
                      {cvFiles.length > 0 && (
                        <p className="text-sm text-primary mt-2">
                          ✓ {cvFiles.length} file{cvFiles.length > 1 ? 's' : ''} selected
                        </p>
                      )}
                    </div>

                    {/* Selected CV Files List */}
                    {cvFiles.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <p className="text-sm font-medium text-foreground mb-2">Selected Files:</p>
                        {cvFiles.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between bg-secondary border border-border rounded-lg p-3"
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <svg
                                className="w-4 h-4 text-primary flex-shrink-0"
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
                              <span className="text-sm text-foreground truncate">{file.name}</span>
                              <span className="text-xs text-muted-foreground flex-shrink-0">
                                ({(file.size / 1024 / 1024).toFixed(2)} MB)
                              </span>
                            </div>
                            <button
                              onClick={() => handleRemoveCvFile(index)}
                              className="ml-2 p-1 hover:bg-destructive/10 rounded transition-colors flex-shrink-0"
                              title="Remove file"
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
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
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
                      <label
                        htmlFor="jd-file"
                        className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-foreground bg-secondary border border-border rounded-lg hover:bg-muted transition-all cursor-pointer"
                      >
                        Select JD File
                      </label>
                      {jdFile && <p className="text-sm text-primary mt-2">✓ {jdFile.name}</p>}
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

                {/* Processing Progress Indicator */}
                {processingProgress && (
                  <div className="mt-6 bg-card border border-border rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-foreground">Processing Status</h3>
                      <span className="text-sm text-primary font-medium">
                        Step {processingProgress.step} of 4
                      </span>
                    </div>
                    <div className="space-y-3">
                      {/* Progress Bar */}
                      <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-primary h-full transition-all duration-500 ease-out"
                          style={{ width: `${(processingProgress.step / 4) * 100}%` }}
                        />
                      </div>
                      {/* Status Message */}
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        <p className="text-sm text-foreground">{processingProgress.message}</p>
                      </div>
                      {/* Progress Steps */}
                      <div className="grid grid-cols-4 gap-2 mt-4">
                        {['Creating batch', 'Uploading files', 'Analyzing CVs', 'Complete'].map(
                          (label, index) => (
                            <div key={index} className="text-center">
                              <div
                                className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center mb-1 transition-colors ${
                                  processingProgress.step > index + 1
                                    ? 'bg-primary text-white'
                                    : processingProgress.step === index + 1
                                      ? 'bg-primary/20 text-primary'
                                      : 'bg-secondary text-muted-foreground'
                                }`}
                              >
                                {processingProgress.step > index + 1 ? (
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2.5}
                                      d="M5 13l4 4L19 7"
                                    />
                                  </svg>
                                ) : (
                                  <span className="text-xs font-semibold">{index + 1}</span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">{label}</p>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  </div>
                )}
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
                      onClick={(e) => handleViewFullProfile(e, candidate)}
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
                          onClick={(e) => handleViewFullProfile(e, candidate)}
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

            // ONLY PARSE - ChatGPT does ALL the analysis
            // Matched skills = ChatGPT-generated matched_skills (NO FALLBACK)
            let matchedSkills = [];
            const matchedSkillsData = selectedCandidate.matched_skills || [];
            if (Array.isArray(matchedSkillsData)) {
              matchedSkills = matchedSkillsData;
            } else if (typeof matchedSkillsData === 'string') {
              try {
                const parsed = JSON.parse(matchedSkillsData);
                matchedSkills = Array.isArray(parsed) ? parsed : [];
              } catch (e) {
                console.warn('Failed to parse matched_skills:', e);
                matchedSkills = [];
              }
            }

            // Missing skills = ChatGPT-generated missing_skills (NO FALLBACK)
            let missingSkills = [];
            const missingSkillsData = selectedCandidate.missing_skills || [];
            if (Array.isArray(missingSkillsData)) {
              missingSkills = missingSkillsData;
            } else if (typeof missingSkillsData === 'string') {
              try {
                const parsed = JSON.parse(missingSkillsData);
                missingSkills = Array.isArray(parsed) ? parsed : [];
              } catch (e) {
                console.warn('Failed to parse missing_skills:', e);
                missingSkills = [];
              }
            }

            // Additional skills = ChatGPT-generated additional_skills (NO FALLBACK)
            let additionalSkills = [];
            const additionalSkillsData = selectedCandidate.additional_skills || [];
            if (Array.isArray(additionalSkillsData)) {
              additionalSkills = additionalSkillsData;
            } else if (typeof additionalSkillsData === 'string') {
              try {
                const parsed = JSON.parse(additionalSkillsData);
                additionalSkills = Array.isArray(parsed) ? parsed : [];
              } catch (e) {
                console.warn('Failed to parse additional_skills:', e);
                additionalSkills = [];
              }
            }

            console.log('📊 Skills Analysis (100% ChatGPT):');
            console.log('   ✅ Matched:', matchedSkills);
            console.log('   ❌ Missing:', missingSkills);
            console.log('   ➕ Additional:', additionalSkills);

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
              typeof profile.summary === 'string' && profile.summary.trim()
                ? profile.summary
                : typeof profile.professional_assessment === 'string' &&
                    profile.professional_assessment.trim()
                  ? profile.professional_assessment
                  : typeof profile.assessment === 'string' && profile.assessment.trim()
                    ? profile.assessment
                    : typeof profile.bio === 'string' && profile.bio.trim()
                      ? profile.bio
                      : 'No professional assessment available in database';

            // Safely extract education data
            const educationData = Array.isArray(profile.education)
              ? profile.education
              : typeof profile.education === 'string' && profile.education
                ? JSON.parse(profile.education)
                : [];

            // Safely extract experience timeline
            const experienceTimeline = Array.isArray(profile.experience)
              ? profile.experience
              : Array.isArray(profile.experience_timeline)
                ? profile.experience_timeline
                : typeof profile.experience === 'string' && profile.experience
                  ? JSON.parse(profile.experience)
                  : [];

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

                    {/* Skills Gap Analysis */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-foreground">
                          Skills Gap Analysis
                        </h3>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="px-3 py-1 bg-green-500/10 text-green-400 rounded-full font-medium border border-green-500/20">
                            {matchedSkills.length} Matched
                          </span>
                          <span className="px-3 py-1 bg-red-500/10 text-red-400 rounded-full font-medium border border-red-500/20">
                            {missingSkills.length} Missing
                          </span>
                          <span className="px-3 py-1 bg-yellow-500/10 text-yellow-400 rounded-full font-medium border border-yellow-500/20">
                            {additionalSkills.length} Additional
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {/* Matched Skills */}
                        <div className="bg-card border border-border rounded-lg p-4 hover:border-green-500/30 transition-colors">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                                <svg
                                  className="w-4 h-4 text-green-500"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                              </div>
                              <div>
                                <h4 className="text-sm font-semibold text-foreground">
                                  Matched Skills
                                </h4>
                                <p className="text-xs text-muted-foreground">Present in both</p>
                              </div>
                            </div>
                            <span className="text-lg font-bold text-green-500">
                              {matchedSkills.length}
                            </span>
                          </div>
                          <div className="space-y-2">
                            {matchedSkills.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5">
                                {matchedSkills.map((skill, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2.5 py-1 text-xs font-medium bg-green-500/10 text-green-400 rounded border border-green-500/20"
                                  >
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground italic">
                                No matched skills found
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Missing Skills */}
                        <div className="bg-card border border-border rounded-lg p-4 hover:border-red-500/30 transition-colors">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                                <svg
                                  className="w-4 h-4 text-red-500"
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
                              <div>
                                <h4 className="text-sm font-semibold text-foreground">
                                  Missing Skills
                                </h4>
                                <p className="text-xs text-muted-foreground">
                                  Required but not found
                                </p>
                              </div>
                            </div>
                            <span className="text-lg font-bold text-red-500">
                              {missingSkills.length}
                            </span>
                          </div>
                          <div className="space-y-2">
                            {missingSkills.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5">
                                {missingSkills.map((skill, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2.5 py-1 text-xs font-medium bg-red-500/10 text-red-400 rounded border border-red-500/20"
                                  >
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-green-400 italic">
                                All required skills present
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Additional Skills */}
                        <div className="bg-card border border-border rounded-lg p-4 hover:border-yellow-500/30 transition-colors">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                                <svg
                                  className="w-4 h-4 text-yellow-500"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 4v16m8-8H4"
                                  />
                                </svg>
                              </div>
                              <div>
                                <h4 className="text-sm font-semibold text-foreground">
                                  Additional Skills
                                </h4>
                                <p className="text-xs text-muted-foreground">Not required by JD</p>
                              </div>
                            </div>
                            <span className="text-lg font-bold text-yellow-500">
                              {additionalSkills.length}
                            </span>
                          </div>
                          <div className="space-y-2">
                            {additionalSkills.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5">
                                {additionalSkills.map((skill, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2.5 py-1 text-xs font-medium bg-yellow-500/10 text-yellow-400 rounded border border-yellow-500/20"
                                  >
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground italic">
                                No additional skills beyond requirements
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Work Experience Section */}
                    {experienceTimeline && experienceTimeline.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-4">
                          Work Experience
                        </h3>
                        <div className="space-y-4">
                          {experienceTimeline.map((exp, idx) => {
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

                            // Extract achievements
                            const achievements = Array.isArray(exp.achievements)
                              ? exp.achievements
                              : [];

                            return (
                              <div
                                key={idx}
                                className="bg-accent rounded-lg p-4 border border-border"
                              >
                                <div className="flex gap-4">
                                  <div className="flex flex-col items-center">
                                    <div className="w-3 h-3 bg-primary rounded-full flex-shrink-0 mt-1" />
                                    {idx < experienceTimeline.length - 1 && (
                                      <div className="w-0.5 flex-1 bg-border mt-2" />
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-base font-semibold text-foreground">
                                      {role}
                                    </p>
                                    <p className="text-sm text-muted-foreground">{company}</p>
                                    {period && (
                                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                        <svg
                                          className="w-3 h-3"
                                          fill="none"
                                          viewBox="0 0 24 24"
                                          stroke="currentColor"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                          />
                                        </svg>
                                        {period}
                                      </p>
                                    )}
                                    {achievements.length > 0 && (
                                      <ul className="mt-2 space-y-1">
                                        {achievements.slice(0, 3).map((achievement, i) => (
                                          <li
                                            key={i}
                                            className="text-xs text-foreground flex items-start gap-2"
                                          >
                                            <span className="text-primary mt-0.5">•</span>
                                            <span>{achievement}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Education Section */}
                    {educationData && educationData.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-4">Education</h3>
                        <div className="space-y-3">
                          {educationData.map((edu, idx) => {
                            // Ensure edu is an object
                            if (typeof edu !== 'object' || edu === null) return null;

                            const degree = typeof edu.degree === 'string' ? edu.degree : 'Degree';
                            const institution =
                              typeof edu.institution === 'string' ? edu.institution : 'Institution';
                            const field = typeof edu.field === 'string' ? edu.field : '';
                            const year = typeof edu.year === 'string' ? edu.year : '';

                            return (
                              <div
                                key={idx}
                                className="p-4 bg-accent rounded-lg border border-border"
                              >
                                <div className="flex items-start gap-3">
                                  <svg
                                    className="w-6 h-6 text-primary flex-shrink-0 mt-0.5"
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
                                  <div className="flex-1">
                                    <p className="text-sm font-semibold text-foreground">
                                      {degree}
                                      {field && ` in ${field}`}
                                    </p>
                                    <p className="text-sm text-muted-foreground">{institution}</p>
                                    {year && (
                                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                        <svg
                                          className="w-3 h-3"
                                          fill="none"
                                          viewBox="0 0 24 24"
                                          stroke="currentColor"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                          />
                                        </svg>
                                        {year}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
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
                  &quot;{deleteConfirmation.batchName}&quot;
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
