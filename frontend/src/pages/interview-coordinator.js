import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeIn, scaleIn } from '../lib/motion';
import ButtonGreen from '../components/ui/ButtonGreen';
import DateTimePicker from '../components/ui/DateTimePicker';
import DashboardLayout from '../components/layout/DashboardLayout';

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
    cvFile: null,
  });

  // Schedule Interview Form (Stage 2)
  const [scheduleForm, setScheduleForm] = useState({
    interviewType: 'technical',
    scheduledTime: '',
    duration: 60,
    notes: '',
    ccEmails: '',
    bccEmails: '',
    cvFile: null,
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
      duration: 60,
      meetingLink: 'https://teams.microsoft.com/meet/xyz',
      interviewType: 'Technical',
      workflow: [
        {
          stage: 'initial_email',
          timestamp: '2024-12-05T09:00:00',
          details: 'Initial availability request sent',
        },
        {
          stage: 'awaiting_response',
          timestamp: '2024-12-05T09:00:00',
          details: 'Waiting for candidate response',
        },
        {
          stage: 'scheduled',
          timestamp: '2024-12-06T14:30:00',
          details: 'Interview scheduled via Microsoft Teams',
        },
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
        {
          stage: 'initial_email',
          timestamp: '2024-12-04T10:00:00',
          details: 'Initial availability request sent',
        },
        {
          stage: 'awaiting_response',
          timestamp: '2024-12-04T10:00:00',
          details: 'Waiting for candidate response',
        },
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
      duration: 45,
      interviewType: 'Cultural Fit',
      workflow: [
        {
          stage: 'initial_email',
          timestamp: '2024-12-01T09:00:00',
          details: 'Initial availability request sent',
        },
        {
          stage: 'awaiting_response',
          timestamp: '2024-12-01T09:00:00',
          details: 'Waiting for candidate response',
        },
        {
          stage: 'scheduled',
          timestamp: '2024-12-02T11:00:00',
          details: 'Interview scheduled via Microsoft Teams',
        },
        {
          stage: 'completed',
          timestamp: '2024-12-03T14:45:00',
          details: 'Interview completed successfully',
        },
      ],
    },
  ];

  const stats = [
    { label: 'Total Interviews', value: interviews.length, color: 'text-primary' },
    {
      label: 'Awaiting Response',
      value: interviews.filter((i) => i.status === 'awaiting_response').length,
      color: 'text-muted-foreground',
    },
    {
      label: 'Scheduled',
      value: interviews.filter((i) => i.status === 'scheduled').length,
      color: 'text-ring',
    },
    {
      label: 'Completed',
      value: interviews.filter((i) => i.status === 'completed').length,
      color: 'text-primary',
    },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'awaiting_response':
        return 'bg-muted text-muted-foreground';
      case 'scheduled':
        return 'bg-accent text-primary';
      case 'completed':
        return 'bg-accent text-ring';
      case 'rejected':
        return 'bg-accent text-destructive';
      case 'cancelled':
        return 'bg-accent text-destructive';
      default:
        return 'bg-accent text-foreground';
    }
  };

  const getStageIcon = (stage) => {
    switch (stage) {
      case 'initial_email':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        );
      case 'awaiting_response':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case 'scheduled':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        );
      case 'completed':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case 'rejected':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
    }
  };

  const getStageColor = (stage) => {
    switch (stage) {
      case 'initial_email':
        return 'bg-accent text-primary border-primary';
      case 'awaiting_response':
        return 'bg-accent text-muted-foreground border-muted-foreground';
      case 'scheduled':
        return 'bg-accent text-ring border-ring';
      case 'completed':
        return 'bg-accent text-ring border-ring';
      case 'rejected':
        return 'bg-accent text-destructive border-destructive';
      default:
        return 'bg-accent text-foreground border-border';
    }
  };

  const getStageName = (stage) => {
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
    const position = availabilityForm.position || '';
    const candidateName = availabilityForm.candidateName || '';

    setAvailabilityForm((prev) => ({
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
      cvFile: null,
    });
  };

  const handleSubmitSchedule = () => {
    console.log('Scheduling interview:', scheduleForm);
    // Here you would make API call to schedule interview + create Teams meeting
    setView('list');
    setScheduleForm({
      interviewType: 'technical',
      scheduledTime: '',
      duration: 60,
      notes: '',
      ccEmails: '',
      bccEmails: '',
    });
  };

  return (
    <>
      <Head>
        <title>Interview Coordinator | Nexus</title>
        <meta name="description" content="Schedule and manage interviews efficiently" />
      </Head>
      <DashboardLayout>
        <div className="min-h-screen bg-background">
          {/* Header */}
          <div className="border-b border-border bg-card">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="mb-4">
                <button
                  onClick={() => router.push('/')}
                  className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <svg
                    className="w-4 h-4 mr-2"
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
                  Back to Dashboard
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-foreground">
                    Interview Coordinator (HR-02)
                  </h1>
                  <p className="text-muted-foreground mt-1">
                    Schedule and manage interviews efficiently
                  </p>
                </div>
                <div className="flex gap-3">
                  {view !== 'list' && (
                    <ButtonGreen variant="ghost" size="lg" onClick={() => setView('list')}>
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
                      Back to List
                    </ButtonGreen>
                  )}
                  <ButtonGreen variant="primary" size="lg" onClick={handleRequestAvailability}>
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
                        d="M12 4v16m8-8H4"
                      />
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
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-card border border-border rounded-2xl p-6"
                      >
                        <p className="text-sm text-muted-foreground mb-2">{stat.label}</p>
                        <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                      </motion.div>
                    ))}
                  </div>

                  {/* Interviews List */}
                  <div>
                    <h2 className="text-2xl font-bold text-foreground mb-6">All Interviews</h2>
                    <div className="space-y-4">
                      {interviews.map((interview, index) => (
                        <motion.div
                          key={interview.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 + index * 0.1 }}
                          className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-shadow"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
                                  {interview.candidateName
                                    .split(' ')
                                    .map((n) => n[0])
                                    .join('')}
                                </div>
                                <div>
                                  <h3 className="text-lg font-semibold text-foreground">
                                    {interview.candidateName}
                                  </h3>
                                  <p className="text-sm text-muted-foreground">
                                    {interview.position}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <span
                              className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(interview.status)}`}
                            >
                              {interview.status.replace('_', ' ')}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Request Sent</p>
                              <p className="text-sm font-medium text-foreground">
                                {new Date(interview.createdDate).toLocaleDateString()}
                              </p>
                            </div>
                            {interview.scheduledTime && (
                              <>
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">
                                    Scheduled Time
                                  </p>
                                  <p className="text-sm font-medium text-foreground">
                                    {new Date(interview.scheduledTime).toLocaleString()}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">Duration</p>
                                  <p className="text-sm font-medium text-foreground">
                                    {interview.duration} minutes
                                  </p>
                                </div>
                              </>
                            )}
                            {interview.interviewType && (
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Interview Type</p>
                                <p className="text-sm font-medium text-foreground">
                                  {interview.interviewType}
                                </p>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-3">
                            {interview.status === 'awaiting_response' && (
                              <ButtonGreen
                                variant="primary"
                                size="sm"
                                onClick={() => handleScheduleInterview(interview)}
                              >
                                Schedule Interview
                              </ButtonGreen>
                            )}
                            {interview.status === 'scheduled' && interview.meetingLink && (
                              <ButtonGreen
                                variant="primary"
                                size="sm"
                                onClick={() => window.open(interview.meetingLink, '_blank')}
                              >
                                Join Meeting
                              </ButtonGreen>
                            )}
                            <ButtonGreen
                              variant="secondary"
                              size="sm"
                              onClick={() => handleViewDetails(interview)}
                            >
                              View Details
                            </ButtonGreen>
                            {interview.status === 'scheduled' && (
                              <ButtonGreen
                                variant="ghost"
                                size="sm"
                                onClick={() => alert('Reschedule functionality coming soon')}
                              >
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
                  <div className="bg-card border border-border rounded-2xl p-8">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-6 pb-6 border-b border-border">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white text-2xl font-bold">
                          {selectedInterview.candidateName
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-foreground">
                            {selectedInterview.candidateName}
                          </h2>
                          <p className="text-muted-foreground">{selectedInterview.position}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {selectedInterview.candidateEmail}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedInterview.status)}`}
                      >
                        {selectedInterview.status.replace('_', ' ')}
                      </span>
                    </div>

                    {/* Interview Details */}
                    {selectedInterview.scheduledTime && (
                      <div className="mb-6 pb-6 border-b border-border">
                        <h3 className="text-lg font-semibold text-foreground mb-4">
                          Interview Details
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Scheduled Time</p>
                            <p className="text-sm font-medium text-foreground">
                              {new Date(selectedInterview.scheduledTime).toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Duration</p>
                            <p className="text-sm font-medium text-foreground">
                              {selectedInterview.duration} minutes
                            </p>
                          </div>
                          {selectedInterview.interviewType && (
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Interview Type</p>
                              <p className="text-sm font-medium text-foreground">
                                {selectedInterview.interviewType}
                              </p>
                            </div>
                          )}
                          {selectedInterview.meetingLink && (
                            <div className="col-span-2 md:col-span-3">
                              <p className="text-xs text-muted-foreground mb-1">Meeting Link</p>
                              <a
                                href={selectedInterview.meetingLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-medium text-primary hover:opacity-80 transition-opacity"
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
                      <h3 className="text-lg font-semibold text-foreground mb-4">
                        Interview Progress
                      </h3>
                      <div className="space-y-4">
                        {selectedInterview.workflow?.map((stage, index) => (
                          <div key={index} className="flex gap-4">
                            <div
                              className={`w-10 h-10 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${getStageColor(stage.stage)}`}
                            >
                              {getStageIcon(stage.stage)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <h4 className="font-semibold text-foreground">
                                  {getStageName(stage.stage)}
                                </h4>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(stage.timestamp).toLocaleString()}
                                </span>
                              </div>
                              {stage.details && (
                                <p className="text-sm text-muted-foreground">{stage.details}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3 pt-6 border-t border-border">
                      {selectedInterview.status === 'awaiting_response' && (
                        <ButtonGreen
                          variant="primary"
                          size="lg"
                          onClick={() => handleScheduleInterview(selectedInterview)}
                        >
                          Schedule Interview
                        </ButtonGreen>
                      )}
                      {selectedInterview.status === 'scheduled' && (
                        <>
                          {selectedInterview.meetingLink && (
                            <ButtonGreen
                              variant="primary"
                              size="lg"
                              onClick={() => window.open(selectedInterview.meetingLink, '_blank')}
                            >
                              Join Meeting
                            </ButtonGreen>
                          )}
                          <ButtonGreen
                            variant="secondary"
                            size="lg"
                            onClick={() => alert('Reschedule functionality coming soon')}
                          >
                            Reschedule
                          </ButtonGreen>
                          <ButtonGreen
                            variant="secondary"
                            size="lg"
                            onClick={() => alert('Interview marked as completed')}
                          >
                            Mark as Completed
                          </ButtonGreen>
                        </>
                      )}
                      {selectedInterview.status === 'completed' && (
                        <>
                          <ButtonGreen
                            variant="primary"
                            size="lg"
                            onClick={() => alert('Candidate marked as selected')}
                          >
                            Mark as Selected
                          </ButtonGreen>
                          <ButtonGreen
                            variant="ghost"
                            size="lg"
                            onClick={() => alert('Candidate marked as rejected')}
                          >
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
                  <div className="bg-card border border-border rounded-2xl p-8">
                    <h2 className="text-2xl font-bold text-foreground mb-2">
                      Request Availability
                    </h2>
                    <p className="text-muted-foreground mb-6">
                      Send an email to the candidate requesting their available time slots
                    </p>

                    <div className="space-y-6">
                      {/* Candidate Information */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Candidate Name *
                          </label>
                          <input
                            type="text"
                            value={availabilityForm.candidateName}
                            onChange={(e) =>
                              setAvailabilityForm({
                                ...availabilityForm,
                                candidateName: e.target.value,
                              })
                            }
                            className="w-full px-4 py-2 bg-secondary text-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                            placeholder="e.g., John Smith"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Email *
                          </label>
                          <input
                            type="email"
                            value={availabilityForm.candidateEmail}
                            onChange={(e) =>
                              setAvailabilityForm({
                                ...availabilityForm,
                                candidateEmail: e.target.value,
                              })
                            }
                            className="w-full px-4 py-2 bg-secondary text-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                            placeholder="candidate@example.com"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Position *
                        </label>
                        <input
                          type="text"
                          value={availabilityForm.position}
                          onChange={(e) =>
                            setAvailabilityForm({ ...availabilityForm, position: e.target.value })
                          }
                          className="w-full px-4 py-2 bg-secondary text-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                          placeholder="e.g., Senior Full Stack Developer"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Google Form Link (Optional)
                        </label>
                        <input
                          type="url"
                          value={availabilityForm.googleFormLink}
                          onChange={(e) =>
                            setAvailabilityForm({
                              ...availabilityForm,
                              googleFormLink: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 bg-secondary text-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                          placeholder="https://forms.google.com/..."
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Will be inserted into email template
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Email Subject
                        </label>
                        <input
                          type="text"
                          value={availabilityForm.emailSubject}
                          onChange={(e) =>
                            setAvailabilityForm({
                              ...availabilityForm,
                              emailSubject: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 bg-secondary text-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                          placeholder="Interview Opportunity - [Position]"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Email Content
                        </label>
                        <textarea
                          rows={10}
                          value={availabilityForm.emailContent}
                          onChange={(e) =>
                            setAvailabilityForm({
                              ...availabilityForm,
                              emailContent: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 bg-secondary text-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring font-mono text-sm"
                          placeholder="Custom email content (optional - will use default template if empty)"
                        />
                      </div>

                      {/* CV Upload */}
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Attach CV (Optional)
                        </label>
                        <div className="border-2 border-dashed border-border rounded-lg p-6 bg-secondary hover:bg-secondary/80 transition-colors">
                          <input
                            type="file"
                            id="cv-upload"
                            accept=".pdf,.doc,.docx"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              setAvailabilityForm({ ...availabilityForm, cvFile: file });
                            }}
                            className="hidden"
                          />
                          <label
                            htmlFor="cv-upload"
                            className="flex flex-col items-center cursor-pointer"
                          >
                            <svg
                              className="w-12 h-12 text-muted-foreground mb-3"
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
                            {availabilityForm.cvFile ? (
                              <div className="text-center">
                                <p className="text-sm font-medium text-foreground">
                                  {availabilityForm.cvFile.name}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {(availabilityForm.cvFile.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setAvailabilityForm({ ...availabilityForm, cvFile: null });
                                  }}
                                  className="text-xs text-red-600 hover:opacity-80 mt-2"
                                >
                                  Remove file
                                </button>
                              </div>
                            ) : (
                              <div className="text-center">
                                <p className="text-sm font-medium text-foreground">
                                  Click to upload CV
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  PDF, DOC, or DOCX (Max 10MB)
                                </p>
                              </div>
                            )}
                          </label>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Attach the candidate&apos;s CV to the email
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            CC (Optional)
                          </label>
                          <input
                            type="text"
                            value={availabilityForm.ccEmails}
                            onChange={(e) =>
                              setAvailabilityForm({ ...availabilityForm, ccEmails: e.target.value })
                            }
                            className="w-full px-4 py-2 bg-secondary text-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                            placeholder="email1@example.com, email2@example.com"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Comma-separated email addresses
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            BCC (Optional)
                          </label>
                          <input
                            type="text"
                            value={availabilityForm.bccEmails}
                            onChange={(e) =>
                              setAvailabilityForm({
                                ...availabilityForm,
                                bccEmails: e.target.value,
                              })
                            }
                            className="w-full px-4 py-2 bg-secondary text-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                            placeholder="email1@example.com, email2@example.com"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Comma-separated email addresses
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-3 pt-6 border-t border-border">
                        <ButtonGreen
                          variant="primary"
                          size="lg"
                          className="flex-1"
                          onClick={handleSubmitAvailabilityRequest}
                        >
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
                  <div className="bg-card border border-border rounded-2xl p-8">
                    <h2 className="text-2xl font-bold text-foreground mb-2">Schedule Interview</h2>
                    <p className="text-muted-foreground mb-6">
                      Schedule interview for{' '}
                      <span className="font-semibold text-foreground">
                        {selectedInterview.candidateName}
                      </span>{' '}
                      - {selectedInterview.position}
                    </p>

                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Interview Type
                          </label>
                          <select
                            value={scheduleForm.interviewType}
                            onChange={(e) =>
                              setScheduleForm({ ...scheduleForm, interviewType: e.target.value })
                            }
                            className="w-full px-4 py-2 bg-secondary text-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                          >
                            <option value="technical">Technical</option>
                            <option value="behavioral">Behavioral</option>
                            <option value="cultural">Cultural Fit</option>
                            <option value="final">Final Round</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Duration (minutes)
                          </label>
                          <select
                            value={scheduleForm.duration}
                            onChange={(e) =>
                              setScheduleForm({ ...scheduleForm, duration: e.target.value })
                            }
                            className="w-full px-4 py-2 bg-secondary text-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                          >
                            <option value={30}>30 minutes</option>
                            <option value={45}>45 minutes</option>
                            <option value={60}>1 hour</option>
                            <option value={90}>1.5 hours</option>
                            <option value={120}>2 hours</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <DateTimePicker
                          label="Scheduled Date & Time"
                          value={scheduleForm.scheduledTime}
                          onChange={(value) =>
                            setScheduleForm({ ...scheduleForm, scheduledTime: value })
                          }
                          required
                        />
                      </div>

                      <div className="bg-primary/10 border border-primary rounded-lg p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                            <svg
                              className="w-6 h-6 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                              />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-foreground">Microsoft Teams</p>
                            <p className="text-sm text-muted-foreground">
                              Meeting link will be automatically generated
                            </p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Attach CV (Optional)
                        </label>
                        <div className="border-2 border-dashed border-border rounded-lg p-6 bg-secondary hover:bg-secondary/80 transition-colors">
                          <input
                            type="file"
                            id="schedule-cv-upload"
                            accept=".pdf,.doc,.docx"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              setScheduleForm({ ...scheduleForm, cvFile: file });
                            }}
                            className="hidden"
                          />
                          <label
                            htmlFor="schedule-cv-upload"
                            className="flex flex-col items-center cursor-pointer"
                          >
                            <svg
                              className="w-12 h-12 text-muted-foreground mb-3"
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
                            {scheduleForm.cvFile ? (
                              <div className="text-center">
                                <p className="text-sm font-medium text-foreground">
                                  {scheduleForm.cvFile.name}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {(scheduleForm.cvFile.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setScheduleForm({ ...scheduleForm, cvFile: null });
                                  }}
                                  className="text-xs text-red-600 hover:opacity-80 mt-2"
                                >
                                  Remove file
                                </button>
                              </div>
                            ) : (
                              <div className="text-center">
                                <p className="text-sm font-medium text-foreground">
                                  Click to upload CV
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  PDF, DOC, or DOCX (Max 10MB)
                                </p>
                              </div>
                            )}
                          </label>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Attach the candidate&apos;s CV to the interview confirmation email
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Notes (Optional)
                        </label>
                        <textarea
                          rows={4}
                          value={scheduleForm.notes}
                          onChange={(e) =>
                            setScheduleForm({ ...scheduleForm, notes: e.target.value })
                          }
                          className="w-full px-4 py-2 bg-secondary text-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                          placeholder="Additional notes or preparation instructions for the candidate..."
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            CC (Optional)
                          </label>
                          <input
                            type="text"
                            value={scheduleForm.ccEmails}
                            onChange={(e) =>
                              setScheduleForm({ ...scheduleForm, ccEmails: e.target.value })
                            }
                            className="w-full px-4 py-2 bg-secondary text-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                            placeholder="email1@example.com, email2@example.com"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            BCC (Optional)
                          </label>
                          <input
                            type="text"
                            value={scheduleForm.bccEmails}
                            onChange={(e) =>
                              setScheduleForm({ ...scheduleForm, bccEmails: e.target.value })
                            }
                            className="w-full px-4 py-2 bg-secondary text-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                            placeholder="email1@example.com, email2@example.com"
                          />
                        </div>
                      </div>

                      <div className="flex gap-3 pt-6 border-t border-border">
                        <ButtonGreen
                          variant="primary"
                          size="lg"
                          className="flex-1"
                          onClick={handleSubmitSchedule}
                        >
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
      </DashboardLayout>
    </>
  );
}
