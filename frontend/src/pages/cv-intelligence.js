import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { fadeIn } from '../lib/motion';

export default function CVIntelligencePage() {
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);
  const [view, setView] = useState('batches');
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  const batches = [
    {
      id: 'BATCH-001',
      name: 'Senior Full Stack Developers - December 2024',
      position: 'Senior Full Stack Developer',
      cvCount: 15,
      dateCreated: '2024-12-05',
      status: 'Completed',
      candidates: [
        {
          id: 'CAND-001',
          name: 'John Smith',
          position: 'Senior Full Stack Developer',
          score: 92,
          email: 'john.smith@email.com',
          phone: '+1 (555) 123-4567',
          location: 'San Francisco, CA',
          experience: '8 years',
          education: 'MS Computer Science - Stanford University',
          salary: '$150k - $180k',
          matchedSkills: ['React', 'Node.js', 'TypeScript', 'AWS', 'PostgreSQL', 'Docker'],
          missingSkills: ['Kubernetes', 'GraphQL'],
          additionalSkills: ['Python', 'Machine Learning', 'Redis'],
          experienceTimeline: [
            { company: 'Tech Giants Inc', role: 'Senior Developer', period: '2020 - Present' },
            { company: 'Startup XYZ', role: 'Full Stack Developer', period: '2017 - 2020' },
            { company: 'Digital Agency', role: 'Junior Developer', period: '2016 - 2017' },
          ],
          certifications: ['AWS Certified Solutions Architect', 'React Advanced Certification'],
          professionalAssessment:
            'Exceptional candidate with strong full-stack experience. Demonstrated leadership in architecting scalable solutions. Advanced knowledge in React and Node.js ecosystems. Strong communication skills and proven track record of delivering complex projects.',
        },
        {
          id: 'CAND-002',
          name: 'Sarah Johnson',
          position: 'Senior Full Stack Developer',
          score: 85,
          email: 'sarah.j@email.com',
          phone: '+1 (555) 234-5678',
          location: 'Austin, TX',
          experience: '6 years',
          education: 'BS Software Engineering - MIT',
          salary: '$130k - $160k',
          matchedSkills: ['React', 'Node.js', 'JavaScript', 'MongoDB', 'Express'],
          missingSkills: ['TypeScript', 'AWS', 'Docker'],
          additionalSkills: ['Vue.js', 'Firebase', 'Git'],
          experienceTimeline: [
            { company: 'Cloud Services Co', role: 'Full Stack Engineer', period: '2019 - Present' },
            { company: 'Web Dev Studio', role: 'Frontend Developer', period: '2018 - 2019' },
          ],
          certifications: ['MongoDB Developer Certification'],
          professionalAssessment:
            'Strong technical skills with solid experience in modern web development. Good problem-solving abilities. Would benefit from exposure to TypeScript and cloud infrastructure.',
        },
        {
          id: 'CAND-003',
          name: 'Michael Chen',
          position: 'Senior Full Stack Developer',
          score: 88,
          email: 'm.chen@email.com',
          phone: '+1 (555) 345-6789',
          location: 'Seattle, WA',
          experience: '7 years',
          education: 'BS Computer Science - UC Berkeley',
          salary: '$140k - $170k',
          matchedSkills: ['React', 'Node.js', 'AWS', 'Docker'],
          missingSkills: ['TypeScript', 'PostgreSQL', 'Kubernetes'],
          additionalSkills: ['Angular', 'Java', 'Spring Boot'],
          experienceTimeline: [
            { company: 'Enterprise Solutions', role: 'Senior Developer', period: '2021 - Present' },
            { company: 'Financial Tech Inc', role: 'Software Engineer', period: '2018 - 2021' },
          ],
          certifications: ['AWS Certified Developer'],
          professionalAssessment:
            'Solid background with enterprise-level applications. Strong foundation in React and Node.js. Experience with cloud deployment and containerization is a plus.',
        },
      ],
    },
    {
      id: 'BATCH-002',
      name: 'Product Managers - December 2024',
      position: 'Senior Product Manager',
      cvCount: 8,
      dateCreated: '2024-12-04',
      status: 'Completed',
      candidates: [],
    },
    {
      id: 'BATCH-003',
      name: 'UX Designers - November 2024',
      position: 'Senior UX Designer',
      cvCount: 8,
      dateCreated: '2024-11-28',
      status: 'Processing',
      candidates: [],
    },
  ];

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
    <>
      <Head>
        <title>CV Intelligence - Nexus AI Hub</title>
      </Head>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b border-border bg-card">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="mb-4">
              <button
                onClick={() => router.push('/')}
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
              </button>
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
                  <button onClick={() => setView('batches')} className="btn-ghost btn-lg">
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
                  </button>
                )}
                <button onClick={() => setView('upload')} className="btn-primary btn-lg">
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
                  New Batch
                </button>
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

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {batches.map((batch, index) => (
                    <motion.div
                      key={batch.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => batch.status === 'Completed' && handleBatchClick(batch)}
                      className={`bg-card border border-border rounded-2xl p-6 ${
                        batch.status === 'Completed'
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
                            <span className="font-medium text-primary">
                              {batch.candidates[0].score}%
                            </span>
                          </div>
                        )}
                      </div>

                      {batch.status === 'Completed' && (
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
              </motion.div>
            )}

            {/* Upload View - Simplified for now, keeping original logic */}
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
                    {/* Batch Name */}
                    <div className="bg-card border-2 border-border rounded-2xl p-6">
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Batch Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., Sr. AI Developer - December 2024"
                        className="input-base bg-input text-foreground"
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        The batch name should describe the role you&apos;re hiring for
                      </p>
                    </div>

                    {/* CV Upload */}
                    <div className="bg-card border-2 border-border rounded-2xl p-6">
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
                            : 'border-border bg-input hover:border-primary/50'
                        }`}
                      >
                        <div className="flex justify-center mb-4">
                          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
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
                          className="hidden"
                        />
                        <label htmlFor="cv-files">
                          <button className="btn-primary">Select CV Files</button>
                        </label>
                      </div>
                    </div>

                    {/* Job Description Upload */}
                    <div className="bg-card border-2 border-border rounded-2xl p-6">
                      <label className="block text-sm font-medium text-foreground mb-4">
                        Upload Job Description
                      </label>
                      <div className="border-2 border-dashed rounded-xl p-8 text-center transition-all border-border bg-input hover:border-primary/50">
                        <div className="flex justify-center mb-4">
                          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
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
                          <button className="btn-secondary">Select JD File</button>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-8">
                    <button className="btn-primary flex-1">
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
                    </button>
                    <button className="btn-secondary" onClick={() => setView('batches')}>
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Candidates View - Simplified */}
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
                    <span className="px-3 py-1 text-xs font-medium bg-primary/20 text-primary rounded-full">
                      {selectedBatch.candidates.length} Candidates
                    </span>
                  </div>
                  <p className="text-muted-foreground">Candidates ranked by match score</p>
                </div>

                <div className="space-y-4">
                  {selectedBatch.candidates.map((candidate, index) => (
                    <motion.div
                      key={candidate.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-card border-2 border-border rounded-2xl p-6 hover:border-primary hover:shadow-xl transition-all cursor-pointer"
                      onClick={() => handleCandidateClick(candidate)}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold">
                              {candidate.name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')}
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-foreground">
                                {candidate.name}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {candidate.experience} of experience • {candidate.location}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-bold text-primary mb-1">
                            {candidate.score}
                          </div>
                          <p className="text-xs text-muted-foreground">Match Score</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Experience</p>
                          <p className="text-sm font-medium text-foreground">
                            {candidate.experience}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Education</p>
                          <p className="text-sm font-medium text-foreground">
                            {candidate.education}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Skills Match</p>
                          <p className="text-sm font-medium text-foreground">
                            {calculateSkillsGap(candidate)}%
                          </p>
                        </div>
                      </div>

                      <div className="mb-4">
                        <p className="text-xs text-muted-foreground mb-2">
                          Matched Skills ({candidate.matchedSkills.length})
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {candidate.matchedSkills.slice(0, 6).map((skill, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1 text-xs font-medium bg-primary/20 text-primary rounded-full"
                            >
                              {skill}
                            </span>
                          ))}
                          {candidate.matchedSkills.length > 6 && (
                            <span className="px-3 py-1 text-xs font-medium bg-muted text-foreground rounded-full">
                              +{candidate.matchedSkills.length - 6} more
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <button className="btn-primary">View Full Profile</button>
                        <button className="btn-secondary">Schedule Interview</button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}
