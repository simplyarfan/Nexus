import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { onboardingAPI } from '../../../utils/onboardingAPI';

export default function OnboardingDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  const [employee, setEmployee] = useState(null);
  const [onboarding, setOnboarding] = useState(null);
  const [hrUsers, setHrUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(null);
  const [notes, setNotes] = useState('');
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isEditingEmployee, setIsEditingEmployee] = useState(false);
  const [editedEmployee, setEditedEmployee] = useState({});

  // Category display names
  const categoryNames = {
    preboarding: 'Pre-boarding',
    it_setup: 'IT Setup',
    training: 'Training & Development',
    compliance: 'Compliance & Documentation',
    first_day: 'First Day Activities',
  };

  // Category icons
  const categoryIcons = {
    preboarding: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
    it_setup: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    training: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    compliance: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    first_day: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  };

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [employeeRes, hrUsersRes] = await Promise.all([
        onboardingAPI.getEmployee(id),
        onboardingAPI.getHRUsers(),
      ]);

      if (employeeRes.success) {
        setEmployee(employeeRes.data.employee);
        setOnboarding(employeeRes.data.employee.onboarding);
        setNotes(employeeRes.data.employee.onboarding?.notes || '');
      } else {
        setError('Employee not found');
      }

      if (hrUsersRes.success) {
        setHrUsers(hrUsersRes.data.users);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load employee data');
    } finally {
      setLoading(false);
    }
  };

  // Optimistic update for checklist toggle
  const handleChecklistToggle = useCallback(async (category, itemId, currentCompleted) => {
    if (!onboarding) return;

    // Optimistic update - immediately update UI
    setOnboarding(prev => {
      const newChecklist = { ...prev.checklist };
      newChecklist[category] = newChecklist[category].map(item =>
        item.id === itemId
          ? { ...item, completed: !currentCompleted, completedAt: !currentCompleted ? new Date().toISOString() : null }
          : item
      );

      // Calculate new progress
      let totalItems = 0;
      let completedItems = 0;
      Object.values(newChecklist).forEach(items => {
        totalItems += items.length;
        completedItems += items.filter(i => i.completed).length;
      });
      const newProgress = Math.round((completedItems / totalItems) * 100);

      return { ...prev, checklist: newChecklist, progress: newProgress };
    });

    try {
      const response = await onboardingAPI.updateChecklistItem(onboarding.id, {
        category,
        itemId,
        completed: !currentCompleted,
      });

      if (response.success) {
        showSuccess('Checklist updated');
      } else {
        // Revert on failure
        fetchData();
      }
    } catch (err) {
      console.error('Error updating checklist:', err);
      setError('Failed to update checklist item');
      // Revert on error
      fetchData();
    }
  }, [onboarding]);

  const handleAssignment = async (field, value) => {
    if (!onboarding) return;

    setSaving(true);
    try {
      const data = {};
      data[field] = value ? parseInt(value) : null;

      const response = await onboardingAPI.assignOnboarding(onboarding.id, data);

      if (response.success) {
        setOnboarding(response.data.onboarding);
        showSuccess('Assignment updated');
      }
    } catch (err) {
      console.error('Error updating assignment:', err);
      setError('Failed to update assignment');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!onboarding) return;

    setSaving(true);
    try {
      const response = await onboardingAPI.updateNotes(onboarding.id, notes);

      if (response.success) {
        setOnboarding(response.data.onboarding);
        setShowNotesModal(false);
        showSuccess('Notes saved');
      }
    } catch (err) {
      console.error('Error saving notes:', err);
      setError('Failed to save notes');
    } finally {
      setSaving(false);
    }
  };

  const handleSendEmail = async (emailType) => {
    setSendingEmail(emailType);
    try {
      let response;
      switch (emailType) {
        case 'welcome':
          response = await onboardingAPI.sendWelcomeEmail(employee.id);
          break;
        case 'documents':
          response = await onboardingAPI.sendDocumentRequestEmail(employee.id);
          break;
        case 'firstDay':
          response = await onboardingAPI.sendFirstDayInfoEmail(employee.id);
          break;
      }

      if (response.success) {
        showSuccess(response.message || 'Email sent successfully');
      }
    } catch (err) {
      console.error('Error sending email:', err);
      setError(err.response?.data?.error || 'Failed to send email');
    } finally {
      setSendingEmail(null);
    }
  };

  const handleStatusChange = async (newStatus) => {
    setSaving(true);
    try {
      const response = await onboardingAPI.updateEmployeeStatus(employee.id, newStatus);

      if (response.success) {
        setEmployee(response.data.employee);
        showSuccess('Status updated');
      }
    } catch (err) {
      console.error('Error updating status:', err);
      setError(err.response?.data?.error || 'Failed to update status');
    } finally {
      setSaving(false);
    }
  };

  const handleEditEmployee = () => {
    setEditedEmployee({
      first_name: employee.first_name || '',
      last_name: employee.last_name || '',
      email: employee.email || '',
      phone: employee.phone || '',
      job_title: employee.job_title || '',
      department: employee.department || '',
      employment_type: employee.employment_type || 'full-time',
      start_date: employee.start_date ? employee.start_date.split('T')[0] : '',
      offered_salary: employee.offered_salary || '',
      salary_currency: employee.salary_currency || 'SAR',
    });
    setIsEditingEmployee(true);
  };

  const handleSaveEmployee = async () => {
    setSaving(true);
    try {
      const response = await onboardingAPI.updateEmployee(employee.id, editedEmployee);

      if (response.success) {
        setEmployee(response.data.employee);
        setIsEditingEmployee(false);
        showSuccess('Employee information updated');
      }
    } catch (err) {
      console.error('Error updating employee:', err);
      setError(err.response?.data?.error || 'Failed to update employee');
    } finally {
      setSaving(false);
    }
  };

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
      case 'onboarding':
        return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
      case 'active':
        return 'bg-green-500/20 text-green-400 border border-green-500/30';
      case 'inactive':
        return 'bg-muted text-muted-foreground border border-border';
      default:
        return 'bg-muted text-muted-foreground border border-border';
    }
  };

  const calculateCategoryProgress = (items) => {
    if (!items || items.length === 0) return 0;
    const completed = items.filter((item) => item.completed).length;
    return Math.round((completed / items.length) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading employee data...</p>
        </div>
      </div>
    );
  }

  if (error && !employee) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-destructive text-6xl mb-4">!</div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Error</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Link href="/hr/onboarding" className="text-primary hover:text-primary/80">
            Back to Onboarding Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>
          {employee ? `${employee.first_name} ${employee.last_name} - Onboarding` : 'Onboarding'} |
          Nexus
        </title>
      </Head>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-card shadow border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link
                  href="/hr/onboarding"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                </Link>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    {employee?.first_name} {employee?.last_name}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {employee?.employee_id} | {employee?.job_title}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <span
                  className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusBadgeColor(employee?.status)}`}
                >
                  {employee?.status?.replace('_', ' ')}
                </span>
                <select
                  value={employee?.status || ''}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="border border-border rounded-lg px-3 py-2 text-sm bg-card text-foreground focus:ring-2 focus:ring-primary focus:border-primary"
                  disabled={saving}
                >
                  <option value="pending">Pending</option>
                  <option value="onboarding">Onboarding</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
            <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 rounded-lg flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              {successMessage}
            </div>
          </div>
        )}

        {error && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
            <div className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded-lg flex items-center justify-between">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                {error}
              </div>
              <button onClick={() => setError(null)} className="text-destructive hover:text-destructive/80">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Employee Info & Actions */}
            <div className="space-y-6">
              {/* Employee Details Card */}
              <div className="bg-card rounded-xl shadow-sm border border-border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-foreground">Employee Information</h2>
                  {!isEditingEmployee && (
                    <button
                      onClick={handleEditEmployee}
                      className="text-primary hover:text-primary/80 text-sm font-medium"
                    >
                      Edit
                    </button>
                  )}
                </div>

                {isEditingEmployee ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground uppercase">First Name</label>
                        <input
                          type="text"
                          value={editedEmployee.first_name}
                          onChange={(e) => setEditedEmployee({ ...editedEmployee, first_name: e.target.value })}
                          className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground uppercase">Last Name</label>
                        <input
                          type="text"
                          value={editedEmployee.last_name}
                          onChange={(e) => setEditedEmployee({ ...editedEmployee, last_name: e.target.value })}
                          className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase">Email</label>
                      <input
                        type="email"
                        value={editedEmployee.email}
                        onChange={(e) => setEditedEmployee({ ...editedEmployee, email: e.target.value })}
                        className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase">Phone</label>
                      <input
                        type="tel"
                        value={editedEmployee.phone}
                        onChange={(e) => setEditedEmployee({ ...editedEmployee, phone: e.target.value })}
                        className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase">Job Title</label>
                      <input
                        type="text"
                        value={editedEmployee.job_title}
                        onChange={(e) => setEditedEmployee({ ...editedEmployee, job_title: e.target.value })}
                        className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase">Department</label>
                      <input
                        type="text"
                        value={editedEmployee.department}
                        onChange={(e) => setEditedEmployee({ ...editedEmployee, department: e.target.value })}
                        className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase">Employment Type</label>
                      <select
                        value={editedEmployee.employment_type}
                        onChange={(e) => setEditedEmployee({ ...editedEmployee, employment_type: e.target.value })}
                        className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:ring-2 focus:ring-primary"
                      >
                        <option value="full-time">Full Time</option>
                        <option value="part-time">Part Time</option>
                        <option value="contract">Contract</option>
                        <option value="intern">Intern</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase">Start Date</label>
                      <input
                        type="date"
                        value={editedEmployee.start_date}
                        onChange={(e) => setEditedEmployee({ ...editedEmployee, start_date: e.target.value })}
                        className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase">Offered Salary</label>
                      <div className="flex gap-2 mt-1">
                        <select
                          value={editedEmployee.salary_currency}
                          onChange={(e) => setEditedEmployee({ ...editedEmployee, salary_currency: e.target.value })}
                          className="px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:ring-2 focus:ring-primary"
                        >
                          <option value="SAR">SAR</option>
                          <option value="USD">USD</option>
                          <option value="AED">AED</option>
                          <option value="EUR">EUR</option>
                          <option value="GBP">GBP</option>
                          <option value="PKR">PKR</option>
                          <option value="INR">INR</option>
                        </select>
                        <input
                          type="number"
                          value={editedEmployee.offered_salary}
                          onChange={(e) => setEditedEmployee({ ...editedEmployee, offered_salary: e.target.value })}
                          className="flex-1 px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => setIsEditingEmployee(false)}
                        className="flex-1 px-4 py-2 border border-border text-foreground rounded-lg hover:bg-muted transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveEmployee}
                        disabled={saving}
                        className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                      >
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase">Email</label>
                      <p className="text-foreground">{employee?.email}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase">Phone</label>
                      <p className="text-foreground">{employee?.phone || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase">Department</label>
                      <p className="text-foreground">{employee?.department}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase">
                        Employment Type
                      </label>
                      <p className="text-foreground capitalize">
                        {employee?.employment_type?.replace('_', ' ').replace('-', ' ') || 'Full Time'}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase">Start Date</label>
                      <p className="text-foreground">{formatDate(employee?.start_date)}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase">
                        Offered Salary
                      </label>
                      <p className="text-foreground">
                        {employee?.offered_salary
                          ? `${employee.salary_currency || 'SAR'} ${Number(employee.offered_salary).toLocaleString()}`
                          : 'Not disclosed'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Assignment Card */}
              <div className="bg-card rounded-xl shadow-sm border border-border p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">Assignments</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      HR Assigned
                    </label>
                    <select
                      value={onboarding?.assigned_to || ''}
                      onChange={(e) => handleAssignment('assignedTo', e.target.value)}
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary"
                      disabled={saving}
                    >
                      <option value="">Select HR Staff</option>
                      {hrUsers.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.first_name} {user.last_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Onboarding Buddy
                    </label>
                    <select
                      value={onboarding?.buddy_id || ''}
                      onChange={(e) => handleAssignment('buddyId', e.target.value)}
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary"
                      disabled={saving}
                    >
                      <option value="">Select Buddy</option>
                      {hrUsers.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.first_name} {user.last_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Email Actions Card */}
              <div className="bg-card rounded-xl shadow-sm border border-border p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">Send Emails</h2>
                <div className="space-y-3">
                  <button
                    onClick={() => handleSendEmail('welcome')}
                    disabled={sendingEmail === 'welcome'}
                    className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {sendingEmail === 'welcome' ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Welcome Email
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleSendEmail('documents')}
                    disabled={sendingEmail === 'documents'}
                    className="w-full flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                  >
                    {sendingEmail === 'documents' ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Document Request
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleSendEmail('firstDay')}
                    disabled={sendingEmail === 'firstDay'}
                    className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {sendingEmail === 'firstDay' ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        First Day Info
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Notes Card */}
              <div className="bg-card rounded-xl shadow-sm border border-border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-foreground">Notes</h2>
                  <button
                    onClick={() => setShowNotesModal(true)}
                    className="text-primary hover:text-primary/80 text-sm font-medium"
                  >
                    Edit
                  </button>
                </div>
                <p className="text-muted-foreground text-sm whitespace-pre-wrap">
                  {onboarding?.notes || 'No notes added yet.'}
                </p>
              </div>
            </div>

            {/* Right Column - Checklist */}
            <div className="lg:col-span-2">
              <div className="bg-card rounded-xl shadow-sm border border-border p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-foreground">Onboarding Checklist</h2>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${onboarding?.progress || 0}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">
                      {onboarding?.progress || 0}%
                    </span>
                  </div>
                </div>

                {/* Checklist Categories */}
                <div className="space-y-6">
                  {onboarding?.checklist &&
                    Object.entries(onboarding.checklist).map(([category, items]) => (
                      <div key={category} className="border border-border rounded-lg overflow-hidden">
                        <div className="bg-muted/50 px-4 py-3 border-b border-border flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <span className="text-muted-foreground">{categoryIcons[category]}</span>
                            <h3 className="font-medium text-foreground">{categoryNames[category]}</h3>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-20 bg-muted rounded-full h-1.5">
                              <div
                                className="bg-green-500 h-1.5 rounded-full transition-all duration-300"
                                style={{ width: `${calculateCategoryProgress(items)}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {items.filter((i) => i.completed).length}/{items.length}
                            </span>
                          </div>
                        </div>
                        <div className="divide-y divide-border">
                          {items.map((item) => (
                            <div
                              key={item.id}
                              className="px-4 py-3 flex items-center justify-between hover:bg-muted/30 transition-colors cursor-pointer"
                              onClick={() => handleChecklistToggle(category, item.id, item.completed)}
                            >
                              <div className="flex items-center space-x-3">
                                <div
                                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                    item.completed
                                      ? 'bg-green-500 border-green-500 text-white'
                                      : 'border-border hover:border-green-400'
                                  }`}
                                >
                                  {item.completed && (
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </div>
                                <span
                                  className={`text-sm ${item.completed ? 'text-muted-foreground line-through' : 'text-foreground'}`}
                                >
                                  {item.task || item.name}
                                </span>
                              </div>
                              {item.completed && item.completedAt && (
                                <span className="text-xs text-muted-foreground">
                                  {new Date(item.completedAt).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notes Modal */}
      {showNotesModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-xl shadow-xl max-w-lg w-full mx-4 border border-border">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Edit Notes</h3>
              <button
                onClick={() => setShowNotesModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={6}
                className="w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="Add notes about this employee's onboarding..."
              />
            </div>
            <div className="px-6 py-4 border-t border-border flex justify-end space-x-3">
              <button
                onClick={() => setShowNotesModal(false)}
                className="px-4 py-2 text-foreground hover:text-foreground/80 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNotes}
                disabled={saving}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Notes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
