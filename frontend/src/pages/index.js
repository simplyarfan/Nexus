import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import HRDashboard from '../components/user/HRDashboard';
import HumanResourcesDashboard from '../components/user/HumanResourcesDashboard';
import FinanceDashboard from '../components/user/FinanceDashboard';
import SalesDashboard from '../components/user/SalesDashboard';
import AdminDashboard from '../components/admin/AdminDashboard';
import WaitingDashboard from '../components/user/WaitingDashboard';
import LandingPage from './landing';
import ClientOnly from '../components/shared/ClientOnly';

const Dashboard = () => {
  const { user, loading, isAuthenticated, isSuperAdmin, isAdmin, isUser, hasDepartment } =
    useAuth();
  const router = useRouter();

  // Dashboard mapping for cleaner code
  const DASHBOARD_MAP = {
    'Recruitment': HRDashboard,
    'Human Resources': HumanResourcesDashboard,
    Finance: FinanceDashboard,
    'Sales & Marketing': SalesDashboard,
  };

  // Redirect superadmin to /superadmin route
  useEffect(() => {
    if (!loading && isAuthenticated && isSuperAdmin) {
      router.push('/superadmin');
    }
  }, [isSuperAdmin, loading, isAuthenticated, router]);

  // Redirect admin to /admin route
  useEffect(() => {
    if (!loading && isAuthenticated && isAdmin) {
      router.push('/admin');
    }
  }, [isAdmin, loading, isAuthenticated, router]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, show landing page directly
  if (!isAuthenticated || !user) {
    return <LandingPage />;
  }

  // If superadmin, show loading while redirecting (prevents flash)
  if (isSuperAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground text-sm">
            Redirecting to superadmin dashboard...
          </p>
        </div>
      </div>
    );
  }

  // If admin, show loading while redirecting (prevents flash)
  if (isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground text-sm">Redirecting to admin dashboard...</p>
        </div>
      </div>
    );
  }

  // Route regular users based on their department
  if (isUser) {
    // If user has no department, show waiting dashboard
    if (!hasDepartment) {
      return <WaitingDashboard />;
    }
    // Get dashboard component from mapping or use WaitingDashboard as fallback
    const DashboardComponent = DASHBOARD_MAP[user?.department] || WaitingDashboard;
    return <DashboardComponent />;
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
