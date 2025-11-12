/**
 * INTERVIEW COORDINATOR COMPONENT (HR-02)
 * Frontend interface for interview scheduling and coordination
 */

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, FileText, Download, Plus, Check, X } from 'lucide-react';
import DateTimePicker from '../ui/DateTimePicker';
import toast from 'react-hot-toast';

const InterviewCoordinator = () => {
  const [interviews, setInterviews] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [interviewForm, setInterviewForm] = useState({
    type: 'technical',
    duration: 60,
    scheduled_time: '',
    location: 'Video Call',
    meeting_link: '',
    panel_members: [],
  });
  const [generatedQuestions, setGeneratedQuestions] = useState(null);

  useEffect(() => {
    fetchInterviews();
    fetchCandidates();
  }, []);

  const fetchInterviews = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/interview-coordinator/interviews', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setInterviews(data.data || []);
      }
    } catch (error) {
      // Intentionally empty - loading state handled, empty array shown on failure
    }
  };

  const fetchCandidates = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/cv-intelligence/batches', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Extract candidates from all batches
        const allCandidates = [];
        data.data?.forEach((batch) => {
          if (batch.candidates) {
            batch.candidates.forEach((candidate) => {
              allCandidates.push({
                ...candidate,
                batch_name: batch.name,
              });
            });
          }
        });
        setCandidates(allCandidates);
      }
    } catch (error) {
      // Intentionally empty - loading state handled by finally block, empty array shown on failure
    } finally {
      setLoading(false);
    }
  };

  const generateQuestions = async (candidateId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/interview-coordinator/questions/generate', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          candidate_id: candidateId,
          job_description: 'Software Engineer position requiring technical expertise',
          interview_type: interviewForm.type,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedQuestions(data.data);
      }
    } catch (error) {
      // Intentionally empty - question generation is optional, failure won't block scheduling
    }
  };

  const scheduleInterview = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/interview-coordinator/schedule', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          candidate_id: selectedCandidate.id,
          job_description: 'Software Engineer position',
          interview_details: interviewForm,
          panel_members: interviewForm.panel_members,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setShowScheduleModal(false);
        setSelectedCandidate(null);
        setGeneratedQuestions(null);
        fetchInterviews();
        toast.success('Interview scheduled successfully!');
      }
    } catch (error) {
      toast.error('Failed to schedule interview');
    }
  };

  const downloadICS = async (interviewId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/interview-coordinator/calendar/${interviewId}/ics`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `interview-${interviewId}.ics`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      // Intentionally empty - calendar download is optional feature, silent failure is acceptable
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-accent text-primary';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'rescheduled':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-muted text-foreground';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Interview Coordinator</h1>
          <p className="text-muted-foreground mt-2">Schedule and manage candidate interviews</p>
        </div>
        <button
          onClick={() => setShowScheduleModal(true)}
          className="flex items-center space-x-2 bg-primary hover:bg-primary text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Schedule Interview</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Interviews</p>
              <p className="text-2xl font-bold text-foreground">{interviews.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
              <Check className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold text-foreground">
                {interviews.filter((i) => i.status === 'completed').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Scheduled</p>
              <p className="text-2xl font-bold text-foreground">
                {interviews.filter((i) => i.status === 'scheduled').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Candidates</p>
              <p className="text-2xl font-bold text-foreground">{candidates.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Interviews List */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Scheduled Interviews</h2>
        </div>

        {interviews.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-border mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No interviews scheduled</h3>
            <p className="text-muted-foreground">Schedule your first interview to get started</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {interviews.map((interview) => (
              <div key={interview.id} className="p-6 hover:bg-secondary transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground mb-2">{interview.title}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(interview.scheduled_time).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4" />
                        <span>{interview.duration} minutes</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4" />
                        <span>{interview.type}</span>
                      </div>
                      <div>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(interview.status)}`}
                        >
                          {interview.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => downloadICS(interview.id)}
                      className="p-2 text-muted-foreground hover:text-muted-foreground transition-colors"
                      title="Download Calendar Invite"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Schedule Interview Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground">Schedule Interview</h2>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Candidate Selection */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Select Candidate
                </label>
                <select
                  value={selectedCandidate?.id || ''}
                  onChange={(e) => {
                    const candidate = candidates.find((c) => c.id === e.target.value);
                    setSelectedCandidate(candidate);
                    if (candidate) {
                      generateQuestions(candidate.id);
                    }
                  }}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-primary"
                >
                  <option value="">Choose a candidate...</option>
                  {candidates.map((candidate) => (
                    <option key={candidate.id} value={candidate.id}>
                      {candidate.name} - {candidate.batch_name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedCandidate && (
                <>
                  {/* Interview Details */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-2">
                        Interview Type
                      </label>
                      <select
                        value={interviewForm.type}
                        onChange={(e) =>
                          setInterviewForm({ ...interviewForm, type: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-primary"
                      >
                        <option value="technical">Technical</option>
                        <option value="behavioral">Behavioral</option>
                        <option value="cultural">Cultural Fit</option>
                        <option value="final">Final Round</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-2">
                        Duration (minutes)
                      </label>
                      <input
                        type="number"
                        value={interviewForm.duration}
                        onChange={(e) =>
                          setInterviewForm({ ...interviewForm, duration: parseInt(e.target.value) })
                        }
                        className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <DateTimePicker
                      label="Scheduled Date & Time"
                      value={interviewForm.scheduled_time}
                      onChange={(e) =>
                        setInterviewForm({ ...interviewForm, scheduled_time: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                      Meeting Link
                    </label>
                    <input
                      type="url"
                      value={interviewForm.meeting_link}
                      onChange={(e) =>
                        setInterviewForm({ ...interviewForm, meeting_link: e.target.value })
                      }
                      placeholder="https://zoom.us/j/..."
                      className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-primary"
                    />
                  </div>

                  {/* Generated Questions Preview */}
                  {generatedQuestions && (
                    <div className="bg-secondary rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center">
                        <FileText className="w-5 h-5 mr-2" />
                        Generated Interview Questions
                      </h3>
                      <div className="space-y-3">
                        {generatedQuestions.technical_questions
                          ?.slice(0, 3)
                          .map((question, index) => (
                            <div key={index} className="text-sm text-muted-foreground">
                              <span className="font-medium">Q{index + 1}:</span> {question}
                            </div>
                          ))}
                        <p className="text-xs text-muted-foreground mt-2">
                          Full question set will be available after scheduling
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end space-x-4 pt-6 border-t border-border">
                    <button
                      onClick={() => setShowScheduleModal(false)}
                      className="px-4 py-2 border border-border rounded-lg text-muted-foreground hover:bg-secondary transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={scheduleInterview}
                      disabled={!interviewForm.scheduled_time}
                      className="px-4 py-2 bg-primary hover:bg-primary text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Schedule Interview
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewCoordinator;
