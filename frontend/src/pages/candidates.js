import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Search,
  Filter,
  Users,
  Star,
  TrendingUp,
  Briefcase,
  Upload,
  X,
  FileText,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { useRouter } from 'next/router';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { createAvatar } from '@dicebear/core';
import { lorelei } from '@dicebear/collection';
import api from '@/utils/api';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';

export default function CandidatesPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { position } = router.query; // Get position ID from query params
  const [candidates, setCandidates] = useState([]);
  const [filteredCandidates, setFilteredCandidates] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStage, setSelectedStage] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Fetch candidates from API
  const fetchCandidates = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/candidates');

      if (response.data.success) {
        setCandidates(response.data.candidates || []);
      }
    } catch (error) {
      console.error('Error fetching candidates:', error);
      toast.error('Failed to load candidates');
      setCandidates([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // Fetch candidates only when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchCandidates();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    let filtered = candidates;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (candidate) =>
          candidate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          candidate.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          candidate.location.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    // Filter by stage
    if (selectedStage !== 'all') {
      filtered = filtered.filter((candidate) => candidate.current_stage === selectedStage);
    }

    setFilteredCandidates(filtered);
  }, [searchQuery, selectedStage, candidates]);

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-600 dark:text-green-400';
    if (score >= 80) return 'text-blue-600 dark:text-blue-400';
    if (score >= 70) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getStageLabel = (stage) => {
    const labels = {
      screening: 'Screening',
      technical: 'Technical',
      cultural: 'Cultural Fit',
      final: 'Final Round',
    };
    return labels[stage] || stage;
  };

  // Generate artistic avatar using DiceBear
  const getAvatarSvg = (name) => {
    const avatar = createAvatar(lorelei, {
      seed: name,
      backgroundColor: ['transparent'],
    });
    return avatar.toDataUri();
  };

  // Upload CV handlers
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const pdfFiles = files.filter((file) => file.type === 'application/pdf');

    if (pdfFiles.length !== files.length) {
      toast.error('Only PDF files are allowed');
    }

    setSelectedFiles((prev) => [...prev, ...pdfFiles]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const pdfFiles = files.filter((file) => file.type === 'application/pdf');

    if (pdfFiles.length !== files.length) {
      toast.error('Only PDF files are allowed');
    }

    setSelectedFiles((prev) => [...prev, ...pdfFiles]);
  };

  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select at least one CV');
      return;
    }

    setIsUploading(true);
    setUploadResults(null);

    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append('cvs', file);
      });

      const response = await api.post('/candidates/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setUploadResults(response.data);
        toast.success(
          `Successfully processed ${response.data.successful}/${response.data.total} CVs`
        );

        // Refresh candidates list after successful upload
        await fetchCandidates();

        // Close modal after showing results briefly
        setTimeout(() => {
          setShowUploadModal(false);
          setSelectedFiles([]);
          setUploadResults(null);
        }, 2000);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.message || 'Failed to upload CVs');
    } finally {
      setIsUploading(false);
    }
  };

  const closeModal = () => {
    if (!isUploading) {
      setShowUploadModal(false);
      setSelectedFiles([]);
      setUploadResults(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Back Button */}
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Home</span>
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Candidates</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {filteredCandidates.length} candidate{filteredCandidates.length !== 1 ? 's' : ''}{' '}
                {position ? 'for this position' : 'in total'}
              </p>
            </div>
            <Button
              onClick={() => setShowUploadModal(true)}
              variant="primary"
              className="flex items-center gap-2"
            >
              <Upload className="w-5 h-5" />
              Upload CV
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <Input
                placeholder="Search candidates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="w-5 h-5" />}
              />
            </div>

            {/* Stage Filter */}
            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="px-4 py-2 bg-background text-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Stages</option>
              <option value="screening">Screening</option>
              <option value="technical">Technical</option>
              <option value="cultural">Cultural Fit</option>
              <option value="final">Final Round</option>
            </select>
          </div>
        </div>
      </div>

      {/* Candidates List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredCandidates.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No candidates found</p>
          </div>
        ) : (
          // List View
          <div className="space-y-4">
            {filteredCandidates.map((candidate, index) => (
              <motion.div
                key={candidate.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => router.push(`/candidates/${candidate.id}`)}
                className="bg-card border border-border rounded-xl p-6 hover:shadow-lg hover:border-primary/50 transition-all duration-200 cursor-pointer"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Candidate Info */}
                  <div className="flex-1">
                    <div className="flex items-start gap-4">
                      {/* Avatar - DiceBear Artistic */}
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-border bg-background flex-shrink-0">
                        <img
                          src={getAvatarSvg(candidate.name)}
                          alt={candidate.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold text-foreground">
                            {candidate.name}
                          </h3>
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-pastel text-blue-800 dark:bg-blue-600 dark:text-blue-100">
                            {getStageLabel(candidate.current_stage)}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-2">
                          <span>{candidate.email}</span>
                          <span>•</span>
                          <span>{candidate.phone}</span>
                          <span>•</span>
                          <span>{candidate.location}</span>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Briefcase className="w-4 h-4" />
                            <span>
                              {candidate.current_title} at {candidate.current_company}
                            </span>
                          </div>
                          <span>•</span>
                          <span>{candidate.experience}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Upload CV Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="fixed inset-0 bg-black/50 z-50"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div
                className="bg-card border border-border rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">Upload CV(s)</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Upload candidate resumes to automatically create profiles
                    </p>
                  </div>
                  <button
                    onClick={closeModal}
                    disabled={isUploading}
                    className="p-2 hover:bg-muted rounded-lg transition-colors disabled:opacity-50"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                  {isUploading && !uploadResults ? (
                    /* Loading State */
                    <div className="flex flex-col items-center justify-center py-12">
                      <div className="relative mb-6">
                        <div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                      </div>
                      <h3 className="text-xl font-bold text-foreground mb-2">
                        Processing CVs...
                      </h3>
                      <p className="text-muted-foreground text-center max-w-md">
                        Extracting candidate information using AI. This may take a minute.
                      </p>
                      <div className="mt-6 w-full max-w-md">
                        <div className="bg-muted rounded-full h-2 overflow-hidden">
                          <div className="bg-primary h-full w-2/3 animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                  ) : !uploadResults ? (
                    <>
                      {/* Drag and Drop Area */}
                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
                          isDragging
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50 hover:bg-muted/50'
                        }`}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          multiple
                          accept=".pdf"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                        <Upload className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                        <p className="text-lg font-medium text-foreground mb-2">
                          {isDragging ? 'Drop files here' : 'Drag and drop CV files'}
                        </p>
                        <p className="text-sm text-muted-foreground mb-4">
                          or click to browse (PDF only, max 10 files)
                        </p>
                      </div>

                      {/* Selected Files List */}
                      {selectedFiles.length > 0 && (
                        <div className="mt-6">
                          <h3 className="text-sm font-semibold text-foreground mb-3">
                            Selected Files ({selectedFiles.length})
                          </h3>
                          <div className="space-y-2">
                            {selectedFiles.map((file, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between p-3 bg-muted rounded-lg"
                              >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <FileText className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate">
                                      {file.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {(file.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => removeFile(index)}
                                  disabled={isUploading}
                                  className="p-1 hover:bg-destructive/10 rounded transition-colors disabled:opacity-50"
                                >
                                  <X className="w-4 h-4 text-destructive" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    /* Upload Results */
                    <div className="space-y-4">
                      <div className="text-center mb-6">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                          <CheckCircle className="w-8 h-8 text-primary" />
                        </div>
                        <h3 className="text-xl font-bold text-foreground mb-2">
                          Processing Complete!
                        </h3>
                        <p className="text-muted-foreground">
                          {uploadResults.successful} of {uploadResults.total} CVs processed
                          successfully
                        </p>
                      </div>

                      {/* Results List */}
                      <div className="space-y-2">
                        {uploadResults.results?.map((result, index) => (
                          <div
                            key={index}
                            className={`flex items-start gap-3 p-3 rounded-lg ${
                              result.success ? 'bg-green-50 dark:bg-green-950/20' : 'bg-red-50 dark:bg-red-950/20'
                            }`}
                          >
                            {result.success ? (
                              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">
                                {result.fileName}
                              </p>
                              <p className={`text-xs ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                                {result.message}
                              </p>
                              {result.candidate && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {result.candidate.name} - {result.action}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
                  {!uploadResults ? (
                    <>
                      <Button onClick={closeModal} variant="secondary" disabled={isUploading}>
                        Cancel
                      </Button>
                      <Button
                        onClick={handleUpload}
                        variant="primary"
                        disabled={selectedFiles.length === 0 || isUploading}
                        className="min-w-[120px]"
                      >
                        {isUploading ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Processing...
                          </div>
                        ) : (
                          `Upload ${selectedFiles.length} CV${selectedFiles.length !== 1 ? 's' : ''}`
                        )}
                      </Button>
                    </>
                  ) : (
                    <Button onClick={closeModal} variant="primary">
                      Done
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
