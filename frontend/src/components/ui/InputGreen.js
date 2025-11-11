import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

/**
 * Green-themed Input Component
 * Based on Nexus Design Prototypes
 *
 * @param {Object} props - Component props
 * @param {string} props.label - Input label
 * @param {string} props.error - Error message
 * @param {string} props.hint - Hint text
 * @param {React.ReactNode} props.leftIcon - Icon to display on the left
 * @param {React.ReactNode} props.rightIcon - Icon to display on the right
 * @param {boolean} props.fullWidth - Full width input
 * @param {string} props.className - Additional classes
 * @param {string} props.id - Input ID
 */
const InputGreen = forwardRef(
  (
    { label, error, hint, leftIcon, rightIcon, fullWidth = false, className, id, ...props },
    ref,
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    return (
      
        {label && (
          
            {label}
            {props.required && *}
          
        )}

        
          {leftIcon && (
            
              {leftIcon}
            
          )}

          <input
            ref={ref}
            id={inputId}
            className={cn(
              'input-base',
              error && 'input-error',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              fullWidth && 'w-full',
              props.disabled && 'opacity-60 cursor-not-allowed',
              className,
            )}
            {...props}
          />

          {rightIcon && (
            
              {rightIcon}
            
          )}
        

        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="form-error"
          >
            {error}
          
        )}

        {hint && !error && {hint}}
      
    );
  },
);

InputGreen.displayName = 'InputGreen';

export default InputGreen;
