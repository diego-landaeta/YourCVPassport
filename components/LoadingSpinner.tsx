import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
  fullScreen?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Cargando...',
  size = 'medium',
  fullScreen = false
}) => {
  const sizeClasses = {
    small: 'w-8 h-8',
    medium: 'w-12 h-12',
    large: 'w-16 h-16'
  };

  const containerClasses = fullScreen
    ? 'fixed inset-0 flex flex-col items-center justify-center bg-white dark:bg-dark-bg-primary z-50'
    : 'flex flex-col items-center justify-center min-h-[calc(100vh-128px)]';

  return (
    <div className={containerClasses}>
      <div className="relative">
        {/* Outer rotating circle */}
        <div className={`${sizeClasses[size]} rounded-full border-4 border-gray-200 dark:border-dark-border`}></div>

        {/* Inner spinning arc */}
        <div
          className={`${sizeClasses[size]} rounded-full border-4 border-transparent border-t-primary-600 dark:border-t-primary-500 absolute top-0 left-0 animate-spin`}
          style={{ animationDuration: '0.8s' }}
        ></div>

        {/* Pulsing dot in center */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div
            className="w-2 h-2 bg-primary-600 dark:bg-primary-500 rounded-full animate-pulse"
            style={{ animationDuration: '1.5s' }}
          ></div>
        </div>
      </div>

      {/* Loading message */}
      {message && (
        <p className="mt-4 text-gray-600 dark:text-gray-300 text-sm font-medium animate-pulse">
          {message}
        </p>
      )}

      {/* Animated dots */}
      <div className="flex space-x-1 mt-2">
        <span
          className="w-1.5 h-1.5 bg-primary-600 dark:bg-primary-500 rounded-full animate-bounce"
          style={{ animationDelay: '0ms', animationDuration: '1s' }}
        ></span>
        <span
          className="w-1.5 h-1.5 bg-primary-600 dark:bg-primary-500 rounded-full animate-bounce"
          style={{ animationDelay: '150ms', animationDuration: '1s' }}
        ></span>
        <span
          className="w-1.5 h-1.5 bg-primary-600 dark:bg-primary-500 rounded-full animate-bounce"
          style={{ animationDelay: '300ms', animationDuration: '1s' }}
        ></span>
      </div>
    </div>
  );
};

export default LoadingSpinner;
