import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { fadeIn, scaleIn } from '@/lib/motion';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { useAuth } from '../contexts/AuthContext';
import { profileAPI } from '../utils/profileAPI';
import api from '../utils/api';
import toast from 'react-hot-toast';
import Cropper from 'react-easy-crop';
import { useRouter } from 'next/router';

export default function ProfilePage() {
  const { user, isAdmin, isSuperAdmin, checkAuthStatus } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profilePicture, setProfilePicture] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState(null);
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);

  // Cropping state
  const [showCropModal, setShowCropModal] = useState(false);
  const [imageToCrop, setImageToCrop] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  // 2FA state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [isTogglingTwoFactor, setIsTogglingTwoFactor] = useState(false);

  // Outlook integration state
  const [outlookConnected, setOutlookConnected] = useState(false);
  const [outlookEmail, setOutlookEmail] = useState(null);
  const [isLoadingOutlook, setIsLoadingOutlook] = useState(false);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);

  // Determine correct dashboard based on role
  const getDashboardPath = () => {
    if (isSuperAdmin) return '/superadmin';
    if (isAdmin) return '/admin';
    return '/';
  };

  // Profile form state
  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    department: '',
    job_title: '',
    bio: '',
  });

  // Preferences state
  const [preferences, setPreferences] = useState({
    timezone: 'Asia/Riyadh',
    date_format: 'MM/DD/YYYY',
  });

  // Load user data
  useEffect(() => {
    if (user) {
      setProfileData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: user.phone || '',
        department: user.department || '',
        job_title: user.job_title || '',
        bio: user.bio || '',
      });
      setProfilePicturePreview(user.profile_picture_url || null);
      setTwoFactorEnabled(user.two_factor_enabled || false);
      setPreferences({
        timezone: user.timezone || 'Asia/Riyadh',
        date_format: user.date_format || 'MM/DD/YYYY',
      });
      setLoading(false);
    }
  }, [user]);

  const handleChange = (field, value) => {
    setProfileData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await profileAPI.updateProfile(profileData);

      if (result.success) {
        toast.success('Profile updated successfully!');
      } else {
        toast.error(result.message || 'Failed to update profile');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error updating profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePreferences = async () => {
    setIsSaving(true);
    try {
      const result = await profileAPI.updatePreferences(preferences);

      if (result.success) {
        toast.success('Preferences updated successfully!');
      } else {
        toast.error(result.message || 'Failed to update preferences');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error updating preferences');
    } finally {
      setIsSaving(false);
    }
  };

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('File must be an image');
        return;
      }

      // Create preview for cropping
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageToCrop(reader.result);
        setShowCropModal(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfilePictureUpload = async (file) => {
    setIsUploadingPicture(true);
    try {
      console.log('📤 Starting upload...', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
      });
      const result = await profileAPI.uploadProfilePicture(file);
      console.log('📥 Upload response:', result);

      if (result.success) {
        toast.success('Profile picture updated successfully!');
        console.log('✅ Upload successful, refreshing auth status...');
        // Refresh user context to persist the picture
        await checkAuthStatus();
        console.log('✅ Auth status refreshed');
      } else {
        console.error('❌ Upload failed:', result);
        toast.error(result.message || 'Failed to upload profile picture');
      }
    } catch (error) {
      console.error('❌ Upload error:', error);
      toast.error(error.response?.data?.message || 'Error uploading profile picture');
    } finally {
      setIsUploadingPicture(false);
    }
  };

  const handleRemoveProfilePicture = async () => {
    setIsUploadingPicture(true);
    try {
      const result = await profileAPI.deleteProfilePicture();

      if (result.success) {
        toast.success('Profile picture removed successfully!');
        setProfilePicturePreview(null);
        setProfilePicture(null);
        // Refresh user context to persist the removal
        await checkAuthStatus();
      } else {
        toast.error(result.message || 'Failed to remove profile picture');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error removing profile picture');
    } finally {
      setIsUploadingPicture(false);
    }
  };

  // Cropping functions
  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createImage = (url) =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.src = url;
    });

  const getCroppedImg = async (imageSrc, pixelCrop) => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height,
    );

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          resolve(blob);
        },
        'image/jpeg',
        0.95,
      );
    });
  };

  const handleCropSave = async () => {
    try {
      const croppedImageBlob = await getCroppedImg(imageToCrop, croppedAreaPixels);
      const croppedImageFile = new File([croppedImageBlob], 'profile-picture.jpg', {
        type: 'image/jpeg',
      });

      // Close modal
      setShowCropModal(false);
      setImageToCrop(null);
      setCrop({ x: 0, y: 0 });
      setZoom(1);

      // Upload the cropped image (this will update the preview via checkAuthStatus)
      await handleProfilePictureUpload(croppedImageFile);
    } catch (error) {
      toast.error('Failed to crop image');
      console.error(error);
    }
  };

  const handleCropCancel = () => {
    setShowCropModal(false);
    setImageToCrop(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  // 2FA toggle handler
  const handleToggleTwoFactor = async () => {
    setIsTogglingTwoFactor(true);
    try {
      const response = await profileAPI.toggleTwoFactor(!twoFactorEnabled);
      if (response.success) {
        setTwoFactorEnabled(!twoFactorEnabled);
        toast.success(
          !twoFactorEnabled
            ? 'Two-factor authentication enabled successfully'
            : 'Two-factor authentication disabled successfully',
        );
        // Refresh user context
        await checkAuthStatus();
      } else {
        toast.error(response.message || 'Failed to update two-factor authentication');
      }
    } catch (error) {
      console.error('2FA toggle error:', error);
      toast.error(error.response?.data?.message || 'Error updating two-factor authentication');
    } finally {
      setIsTogglingTwoFactor(false);
    }
  };

  // Outlook integration handlers
  const checkOutlookStatus = useCallback(async () => {
    try {
      const response = await api.get('/auth/outlook/status');
      if (response.data.success) {
        setOutlookConnected(response.data.isConnected);
        setOutlookEmail(response.data.email);
      }
    } catch (error) {
      console.error('Error checking Outlook status:', error);
    }
  }, []);

  const handleConnectOutlook = async () => {
    setIsLoadingOutlook(true);
    try {
      const response = await api.get('/auth/outlook/connect');
      if (response.data.success && response.data.authUrl) {
        // Redirect to Microsoft OAuth
        window.location.href = response.data.authUrl;
      } else {
        toast.error('Failed to initiate Outlook connection');
        setIsLoadingOutlook(false);
      }
    } catch (error) {
      console.error('Error connecting Outlook:', error);
      toast.error(error.response?.data?.message || 'Failed to connect Outlook');
      setIsLoadingOutlook(false);
    }
  };

  const handleDisconnectOutlook = async () => {
    setIsLoadingOutlook(true);
    try {
      const response = await api.delete('/auth/outlook/disconnect');
      if (response.data.success) {
        setOutlookConnected(false);
        setOutlookEmail(null);
        setShowDisconnectModal(false);
        toast.success('Outlook account disconnected successfully');
      } else {
        toast.error('Failed to disconnect Outlook account');
      }
    } catch (error) {
      console.error('Error disconnecting Outlook:', error);
      toast.error(error.response?.data?.message || 'Failed to disconnect Outlook');
    } finally {
      setIsLoadingOutlook(false);
    }
  };

  // Load Outlook status on mount and when tab changes to email
  useEffect(() => {
    if (activeTab === 'email') {
      checkOutlookStatus();
    }
  }, [activeTab, checkOutlookStatus]);

  // Handle tab query parameter (e.g., ?tab=email from OAuth redirect)
  useEffect(() => {
    if (router.isReady && router.query.tab) {
      const tabFromQuery = router.query.tab;
      if (['profile', 'security', 'preferences', 'email'].includes(tabFromQuery)) {
        setActiveTab(tabFromQuery);
      }
    }
  }, [router.isReady, router.query.tab]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="mb-4">
            <a
              href={getDashboardPath()}
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to Dashboard
            </a>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Profile Settings</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage your account settings and preferences
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <nav className="space-y-2">
              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === 'profile'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-accent'
                }`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                Profile
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === 'security'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-accent'
                }`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                Security
              </button>
              <button
                onClick={() => setActiveTab('preferences')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === 'preferences'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-accent'
                }`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Preferences
              </button>
              <button
                onClick={() => setActiveTab('email')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === 'email'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-accent'
                }`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                Email
              </button>
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-card border border-border rounded-xl shadow-lg p-8">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground mb-2">Profile Information</h2>
                    <p className="text-muted-foreground">
                      Update your account&apos;s profile information
                    </p>
                  </div>

                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : (
                    <>
                      {/* Avatar */}
                      <div className="flex items-center gap-6">
                        {profilePicturePreview ? (
                          <img
                            src={profilePicturePreview}
                            alt="Profile"
                            className="w-24 h-24 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-3xl font-bold">
                            {profileData.first_name?.charAt(0) || user?.name?.charAt(0) || 'U'}
                            {profileData.last_name?.charAt(0) || ''}
                          </div>
                        )}
                        <div>
                          <input
                            type="file"
                            id="profile-picture-upload"
                            className="hidden"
                            accept="image/*"
                            onChange={handleProfilePictureChange}
                          />
                          <label
                            htmlFor="profile-picture-upload"
                            className="inline-flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer bg-secondary text-foreground hover:bg-secondary/80"
                          >
                            {isUploadingPicture ? 'Uploading...' : 'Change Photo'}
                          </label>
                          {profilePicturePreview && (
                            <button
                              onClick={handleRemoveProfilePicture}
                              disabled={isUploadingPicture}
                              className="ml-3 inline-flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-colors bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
                            >
                              Remove Picture
                            </button>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            JPG, GIF or PNG. Max size 10MB
                          </p>
                        </div>
                      </div>

                      {/* Form */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            First Name
                          </label>
                          <Input
                            value={profileData.first_name}
                            onChange={(e) => handleChange('first_name', e.target.value)}
                            placeholder="Enter your first name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Last Name
                          </label>
                          <Input
                            value={profileData.last_name}
                            onChange={(e) => handleChange('last_name', e.target.value)}
                            placeholder="Enter your last name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Email
                          </label>
                          <Input value={profileData.email} disabled />
                          <p className="text-xs text-muted-foreground mt-1">
                            Email cannot be changed
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Phone
                          </label>
                          <Input
                            value={profileData.phone}
                            onChange={(e) => handleChange('phone', e.target.value)}
                            placeholder="+1 (555) 123-4567"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Department
                          </label>
                          <Input value={profileData.department} disabled />
                          <p className="text-xs text-muted-foreground mt-1">
                            Department can only be changed by administrators
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Job Title
                          </label>
                          <Input
                            value={profileData.job_title}
                            onChange={(e) => handleChange('job_title', e.target.value)}
                            placeholder="e.g. Senior Software Engineer"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Bio
                          </label>
                          <textarea
                            value={profileData.bio}
                            onChange={(e) => handleChange('bio', e.target.value)}
                            placeholder="Tell us about yourself..."
                            rows={4}
                            className="w-full px-4 py-2 bg-secondary text-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                          />
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <Button
                          variant="primary"
                          size="lg"
                          isLoading={isSaving}
                          onClick={handleSave}
                        >
                          Update Profile
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground mb-2">Security Settings</h2>
                    <p className="text-muted-foreground">
                      Manage your password and security options
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Current Password
                      </label>
                      <Input type="password" placeholder="Enter your current password" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        New Password
                      </label>
                      <Input type="password" placeholder="Enter new password" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Confirm New Password
                      </label>
                      <Input type="password" placeholder="Confirm new password" />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button variant="primary" size="lg" isLoading={isSaving} onClick={handleSave}>
                      Update Security
                    </Button>
                  </div>

                  {/* 2FA Section */}
                  <div className="pt-6 border-t border-border">
                    <h3 className="text-lg font-semibold text-foreground mb-4">
                      Two-Factor Authentication (2FA)
                    </h3>
                    <div className="bg-muted p-4 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="font-medium text-foreground">Email-based 2FA</p>
                            {twoFactorEnabled && (
                              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                                Enabled
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            {twoFactorEnabled
                              ? "When you log in from a new device or location, we'll send a verification code to your email."
                              : "Enable two-factor authentication to add an extra layer of security. You'll receive a verification code via email when logging in from a new device or location."}
                          </p>
                        </div>
                        <button
                          onClick={handleToggleTwoFactor}
                          disabled={isTogglingTwoFactor}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                            twoFactorEnabled ? 'bg-primary' : 'bg-gray-300'
                          } ${isTogglingTwoFactor ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Preferences Tab */}
              {activeTab === 'preferences' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground mb-2">General Preferences</h2>
                    <p className="text-muted-foreground">Customize your experience</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Timezone
                      </label>
                      <select
                        value={preferences.timezone}
                        onChange={(e) =>
                          setPreferences((prev) => ({ ...prev, timezone: e.target.value }))
                        }
                        className="w-full px-4 py-2 bg-secondary text-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="Asia/Riyadh">Riyadh, Saudi Arabia (GMT+3)</option>
                        <option value="Asia/Dubai">Dubai, UAE (GMT+4)</option>
                        <option value="Asia/Kolkata">Mumbai, India (GMT+5:30)</option>
                        <option value="Asia/Singapore">Singapore (GMT+8)</option>
                        <option value="Europe/London">London, UK (GMT+0)</option>
                        <option value="Europe/Paris">Paris, France (GMT+1)</option>
                        <option value="Europe/Berlin">Berlin, Germany (GMT+1)</option>
                        <option value="America/New_York">New York, USA (GMT-5)</option>
                        <option value="America/Chicago">Chicago, USA (GMT-6)</option>
                        <option value="America/Denver">Denver, USA (GMT-7)</option>
                        <option value="America/Los_Angeles">Los Angeles, USA (GMT-8)</option>
                        <option value="Australia/Sydney">Sydney, Australia (GMT+10)</option>
                        <option value="Pacific/Auckland">Auckland, New Zealand (GMT+12)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Date Format
                      </label>
                      <select
                        value={preferences.date_format}
                        onChange={(e) =>
                          setPreferences((prev) => ({ ...prev, date_format: e.target.value }))
                        }
                        className="w-full px-4 py-2 bg-secondary text-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="primary"
                      size="lg"
                      isLoading={isSaving}
                      onClick={handleSavePreferences}
                    >
                      Save Preferences
                    </Button>
                  </div>
                </div>
              )}

              {/* Email Tab */}
              {activeTab === 'email' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground mb-2">Email Integration</h2>
                    <p className="text-muted-foreground">
                      Connect your Outlook account to send emails from the platform
                    </p>
                  </div>

                  <div className="border border-border rounded-lg p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <svg
                          className="w-12 h-12 text-primary"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                          Microsoft Outlook
                        </h3>
                        {outlookConnected ? (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <p className="text-sm text-foreground">Connected</p>
                            </div>
                            {outlookEmail && (
                              <p className="text-sm text-muted-foreground">{outlookEmail}</p>
                            )}
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => setShowDisconnectModal(true)}
                            >
                              Disconnect
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                              <p className="text-sm text-muted-foreground">Not connected</p>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Connect your Microsoft Outlook account to enable sending interview
                              coordinator emails.
                            </p>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={handleConnectOutlook}
                              isLoading={isLoadingOutlook}
                            >
                              Connect Outlook
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex gap-3">
                      <svg
                        className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <div className="text-sm text-blue-800 dark:text-blue-300">
                        <p className="font-medium mb-1">Why connect Outlook?</p>
                        <ul className="list-disc list-inside space-y-1 text-blue-700 dark:text-blue-400">
                          <li>Send interview availability requests directly from the platform</li>
                          <li>Automatically sync interview schedules with your calendar</li>
                          <li>All emails are sent securely through your Microsoft account</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Image Crop Modal */}
      {showCropModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card rounded-xl shadow-2xl w-full max-w-2xl mx-4">
            <div className="p-6 border-b border-border">
              <h3 className="text-xl font-semibold text-foreground">Crop Profile Picture</h3>
            </div>

            <div className="p-6">
              <div className="relative w-full h-96 bg-secondary rounded-lg overflow-hidden">
                <Cropper
                  image={imageToCrop}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-muted-foreground mb-2">Zoom</label>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.1}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer slider"
                />
              </div>
            </div>

            <div className="p-6 border-t border-border flex gap-3 justify-end">
              <Button variant="secondary" size="md" onClick={handleCropCancel}>
                Cancel
              </Button>
              <Button variant="primary" size="md" onClick={handleCropSave}>
                Save & Upload
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Disconnect Outlook Confirmation Modal */}
      <Modal
        isOpen={showDisconnectModal}
        onClose={() => setShowDisconnectModal(false)}
        title="Disconnect Outlook Account"
        description="Are you sure you want to disconnect your Outlook account? You will no longer be able to send emails through the platform until you reconnect."
        confirmLabel="Disconnect"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleDisconnectOutlook}
        isLoading={isLoadingOutlook}
      />
    </div>
  );
}
