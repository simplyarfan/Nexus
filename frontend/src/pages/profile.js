import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { fadeIn, scaleIn } from '../lib/motion';
import ButtonGreen from '../components/ui/ButtonGreen';
import InputGreen from '../components/ui/InputGreen';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading, isAuthenticated, updateUser, getAuthHeaders } = useAuth();
  const API_BASE = process.env.NEXT_PUBLIC_API_URL;

  const [activeTab, setActiveTab] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Profile form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [department, setDepartment] = useState('');

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // Load user data
  useEffect(() => {
    if (user) {
      setFirstName(user.first_name || '');
      setLastName(user.last_name || '');
      setEmail(user.email || '');
      setJobTitle(user.job_title || '');
      setDepartment(user.department || '');
      setIsLoading(false);
    }
  }, [user]);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const headers = getAuthHeaders();
      if (!headers) {
        toast.error('You must be logged in to update your profile');
        return;
      }

      const response = await fetch(`${API_BASE}/api/profile`, {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          job_title: jobTitle,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Update user in AuthContext
        updateUser(data.user);
        toast.success('Profile updated successfully!');
      } else {
        toast.error(data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error('An error occurred while updating your profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setIsSaving(true);
    try {
      // Validate passwords
      if (!currentPassword || !newPassword || !confirmPassword) {
        toast.error('All password fields are required');
        setIsSaving(false);
        return;
      }

      if (newPassword !== confirmPassword) {
        toast.error('New passwords do not match');
        setIsSaving(false);
        return;
      }

      if (newPassword.length < 8) {
        toast.error('Password must be at least 8 characters long');
        setIsSaving(false);
        return;
      }

      const headers = getAuthHeaders();
      if (!headers) {
        toast.error('You must be logged in to change your password');
        setIsSaving(false);
        return;
      }

      const response = await fetch(`${API_BASE}/api/profile/password`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('Password changed successfully!');
        // Clear password fields
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        toast.error(data.message || 'Failed to change password');
      }
    } catch (error) {
      console.error('Password change error:', error);
      toast.error('An error occurred while changing your password');
    } finally {
      setIsSaving(false);
    }
  };

  // Show loading state
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Loading...</div>
      </div>
    );
  }

  // Get user initials for avatar
  const getInitials = () => {
    if (!firstName || !lastName) return 'U';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="mb-4">
            <Link
              href="/"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to Dashboard
            </Link>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Settings</h1>
            <p className="text-muted-foreground mt-1">
              Manage your account settings and preferences
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <motion.div
            variants={scaleIn}
            initial="hidden"
            animate="visible"
            className="lg:col-span-1"
          >
            <div className="bg-card border border-border rounded-2xl p-6">
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'profile'
                      ? 'bg-primary text-white'
                      : 'text-foreground hover:bg-secondary'
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
                      ? 'bg-primary text-white'
                      : 'text-foreground hover:bg-secondary'
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
                  onClick={() => setActiveTab('notifications')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'notifications'
                      ? 'bg-primary text-white'
                      : 'text-foreground hover:bg-secondary'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                  Notifications
                </button>
                <button
                  onClick={() => setActiveTab('preferences')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'preferences'
                      ? 'bg-primary text-white'
                      : 'text-foreground hover:bg-secondary'
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
              </nav>
            </div>
          </motion.div>

          {/* Content Area */}
          <div className="lg:col-span-3">
            <motion.div
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              className="bg-card border border-border rounded-2xl p-8"
            >
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground mb-2">Profile Information</h2>
                    <p className="text-muted-foreground">
                      Update your account&apos;s profile information
                    </p>
                  </div>

                  {/* Avatar */}
                  <div className="flex items-center gap-6">
                    <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center text-white text-3xl font-bold">
                      {getInitials()}
                    </div>
                    <div>
                      <ButtonGreen variant="secondary" size="md" disabled>
                        Change Photo
                      </ButtonGreen>
                      <p className="text-xs text-muted-foreground mt-2">
                        Coming soon - Photo upload feature
                      </p>
                    </div>
                  </div>

                  {/* Form */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputGreen
                      label="First Name"
                      type="text"
                      placeholder="John"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      fullWidth
                    />
                    <InputGreen
                      label="Last Name"
                      type="text"
                      placeholder="Smith"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      fullWidth
                    />
                    <div className="cursor-not-allowed">
                      <InputGreen
                        label="Email"
                        type="email"
                        placeholder="john.smith@company.com"
                        value={email}
                        disabled
                        fullWidth
                        className="cursor-not-allowed"
                      />
                    </div>
                    <div className="cursor-not-allowed">
                      <InputGreen
                        label="Department"
                        type="text"
                        placeholder="Human Resources"
                        value={department}
                        disabled
                        fullWidth
                        className="cursor-not-allowed"
                      />
                    </div>
                    <InputGreen
                      label="Job Title"
                      type="text"
                      placeholder="HR Manager"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      fullWidth
                    />
                  </div>

                  <div className="flex gap-3">
                    <ButtonGreen
                      variant="primary"
                      size="lg"
                      isLoading={isSaving}
                      onClick={handleSaveProfile}
                    >
                      Save Changes
                    </ButtonGreen>
                    <ButtonGreen variant="secondary" size="lg" onClick={() => router.push('/')}>
                      Cancel
                    </ButtonGreen>
                  </div>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground mb-2">Security Settings</h2>
                    <p className="text-muted-foreground">Manage your account security</p>
                  </div>

                  {/* Change Password */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">Change Password</h3>
                    <InputGreen
                      label="Current Password"
                      type="password"
                      placeholder="••••••••"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      fullWidth
                    />
                    <InputGreen
                      label="New Password"
                      type="password"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      fullWidth
                    />
                    <InputGreen
                      label="Confirm New Password"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      fullWidth
                    />
                    <p className="text-xs text-muted-foreground">
                      Password must be at least 8 characters long
                    </p>
                  </div>

                  {/* 2FA */}
                  <div className="border-t border-border pt-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">
                      Two-Factor Authentication
                    </h3>
                    <div className="flex items-center gap-3 p-4 bg-primary/10 rounded-lg">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <svg
                          className="w-6 h-6 text-primary"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {user?.two_factor_enabled ? '2FA is Enabled' : '2FA is Disabled'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {user?.two_factor_enabled
                            ? 'Extra security for your account - Required for all users'
                            : 'Enable 2FA for enhanced security'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <ButtonGreen
                      variant="primary"
                      size="lg"
                      isLoading={isSaving}
                      onClick={handleChangePassword}
                    >
                      Change Password
                    </ButtonGreen>
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground mb-2">
                      Notification Preferences
                    </h2>
                    <p className="text-muted-foreground">Configure how you receive notifications</p>
                  </div>

                  <div className="space-y-4">
                    {[
                      {
                        label: 'Email Notifications',
                        description: 'Receive email updates for important events',
                      },
                      {
                        label: 'Interview Reminders',
                        description: 'Get notified before scheduled interviews',
                      },
                      {
                        label: 'New Applications',
                        description: 'Alerts when new candidates apply',
                      },
                      {
                        label: 'System Updates',
                        description: 'Important platform updates and announcements',
                      },
                    ].map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 bg-secondary rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-foreground">{item.label}</p>
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            defaultChecked={index < 2}
                          />
                          <div className="w-11 h-6 bg-secondary peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-ring rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <ButtonGreen
                      variant="primary"
                      size="lg"
                      disabled
                      onClick={() => toast.info('Notification preferences coming soon')}
                    >
                      Save Preferences
                    </ButtonGreen>
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
                        Language
                      </label>
                      <select
                        disabled
                        className="w-full px-4 py-2 bg-secondary text-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring opacity-60 cursor-not-allowed"
                      >
                        <option>English (US)</option>
                        <option>English (UK)</option>
                        <option>Spanish</option>
                        <option>French</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Timezone
                      </label>
                      <select
                        disabled
                        className="w-full px-4 py-2 bg-secondary text-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring opacity-60 cursor-not-allowed"
                      >
                        <option>Pacific Time (PT)</option>
                        <option>Mountain Time (MT)</option>
                        <option>Central Time (CT)</option>
                        <option>Eastern Time (ET)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Date Format
                      </label>
                      <select
                        disabled
                        className="w-full px-4 py-2 bg-secondary text-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring opacity-60 cursor-not-allowed"
                      >
                        <option>MM/DD/YYYY</option>
                        <option>DD/MM/YYYY</option>
                        <option>YYYY-MM-DD</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <ButtonGreen
                      variant="primary"
                      size="lg"
                      disabled
                      onClick={() => toast.info('Preferences settings coming soon')}
                    >
                      Save Preferences
                    </ButtonGreen>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
