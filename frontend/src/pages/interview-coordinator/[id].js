import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/router';
import Head from 'next/head';
import {
  Calendar,
  User,
  ArrowLeft,
  Mail,
  Clock,
  MapPin,
  FileText,
  Download,
  CheckCircle2,
  XCircle,
  Trash2,
  Edit2,
  Video,
  AlertCircle,
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const InterviewDetailPage = () => {
  const { user, getAuthHeaders } = useAuth();
  const router = useRouter();
  const { id } = router.query;
  const [loading, setLoading] = useState(true);
  const [interview, setInterview] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
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
  const [rescheduleForm, setRescheduleForm] = useState({
    scheduledTime: '',
    duration: 60,
    notes: '',
  });

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    if (id) {
      fetchInterviewDetails();
    }
  }, [user, id]);

  const fetchInterviewDetails = async () => {
    try {
      setLoading(true);
      const headers = getAuthHeaders();
      const API_URL = process.env.NEXT_PUBLIC_API_URL + '/api';

      const response = await axios.get(`${API_URL}/interview-coordinator/interview/${id}`, {
        headers,
      });

      if (response.data?.success) {
        setInterview(response.data.data);
      } else {
        toast.error('Failed to load interview details');
        router.push('/interview-coordinator');
      }
    } catch (error) {
      console.error('Failed to load interview:', error);
      toast.error(error.response?.data?.message || 'Failed to load interview');
      router.push('/interview-coordinator');
    } finally {
      setLoading(false);
    }
  };

  const updateInterviewStatus = async (status, outcome = null) => {
    try {
      const headers = getAuthHeaders();
      const API_URL = process.env.NEXT_PUBLIC_API_URL + '/api';

      await axios.put(
        `${API_URL}/interview-coordinator/interview/${id}/status`,
        { status, outcome },
        { headers },
      );

      toast.success('Status updated successfully!');
      fetchInterviewDetails();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const downloadCalendar = async (type = 'ics') => {
    try {
      const headers = getAuthHeaders();
      const API_URL = process.env.NEXT_PUBLIC_API_URL + '/api';

      const response = await axios.get(
        `${API_URL}/interview-coordinator/interview/${id}/calendar?type=${type}`,
        { headers, responseType: 'blob' },
      );

      const blob = new Blob([response.data], { type: 'text/calendar' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `interview-${interview.candidate_name.replace(/\s+/g, '-')}.ics`;
      link.click();
      window.URL.revokeObjectURL(url);

      const typeLabels = {
        google: 'Google Calendar',
        outlook: 'Outlook',
        apple: 'Apple Calendar',
        ics: 'Calendar',
      };
      toast.success(`${typeLabels[type] || 'Calendar'} file downloaded!`);
    } catch (error) {
      console.error('Calendar download error:', error);
      toast.error('Failed to download calendar');
    }
  };

  const rescheduleInterview = async () => {
    if (!rescheduleForm.scheduledTime) {
      toast.error('Please select a new date and time');
      return;
    }

    try {
      const headers = getAuthHeaders();
      const API_URL = process.env.NEXT_PUBLIC_API_URL + '/api';

      const response = await axios.put(
        `${API_URL}/interview-coordinator/interview/${id}/reschedule`,
        {
          scheduledTime: rescheduleForm.scheduledTime,
          duration: rescheduleForm.duration,
          notes: rescheduleForm.notes,
          notifyRecipients: true,
        },
        { headers },
      );

      if (response.data?.success) {
        toast.success('Interview rescheduled and notifications sent!');
        setShowRescheduleModal(false);
        setRescheduleForm({
          scheduledTime: '',
          duration: 60,
          notes: '',
        });
        fetchInterviewDetails();
      }
    } catch (error) {
      console.error('Reschedule error:', error);
      toast.error(error.response?.data?.message || 'Failed to reschedule interview');
    }
  };

  const deleteInterview = async () => {
    try {
      const headers = getAuthHeaders();
      const API_URL = process.env.NEXT_PUBLIC_API_URL + '/api';

      await axios.delete(`${API_URL}/interview-coordinator/interview/${id}`, { headers });

      toast.success('Interview deleted successfully!');
      router.push('/interview-coordinator');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete interview');
    }
  };

  const cancelInterview = async () => {
    try {
      const headers = getAuthHeaders();
      const API_URL = process.env.NEXT_PUBLIC_API_URL + '/api';

      await axios.put(
        `${API_URL}/interview-coordinator/interview/${id}/status`,
        { status: 'cancelled', outcome: null },
        { headers },
      );

      toast.success('Interview cancelled successfully!');
      setShowCancelModal(false);
      fetchInterviewDetails();
    } catch (error) {
      console.error('Cancel error:', error);
      toast.error('Failed to cancel interview');
    }
  };

  const handleNextStep = async () => {
    const currentStatus = interview.status;

    if (currentStatus === 'awaiting_response') {
      // Show inline scheduling form
      setShowScheduleForm(true);
    } else if (currentStatus === 'scheduled') {
      // Move to completed
      await updateInterviewStatus('completed', null);
    }
  };

  const handleScheduleInterview = async (e) => {
    e.preventDefault();

    if (!scheduleForm.scheduledTime) {
      toast.error('Please select date and time');
      return;
    }

    try {
      const headers = getAuthHeaders();
      const API_URL = process.env.NEXT_PUBLIC_API_URL + '/api';

      const formData = new FormData();
      formData.append('interviewId', id);
      formData.append('interviewType', scheduleForm.interviewType);
      formData.append('scheduledTime', scheduleForm.scheduledTime);
      formData.append('duration', scheduleForm.duration);
      formData.append('platform', scheduleForm.platform);
      formData.append('notes', scheduleForm.notes || '');

      // Handle CC and BCC emails
      const ccEmailsArray = scheduleForm.ccEmails
        .split(',')
        .map((e) => e.trim())
        .filter(Boolean);
      const bccEmailsArray = scheduleForm.bccEmails
        .split(',')
        .map((e) => e.trim())
        .filter(Boolean);

      formData.append('ccEmails', JSON.stringify(ccEmailsArray));
      formData.append('bccEmails', JSON.stringify(bccEmailsArray));

      if (scheduleForm.cvFile) {
        formData.append('cvFile', scheduleForm.cvFile);
      }

      const response = await axios.post(
        `${API_URL}/interview-coordinator/schedule-interview`,
        formData,
        { headers },
      );

      if (response.data?.success) {
        toast.success('Interview scheduled successfully!');
        setShowScheduleForm(false);
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
        fetchInterviewDetails();
      }
    } catch (error) {
      console.error('Schedule error:', error);
      toast.error(error.response?.data?.message || 'Failed to schedule interview');
    }
  };

  const handleOutcomeSelect = async (outcome) => {
    await updateInterviewStatus('completed', outcome);
  };

  const getStatusDisplay = (status, outcome) => {
    const statusConfig = {
      awaiting_response: {
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: Clock,
        text: 'Awaiting Response',
      },
      scheduled: {
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: Calendar,
        text: 'Scheduled',
      },
      completed: {
        color:
          outcome === 'selected'
            ? 'bg-green-100 text-green-800 border-green-200'
            : outcome === 'rejected'
              ? 'bg-red-100 text-red-800 border-red-200'
              : 'bg-gray-100 text-gray-800 border-gray-200',
        icon:
          outcome === 'selected' ? CheckCircle2 : outcome === 'rejected' ? XCircle : CheckCircle2,
        text:
          outcome === 'selected' ? 'Selected' : outcome === 'rejected' ? 'Rejected' : 'Completed',
      },
      cancelled: {
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: XCircle,
        text: 'Cancelled',
      },
    };

    return (
      statusConfig[status] || {
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: AlertCircle,
        text: status,
      }
    );
  };

  if (!user || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!interview) {
    return null;
  }

  const statusDisplay = getStatusDisplay(interview.status, interview.outcome);
  const StatusIcon = statusDisplay.icon;

  return (
    <>
      <Head>
        <title>{interview.candidate_name} - Interview Details</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push('/interview-coordinator')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">Interview Details</h1>
                  <p className="text-sm text-gray-500">Manage and track interview progress</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Main Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Candidate Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-8">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                      <User className="w-8 h-8 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-2xl font-bold text-white mb-1">
                        {interview.candidate_name}
                      </h2>
                      <p className="text-green-100 flex items-center">
                        <Mail className="w-4 h-4 mr-2" />
                        {interview.candidate_email}
                      </p>
                    </div>
                    <div
                      className={`px-4 py-2 rounded-lg border ${statusDisplay.color} flex items-center space-x-2`}
                    >
                      <StatusIcon className="w-5 h-5" />
                      <span className="font-semibold">{statusDisplay.text}</span>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-6 space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500 block mb-1">Position</label>
                    <p className="text-lg font-semibold text-gray-900">{interview.job_title}</p>
                  </div>

                  {interview.interview_type && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 block mb-1">
                        Interview Type
                      </label>
                      <p className="text-gray-900 capitalize">{interview.interview_type}</p>
                    </div>
                  )}

                  {interview.scheduled_time && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500 block mb-1">
                          Scheduled Date & Time
                        </label>
                        <p className="text-gray-900 flex items-center">
                          <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                          {new Date(interview.scheduled_time).toLocaleString('en-US', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 block mb-1">
                          Duration
                        </label>
                        <p className="text-gray-900 flex items-center">
                          <Clock className="w-4 h-4 mr-2 text-gray-400" />
                          {interview.duration || 60} minutes
                        </p>
                      </div>
                    </div>
                  )}

                  {interview.platform && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 block mb-1">
                        Platform
                      </label>
                      <p className="text-gray-900 flex items-center">
                        <Video className="w-4 h-4 mr-2 text-gray-400" />
                        {interview.platform}
                      </p>
                    </div>
                  )}

                  {interview.meeting_link && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 block mb-1">
                        Meeting Link
                      </label>
                      <a
                        href={interview.meeting_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 hover:underline flex items-center"
                      >
                        <MapPin className="w-4 h-4 mr-2" />
                        {interview.meeting_link}
                      </a>
                    </div>
                  )}

                  {interview.google_form_link && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 block mb-1">
                        Google Form
                      </label>
                      <a
                        href={interview.google_form_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 hover:underline flex items-center"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        View Form
                      </a>
                    </div>
                  )}

                  {interview.notes && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 block mb-1">Notes</label>
                      <p className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg border border-gray-200">
                        {interview.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Timeline / History would go here */}
            </div>

            {/* Right Column - Actions */}
            <div className="space-y-6">
              {/* Status Actions */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Update Status</h3>
                <div className="space-y-3">
                  {/* Current Status Display */}
                  <div
                    className={`px-4 py-3 rounded-lg border-2 flex items-center justify-center font-semibold ${statusDisplay.color}`}
                  >
                    <StatusIcon className="w-5 h-5 mr-2" />
                    {statusDisplay.text}
                  </div>

                  {/* Next Step Button - Show for awaiting_response and scheduled */}
                  {(interview.status === 'awaiting_response' ||
                    interview.status === 'scheduled') && (
                    <button
                      onClick={handleNextStep}
                      className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center"
                    >
                      <Calendar className="w-5 h-5 mr-2" />
                      Next Step
                    </button>
                  )}

                  {/* Reschedule Button - Show when scheduled */}
                  {interview.status === 'scheduled' && interview.scheduled_time && (
                    <button
                      onClick={() => {
                        setRescheduleForm({
                          scheduledTime: new Date(interview.scheduled_time)
                            .toISOString()
                            .slice(0, 16),
                          duration: interview.duration || 60,
                          notes: interview.notes || '',
                        });
                        setShowRescheduleModal(true);
                      }}
                      className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center"
                    >
                      <Clock className="w-5 h-5 mr-2" />
                      Reschedule Interview
                    </button>
                  )}

                  {/* Outcome Selection - Show when completed without outcome */}
                  {interview.status === 'completed' && !interview.outcome && (
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Select Outcome
                      </label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleOutcomeSelect('selected')}
                          className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                        >
                          <CheckCircle2 className="w-4 h-4 inline mr-1" />
                          Select
                        </button>
                        <button
                          onClick={() => handleOutcomeSelect('rejected')}
                          className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                        >
                          <XCircle className="w-4 h-4 inline mr-1" />
                          Reject
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Danger Zone */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Danger Zone</h3>
                <div className="space-y-3">
                  {/* Cancel Interview - Show if not already cancelled or completed with outcome */}
                  {interview.status !== 'cancelled' &&
                    !(interview.status === 'completed' && interview.outcome) && (
                      <button
                        onClick={() => setShowCancelModal(true)}
                        className="w-full px-4 py-3 text-green-600 hover:bg-green-50 rounded-lg inline-flex items-center justify-center text-sm font-medium transition-colors border-2 border-green-200 hover:border-green-300"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Cancel Interview
                      </button>
                    )}

                  {/* Delete Interview */}
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg inline-flex items-center justify-center text-sm font-medium transition-colors border-2 border-red-200 hover:border-red-300"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Interview
                  </button>
                </div>
              </div>

              {/* Metadata */}
              <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Metadata
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Created</span>
                    <span className="text-gray-900 font-medium">
                      {new Date(interview.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {interview.updated_at && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Last Updated</span>
                      <span className="text-gray-900 font-medium">
                        {new Date(interview.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Interview ID</span>
                    <span className="text-gray-900 font-mono text-xs">
                      {interview.id.slice(0, 12)}...
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Inline Scheduling Form - Show when awaiting_response and Next Step clicked */}
          {showScheduleForm && interview.status === 'awaiting_response' && (
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Schedule Interview</h3>
                  <button
                    onClick={() => setShowScheduleForm(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleScheduleInterview} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Interview Type *
                      </label>
                      <select
                        value={scheduleForm.interviewType}
                        onChange={(e) =>
                          setScheduleForm({ ...scheduleForm, interviewType: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="technical">Technical</option>
                        <option value="hr">HR</option>
                        <option value="behavioral">Behavioral</option>
                        <option value="final">Final</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Duration (minutes) *
                      </label>
                      <input
                        type="number"
                        min="15"
                        step="15"
                        value={scheduleForm.duration}
                        onChange={(e) =>
                          setScheduleForm({ ...scheduleForm, duration: parseInt(e.target.value) })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Scheduled Date & Time *
                    </label>
                    <input
                      type="datetime-local"
                      value={scheduleForm.scheduledTime}
                      onChange={(e) =>
                        setScheduleForm({ ...scheduleForm, scheduledTime: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Platform *
                    </label>
                    <select
                      value={scheduleForm.platform}
                      onChange={(e) =>
                        setScheduleForm({ ...scheduleForm, platform: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="Microsoft Teams">Microsoft Teams</option>
                      <option value="Zoom">Zoom</option>
                      <option value="Google Meet">Google Meet</option>
                      <option value="Phone">Phone</option>
                      <option value="In-person">In-person</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes (Optional)
                    </label>
                    <textarea
                      value={scheduleForm.notes}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, notes: e.target.value })}
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Add any notes or instructions..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        CC Emails (Optional)
                      </label>
                      <input
                        type="text"
                        value={scheduleForm.ccEmails}
                        onChange={(e) =>
                          setScheduleForm({ ...scheduleForm, ccEmails: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="email1@example.com, email2@example.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        BCC Emails (Optional)
                      </label>
                      <input
                        type="text"
                        value={scheduleForm.bccEmails}
                        onChange={(e) =>
                          setScheduleForm({ ...scheduleForm, bccEmails: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="email1@example.com, email2@example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Attach CV (Optional)
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) =>
                        setScheduleForm({ ...scheduleForm, cvFile: e.target.files[0] })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowScheduleForm(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                    >
                      Schedule Interview
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* Reschedule Modal */}
        {showRescheduleModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 flex items-center">
                  <Clock className="w-6 h-6 mr-2 text-green-600" />
                  Reschedule Interview
                </h3>
                <button
                  onClick={() => setShowRescheduleModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={rescheduleForm.scheduledTime}
                    onChange={(e) =>
                      setRescheduleForm({ ...rescheduleForm, scheduledTime: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    min="15"
                    step="15"
                    value={rescheduleForm.duration}
                    onChange={(e) =>
                      setRescheduleForm({ ...rescheduleForm, duration: parseInt(e.target.value) })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for Reschedule (Optional)
                  </label>
                  <textarea
                    value={rescheduleForm.notes}
                    onChange={(e) =>
                      setRescheduleForm({ ...rescheduleForm, notes: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                    rows="3"
                    placeholder="Optional notes about the reschedule..."
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>📧 Email Notification:</strong> The candidate and all recipients (CC,
                    BCC) will be automatically notified of the new date and time via email with an
                    updated calendar invitation.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowRescheduleModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={rescheduleInterview}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
                >
                  Confirm Reschedule
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Delete Interview</h3>
                  <p className="text-sm text-gray-600">This action cannot be undone</p>
                </div>
              </div>

              <p className="text-gray-700 mb-6">
                Are you sure you want to delete this interview with{' '}
                <strong>{interview.candidate_name}</strong>? All associated data will be permanently
                removed.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    deleteInterview();
                  }}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
                >
                  Delete Interview
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cancel Confirmation Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                  <XCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Cancel Interview</h3>
                  <p className="text-sm text-gray-600">Mark interview as cancelled</p>
                </div>
              </div>

              <p className="text-gray-700 mb-6">
                Are you sure you want to cancel this interview with{' '}
                <strong>{interview.candidate_name}</strong>? The interview status will be updated to
                cancelled.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Go Back
                </button>
                <button
                  onClick={cancelInterview}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
                >
                  Cancel Interview
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default InterviewDetailPage;
