

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeIn, scaleIn } from '../lib/motion';
import ButtonGreen from '../components/ui/ButtonGreen';

export default function CVIntelligencePage() {
  const [isDragging, setIsDragging] = useState(false);
  const [view, setView] = useState('batches');
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  const batches = [
    {
      id: 'BATCH-001',
      name: 'Senior Full Stack Developers - December 2024',
      position: 'Senior Full Stack Developer',
      cvCount,
      dateCreated: '2024-12-05',
      status: 'Completed',
      candidates: [
        {
          id,
          name: 'John Smith',
          position: 'Senior Full Stack Developer',
          score,
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
          professionalAssessment: 'Exceptional candidate with strong full-stack experience. Demonstrated leadership in architecting scalable solutions. Advanced knowledge in React and Node.js ecosystems. Strong communication skills and proven track record of delivering complex projects.',
        },
        {
          id,
          name: 'Sarah Johnson',
          position: 'Senior Full Stack Developer',
          score,
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
          professionalAssessment: 'Strong technical skills with solid experience in modern web development. Good problem-solving abilities. Would benefit from exposure to TypeScript and cloud infrastructure.',
        },
        {
          id,
          name: 'Michael Chen',
          position: 'Senior Full Stack Developer',
          score,
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
          professionalAssessment: 'Solid background with enterprise-level applications. Strong foundation in React and Node.js. Experience with cloud deployment and containerization is a plus.',
        },
      ],
    },
    {
      id: 'BATCH-002',
      name: 'Product Managers - December 2024',
      position: 'Senior Product Manager',
      cvCount,
      dateCreated: '2024-12-04',
      status: 'Completed',
      candidates: [
        {
          id,
          name: 'Emily Davis',
          position: 'Senior Product Manager',
          score,
          email: 'emily.davis@email.com',
          phone: '+1 (555) 456-7890',
          location: 'New York, NY',
          experience: '9 years',
          education: 'MBA - Harvard Business School',
          salary: '$160k - $190k',
          matchedSkills: ['Product Strategy', 'Agile', 'User Research', 'Data Analysis', 'Roadmapping'],
          missingSkills: ['SQL', 'A/B Testing'],
          additionalSkills: ['Stakeholder Management', 'Go-to-Market Strategy', 'Team Leadership'],
          experienceTimeline: [
            { company: 'SaaS Platform Inc', role: 'Senior PM', period: '2020 - Present' },
            { company: 'E-commerce Giant', role: 'Product Manager', period: '2017 - 2020' },
            { company: 'Consulting Firm', role: 'Business Analyst', period: '2015 - 2017' },
          ],
          certifications: ['Certified Scrum Product Owner', 'Product Management Certificate'],
          professionalAssessment: 'Outstanding product leadership with proven track record of launching successful products. Strong strategic thinking and cross-functional collaboration skills. Excellent at balancing user needs with business objectives.',
        },
      ],
    },
    {
      id: 'BATCH-003',
      name: 'UX Designers - November 2024',
      position: 'Senior UX Designer',
      cvCount,
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
            
              <h1 className="text-3xl font-bold text-gray-900">CV Intelligence (HR-01)</h1>
              <p className="text-gray-600 mt-1">AI-powered CV screening and candidate matching</p>
            </div>
            <div className="flex gap-3">
              {view === 'candidates' && (
                <ButtonGreen variant="ghost" size="lg" onClick={() => setView('batches')}>
                  <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to Batches
                </ButtonGreen>
              )}
              <ButtonGreen variant="primary" size="lg" onClick={() => setView('upload')}>
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                New Batch
              </ButtonGreen>
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
                <h2 className="text-2xl font-bold text-gray-900 mb-2">CV Batches</h2>
                <p className="text-gray-600">View and manage your CV screening batches</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {batches.map((batch, index) => (
                  <motion.div
                    key={batch.id}
                    initial={{ opacity, y }}
                    animate={{ opacity, y }}
                    transition={{ delay * 0.1 }}
                    onClick={() => batch.status === 'Completed' && handleBatchClick(batch)}
                    className={`bg-white border border-gray-200 rounded-2xl p-6 ${
                      batch.status === 'Completed' ? 'cursor-pointer hover:shadow-lg transition-shadow' : 'opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full ${
                          batch.status === 'Completed'
                            ? 'bg-green-500/10 text-green-600'
                            .status === 'Processing'
                              ? 'bg-green-500/10 text-green-500'
                              : 'bg-red-600/10 text-red-600'
                        }`}
                      >
                        {batch.status}
                      </span>
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{batch.name}</h3>
                    <p className="text-sm text-gray-600 mb-4">{batch.position}</p>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">CVs Processed:</span>
                        <span className="font-medium text-gray-900">{batch.cvCount}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Date Created:</span>
                        <span className="font-medium text-gray-900">
                          {new Date(batch.dateCreated).toLocaleDateString()}
                        </span>
                      </div>
                      {batch.status === 'Completed' && batch.candidates.length > 0 && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Top Match:</span>
                          <span className="font-medium text-green-500">{batch.candidates[0].score}%</span>
                        </div>
                      )}
                    </div>

                    {batch.status === 'Completed' && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex items-center text-green-500 text-sm font-medium">
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
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Create New Batch</h2>
                  <p className="text-gray-600">Upload CVs and job description to create a new screening batch</p>
                </div>

                <div className="space-y-6">
                  {/* 1. Batch Name */}
                  <div className="bg-white border border-gray-200 rounded-2xl p-6">
                    <label className="block text-sm font-medium text-gray-900 mb-2">Batch Name</label>
                    <input
                      type="text"
                      placeholder="e.g., Sr. AI Developer - December 2024"
                      className="w-full px-4 py-2 bg-secondary text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <p className="text-xs text-gray-600 mt-2">The batch name should describe the role you&apos;re hiring for</p>
                  </div>

                  {/* 2. CV Upload Area */}
                  <div className="bg-white border border-gray-200 rounded-2xl p-6">
                    <label className="block text-sm font-medium text-gray-900 mb-4">Upload CVs</label>
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                        isDragging
                          ? 'border-green-500 bg-green-500/5'
                          : 'border-gray-200 bg-secondary hover:border-green-500/50 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex justify-center mb-4">
                        <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center">
                          <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Drop CV files here or click to browse
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
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
                        <ButtonGreen variant="primary" size="md">
                          Select CV Files
                        </ButtonGreen>
                      </label>
                    </div>
                  </div>

                  {/* 3. Job Description Upload Area */}
                  <div className="bg-white border border-gray-200 rounded-2xl p-6">
                    <label className="block text-sm font-medium text-gray-900 mb-4">Upload Job Description</label>
                    <div
                      className="border-2 border-dashed rounded-xl p-8 text-center transition-all border-gray-200 bg-secondary hover:border-green-500/50 hover:bg-gray-50"
                    >
                      <div className="flex justify-center mb-4">
                        <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center">
                          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Drop job description here or click to browse
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Upload 1 JD file • PDF, DOC, DOCX, TXT • Max 5MB
                      </p>
                      <input
                        type="file"
                        id="jd-file"
                        accept=".pdf,.doc,.docx,.txt"
                        className="hidden"
                      />
                      <label htmlFor="jd-file">
                        <ButtonGreen variant="secondary" size="md">
                          Select JD File
                        </ButtonGreen>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-8">
                  <ButtonGreen variant="primary" size="lg" className="flex-1">
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Start AI Processing
                  </ButtonGreen>
                  <ButtonGreen variant="secondary" size="lg" onClick={() => setView('batches')}>
                    Cancel
                  </ButtonGreen>
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
                  <h2 className="text-2xl font-bold text-gray-900">{selectedBatch.name}</h2>
                  <span className="px-3 py-1 text-xs font-medium bg-green-500/10 text-green-600 rounded-full">
                    {selectedBatch.candidates.length} Candidates
                  </span>
                </div>
                <p className="text-gray-600">Candidates ranked by match score</p>
              </div>

              <div className="space-y-4">
                {selectedBatch.candidates.map((candidate, index) => (
                  <motion.div
                    key={candidate.id}
                    initial={{ opacity, y }}
                    animate={{ opacity, y }}
                    transition={{ delay * 0.1 }}
                    className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => handleCandidateClick(candidate)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold">
                            {candidate.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          
                            <h3 className="text-xl font-bold text-gray-900">{candidate.name}</h3>
                            <p className="text-sm text-gray-600">{candidate.experience} of experience • {candidate.location}</p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-green-500 mb-1">{candidate.score}</div>
                        <p className="text-xs text-gray-600">Match Score</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                      
                        <p className="text-xs text-gray-600 mb-1">Experience</p>
                        <p className="text-sm font-medium text-gray-900">{candidate.experience}</p>
                      </div>
                      
                        <p className="text-xs text-gray-600 mb-1">Education</p>
                        <p className="text-sm font-medium text-gray-900">{candidate.education}</p>
                      </div>
                      
                        <p className="text-xs text-gray-600 mb-1">Skills Match</p>
                        <p className="text-sm font-medium text-gray-900">{calculateSkillsGap(candidate)}%</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-xs text-gray-600 mb-2">Matched Skills ({candidate.matchedSkills.length})</p>
                      <div className="flex flex-wrap gap-2">
                        {candidate.matchedSkills.slice(0, 6).map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 text-xs font-medium bg-green-500/10 text-green-600 rounded-full"
                          >
                            {skill}
                          </span>
                        ))}
                        {candidate.matchedSkills.length > 6 && (
                          <span className="px-3 py-1 text-xs font-medium bg-gray-50 text-gray-900 rounded-full">
                            +{candidate.matchedSkills.length - 6} more
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <ButtonGreen variant="primary" size="md">
                        View Full Profile
                      </ButtonGreen>
                      <ButtonGreen variant="secondary" size="md">
                        Schedule Interview
                      </ButtonGreen>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Candidate Detail Modal */}
      
        {selectedCandidate && (
          <motion.div
            initial={{ opacity }}
            animate={{ opacity }}
            exit={{ opacity }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedCandidate(null)}
          >
            <motion.div
              initial={{ scale.95, y }}
              animate={{ scale, y }}
              exit={{ scale.95, y }}
              className="bg-white border border-gray-200 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    {selectedCandidate.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  
                    <h2 className="text-2xl font-bold text-gray-900">{selectedCandidate.name}</h2>
                    <p className="text-sm text-gray-600">{selectedCandidate.experience} of experience</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCandidate(null)}
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {/* Match Score */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">Overall Match Score</h3>
                      <p className="text-sm text-gray-600">Based on skills, experience, and qualifications</p>
                    </div>
                    <div className="text-5xl font-bold text-green-500">{selectedCandidate.score}</div>
                  </div>
                </div>

                {/* Contact Information */}
                
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      
                        <p className="text-xs text-gray-600">Email</p>
                        <p className="text-sm font-medium text-gray-900">{selectedCandidate.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      
                        <p className="text-xs text-gray-600">Phone</p>
                        <p className="text-sm font-medium text-gray-900">{selectedCandidate.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      
                        <p className="text-xs text-gray-600">Location</p>
                        <p className="text-sm font-medium text-gray-900">{selectedCandidate.location}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Professional Assessment */}
                
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Professional Assessment</h3>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-900 leading-relaxed">{selectedCandidate.professionalAssessment}</p>
                  </div>
                </div>

                {/* Skills Analysis */}
                
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Skills Analysis</h3>

                  {/* Skills Gap Visualization */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Skills Match</span>
                      <span className="text-sm font-semibold text-green-500">{calculateSkillsGap(selectedCandidate)}%</span>
                    </div>
                    <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full transition-all"
                        style={{ width: `${calculateSkillsGap(selectedCandidate)}%` }}
                      />
                    </div>
                  </div>

                  {/* Matched Skills */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      Matched Skills ({selectedCandidate.matchedSkills.length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedCandidate.matchedSkills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1.5 text-xs font-medium bg-green-500/10 text-green-600 rounded-full"
                        >
                          ✓ {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Missing Skills */}
                  {selectedCandidate.missingSkills.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-600 rounded-full" />
                        Missing Skills ({selectedCandidate.missingSkills.length})
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedCandidate.missingSkills.map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1.5 text-xs font-medium bg-red-600/10 text-red-600 rounded-full"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Additional Skills */}
                  {selectedCandidate.additionalSkills.length > 0 && (
                    
                      <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        Additional Skills ({selectedCandidate.additionalSkills.length})
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedCandidate.additionalSkills.map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1.5 text-xs font-medium bg-green-500/10 text-green-500 rounded-full"
                          >
                            + {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Experience Timeline */}
                
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Professional Experience</h3>
                  <div className="space-y-4">
                    {selectedCandidate.experienceTimeline.map((exp, idx) => (
                      <div key={idx} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-3 h-3 bg-green-500 rounded-full" />
                          {idx < selectedCandidate.experienceTimeline.length - 1 && (
                            <div className="w-0.5 h-full bg-border mt-1" />
                          )}
                        </div>
                        <div className="flex-1 pb-6">
                          <p className="text-sm font-semibold text-gray-900">{exp.role}</p>
                          <p className="text-sm text-gray-600">{exp.company}</p>
                          <p className="text-xs text-gray-600 mt-1">{exp.period}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Education */}
                
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Education & Qualifications</h3>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-start gap-3">
                      <svg className="w-6 h-6 text-green-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                      </svg>
                      
                        <p className="text-sm font-medium text-gray-900">{selectedCandidate.education}</p>
                        <p className="text-xs text-gray-600 mt-1">{selectedCandidate.experience} of experience</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Certifications */}
                {selectedCandidate.certifications.length > 0 && (
                  
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Certifications</h3>
                    <div className="space-y-2">
                      {selectedCandidate.certifications.map((cert, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                          </svg>
                          <span className="text-sm font-medium text-gray-900">{cert}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="pt-6 border-t border-gray-200">
                  <ButtonGreen variant="primary" size="lg" className="w-full">
                    Schedule Interview
                  </ButtonGreen>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
