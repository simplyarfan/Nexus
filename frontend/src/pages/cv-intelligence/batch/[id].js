import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import axios from 'axios';
import * as Icons from 'lucide-react';
import toast from 'react-hot-toast';
import emailService from '../../../services/emailService';
import { useAuth } from '../../../contexts/AuthContext';
import cvAPI from '../../../utils/cvIntelligenceAPI';

const BatchDetail = () => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { id } = router.query;
  const [batch, setBatch] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [showCandidateModal, setShowCandidateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [schedulingInterview, setSchedulingInterview] = useState(null);
  const [connectedEmail, setConnectedEmail] = useState({});

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/landing');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleScheduleInterview = (candidate) => {
    // Navigate to the new interview coordinator with pre-filled data
    // Use batch name as position instead of candidate.position
    router.push({
      pathname: '/interview-coordinator',
      query: {
        action: 'request-availability',
        candidateName: candidate.name,
        candidateEmail: candidate.email,
        position: batch?.name || 'Software Engineer', // Use batch name as position
        from: 'cv-intelligence',
        batchId: id,
      },
    });
  };
  const handleEmailConnected = (provider, userInfo) => {
    setConnectedEmail(emailService.getConnectedEmail());
    toast.success(`${provider === 'outlook' ? 'Outlook' : 'Email'} connected successfully!`);
  };

  // Load connected email on component mount
  useEffect(() => {
    setConnectedEmail(emailService.getConnectedEmail());
  }, []);

  useEffect(() => {
    if (id) {
      fetchBatchDetails();
    }
  }, [id]);

  const fetchBatchDetails = async () => {
    try {
      setLoading(true);
      console.log('🎯 Fetching batch details for ID:', id);
      const response = await cvAPI.getBatchDetails(id);
      console.log('🎯 Batch details response:', response);

      // Handle different response structures - check console for actual structure
      console.log('🔍 Full response structure:', JSON.stringify(response, null, 2));

      const isSuccess = response.success || (response.data && response.data.success);
      const batchData =
        response.data?.data?.batch || response.data?.batch || response.batch || response.data;
      const candidatesData =
        response.data?.data?.candidates || response.data?.candidates || response.candidates || [];

      if (isSuccess && batchData) {
        console.log('🎯 Setting batch data:', batchData);
        console.log('🎯 Setting candidates data:', candidatesData);
        console.log('🎯 Candidates array length:', candidatesData?.length);
        console.log('🎯 First candidate sample:', candidatesData?.[0]);
        setBatch(batchData);
        setCandidates(Array.isArray(candidatesData) ? candidatesData : []);
      } else {
        console.error('🎯 Failed to load batch details:', response);
        toast.error('Failed to load batch details');
        router.push('/cv-intelligence');
      }
    } catch (error) {
      console.error('🎯 Error fetching batch details:', error);
      console.error('🎯 Error details:', error.response?.data);
      toast.error('Failed to load batch details');
      router.push('/cv-intelligence');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBatch = async () => {
    try {
      console.log('🎯 Deleting batch:', id);
      const response = await cvAPI.deleteBatch(id);
      console.log('🎯 Delete response:', response);

      if (response.success || response.data?.success) {
        toast.success('Batch deleted successfully');
        router.push('/cv-intelligence');
      } else {
        toast.error('Failed to delete batch');
      }
    } catch (error) {
      console.error('🎯 Error deleting batch:', error);
      toast.error('Failed to delete batch');
    }
    setShowDeleteModal(false);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBg = (score) => {
    if (score >= 80) return 'bg-green-500/20 border-green-500/30';
    if (score >= 60) return 'bg-yellow-500/20 border-yellow-500/30';
    return 'bg-red-500/20 border-red-500/30';
  };

  const openCandidateModal = (candidate) => {
    setSelectedCandidate(candidate);
    setShowCandidateModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-sm">Loading batch details...</p>
        </div>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Icons.Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Batch Not Found</h2>
          <p className="text-gray-600 mb-6">The requested batch could not be found.</p>
          <button
            onClick={() => router.push('/cv-intelligence')}
            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white rounded-lg transition-colors"
          >
            Back to CV Intelligence
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>{batch.name} - CV Intelligence</title>
        <meta name="description" content="CV batch analysis results" />
      </Head>

      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/cv-intelligence')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Icons.ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                  <Icons.Brain className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">{batch.name}</h1>
                  <p className="text-sm text-gray-500">
                    Created {new Date(batch.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Icons.MoreVertical className="w-5 h-5 text-gray-600" />
                </button>
                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-10">
                    <button
                      onClick={() => {
                        setShowDeleteModal(true);
                        setShowDropdown(false);
                      }}
                      className="w-full flex items-center px-4 py-2 text-left text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Icons.Trash2 className="w-4 h-4 mr-3" />
                      Delete Batch
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Batch Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Icons.Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total CVs</p>
                <p className="text-2xl font-bold text-gray-900">{batch.cv_count || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Icons.CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Analyzed</p>
                <p className="text-2xl font-bold text-gray-900">{candidates.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Icons.TrendingUp className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className="text-lg font-semibold text-gray-900 capitalize">
                  {batch.status || 'Processing'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Candidates List */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Analyzed Candidates</h2>
            <p className="text-sm text-gray-600">Ranked from best to worst match</p>
          </div>

          {candidates.length === 0 ? (
            <div className="text-center py-12">
              <Icons.Brain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No candidates analyzed yet
              </h3>
              <p className="text-gray-600">
                CV analysis is in progress. Please check back in a few minutes.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {candidates
                .sort(
                  (a, b) => (b.score || b.overall_score || 0) - (a.score || a.overall_score || 0),
                )
                .map((candidate, index) => (
                  <div
                    key={candidate.id || index}
                    className="p-6 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                            #{index + 1}
                          </div>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {candidate.personal?.name || candidate.name || `Candidate ${index + 1}`}
                          </h3>
                          <div className="flex items-center space-x-4 mt-1">
                            {candidate.personal?.email && (
                              <div className="flex items-center space-x-1 text-sm text-gray-600">
                                <Icons.Mail className="w-4 h-4" />
                                <span>{candidate.personal.email}</span>
                              </div>
                            )}
                            {candidate.personal?.phone && (
                              <div className="flex items-center space-x-1 text-sm text-gray-600">
                                <Icons.Phone className="w-4 h-4" />
                                <span>{candidate.personal.phone}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div
                            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mb-2 ${
                              index === 0
                                ? 'bg-green-100 text-green-800'
                                : index === 1
                                  ? 'bg-blue-100 text-blue-800'
                                  : index === 2
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {index === 0
                              ? 'Best Match'
                              : index === 1
                                ? 'Strong Candidate'
                                : index === 2
                                  ? 'Good Candidate'
                                  : 'Candidate'}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleScheduleInterview(candidate)}
                            disabled={schedulingInterview === candidate.id}
                            className="inline-flex items-center px-3 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm font-medium"
                          >
                            {schedulingInterview === candidate.id ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Scheduling...
                              </>
                            ) : (
                              <>
                                <Icons.Calendar className="w-4 h-4 mr-2" />
                                Schedule Interview
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => openCandidateModal(candidate)}
                            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors text-sm font-medium"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Skills Preview */}
                    {candidate.skills?.matched && candidate.skills.matched.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <p className="text-sm text-gray-600 mb-2">Key Skills:</p>
                        <div className="flex flex-wrap gap-2">
                          {candidate.skills.matched.slice(0, 5).map((skill, skillIndex) => (
                            <span
                              key={skillIndex}
                              className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium"
                            >
                              {skill}
                            </span>
                          ))}
                          {candidate.skills.matched.length > 5 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                              +{candidate.skills.matched.length - 5} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <Icons.Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Batch</h3>
                <p className="text-sm text-gray-600">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete &quot;{batch.name}&quot;? All analysis results and
              candidate data will be permanently removed.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteBatch}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Delete Batch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Candidate Detail Modal */}
      {showCandidateModal && selectedCandidate && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">
                    #{candidates.findIndex((c) => c.id === selectedCandidate.id) + 1}
                  </span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">
                    {selectedCandidate.name || 'Name not found'}
                  </h2>
                  <p className="text-gray-600">Candidate Analysis Report</p>
                </div>
              </div>
              <button
                onClick={() => setShowCandidateModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Icons.X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Contact Information */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Icons.User className="w-5 h-5 mr-2 text-blue-600" />
                  Contact Information
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Icons.Mail className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-700">
                      {selectedCandidate.email || 'Email not found'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Icons.Phone className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-700">
                      {selectedCandidate.phone || 'Phone not found'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Icons.MapPin className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-700">
                      {selectedCandidate.location || 'Location not specified'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Professional Assessment - MOVED TO TOP */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Icons.FileText className="w-5 h-5 mr-2 text-blue-600" />
                  Professional Assessment
                </h3>
                <div className="space-y-4">
                  {/* Extract professional summary from profile_json.assessment */}
                  {(() => {
                    try {
                      const profileData = selectedCandidate.profile_json || {};
                      const assessment = profileData.assessment || {};
                      const rankingReason =
                        selectedCandidate.rankingReason || assessment.detailedReasoning || '';
                      const rank = selectedCandidate.rank || 0;
                      const recommendationLevel =
                        selectedCandidate.recommendationLevel ||
                        assessment.recommendation ||
                        'Maybe';

                      return (
                        <div className="space-y-4">
                          {/* Main Assessment */}
                          {rankingReason && (
                            <div className="bg-white border border-blue-200 rounded-lg p-4">
                              <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                                Overall Assessment
                              </h4>
                              <p className="text-gray-700 leading-relaxed text-sm whitespace-pre-wrap">
                                {rankingReason}
                              </p>
                            </div>
                          )}

                          {/* Ranking Badge */}
                          <div className="flex items-center justify-between pt-2">
                            <span className="text-sm font-medium text-gray-600">
                              Candidate Rank:
                            </span>
                            <span
                              className={`px-4 py-2 rounded-full text-sm font-bold flex items-center ${
                                rank === 1
                                  ? 'bg-green-100 text-green-800 border-2 border-green-300'
                                  : rank === 2
                                    ? 'bg-blue-100 text-blue-800 border-2 border-blue-300'
                                    : rank === 3
                                      ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-300'
                                      : 'bg-gray-100 text-gray-800 border-2 border-gray-300'
                              }`}
                            >
                              #{rank} {rank === 1 && '🏆'}
                            </span>
                          </div>

                          {/* Recommendation Level */}
                          {recommendationLevel && (
                            <div className="flex items-center justify-between pt-2 border-t border-blue-200">
                              <span className="text-sm font-medium text-gray-600">
                                Recommendation:
                              </span>
                              <span
                                className={`px-4 py-2 rounded-full text-sm font-bold ${
                                  recommendationLevel === 'Strong Hire'
                                    ? 'bg-green-100 text-green-800'
                                    : recommendationLevel === 'Hire'
                                      ? 'bg-blue-100 text-blue-800'
                                      : recommendationLevel === 'Maybe'
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {recommendationLevel}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    } catch (error) {
                      console.error('Error rendering professional assessment:', error);
                      return <p className="text-gray-500 text-sm">Assessment not available</p>;
                    }
                  })()}
                </div>
              </div>

              {/* Skills Analysis */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Icons.Code className="w-5 h-5 mr-2 text-purple-600" />
                  Skills Analysis
                </h3>
                <div className="space-y-4">
                  {/* Extract skills from profile_json (smart-matched by backend) */}
                  {(() => {
                    try {
                      // Use smart-matched skills from backend
                      const profileData = selectedCandidate.profile_json || {};
                      const candidateSkills = profileData.skills || [];

                      // Get smart-matched skills from backend (already computed with semantic matching)
                      const matchedSkills = profileData.matchedSkills || [];
                      const missingSkills = profileData.missingSkills || [];

                      // Get critical skills from JD
                      const jdRequirements = batch?.jd_requirements || { skills: [], mustHave: [] };
                      const criticalSkills = jdRequirements.mustHave || [];

                      // All candidate skills
                      const allSkills = Array.isArray(candidateSkills) ? candidateSkills : [];

                      return (
                        <>
                          {matchedSkills.length > 0 && (
                            <div>
                              <p className="text-sm font-medium text-green-700 mb-2">
                                Required Skills Match:
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {matchedSkills.map((skill, index) => {
                                  const isCritical = criticalSkills.some(
                                    (critical) => critical.toLowerCase() === skill.toLowerCase(),
                                  );
                                  return (
                                    <span
                                      key={index}
                                      className={`px-3 py-1 rounded-full text-sm font-medium flex items-center ${
                                        isCritical
                                          ? 'bg-green-200 text-green-900 border border-green-300'
                                          : 'bg-green-100 text-green-800'
                                      }`}
                                    >
                                      {isCritical && (
                                        <span className="mr-1 text-green-600">⚡</span>
                                      )}
                                      {skill}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {missingSkills.length > 0 && (
                            <div>
                              <p className="text-sm font-medium text-red-700 mb-2">
                                Missing Required Skills:
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {missingSkills.map((skill, index) => {
                                  const isCritical = criticalSkills.some(
                                    (critical) => critical.toLowerCase() === skill.toLowerCase(),
                                  );
                                  return (
                                    <span
                                      key={index}
                                      className={`px-3 py-1 rounded-full text-sm font-medium flex items-center ${
                                        isCritical
                                          ? 'bg-red-200 text-red-900 border border-red-400'
                                          : 'bg-red-100 text-red-800'
                                      }`}
                                    >
                                      {isCritical && <span className="mr-1 text-red-600">!</span>}
                                      {skill}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {(() => {
                            // Get additional skills (skills candidate has but not in matched or missing)
                            const allRequiredSkills = [...matchedSkills, ...missingSkills];
                            const irrelevantSkills = allSkills.filter(
                              (skill) =>
                                !allRequiredSkills.some(
                                  (req) => req.toLowerCase() === skill.toLowerCase(),
                                ),
                            );

                            return (
                              irrelevantSkills.length > 0 && (
                                <div>
                                  <p className="text-sm font-medium text-gray-700 mb-2">
                                    Additional Skills (Not Required for JD):
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    {irrelevantSkills.map((skill, index) => (
                                      <span
                                        key={index}
                                        className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium"
                                      >
                                        {skill}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )
                            );
                          })()}

                          {matchedSkills.length === 0 &&
                            missingSkills.length === 0 &&
                            allSkills.length === 0 && (
                              <p className="text-gray-500 text-sm">Skills analysis not available</p>
                            )}

                          {/* Skills Gap Chart */}
                          {(matchedSkills.length > 0 || missingSkills.length > 0) && (
                            <div className="mt-6 pt-6 border-t border-gray-200">
                              <h4 className="text-sm font-semibold text-gray-900 mb-4">
                                Skills Gap Analysis
                              </h4>
                              <div className="space-y-3">
                                {/* Match Percentage Bar */}
                                <div>
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-medium text-gray-600">
                                      JD Match Rate (Smart Matching)
                                    </span>
                                    <span className="text-xs font-bold text-gray-900">
                                      {Math.round(
                                        (matchedSkills.length /
                                          (matchedSkills.length + missingSkills.length)) *
                                          100,
                                      )}
                                      %
                                    </span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                    <div
                                      className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500"
                                      style={{
                                        width: `${(matchedSkills.length / (matchedSkills.length + missingSkills.length)) * 100}%`,
                                      }}
                                    ></div>
                                  </div>
                                </div>

                                {/* Skills Breakdown */}
                                <div className="grid grid-cols-3 gap-3 mt-4">
                                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                                    <div className="text-2xl font-bold text-green-700">
                                      {matchedSkills.length}
                                    </div>
                                    <div className="text-xs text-green-600 mt-1">Matched</div>
                                  </div>
                                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                                    <div className="text-2xl font-bold text-red-700">
                                      {missingSkills.length}
                                    </div>
                                    <div className="text-xs text-red-600 mt-1">Missing</div>
                                  </div>
                                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                                    <div className="text-2xl font-bold text-blue-700">
                                      {allSkills.length}
                                    </div>
                                    <div className="text-xs text-blue-600 mt-1">Total Skills</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      );
                    } catch (e) {
                      return <p className="text-gray-500 text-sm">Skills data parsing error</p>;
                    }
                  })()}
                </div>
              </div>

              {/* Professional Experience */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Icons.Briefcase className="w-5 h-5 mr-2 text-green-600" />
                  Professional Experience
                </h3>
                <div className="space-y-3">
                  {/* Extract experience from profile_json */}
                  {(() => {
                    try {
                      const profileData = selectedCandidate.profile_json || {};
                      const allExperience = profileData.experience || [];

                      // Filter out competitions - only count real company jobs
                      const realJobs = allExperience.filter((exp) => {
                        const company = (exp.company || '').toLowerCase();
                        const role = (exp.role || '').toLowerCase();
                        // Exclude if it's a competition, hackathon, or similar
                        return (
                          !company.includes('competition') &&
                          !company.includes('hackathon') &&
                          !role.includes('competitor') &&
                          !role.includes('participant')
                        );
                      });

                      // Calculate actual years of experience from date ranges
                      const calculateYears = (start, end) => {
                        try {
                          const startDate = new Date(start);
                          const endDate =
                            end && end.toLowerCase() !== 'present' ? new Date(end) : new Date();
                          const months = (endDate - startDate) / (1000 * 60 * 60 * 24 * 30);
                          return Math.max(0, months / 12);
                        } catch {
                          return 0;
                        }
                      };

                      const experienceYears = realJobs
                        .reduce((total, exp) => {
                          return total + calculateYears(exp.startDate, exp.endDate);
                        }, 0)
                        .toFixed(1);

                      const experience = realJobs; // Use only real jobs

                      return (
                        <div className="space-y-4">
                          <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                            <span className="text-sm font-medium text-gray-600">
                              Total Experience:
                            </span>
                            <span className="font-semibold text-gray-900">
                              {experienceYears} years • {experience.length} positions
                            </span>
                          </div>

                          {/* Experience Cards with Timeline */}
                          <div className="relative">
                            {/* Timeline Line */}
                            {experience.length > 1 && (
                              <div className="absolute left-4 top-8 bottom-8 w-0.5 bg-gradient-to-b from-green-500 via-blue-500 to-purple-500"></div>
                            )}

                            <div className="space-y-4">
                              {experience.map((exp, index) => {
                                const achievements = exp.achievements || [];
                                const summary =
                                  achievements.length > 0
                                    ? achievements.join('. ') + '.'
                                    : 'Key contributions and responsibilities in this role.';
                                const isCurrent =
                                  exp.endDate && exp.endDate.toLowerCase().includes('present');

                                return (
                                  <div key={index} className="relative pl-12">
                                    {/* Timeline Dot */}
                                    <div
                                      className={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center ${
                                        isCurrent
                                          ? 'bg-green-500 ring-4 ring-green-100'
                                          : 'bg-blue-500 ring-4 ring-blue-100'
                                      }`}
                                    >
                                      <span className="text-white text-xs font-bold">
                                        {index + 1}
                                      </span>
                                    </div>

                                    {/* Experience Card */}
                                    <div className="bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                      <div className="flex justify-between items-start mb-2">
                                        <div className="flex-1">
                                          <h4 className="font-semibold text-gray-900 text-sm">
                                            {exp.role || 'Role not specified'}
                                          </h4>
                                          <p className="text-sm text-blue-600 font-medium">
                                            {exp.company || 'Company not specified'}
                                          </p>
                                        </div>
                                        <div className="text-right">
                                          <div className="flex items-center space-x-1 text-xs text-gray-500 mb-1">
                                            <Icons.Calendar className="w-3 h-3" />
                                            <span>
                                              {exp.startDate || 'Start'} -{' '}
                                              {exp.endDate || 'Present'}
                                            </span>
                                          </div>
                                          {isCurrent && (
                                            <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full">
                                              Current
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">
                                        {summary}
                                      </p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {experience.length === 0 && (
                            <p className="text-gray-500 text-sm text-center py-4">
                              Experience details not available
                            </p>
                          )}
                        </div>
                      );
                    } catch (e) {
                      return (
                        <p className="text-gray-500 text-sm">Experience details not available</p>
                      );
                    }
                  })()}
                </div>
              </div>

              {/* Education & Qualifications */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Icons.GraduationCap className="w-5 h-5 mr-2 text-indigo-600" />
                  Education & Qualifications
                </h3>
                <div className="space-y-3">
                  {/* Extract education from analysis_data */}
                  {(() => {
                    try {
                      // Use profile_json instead of analysis_data
                      const profileData = selectedCandidate.profile_json || {};
                      const education = profileData.education || [];

                      // Show ALL education entries as cards
                      if (!Array.isArray(education) || education.length === 0) {
                        return (
                          <p className="text-gray-500 text-sm">Education details not available</p>
                        );
                      }

                      return (
                        <div className="grid gap-4">
                          {education.map((edu, index) => {
                            const university = edu.institution || 'Institution not specified';
                            const degree = edu.degree || 'Degree not specified';
                            const rawField = edu.field || '';
                            // Smart field handling - show "Not specified" if empty or same as degree
                            const field =
                              rawField && rawField.toLowerCase() !== degree.toLowerCase()
                                ? rawField
                                : 'Not specified';
                            const graduationYear = edu.year || 'Year not specified';

                            return (
                              <div
                                key={index}
                                className="bg-indigo-50 border border-indigo-200 rounded-lg p-4"
                              >
                                <div className="space-y-3">
                                  {degree && degree !== 'Degree not specified' && (
                                    <div className="flex items-center space-x-2">
                                      <Icons.Award className="w-4 h-4 text-indigo-600" />
                                      <div>
                                        <span className="text-xs text-gray-500 uppercase tracking-wide">
                                          Degree
                                        </span>
                                        <p className="font-semibold text-gray-900">{degree}</p>
                                      </div>
                                    </div>
                                  )}
                                  {university && university !== 'Institution not specified' && (
                                    <div className="flex items-center space-x-2">
                                      <Icons.Building className="w-4 h-4 text-indigo-600" />
                                      <div>
                                        <span className="text-xs text-gray-500 uppercase tracking-wide">
                                          Institution
                                        </span>
                                        <p className="font-medium text-gray-900">{university}</p>
                                      </div>
                                    </div>
                                  )}
                                  {/* Always show field of study, even if "Not specified" */}
                                  <div className="flex items-center space-x-2">
                                    <Icons.BookOpen className="w-4 h-4 text-indigo-600" />
                                    <div>
                                      <span className="text-xs text-gray-500 uppercase tracking-wide">
                                        Field of Study
                                      </span>
                                      <p
                                        className={`font-medium ${field === 'Not specified' ? 'text-gray-500 italic' : 'text-gray-900'}`}
                                      >
                                        {field}
                                      </p>
                                    </div>
                                  </div>
                                  {graduationYear && graduationYear !== 'Year not specified' && (
                                    <div className="flex items-center space-x-2">
                                      <Icons.Calendar className="w-4 h-4 text-indigo-600" />
                                      <div>
                                        <span className="text-xs text-gray-500 uppercase tracking-wide">
                                          Year
                                        </span>
                                        <p className="font-medium text-gray-900">
                                          {graduationYear}
                                        </p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    } catch (e) {
                      return <p className="text-gray-500 text-sm">Education data parsing error</p>;
                    }
                  })()}
                </div>
              </div>

              {/* Certifications */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Icons.Award className="w-5 h-5 mr-2 text-yellow-600" />
                  Certifications
                </h3>
                <div className="space-y-3">
                  {(() => {
                    try {
                      const profileData = selectedCandidate.profile_json || {};
                      const certifications = profileData.certifications || [];

                      if (!Array.isArray(certifications) || certifications.length === 0) {
                        return <p className="text-gray-500 text-sm">No certifications listed</p>;
                      }

                      return (
                        <div className="grid gap-3">
                          {certifications.map((cert, index) => {
                            // Handle both string and object formats
                            const certName = typeof cert === 'string' ? cert : cert.name || cert;
                            const certIssuer = typeof cert === 'object' ? cert.issuer : null;
                            const certYear = typeof cert === 'object' ? cert.year : null;

                            return (
                              <div
                                key={index}
                                className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                              >
                                <div className="flex items-start space-x-3">
                                  <div className="flex-shrink-0 w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                                    <Icons.Award className="w-5 h-5 text-yellow-600" />
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="font-semibold text-gray-900 text-sm mb-1">
                                      {certName}
                                    </h4>
                                    <div className="flex items-center space-x-2 text-xs text-gray-600">
                                      {certIssuer && <span>{certIssuer}</span>}
                                      {certIssuer && certYear && <span>•</span>}
                                      {certYear && <span>{certYear}</span>}
                                      {!certIssuer && !certYear && (
                                        <span>Professional Certification</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    } catch (e) {
                      return (
                        <p className="text-gray-500 text-sm">Certifications data not available</p>
                      );
                    }
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchDetail;
