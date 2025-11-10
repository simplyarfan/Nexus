import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import Head from 'next/head';
import * as Icons from 'lucide-react';
import cvAPI from '../../utils/cvIntelligenceAPI';
import toast from 'react-hot-toast';

const ModernCVIntelligence = () => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [batches, setBatches] = useState([]);
  const [error, setError] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [batchName, setBatchName] = useState('');
  const [selectedFiles, setSelectedFiles] = useState({ cvFiles: [], jdFile: null });
  const [searchQuery, setSearchQuery] = useState('');
  const [processingProgress, setProcessingProgress] = useState({
    show: false,
    current: 0,
    total: 0,
    message: '',
  });
  const [openMenuId, setOpenMenuId] = useState(null);
  const handleLogout = async () => {
    try {
      await logout();
      router.push('/landing');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleDeleteBatch = async (batchId) => {
    try {
      console.log('🎯 Deleting batch from grid:', batchId);
      const res = await cvAPI.deleteBatch(batchId);
      if (res.success || res.data?.success) {
        toast.success('Batch deleted');
        setOpenMenuId(null);
        await fetchBatches();
      } else {
        toast.error(res.message || res.data?.message || 'Failed to delete batch');
      }
    } catch (e) {
      console.error('🎯 Delete batch error:', e);
      toast.error(e.response?.data?.message || e.message || 'Failed to delete batch');
    }
  };

  const handleCVFilesChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles((prev) => ({ ...prev, cvFiles: files }));
  };

  const handleJDFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedFiles((prev) => ({ ...prev, jdFile: file }));
  };

  const removeCVFile = (indexToRemove) => {
    setSelectedFiles((prev) => ({
      ...prev,
      cvFiles: prev.cvFiles.filter((_, index) => index !== indexToRemove),
    }));
  };

  const removeJDFile = () => {
    setSelectedFiles((prev) => ({ ...prev, jdFile: null }));
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🎯 Fetching CV batches...');
      const response = await cvAPI.getBatches();
      console.log('🎯 Fetch batches response:', response);

      // Handle different response structures
      const isSuccess = response.success || (response.data && response.data.success);
      const batchesData = response.data?.data || response.data || [];

      if (isSuccess) {
        console.log('🎯 Setting batches:', batchesData);
        setBatches(Array.isArray(batchesData) ? batchesData : []);
        console.log('🎯 Batches loaded:', Array.isArray(batchesData) ? batchesData.length : 0);
      } else {
        console.error('🎯 Failed to fetch batches:', response);
        setBatches([]);
        const errorMsg = response.message || response.data?.message || 'Failed to load CV batches';
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error('🎯 Error fetching batches:', error);
      console.error('🎯 Error details:', error.response?.data);
      setBatches([]);

      let errorMsg = 'Failed to load CV batches';
      if (error.response?.status === 500) {
        errorMsg = 'Server error occurred. Please try again later.';
      } else if (error.code === 'NETWORK_ERROR' || !error.response) {
        errorMsg = 'Network connection failed. Please check your internet connection.';
      } else {
        errorMsg = `Failed to load CV batches: ${error.response?.data?.message || error.message}`;
      }

      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();

    if (!batchName.trim()) {
      toast.error('Please enter a batch name');
      return;
    }

    if (selectedFiles.cvFiles.length === 0) {
      toast.error('Please upload at least one CV file');
      return;
    }

    if (!selectedFiles.jdFile) {
      toast.error('Please upload a job description file');
      return;
    }

    try {
      console.log('🎯 Creating batch with name:', batchName);
      console.log('🎯 CV files count:', selectedFiles.cvFiles.length);
      console.log('🎯 JD file:', selectedFiles.jdFile ? 'present' : 'none');

      // Step 1: Create the batch first
      console.log('🎯 Step 1: Creating batch...');
      const batchResponse = await cvAPI.createBatch(batchName);
      console.log('🎯 Create batch response:', batchResponse);

      const isSuccess = batchResponse.success || (batchResponse.data && batchResponse.data.success);
      const batchId =
        batchResponse.data?.data?.batchId || batchResponse.data?.batchId || batchResponse.batchId;

      if (!isSuccess || !batchId) {
        throw new Error(
          batchResponse.message || batchResponse.data?.message || 'Failed to create batch',
        );
      }

      console.log('✅ Batch created successfully with ID:', batchId);

      // Step 2: Process the files if any are provided
      if (selectedFiles.cvFiles.length > 0 && selectedFiles.jdFile) {
        console.log('🎯 Step 2: Processing files...');

        // Show progress modal
        setProcessingProgress({
          show: true,
          current: 0,
          total: selectedFiles.cvFiles.length,
          message: 'Uploading files...',
        });

        const processResponse = await cvAPI.processFiles(
          batchId,
          selectedFiles.jdFile,
          selectedFiles.cvFiles,
          (progress) => {
            console.log('📈 Upload progress:', progress + '%');
            setProcessingProgress((prev) => ({
              ...prev,
              message: `Uploading files... ${progress}%`,
            }));
          },
        );

        console.log('✅ Files processed successfully:', processResponse);

        // Simulate AI analysis progress
        for (let i = 1; i <= selectedFiles.cvFiles.length; i++) {
          setProcessingProgress((prev) => ({
            ...prev,
            current: i,
            message: `Analyzing candidate ${i} of ${selectedFiles.cvFiles.length}...`,
          }));
          await new Promise((resolve) => setTimeout(resolve, 1000)); // 1 second delay per candidate
        }

        setProcessingProgress((prev) => ({
          ...prev,
          message: 'AI ranking and analysis complete!',
        }));

        setTimeout(() => {
          setProcessingProgress({ show: false, current: 0, total: 0, message: '' });
          toast.success('AI analysis complete! Candidates ranked by AI.');
        }, 1000);
      } else {
        console.log('⚠️ No files to process - batch created without files');
        toast.success('Batch created successfully!');
      }

      // Clean up and refresh
      setShowUploadModal(false);
      setBatchName('');
      setSelectedFiles({ cvFiles: [], jdFile: null });
      await fetchBatches();

      // Force refresh the batches list with a small delay to ensure backend processing
      console.log('🎯 Refreshing batches list...');
      setTimeout(async () => {
        await fetchBatches();
        console.log('🎯 Batches refreshed after batch creation');
      }, 2000);
    } catch (error) {
      console.error('🎯 Error creating batch:', error);
      console.error('🎯 Error details:', error.response?.data);

      // Hide progress modal on error
      setProcessingProgress({ show: false, current: 0, total: 0, message: '' });

      toast.error(`Failed to create batch: ${error.response?.data?.message || error.message}`);
    }
  };

  const filteredBatches = batches.filter((batch) => {
    const matchesSearch = batch.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return '✓';
      case 'processing':
        return '⟳';
      case 'pending':
        return '⏳';
      default:
        return '•';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-sm">Loading CV Intelligence...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>CV Intelligence - Nexus</title>
        <meta name="description" content="AI-powered resume analysis and candidate ranking" />
      </Head>

      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Icons.ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                  <Icons.Brain className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">CV Intelligence</h1>
                  <p className="text-sm text-gray-500">AI-powered resume analysis</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowUploadModal(true)}
                className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white px-4 py-2 rounded-lg inline-flex items-center text-sm font-medium transition-colors"
              >
                <Icons.Plus className="w-4 h-4 mr-2" />
                New Batch
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Icons.Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search batches..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Batches Grid */}
        {filteredBatches.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Icons.Brain className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchQuery ? 'No batches found' : 'No CV batches yet'}
            </h3>
            <p className="text-gray-600 mb-8">
              {searchQuery
                ? 'Try adjusting your search'
                : 'Upload your first batch of CVs to get started with AI analysis'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setShowUploadModal(true)}
                className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white px-6 py-3 rounded-lg inline-flex items-center font-medium transition-colors"
              >
                <Icons.Plus className="w-5 h-5 mr-2" />
                Create Your First Batch
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBatches.map((batch) => (
              <div
                key={batch.id}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                      <Icons.FileText className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">
                        {batch.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Created {new Date(batch.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="relative">
                    <button
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(openMenuId === batch.id ? null : batch.id);
                      }}
                    >
                      <Icons.MoreVertical className="w-4 h-4 text-gray-400" />
                    </button>
                    {openMenuId === batch.id && (
                      <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteBatch(batch.id);
                          }}
                          className="w-full flex items-center px-3 py-2 text-left text-red-600 hover:bg-red-50 text-sm"
                        >
                          <Icons.Trash2 className="w-4 h-4 mr-2" />
                          Delete Batch
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Status</span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(batch.status)}`}
                    >
                      {getStatusIcon(batch.status)} {batch.status}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center space-x-2">
                    <Icons.FileText className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {batch.total_resumes || batch.cv_count || 0} CVs uploaded
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/cv-intelligence/batch/${batch.id}`);
                    }}
                    className="flex items-center space-x-2 text-orange-600 hover:text-orange-700 transition-colors"
                  >
                    <Icons.Eye className="w-4 h-4" />
                    <span className="text-sm font-medium">View Details</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-8 overflow-y-auto flex-1">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Create New Batch</h3>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Icons.X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              <form onSubmit={handleFileUpload} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Batch Name *
                  </label>
                  <input
                    type="text"
                    value={batchName}
                    onChange={(e) => setBatchName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Enter batch name..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CV Files (PDF only) - Required *
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-orange-400 transition-colors">
                    <Icons.Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-2">
                      Upload candidate CVs for AI analysis
                    </p>
                    <input
                      type="file"
                      multiple
                      accept=".pdf"
                      onChange={handleCVFilesChange}
                      className="hidden"
                      id="cv-files"
                      required
                    />
                    <label
                      htmlFor="cv-files"
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                    >
                      Choose CV Files
                    </label>
                    {selectedFiles.cvFiles.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm text-green-600 mb-2">
                          {selectedFiles.cvFiles.length} CV file(s) selected
                        </p>
                        <div className="space-y-2">
                          {selectedFiles.cvFiles.map((file, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between bg-gray-50 p-2 rounded-lg"
                            >
                              <span className="text-sm text-gray-700 truncate">{file.name}</span>
                              <button
                                type="button"
                                onClick={() => removeCVFile(index)}
                                className="text-red-500 hover:text-red-700 p-1"
                              >
                                <Icons.X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Description (PDF/TXT) - Required *
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-orange-400 transition-colors">
                    <Icons.FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-2">
                      Upload job description to rank CVs against requirements
                    </p>
                    <input
                      type="file"
                      accept=".pdf,.txt"
                      onChange={handleJDFileChange}
                      className="hidden"
                      id="jd-file"
                      required
                    />
                    <label
                      htmlFor="jd-file"
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                    >
                      Choose Job Description
                    </label>
                    {selectedFiles.jdFile && (
                      <div className="mt-4">
                        <div className="flex items-center justify-between bg-gray-50 p-2 rounded-lg">
                          <span className="text-sm text-gray-700 truncate">
                            {selectedFiles.jdFile.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeJDFile()}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <Icons.X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(false)}
                    className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Create Batch
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Progress Modal */}
      {processingProgress.show && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icons.Brain className="w-8 h-8 text-white animate-pulse" />
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-2">AI Analysis in Progress</h3>
              <p className="text-gray-600 mb-6">{processingProgress.message}</p>

              {processingProgress.total > 0 && (
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Progress</span>
                    <span>
                      {processingProgress.current}/{processingProgress.total}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-orange-500 to-red-600 h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${(processingProgress.current / processingProgress.total) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
                <span>Please wait while AI analyzes and ranks candidates...</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModernCVIntelligence;
