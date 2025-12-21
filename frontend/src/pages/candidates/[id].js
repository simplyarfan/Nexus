import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Edit,
  Edit2,
  Save,
  X,
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Briefcase,
  Calendar,
  Star,
  TrendingUp,
  Users,
  Award,
  FileText,
  Plus,
  Trash2,
  GraduationCap,
  Check,
} from 'lucide-react';
import { useRouter } from 'next/router';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { createAvatar } from '@dicebear/core';
import { lorelei } from '@dicebear/collection';
import api from '@/utils/api';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';

export default function CandidateProfilePage() {
  const router = useRouter();
  const { id } = router.query;
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [candidate, setCandidate] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedData, setEditedData] = useState({});
  const [newNote, setNewNote] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editingNoteContent, setEditingNoteContent] = useState('');
  const [isDeletingNote, setIsDeletingNote] = useState(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // Generate artistic avatar
  const getAvatarSvg = (name) => {
    const avatar = createAvatar(lorelei, {
      seed: name,
      backgroundColor: ['transparent'],
    });
    return avatar.toDataUri();
  };

  useEffect(() => {
    if (id) {
      fetchCandidate();
    }
  }, [id]);

  const fetchCandidate = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/candidates/${id}`);

      if (response.data.success) {
        const candidateData = response.data.candidate;

        // Map primary_skills to skills for display
        if (candidateData.primary_skills) {
          candidateData.skills = candidateData.primary_skills;
        }

        // Ensure arrays exist even if empty
        candidateData.skills = candidateData.skills || [];
        candidateData.certifications = candidateData.certifications || [];
        candidateData.experience_timeline = candidateData.experience_timeline || [];
        // Map job_applications to suggestedJobs for display
        candidateData.suggestedJobs = (candidateData.job_applications || []).map(app => ({
          ...app,
          jobPosition: app.job_positions, // Map snake_case to camelCase
        }));
        candidateData.notes = candidateData.candidate_notes || [];

        setCandidate(candidateData);
        setEditedData(candidateData);
      } else {
        toast.error('Failed to load candidate');
      }
    } catch (error) {
      console.error('Error fetching candidate:', error);
      toast.error('Failed to load candidate');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedData(candidate);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const response = await api.put(`/candidates/${id}`, editedData);

      if (response.data.success) {
        setCandidate(response.data.candidate);
        setIsEditing(false);
        toast.success('Candidate updated successfully');
      } else {
        toast.error('Failed to save changes');
      }
    } catch (error) {
      console.error('Error saving candidate:', error);
      toast.error('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setEditedData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    try {
      setIsAddingNote(true);
      const response = await api.post(`/candidates/${id}/notes`, {
        content: newNote,
        note_type: 'general',
      });

      if (response.data.success) {
        setCandidate((prev) => ({
          ...prev,
          notes: [response.data.note, ...(prev.notes || [])],
        }));
        setNewNote('');
        toast.success('Note added successfully');
      } else {
        toast.error('Failed to add note');
      }
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error('Failed to add note');
    } finally {
      setIsAddingNote(false);
    }
  };

  const handleEditNote = (note) => {
    setEditingNoteId(note.id);
    setEditingNoteContent(note.content);
  };

  const handleCancelEditNote = () => {
    setEditingNoteId(null);
    setEditingNoteContent('');
  };

  const handleSaveNote = async (noteId) => {
    if (!editingNoteContent.trim()) return;

    try {
      const response = await api.put(`/candidates/${id}/notes/${noteId}`, {
        content: editingNoteContent,
      });

      if (response.data.success) {
        setCandidate((prev) => ({
          ...prev,
          notes: prev.notes.map((n) =>
            n.id === noteId ? response.data.note : n
          ),
        }));
        setEditingNoteId(null);
        setEditingNoteContent('');
        toast.success('Note updated successfully');
      } else {
        toast.error('Failed to update note');
      }
    } catch (error) {
      console.error('Error updating note:', error);
      toast.error('Failed to update note');
    }
  };

  const handleDeleteNote = async (noteId) => {
    try {
      setIsDeletingNote(noteId);
      const response = await api.delete(`/candidates/${id}/notes/${noteId}`);

      if (response.data.success) {
        setCandidate((prev) => ({
          ...prev,
          notes: prev.notes.filter((n) => n.id !== noteId),
        }));
        toast.success('Note deleted successfully');
      } else {
        toast.error('Failed to delete note');
      }
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error('Failed to delete note');
    } finally {
      setIsDeletingNote(null);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const response = await api.delete(`/candidates/${id}`);

      if (response.data.success) {
        toast.success('Candidate deleted successfully');
        router.push('/candidates');
      } else {
        toast.error('Failed to delete candidate');
      }
    } catch (error) {
      console.error('Error deleting candidate:', error);
      toast.error('Failed to delete candidate');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-600 dark:text-green-400';
    if (score >= 80) return 'text-blue-600 dark:text-blue-400';
    if (score >= 70) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getAvailabilityBadge = (status) => {
    const badges = {
      open_to_opportunities: 'bg-green-pastel text-green-800 dark:bg-green-600 dark:text-green-100',
      actively_looking: 'bg-blue-pastel text-blue-800 dark:bg-blue-600 dark:text-blue-100',
      passive: 'bg-yellow-pastel text-yellow-800 dark:bg-yellow-600 dark:text-yellow-100',
      not_looking: 'bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-100',
    };
    return badges[status] || badges.passive;
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (!candidate) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Candidate not found</p>
          <Button
            variant="secondary"
            className="mt-4"
            onClick={() => router.push('/')}
          >
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Back Button */}
          <button
            onClick={() => router.push('/candidates')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Candidates</span>
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Artistic Avatar */}
              <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-border bg-background flex-shrink-0 shadow-lg">
                <img
                  src={getAvatarSvg(candidate.name)}
                  alt={candidate.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1">
                {isEditing ? (
                  <Input
                    value={editedData.name || ''}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="Candidate name"
                    className="text-2xl font-bold mb-1"
                  />
                ) : (
                  <h1 className="text-3xl font-bold text-foreground">{candidate.name}</h1>
                )}
                <p className="mt-1 text-sm text-muted-foreground">
                  {candidate.current_title} at {candidate.current_company}
                </p>
                <div className="mt-2">
                  {isEditing ? (
                    <select
                      value={editedData.availability_status || 'passive'}
                      onChange={(e) => handleChange('availability_status', e.target.value)}
                      className="px-3 py-1 rounded-full text-xs font-medium bg-background text-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="open_to_opportunities">OPEN TO OPPORTUNITIES</option>
                      <option value="actively_looking">ACTIVELY LOOKING</option>
                      <option value="passive">PASSIVE</option>
                      <option value="not_looking">NOT LOOKING</option>
                    </select>
                  ) : (
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getAvailabilityBadge(candidate.availability_status)}`}
                    >
                      {candidate.availability_status?.replace(/_/g, ' ').toUpperCase() || 'AVAILABLE'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              {!isEditing ? (
                <>
                  <div className="relative group">
                    <Button
                      variant="danger"
                      size="lg"
                      leftIcon={<Trash2 className="w-5 h-5" />}
                      onClick={() => setShowDeleteModal(true)}
                      disabled={candidate.is_hired}
                      className={candidate.is_hired ? 'opacity-50 cursor-not-allowed' : ''}
                    >
                      Delete
                    </Button>
                    {candidate.is_hired && (
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-popover text-popover-foreground text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-border z-10">
                        Cannot delete - candidate has been hired as an employee
                      </div>
                    )}
                  </div>
                  <Button
                    variant="primary"
                    size="lg"
                    leftIcon={<Edit className="w-5 h-5" />}
                    onClick={handleEdit}
                  >
                    Edit Profile
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="secondary"
                    size="lg"
                    leftIcon={<X className="w-5 h-5" />}
                    onClick={handleCancel}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="lg"
                    leftIcon={<Save className="w-5 h-5" />}
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Information */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">Contact Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    <Mail className="w-4 h-4 inline mr-1" />
                    Email
                  </label>
                  {isEditing ? (
                    <Input
                      type="email"
                      value={editedData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                    />
                  ) : (
                    <p className="text-foreground">{candidate.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    <Phone className="w-4 h-4 inline mr-1" />
                    Phone
                  </label>
                  {isEditing ? (
                    <Input
                      type="tel"
                      value={editedData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                    />
                  ) : (
                    <p className="text-foreground">{candidate.phone}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    Location
                  </label>
                  {isEditing ? (
                    <Input
                      value={editedData.location}
                      onChange={(e) => handleChange('location', e.target.value)}
                    />
                  ) : (
                    <p className="text-foreground">{candidate.location}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    <Linkedin className="w-4 h-4 inline mr-1" />
                    LinkedIn
                  </label>
                  {isEditing ? (
                    <Input
                      value={editedData.linkedin_url}
                      onChange={(e) => handleChange('linkedin_url', e.target.value)}
                    />
                  ) : (
                    <a
                      href={candidate.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      View Profile
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Professional Information */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">Professional Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Current Company
                  </label>
                  {isEditing ? (
                    <Input
                      value={editedData.current_company}
                      onChange={(e) => handleChange('current_company', e.target.value)}
                    />
                  ) : (
                    <p className="text-foreground">{candidate.current_company}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Current Title
                  </label>
                  {isEditing ? (
                    <Input
                      value={editedData.current_title}
                      onChange={(e) => handleChange('current_title', e.target.value)}
                    />
                  ) : (
                    <p className="text-foreground">{candidate.current_title}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Years of Experience
                  </label>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={editedData.years_of_experience}
                      onChange={(e) => handleChange('years_of_experience', parseInt(e.target.value))}
                    />
                  ) : (
                    <p className="text-foreground">{candidate.years_of_experience} years</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Notice Period
                  </label>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={editedData.notice_period_days}
                      onChange={(e) => handleChange('notice_period_days', parseInt(e.target.value))}
                    />
                  ) : (
                    <p className="text-foreground">{candidate.notice_period_days} days</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Expected Salary
                  </label>
                  <p className="text-foreground">
                    ${candidate.expected_salary_min?.toLocaleString()} - $
                    {candidate.expected_salary_max?.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Work Experience */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                Work Experience
              </h2>
              {candidate.experience_timeline && Array.isArray(candidate.experience_timeline) && candidate.experience_timeline.length > 0 ? (
                <div className="space-y-6">
                  {candidate.experience_timeline.map((exp, index) => (
                    <div
                      key={index}
                      className="border-l-4 border-blue-500 dark:border-blue-400 pl-4 py-2"
                    >
                      <h3 className="text-lg font-semibold text-foreground">
                        {exp.role || 'Role not specified'}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {exp.company || 'Company not specified'}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        {exp.period && (
                          <>
                            <Calendar className="w-4 h-4" />
                            <span>{exp.period}</span>
                          </>
                        )}
                        {exp.duration_months && (
                          <>
                            <span>•</span>
                            <span>{exp.duration_months} months</span>
                          </>
                        )}
                      </div>
                      {exp.achievements && exp.achievements.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs font-medium text-muted-foreground mb-2">
                            Key Achievements:
                          </p>
                          <ul className="space-y-1">
                            {exp.achievements.map((achievement, i) => (
                              <li key={i} className="text-sm text-foreground flex items-start gap-2">
                                <span className="text-primary mt-1">•</span>
                                <span>{achievement}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-muted-foreground">
                  <p>No work experience information available</p>
                </div>
              )}
            </div>

            {/* Education */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <GraduationCap className="w-5 h-5" />
                Education
              </h2>
              {candidate.education && Array.isArray(candidate.education) && candidate.education.length > 0 ? (
                <div className="space-y-4">
                  {candidate.education.map((edu, index) => (
                    <div
                      key={index}
                      className="border-l-4 border-primary pl-4 py-2"
                    >
                      <h3 className="text-lg font-semibold text-foreground">
                        {edu.degree || 'Degree not specified'}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {edu.institution || 'Institution not specified'}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        {edu.field && <span>{edu.field}</span>}
                        {edu.field && edu.year && <span>•</span>}
                        {edu.year && <span>{edu.year}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-muted-foreground">
                  <p>No education information available</p>
                </div>
              )}
            </div>

            {/* Skills */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">Skills</h2>
              <div className="flex flex-wrap gap-2">
                {candidate.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 rounded-full text-sm font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Certifications */}
            {candidate.certifications && candidate.certifications.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-6">
                <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Certifications
                </h2>
                <ul className="space-y-2">
                  {candidate.certifications.map((cert, index) => (
                    <li key={index} className="flex items-center gap-2 text-foreground">
                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                      {cert}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Right Column - Applications & Notes */}
          <div className="space-y-6">
            {/* Suggested Jobs */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                Suggested Jobs ({candidate.suggestedJobs?.length || 0})
              </h2>
              {candidate.suggestedJobs && candidate.suggestedJobs.length > 0 ? (
                <div className="space-y-3">
                  {candidate.suggestedJobs.map((job) => (
                    <div
                      key={job.id}
                      className="border border-border rounded-lg p-3 hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => router.push(`/job-positions/${job.jobPosition?.id}`)}
                    >
                      <h3 className="font-semibold text-foreground text-sm">
                        {job.jobPosition?.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {job.jobPosition?.department} • {job.jobPosition?.location}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full">
                          {job.position_match_score || 0}% Match
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {job.jobPosition?.employment_type}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No suggested jobs at this time</p>
              )}
            </div>

            {/* Notes */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Notes
              </h2>

              {/* Add Note */}
              <div className="mb-4">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 bg-background text-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Add a note..."
                />
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-2"
                  leftIcon={<Plus className="w-4 h-4" />}
                  onClick={handleAddNote}
                  disabled={isAddingNote || !newNote.trim()}
                >
                  Add Note
                </Button>
              </div>

              {/* Notes List */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {candidate.notes.map((note) => (
                  <div key={note.id} className="border border-border rounded-lg p-3">
                    {editingNoteId === note.id ? (
                      <>
                        <textarea
                          value={editingNoteContent}
                          onChange={(e) => setEditingNoteContent(e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                        />
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => handleSaveNote(note.id)}
                            className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700"
                          >
                            <Check className="w-3 h-3" /> Save
                          </button>
                          <button
                            onClick={handleCancelEditNote}
                            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                          >
                            <X className="w-3 h-3" /> Cancel
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-foreground">{note.content}</p>
                        <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                          <span>
                            {note.author?.first_name} {note.author?.last_name}
                          </span>
                          <div className="flex items-center gap-3">
                            <span>{new Date(note.created_at).toLocaleDateString()}</span>
                            <button
                              onClick={() => handleEditNote(note)}
                              className="text-blue-500 hover:text-blue-600"
                              title="Edit note"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteNote(note.id)}
                              disabled={isDeletingNote === note.id}
                              className="text-red-500 hover:text-red-600 disabled:opacity-50"
                              title="Delete note"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-border rounded-xl p-6 max-w-md w-full shadow-xl"
          >
            <h3 className="text-xl font-semibold text-foreground mb-4">Confirm Deletion</h3>
            <p className="text-muted-foreground mb-6">
              Are you sure you want to delete {candidate.name}&apos;s profile? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="secondary"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Profile'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
