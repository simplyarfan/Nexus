import React from 'react';
import { cn } from '../../lib/utils';

export const Logo = ({ size = 'md', showText = true, className }) => {
  const sizes = {
    sm: { container: 'w-6 h-6', diamond: 'w-3 h-3', text: 'text-lg' },
    md: { container: 'w-8 h-8', diamond: 'w-4 h-4', text: 'text-xl' },
    lg: { container: 'w-12 h-12', diamond: 'w-6 h-6', text: 'text-2xl' },
    xl: { container: 'w-16 h-16', diamond: 'w-8 h-8', text: 'text-3xl' },
  };

  return (
    <div className={cn('flex items-center space-x-3', className)}>
      <div
        className={cn(
          'bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center',
          sizes[size].container,
        )}
      >
        <div className={cn('bg-white rounded-sm transform rotate-45', sizes[size].diamond)}></div>
      </div>
      {showText && <span className={cn('font-bold text-gray-900', sizes[size].text)}>Nexus</span>}
    </div>
  );
};

export default Logo;
