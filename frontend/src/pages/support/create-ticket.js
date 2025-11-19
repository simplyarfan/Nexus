import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import { supportAPI } from '../../utils/supportAPI';
import toast from 'react-hot-toast';

export default function CreateTicket() {
  const router = useRouter();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'superadmin';
  const isAdmin = user?.role === 'admin';

  const getDashboardPath = () => {
    if (isSuperAdmin) return '/superadmin';
    if (isAdmin) return '/admin';
    return '/';
  };
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors] = useState({});
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    priority: 'medium',
    category: 'general',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Call the real API to create the ticket
      const response = await supportAPI.createTicket({
        subject: formData.subject,
        description: formData.description,
        priority: formData.priority,
        category: formData.category,
      });

      // Only show success if the API call was successful
      if (response.data && response.data.success) {
        setIsSubmitting(false);
        setShowSuccess(true);

        // Reset form and redirect after showing success
        setTimeout(() => {
          setFormData({
            subject: '',
            description: '',
            priority: 'medium',
            category: 'general',
          });
          setShowSuccess(false);
          router.push('/support/my-tickets'); // Redirect to my tickets page
        }, 2000);
      } else {
        throw new Error(response.data?.message || 'Failed to create ticket');
      }
    } catch (error) {
      setIsSubmitting(false);
      console.error('Error creating ticket:', error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          'Failed to create ticket. Please try again.',
      );
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-8 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-secondary rounded-lg transition-colors"
            >
              <svg
                className="w-5 h-5 text-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Create Support Ticket</h1>
              <p className="text-muted-foreground mt-1">Submit a new support request</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-xl p-8"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Subject */}
            <div>
              <label htmlFor="subject" className="block text-sm font-semibold text-foreground mb-2">
                Subject <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
                placeholder="Brief description of your issue"
                className={`w-full px-4 py-3 bg-secondary border rounded-lg text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent ${errors.subject ? 'border-destructive' : 'border-border'}`}
              />
              {errors.subject && <p className="text-sm text-destructive mt-1">{errors.subject}</p>}
            </div>

            {/* Category */}
            <div>
              <label
                htmlFor="category"
                className="block text-sm font-semibold text-foreground mb-2"
              >
                Category <span className="text-destructive">*</span>
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className={`w-full px-4 py-3 bg-secondary border rounded-lg text-foreground focus:ring-2 focus:ring-primary focus:border-transparent ${errors.category ? 'border-destructive' : 'border-border'}`}
              >
                <option value="general">General Inquiry</option>
                <option value="technical">Technical Issue</option>
                <option value="account">Account & Billing</option>
                <option value="feature">Feature Request</option>
                <option value="bug">Bug Report</option>
                <option value="other">Other</option>
              </select>
              {errors.category && (
                <p className="text-sm text-destructive mt-1">{errors.category}</p>
              )}
            </div>

            {/* Priority */}
            <div>
              <label
                htmlFor="priority"
                className="block text-sm font-semibold text-foreground mb-2"
              >
                Priority <span className="text-destructive">*</span>
              </label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                required
                className={`w-full px-4 py-3 bg-secondary border rounded-lg text-foreground focus:ring-2 focus:ring-primary focus:border-transparent ${errors.priority ? 'border-destructive' : 'border-border'}`}
              >
                <option value="low">Low - General question or minor issue</option>
                <option value="medium">Medium - Affects my work but has workaround</option>
                <option value="high">High - Blocking my work, needs urgent attention</option>
              </select>
              {errors.priority && (
                <p className="text-sm text-destructive mt-1">{errors.priority}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-semibold text-foreground mb-2"
              >
                Description <span className="text-destructive">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={8}
                placeholder="Please provide detailed information about your issue..."
                className={`w-full px-4 py-3 bg-secondary border rounded-lg text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent resize-none ${errors.description ? 'border-destructive' : 'border-border'}`}
              />
              {errors.description && (
                <p className="text-sm text-destructive mt-1">{errors.description}</p>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                Tip: Include steps to reproduce the issue, error messages, and any relevant
                screenshots
              </p>
            </div>

            {/* Info Box */}
            <div className="bg-accent/10 border border-primary/20 rounded-lg p-4">
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-primary"
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
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-1">What happens next?</h4>
                  <p className="text-sm text-muted-foreground">
                    Our support team will review your ticket and respond within 24 hours.
                    You&apos;ll receive email notifications for any updates.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-4 pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Submitting...
                  </span>
                ) : (
                  'Submit Ticket'
                )}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                disabled={isSubmitting}
                className="px-6 py-3 bg-secondary text-foreground rounded-lg font-semibold hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </form>
        </motion.div>

        {/* Success Modal */}
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-card border border-border rounded-xl p-8 max-w-md w-full relative"
            >
              <button
                onClick={() => setShowSuccess(false)}
                className="absolute top-4 right-4 p-1.5 hover:bg-secondary rounded-lg transition-colors"
                aria-label="Close"
              >
                <svg
                  className="w-5 h-5 text-muted-foreground"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
              <div className="text-center">
                <div className="w-16 h-16 bg-accent/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-2">Ticket Submitted!</h3>
                <p className="text-muted-foreground mb-1">
                  Your support ticket has been created successfully.
                </p>
                <p className="text-sm text-muted-foreground">We&apos;ll get back to you soon.</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
