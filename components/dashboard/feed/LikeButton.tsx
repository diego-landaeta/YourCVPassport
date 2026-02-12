import React, { memo } from 'react';
import { HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';

interface LikeButtonProps {
  hasLiked: boolean;
  onClick: () => void;
  isLoading: boolean;
  label: string;
}

const LikeButton: React.FC<LikeButtonProps> = memo(({
  hasLiked,
  onClick,
  isLoading,
  label
}) => {
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg transition-all ${
        hasLiked
          ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary'
      } disabled:opacity-50`}
    >
      {isLoading ? (
        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : hasLiked ? (
        <HeartSolidIcon className="w-5 h-5 animate-[pulse_0.3s_ease-in-out]" />
      ) : (
        <HeartIcon className="w-5 h-5" />
      )}
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
});

LikeButton.displayName = 'LikeButton';
export default LikeButton;
