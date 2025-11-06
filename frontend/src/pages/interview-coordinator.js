import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Calendar, Plus, User, ArrowLeft, Search, X, Mail, AlertCircle } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import DateTimePicker from '../components/ui/DateTimePicker';

const InterviewCoordinator = () => {
  const { user, logout, getAuthHeaders } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [interviews, setInterviews] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [showOutlookPrompt, setShowOutlookPrompt] = useState(false);
  const [outlookConnected, setOutlookConnected] = useState(false);

  // Form states
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

  // Load default email template when modal opens
  const loadDefaultEmailTemplate = (candidateName, position) => {
    const defaultSubject = `Interview Opportunity - ${position}`;
    const defaultContent = `Dear ${candidateName},

We are pleased to inform you that we have shortlisted you for an interview for the ${position} position at our company.

We need some details prior to the interview, which you can fill in the following Google Form: [Google Form Link will be inserted here]

Additionally, please mention what time would you be available for a meeting?

We look forward to hearing from you soon.

Best regards,
[Your Company Name]`;

    setAvailabilityForm((prev) => ({
      ...prev,
      emailSubject: defaultSubject,
      emailContent: defaultContent,
    }));
  };

  const [scheduleForm, setScheduleForm] = useState({
    interviewType: 'technical',
    scheduledTime: '',
    duration: 60,
    platform: 'Microsoft Teams',
    notes: '',
    ccEmails: '',
    bccEmails: '',
    cvFile: null,
  });

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    // Check if Outlook is connected
    checkOutlookConnection();

    fetchInterviews();

    // Handle pre-filled data from CV Intelligence
    if (router.query.action === 'request-availability') {
      const { candidateName, candidateEmail, position } = router.query;
      if (candidateName && candidateEmail && position) {
        setAvailabilityForm((prev) => ({
          ...prev,
          candidateName: candidateName,
          candidateEmail: candidateEmail,
          position: position,
        }));
        // Load template with the pre-filled data
        loadDefaultEmailTemplate(candidateName, position);
        // Open the modal
        setShowAvailabilityModal(true);
      }
    }
  }, [user, router.query]);

  const checkOutlookConnection = async () => {
    try {
      // Use the user object from AuthContext which comes from /api/auth/check
      // This endpoint now includes outlook_connected and outlook_email fields
      console.log('Checking Outlook connection from user context:', user);
      console.log('outlook_connected field:', user?.outlook_connected);
      console.log('outlook_email field:', user?.outlook_email);

      // Check for outlook_connected flag (boolean) or outlook_email (string)
      const isConnected = user?.outlook_connected || user?.outlook_email;

      if (isConnected) {
        console.log('✅ Outlook is connected');
        setOutlookConnected(true);
        setShowOutlookPrompt(false);
      } else {
        console.log('❌ Outlook is NOT connected');
        setOutlookConnected(false);
        setShowOutlookPrompt(true);
      }
    } catch (error) {
      console.error('Failed to check Outlook connection:', error);
      setOutlookConnected(false);
      setShowOutlookPrompt(true);
    } finally {
      setLoading(false);
    }
  };

  const connectOutlook = () => {
    // Redirect to profile with email tab open
    router.push('/profile?tab=email');
  };

  const fetchInterviews = async () => {
    try {
      setLoading(true);
      const headers = getAuthHeaders();

      if (!headers) {
        console.log('No auth headers available, skipping fetch');
        setLoading(false);
        return;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL + '/api';
      const response = await axios.get(`${API_URL}/interview-coordinator/interviews`, { headers });

      if (response.data?.success) {
        setInterviews(response.data.data || []);
      } else {
        console.error('API response not successful:', response.data);
        setInterviews([]);
      }
    } catch (error) {
      console.error('Failed to load interviews:', error);
      if (error.response?.status === 401) {
        console.log('Authentication failed - token may be invalid');
        toast.error('Session expired. Please log in again.');
        // Don't redirect here, let the interceptor handle it
      } else if (error.response?.status === 404) {
        console.log('Interview coordinator endpoint not found');
        toast.error('Interview coordinator service unavailable');
      } else {
        toast.error('Failed to load interviews');
      }
      setInterviews([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAvailability = async () => {
    try {
      setLoading(true);
      const headers = getAuthHeaders();

      const payload = {
        ...availabilityForm,
        ccEmails: availabilityForm.ccEmails
          .split(',')
          .map((e) => e.trim())
          .filter(Boolean),
        bccEmails: availabilityForm.bccEmails
          .split(',')
          .map((e) => e.trim())
          .filter(Boolean),
      };

      const API_URL = process.env.NEXT_PUBLIC_API_URL + '/api';
      const response = await axios.post(
        `${API_URL}/interview-coordinator/request-availability`,
        payload,
        { headers },
      );

      if (response.data?.success) {
        toast.success(response.data.message || 'Availability request created successfully!');
        setShowAvailabilityModal(false);
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
        fetchInterviews();
      } else {
        toast.error(response.data?.message || 'Failed to create availability request');
      }
    } catch (error) {
      console.error('Availability request error:', error);
      const errorMessage =
        error.response?.data?.message || error.message || 'Failed to send availability request';

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleInterview = async () => {
    try {
      setLoading(true);
      const headers = getAuthHeaders();

      // Create FormData for multipart upload
      const formData = new FormData();
      formData.append('interviewId', selectedInterview.id);
      formData.append('interviewType', scheduleForm.interviewType);
      formData.append('scheduledTime', scheduleForm.scheduledTime);
      formData.append('duration', scheduleForm.duration);
      formData.append('platform', scheduleForm.platform);
      formData.append('notes', scheduleForm.notes);
      formData.append(
        'ccEmails',
        JSON.stringify(
          scheduleForm.ccEmails
            ? scheduleForm.ccEmails
                .split(',')
                .map((e) => e.trim())
                .filter(Boolean)
            : [],
        ),
      );
      formData.append(
        'bccEmails',
        JSON.stringify(
          scheduleForm.bccEmails
            ? scheduleForm.bccEmails
                .split(',')
                .map((e) => e.trim())
                .filter(Boolean)
            : [],
        ),
      );

      // Add CV file if selected
      if (scheduleForm.cvFile) {
        formData.append('cvFile', scheduleForm.cvFile);
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL + '/api';
      const response = await axios.post(
        `${API_URL}/interview-coordinator/schedule-interview`,
        formData,
        {
          headers: {
            ...headers,
            'Content-Type': 'multipart/form-data',
          },
        },
      );

      if (response.data?.success) {
        toast.success('Interview scheduled successfully!');
        setShowScheduleModal(false);
        setSelectedInterview(null);
        setScheduleForm({
          interviewType: 'technical',
          scheduledTime: '',
          duration: 60,
          platform: 'Microsoft Teams',
          notes: '',
          ccEmails: '',
          bccEmails: '',
          cvFile: null,
        });
        fetchInterviews();
      } else {
        toast.error(response.data?.message || 'Failed to schedule interview');
      }
    } catch (error) {
      console.error('Schedule interview error:', error);
      console.error('Error response:', error.response?.data);
      const errorMsg =
        error.response?.data?.message || error.message || 'Failed to schedule interview';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const updateInterviewStatus = async (interviewId, status, outcome = null) => {
    try {
      const headers = getAuthHeaders();
      const API_URL = process.env.NEXT_PUBLIC_API_URL + '/api';
      await axios.put(
        `${API_URL}/interview-coordinator/interview/${interviewId}/status`,
        { status, outcome },
        { headers },
      );

      toast.success('Status updated successfully!');
      fetchInterviews();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const downloadCalendar = async (interviewId, candidateName) => {
    try {
      const headers = getAuthHeaders();
      const API_URL = process.env.NEXT_PUBLIC_API_URL + '/api';

      const response = await axios.get(
        `${API_URL}/interview-coordinator/interview/${interviewId}/calendar`,
        { headers, responseType: 'blob' },
      );

      const blob = new Blob([response.data], { type: 'text/calendar' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `interview-${candidateName.replace(/\s+/g, '-')}.ics`;
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success('Calendar file downloaded! Add it to your calendar app.');
    } catch (error) {
      console.error('Calendar download error:', error);
      toast.error('Failed to download calendar');
    }
  };

  const deleteInterview = async (interviewId) => {
    if (!confirm('Are you sure you want to delete this interview?')) {
      return;
    }

    try {
      const headers = getAuthHeaders();
      const API_URL = process.env.NEXT_PUBLIC_API_URL + '/api';

      await axios.delete(`${API_URL}/interview-coordinator/interview/${interviewId}`, { headers });

      toast.success('Interview deleted successfully!');
      fetchInterviews();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete interview');
    }
  };

  const filteredInterviews = interviews.filter((interview) => {
    const matchesSearch =
      interview.candidate_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      interview.job_title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || interview.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status, outcome) => {
    const statusConfig = {
      awaiting_response: { color: 'bg-yellow-100 text-yellow-800', text: 'Awaiting Response' },
      scheduled: { color: 'bg-blue-100 text-blue-800', text: 'Scheduled' },
      completed: {
        color: 'bg-green-100 text-green-800',
        text:
          outcome === 'selected' ? 'Selected' : outcome === 'rejected' ? 'Rejected' : 'Completed',
      },
      cancelled: { color: 'bg-red-100 text-red-800', text: 'Cancelled' },
    };

    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', text: status };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  if (!user) return null;

  // Block access if Outlook is not connected
  if (!outlookConnected && !loading) {
    return (
      <>
        <Head>
          <title>Interview Coordinator - Enterprise AI Platform</title>
        </Head>
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <div className="bg-white rounded-2xl shadow-xl border border-orange-100 p-8">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Mail className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-3">
                  Connect Your Outlook Account
                </h1>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  To use the Interview Coordinator and send interview invitations with Microsoft Teams
                  links, you need to connect your Outlook email account first.
                </p>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-orange-800 text-left">
                      <p className="font-medium mb-1">Why is this required?</p>
                      <p className="text-orange-700">
                        We need your Outlook account to send emails with Microsoft Teams meeting links,
                        calendar invites, and manage interview schedules on your behalf.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <button
                    onClick={connectOutlook}
                    className="w-full inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <Mail className="w-5 h-5 mr-2" />
                    Connect Outlook Account
                  </button>
                  <button
                    onClick={() => router.push('/')}
                    className="w-full inline-flex items-center justify-center px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Go Back Home
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Interview Coordinator - Enterprise AI Platform</title>
      </Head>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push('/')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-semibold text-gray-900">Interview Coordinator</h1>
                    <p className="text-sm text-gray-500">Multi-stage interview workflow</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowAvailabilityModal(true)}
                  className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white px-4 py-2 rounded-lg inline-flex items-center text-sm font-medium transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Request Availability
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Search and Filters */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search candidates or positions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="awaiting_response">Awaiting Response</option>
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Interviews List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading interviews...</p>
            </div>
          ) : filteredInterviews.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No interviews found</h3>
              <p className="text-gray-600 mb-4">Start by requesting availability from candidates</p>
              <button
                onClick={() => setShowAvailabilityModal(true)}
                className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
              >
                Request Availability
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Candidate
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Position
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Scheduled Time
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {filteredInterviews.map((interview) => (
                      <tr
                        key={interview.id}
                        className="border-b border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => router.push(`/interview-coordinator/${interview.id}`)}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-start space-x-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center flex-shrink-0">
                              <User className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-semibold text-gray-900">
                                {interview.candidate_name}
                              </div>
                              <div className="text-sm text-gray-600">
                                {interview.candidate_email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {interview.job_title}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {interview.interview_type && `${interview.interview_type} interview`}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-2">
                            {getStatusBadge(interview.status, interview.outcome)}
                            {interview.meeting_link && (
                              <div className="text-xs text-blue-600 truncate max-w-[200px]">
                                <a
                                  href={interview.meeting_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="hover:underline"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {interview.platform || 'Meeting'} Link
                                </a>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-3">
                            <div className="text-sm text-gray-900">
                              {interview.scheduled_time
                                ? new Date(interview.scheduled_time).toLocaleString()
                                : '-'}
                            </div>

                            {/* Inline Action Buttons */}
                            <div className="flex flex-wrap gap-2">
                              {interview.status === 'scheduled' && (
                                <>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      downloadCalendar(interview.id, interview.candidate_name);
                                    }}
                                    className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg transition-colors"
                                  >
                                    Download ICS
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateInterviewStatus(interview.id, 'completed');
                                    }}
                                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
                                  >
                                    Complete
                                  </button>
                                </>
                              )}
                              {interview.status === 'completed' && !interview.outcome && (
                                <>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateInterviewStatus(interview.id, 'completed', 'selected');
                                    }}
                                    className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg transition-colors"
                                  >
                                    Select
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateInterviewStatus(interview.id, 'completed', 'rejected');
                                    }}
                                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg transition-colors"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteInterview(interview.id);
                                }}
                                className="px-3 py-1.5 border border-red-300 hover:bg-red-50 text-red-600 text-xs font-medium rounded-lg transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Availability Request Modal */}
        {showAvailabilityModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Request Availability</h3>
                  <button onClick={() => setShowAvailabilityModal(false)}>
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Candidate Name *
                    </label>
                    <input
                      type="text"
                      value={availabilityForm.candidateName}
                      onChange={(e) => {
                        const newName = e.target.value;
                        setAvailabilityForm({ ...availabilityForm, candidateName: newName });
                        // Auto-update email template when name changes
                        if (newName && availabilityForm.position) {
                          loadDefaultEmailTemplate(newName, availabilityForm.position);
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                    <input
                      type="email"
                      value={availabilityForm.candidateEmail}
                      onChange={(e) =>
                        setAvailabilityForm({ ...availabilityForm, candidateEmail: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Position *</label>
                  <input
                    type="text"
                    value={availabilityForm.position}
                    onChange={(e) => {
                      const newPosition = e.target.value;
                      setAvailabilityForm({ ...availabilityForm, position: newPosition });
                      // Auto-update email template when position changes
                      if (availabilityForm.candidateName && newPosition) {
                        loadDefaultEmailTemplate(availabilityForm.candidateName, newPosition);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Google Form Link (Optional)
                  </label>
                  <input
                    type="url"
                    value={availabilityForm.googleFormLink}
                    onChange={(e) =>
                      setAvailabilityForm({ ...availabilityForm, googleFormLink: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    placeholder="Will be inserted into email template"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Subject
                  </label>
                  <input
                    type="text"
                    value={availabilityForm.emailSubject}
                    onChange={(e) =>
                      setAvailabilityForm({ ...availabilityForm, emailSubject: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    placeholder="Interview Opportunity - [Position]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Content
                  </label>
                  <textarea
                    value={availabilityForm.emailContent}
                    onChange={(e) =>
                      setAvailabilityForm({ ...availabilityForm, emailContent: e.target.value })
                    }
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    placeholder="Custom email content (optional - will use default template if empty)"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CC (Optional)
                    </label>
                    <input
                      type="text"
                      value={availabilityForm.ccEmails}
                      onChange={(e) =>
                        setAvailabilityForm({ ...availabilityForm, ccEmails: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      placeholder="email1@example.com, email2@example.com"
                    />
                    <p className="text-xs text-gray-500 mt-1">Comma-separated email addresses</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      BCC (Optional)
                    </label>
                    <input
                      type="text"
                      value={availabilityForm.bccEmails}
                      onChange={(e) =>
                        setAvailabilityForm({ ...availabilityForm, bccEmails: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      placeholder="email1@example.com, email2@example.com"
                    />
                    <p className="text-xs text-gray-500 mt-1">Comma-separated email addresses</p>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={() => setShowAvailabilityModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRequestAvailability}
                  disabled={
                    loading ||
                    !availabilityForm.candidateName ||
                    !availabilityForm.candidateEmail ||
                    !availabilityForm.position
                  }
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
                >
                  {loading ? 'Sending...' : 'Send Request'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Schedule Interview Modal */}
        {showScheduleModal && selectedInterview && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">Schedule Interview</h3>
                    <p className="text-blue-100 text-sm">
                      {selectedInterview.candidate_name} • {selectedInterview.candidate_email}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowScheduleModal(false)}
                    className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Form Body */}
              <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                {/* Candidate Info Card */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-blue-900 mb-0.5">Position</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {selectedInterview.job_title}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Interview Details */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Interview Type
                      </label>
                      <select
                        value={scheduleForm.interviewType}
                        onChange={(e) =>
                          setScheduleForm({ ...scheduleForm, interviewType: e.target.value })
                        }
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 font-medium transition-shadow"
                      >
                        <option value="technical">Technical</option>
                        <option value="behavioral">Behavioral</option>
                        <option value="screening">Screening</option>
                        <option value="final">Final</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Duration (minutes)
                      </label>
                      <select
                        value={scheduleForm.duration}
                        onChange={(e) =>
                          setScheduleForm({ ...scheduleForm, duration: parseInt(e.target.value) })
                        }
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 font-medium transition-shadow"
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
                      onChange={(e) =>
                        setScheduleForm({ ...scheduleForm, scheduledTime: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Platform <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={scheduleForm.platform}
                      onChange={(e) =>
                        setScheduleForm({ ...scheduleForm, platform: e.target.value })
                      }
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 font-medium transition-shadow"
                    >
                      <option value="Google Meet">Google Meet</option>
                      <option value="Microsoft Teams">Microsoft Teams</option>
                      <option value="Zoom">Zoom</option>
                    </select>
                    <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                      <p className="text-xs text-blue-700 font-medium">
                        Meeting link will be auto-generated
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Notes (Optional)
                    </label>
                    <textarea
                      value={scheduleForm.notes}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, notes: e.target.value })}
                      rows={3}
                      placeholder="Add any additional notes or instructions for the interview..."
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900 placeholder-gray-400 transition-shadow"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Attach Candidate CV (Optional)
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) =>
                          setScheduleForm({ ...scheduleForm, cvFile: e.target.files[0] })
                        }
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-shadow"
                      />
                      {scheduleForm.cvFile && (
                        <p className="text-xs text-green-600 mt-1 flex items-center">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                          {scheduleForm.cvFile.name} selected
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      CV will be sent to the candidate and CC/BCC recipients along with the calendar
                      invite
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        CC Emails (Optional)
                      </label>
                      <input
                        type="text"
                        value={scheduleForm.ccEmails}
                        onChange={(e) =>
                          setScheduleForm({ ...scheduleForm, ccEmails: e.target.value })
                        }
                        placeholder="email1@example.com, email2@example.com"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400 transition-shadow"
                      />
                      <p className="text-xs text-gray-500 mt-1">Comma-separated email addresses</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        BCC Emails (Optional)
                      </label>
                      <input
                        type="text"
                        value={scheduleForm.bccEmails}
                        onChange={(e) =>
                          setScheduleForm({ ...scheduleForm, bccEmails: e.target.value })
                        }
                        placeholder="email1@example.com, email2@example.com"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400 transition-shadow"
                      />
                      <p className="text-xs text-gray-500 mt-1">Comma-separated email addresses</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={() => setShowScheduleModal(false)}
                  className="px-5 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleScheduleInterview}
                  disabled={loading || !scheduleForm.scheduledTime || !scheduleForm.platform}
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  {loading ? (
                    <span className="flex items-center">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Scheduling...
                    </span>
                  ) : (
                    'Schedule Interview'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default InterviewCoordinator;
