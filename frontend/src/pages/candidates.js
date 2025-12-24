import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Search,
  Briefcase,
  Upload,
  X,
  FileText,
  CheckCircle,
  XCircle,
  GraduationCap,
  Calendar,
  Send,
  UserCheck,
} from 'lucide-react';
import { useRouter } from 'next/router';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { createAvatar } from '@dicebear/core';
import { lorelei } from '@dicebear/collection';
import api from '@/utils/api';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';

// Helper to check if a value is valid (not null, "null", "not available", etc.)
const isValidValue = (value) => {
  if (!value) return false;
  const invalidValues = [
    'null',
    'not available',
    'n/a',
    'na',
    'none',
    'not found',
    'not mentioned',
    '',
  ];
  return !invalidValues.includes(value.toString().toLowerCase().trim());
};

// Helper to format email for display (hide placeholder emails)
const formatEmail = (email) => {
  if (!email) return null;
  if (email.includes('@noemail.placeholder')) return 'No email provided';
  if (!isValidValue(email)) return null;
  return email;
};

export default function CandidatesPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { position } = router.query; // Get position ID from query params
  const [candidates, setCandidates] = useState([]);
  const [filteredCandidates, setFilteredCandidates] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Availability modal state
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [availabilityForm, setAvailabilityForm] = useState({
    position: '',
  });
  const [isSendingAvailability, setIsSendingAvailability] = useState(false);

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

    // Filter by search query (name, email, location, company, title, and skills)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((candidate) => {
        // Basic field search
        const basicMatch =
          candidate.name?.toLowerCase().includes(query) ||
          candidate.email?.toLowerCase().includes(query) ||
          candidate.location?.toLowerCase().includes(query) ||
          candidate.current_company?.toLowerCase().includes(query) ||
          candidate.current_title?.toLowerCase().includes(query);

        // Skills/keywords search
        const skillsMatch = candidate.primary_skills?.some((skill) =>
          skill.toLowerCase().includes(query),
        );

        // Education search
        const educationMatch = candidate.education?.some(
          (edu) =>
            edu.degree?.toLowerCase().includes(query) ||
            edu.institution?.toLowerCase().includes(query) ||
            edu.field?.toLowerCase().includes(query),
        );

        return basicMatch || skillsMatch || educationMatch;
      });
    }

    setFilteredCandidates(filtered);
  }, [searchQuery, candidates]);

  // Generate artistic avatar using DiceBear
  const getAvatarSvg = (name) => {
    const avatar = createAvatar(lorelei, {
      seed: name,
      backgroundColor: ['transparent'],
    });
    return avatar.toDataUri();
  };

  // Allowed MIME types for CV uploads
  const ALLOWED_CV_TYPES = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/msword', // .doc
  ];

  // Upload CV handlers
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter((file) => ALLOWED_CV_TYPES.includes(file.type));

    if (validFiles.length !== files.length) {
      toast.error('Only PDF, DOCX, and DOC files are allowed');
    }

    setSelectedFiles((prev) => [...prev, ...validFiles]);
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
    const validFiles = files.filter((file) => ALLOWED_CV_TYPES.includes(file.type));

    if (validFiles.length !== files.length) {
      toast.error('Only PDF, DOCX, and DOC files are allowed');
    }

    setSelectedFiles((prev) => [...prev, ...validFiles]);
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
        timeout: 300000, // 5 minutes timeout for bulk CV processing (PDF extraction + AI analysis + matching)
      });

      if (response.data.success) {
        setUploadResults(response.data);
        toast.success(
          `Successfully processed ${response.data.successful}/${response.data.total} CVs`,
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

  // Check Availability handlers
  const openAvailabilityModal = (candidate, e) => {
    e.stopPropagation(); // Prevent card click
    setSelectedCandidate(candidate);
    setAvailabilityForm({
      position: candidate.current_title || '',
    });
    setShowAvailabilityModal(true);
  };

  const closeAvailabilityModal = () => {
    if (!isSendingAvailability) {
      setShowAvailabilityModal(false);
      setSelectedCandidate(null);
      setAvailabilityForm({ position: '' });
    }
  };

  const handleSendAvailabilityRequest = async () => {
    if (!availabilityForm.position) {
      toast.error('Please enter a position');
      return;
    }

    setIsSendingAvailability(true);
    try {
      const response = await api.post('/interview-coordinator/request-availability', {
        candidateId: selectedCandidate.id,
        candidateName: selectedCandidate.name,
        candidateEmail: selectedCandidate.email,
        position: availabilityForm.position,
      });

      if (response.data.success) {
        toast.success('Availability request sent successfully!');
        closeAvailabilityModal();
      }
    } catch (error) {
      console.error('Error sending availability request:', error);
      toast.error(error.response?.data?.message || 'Failed to send availability request');
    } finally {
      setIsSendingAvailability(false);
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

      {/* Search */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Input
            placeholder="Search by name, email, skills (python, scrum, etc.)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-5 h-5" />}
          />
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
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-xl font-semibold text-foreground">
                            {candidate.name}
                          </h3>
                          {candidate.is_hired && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/20">
                              <UserCheck className="w-3 h-3" />
                              Employee
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mb-2">
                          {formatEmail(candidate.email) && (
                            <>
                              <span>{formatEmail(candidate.email)}</span>
                              {(isValidValue(candidate.phone) ||
                                isValidValue(candidate.location)) && <span>•</span>}
                            </>
                          )}
                          {isValidValue(candidate.phone) && (
                            <>
                              <span>{candidate.phone}</span>
                              {isValidValue(candidate.location) && <span>•</span>}
                            </>
                          )}
                          {isValidValue(candidate.location) && <span>{candidate.location}</span>}
                          {!formatEmail(candidate.email) &&
                            !isValidValue(candidate.phone) &&
                            !isValidValue(candidate.location) && (
                              <span className="text-muted-foreground/60 italic">
                                Contact info not provided
                              </span>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          {(isValidValue(candidate.current_title) ||
                            isValidValue(candidate.current_company)) && (
                            <>
                              <div className="flex items-center gap-1">
                                <Briefcase className="w-4 h-4" />
                                <span>
                                  {isValidValue(candidate.current_title)
                                    ? candidate.current_title
                                    : 'Role not specified'}
                                  {isValidValue(candidate.current_company) &&
                                    ` at ${candidate.current_company}`}
                                </span>
                              </div>
                              {isValidValue(candidate.experience) && <span>•</span>}
                            </>
                          )}
                          {isValidValue(candidate.experience) && (
                            <span>{candidate.experience}</span>
                          )}
                        </div>

                        {candidate.education &&
                          Array.isArray(candidate.education) &&
                          candidate.education.length > 0 && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
                              <GraduationCap className="w-4 h-4" />
                              <span>
                                {candidate.education[0].degree}
                                {candidate.education[0].institution &&
                                  ` - ${candidate.education[0].institution}`}
                              </span>
                            </div>
                          )}
                        {candidate.created_by_user && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                            <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                              Added by: {candidate.created_by_user.name}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Check Availability Button */}
                  <div className="flex-shrink-0 mt-4 lg:mt-0">
                    <Button
                      onClick={(e) => openAvailabilityModal(candidate, e)}
                      variant="secondary"
                      size="sm"
                      className="flex items-center gap-2 whitespace-nowrap"
                    >
                      <Calendar className="w-4 h-4" />
                      Check Availability
                    </Button>
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
                      <h3 className="text-xl font-bold text-foreground mb-2">Processing CVs...</h3>
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
                          accept=".pdf,.docx,.doc,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                        <Upload className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                        <p className="text-lg font-medium text-foreground mb-2">
                          {isDragging ? 'Drop files here' : 'Drag and drop CV files'}
                        </p>
                        <p className="text-sm text-muted-foreground mb-4">
                          or click to browse (PDF, DOCX, DOC - max 10 files)
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
                              result.success
                                ? 'bg-green-50 dark:bg-green-950/20'
                                : 'bg-red-50 dark:bg-red-950/20'
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
                              <p
                                className={`text-xs ${result.success ? 'text-green-600' : 'text-red-600'}`}
                              >
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

      {/* Check Availability Modal */}
      <AnimatePresence>
        {showAvailabilityModal && selectedCandidate && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeAvailabilityModal}
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
                className="bg-card border border-border rounded-2xl shadow-xl max-w-lg w-full overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Check Availability</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Send availability request to candidate
                    </p>
                  </div>
                  <button
                    onClick={closeAvailabilityModal}
                    disabled={isSendingAvailability}
                    className="p-2 hover:bg-muted rounded-lg transition-colors disabled:opacity-50"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                  {/* Candidate Info */}
                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-border bg-background">
                        <img
                          src={getAvatarSvg(selectedCandidate.name)}
                          alt={selectedCandidate.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{selectedCandidate.name}</p>
                        <p className="text-sm text-muted-foreground">{selectedCandidate.email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Position Input */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Position <span className="text-destructive">*</span>
                    </label>
                    <Input
                      placeholder="e.g., Senior Software Engineer"
                      value={availabilityForm.position}
                      onChange={(e) =>
                        setAvailabilityForm((prev) => ({ ...prev, position: e.target.value }))
                      }
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
                  <Button
                    onClick={closeAvailabilityModal}
                    variant="secondary"
                    disabled={isSendingAvailability}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSendAvailabilityRequest}
                    variant="primary"
                    disabled={!availabilityForm.position || isSendingAvailability}
                    className="flex items-center gap-2"
                  >
                    {isSendingAvailability ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Send Request
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
