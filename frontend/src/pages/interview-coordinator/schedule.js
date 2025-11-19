import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/router';
import Head from 'next/head';
import * as Icons from 'lucide-react';
import axios from 'axios';
import emailService from '../../services/emailService';
import toast from 'react-hot-toast';
import ImprovedDateTimePicker from '../../components/ui/ImprovedDateTimePicker';

const ScheduleInterview = () => {
  const { user, getAuthHeaders } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    candidateName: '',
    candidateEmail: '',
    title: '',
    type: 'technical',
    scheduledTime: '',
    duration: 60,
    location: 'Video Call',
    meetingLink: '',
    notes: '',
  });
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [emailContent, setEmailContent] = useState('');
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [showCalendarConnection, setShowCalendarConnection] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const generateEmailContent = () => {
    const scheduledDate = formData.scheduledTime ? new Date(formData.scheduledTime) : null;
    const formattedDate = scheduledDate ? scheduledDate.toLocaleDateString() : '[Date]';
    const formattedTime = scheduledDate ? scheduledDate.toLocaleTimeString() : '[Time]';

    return `Subject: Interview Invitation - ${formData.title || 'Position'}

Dear ${formData.candidateName || '[Candidate Name]'},

I hope this email finds you well. We are pleased to invite you for an interview for the ${formData.title || '[Position Title]'} position.

Interview Details:
• Date: ${formattedDate}
• Time: ${formattedTime}
• Duration: ${formData.duration} minutes
• Type: ${formData.type}
• Location: ${formData.location}
${formData.meetingLink ? `• Meeting Link: ${formData.meetingLink}` : ''}

${formData.notes ? `Additional Notes:\n${formData.notes}` : ''}

Please confirm your availability for this interview. If you have any questions or need to reschedule, please don't hesitate to contact us.

We look forward to speaking with you.

Best regards,
${user?.first_name || 'HR Team'}
${user?.email || ''}`;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.candidateName || !formData.candidateEmail || !formData.title) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Check if email is connected
    if (!emailService.hasConnectedEmail()) {
      setShowCalendarConnection(true);
      return;
    }

    // Generate email content and show preview
    const generatedEmail = generateEmailContent();
    setEmailContent(generatedEmail);
    setShowEmailPreview(true);
  };

  const handleSendInvitation = async () => {
    try {
      setLoading(true);

      // Prepare availability request data
      const requestData = {
        candidateName: formData.candidateName,
        candidateEmail: formData.candidateEmail,
        position: formData.title,
        googleFormLink: formData.meetingLink, // Repurpose this field
        emailSubject: `Interview Opportunity - ${formData.title}`,
        emailContent: `Dear ${formData.candidateName},\n\nWe would like to invite you for an interview for the ${formData.title} position.\n\nPlease let us know your availability.\n\nBest regards`,
      };

      // Send availability request
      const headers = getAuthHeaders();
      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const response = await axios.post(
        `${API_URL}/api/interview-coordinator/request-availability`,
        requestData,
        { headers },
      );

      if (response.data?.success) {
        toast.success('Availability request sent successfully!');
        router.push('/interview-coordinator');
      } else {
        toast.error('Failed to send availability request');
      }
    } catch (error) {
      toast.error('Failed to schedule interview. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoToSettings = () => {
    router.push('/profile?tab=email');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Schedule Interview - Enterprise AI Platform</title>
      </Head>
      <div className="min-h-screen bg-secondary">
        {/* Header */}
        <div className="bg-card shadow-sm border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push('/interview-coordinator')}
                  className="p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <Icons.ArrowLeft className="w-5 h-5 text-muted-foreground" />
                </button>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary rounded-lg flex items-center justify-center">
                    <Icons.Calendar className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-semibold text-foreground">Schedule Interview</h1>
                    <p className="text-sm text-muted-foreground">
                      Create and send interview invitations
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Candidate Information */}
            <div className="bg-card rounded-lg shadow-sm border border-border p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                <Icons.Users className="w-5 h-5 mr-2 text-primary" />
                Candidate Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Candidate Name *
                  </label>
                  <input
                    type="text"
                    name="candidateName"
                    value={formData.candidateName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                    placeholder="Enter candidate's full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="candidateEmail"
                    value={formData.candidateEmail}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                    placeholder="candidate@example.com"
                  />
                </div>
              </div>
            </div>

            {/* Interview Details */}
            <div className="bg-card rounded-lg shadow-sm border border-border p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                <Icons.Briefcase className="w-5 h-5 mr-2 text-primary" />
                Interview Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Position/Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                    placeholder="e.g., Senior Software Engineer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Interview Type
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                  >
                    <option value="technical">Technical Interview</option>
                    <option value="behavioral">Behavioral Interview</option>
                    <option value="screening">Phone Screening</option>
                    <option value="final">Final Interview</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Duration (minutes)
                  </label>
                  <select
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                  >
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>1 hour</option>
                    <option value={90}>1.5 hours</option>
                    <option value={120}>2 hours</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <ImprovedDateTimePicker
                    label="Scheduled Date & Time"
                    value={formData.scheduledTime}
                    onChange={(isoString) =>
                      setFormData((prev) => ({ ...prev, scheduledTime: isoString }))
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                    placeholder="Video Call, Office, etc."
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Meeting Link (optional)
                  </label>
                  <input
                    type="url"
                    name="meetingLink"
                    value={formData.meetingLink}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                    placeholder="https://zoom.us/j/..."
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Additional Notes (optional)
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                    placeholder="Any additional information for the candidate..."
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.push('/interview-coordinator')}
                className="px-6 py-2 border border-border text-muted-foreground rounded-lg hover:bg-secondary transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary transition-colors flex items-center"
              >
                <Icons.Send className="w-4 h-4 mr-2" />
                Preview & Send
              </button>
            </div>
          </form>
        </div>

        {/* Email Preview Modal */}
        {showEmailPreview && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-card rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
              <div className="px-6 py-4 border-b border-border bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Review & Edit Email</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {isEditingEmail
                        ? '✏️ Editing mode - Make your changes'
                        : '👀 Preview mode - Click "Edit Content" to make changes'}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowEmailPreview(false)}
                    className="text-muted-foreground hover:text-muted-foreground"
                  >
                    <Icons.X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 max-h-96 overflow-y-auto">
                {isEditingEmail ? (
                  <textarea
                    value={emailContent}
                    onChange={(e) => setEmailContent(e.target.value)}
                    className="w-full h-64 p-3 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent font-mono text-sm"
                  />
                ) : (
                  <div className="bg-secondary p-4 rounded-lg">
                    <pre className="whitespace-pre-wrap font-sans text-sm text-foreground">
                      {emailContent}
                    </pre>
                  </div>
                )}
              </div>

              <div className="px-6 py-4 border-t border-border bg-secondary flex justify-between">
                <div className="flex space-x-3">
                  <button
                    onClick={() => setIsEditingEmail(!isEditingEmail)}
                    className="inline-flex items-center px-4 py-2 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    <Icons.Edit className="w-4 h-4 mr-2" />
                    {isEditingEmail ? 'Preview' : 'Edit Content'}
                  </button>
                </div>
                <button
                  onClick={handleSendInvitation}
                  disabled={loading}
                  className="inline-flex items-center px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Icons.Send className="w-4 h-4 mr-2" />
                      Send Invitation
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Calendar Connection Modal */}
        {showCalendarConnection && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-card rounded-lg max-w-md w-full p-6">
              <div className="flex items-center mb-4">
                <Icons.AlertCircle className="w-6 h-6 text-primary mr-3" />
                <h3 className="text-lg font-semibold text-foreground">Email Connection Required</h3>
              </div>
              <p className="text-muted-foreground mb-6">
                To send interview invitations, you need to connect your email account first.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowCalendarConnection(false)}
                  className="flex-1 px-4 py-2 border border-border text-muted-foreground rounded-lg hover:bg-secondary transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGoToSettings}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary transition-colors"
                >
                  Connect Email
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ScheduleInterview;
