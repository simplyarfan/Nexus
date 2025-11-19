import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../utils/api';
import toast from 'react-hot-toast';

export default function OutlookCallback() {
  const router = useRouter();
  const { user } = useAuth();
  const [status, setStatus] = useState('processing');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const { code, state, error, error_description } = router.query;

        // Check for errors from Microsoft
        if (error) {
          console.error('OAuth error:', error, error_description);
          toast.error(error_description || 'Failed to connect Outlook account');
          setStatus('error');
          setTimeout(() => router.push('/profile?tab=email'), 2000);
          return;
        }

        // Wait for code to be available
        if (!code) {
          return;
        }

        setStatus('connecting');

        // Send code to backend
        const response = await api.post('/auth/outlook/callback', {
          code,
          state,
        });

        if (response.data.success) {
          toast.success('Outlook connected successfully!');
          setStatus('success');
          setTimeout(() => router.push('/profile?tab=email'), 1500);
        } else {
          throw new Error(response.data.message || 'Failed to connect Outlook');
        }
      } catch (error) {
        console.error('Outlook callback error:', error);
        toast.error(error.response?.data?.message || 'Failed to connect Outlook account');
        setStatus('error');
        setTimeout(() => router.push('/profile?tab=email'), 2000);
      }
    };

    if (router.isReady && user) {
      handleCallback();
    }
  }, [router.isReady, router.query, user]);

  return (
    <div className="min-h-screen bg-secondary flex items-center justify-center">
      <div className="bg-primary p-8 rounded-lg shadow-lg max-w-md w-full text-center">
        {status === 'processing' && (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-accent mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-textPrimary mb-2">Processing...</h2>
            <p className="text-textSecondary">Please wait while we process your request.</p>
          </>
        )}

        {status === 'connecting' && (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-accent mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-textPrimary mb-2">Connecting Outlook</h2>
            <p className="text-textSecondary">Setting up your Outlook integration...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="text-green-500 text-6xl mb-4">✓</div>
            <h2 className="text-xl font-semibold text-textPrimary mb-2">Success!</h2>
            <p className="text-textSecondary">Your Outlook account has been connected.</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-red-500 text-6xl mb-4">✕</div>
            <h2 className="text-xl font-semibold text-textPrimary mb-2">Connection Failed</h2>
            <p className="text-textSecondary">
              Unable to connect your Outlook account. Redirecting...
            </p>
          </>
        )}
      </div>
    </div>
  );
}
