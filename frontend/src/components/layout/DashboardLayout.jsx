import { useState } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';

const roleNavigation = {
  user: [
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
          />
        </svg>
      ),
      label: 'CV Intelligence',
      description: 'Analyze resumes and rank candidates',
      href: '/cv-intelligence',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ),
      label: 'Interview Coordinator',
      description: 'Schedule and manage interviews',
      href: '/interviews',
    },
  ],
  admin: [
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ),
      label: 'User Management',
      description: 'Manage users and permissions',
      href: '/admin/users',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
      label: 'Analytics',
      description: 'View platform analytics',
      href: '/admin/analytics',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ),
      label: 'Support Tickets',
      description: 'Manage support requests',
      href: '/support',
    },
  ],
  superadmin: [
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ),
      label: 'User Management',
      description: 'Manage all users and roles',
      href: '/superadmin/users',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
      ),
      label: 'System Settings',
      description: 'Configure platform settings',
      href: '/superadmin/settings',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
      label: 'Analytics',
      description: 'View platform analytics',
      href: '/superadmin/analytics',
    },
  ],
};

export default function DashboardLayout({ children }) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const { user, logout } = useAuth();

  const userRole = user?.role || 'user';
  const navigation = roleNavigation[userRole] || roleNavigation.user;

  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Backdrop for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Fixed */}
      <div
        className={`w-64 bg-card border-r border-border flex flex-col fixed h-screen ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 transition-transform z-50`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-border">
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => router.push('/dashboard')}
          >
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <svg
                className="w-6 h-6 text-primary-foreground"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-foreground">Nexus</span>
          </div>
        </div>

        {/* AI Agents Section */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              AI AGENTS
            </p>
            <div className="space-y-2">
              {navigation.map((item) => {
                const isActive = router.pathname === item.href;
                return (
                  <button
                    key={item.href}
                    onClick={() => router.push(item.href)}
                    className={`w-full flex items-start gap-3 p-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-foreground hover:bg-accent'
                    }`}
                  >
                    <div className="flex-shrink-0 mt-0.5">{item.icon}</div>
                    <div className="flex-1 text-left">
                      <p
                        className={`text-sm font-medium ${
                          isActive ? 'text-primary-foreground' : 'text-foreground'
                        }`}
                      >
                        {item.label}
                      </p>
                      <p
                        className={`text-xs ${
                          isActive ? 'text-primary-foreground/80' : 'text-muted-foreground'
                        }`}
                      >
                        {item.description}
                      </p>
                    </div>
                    <svg
                      className="w-4 h-4 flex-shrink-0 mt-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* User Menu */}
        <div className="p-4 border-t border-border relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
          >
            <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-muted-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-foreground">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-xs text-muted-foreground">{user?.department || 'Employee'}</p>
            </div>
            <svg
              className="w-4 h-4 text-muted-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          <AnimatePresence>
            {showUserMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute bottom-full left-4 right-4 mb-2 bg-card border border-border rounded-lg shadow-lg overflow-hidden z-50"
                >
                  <button
                    onClick={() => {
                      router.push('/support');
                      setShowUserMenu(false);
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-accent transition-colors flex items-center gap-3"
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
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    <span className="text-sm text-foreground">Create Ticket</span>
                  </button>
                  <button
                    onClick={() => {
                      router.push('/support');
                      setShowUserMenu(false);
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-accent transition-colors flex items-center gap-3"
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
                        d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                      />
                    </svg>
                    <span className="text-sm text-foreground">My Tickets</span>
                  </button>
                  <button
                    onClick={() => {
                      router.push('/profile');
                      setShowUserMenu(false);
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-accent transition-colors flex items-center gap-3"
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
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    <span className="text-sm text-foreground">Profile Settings</span>
                  </button>
                  <div className="border-t border-border" />
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      handleLogout();
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-accent transition-colors flex items-center gap-3"
                  >
                    <svg
                      className="w-5 h-5 text-destructive"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    <span className="text-sm text-destructive">Logout</span>
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Main Content - Add left margin to account for fixed sidebar */}
      <div className="flex-1 lg:ml-64 overflow-auto">
        {/* Mobile Menu Button */}
        <div className="lg:hidden fixed top-4 left-4 z-30">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 bg-card border border-border rounded-lg hover:bg-accent"
            aria-label="Toggle sidebar"
          >
            <svg
              className="w-6 h-6 text-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}
