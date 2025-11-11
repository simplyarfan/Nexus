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
    
      <div
        className={cn(
          'bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center',
          sizes[size].container,
        )}
      >
        
      
      {showText && Nexus}
    
  );
};

export default Logo;
