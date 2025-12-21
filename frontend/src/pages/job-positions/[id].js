import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  MapPin,
  Briefcase,
  Calendar,
  Users,
  DollarSign,
  Clock,
  Edit3,
  CheckCircle2,
  Trash2,
  XCircle,
} from 'lucide-react';
import { useRouter } from 'next/router';
import Button from '@/components/ui/Button';
import ConfirmModal from '@/components/ui/ConfirmModal';
import api from '@/utils/api';
import toast from 'react-hot-toast';

export default function JobPositionDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [position, setPosition] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modal state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: '',
    cancelText: 'Cancel',
    variant: 'default',
    onConfirm: () => {},
    onCancel: () => {},
  });

  // Mock data - will be replaced with API call
  const mockPositions = {
    '1': {
      id: '1',
      title: 'Senior Frontend Developer',
      department: 'Engineering',
      location: 'San Francisco, CA',
      employment_type: 'full-time',
      experience_level: 'senior',
      status: 'open',
      daysOpen: 12,
      candidateCount: 24,
      openings_count: 2,
      remote_policy: 'hybrid',
      salary_range_min: 120000,
      salary_range_max: 180000,
      currency: 'USD',
      description:
        'We are seeking a talented Senior Frontend Developer to join our growing Engineering team. This is an exciting opportunity to work on cutting-edge projects and make a significant impact on our products used by millions of users worldwide.',
      requirements: [
        'Bachelor degree in Computer Science or equivalent experience',
        '5+ years of professional frontend development experience',
        'Strong proficiency in React and modern JavaScript (ES6+)',
        'Experience with state management (Redux, Context API, or similar)',
        'Excellent problem-solving and communication skills',
      ],
      responsibilities: [
        'Lead frontend development for major product features',
        'Mentor junior developers and conduct code reviews',
        'Architect scalable and maintainable frontend solutions',
        'Collaborate with designers, backend engineers, and product managers',
        'Drive technical excellence and best practices across the team',
      ],
      required_skills: ['React', 'TypeScript', 'Next.js', 'TailwindCSS', 'Git'],
      preferred_skills: ['Node.js', 'GraphQL', 'Testing (Jest, Cypress)', 'Performance Optimization'],
      benefits: [
        'Comprehensive health insurance (medical, dental, vision)',
        '401k matching up to 6%',
        'Remote work flexibility',
        'Professional development budget ($2,000/year)',
        'Unlimited PTO',
        'Stock options',
      ],
      interviewStages: {
        screening: 8,
        technical: 6,
        cultural: 4,
        final: 2,
      },
    },
    '2': {
      id: '2',
      title: 'Product Manager',
      department: 'Product',
      location: 'Remote',
      employment_type: 'full-time',
      experience_level: 'mid',
      status: 'open',
      daysOpen: 5,
      candidateCount: 31,
      openings_count: 1,
      remote_policy: 'remote',
      salary_range_min: 100000,
      salary_range_max: 140000,
      currency: 'USD',
      description:
        'Join our Product team as a Product Manager to drive strategic initiatives and deliver exceptional user experiences. You will work closely with engineering, design, and stakeholders to define product roadmaps and drive execution.',
      requirements: [
        '3-5 years of product management experience',
        'Strong analytical and data-driven decision-making skills',
        'Experience with agile development methodologies',
        'Excellent communication and stakeholder management',
        'Track record of successful product launches',
      ],
      responsibilities: [
        'Define product vision and strategy',
        'Prioritize features and manage product roadmap',
        'Work with engineering and design teams',
        'Analyze user feedback and market trends',
        'Drive product metrics and KPIs',
      ],
      required_skills: ['Product Strategy', 'Agile/Scrum', 'Data Analysis', 'Stakeholder Management'],
      preferred_skills: ['SQL', 'Analytics Tools (Mixpanel, Amplitude)', 'A/B Testing', 'Wireframing'],
      benefits: [
        'Health, dental, and vision insurance',
        '401k with company match',
        'Fully remote position',
        'Home office stipend',
        'Flexible working hours',
        'Annual company retreat',
      ],
      interviewStages: {
        screening: 12,
        technical: 8,
        cultural: 5,
        final: 3,
      },
    },
    '3': {
      id: '3',
      title: 'UX Designer',
      department: 'Design',
      location: 'New York, NY',
      employment_type: 'full-time',
      experience_level: 'mid',
      status: 'open',
      daysOpen: 8,
      candidateCount: 18,
      openings_count: 1,
      remote_policy: 'hybrid',
      salary_range_min: 90000,
      salary_range_max: 130000,
      currency: 'USD',
      description:
        'We are looking for a creative UX Designer to craft intuitive and delightful user experiences. You will collaborate with product managers and engineers to design solutions that meet both user needs and business goals.',
      requirements: [
        '3-5 years of UX/UI design experience',
        'Strong portfolio demonstrating user-centered design',
        'Proficiency in Figma and design systems',
        'Experience with user research and testing',
        'Understanding of accessibility standards',
      ],
      responsibilities: [
        'Design user flows, wireframes, and high-fidelity mockups',
        'Conduct user research and usability testing',
        'Collaborate with cross-functional teams',
        'Maintain and evolve design system',
        'Present design concepts to stakeholders',
      ],
      required_skills: ['Figma', 'User Research', 'Prototyping', 'Design Systems', 'Accessibility'],
      preferred_skills: ['Motion Design', 'Front-end Development', 'Adobe Creative Suite', 'Sketch'],
      benefits: [
        'Comprehensive health benefits',
        'Hybrid work model (3 days in office)',
        'Design conference budget',
        'Creative workspace in Manhattan',
        'Team lunch stipend',
        'PTO and sick leave',
      ],
      interviewStages: {
        screening: 7,
        technical: 5,
        cultural: 3,
        final: 1,
      },
    },
    '4': {
      id: '4',
      title: 'Data Scientist',
      department: 'Analytics',
      location: 'Austin, TX',
      employment_type: 'full-time',
      experience_level: 'senior',
      status: 'open',
      daysOpen: 20,
      candidateCount: 15,
      openings_count: 1,
      remote_policy: 'onsite',
      salary_range_min: 130000,
      salary_range_max: 170000,
      currency: 'USD',
      description:
        'Join our Analytics team as a Senior Data Scientist to drive data-driven decision making across the organization. You will build predictive models, analyze complex datasets, and deliver actionable insights to leadership.',
      requirements: [
        'MS or PhD in Statistics, Computer Science, or related field',
        '5+ years of experience in data science or analytics',
        'Strong programming skills in Python and SQL',
        'Experience with machine learning frameworks',
        'Proven track record of delivering business impact',
      ],
      responsibilities: [
        'Build and deploy machine learning models',
        'Analyze large datasets to uncover insights',
        'Develop data pipelines and ETL processes',
        'Collaborate with business stakeholders',
        'Present findings to executive leadership',
      ],
      required_skills: ['Python', 'SQL', 'Machine Learning', 'Statistics', 'Data Visualization'],
      preferred_skills: ['TensorFlow/PyTorch', 'Spark', 'AWS/GCP', 'R', 'Deep Learning'],
      benefits: [
        'Competitive health and wellness benefits',
        'Relocation assistance available',
        'Conference and training budget',
        'Modern office in downtown Austin',
        'Stock options',
        'Generous PTO policy',
      ],
      interviewStages: {
        screening: 5,
        technical: 4,
        cultural: 2,
        final: 1,
      },
    },
  };

  // Fetch job position details
  const fetchJobPosition = async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      const response = await api.get(`/job-positions/${id}`);

      if (response.data.success) {
        setPosition(response.data.data.position);
      }
    } catch (error) {
      console.error('Error fetching job position:', error);
      toast.error('Failed to load job position');
      setPosition(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchJobPosition();
    }
  }, [id]);

  // Handle delete position
  const handleDelete = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Position',
      message: 'Are you sure you want to delete this position? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger',
      onConfirm: async () => {
        try {
          const response = await api.delete(`/job-positions/${id}`);

          if (response.data.success) {
            toast.success('Position deleted successfully');
            router.push('/job-positions');
          } else {
            toast.error('Failed to delete position');
          }
        } catch (error) {
          console.error('Error deleting position:', error);
          toast.error('Failed to delete position');
        }
      },
    });
  };

  // Handle status change from dropdown
  const handleStatusChange = (e) => {
    const newStatus = e.target.value;
    const selectElement = e.target;

    if (newStatus === position.status) {
      return; // No change
    }

    const actionText = newStatus === 'closed' ? 'close' : 'reopen';
    const originalStatus = position.status;

    setConfirmModal({
      isOpen: true,
      title: `${actionText === 'close' ? 'Close' : 'Reopen'} Position`,
      message: `Are you sure you want to ${actionText} this position?`,
      confirmText: actionText === 'close' ? 'Close Position' : 'Reopen Position',
      cancelText: 'Cancel',
      variant: 'default',
      onConfirm: async () => {
        try {
          const response = await api.put(`/job-positions/${id}`, {
            ...position,
            status: newStatus,
          });

          if (response.data.success) {
            toast.success(`Position ${newStatus === 'closed' ? 'closed' : 'reopened'} successfully`);
            setPosition(response.data.data.position);
          } else {
            toast.error(`Failed to ${actionText} position`);
            selectElement.value = position.status; // Reset on failure
          }
        } catch (error) {
          console.error(`Error ${actionText}ing position:`, error);
          toast.error(`Failed to ${actionText} position`);
          selectElement.value = position.status; // Reset on error
        }
      },
      onCancel: () => {
        // Reset dropdown to original value when user cancels
        selectElement.value = originalStatus;
      },
    });
  };

  // Close confirmation modal
  const closeModal = () => {
    // Call onCancel callback if it exists
    if (confirmModal.onCancel) {
      confirmModal.onCancel();
    }

    setConfirmModal({
      ...confirmModal,
      isOpen: false,
    });
  };

  const getDepartmentColor = (dept) => {
    const colors = {
      Engineering: 'bg-blue-pastel text-blue-800 dark:bg-blue-600 dark:text-blue-100',
      Product: 'bg-lime-pastel text-green-800 dark:bg-green-600 dark:text-green-100',
      Design: 'bg-coral-pastel text-red-800 dark:bg-red-600 dark:text-red-100',
      Analytics: 'bg-yellow-pastel text-yellow-800 dark:bg-yellow-600 dark:text-yellow-100',
      Marketing: 'bg-teal-pastel text-teal-800 dark:bg-teal-600 dark:text-teal-100',
    };
    return colors[dept] || 'bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-100';
  };

  const formatSalary = (min, max, currency) => {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    });
    return `${formatter.format(min)} - ${formatter.format(max)}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!position) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">Position Not Found</h2>
          <p className="text-muted-foreground mb-6">The job position you're looking for doesn't exist.</p>
          <Button onClick={() => router.push('/job-positions')}>Back to Positions</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-card border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back Button */}
          <button
            onClick={() => router.push('/job-positions')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Positions</span>
          </button>

          {/* Title Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Title and Department */}
            <div className="flex items-center gap-3 mb-4">
              <h1 className="text-3xl lg:text-4xl font-bold text-foreground">{position.title}</h1>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${getDepartmentColor(position.department)}`}
              >
                {position.department}
              </span>
            </div>

            {/* Metadata and Action Buttons Row */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              {/* Left: Metadata */}
              <div className="flex-1 space-y-3">
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{position.location}</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    <span className="capitalize">{position.employment_type?.replace('-', ' ')}</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span className="capitalize">{position.remote_policy}</span>
                  </div>
                </div>

                {/* Salary and Openings */}
                <div className="flex items-center gap-6">
                  {position.salary_range_min && position.salary_range_max ? (
                    <div className="flex items-center gap-2 text-lg font-semibold text-foreground">
                      <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                      <span>
                        {formatSalary(position.salary_range_min, position.salary_range_max, position.currency)}
                      </span>
                    </div>
                  ) : null}
                  <span className="text-sm text-muted-foreground">
                    {position.openings_count} opening{position.openings_count !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {/* Right: Action Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Status Dropdown */}
                <select
                  value={position.status || 'open'}
                  onChange={handleStatusChange}
                  className="px-4 py-2.5 bg-background text-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm font-medium capitalize cursor-pointer hover:border-primary transition-colors"
                >
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                </select>

                <Button
                  variant="secondary"
                  leftIcon={<Edit3 className="w-4 h-4" />}
                  onClick={() => router.push(`/job-positions/edit/${position.id}`)}
                >
                  Edit
                </Button>

                <Button
                  variant="primary"
                  leftIcon={<Users className="w-4 h-4" />}
                  onClick={() => router.push(`/job-positions/${position.id}/candidates`)}
                >
                  View Candidates
                </Button>

                <Button
                  variant="danger"
                  leftIcon={<Trash2 className="w-4 h-4" />}
                  onClick={handleDelete}
                >
                  Delete
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <div className="bg-card border border-border rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Days Open</span>
              <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-3xl font-bold text-foreground">
              {position.created_at
                ? Math.floor((new Date() - new Date(position.created_at)) / (1000 * 60 * 60 * 24))
                : 0}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Since position opened</p>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Openings</span>
              <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <p className="text-3xl font-bold text-foreground">{position.openings_count || 1}</p>
            <p className="text-xs text-muted-foreground mt-1">Available positions</p>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Status</span>
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-3xl font-bold text-foreground capitalize">{position.status || 'open'}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {position.status === 'open' ? 'Actively hiring' : 'Not currently hiring'}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            {position.description && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-card border border-border rounded-xl p-8"
              >
                <h2 className="text-2xl font-bold text-foreground mb-4">About the Role</h2>
                <p className="text-foreground leading-relaxed text-lg">{position.description}</p>
              </motion.div>
            )}

            {/* Requirements */}
            {position.requirements && position.requirements.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-card border border-border rounded-xl p-8"
              >
                <h2 className="text-2xl font-bold text-foreground mb-6">Requirements</h2>
                <ul className="space-y-4">
                  {position.requirements.map((req, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-foreground">
                      <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                      <span className="text-base">{req}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}

            {/* Responsibilities */}
            {position.responsibilities && position.responsibilities.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-card border border-border rounded-xl p-8"
              >
                <h2 className="text-2xl font-bold text-foreground mb-6">Key Responsibilities</h2>
                <ul className="space-y-4">
                  {position.responsibilities.map((resp, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-foreground">
                      <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                      <span className="text-base">{resp}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}

            {/* Benefits */}
            {position.benefits && position.benefits.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-xl p-8"
              >
                <h2 className="text-2xl font-bold text-foreground mb-6">What We Offer</h2>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {position.benefits.map((benefit, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-foreground">
                      <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="text-base">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Skills */}
            {position.required_skills && position.required_skills.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-card border border-border rounded-xl p-6"
              >
                <h3 className="text-lg font-bold text-foreground mb-4">Required Skills</h3>
                <div className="flex flex-wrap gap-2 mb-6">
                  {position.required_skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-4 py-2 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-full text-sm font-medium border border-blue-200 dark:border-blue-700"
                    >
                      {skill}
                    </span>
                  ))}
                </div>

                {position.preferred_skills && position.preferred_skills.length > 0 && (
                  <>
                    <h3 className="text-lg font-bold text-foreground mb-4">Preferred Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {position.preferred_skills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-4 py-2 bg-muted text-foreground rounded-full text-sm border border-border"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {/* Position Details */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-card border border-border rounded-xl p-6"
            >
              <h3 className="text-lg font-bold text-foreground mb-4">Position Details</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-border">
                  <span className="text-sm text-muted-foreground">Experience Level</span>
                  <span className="text-sm font-medium text-foreground capitalize">
                    {position.experience_level || 'Not specified'}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-border">
                  <span className="text-sm text-muted-foreground">Employment Type</span>
                  <span className="text-sm font-medium text-foreground capitalize">
                    {position.employment_type?.replace('-', ' ') || 'Full-time'}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-border">
                  <span className="text-sm text-muted-foreground">Remote Policy</span>
                  <span className="text-sm font-medium text-foreground capitalize">
                    {position.remote_policy || 'Not specified'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Created</span>
                  <span className="text-sm font-medium text-foreground">
                    {position.created_at
                      ? new Date(position.created_at).toLocaleDateString()
                      : 'N/A'}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={closeModal}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        cancelText={confirmModal.cancelText}
        variant={confirmModal.variant}
      />
    </div>
  );
}
