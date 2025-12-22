import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Filter, MapPin, Users, Calendar, Briefcase, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/router';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import api from '@/utils/api';
import toast from 'react-hot-toast';

export default function JobPositionsPage() {
  const router = useRouter();
  const [positions, setPositions] = useState([]);
  const [filteredPositions, setFilteredPositions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('open');
  const [isLoading, setIsLoading] = useState(true);

  // Fetch job positions from API
  const fetchJobPositions = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/job-positions');

      if (response.data.success) {
        const positionsData = response.data.data.positions || [];
        setPositions(positionsData);
        setFilteredPositions(positionsData);
      }
    } catch (error) {
      console.error('Error fetching job positions:', error);
      toast.error('Failed to load job positions');
      setPositions([]);
      setFilteredPositions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Mock data for fallback - will connect to API later
  const mockPositions = [
    {
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
    {
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
    {
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
    {
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
  ];

  useEffect(() => {
    fetchJobPositions();
  }, []);

  useEffect(() => {
    let filtered = positions;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (pos) =>
          pos.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          pos.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
          pos.location.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    // Filter by department
    if (selectedDepartment !== 'all') {
      filtered = filtered.filter((pos) => pos.department === selectedDepartment);
    }

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter((pos) => pos.status === selectedStatus);
    }

    setFilteredPositions(filtered);
  }, [searchQuery, selectedDepartment, selectedStatus, positions]);

  const departments = ['all', ...new Set(positions.map((p) => p.department))];

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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Back to Home Button */}
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Home</span>
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Open Positions</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {filteredPositions.length} position{filteredPositions.length !== 1 ? 's' : ''}{' '}
                available
              </p>
            </div>
            <Button
              variant="primary"
              size="lg"
              leftIcon={<Plus className="w-5 h-5" />}
              className="whitespace-nowrap"
              onClick={() => router.push('/job-positions/new')}
            >
              New Position
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <Input
                placeholder="Search positions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="w-5 h-5" />}
              />
            </div>

            {/* Department Filter */}
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-4 py-2 bg-background text-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept === 'all' ? 'All Departments' : dept}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 bg-background text-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="on_hold">On Hold</option>
              <option value="filled">Filled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Positions List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredPositions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No positions found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPositions.map((position, index) => (
              <motion.div
                key={position.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => router.push(`/job-positions/${position.id}`)}
                className="bg-card border border-border rounded-xl p-6 hover:shadow-lg hover:border-primary/50 transition-all duration-200 cursor-pointer"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Left: Position Info */}
                  <div className="flex-1">
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold text-foreground">
                            {position.title}
                          </h3>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${getDepartmentColor(position.department)}`}
                          >
                            {position.department}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-3">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span>{position.location || 'Remote'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Briefcase className="w-4 h-4" />
                            <span className="capitalize">
                              {position.employment_type?.replace('-', ' ') || 'Full-time'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {position.created_at
                                ? `${Math.floor((new Date() - new Date(position.created_at)) / (1000 * 60 * 60 * 24))} days open`
                                : 'Recently opened'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            <span>{position.openings_count || 1} opening{position.openings_count !== 1 ? 's' : ''}</span>
                          </div>
                        </div>

                        <div className="text-sm text-muted-foreground">
                          {formatSalary(
                            position.salary_range_min,
                            position.salary_range_max,
                            position.currency,
                          )}
                        </div>
                        {position.created_by_user && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                            <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                              Created by: {position.created_by_user.name}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Status and Salary */}
                  <div className="flex flex-col items-end gap-3">
                    <span
                      className={`px-4 py-2 rounded-full text-sm font-semibold ${
                        position.status === 'open'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                          : position.status === 'on_hold'
                            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300'
                      }`}
                    >
                      {position.status === 'open'
                        ? 'Actively Hiring'
                        : position.status?.replace('_', ' ') || 'Open'}
                    </span>
                    {position.remote_policy && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="capitalize">{position.remote_policy}</span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
