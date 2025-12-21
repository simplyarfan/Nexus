import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Calendar,
  MessageCircle,
  Send,
  X,
  Loader2,
  Bot,
  User,
  RefreshCw,
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
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Chat state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const chatEndRef = useRef(null);

  // Scroll chat to bottom when new messages arrive
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  // Send chat message
  const handleSendMessage = async () => {
    if (!chatInput.trim() || isSendingMessage) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsSendingMessage(true);

    try {
      const response = await api.post(`/job-positions/${id}/candidates/chat`, {
        question: userMessage,
      });

      if (response.data.success) {
        setChatMessages(prev => [...prev, { role: 'assistant', content: response.data.data.answer }]);
      } else {
        setChatMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I could not process your question. Please try again.' }]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }]);
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Fetch job position and matched candidates
  const fetchMatchedCandidates = async () => {
    if (!id) return;

    try {
      setIsLoading(true);

      // Fetch job position details and matched candidates in parallel
      // Note: Don't use refresh=true by default - it triggers expensive AI matching
      const [positionRes, candidatesRes] = await Promise.all([
        api.get(`/job-positions/${id}`),
        api.get(`/job-positions/${id}/candidates?limit=100`)
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

  // Refresh matches with smart AI matching
  const handleRefreshMatches = async () => {
    if (!id || isRefreshing) return;

    try {
      setIsRefreshing(true);
      toast.loading('Running smart AI matching...', { id: 'refresh-matches' });

      // Call with refresh=true to trigger smart matching
      const candidatesRes = await api.get(`/job-positions/${id}/candidates?refresh=true&limit=100`);

      if (candidatesRes.data.success) {
        setCandidates(candidatesRes.data.data.candidates || []);
        toast.success(`Found ${candidatesRes.data.data.candidates?.length || 0} matching candidates`, { id: 'refresh-matches' });
      }
    } catch (error) {
      console.error('Error refreshing matches:', error);
      toast.error('Failed to refresh matches', { id: 'refresh-matches' });
    } finally {
      setIsRefreshing(false);
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
  }, [isAuthenticated, id]);

  // Score-based coloring for overall match score
  const getOverallScoreColor = (score) => {
    if (score >= 70) return 'text-green-600 dark:text-green-400';
    if (score >= 50) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400'; // Below 50% = red
  };

  const getOverallScoreBgColor = (score) => {
    if (score >= 70) return 'bg-green-100 dark:bg-green-900/20';
    if (score >= 50) return 'bg-yellow-100 dark:bg-yellow-900/20';
    return 'bg-red-100 dark:bg-red-900/20'; // Below 50% = red
  };

  // Score-based coloring for individual score breakdowns
  const getScoreColor = (score) => {
    if (score >= 70) return 'text-green-600 dark:text-green-400';
    if (score >= 50) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400'; // Below 50% = red
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
                {candidates.length} candidate{candidates.length !== 1 ? 's' : ''}{' '}
                matched for this position
              </p>
            </div>
            <div className="flex-shrink-0">
              <Button
                onClick={handleRefreshMatches}
                disabled={isRefreshing}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Matching...' : 'Refresh Matches'}
              </Button>
            </div>
          </div>
        </div>
      </div>


      {/* Candidates List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {candidates.length === 0 ? (
          <div className="text-center py-12 bg-card border border-border rounded-xl">
            <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-foreground mb-2">No matching candidates found</p>
            <p className="text-sm text-muted-foreground">
              No candidates have been matched to this position yet
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {candidates.map((match, index) => {
              const candidate = match.candidate;
              const matchAnalysis = match.match_analysis || {};
              const badge = getCategoryBadge(matchAnalysis.match_category);

              return (
                <motion.div
                  key={candidate.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-all duration-200 relative"
                >
                  {/* Rank Badge */}
                  <div className="absolute top-4 right-4 w-12 h-12 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center">
                    <span className="text-xl font-bold text-primary">#{index + 1}</span>
                  </div>

                  <div className="flex flex-col gap-6">
                    {/* Candidate Info */}
                    <div className="flex items-start gap-4 pr-14">
                      {/* Avatar */}
                      <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-border bg-background flex-shrink-0">
                        <img
                          src={getAvatarSvg(candidate.name)}
                          alt={candidate.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h3 className="text-xl font-semibold text-foreground">
                            {candidate.name}
                          </h3>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${badge.color}`}
                          >
                            {badge.label}
                          </span>
                        </div>

                        <div className="space-y-2 mb-3">
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

                        {/* Action Buttons */}
                        <div className="flex gap-2 mt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/candidates/${candidate.id}`)}
                            className="flex-1"
                          >
                            View Profile
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(
                                `/interviews?candidateName=${encodeURIComponent(candidate.name)}&candidateEmail=${encodeURIComponent(candidate.email)}&position=${encodeURIComponent(position.title)}`
                              );
                            }}
                            className="flex-1 bg-green-600 hover:bg-green-700"
                          >
                            <Calendar className="w-4 h-4 mr-2" />
                            Check Availability
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Match Score & Why This Ranking */}
                    <div className="flex flex-col lg:flex-row gap-4">
                      {/* Left: Overall Score */}
                      <div
                        className={`lg:w-48 text-center p-4 rounded-xl ${getOverallScoreBgColor(matchAnalysis.position_match_score || 0)}`}
                      >
                        <div className="flex items-center justify-center gap-2 mb-1">
                          <Star className={`w-5 h-5 ${getOverallScoreColor(matchAnalysis.position_match_score || 0)}`} />
                          <span className="text-sm font-medium text-muted-foreground">
                            Overall Match
                          </span>
                        </div>
                        <p
                          className={`text-4xl font-bold ${getOverallScoreColor(matchAnalysis.position_match_score || 0)}`}
                        >
                          {matchAnalysis.position_match_score || 0}%
                        </p>
                      </div>

                      {/* Right: Score Breakdown */}
                      <div className="flex-1 bg-muted/30 p-4 rounded-xl">
                        <div className="grid grid-cols-3 gap-3">
                          <div className="text-center">
                            <div className="text-xs text-muted-foreground mb-1">Skills</div>
                            <div className={`text-lg font-bold ${getScoreColor(matchAnalysis.skills_match_score)}`}>
                              {matchAnalysis.skills_match_score || 0}%
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-muted-foreground mb-1">Experience</div>
                            <div className={`text-lg font-bold ${getScoreColor(matchAnalysis.experience_match_score)}`}>
                              {matchAnalysis.experience_match_score || 0}%
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-muted-foreground mb-1">Context</div>
                            <div className={`text-lg font-bold ${getScoreColor(matchAnalysis.context_match_score)}`}>
                              {matchAnalysis.context_match_score || 0}%
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Detailed Skills Breakdown - Always show */}
                    <div className="bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-700 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-4">
                        <Award className="w-4 h-4 text-primary" />
                        <span className="text-sm font-semibold text-foreground">
                          Skills Analysis
                        </span>
                      </div>

                      {/* Show skill breakdown using exact job skills */}
                      {(position.required_skills?.length > 0 || position.preferred_skills?.length > 0) ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Required Skills - from job position */}
                          <div>
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                              Required Skills ({position.required_skills?.filter(skill =>
                                matchAnalysis.matched_required_skills?.some(m => m.toLowerCase() === skill.toLowerCase())
                              ).length || 0}/{position.required_skills?.length || 0})
                            </h4>
                            <div className="space-y-1">
                              {position.required_skills?.map((skill, idx) => {
                                const isMatched = matchAnalysis.matched_required_skills?.some(
                                  m => m.toLowerCase() === skill.toLowerCase()
                                );
                                return (
                                  <div key={`req-${idx}`} className="flex items-center gap-2 text-sm">
                                    {isMatched ? (
                                      <>
                                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                        <span className="text-green-700 dark:text-green-300">{skill}</span>
                                      </>
                                    ) : (
                                      <>
                                        <X className="w-4 h-4 text-red-500 flex-shrink-0" />
                                        <span className="text-red-700 dark:text-red-300">{skill}</span>
                                      </>
                                    )}
                                  </div>
                                );
                              })}
                              {!position.required_skills?.length && (
                                <span className="text-xs text-muted-foreground italic">No required skills specified</span>
                              )}
                            </div>
                          </div>

                          {/* Preferred Skills - from job position */}
                          <div>
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                              Preferred Skills ({position.preferred_skills?.filter(skill =>
                                matchAnalysis.matched_preferred_skills?.some(m => m.toLowerCase() === skill.toLowerCase())
                              ).length || 0}/{position.preferred_skills?.length || 0})
                            </h4>
                            <div className="space-y-1">
                              {position.preferred_skills?.map((skill, idx) => {
                                const isMatched = matchAnalysis.matched_preferred_skills?.some(
                                  m => m.toLowerCase() === skill.toLowerCase()
                                );
                                return (
                                  <div key={`pref-${idx}`} className="flex items-center gap-2 text-sm">
                                    {isMatched ? (
                                      <>
                                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                        <span className="text-green-700 dark:text-green-300">{skill}</span>
                                      </>
                                    ) : (
                                      <>
                                        <X className="w-4 h-4 text-orange-500 flex-shrink-0" />
                                        <span className="text-orange-700 dark:text-orange-300">{skill}</span>
                                      </>
                                    )}
                                  </div>
                                );
                              })}
                              {!position.preferred_skills?.length && (
                                <span className="text-xs text-muted-foreground italic">No preferred skills specified</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-sm text-muted-foreground">
                            No required or preferred skills defined for this position.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* AI Reasoning - Why This Ranking */}
                    {matchAnalysis.match_reasoning && (
                      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          <span className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                            Why Ranked #{index + 1}?
                          </span>
                        </div>
                        <p className="text-sm text-blue-900 dark:text-blue-100 leading-relaxed">
                          {matchAnalysis.match_reasoning}
                        </p>
                      </div>
                    )}

                    {/* Strengths and Concerns */}
                    {(matchAnalysis.match_strengths?.length > 0 || matchAnalysis.match_concerns?.length > 0) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {matchAnalysis.match_strengths?.length > 0 && (
                          <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 p-4 rounded-lg">
                            <div className="flex items-center gap-2 mb-3">
                              <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                              <span className="text-sm font-semibold text-green-900 dark:text-green-100">
                                Key Strengths
                              </span>
                            </div>
                            <ul className="space-y-2">
                              {matchAnalysis.match_strengths.map((strength, idx) => (
                                <li
                                  key={idx}
                                  className="text-sm text-green-900 dark:text-green-100 flex items-start gap-2"
                                >
                                  <span className="text-green-600 dark:text-green-400 mt-0.5 font-bold">✓</span>
                                  <span>{strength}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {matchAnalysis.match_concerns?.length > 0 && (
                          <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 p-4 rounded-lg">
                            <div className="flex items-center gap-2 mb-3">
                              <AlertCircle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                              <span className="text-sm font-semibold text-orange-900 dark:text-orange-100">
                                Areas to Consider
                              </span>
                            </div>
                            <ul className="space-y-2">
                              {matchAnalysis.match_concerns.map((concern, idx) => (
                                <li
                                  key={idx}
                                  className="text-sm text-orange-900 dark:text-orange-100 flex items-start gap-2"
                                >
                                  <span className="text-orange-600 dark:text-orange-400 mt-0.5 font-bold">!</span>
                                  <span>{concern}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* AI Chat Button */}
      <button
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary hover:bg-primary/90 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105 z-40"
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      {/* AI Chat Panel */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 w-96 h-[500px] bg-card border border-border rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden"
          >
            {/* Chat Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-primary text-white rounded-t-2xl">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5" />
                <span className="font-semibold">Ask AI about Candidates</span>
              </div>
              <button
                onClick={() => setIsChatOpen(false)}
                className="p-1 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatMessages.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  <Bot className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm font-medium mb-2">Ask me anything about the candidates!</p>
                  <p className="text-xs">For example:</p>
                  <div className="mt-3 space-y-2">
                    {[
                      'Why was this candidate matched?',
                      'Who has the best skills match?',
                      'What are the concerns for this candidate?',
                    ].map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setChatInput(suggestion);
                        }}
                        className="block w-full text-left text-xs bg-muted/50 hover:bg-muted px-3 py-2 rounded-lg transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${
                      msg.role === 'user'
                        ? 'bg-primary text-white rounded-br-md'
                        : 'bg-muted text-foreground rounded-bl-md'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              ))}

              {isSendingMessage && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                  <div className="bg-muted px-4 py-3 rounded-2xl rounded-bl-md">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-border">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Ask about candidates..."
                  className="flex-1 px-4 py-2 bg-background border border-border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  disabled={isSendingMessage}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!chatInput.trim() || isSendingMessage}
                  className="w-10 h-10 bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground text-white rounded-full flex items-center justify-center transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
