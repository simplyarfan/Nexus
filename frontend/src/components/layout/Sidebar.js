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
        { name: 'Interviews', href: '/interviews', icon: Calendar },
        { name: 'Support', href: '/support/my-tickets', icon: MessageSquare },
      ];

  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
  };

  return (
    <div
      className={cn(
        'h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300 flex-shrink-0',
        collapsed ? 'w-16' : 'w-64',
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <motion.div
              className="flex items-center space-x-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center">
                <div className="w-5 h-5 bg-white dark:bg-black rounded-sm"></div>
              </div>
              <span className="text-lg font-semibold text-gray-900 dark:text-white">SimpleAI</span>
            </motion.div>
          )}
          <button
            onClick={onToggle}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <ChevronLeft
              className={cn(
                'w-4 h-4 text-gray-500 transition-transform duration-200',
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
                    ? 'bg-black dark:bg-white text-white dark:text-black'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white',
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
                    className="absolute left-16 bg-black dark:bg-white text-white dark:text-black px-2 py-1 rounded-md text-sm font-medium z-50"
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
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        {!collapsed && (
          <motion.div
            className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
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
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user?.first_name && user?.last_name
                    ? `${user.first_name} ${user.last_name}`
                    : user?.name || 'User'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user?.department || user?.email || 'user@example.com'}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        <button
          onClick={handleLogout}
          className={cn(
            'flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 w-full',
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
