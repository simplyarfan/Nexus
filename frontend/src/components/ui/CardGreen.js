import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { cardHover } from '../../lib/motion';

/**
 * Green-themed Card Component
 * Based on Nexus Design Prototypes
 *
 * @param {Object} props - Component props
 * @param {boolean} props.hover - Enable hover animations
 * @param {'none' | 'sm' | 'md' | 'lg'} props.padding - Card padding size
 * @param {React.ReactNode} props.children - Card content
 * @param {string} props.className - Additional classes
 */
export default function CardGreen({
  hover = false,
  padding = 'md',
  children,
  className,
  ...props
}) {
  const paddings = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      variants={hover ? cardHover : undefined}
      whileHover={hover ? 'hover' : undefined}
      whileTap={hover ? 'tap' : undefined}
      className={cn('card', paddings[padding], hover && 'cursor-pointer', className)}
      {...props}
    >
      {children}
    
  );
}

/**
 * Card Header Component
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Header content
 * @param {string} props.className - Additional classes
 */
export function CardHeader({ children, className }) {
  return {children};
}

/**
 * Card Title Component
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Title content
 * @param {string} props.className - Additional classes
 */
export function CardTitle({ children, className }) {
  return {children};
}

/**
 * Card Description Component
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Description content
 * @param {string} props.className - Additional classes
 */
export function CardDescription({ children, className }) {
  return {children};
}

/**
 * Card Content Component
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Content
 * @param {string} props.className - Additional classes
 */
export function CardContent({ children, className }) {
  return {children};
}

/**
 * Card Footer Component
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Footer content
 * @param {string} props.className - Additional classes
 */
export function CardFooter({ children, className }) {
  return {children};
}
