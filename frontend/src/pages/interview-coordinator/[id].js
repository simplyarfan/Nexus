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
  ChevronDown,
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import AddToCalendarDropdown from '../../components/ui/AddToCalendarDropdown';

// Status Dropdown Component
const StatusDropdown = ({ currentStatus, currentOutcome, onStatusChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = React.useRef(null);

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const statusOptions = [
    {
      status: 'awaiting_response',
      outcome: null,
      label: 'Awaiting Response',
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      icon: Clock,
    },
    {
      status: 'scheduled',
      outcome: null,
      label: 'Scheduled',
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: Calendar,
    },
    {
      status: 'completed',
      outcome: null,
      label: 'Completed',
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      icon: CheckCircle2,
    },
    {
      status: 'completed',
      outcome: 'selected',
      label: 'Selected',
      color: 'bg-green-100 text-green-800 border-green-200',
      icon: CheckCircle2,
    },
    {
      status: 'completed',
      outcome: 'rejected',
      label: 'Rejected',
      color: 'bg-red-100 text-red-800 border-red-200',
      icon: XCircle,
    },
    {
      status: 'cancelled',
      outcome: null,
      label: 'Cancelled',
      color: 'bg-red-100 text-red-800 border-red-200',
      icon: XCircle,
    },
  ];

  const currentOption =
    statusOptions.find((opt) => opt.status === currentStatus && opt.outcome === currentOutcome) ||
    statusOptions[0];

  const CurrentIcon = currentOption.icon;

  const handleStatusSelect = (option) => {
    onStatusChange(option.status, option.outcome);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-3 rounded-lg border-2 transition-all flex items-center justify-between font-semibold ${currentOption.color}`}
      >
        <span className="flex items-center">
          <CurrentIcon className="w-5 h-5 mr-2" />
          {currentOption.label}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden">
          {statusOptions.map((option, idx) => {
            const OptionIcon = option.icon;
            const isActive = option.status === currentStatus && option.outcome === currentOutcome;

            return (
              <button
                key={idx}
                onClick={() => handleStatusSelect(option)}
                className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center justify-between border-b border-gray-100 last:border-b-0 ${
                  isActive ? 'bg-gray-50' : ''
                }`}
              >
                <span className="flex items-center space-x-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${option.color}`}>
                    <OptionIcon className="w-4 h-4 inline mr-1" />
                    {option.label}
                  </span>
                </span>
                {isActive && <CheckCircle2 className="w-4 h-4 text-green-600" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

const InterviewDetailPage = () => {
  const { user, getAuthHeaders } = useAuth();
  const router = useRouter();
  const { id } = router.query;
  const [loading, setLoading] = useState(true);
  const [interview, setInterview] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

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

  const deleteInterview = async () => {
    if (!confirm('Are you sure you want to delete this interview? This action cannot be undone.')) {
      return;
    }

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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
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

      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
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
                <div className="bg-gradient-to-r from-orange-500 to-red-600 px-6 py-8">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                      <User className="w-8 h-8 text-orange-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-2xl font-bold text-white mb-1">
                        {interview.candidate_name}
                      </h2>
                      <p className="text-orange-100 flex items-center">
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
              {/* Calendar Downloads */}
              {interview.scheduled_time && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Download className="w-5 h-5 mr-2 text-gray-600" />
                    Add to Calendar
                  </h3>
                  <AddToCalendarDropdown interview={interview} />
                </div>
              )}

              {/* Status Actions */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Update Status</h3>
                <div className="space-y-3">
                  <StatusDropdown
                    currentStatus={interview.status}
                    currentOutcome={interview.outcome}
                    onStatusChange={(status, outcome) => updateInterviewStatus(status, outcome)}
                  />

                  {/* Schedule Interview Button - Show when awaiting response */}
                  {interview.status === 'awaiting_response' && !interview.scheduled_time && (
                    <button
                      onClick={() => router.push(`/interview-coordinator?scheduleCandidate=${id}`)}
                      className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center"
                    >
                      <Calendar className="w-5 h-5 mr-2" />
                      Schedule Interview
                    </button>
                  )}
                </div>
              </div>

              {/* Delete Action */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Danger Zone</h3>
                <button
                  onClick={deleteInterview}
                  className="w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg inline-flex items-center justify-center text-sm font-medium transition-colors border-2 border-red-200 hover:border-red-300"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Interview
                </button>
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
        </div>
      </div>
    </>
  );
};

export default InterviewDetailPage;
