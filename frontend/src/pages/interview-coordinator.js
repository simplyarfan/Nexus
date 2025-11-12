import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeIn, scaleIn } from '@/lib/motion';
import Button from '@/components/ui/Button';
import DateTimePicker from '@/components/ui/DateTimePicker';
import api from '@/utils/api';

export default function InterviewsPage() {
  const router = useRouter();
  const [view, setView] = useState('list');
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [outlookConnected, setOutlookConnected] = useState(false);
  const [outlookEmail, setOutlookEmail] = useState(null);
  const [checkingOutlook, setCheckingOutlook] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [interviews, setInterviews] = useState([]);
  const [loadingInterviews, setLoadingInterviews] = useState(true);

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
  });

  // Check Outlook connection status on mount
  useEffect(() => {
    const checkOutlookStatus = async () => {
      try {
        setCheckingOutlook(true);
        const response = await api.get('/auth/outlook/status');

        if (response.data.success) {
          setOutlookConnected(response.data.isConnected);
          setOutlookEmail(response.data.email);
        }
      } catch (error) {
        setOutlookConnected(false);
      } finally {
        setCheckingOutlook(false);
      }
    };

    checkOutlookStatus();
  }, []);

  // Load interviews from API
  useEffect(() => {
    const fetchInterviews = async () => {
      try {
        setLoadingInterviews(true);

        const response = await api.get('/interview-coordinator/interviews');

        setInterviews(response.data.data || []);
      } catch (error) {
        setInterviews([]);
      } finally {
        setLoadingInterviews(false);
      }
    };

    fetchInterviews();
  }, []);

  // Pre-fill form when coming from CV Intelligence
  useEffect(() => {
    // Check if router is ready and query params exist
    if (router.isReady && router.query.candidateName) {
      const batchName = router.query.batchName || '';
      const candidateName = router.query.candidateName || '';

      // Default email template
      const defaultEmailTemplate = `Dear ${candidateName},

Thank you for your interest in the ${batchName} position at our company.

We are impressed with your qualifications and would like to proceed with the next step in our hiring process. To schedule an interview, please fill out the availability form below:

[Google Form Link will be inserted here]

We look forward to speaking with you soon.

Best regards,
HR Team`;

      setAvailabilityForm({
        candidateName: candidateName,
        candidateEmail: router.query.candidateEmail || '',
        position: batchName,
        googleFormLink: '',
        emailSubject: `Interview Opportunity - ${batchName}`,
        emailContent: defaultEmailTemplate,
        ccEmails: '',
        bccEmails: '',
      });

      // Auto-switch to request availability view
      setView('request-availability');
    }
  }, [router.isReady, router.query]);

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
    const position = availabilityForm.position || '[Position]';
    const candidateName = availabilityForm.candidateName || '[Candidate Name]';

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

  const handleSubmitAvailabilityRequest = async () => {
    try {
      setIsSending(true);

      // Validation
      if (
        !availabilityForm.candidateName ||
        !availabilityForm.candidateEmail ||
        !availabilityForm.position
      ) {
        alert('Please fill in all required fields: Candidate Name, Email, and Position');
        setIsSending(false);
        return;
      }

      // Parse CC and BCC emails (convert comma-separated strings to arrays)
      const ccEmailsArray =
        availabilityForm.ccEmails && typeof availabilityForm.ccEmails === 'string'
          ? availabilityForm.ccEmails
              .split(',')
              .map((email) => email.trim())
              .filter((email) => email)
          : [];

      const bccEmailsArray =
        availabilityForm.bccEmails && typeof availabilityForm.bccEmails === 'string'
          ? availabilityForm.bccEmails
              .split(',')
              .map((email) => email.trim())
              .filter((email) => email)
          : [];

      // Make API call to send email
      const response = await api.post('/interview-coordinator/request-availability', {
        candidateName: availabilityForm.candidateName,
        candidateEmail: availabilityForm.candidateEmail,
        position: availabilityForm.position,
        googleFormLink: availabilityForm.googleFormLink,
        emailSubject: availabilityForm.emailSubject,
        emailContent: availabilityForm.emailContent,
        ccEmails: ccEmailsArray,
        bccEmails: bccEmailsArray,
      });

      console.log('Availability request response:', response.data);

      if (response.data.success || response.data.data) {
        alert('✅ Availability request sent successfully!');

        // Refresh interviews list
        const refreshResponse = await api.get('/interview-coordinator/interviews');
        setInterviews(refreshResponse.data.data || []);

        // Reset form and go back to list
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
        });
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to send email';
      alert(`❌ Error: ${errorMessage}`);
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmitSchedule = async () => {
    try {
      setIsSending(true);

      // Validation
      if (!scheduleForm.scheduledTime) {
        alert('Please select a date and time for the interview');
        setIsSending(false);
        return;
      }

      // Prepare form data for multipart/form-data (to support CV file upload)
      const formData = new FormData();
      formData.append('interviewId', selectedInterview.id);
      formData.append('interviewType', scheduleForm.interviewType);
      formData.append('scheduledTime', scheduleForm.scheduledTime);
      formData.append('duration', scheduleForm.duration);
      formData.append('platform', 'Microsoft Teams');
      formData.append('notes', scheduleForm.notes);

      // Parse CC and BCC emails (convert comma-separated strings to arrays)
      const ccEmailsArray =
        scheduleForm.ccEmails && typeof scheduleForm.ccEmails === 'string'
          ? scheduleForm.ccEmails
              .split(',')
              .map((email) => email.trim())
              .filter((email) => email)
          : [];
      const bccEmailsArray =
        scheduleForm.bccEmails && typeof scheduleForm.bccEmails === 'string'
          ? scheduleForm.bccEmails
              .split(',')
              .map((email) => email.trim())
              .filter((email) => email)
          : [];

      formData.append('ccEmails', JSON.stringify(ccEmailsArray));
      formData.append('bccEmails', JSON.stringify(bccEmailsArray));

      // Attach CV file if provided
      if (scheduleForm.cvFile) {
        formData.append('cvFile', scheduleForm.cvFile);
      }

      // Make API call to schedule interview
      const response = await api.post('/interview-coordinator/schedule-interview', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        alert('✅ Interview scheduled successfully! Confirmation email sent.');

        // Refresh interviews list
        const refreshResponse = await api.get('/interview-coordinator/interviews');
        setInterviews(refreshResponse.data.data || []);

        // Reset form and go back to list
        setView('list');
        setSelectedInterview(null);
        setScheduleForm({
          interviewType: 'technical',
          scheduledTime: '',
          duration: 60,
          notes: '',
          ccEmails: '',
          bccEmails: '',
          cvFile: null,
        });
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || 'Failed to schedule interview';
      alert(`❌ Error: ${errorMessage}`);
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteInterview = async (interviewId) => {
    if (
      !confirm(
        'Are you sure you want to delete this interview? This will also cancel the Teams meeting.',
      )
    ) {
      return;
    }

    try {
      const response = await api.delete(`/interview-coordinator/interview/${interviewId}`);

      if (response.data.success) {
        alert('✅ Interview deleted successfully');

        // Refresh interviews list
        const refreshResponse = await api.get('/interview-coordinator/interviews');
        setInterviews(refreshResponse.data.data || []);

        // Go back to list view
        setView('list');
        setSelectedInterview(null);
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || 'Failed to delete interview';
      alert(`❌ Error: ${errorMessage}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="mb-4">
            <a
              href="/dashboard"
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
            </a>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Interview Coordinator (HR-02)</h1>
              <p className="text-muted-foreground mt-1">
                Schedule and manage interviews efficiently
              </p>
            </div>
            <div className="flex gap-3">
              {view !== 'list' && (
                <Button variant="ghost" size="lg" onClick={() => setView('list')}>
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
                </Button>
              )}
              <Button variant="primary" size="lg" onClick={handleRequestAvailability}>
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Request Availability
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Outlook Connection Banner */}
      {!checkingOutlook && !outlookConnected && (
        <div className="bg-yellow-500/10 border-l-4 border-yellow-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-start">
              <svg
                className="w-6 h-6 text-yellow-500 mr-3 mt-0.5"
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
              <div className="flex-1">
                <h3 className="text-sm font-medium text-yellow-500">Outlook Not Connected</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  To send interview emails, you need to connect your company Outlook account (@
                  {process.env.NEXT_PUBLIC_COMPANY_DOMAIN}). This is a one-time setup.
                </p>
                <button
                  onClick={() => (window.location.href = '/api/auth/outlook/auth')}
                  className="mt-3 inline-flex items-center px-4 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-600 transition-colors font-medium text-sm"
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
                      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                    />
                  </svg>
                  Connect Outlook Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Outlook Connected Status */}
      {!checkingOutlook && outlookConnected && (
        <div className="bg-green-500/10 border-l-4 border-green-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 text-green-500 mr-2"
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
              <p className="text-sm text-green-500 font-medium">
                Outlook Connected: {outlookEmail}
              </p>
            </div>
          </div>
        </div>
      )}

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

                {loadingInterviews ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  </div>
                ) : interviews.length === 0 ? (
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
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      No interviews yet
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      Start by requesting availability from a candidate
                    </p>
                    <Button variant="primary" onClick={() => setView('request-availability')}>
                      Request Availability
                    </Button>
                  </div>
                ) : (
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
                              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold">
                                {interview.candidateName &&
                                typeof interview.candidateName === 'string'
                                  ? interview.candidateName
                                      .split(' ')
                                      .map((n) => n[0])
                                      .join('')
                                  : 'N/A'}
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
                                <p className="text-xs text-muted-foreground mb-1">Scheduled Time</p>
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
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleScheduleInterview(interview)}
                            >
                              Schedule Interview
                            </Button>
                          )}
                          {interview.status === 'scheduled' && interview.meetingLink && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => window.open(interview.meetingLink, '_blank')}
                            >
                              Join Meeting
                            </Button>
                          )}
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleViewDetails(interview)}
                          >
                            View Details
                          </Button>
                          {interview.status === 'scheduled' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => alert('Reschedule functionality coming soon')}
                            >
                              Reschedule
                            </Button>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
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
                    <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-2xl font-bold">
                      {selectedInterview.candidateName &&
                      typeof selectedInterview.candidateName === 'string'
                        ? selectedInterview.candidateName
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                        : 'N/A'}
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
                  <h3 className="text-lg font-semibold text-foreground mb-4">Interview Progress</h3>
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
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={() => handleScheduleInterview(selectedInterview)}
                    >
                      Schedule Interview
                    </Button>
                  )}
                  {selectedInterview.status === 'scheduled' && (
                    <>
                      {selectedInterview.meetingLink && (
                        <Button
                          variant="primary"
                          size="lg"
                          onClick={() => window.open(selectedInterview.meetingLink, '_blank')}
                        >
                          Join Meeting
                        </Button>
                      )}
                      <Button
                        variant="secondary"
                        size="lg"
                        onClick={() => alert('Reschedule functionality coming soon')}
                      >
                        Reschedule
                      </Button>
                      <Button
                        variant="secondary"
                        size="lg"
                        onClick={() => alert('Interview marked')}
                      >
                        Mark
                      </Button>
                    </>
                  )}
                  {selectedInterview.status === 'completed' && (
                    <>
                      <Button variant="primary" size="lg" onClick={() => alert('Candidate marked')}>
                        Mark
                      </Button>
                      <Button variant="ghost" size="lg" onClick={() => alert('Candidate marked')}>
                        Mark
                      </Button>
                    </>
                  )}
                  <Button
                    variant="ghost"
                    size="lg"
                    onClick={() => handleDeleteInterview(selectedInterview.id)}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    Delete Interview
                  </Button>
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
                <h2 className="text-2xl font-bold text-foreground mb-2">Request Availability</h2>
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
                        setAvailabilityForm({ ...availabilityForm, googleFormLink: e.target.value })
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
                        setAvailabilityForm({ ...availabilityForm, emailSubject: e.target.value })
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
                        setAvailabilityForm({ ...availabilityForm, emailContent: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-secondary text-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring font-mono text-sm"
                      placeholder="Custom email content (optional - will use default template if empty)"
                    />
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
                          setAvailabilityForm({ ...availabilityForm, bccEmails: e.target.value })
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
                    <Button
                      variant="primary"
                      size="lg"
                      className="flex-1"
                      onClick={handleSubmitAvailabilityRequest}
                      isLoading={isSending}
                      disabled={isSending}
                    >
                      {isSending ? 'Sending...' : 'Send Request'}
                    </Button>
                    <Button
                      variant="secondary"
                      size="lg"
                      onClick={() => setView('list')}
                      disabled={isSending}
                    >
                      Cancel
                    </Button>
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
                          setScheduleForm({ ...scheduleForm, duration: parseInt(e.target.value) })
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

                  <div className="bg-accent border border-border rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                        <svg
                          className="w-6 h-6 text-primary-foreground"
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
                    <div className="border-2 border-dashed border-border rounded-lg p-6 bg-secondary hover:bg-accent transition-colors">
                      <input
                        type="file"
                        id="schedule-cv-upload"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
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
                              className="text-xs text-destructive hover:opacity-80 mt-2"
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
                      onChange={(e) => setScheduleForm({ ...scheduleForm, notes: e.target.value })}
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
                    <Button
                      variant="primary"
                      size="lg"
                      className="flex-1"
                      onClick={handleSubmitSchedule}
                      isLoading={isSending}
                      disabled={isSending}
                    >
                      {isSending ? 'Scheduling...' : 'Schedule & Send Confirmation'}
                    </Button>
                    <Button variant="secondary" size="lg" onClick={() => setView('list')}>
                      Cancel
                    </Button>
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
