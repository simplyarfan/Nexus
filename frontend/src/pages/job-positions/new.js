import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Upload,
  FileText,
  Sparkles,
  Loader2,
  X,
  Plus,
  Trash2,
  Check,
} from 'lucide-react';
import { useRouter } from 'next/router';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import api from '@/utils/api';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';

export default function NewJobPositionPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [step, setStep] = useState('upload'); // 'upload' | 'review' | 'creating'
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parsedData, setParsedData] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    department: '',
    location: '',
    employment_type: 'full-time',
    experience_level: 'mid',
    remote_policy: 'hybrid',
    salary_range_min: '',
    salary_range_max: '',
    currency: 'USD',
    description: '',
    requirements: [],
    responsibilities: [],
    required_skills: [],
    preferred_skills: [],
    benefits: [],
    openings_count: 1,
    status: 'open',
  });

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  // Handle drag and drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  // Validate and set file
  const validateAndSetFile = (file) => {
    console.log('File selected:', file.name, 'Size:', file.size, 'Type:', file.type);

    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a PDF or DOCX file');
      return;
    }

    if (file.size === 0) {
      toast.error('The selected file is empty. Please choose a valid file.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setSelectedFile(file);
  };

  // Parse JD with AI
  const handleParseJD = async () => {
    if (!selectedFile) {
      toast.error('Please select a file first');
      return;
    }

    // Double-check file size before uploading
    if (selectedFile.size === 0) {
      toast.error('Cannot upload empty file. Please select a valid PDF or DOCX file.');
      setSelectedFile(null);
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      setSelectedFile(null);
      return;
    }

    console.log('Uploading file:', selectedFile.name, 'Size:', selectedFile.size, 'bytes');

    setIsParsing(true);

    try {
      const formDataObj = new FormData();
      formDataObj.append('jd', selectedFile);

      const response = await api.post('/job-positions/parse-jd', formDataObj, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        const jobDetails = response.data.jobDetails;
        setParsedData(jobDetails);
        setFormData({
          title: jobDetails.title || '',
          department: jobDetails.department || '',
          location: jobDetails.location || '',
          employment_type: jobDetails.employment_type || 'full-time',
          experience_level: jobDetails.experience_level || 'mid',
          remote_policy: jobDetails.remote_policy || 'hybrid',
          salary_range_min: jobDetails.salary_range_min || '',
          salary_range_max: jobDetails.salary_range_max || '',
          currency: jobDetails.currency || 'USD',
          description: jobDetails.description || '',
          requirements: jobDetails.requirements || [],
          responsibilities: jobDetails.responsibilities || [],
          required_skills: jobDetails.required_skills || [],
          preferred_skills: jobDetails.preferred_skills || [],
          benefits: jobDetails.benefits || [],
          openings_count: jobDetails.openings_count || 1,
          status: 'open',
        });
        setStep('review');
        toast.success('JD parsed successfully!');
      }
    } catch (error) {
      console.error('Error parsing JD:', error);
      toast.error(error.response?.data?.message || 'Failed to parse JD');
    } finally {
      setIsParsing(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Handle array field changes
  const handleArrayAdd = (field, value) => {
    if (!value.trim()) return;
    setFormData((prev) => ({
      ...prev,
      [field]: [...prev[field], value.trim()],
    }));
  };

  const handleArrayRemove = (field, index) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  // Create job position
  const handleCreatePosition = async () => {
    if (!formData.title || !formData.department) {
      toast.error('Title and department are required');
      return;
    }

    setStep('creating');

    try {
      const response = await api.post('/job-positions', {
        ...formData,
        salary_range_min: formData.salary_range_min ? parseInt(formData.salary_range_min) : null,
        salary_range_max: formData.salary_range_max ? parseInt(formData.salary_range_max) : null,
        openings_count: parseInt(formData.openings_count) || 1,
      });

      if (response.data.success) {
        toast.success('Job position created successfully!');
        router.push(`/job-positions/${response.data.data.position.id}`);
      }
    } catch (error) {
      console.error('Error creating position:', error);
      toast.error(error.response?.data?.error || 'Failed to create position');
      setStep('review');
    }
  };

  // Render upload step
  const renderUploadStep = () => (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Sparkles className="w-10 h-10 text-primary" />
          <h1 className="text-4xl font-bold text-foreground">Create New Position</h1>
        </div>
        <p className="text-lg text-muted-foreground">
          Upload a Job Description and let AI extract the details for you
        </p>
      </div>

      {/* File Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50 bg-card'
        }`}
      >
        {selectedFile ? (
          <div className="space-y-4">
            <FileText className="w-16 h-16 mx-auto text-primary" />
            <div>
              <p className="text-lg font-semibold text-foreground">{selectedFile.name}</p>
              <p className="text-sm text-muted-foreground">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedFile(null)}
              leftIcon={<X className="w-4 h-4" />}
            >
              Remove
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Upload className="w-16 h-16 mx-auto text-muted-foreground" />
            <div>
              <p className="text-lg font-semibold text-foreground mb-2">
                Drop your JD here or click to browse
              </p>
              <p className="text-sm text-muted-foreground">
                Supports PDF and DOCX files (max 10MB)
              </p>
            </div>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileSelect}
              className="hidden"
              id="jd-upload"
            />
            <label htmlFor="jd-upload" className="block mt-6 cursor-pointer">
              <div className="inline-flex items-center gap-2 px-6 py-3 bg-background text-foreground border border-border rounded-lg hover:bg-muted transition-colors">
                <Upload className="w-5 h-5" />
                <span className="font-medium">Choose File</span>
              </div>
            </label>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 mt-8">
        <Button
          variant="outline"
          size="lg"
          onClick={() => router.push('/job-positions')}
          leftIcon={<ArrowLeft className="w-5 h-5" />}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          size="lg"
          onClick={handleParseJD}
          disabled={!selectedFile || isParsing}
          leftIcon={
            isParsing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Sparkles className="w-5 h-5" />
            )
          }
          className="flex-1"
        >
          {isParsing ? 'Parsing with AI...' : 'Parse with AI'}
        </Button>
      </div>
    </div>
  );

  // Render review step
  const renderReviewStep = () => (
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Check className="w-10 h-10 text-green-600" />
          <h1 className="text-4xl font-bold text-foreground">Review & Edit</h1>
        </div>
        <p className="text-lg text-muted-foreground">
          AI has extracted the job details. Review and edit as needed.
        </p>
      </div>

      <div className="bg-card border border-border rounded-xl p-8 space-y-8">
        {/* Basic Information */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" />
            Basic Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Job Title *
              </label>
              <Input
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="e.g., Senior Software Engineer"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Department *
              </label>
              <select
                value={formData.department}
                onChange={(e) => handleInputChange('department', e.target.value)}
                className="w-full px-4 py-2 bg-background text-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select Department</option>
                <option value="Engineering">Engineering</option>
                <option value="Product">Product</option>
                <option value="Design">Design</option>
                <option value="Marketing">Marketing</option>
                <option value="Sales">Sales</option>
                <option value="HR">HR</option>
                <option value="Finance">Finance</option>
                <option value="Operations">Operations</option>
                <option value="Analytics">Analytics</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Location</label>
              <Input
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="e.g., San Francisco, CA"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Employment Type
              </label>
              <select
                value={formData.employment_type}
                onChange={(e) => handleInputChange('employment_type', e.target.value)}
                className="w-full px-4 py-2 bg-background text-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Experience Level
              </label>
              <select
                value={formData.experience_level}
                onChange={(e) => handleInputChange('experience_level', e.target.value)}
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
                value={formData.remote_policy}
                onChange={(e) => handleInputChange('remote_policy', e.target.value)}
                className="w-full px-4 py-2 bg-background text-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="onsite">Onsite</option>
                <option value="hybrid">Hybrid</option>
                <option value="remote">Remote</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Openings Count
              </label>
              <Input
                type="number"
                min="1"
                value={formData.openings_count}
                onChange={(e) => handleInputChange('openings_count', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Salary Information */}
        <div>
          <h2 className="text-xl font-bold text-foreground mb-4">Salary Range</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Min Salary
              </label>
              <Input
                type="number"
                value={formData.salary_range_min}
                onChange={(e) => handleInputChange('salary_range_min', e.target.value)}
                placeholder="e.g., 100000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Max Salary
              </label>
              <Input
                type="number"
                value={formData.salary_range_max}
                onChange={(e) => handleInputChange('salary_range_max', e.target.value)}
                placeholder="e.g., 150000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Currency</label>
              <select
                value={formData.currency}
                onChange={(e) => handleInputChange('currency', e.target.value)}
                className="w-full px-4 py-2 bg-background text-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="INR">INR</option>
                <option value="SAR">SAR</option>
              </select>
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={4}
            className="w-full px-4 py-2 bg-background text-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Brief summary of the role..."
          />
        </div>

        {/* Array Fields */}
        <ArrayField
          label="Requirements"
          items={formData.requirements}
          onAdd={(value) => handleArrayAdd('requirements', value)}
          onRemove={(index) => handleArrayRemove('requirements', index)}
        />

        <ArrayField
          label="Responsibilities"
          items={formData.responsibilities}
          onAdd={(value) => handleArrayAdd('responsibilities', value)}
          onRemove={(index) => handleArrayRemove('responsibilities', index)}
        />

        <ArrayField
          label="Required Skills"
          items={formData.required_skills}
          onAdd={(value) => handleArrayAdd('required_skills', value)}
          onRemove={(index) => handleArrayRemove('required_skills', index)}
        />

        <ArrayField
          label="Preferred Skills"
          items={formData.preferred_skills}
          onAdd={(value) => handleArrayAdd('preferred_skills', value)}
          onRemove={(index) => handleArrayRemove('preferred_skills', index)}
        />

        <ArrayField
          label="Benefits"
          items={formData.benefits}
          onAdd={(value) => handleArrayAdd('benefits', value)}
          onRemove={(index) => handleArrayRemove('benefits', index)}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 mt-8">
        <Button
          variant="outline"
          size="lg"
          onClick={() => setStep('upload')}
          leftIcon={<ArrowLeft className="w-5 h-5" />}
          className="flex-1"
        >
          Back
        </Button>
        <Button
          variant="primary"
          size="lg"
          onClick={handleCreatePosition}
          disabled={step === 'creating'}
          leftIcon={
            step === 'creating' ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Check className="w-5 h-5" />
            )
          }
          className="flex-1"
        >
          {step === 'creating' ? 'Creating...' : 'Create Position'}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      {step === 'upload' && renderUploadStep()}
      {step === 'review' && renderReviewStep()}
    </div>
  );
}

// Array field component
function ArrayField({ label, items, onAdd, onRemove }) {
  const [inputValue, setInputValue] = useState('');

  const handleAdd = () => {
    onAdd(inputValue);
    setInputValue('');
  };

  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-2">{label}</label>
      <div className="space-y-3">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAdd();
              }
            }}
            placeholder={`Add ${label.toLowerCase()}...`}
          />
          <Button variant="outline" onClick={handleAdd} leftIcon={<Plus className="w-4 h-4" />}>
            Add
          </Button>
        </div>
        {items.length > 0 && (
          <div className="space-y-2">
            {items.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-muted/50 px-4 py-2 rounded-lg"
              >
                <span className="text-sm text-foreground">{item}</span>
                <button
                  onClick={() => onRemove(index)}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
