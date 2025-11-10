'use client';

import { forwardRef, InputHTMLAttributes } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    { label, error, hint, leftIcon, rightIcon, fullWidth = false, className, id, ...props },
    ref,
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className={cn('form-group', fullWidth && 'w-full')}>
        {label && (
          <label htmlFor={inputId} className="form-label">
            {label}
            {props.required && <span className="text-error-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              {leftIcon}
            </div>
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
              className,
            )}
            {...props}
          />

          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
              {rightIcon}
            </div>
          )}
        </div>

        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="form-error"
          >
            {error}
          </motion.p>
        )}

        {hint && !error && <p className="form-hint">{hint}</p>}
      </div>
    );
  },
);

Input.displayName = 'Input';

export default Input;
