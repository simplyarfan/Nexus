import Link from 'next/link';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeIn, scaleIn } from '@/lib/motion';
import Button from '@/components/ui/Button';
import { tokenManager } from '../utils/api';

export default function CVIntelligencePage() {
  const [isDragging, setIsDragging] = useState(false);
  const [view, setView] = useState('batches');
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch CV batches from API
  useEffect(() => {
    const fetchBatches = async () => {
      try {
        setLoading(true);
        const token = tokenManager.getAccessToken();

        console.log('🔑 Token retrieved:', token ? `${token.substring(0, 20)}...` : 'null');

        if (!token) {
          console.error('No authentication token found');
          setBatches([]);
          setLoading(false);
          return;
        }

        console.log('📡 Fetching batches with headers:', {
          'Authorization': `Bearer ${token.substring(0, 20)}...`,
          'Content-Type': 'application/json',
        });

        const response = await fetch('http://localhost:5000/api/cv-intelligence/batches', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        console.log('📥 Response status:', response.status, response.statusText);

        if (response.ok) {
          const result = await response.json();
          console.log('CV Batches response:', result);
          setBatches(result.data || []);
        } else {
          const errorText = await response.text();
          console.error('Failed to fetch CV batches:', response.status, response.statusText, errorText);
          setBatches([]);
        }
      } catch (error) {
        console.error('Error fetching CV batches:', error);
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

  const handleBatchClick = (batch) => {
    setSelectedBatch(batch);
    setView('candidates');
  };

  const handleCandidateClick = (candidate) => {
    setSelectedCandidate(candidate);
  };

  const calculateSkillsGap = (candidate) => {
    const totalRequired = candidate.matchedSkills.length + candidate.missingSkills.length;
    return Math.round((candidate.matchedSkills.length / totalRequired) * 100);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="mb-4">
            <Link href="/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </Link>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">CV Intelligence (HR-01)</h1>
              <p className="text-muted-foreground mt-1">AI-powered CV screening and candidate matching</p>
            </div>
            <div className="flex gap-3">
              {view === 'candidates' && (
                <Button variant="ghost" size="lg" onClick={() => setView('batches')}>
                  <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to Batches
                </Button>
              )}
              <Button variant="primary" size="lg" onClick={() => setView('upload')}>
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
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
                  <svg className="w-16 h-16 text-muted-foreground mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="text-xl font-semibold text-foreground mb-2">No CV batches yet</h3>
                  <p className="text-muted-foreground mb-6">Upload CVs to start screening candidates with AI</p>
                  <Button variant="primary" size="lg">
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
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
                    onClick={() => batch.status === 'Completed' && handleBatchClick(batch)}
                    className={`bg-card border border-border rounded-2xl p-6 ${
                      batch.status === 'Completed' ? 'cursor-pointer hover:shadow-lg transition-shadow' : 'opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full ${
                          batch.status === 'Completed'
                            ? 'bg-ring/10 text-ring'
                            : batch.status === 'Processing'
                              ? 'bg-primary/10 text-primary'
                              : 'bg-destructive/10 text-destructive'
                        }`}
                      >
                        {batch.status}
                      </span>
                    </div>

                    <h3 className="text-lg font-semibold text-foreground mb-2">{batch.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{batch.position}</p>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">CVs Processed:</span>
                        <span className="font-medium text-foreground">{batch.cvCount}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Date Created:</span>
                        <span className="font-medium text-foreground">
                          {new Date(batch.dateCreated).toLocaleDateString()}
                        </span>
                      </div>
                      {batch.status === 'Completed' && batch.candidates.length > 0 && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Top Match:</span>
                          <span className="font-medium text-primary">{batch.candidates[0].score}%</span>
                        </div>
                      )}
                    </div>

                    {batch.status === 'Completed' && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <div className="flex items-center text-primary text-sm font-medium">
                          View Candidates
                          <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
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
                  <p className="text-muted-foreground">Upload CVs and job description to create a new screening batch</p>
                </div>

                <div className="space-y-6">
                  {/* 1. Batch Name */}
                  <div className="bg-card border border-border rounded-2xl p-6">
                    <label className="block text-sm font-medium text-foreground mb-2">Batch Name</label>
                    <input
                      type="text"
                      placeholder="e.g., Sr. AI Developer - December 2024"
                      className="w-full px-4 py-2 bg-secondary text-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <p className="text-xs text-muted-foreground mt-2">The batch name should describe the role you're hiring for</p>
                  </div>

                  {/* 2. CV Upload Area */}
                  <div className="bg-card border border-border rounded-2xl p-6">
                    <label className="block text-sm font-medium text-foreground mb-4">Upload CVs</label>
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
                          <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
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
                        className="hidden"
                      />
                      <label htmlFor="cv-files">
                        <Button variant="primary" size="md">
                          Select CV Files
                        </Button>
                      </label>
                    </div>
                  </div>

                  {/* 3. Job Description Upload Area */}
                  <div className="bg-card border border-border rounded-2xl p-6">
                    <label className="block text-sm font-medium text-foreground mb-4">Upload Job Description</label>
                    <div
                      className="border-2 border-dashed rounded-xl p-8 text-center transition-all border-border bg-secondary hover:border-primary/50 hover:bg-accent"
                    >
                      <div className="flex justify-center mb-4">
                        <div className="w-16 h-16 bg-ring/10 rounded-full flex items-center justify-center">
                          <svg className="w-8 h-8 text-ring" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
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
                        className="hidden"
                      />
                      <label htmlFor="jd-file">
                        <Button variant="secondary" size="md">
                          Select JD File
                        </Button>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-8">
                  <Button variant="primary" size="lg" className="flex-1">
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Start AI Processing
                  </Button>
                  <Button variant="secondary" size="lg" onClick={() => setView('batches')}>
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
                  <svg className="w-16 h-16 text-muted-foreground mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <h3 className="text-xl font-semibold text-foreground mb-2">No candidates processed yet</h3>
                  <p className="text-muted-foreground">Candidates will appear here once CV processing is complete</p>
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
                          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold">
                            {candidate.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-foreground">{candidate.name}</h3>
                            <p className="text-sm text-muted-foreground">{candidate.experience} of experience • {candidate.location}</p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-primary mb-1">{candidate.score}</div>
                        <p className="text-xs text-muted-foreground">Match Score</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Experience</p>
                        <p className="text-sm font-medium text-foreground">{candidate.experience}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Education</p>
                        <p className="text-sm font-medium text-foreground">{candidate.education}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Skills Match</p>
                        <p className="text-sm font-medium text-foreground">{calculateSkillsGap(candidate)}%</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-xs text-muted-foreground mb-2">Matched Skills ({candidate.matchedSkills.length})</p>
                      <div className="flex flex-wrap gap-2">
                        {candidate.matchedSkills.slice(0, 6).map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 text-xs font-medium bg-ring/10 text-ring rounded-full"
                          >
                            {skill}
                          </span>
                        ))}
                        {candidate.matchedSkills.length > 6 && (
                          <span className="px-3 py-1 text-xs font-medium bg-accent text-foreground rounded-full">
                            +{candidate.matchedSkills.length - 6} more
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button variant="primary" size="md">
                        View Full Profile
                      </Button>
                      <Button variant="secondary" size="md">
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
        {selectedCandidate && (
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
                    {selectedCandidate.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">{selectedCandidate.name}</h2>
                    <p className="text-sm text-muted-foreground">{selectedCandidate.experience} of experience</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCandidate(null)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {/* Match Score */}
                <div className="bg-accent rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-1">Overall Match Score</h3>
                      <p className="text-sm text-muted-foreground">Based on skills, experience, and qualifications</p>
                    </div>
                    <div className="text-5xl font-bold text-primary">{selectedCandidate.score}</div>
                  </div>
                </div>

                {/* Contact Information */}
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">Contact Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3 p-3 bg-accent rounded-lg">
                      <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <div>
                        <p className="text-xs text-muted-foreground">Email</p>
                        <p className="text-sm font-medium text-foreground">{selectedCandidate.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-accent rounded-lg">
                      <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <div>
                        <p className="text-xs text-muted-foreground">Phone</p>
                        <p className="text-sm font-medium text-foreground">{selectedCandidate.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-accent rounded-lg">
                      <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <div>
                        <p className="text-xs text-muted-foreground">Location</p>
                        <p className="text-sm font-medium text-foreground">{selectedCandidate.location}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Professional Assessment */}
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">Professional Assessment</h3>
                  <div className="p-4 bg-accent rounded-lg">
                    <p className="text-sm text-foreground leading-relaxed">{selectedCandidate.professionalAssessment}</p>
                  </div>
                </div>

                {/* Skills Analysis */}
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">Skills Analysis</h3>

                  {/* Skills Gap Visualization */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Skills Match</span>
                      <span className="text-sm font-semibold text-primary">{calculateSkillsGap(selectedCandidate)}%</span>
                    </div>
                    <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${calculateSkillsGap(selectedCandidate)}%` }}
                      />
                    </div>
                  </div>

                  {/* Matched Skills */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                      <div className="w-2 h-2 bg-ring rounded-full" />
                      Matched Skills ({selectedCandidate.matchedSkills.length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedCandidate.matchedSkills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1.5 text-xs font-medium bg-ring/10 text-ring rounded-full"
                        >
                          ✓ {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Missing Skills */}
                  {selectedCandidate.missingSkills.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                        <div className="w-2 h-2 bg-destructive rounded-full" />
                        Missing Skills ({selectedCandidate.missingSkills.length})
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedCandidate.missingSkills.map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1.5 text-xs font-medium bg-destructive/10 text-destructive rounded-full"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Additional Skills */}
                  {selectedCandidate.additionalSkills.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full" />
                        Additional Skills ({selectedCandidate.additionalSkills.length})
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedCandidate.additionalSkills.map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1.5 text-xs font-medium bg-primary/10 text-primary rounded-full"
                          >
                            + {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Experience Timeline */}
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">Professional Experience</h3>
                  <div className="space-y-4">
                    {selectedCandidate.experienceTimeline.map((exp, idx) => (
                      <div key={idx} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-3 h-3 bg-primary rounded-full" />
                          {idx < selectedCandidate.experienceTimeline.length - 1 && (
                            <div className="w-0.5 h-full bg-border mt-1" />
                          )}
                        </div>
                        <div className="flex-1 pb-6">
                          <p className="text-sm font-semibold text-foreground">{exp.role}</p>
                          <p className="text-sm text-muted-foreground">{exp.company}</p>
                          <p className="text-xs text-muted-foreground mt-1">{exp.period}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Education */}
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">Education & Qualifications</h3>
                  <div className="p-4 bg-accent rounded-lg">
                    <div className="flex items-start gap-3">
                      <svg className="w-6 h-6 text-primary mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-foreground">{selectedCandidate.education}</p>
                        <p className="text-xs text-muted-foreground mt-1">{selectedCandidate.experience} of experience</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Certifications */}
                {selectedCandidate.certifications.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-4">Certifications</h3>
                    <div className="space-y-2">
                      {selectedCandidate.certifications.map((cert, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-accent rounded-lg">
                          <svg className="w-5 h-5 text-ring" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                          </svg>
                          <span className="text-sm font-medium text-foreground">{cert}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="pt-6 border-t border-border">
                  <Button variant="primary" size="lg" className="w-full">
                    Schedule Interview
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
