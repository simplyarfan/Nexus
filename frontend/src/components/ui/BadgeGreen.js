import React from 'react';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

/**
 * Green-themed Badge Component
 * Based on Nexus Design Prototypes
 *
 * @param {Object} props - Component props
 * @param {'primary' | 'success' | 'warning' | 'error' | 'gray'} props.variant - Badge variant
 * @param {'sm' | 'md' | 'lg'} props.size - Badge size
 * @param {boolean} props.dot - Show dot indicator
 * @param {React.ReactNode} props.children - Badge content
 * @param {string} props.className - Additional classes
 */
export default function BadgeGreen({
  variant = 'gray',
  size = 'md',
  dot = false,
  children,
  className,
  ...props
}) {
  const variants = {
    primary: 'badge-primary',
    success: 'badge-success',
    warning: 'badge-warning',
    error: 'badge-error',
    gray: 'badge-gray',
  };

  const sizes = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-0.5',
    lg: 'text-sm px-3 py-1',
  };

  return (
    <motion.span
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={cn('badge', variants[variant], sizes[size], className)}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            'inline-block w-1.5 h-1.5 rounded-full mr-1.5',
            variant === 'primary' && 'bg-green-500',
            variant === 'success' && 'bg-green-500',
            variant === 'warning' && 'bg-yellow-500',
            variant === 'error' && 'bg-red-500',
            variant === 'gray' && 'bg-gray-500',
          )}
        />
      )}
      {children}
    
  );
}
