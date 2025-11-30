import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Sparkles, Loader2 } from 'lucide-react';
import { useRouter } from 'next/router';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import api from '@/utils/api';
import toast from 'react-hot-toast';

export default function EditJobPositionPage() {
  const router = useRouter();
  const { id } = router.query;
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    department: '',
    location: '',
    employment_type: 'full-time',
    experience_level: 'mid',
    salary_range_min: '',
    salary_range_max: '',
    currency: 'USD',
    description: '',
    requirements: '',
    responsibilities: '',
    required_skills: '',
    preferred_skills: '',
    benefits: '',
    status: 'open',
    openings_count: 1,
    remote_policy: 'hybrid',
  });

  // Fetch job position data from API
  useEffect(() => {
    const fetchPosition = async () => {
      if (!id) return;

      try {
        setIsLoading(true);
        const response = await api.get(`/job-positions/${id}`);

        if (response.data.success) {
          const position = response.data.data.position;

          // Convert arrays to newline-separated strings for textareas
          setFormData({
            title: position.title || '',
            department: position.department || '',
            location: position.location || '',
            employment_type: position.employment_type || 'full-time',
            experience_level: position.experience_level || 'mid',
            salary_range_min: position.salary_range_min || '',
            salary_range_max: position.salary_range_max || '',
            currency: position.currency || 'USD',
            description: position.description || '',
            requirements: Array.isArray(position.requirements)
              ? position.requirements.join('\n')
              : (position.requirements || ''),
            responsibilities: Array.isArray(position.responsibilities)
              ? position.responsibilities.join('\n')
              : (position.responsibilities || ''),
            required_skills: Array.isArray(position.required_skills)
              ? position.required_skills.join(', ')
              : (position.required_skills || ''),
            preferred_skills: Array.isArray(position.preferred_skills)
              ? position.preferred_skills.join(', ')
              : (position.preferred_skills || ''),
            benefits: Array.isArray(position.benefits)
              ? position.benefits.join('\n')
              : (position.benefits || ''),
            status: position.status || 'open',
            openings_count: position.openings_count || 1,
            remote_policy: position.remote_policy || 'hybrid',
          });
        }
      } catch (error) {
        console.error('Error fetching position:', error);
        toast.error('Failed to load position details');
        router.push('/job-positions');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosition();
  }, [id, router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleGenerateAI = async () => {
    setIsGeneratingAI(true);
    // Simulate AI generation - will be replaced with API call
    setTimeout(() => {
      setFormData((prev) => ({
        ...prev,
        description: `We are seeking a talented ${formData.title} to join our ${formData.department} team. This is an exciting opportunity to work on cutting-edge projects and make a significant impact.`,
        requirements:
          'Bachelor degree in relevant field\nProven experience in similar role\nStrong communication skills\nTeam player with leadership potential',
        responsibilities:
          'Lead key initiatives and projects\nCollaborate with cross-functional teams\nMentor and guide team members\nDrive innovation and best practices',
      }));
      setIsGeneratingAI(false);
    }, 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // Convert string fields to arrays for API
      const payload = {
        ...formData,
        requirements: formData.requirements.split('\n').filter(r => r.trim()),
        responsibilities: formData.responsibilities.split('\n').filter(r => r.trim()),
        required_skills: formData.required_skills.split(',').map(s => s.trim()).filter(s => s),
        preferred_skills: formData.preferred_skills.split(',').map(s => s.trim()).filter(s => s),
        benefits: formData.benefits.split('\n').filter(b => b.trim()),
        salary_range_min: formData.salary_range_min ? parseInt(formData.salary_range_min) : null,
        salary_range_max: formData.salary_range_max ? parseInt(formData.salary_range_max) : null,
        openings_count: formData.openings_count ? parseInt(formData.openings_count) : 1,
      };

      const response = await api.put(`/job-positions/${id}`, payload);

      if (response.data.success) {
        toast.success('Position updated successfully!');
        router.push(`/job-positions/${id}`);
      } else {
        toast.error(response.data.error || 'Failed to update position');
      }
    } catch (error) {
      console.error('Error updating position:', error);
      toast.error(error.response?.data?.error || 'Failed to update position');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Back Button */}
          <button
            onClick={() => router.push('/job-positions')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Positions</span>
          </button>

          <div>
            <h1 className="text-3xl font-bold text-foreground">Edit Position</h1>
            <p className="mt-1 text-sm text-muted-foreground">Update job position details</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-foreground">Basic Information</h2>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                leftIcon={isGeneratingAI ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                onClick={handleGenerateAI}
                disabled={isGeneratingAI || !formData.title || !formData.department}
              >
                {isGeneratingAI ? 'Generating...' : 'AI Generate'}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Job Title *
                </label>
                <Input
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g. Senior Frontend Developer"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Department *
                </label>
                <Input
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  placeholder="e.g. Engineering"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Location</label>
                <Input
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g. San Francisco, CA"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Employment Type
                </label>
                <select
                  name="employment_type"
                  value={formData.employment_type}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-background text-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="full-time">Full Time</option>
                  <option value="part-time">Part Time</option>
                  <option value="contract">Contract</option>
                  <option value="internship">Internship</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Experience Level
                </label>
                <select
                  name="experience_level"
                  value={formData.experience_level}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-background text-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="entry">Entry</option>
                  <option value="mid">Mid</option>
                  <option value="senior">Senior</option>
                  <option value="lead">Lead</option>
                  <option value="executive">Executive</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Remote Policy
                </label>
                <select
                  name="remote_policy"
                  value={formData.remote_policy}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-background text-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="remote">Remote</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="onsite">Onsite</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-background text-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="open">Open</option>
                  <option value="on_hold">On Hold</option>
                  <option value="filled">Filled</option>
                </select>
              </div>
            </div>
          </div>

          {/* Compensation */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">Compensation</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Min Salary
                </label>
                <Input
                  name="salary_range_min"
                  type="number"
                  value={formData.salary_range_min}
                  onChange={handleChange}
                  placeholder="120000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Max Salary
                </label>
                <Input
                  name="salary_range_max"
                  type="number"
                  value={formData.salary_range_max}
                  onChange={handleChange}
                  placeholder="180000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Currency</label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-background text-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="SAR">SAR</option>
                </select>
              </div>
            </div>
          </div>

          {/* Job Details */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">Job Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-2 bg-background text-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Describe the role and company opportunity..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Requirements
                </label>
                <textarea
                  name="requirements"
                  value={formData.requirements}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-2 bg-background text-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="List requirements (one per line)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Responsibilities
                </label>
                <textarea
                  name="responsibilities"
                  value={formData.responsibilities}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-2 bg-background text-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="List responsibilities (one per line)"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Required Skills
                  </label>
                  <Input
                    name="required_skills"
                    value={formData.required_skills}
                    onChange={handleChange}
                    placeholder="React, TypeScript, Next.js"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Preferred Skills
                  </label>
                  <Input
                    name="preferred_skills"
                    value={formData.preferred_skills}
                    onChange={handleChange}
                    placeholder="Node.js, GraphQL"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Benefits</label>
                <textarea
                  name="benefits"
                  value={formData.benefits}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2 bg-background text-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="List benefits (one per line)"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={() => router.push('/job-positions')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              leftIcon={isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
