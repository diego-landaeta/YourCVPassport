import React, { memo } from 'react';

interface FeedSkeletonProps {
  count?: number;
}

/**
 * Skeleton that mirrors the real FeedPost card layout:
 * rounded-2xl card → header (avatar + name/headline/timestamp) →
 * text lines → optional image → stats row → 4 action buttons.
 * Alternates between text-only and image variants for realism.
 */
const FeedSkeleton: React.FC<FeedSkeletonProps> = memo(({ count = 1 }) => {
  return (
    <div className="space-y-5">
      {Array.from({ length: count }).map((_, index) => {
        // Alternate: even = text-only, odd = with image placeholder
        const showImage = index % 2 !== 0;

        return (
          <div
            key={index}
            className="bg-white dark:bg-dark-bg-secondary rounded-2xl border border-gray-200 dark:border-dark-border shadow-sm overflow-hidden animate-pulse"
          >
            <div className="p-5">
              {/* ── Header: avatar + name/headline/time ── */}
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 bg-gray-200 dark:bg-dark-bg-tertiary rounded-full flex-shrink-0" />
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="h-4 bg-gray-200 dark:bg-dark-bg-tertiary rounded-md w-28" />
                    <div className="h-4 bg-gray-100 dark:bg-dark-bg-tertiary/60 rounded-full w-16" />
                  </div>
                  <div className="h-3 bg-gray-100 dark:bg-dark-bg-tertiary/60 rounded-md w-44" />
                  <div className="h-3 bg-gray-100 dark:bg-dark-bg-tertiary/60 rounded-md w-24" />
                </div>
                {/* Options placeholder */}
                <div className="w-8 h-8 bg-gray-100 dark:bg-dark-bg-tertiary/40 rounded-full flex-shrink-0" />
              </div>

              {/* ── Content text lines ── */}
              <div className="space-y-2.5 mb-4">
                <div className="h-[15px] bg-gray-200 dark:bg-dark-bg-tertiary rounded-md w-full" />
                <div className="h-[15px] bg-gray-200 dark:bg-dark-bg-tertiary rounded-md w-11/12" />
                <div className="h-[15px] bg-gray-200 dark:bg-dark-bg-tertiary rounded-md w-4/5" />
                {!showImage && (
                  <>
                    <div className="h-[15px] bg-gray-100 dark:bg-dark-bg-tertiary/60 rounded-md w-3/4" />
                    <div className="h-[15px] bg-gray-100 dark:bg-dark-bg-tertiary/60 rounded-md w-1/2" />
                  </>
                )}
              </div>

              {/* ── Image placeholder (alternating) ── */}
              {showImage && (
                <div className="mb-4 -mx-5 sm:mx-0 sm:rounded-xl overflow-hidden">
                  <div className="w-full h-56 sm:h-72 bg-gray-200 dark:bg-dark-bg-tertiary" />
                </div>
              )}

              {/* ── Stats row ── */}
              <div className="flex items-center justify-between py-2.5 border-b border-gray-100 dark:border-dark-border/50 mb-1">
                <div className="flex items-center gap-1.5">
                  <div className="flex -space-x-1">
                    <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-dark-bg-tertiary ring-2 ring-white dark:ring-dark-bg-secondary" />
                    <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-dark-bg-tertiary ring-2 ring-white dark:ring-dark-bg-secondary" />
                  </div>
                  <div className="h-3 bg-gray-200 dark:bg-dark-bg-tertiary rounded w-6" />
                </div>
                <div className="flex gap-3">
                  <div className="h-3 bg-gray-100 dark:bg-dark-bg-tertiary/60 rounded w-20" />
                  <div className="h-3 bg-gray-100 dark:bg-dark-bg-tertiary/60 rounded w-14" />
                </div>
              </div>

              {/* ── Action buttons (4 columns like the real post) ── */}
              <div className="flex items-center pt-1 -mx-1">
                {[1, 2, 3, 4].map((btn) => (
                  <div key={btn} className="flex-1 mx-0.5">
                    <div className="h-10 bg-gray-100 dark:bg-dark-bg-tertiary/50 rounded-xl" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
});

FeedSkeleton.displayName = 'FeedSkeleton';
export default FeedSkeleton;
