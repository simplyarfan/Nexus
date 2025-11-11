import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { buttonTap } from '../../lib/motion';

/**
 * Green-themed Button Component
 * Based on Nexus Design Prototypes
 *
 * @param {Object} props - Component props
 * @param {'primary' | 'secondary' | 'success' | 'error' | 'ghost'} props.variant - Button variant
 * @param {'sm' | 'md' | 'lg'} props.size - Button size
 * @param {boolean} props.isLoading - Loading state
 * @param {React.ReactNode} props.leftIcon - Icon to display on the left
 * @param {React.ReactNode} props.rightIcon - Icon to display on the right
 * @param {boolean} props.fullWidth - Full width button
 * @param {string} props.className - Additional classes
 * @param {boolean} props.disabled - Disabled state
 */
const ButtonGreen = forwardRef(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      className,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    const variants = {
      primary: 'btn-primary',
      secondary: 'btn-secondary',
      success: 'btn-success',
      error: 'btn-error',
      ghost: 'btn-ghost',
    };

    const sizes = {
      sm: 'btn-sm',
      md: 'btn',
      lg: 'btn-lg',
    };

    return (
      <motion.button
        ref={ref}
        whileTap={!disabled && !isLoading ? buttonTap : undefined}
        className={cn(
          'btn-base',
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          (disabled || isLoading) && 'opacity-50 cursor-not-allowed',
          className,
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
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
            
            Loading...
          
        ) : (
          
            {leftIcon && {leftIcon}}
            {children}
            {rightIcon && {rightIcon}}
          
        )}
      
    );
  },
);

ButtonGreen.displayName = 'ButtonGreen';

export default ButtonGreen;
