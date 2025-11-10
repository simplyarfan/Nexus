import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import HRDashboard from '../components/user/HRDashboard';
import FinanceDashboard from '../components/user/FinanceDashboard';
import SalesDashboard from '../components/user/SalesDashboard';
import AdminDashboard from '../components/admin/AdminDashboard';
import WaitingDashboard from '../components/user/WaitingDashboard';
import LandingPage from './landing';
import ClientOnly from '../components/shared/ClientOnly';

const Dashboard = () => {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  // Dashboard mapping for cleaner code
  const DASHBOARD_MAP = {
    'Human Resources': HRDashboard,
    Finance: FinanceDashboard,
    'Sales & Marketing': SalesDashboard,
  };

  // Redirect superadmin users to /superadmin route
  useEffect(() => {
    if (!loading && isAuthenticated && user?.email === 'syedarfan@securemaxtech.com') {
      router.push('/superadmin');
    }
  }, [user, loading, isAuthenticated, router]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, show landing page directly
  if (!isAuthenticated || !user) {
    return <LandingPage />;
  }

  // If superadmin, show loading while redirecting (prevents flash)
  if (user?.email === 'syedarfan@securemaxtech.com') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-sm">Redirecting to admin dashboard...</p>
        </div>
      </div>
    );
  }

  // Route users based on their department
  if (user?.role === 'user') {
    // Get dashboard component from mapping or use WaitingDashboard
    const DashboardComponent = DASHBOARD_MAP[user?.department] || WaitingDashboard;
    return <DashboardComponent />;
  }

  // Admin role gets admin dashboard
  if (user?.role === 'admin') {
    return <AdminDashboard />;
  }

  // Fallback - show waiting dashboard
  return <WaitingDashboard />;
};

// Wrap with ClientOnly to prevent SSR/build issues
export default function IndexPage() {
  return (
    <ClientOnly>
      <Dashboard />
    </ClientOnly>
  );
}
