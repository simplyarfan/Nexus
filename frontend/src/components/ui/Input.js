import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const Input = forwardRef(
  (
    { label, error, hint, leftIcon, rightIcon, fullWidth = false, className, required, ...props },
    ref,
  ) => {
    return (
      <div className={cn('w-full', fullWidth && 'w-full')}>
        {label && (
          <label className="block text-sm font-medium text-foreground mb-2">
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {leftIcon}
            </div>
          )}

          <motion.input
            ref={ref}
            className={cn(
              'w-full px-4 py-2 bg-background text-foreground border border-border rounded-lg',
              'focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent',
              'placeholder:text-muted-foreground',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              error && 'border-destructive focus:ring-destructive',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              className,
            )}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {rightIcon}
            </div>
          )}
        </div>

        {error && <p className="text-sm text-destructive mt-1">{error}</p>}

        {hint && !error && <p className="text-sm text-muted-foreground mt-1">{hint}</p>}
      </div>
    );
  },
);

Input.displayName = 'Input';

export default Input;
