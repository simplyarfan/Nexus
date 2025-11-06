import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import Head from 'next/head';
import emailService from '../services/emailService';
import {
  ArrowLeft,
  User,
  Mail,
  Building,
  Briefcase,
  Lock,
  Save,
  Settings,
  LogOut,
  Eye,
  EyeOff,
  CheckCircle,
  Calendar,
  Shield,
} from 'lucide-react';
import { authAPI } from '../utils/api';
import toast from 'react-hot-toast';
import ClientOnly from '../components/shared/ClientOnly';

function ProfileSettings() {
  const { user, logout, updateUser } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [connectedEmail, setConnectedEmail] = useState({});

  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    jobTitle: '',
    department: '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        email: user.email || '',
        jobTitle: user.job_title || '',
        department: user.department || '',
      });
    }
  }, [user]);

  // Load connected email and check Outlook status on component mount
  useEffect(() => {
    const loadEmailStatus = async () => {
      // Check Outlook connection status from backend
      const outlookStatus = await emailService.checkOutlookStatus();
      if (outlookStatus.isConnected && !outlookStatus.isExpired) {
        setConnectedEmail({
          outlook: {
            connected: true,
            email: outlookStatus.email,
          },
        });
      }
    };
    loadEmailStatus();
  }, []);

  // Handle Outlook connection results from URL query
  useEffect(() => {
    const { outlook, message } = router.query;

    // Handle Outlook OAuth callback
    if (outlook === 'connected') {
      setActiveTab('email');
      toast.success('Outlook connected successfully!');
      // Reload Outlook status
      emailService.checkOutlookStatus().then((status) => {
        if (status.isConnected) {
          setConnectedEmail({
            outlook: {
              connected: true,
              email: status.email,
            },
          });
        }
      });
      router.replace('/profile?tab=email', undefined, { shallow: true });
    } else if (outlook === 'error') {
      setActiveTab('email');
      const errorMessage = message ? decodeURIComponent(message) : 'Failed to connect Outlook';
      toast.error(errorMessage);
      router.replace('/profile?tab=email', undefined, { shallow: true });
    }
  }, [router.query]);

  // Handle URL tab parameter
  useEffect(() => {
    const { tab } = router.query;
    if (tab === 'email') {
      setActiveTab('email');
    }
  }, [router.query]);

  const handleEmailConnected = (provider, userInfo) => {
    setConnectedEmail(emailService.getConnectedEmail());
    toast.success(`${provider === 'outlook' ? 'Outlook' : 'Email'} connected successfully!`);
  };

  const handleDisconnectEmail = async (provider) => {
    if (provider === 'outlook') {
      const result = await emailService.disconnectOutlook();
      if (result.success) {
        setConnectedEmail({});
        toast.success('Outlook disconnected successfully');
      } else {
        toast.error('Failed to disconnect Outlook');
      }
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/landing');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authAPI.updateProfile({
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        jobTitle: profileData.jobTitle,
        department: profileData.department,
      });

      if (response.success) {
        updateUser(response.user);
        toast.success('Profile updated successfully!');
      } else {
        toast.error(response.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      if (response.success) {
        toast.success('Password changed successfully!');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      } else {
        toast.error(response.message || 'Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error('Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (section, field, value) => {
    if (section === 'profile') {
      setProfileData((prev) => ({ ...prev, [field]: value }));
    } else if (section === 'password') {
      setPasswordData((prev) => ({ ...prev, [field]: value }));
    }
  };

  return (
    <>
      <Head>
        <title>Profile Settings - Nexus</title>
        <meta name="description" content="Manage your profile settings and preferences" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-amber-50">
        {/* Top Navigation */}
        <div className="bg-white/90 backdrop-blur-xl shadow-lg border border-orange-200/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.back()}
                  className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-white/80 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                    <div className="w-4 h-4 bg-white rounded-sm transform rotate-45"></div>
                  </div>
                  <div>
                    <h1 className="text-xl font-semibold text-gray-900">Profile Settings</h1>
                    <p className="text-sm text-gray-600">Manage your account information</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-gray-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {user?.first_name} {user?.last_name}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-white/80 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Tabs */}
          <div className="mb-8">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'profile'
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <User className="w-4 h-4 inline mr-2" />
                  Profile
                </button>
                <button
                  onClick={() => setActiveTab('email')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'email'
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email Integration
                </button>
                <button
                  onClick={() => setActiveTab('security')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'security'
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Lock className="w-4 h-4 inline mr-2" />
                  Security
                </button>
              </nav>
            </div>
          </div>

          <div className="space-y-8">
            {/* Profile Information Tab */}
            {activeTab === 'profile' && (
              <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-orange-200/50 overflow-hidden">
                <div className="bg-gradient-to-r from-orange-500 to-red-600 px-8 py-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">Profile Information</h2>
                      <p className="text-orange-100">Update your personal details</p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleProfileUpdate} className="p-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={profileData.firstName}
                        onChange={(e) => handleInputChange('profile', 'firstName', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                        placeholder="Enter your first name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={profileData.lastName}
                        onChange={(e) => handleInputChange('profile', 'lastName', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                        placeholder="Enter your last name"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={profileData.email}
                      disabled
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Job Title
                      </label>
                      <input
                        type="text"
                        value={profileData.jobTitle}
                        onChange={(e) => handleInputChange('profile', 'jobTitle', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                        placeholder="Enter your job title"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Department
                        {user?.role === 'user' && (
                          <span className="text-xs text-gray-500 ml-2">
                            (Contact admin to change)
                          </span>
                        )}
                      </label>
                      {user?.role === 'user' ? (
                        <div className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-600">
                          {profileData.department || 'No department assigned'}
                        </div>
                      ) : (
                        <select
                          value={profileData.department}
                          onChange={(e) =>
                            handleInputChange('profile', 'department', e.target.value)
                          }
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                        >
                          <option value="">Select Department</option>
                          <option value="Human Resources">Human Resources</option>
                          <option value="Finance">Finance</option>
                          <option value="Sales & Marketing">Sales & Marketing</option>
                          <option value="IT">IT</option>
                          <option value="Operations">Operations</option>
                        </select>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end pt-6 border-t border-gray-200">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex items-center px-8 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl hover:from-orange-600 hover:to-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Updating...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Update Profile
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Email Integration Tab */}
            {activeTab === 'email' && (
              <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-orange-200/50 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-8 py-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                      <Mail className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">Email Integration</h2>
                      <p className="text-blue-100">
                        Connect your email for sending interview invitations
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-8">
                  <div className="space-y-6">
                    {/* Outlook */}
                    <div className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                            <Mail className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">Outlook</h3>
                            {connectedEmail.outlook?.connected ? (
                              <p className="text-sm text-green-600">
                                Connected as {connectedEmail.outlook.email}
                              </p>
                            ) : (
                              <p className="text-sm text-gray-500">
                                Connect to send interview emails from your company Outlook
                              </p>
                            )}
                          </div>
                        </div>

                        {connectedEmail.outlook?.connected ? (
                          <button
                            onClick={() => handleDisconnectEmail('outlook')}
                            className="px-4 py-2 text-sm text-red-600 hover:text-red-700 border border-red-200 hover:border-red-300 rounded-lg transition-colors"
                          >
                            Disconnect
                          </button>
                        ) : (
                          <button
                            onClick={async () => {
                              const result = await emailService.connectOutlook();
                              // The page will redirect to Microsoft OAuth
                              // No need to handle result here - it will be handled in the callback
                              if (result.success && !result.pending) {
                                handleEmailConnected('outlook', result.user);
                              } else if (!result.success && !result.pending) {
                                toast.error(result.error || 'Failed to connect Outlook');
                              }
                            }}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                          >
                            Connect Outlook
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Benefits */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                      <h4 className="font-semibold text-blue-900 mb-3">
                        Benefits of Outlook Integration:
                      </h4>
                      <ul className="text-sm text-blue-800 space-y-2">
                        <li className="flex items-center">
                          <CheckCircle className="w-4 h-4 mr-2 text-blue-600" />
                          Send interview emails from your company Outlook account
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className="w-4 h-4 mr-2 text-blue-600" />
                          Automatic Microsoft Teams meeting links
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className="w-4 h-4 mr-2 text-blue-600" />
                          Professional email templates with calendar invitations
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className="w-4 h-4 mr-2 text-blue-600" />
                          Automatic .ics calendar file attachments
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-orange-200/50 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-500 to-indigo-600 px-8 py-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                      <Lock className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">Security Settings</h2>
                      <p className="text-purple-100">
                        Update your password and security preferences
                      </p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handlePasswordChange} className="p-8 space-y-6">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Current Password
                      </label>
                      <div className="relative">
                        <input
                          type={showCurrentPassword ? 'text' : 'password'}
                          value={passwordData.currentPassword}
                          onChange={(e) =>
                            handleInputChange('password', 'currentPassword', e.target.value)
                          }
                          className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                          placeholder="Enter your current password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showCurrentPassword ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={passwordData.newPassword}
                          onChange={(e) =>
                            handleInputChange('password', 'newPassword', e.target.value)
                          }
                          className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                          placeholder="Enter your new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showNewPassword ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={passwordData.confirmPassword}
                          onChange={(e) =>
                            handleInputChange('password', 'confirmPassword', e.target.value)
                          }
                          className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                          placeholder="Confirm your new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-6 border-t border-gray-200">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex items-center px-8 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl hover:from-purple-600 hover:to-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Updating...
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4 mr-2" />
                          Change Password
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// Wrap with ClientOnly to prevent SSR/build issues
export default function ProfilePage() {
  return (
    <ClientOnly>
      <ProfileSettings />
    </ClientOnly>
  );
}
