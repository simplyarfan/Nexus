import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import { useAuth } from '../../../contexts/AuthContext';
import { onboardingAPI } from '../../../utils/onboardingAPI';
import toast from 'react-hot-toast';

export default function EmployeeProfile() {
  const router = useRouter();
  const { id } = router.query;
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (id && isAuthenticated) {
      fetchEmployee();
    }
  }, [id, isAuthenticated]);

  const fetchEmployee = async () => {
    try {
      setLoading(true);
      const response = await onboardingAPI.getEmployee(id);
      const emp = response.data?.employee || response.data;
      setEmployee(emp);
      setFormData(emp);
    } catch (err) {
      toast.error('Failed to load employee');
      router.push('/hr/employees');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await onboardingAPI.updateEmployee(id, formData);
      setEmployee(formData);
      setIsEditing(false);
      toast.success('Employee updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update employee');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await onboardingAPI.deleteEmployee(id);
      toast.success('Employee deleted successfully');
      router.push('/hr/employees');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete employee');
    } finally {
      setDeleting(false);
    }
  };

  const handleCancel = () => {
    setFormData(employee);
    setIsEditing(false);
  };

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toISOString().split('T')[0];
  };

  const formatDisplayDate = (date) => {
    if (!date) return 'Not set';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getIqamaStatus = (expiryDate) => {
    if (!expiryDate) return { status: 'unknown', text: 'Not set', color: 'text-muted-foreground' };
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) {
      return { status: 'expired', text: 'Expired', color: 'text-red-500', bg: 'bg-red-500/10' };
    } else if (daysUntilExpiry <= 30) {
      return { status: 'expiring', text: `Expires in ${daysUntilExpiry} days`, color: 'text-amber-500', bg: 'bg-amber-500/10' };
    } else if (daysUntilExpiry <= 90) {
      return { status: 'warning', text: `Expires in ${daysUntilExpiry} days`, color: 'text-yellow-500', bg: 'bg-yellow-500/10' };
    }
    return { status: 'valid', text: 'Valid', color: 'text-emerald-500', bg: 'bg-emerald-500/10' };
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { bg: 'bg-amber-500/10', text: 'text-amber-500' },
      onboarding: { bg: 'bg-blue-500/10', text: 'text-blue-500' },
      active: { bg: 'bg-emerald-500/10', text: 'text-emerald-500' },
      inactive: { bg: 'bg-red-500/10', text: 'text-red-500' },
    };
    const badge = badges[status] || badges.pending;
    return `${badge.bg} ${badge.text}`;
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const getAvatarColor = (name) => {
    const colors = [
      'from-violet-500 to-purple-600',
      'from-blue-500 to-cyan-600',
      'from-emerald-500 to-teal-600',
      'from-orange-500 to-amber-600',
      'from-pink-500 to-rose-600',
      'from-indigo-500 to-blue-600',
    ];
    const index = name ? name.charCodeAt(0) % colors.length : 0;
    return colors[index];
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground">Employee not found</p>
          <button onClick={() => router.push('/hr/employees')} className="mt-4 text-primary hover:underline">
            Back to directory
          </button>
        </div>
      </div>
    );
  }

  const iqamaStatus = getIqamaStatus(employee.iqama_expiry);

  const InfoField = ({ label, value, field, type = 'text', options = null, editable = true }) => {
    if (isEditing && editable) {
      if (options) {
        return (
          <div className="space-y-1.5">
            <label className="text-sm text-muted-foreground">{label}</label>
            <select
              value={formData[field] || ''}
              onChange={(e) => handleInputChange(field, e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
            >
              <option value="">Select...</option>
              {options.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        );
      }
      return (
        <div className="space-y-1.5">
          <label className="text-sm text-muted-foreground">{label}</label>
          <input
            type={type}
            value={type === 'date' ? formatDate(formData[field]) : (formData[field] || '')}
            onChange={(e) => handleInputChange(field, e.target.value)}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
          />
        </div>
      );
    }
    return (
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-foreground font-medium">{value || 'Not provided'}</p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/hr/employees')}
                className="p-2 hover:bg-muted rounded-xl transition-all"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl font-bold text-foreground">Employee Profile</h1>
                <p className="text-sm text-muted-foreground">{employee.employee_id}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isEditing ? (
                <>
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {saving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Save Changes
                      </>
                    )}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit Profile
                  </button>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Profile Header Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-2xl p-6 mb-6"
        >
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className={`w-24 h-24 rounded-2xl bg-gradient-to-br ${getAvatarColor(employee.first_name)} flex items-center justify-center text-white font-bold text-3xl shadow-xl`}>
              {getInitials(employee.first_name, employee.last_name)}
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-foreground">
                  {employee.first_name} {employee.last_name}
                </h2>
                <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusBadge(employee.status)}`}>
                  {employee.status || 'Pending'}
                </span>
              </div>
              <p className="text-lg text-muted-foreground mb-1">{employee.job_title}</p>
              <p className="text-sm text-muted-foreground">{employee.department} • {employee.employment_type || 'Full-time'}</p>
            </div>
          </div>
        </motion.div>

        {/* Iqama & Critical Info Alert */}
        {employee.iqama_expiry && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`${iqamaStatus.bg} border border-current/20 rounded-2xl p-5 mb-6`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl ${iqamaStatus.bg} flex items-center justify-center`}>
                <svg className={`w-6 h-6 ${iqamaStatus.color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className={`font-semibold ${iqamaStatus.color}`}>Iqama Status: {iqamaStatus.text}</h3>
                <p className="text-sm text-muted-foreground">Expiry Date: {formatDisplayDate(employee.iqama_expiry)}</p>
              </div>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Iqama & Legal Documents */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-card border border-border rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
              </svg>
              Iqama & Legal Documents
            </h3>
            <div className="space-y-4">
              <InfoField
                label="Iqama Expiry Date"
                value={formatDisplayDate(employee.iqama_expiry)}
                field="iqama_expiry"
                type="date"
              />
              <InfoField
                label="Iqama Profession"
                value={employee.iqama_profession}
                field="iqama_profession"
              />
              <InfoField
                label="Nationality"
                value={employee.nationality}
                field="nationality"
              />
            </div>
          </motion.div>

          {/* Family & Dependents */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card border border-border rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Family & Dependents
            </h3>
            <div className="space-y-4">
              <InfoField
                label="Number of Dependents"
                value={employee.number_of_dependents?.toString()}
                field="number_of_dependents"
                type="number"
              />
              <InfoField
                label="Marital Status"
                value={employee.marital_status}
                field="marital_status"
                options={[
                  { value: 'single', label: 'Single' },
                  { value: 'married', label: 'Married' },
                  { value: 'divorced', label: 'Divorced' },
                  { value: 'widowed', label: 'Widowed' },
                ]}
              />
              <InfoField
                label="City"
                value={employee.city}
                field="city"
              />
            </div>
          </motion.div>

          {/* Employment Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-card border border-border rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Employment Details
            </h3>
            <div className="space-y-4">
              <InfoField
                label="Job Title"
                value={employee.job_title}
                field="job_title"
              />
              <InfoField
                label="Department"
                value={employee.department}
                field="department"
              />
              <InfoField
                label="Employment Type"
                value={employee.employment_type}
                field="employment_type"
                options={[
                  { value: 'full-time', label: 'Full-time' },
                  { value: 'part-time', label: 'Part-time' },
                  { value: 'contract', label: 'Contract' },
                  { value: 'temporary', label: 'Temporary' },
                ]}
              />
              <InfoField
                label="Start Date"
                value={formatDisplayDate(employee.start_date)}
                field="start_date"
                type="date"
              />
              <InfoField
                label="Status"
                value={employee.status}
                field="status"
                options={[
                  { value: 'pending', label: 'Pending' },
                  { value: 'onboarding', label: 'Onboarding' },
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                ]}
              />
            </div>
          </motion.div>

          {/* Contact Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card border border-border rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Contact Information
            </h3>
            <div className="space-y-4">
              <InfoField
                label="Email"
                value={employee.email}
                field="email"
                type="email"
              />
              <InfoField
                label="Phone"
                value={employee.phone}
                field="phone"
                type="tel"
              />
              <InfoField
                label="WhatsApp"
                value={employee.whatsapp_number}
                field="whatsapp_number"
                type="tel"
              />
            </div>
          </motion.div>

          {/* Compensation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-card border border-border rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Compensation
            </h3>
            <div className="space-y-4">
              <InfoField
                label="Salary Currency"
                value={employee.salary_currency}
                field="salary_currency"
                options={[
                  { value: 'SAR', label: 'SAR - Saudi Riyal' },
                  { value: 'USD', label: 'USD - US Dollar' },
                  { value: 'EUR', label: 'EUR - Euro' },
                  { value: 'GBP', label: 'GBP - British Pound' },
                  { value: 'AED', label: 'AED - UAE Dirham' },
                ]}
              />
              <InfoField
                label="Offered Salary"
                value={employee.offered_salary ? `${employee.salary_currency || 'SAR'} ${Number(employee.offered_salary).toLocaleString()}` : null}
                field="offered_salary"
                type="number"
              />
            </div>
          </motion.div>

          {/* Professional Background */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-card border border-border rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Professional Background
            </h3>
            <div className="space-y-4">
              <InfoField
                label="Total Experience"
                value={employee.total_experience}
                field="total_experience"
              />
              <InfoField
                label="Education"
                value={employee.education}
                field="education"
              />
              <InfoField
                label="Certifications"
                value={employee.certifications}
                field="certifications"
              />
              <InfoField
                label="Notice Period"
                value={employee.notice_period}
                field="notice_period"
              />
            </div>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="mt-6 flex justify-center gap-4"
        >
          <button
            onClick={() => router.push(`/hr/onboarding/${employee.id}`)}
            className="px-6 py-3 text-sm font-medium bg-muted hover:bg-muted/80 rounded-xl transition-all flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            View Onboarding
          </button>
        </motion.div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl"
          >
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
              <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-foreground text-center mb-2">Delete Employee?</h3>
            <p className="text-muted-foreground text-center mb-6">
              Are you sure you want to delete <span className="font-semibold text-foreground">{employee.first_name} {employee.last_name}</span>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-3 bg-muted text-foreground font-medium rounded-xl hover:bg-muted/80 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 px-4 py-3 bg-red-500 text-white font-medium rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
