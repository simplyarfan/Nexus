

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeIn, scaleIn } from '../lib/motion';
import ButtonGreen from '../components/ui/ButtonGreen';
import DateTimePicker from '../components/ui/DateTimePicker';

export default function InterviewsPage() {
  const [view, setView] = useState('list');
  const [selectedInterview, setSelectedInterview] = useState(null);

  // Request Availability Form (Stage 1)
  const [availabilityForm, setAvailabilityForm] = useState({
    candidateName: '',
    candidateEmail: '',
    position: '',
    googleFormLink: '',
    emailSubject: '',
    emailContent: '',
    ccEmails: '',
    bccEmails: '',
    cvFile as File ,
  });

  // Schedule Interview Form (Stage 2)
  const [scheduleForm, setScheduleForm] = useState({
    interviewType: 'technical',
    scheduledTime: '',
    duration,
    notes: '',
    ccEmails: '',
    bccEmails: '',
    cvFile as File ,
  });

  const interviews = [
    {
      id: 'INT-001',
      candidateName: 'John Smith',
      candidateEmail: 'john.smith@email.com',
      position: 'Senior Full Stack Developer',
      status: 'scheduled',
      createdDate: '2024-12-05',
      scheduledTime: '2024-12-10T10:00:00',
      duration,
      meetingLink: 'https://teams.microsoft.com/meet/xyz',
      interviewType: 'Technical',
      workflow: [
        { stage: 'initial_email', timestamp: '2024-12-05T09:00:00', details: 'Initial availability request sent' },
        { stage: 'awaiting_response', timestamp: '2024-12-05T09:00:00', details: 'Waiting for candidate response' },
        { stage: 'scheduled', timestamp: '2024-12-06T14:30:00', details: 'Interview scheduled via Microsoft Teams' },
      ],
    },
    {
      id: 'INT-002',
      candidateName: 'Sarah Johnson',
      candidateEmail: 'sarah.j@email.com',
      position: 'Product Manager',
      status: 'awaiting_response',
      createdDate: '2024-12-04',
      workflow: [
        { stage: 'initial_email', timestamp: '2024-12-04T10:00:00', details: 'Initial availability request sent' },
        { stage: 'awaiting_response', timestamp: '2024-12-04T10:00:00', details: 'Waiting for candidate response' },
      ],
    },
    {
      id: 'INT-003',
      candidateName: 'Michael Chen',
      candidateEmail: 'm.chen@email.com',
      position: 'UX Designer',
      status: 'completed',
      createdDate: '2024-12-01',
      scheduledTime: '2024-12-03T14:00:00',
      duration,
      interviewType: 'Cultural Fit',
      workflow: [
        { stage: 'initial_email', timestamp: '2024-12-01T09:00:00', details: 'Initial availability request sent' },
        { stage: 'awaiting_response', timestamp: '2024-12-01T09:00:00', details: 'Waiting for candidate response' },
        { stage: 'scheduled', timestamp: '2024-12-02T11:00:00', details: 'Interview scheduled via Microsoft Teams' },
        { stage: 'completed', timestamp: '2024-12-03T14:45:00', details: 'Interview completed successfully' },
      ],
    },
  ];

  const stats = [
    { label: 'Total Interviews', value.length, color: 'text-green-500' },
    { label: 'Awaiting Response', value.filter(i => i.status === 'awaiting_response').length, color: 'text-gray-600' },
    { label: 'Scheduled', value.filter(i => i.status === 'scheduled').length, color: 'text-green-600' },
    { label: 'Completed', value.filter(i => i.status === 'completed').length, color: 'text-green-500' },
  ];

  const getStatusColor = (status['status']) => {
    switch (status) {
      case 'awaiting_response':
        return 'bg-gray-200 text-gray-600';
      case 'scheduled':
        return 'bg-gray-50 text-green-500';
      case 'completed':
        return 'bg-gray-50 text-green-600';
      case 'rejected':
        return 'bg-gray-50 text-red-600';
      case 'cancelled':
        return 'bg-gray-50 text-red-600';
      default:
        return 'bg-gray-50 text-gray-900';
    }
  };

  const getStageIcon = (stage['stage']) => {
    switch (stage) {
      case 'initial_email':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
      case 'awaiting_response':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'scheduled':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      case 'completed':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'rejected':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getStageColor = (stage['stage']) => {
    switch (stage) {
      case 'initial_email':
        return 'bg-gray-50 text-green-500 border-green-500';
      case 'awaiting_response':
        return 'bg-gray-50 text-gray-600 border-muted-foreground';
      case 'scheduled':
        return 'bg-gray-50 text-green-600 border-ring';
      case 'completed':
        return 'bg-gray-50 text-green-600 border-ring';
      case 'rejected':
        return 'bg-gray-50 text-red-600 border-destructive';
      default:
        return 'bg-gray-50 text-gray-900 border-gray-200';
    }
  };

  const getStageName = (stage['stage']) => {
    switch (stage) {
      case 'initial_email':
        return 'Initial Email Sent';
      case 'awaiting_response':
        return 'Awaiting Response';
      case 'scheduled':
        return 'Interview Scheduled';
      case 'completed':
        return 'Interview Completed';
      case 'rejected':
        return 'Candidate Rejected';
      default:
        return stage;
    }
  };

  const handleRequestAvailability = () => {
    setView('request-availability');
    // Pre-fill subject and content with default template
    const position = availabilityForm.position |;
    const candidateName = availabilityForm.candidateName |;

    setAvailabilityForm(prev => ({
      ...prev,
      emailSubject: `Interview Opportunity - ${position}`,
      emailContent: `Dear ${candidateName},

We are pleased to inform you that we have shortlisted you for an interview for the ${position} position at our company.

We need some details prior to the interview, which you can fill in the following Google Form: [Google Form Link will be inserted here]

Additionally, please mention what time would you be available for a meeting?

We look forward to hearing from you soon.

Best regards,
[Your Company Name]`,
    }));
  };

  const handleScheduleInterview = (interview) => {
    setSelectedInterview(interview);
    setView('schedule');
  };

  const handleViewDetails = (interview) => {
    setSelectedInterview(interview);
    setView('details');
  };

  const handleSubmitAvailabilityRequest = () => {
    console.log('Sending availability request:', availabilityForm);
    // Here you would make API call to send email with CV attachment
    setView('list');
    setAvailabilityForm({
      candidateName: '',
      candidateEmail: '',
      position: '',
      googleFormLink: '',
      emailSubject: '',
      emailContent: '',
      ccEmails: '',
      bccEmails: '',
      cvFile,
    });
  };

  const handleSubmitSchedule = () => {
    console.log('Scheduling interview:', scheduleForm);
    // Here you would make API call to schedule interview + create Teams meeting
    setView('list');
    setScheduleForm({
      interviewType: 'technical',
      scheduledTime: '',
      duration,
      notes: '',
      ccEmails: '',
      bccEmails: '',
    });
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
            
              <h1 className="text-3xl font-bold text-gray-900">Interview Coordinator (HR-02)</h1>
              <p className="text-gray-600 mt-1">Schedule and manage interviews efficiently</p>
            </div>
            <div className="flex gap-3">
              {view !== 'list' && (
                <ButtonGreen variant="ghost" size="lg" onClick={() => setView('list')}>
                  <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to List
                </ButtonGreen>
              )}
              <ButtonGreen variant="primary" size="lg" onClick={handleRequestAvailability}>
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Request Availability
              </ButtonGreen>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {/* Interviews List */}
          {view === 'list' && (
            <motion.div
              key="list"
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                {stats.map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity, y }}
                    animate={{ opacity, y }}
                    transition={{ delay * 0.1 }}
                    className="bg-white border border-gray-200 rounded-2xl p-6"
                  >
                    <p className="text-sm text-gray-600 mb-2">{stat.label}</p>
                    <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                  </motion.div>
                ))}
              </div>

              {/* Interviews List */}
              
                <h2 className="text-2xl font-bold text-gray-900 mb-6">All Interviews</h2>
                <div className="space-y-4">
                  {interviews.map((interview, index) => (
                    <motion.div
                      key={interview.id}
                      initial={{ opacity, y }}
                      animate={{ opacity, y }}
                      transition={{ delay.3 + index * 0.1 }}
                      className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold">
                              {interview.candidateName.split(' ').map(n => n[0]).join('')}
                            </div>
                            
                              <h3 className="text-lg font-semibold text-gray-900">{interview.candidateName}</h3>
                              <p className="text-sm text-gray-600">{interview.position}</p>
                            </div>
                          </div>
                        </div>
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(interview.status)}`}>
                          {interview.status.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                        
                          <p className="text-xs text-gray-600 mb-1">Request Sent</p>
                          <p className="text-sm font-medium text-gray-900">{new Date(interview.createdDate).toLocaleDateString()}</p>
                        </div>
                        {interview.scheduledTime && (
                          <>
                            
                              <p className="text-xs text-gray-600 mb-1">Scheduled Time</p>
                              <p className="text-sm font-medium text-gray-900">{new Date(interview.scheduledTime).toLocaleString()}</p>
                            </div>
                            
                              <p className="text-xs text-gray-600 mb-1">Duration</p>
                              <p className="text-sm font-medium text-gray-900">{interview.duration} minutes</p>
                            </div>
                          </>
                        )}
                        {interview.interviewType && (
                          
                            <p className="text-xs text-gray-600 mb-1">Interview Type</p>
                            <p className="text-sm font-medium text-gray-900">{interview.interviewType}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-3">
                        {interview.status === 'awaiting_response' && (
                          <ButtonGreen variant="primary" size="sm" onClick={() => handleScheduleInterview(interview)}>
                            Schedule Interview
                          </ButtonGreen>
                        )}
                        {interview.status === 'scheduled' && interview.meetingLink && (
                          <ButtonGreen variant="primary" size="sm" onClick={() => window.open(interview.meetingLink, '_blank')}>
                            Join Meeting
                          </ButtonGreen>
                        )}
                        <ButtonGreen variant="secondary" size="sm" onClick={() => handleViewDetails(interview)}>
                          View Details
                        </ButtonGreen>
                        {interview.status === 'scheduled' && (
                          <ButtonGreen variant="ghost" size="sm" onClick={() => alert('Reschedule functionality coming soon')}>
                            Reschedule
                          </ButtonGreen>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Interview Details View */}
          {view === 'details' && selectedInterview && (
            <motion.div
              key="details"
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="max-w-4xl mx-auto"
            >
              <div className="bg-white border border-gray-200 rounded-2xl p-8">
                {/* Header */}
                <div className="flex items-start justify-between mb-6 pb-6 border-b border-gray-200">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                      {selectedInterview.candidateName.split(' ').map(n => n[0]).join('')}
                    </div>
                    
                      <h2 className="text-2xl font-bold text-gray-900">{selectedInterview.candidateName}</h2>
                      <p className="text-gray-600">{selectedInterview.position}</p>
                      <p className="text-sm text-gray-600 mt-1">{selectedInterview.candidateEmail}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedInterview.status)}`}>
                    {selectedInterview.status.replace('_', ' ')}
                  </span>
                </div>

                {/* Interview Details */}
                {selectedInterview.scheduledTime && (
                  <div className="mb-6 pb-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Interview Details</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      
                        <p className="text-xs text-gray-600 mb-1">Scheduled Time</p>
                        <p className="text-sm font-medium text-gray-900">{new Date(selectedInterview.scheduledTime).toLocaleString()}</p>
                      </div>
                      
                        <p className="text-xs text-gray-600 mb-1">Duration</p>
                        <p className="text-sm font-medium text-gray-900">{selectedInterview.duration} minutes</p>
                      </div>
                      {selectedInterview.interviewType && (
                        
                          <p className="text-xs text-gray-600 mb-1">Interview Type</p>
                          <p className="text-sm font-medium text-gray-900">{selectedInterview.interviewType}</p>
                        </div>
                      )}
                      {selectedInterview.meetingLink && (
                        <div className="col-span-2 md:col-span-3">
                          <p className="text-xs text-gray-600 mb-1">Meeting Link</p>
                          <a
                            href={selectedInterview.meetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-green-500 hover:opacity-80 transition-opacity"
                          >
                            {selectedInterview.meetingLink}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Workflow Timeline */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Interview Progress</h3>
                  <div className="space-y-4">
                    {selectedInterview.workflow?.map((stage, index) => (
                      <div key={index} className="flex gap-4">
                        <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${getStageColor(stage.stage)}`}>
                          {getStageIcon(stage.stage)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-semibold text-gray-900">{getStageName(stage.stage)}</h4>
                            <span className="text-xs text-gray-600">{new Date(stage.timestamp).toLocaleString()}</span>
                          </div>
                          {stage.details && (
                            <p className="text-sm text-gray-600">{stage.details}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 pt-6 border-t border-gray-200">
                  {selectedInterview.status === 'awaiting_response' && (
                    <ButtonGreen variant="primary" size="lg" onClick={() => handleScheduleInterview(selectedInterview)}>
                      Schedule Interview
                    </ButtonGreen>
                  )}
                  {selectedInterview.status === 'scheduled' && (
                    <>
                      {selectedInterview.meetingLink && (
                        <ButtonGreen variant="primary" size="lg" onClick={() => window.open(selectedInterview.meetingLink, '_blank')}>
                          Join Meeting
                        </ButtonGreen>
                      )}
                      <ButtonGreen variant="secondary" size="lg" onClick={() => alert('Reschedule functionality coming soon')}>
                        Reschedule
                      </ButtonGreen>
                      <ButtonGreen variant="secondary" size="lg" onClick={() => alert('Interview marked as completed')}>
                        Mark as Completed
                      </ButtonGreen>
                    </>
                  )}
                  {selectedInterview.status === 'completed' && (
                    <>
                      <ButtonGreen variant="primary" size="lg" onClick={() => alert('Candidate marked as selected')}>
                        Mark as Selected
                      </ButtonGreen>
                      <ButtonGreen variant="ghost" size="lg" onClick={() => alert('Candidate marked as rejected')}>
                        Mark as Rejected
                      </ButtonGreen>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Request Availability Form (Stage 1) */}
          {view === 'request-availability' && (
            <motion.div
              key="request-availability"
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="max-w-3xl mx-auto"
            >
              <div className="bg-white border border-gray-200 rounded-2xl p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Availability</h2>
                <p className="text-gray-600 mb-6">Send an email to the candidate requesting their available time slots</p>

                <div className="space-y-6">
                  {/* Candidate Information */}
                  <div className="grid grid-cols-2 gap-4">
                    
                      <label className="block text-sm font-medium text-gray-900 mb-2">Candidate Name *</label>
                      <input
                        type="text"
                        value={availabilityForm.candidateName}
                        onChange={(e) => setAvailabilityForm({ ...availabilityForm, candidateName.target.value })}
                        className="w-full px-4 py-2 bg-secondary text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder="e.g., John Smith"
                      />
                    </div>
                    
                      <label className="block text-sm font-medium text-gray-900 mb-2">Email *</label>
                      <input
                        type="email"
                        value={availabilityForm.candidateEmail}
                        onChange={(e) => setAvailabilityForm({ ...availabilityForm, candidateEmail.target.value })}
                        className="w-full px-4 py-2 bg-secondary text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder="candidate@example.com"
                      />
                    </div>
                  </div>

                  
                    <label className="block text-sm font-medium text-gray-900 mb-2">Position *</label>
                    <input
                      type="text"
                      value={availabilityForm.position}
                      onChange={(e) => setAvailabilityForm({ ...availabilityForm, position.target.value })}
                      className="w-full px-4 py-2 bg-secondary text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="e.g., Senior Full Stack Developer"
                    />
                  </div>

                  
                    <label className="block text-sm font-medium text-gray-900 mb-2">Google Form Link (Optional)</label>
                    <input
                      type="url"
                      value={availabilityForm.googleFormLink}
                      onChange={(e) => setAvailabilityForm({ ...availabilityForm, googleFormLink.target.value })}
                      className="w-full px-4 py-2 bg-secondary text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="https://forms.google.com/..."
                    />
                    <p className="text-xs text-gray-600 mt-1">Will be inserted into email template</p>
                  </div>

                  
                    <label className="block text-sm font-medium text-gray-900 mb-2">Email Subject</label>
                    <input
                      type="text"
                      value={availabilityForm.emailSubject}
                      onChange={(e) => setAvailabilityForm({ ...availabilityForm, emailSubject.target.value })}
                      className="w-full px-4 py-2 bg-secondary text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="Interview Opportunity - [Position]"
                    />
                  </div>

                  
                    <label className="block text-sm font-medium text-gray-900 mb-2">Email Content</label>
                    <textarea
                      rows={10}
                      value={availabilityForm.emailContent}
                      onChange={(e) => setAvailabilityForm({ ...availabilityForm, emailContent.target.value })}
                      className="w-full px-4 py-2 bg-secondary text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ring font-mono text-sm"
                      placeholder="Custom email content (optional - will use default template if empty)"
                    />
                  </div>

                  {/* CV Upload */}
                  
                    <label className="block text-sm font-medium text-gray-900 mb-2">Attach CV (Optional)</label>
                    <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 bg-secondary hover:bg-gray-50 transition-colors">
                      <input
                        type="file"
                        id="cv-upload"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => {
                          const file = e.target.files?.[0] |;
                          setAvailabilityForm({ ...availabilityForm, cvFile });
                        }}
                        className="hidden"
                      />
                      <label
                        htmlFor="cv-upload"
                        className="flex flex-col items-center cursor-pointer"
                      >
                        <svg className="w-12 h-12 text-gray-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        {availabilityForm.cvFile ? (
                          <div className="text-center">
                            <p className="text-sm font-medium text-gray-900">{availabilityForm.cvFile.name}</p>
                            <p className="text-xs text-gray-600 mt-1">
                              {(availabilityForm.cvFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                setAvailabilityForm({ ...availabilityForm, cvFile });
                              }}
                              className="text-xs text-red-600 hover:opacity-80 mt-2"
                            >
                              Remove file
                            </button>
                          </div>
                        ) : (
                          <div className="text-center">
                            <p className="text-sm font-medium text-gray-900">Click to upload CV</p>
                            <p className="text-xs text-gray-600 mt-1">PDF, DOC, or DOCX (Max 10MB)</p>
                          </div>
                        )}
                      </label>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">Attach the candidate's CV to the email</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    
                      <label className="block text-sm font-medium text-gray-900 mb-2">CC (Optional)</label>
                      <input
                        type="text"
                        value={availabilityForm.ccEmails}
                        onChange={(e) => setAvailabilityForm({ ...availabilityForm, ccEmails.target.value })}
                        className="w-full px-4 py-2 bg-secondary text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder="email1@example.com, email2@example.com"
                      />
                      <p className="text-xs text-gray-600 mt-1">Comma-separated email addresses</p>
                    </div>
                    
                      <label className="block text-sm font-medium text-gray-900 mb-2">BCC (Optional)</label>
                      <input
                        type="text"
                        value={availabilityForm.bccEmails}
                        onChange={(e) => setAvailabilityForm({ ...availabilityForm, bccEmails.target.value })}
                        className="w-full px-4 py-2 bg-secondary text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder="email1@example.com, email2@example.com"
                      />
                      <p className="text-xs text-gray-600 mt-1">Comma-separated email addresses</p>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-6 border-t border-gray-200">
                    <ButtonGreen variant="primary" size="lg" className="flex-1" onClick={handleSubmitAvailabilityRequest}>
                      Send Request
                    </ButtonGreen>
                    <ButtonGreen variant="secondary" size="lg" onClick={() => setView('list')}>
                      Cancel
                    </ButtonGreen>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Schedule Interview Form (Stage 2) */}
          {view === 'schedule' && selectedInterview && (
            <motion.div
              key="schedule"
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="max-w-3xl mx-auto"
            >
              <div className="bg-white border border-gray-200 rounded-2xl p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Schedule Interview</h2>
                <p className="text-gray-600 mb-6">
                  Schedule interview for <span className="font-semibold text-gray-900">{selectedInterview.candidateName}</span> - {selectedInterview.position}
                </p>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    
                      <label className="block text-sm font-medium text-gray-900 mb-2">Interview Type</label>
                      <select
                        value={scheduleForm.interviewType}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, interviewType.target.value })}
                        className="w-full px-4 py-2 bg-secondary text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="technical">Technical</option>
                        <option value="behavioral">Behavioral</option>
                        <option value="cultural">Cultural Fit</option>
                        <option value="final">Final Round</option>
                      </select>
                    </div>
                    
                      <label className="block text-sm font-medium text-gray-900 mb-2">Duration (minutes)</label>
                      <select
                        value={scheduleForm.duration}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, duration(e.target.value) })}
                        className="w-full px-4 py-2 bg-secondary text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value={30}>30 minutes</option>
                        <option value={45}>45 minutes</option>
                        <option value={60}>1 hour</option>
                        <option value={90}>1.5 hours</option>
                        <option value={120}>2 hours</option>
                      </select>
                    </div>
                  </div>

                  
                    <DateTimePicker
                      label="Scheduled Date & Time"
                      value={scheduleForm.scheduledTime}
                      onChange={(value) => setScheduleForm({ ...scheduleForm, scheduledTime })}
                      required
                    />
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">Microsoft Teams</p>
                        <p className="text-sm text-gray-600">Meeting link will be automatically generated</p>
                      </div>
                    </div>
                  </div>

                  
                    <label className="block text-sm font-medium text-gray-900 mb-2">Attach CV (Optional)</label>
                    <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 bg-secondary hover:bg-gray-50 transition-colors">
                      <input
                        type="file"
                        id="schedule-cv-upload"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => {
                          const file = e.target.files?.[0] |;
                          setScheduleForm({ ...scheduleForm, cvFile });
                        }}
                        className="hidden"
                      />
                      <label htmlFor="schedule-cv-upload" className="flex flex-col items-center cursor-pointer">
                        <svg className="w-12 h-12 text-gray-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        {scheduleForm.cvFile ? (
                          <div className="text-center">
                            <p className="text-sm font-medium text-gray-900">{scheduleForm.cvFile.name}</p>
                            <p className="text-xs text-gray-600 mt-1">
                              {(scheduleForm.cvFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                setScheduleForm({ ...scheduleForm, cvFile });
                              }}
                              className="text-xs text-red-600 hover:opacity-80 mt-2"
                            >
                              Remove file
                            </button>
                          </div>
                        ) : (
                          <div className="text-center">
                            <p className="text-sm font-medium text-gray-900">Click to upload CV</p>
                            <p className="text-xs text-gray-600 mt-1">PDF, DOC, or DOCX (Max 10MB)</p>
                          </div>
                        )}
                      </label>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">Attach the candidate's CV to the interview confirmation email</p>
                  </div>

                  
                    <label className="block text-sm font-medium text-gray-900 mb-2">Notes (Optional)</label>
                    <textarea
                      rows={4}
                      value={scheduleForm.notes}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, notes.target.value })}
                      className="w-full px-4 py-2 bg-secondary text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="Additional notes or preparation instructions for the candidate..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    
                      <label className="block text-sm font-medium text-gray-900 mb-2">CC (Optional)</label>
                      <input
                        type="text"
                        value={scheduleForm.ccEmails}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, ccEmails.target.value })}
                        className="w-full px-4 py-2 bg-secondary text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder="email1@example.com, email2@example.com"
                      />
                    </div>
                    
                      <label className="block text-sm font-medium text-gray-900 mb-2">BCC (Optional)</label>
                      <input
                        type="text"
                        value={scheduleForm.bccEmails}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, bccEmails.target.value })}
                        className="w-full px-4 py-2 bg-secondary text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder="email1@example.com, email2@example.com"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-6 border-t border-gray-200">
                    <ButtonGreen variant="primary" size="lg" className="flex-1" onClick={handleSubmitSchedule}>
                      Schedule & Send Confirmation
                    </ButtonGreen>
                    <ButtonGreen variant="secondary" size="lg" onClick={() => setView('list')}>
                      Cancel
                    </ButtonGreen>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
