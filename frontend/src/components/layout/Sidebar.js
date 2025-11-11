import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import {
  Home,
  FileText,
  Users,
  BarChart3,
  Settings,
  HelpCircle,
  LogOut,
  ChevronLeft,
  Brain,
  Calendar,
  MessageSquare,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';

export default function Sidebar({ collapsed, onToggle }) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [hoveredItem, setHoveredItem] = useState(null);

  const isSuperAdmin = user?.email === 'syedarfan@securemaxtech.com';

  const navigationItems = isSuperAdmin
    ? [
        { name: 'Dashboard', href: '/admin', icon: Home },
        { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
        { name: 'Users', href: '/admin/users', icon: Users },
        { name: 'Support', href: '/admin/tickets', icon: MessageSquare },
        { name: 'System', href: '/admin/system', icon: Settings },
      ]
    : [
        { name: 'Dashboard', href: '/', icon: Home },
        { name: 'CV Intelligence', href: '/cv-intelligence', icon: Brain },
        { name: 'Analytics', href: '/analytics', icon: BarChart3 },
        { name: 'Interview Coordinator', href: '/interviews', icon: Calendar },
        { name: 'Support', href: '/support/my-tickets', icon: MessageSquare },
      ];

  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
  };

  return (
    <div
      className={cn(
        'h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 flex-shrink-0',
        collapsed ? 'w-16' : 'w-64',
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <motion.div
              className="flex items-center space-x-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center">
                <div className="w-5 h-5 bg-sidebar-primary-foreground rounded-sm"></div>
              </div>
              <span className="text-lg font-semibold text-foreground">SimpleAI</span>
            </motion.div>
          )}
          <button
            onClick={onToggle}
            className="p-2 rounded-lg hover:bg-sidebar-accent transition-colors"
          >
            <ChevronLeft
              className={cn(
                'w-4 h-4 text-sidebar-foreground transition-transform duration-200',
                collapsed && 'rotate-180',
              )}
            />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => {
          const isActive = router.pathname === item.href;
          return (
            <Link key={item.name} href={item.href}>
              <motion.div
                className={cn(
                  'flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 cursor-pointer',
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                )}
                onHoverStart={() => setHoveredItem(item.name)}
                onHoverEnd={() => setHoveredItem(null)}
                whileHover={{ x: collapsed ? 0 : 4 }}
                whileTap={{ scale: 0.98 }}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && (
                  <motion.span
                    className="font-medium"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    {item.name}
                  </motion.span>
                )}

                {/* Tooltip for collapsed state */}
                {collapsed && hoveredItem === item.name && (
                  <motion.div
                    className="absolute left-16 bg-popover text-popover-foreground px-2 py-1 rounded-md text-sm font-medium z-50 shadow-lg"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                  >
                    {item.name}
                  </motion.div>
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* User Profile & Logout */}
      <div className="p-4 border-t border-sidebar-border">
        {!collapsed && (
          <motion.div
            className="mb-4 p-3 bg-muted rounded-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user?.first_name?.charAt(0) || user?.name?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {user?.first_name && user?.last_name
                    ? `${user.first_name} ${user.last_name}`
                    : user?.name || 'User'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.department || user?.email || 'user@example.com'}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        <button
          onClick={handleLogout}
          className={cn(
            'flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 text-sidebar-foreground hover:bg-destructive hover:text-destructive-foreground w-full',
            collapsed && 'justify-center',
          )}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && (
            <motion.span
              className="font-medium"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              Sign out
            </motion.span>
          )}
        </button>
      </div>
    </div>
  );
}
