import { motion } from 'framer-motion';
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { buttonTap } from '@/lib/motion';

const Button = forwardRef(({
  variant = 'primary',
  size = 'md',
  leftIcon,
  rightIcon,
  fullWidth = false,
  className,
  children,
  disabled,
  ...props
}, ref) => {
  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    success: 'btn-success',
    error: 'btn-error',
    ghost: 'btn-ghost',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <motion.button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium rounded-lg',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'transition-colors',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled}
      {...buttonTap}
      {...props}
    >
      {leftIcon && <span>{leftIcon}</span>}
      {children}
      {rightIcon && <span>{rightIcon}</span>}
    </motion.button>
  );
});

Button.displayName = 'Button';

export default Button;
