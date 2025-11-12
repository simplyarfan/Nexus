import React from 'react';

const Loading = ({ size = 'medium', text = 'Loading...', fullScreen = false, className = '' }) => {
  const sizeClasses = {
    small: 'h-4 w-4',
    medium: 'h-8 w-8',
    large: 'h-12 w-12',
  };

  const containerClasses = fullScreen
    ? 'fixed inset-0 flex items-center justify-center bg-card bg-opacity-75 z-50'
    : 'flex items-center justify-center p-4';

  return (
    <div className={`${containerClasses} ${className}`}>
      <div className="flex flex-col items-center">
        <div
          className={`animate-spin rounded-full border-4 border-border border-t-blue-600 ${sizeClasses[size]}`}
        ></div>
        {text && <p className="mt-2 text-sm text-muted-foreground animate-pulse">{text}</p>}
      </div>
    </div>
  );
};

// Skeleton loading component
export const SkeletonLoader = ({ lines = 3, className = '' }) => {
  return (
    <div className={`animate-pulse ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={`h-4 bg-muted rounded mb-2 ${index === lines - 1 ? 'w-3/4' : 'w-full'}`}
        ></div>
      ))}
    </div>
  );
};

// Card skeleton
export const CardSkeleton = ({ className = '' }) => {
  return (
    <div className={`animate-pulse bg-card rounded-lg shadow p-6 ${className}`}>
      <div className="h-4 bg-muted rounded w-1/4 mb-4"></div>
      <div className="space-y-2">
        <div className="h-4 bg-muted rounded"></div>
        <div className="h-4 bg-muted rounded w-5/6"></div>
        <div className="h-4 bg-muted rounded w-3/4"></div>
      </div>
    </div>
  );
};

export default Loading;
