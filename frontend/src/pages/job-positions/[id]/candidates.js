import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Search,
  Users,
  Star,
  TrendingUp,
  Briefcase,
  MapPin,
  DollarSign,
  Award,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { useRouter } from 'next/router';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { createAvatar } from '@dicebear/core';
import { lorelei } from '@dicebear/collection';
import api from '@/utils/api';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';

export default function JobPositionCandidatesPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [position, setPosition] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [filteredCandidates, setFilteredCandidates] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [minScore, setMinScore] = useState(60);

  // Fetch job position and matched candidates
  const fetchMatchedCandidates = async () => {
    if (!id) return;

    try {
      setIsLoading(true);

      // Fetch job position details and matched candidates in parallel
      const [positionRes, candidatesRes] = await Promise.all([
        api.get(`/job-positions/${id}`),
        api.get(`/job-positions/${id}/candidates?minScore=${minScore}&limit=100`)
      ]);

      if (positionRes.data.success) {
        setPosition(positionRes.data.data.position);
      }

      if (candidatesRes.data.success) {
        setCandidates(candidatesRes.data.data.candidates || []);
      }
    } catch (error) {
      console.error('Error fetching matched candidates:', error);
      toast.error('Failed to load matched candidates');
      setCandidates([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // Fetch data when authenticated and ID is available
  useEffect(() => {
    if (isAuthenticated && id) {
      fetchMatchedCandidates();
    }
  }, [isAuthenticated, id, minScore]);

  // Filter candidates based on search and match category
  useEffect(() => {
    let filtered = candidates;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (match) =>
          match.candidate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          match.candidate.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          match.candidate.location?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by match category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(
        (match) => match.match_analysis?.match_category === selectedCategory
      );
    }

    setFilteredCandidates(filtered);
  }, [searchQuery, selectedCategory, candidates]);

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-600 dark:text-green-400';
    if (score >= 80) return 'text-blue-600 dark:text-blue-400';
    if (score >= 70) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-orange-600 dark:text-orange-400';
  };

  const getScoreBgColor = (score) => {
    if (score >= 90) return 'bg-green-100 dark:bg-green-900/20';
    if (score >= 80) return 'bg-blue-100 dark:bg-blue-900/20';
    if (score >= 70) return 'bg-yellow-100 dark:bg-yellow-900/20';
    return 'bg-orange-100 dark:bg-orange-900/20';
  };

  const getCategoryBadge = (category) => {
    const badges = {
      excellent: { label: 'Excellent Match', color: 'bg-green-500 text-white' },
      strong: { label: 'Strong Match', color: 'bg-blue-500 text-white' },
      moderate: { label: 'Moderate Match', color: 'bg-yellow-500 text-white' },
    };
    return badges[category] || badges.moderate;
  };

  // Generate artistic avatar
  const getAvatarSvg = (name) => {
    const avatar = createAvatar(lorelei, {
      seed: name,
      backgroundColor: ['transparent'],
    });
    return avatar.toDataUri();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Finding best matches...</p>
        </div>
      </div>
    );
  }

  if (!position) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">Position Not Found</h2>
          <Button onClick={() => router.push('/job-positions')}>Back to Positions</Button>
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
            onClick={() => router.push(`/job-positions/${id}`)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Position</span>
          </button>

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Sparkles className="w-8 h-8 text-primary" />
                <h1 className="text-3xl font-bold text-foreground">AI-Matched Candidates</h1>
              </div>
              <h2 className="text-xl text-muted-foreground mb-2">{position.title}</h2>
              <p className="text-sm text-muted-foreground">
                {filteredCandidates.length} candidate{filteredCandidates.length !== 1 ? 's' : ''}{' '}
                matched for this position
              </p>
            </div>
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
                placeholder="Search candidates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="w-5 h-5" />}
              />
            </div>

            {/* Match Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 bg-background text-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Match Levels</option>
              <option value="excellent">Excellent (85-100%)</option>
              <option value="strong">Strong (70-84%)</option>
              <option value="moderate">Moderate (60-69%)</option>
            </select>

            {/* Min Score Filter */}
            <div className="flex items-center gap-3 px-4 py-2 bg-background border border-border rounded-lg">
              <span className="text-sm text-muted-foreground whitespace-nowrap">Min Score:</span>
              <input
                type="range"
                min="0"
                max="100"
                value={minScore}
                onChange={(e) => setMinScore(parseInt(e.target.value))}
                className="w-32"
              />
              <span className="text-sm font-medium text-foreground w-8">{minScore}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Candidates List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredCandidates.length === 0 ? (
          <div className="text-center py-12 bg-card border border-border rounded-xl">
            <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-foreground mb-2">No matching candidates found</p>
            <p className="text-sm text-muted-foreground">
              Try adjusting the filters or lowering the minimum score
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredCandidates.map((match, index) => {
              const candidate = match.candidate;
              const matchAnalysis = match.match_analysis || {};
              const badge = getCategoryBadge(matchAnalysis.match_category);

              return (
                <motion.div
                  key={candidate.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => router.push(`/candidates/${candidate.id}`)}
                  className="bg-card border border-border rounded-xl p-6 hover:shadow-lg hover:border-primary/50 transition-all duration-200 cursor-pointer"
                >
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Candidate Info - Left Side */}
                    <div className="flex-1">
                      <div className="flex items-start gap-4">
                        {/* Avatar */}
                        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-border bg-background flex-shrink-0">
                          <img
                            src={getAvatarSvg(candidate.name)}
                            alt={candidate.name}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-semibold text-foreground">
                              {candidate.name}
                            </h3>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${badge.color}`}
                            >
                              {badge.label}
                            </span>
                          </div>

                          <div className="space-y-2 mb-4">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Briefcase className="w-4 h-4" />
                              <span>
                                {candidate.current_title} at {candidate.current_company}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <MapPin className="w-4 h-4" />
                              <span>{candidate.location}</span>
                            </div>
                            {candidate.expected_salary_min && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <DollarSign className="w-4 h-4" />
                                <span>
                                  ${candidate.expected_salary_min?.toLocaleString()} - $
                                  {candidate.expected_salary_max?.toLocaleString()}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Reasoning */}
                          {matchAnalysis.reasoning && (
                            <p className="text-sm text-foreground bg-muted/50 p-3 rounded-lg">
                              {matchAnalysis.reasoning}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Match Scores - Right Side */}
                    <div className="lg:w-80 space-y-4">
                      {/* Overall Score */}
                      <div
                        className={`text-center p-4 rounded-xl ${getScoreBgColor(matchAnalysis.position_match_score)}`}
                      >
                        <div className="flex items-center justify-center gap-2 mb-1">
                          <Star className={`w-5 h-5 ${getScoreColor(matchAnalysis.position_match_score)}`} />
                          <span className="text-sm font-medium text-muted-foreground">
                            Overall Match
                          </span>
                        </div>
                        <p
                          className={`text-4xl font-bold ${getScoreColor(matchAnalysis.position_match_score)}`}
                        >
                          {matchAnalysis.position_match_score || 0}
                        </p>
                      </div>

                      {/* Strengths and Concerns */}
                      {(matchAnalysis.match_strengths?.length > 0 || matchAnalysis.match_concerns?.length > 0) && (
                        <div className="space-y-3">
                          {matchAnalysis.match_strengths?.length > 0 && (
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                                <span className="text-xs font-semibold text-foreground">
                                  Strengths
                                </span>
                              </div>
                              <ul className="space-y-1">
                                {matchAnalysis.match_strengths.slice(0, 2).map((strength, idx) => (
                                  <li
                                    key={idx}
                                    className="text-xs text-muted-foreground flex items-start gap-2"
                                  >
                                    <span className="text-green-600 mt-0.5">•</span>
                                    <span>{strength}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {matchAnalysis.match_concerns?.length > 0 && (
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <AlertCircle className="w-4 h-4 text-orange-600" />
                                <span className="text-xs font-semibold text-foreground">
                                  Concerns
                                </span>
                              </div>
                              <ul className="space-y-1">
                                {matchAnalysis.match_concerns.slice(0, 2).map((concern, idx) => (
                                  <li
                                    key={idx}
                                    className="text-xs text-muted-foreground flex items-start gap-2"
                                  >
                                    <span className="text-orange-600 mt-0.5">•</span>
                                    <span>{concern}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
