import React, { memo } from 'react';

interface FeedSkeletonProps {
  count?: number;
}

const FeedSkeleton: React.FC<FeedSkeletonProps> = memo(({ count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="bg-white dark:bg-dark-bg-secondary rounded-xl shadow-sm border border-gray-100 dark:border-dark-border p-4 animate-pulse"
        >
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-200 dark:bg-dark-bg-tertiary rounded-full" />
            <div className="flex-1">
              <div className="h-4 w-32 bg-gray-200 dark:bg-dark-bg-tertiary rounded" />
              <div className="h-3 w-24 bg-gray-200 dark:bg-dark-bg-tertiary rounded mt-2" />
            </div>
          </div>

          {/* Content */}
          <div className="mt-4 space-y-2">
            <div className="h-4 w-full bg-gray-200 dark:bg-dark-bg-tertiary rounded" />
            <div className="h-4 w-3/4 bg-gray-200 dark:bg-dark-bg-tertiary rounded" />
            <div className="h-4 w-1/2 bg-gray-200 dark:bg-dark-bg-tertiary rounded" />
          </div>

          {/* Actions */}
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-dark-border flex justify-around">
            <div className="h-8 w-20 bg-gray-200 dark:bg-dark-bg-tertiary rounded" />
            <div className="h-8 w-20 bg-gray-200 dark:bg-dark-bg-tertiary rounded" />
            <div className="h-8 w-20 bg-gray-200 dark:bg-dark-bg-tertiary rounded" />
          </div>
        </div>
      ))}
    </>
  );
});

FeedSkeleton.displayName = 'FeedSkeleton';
export default FeedSkeleton;
