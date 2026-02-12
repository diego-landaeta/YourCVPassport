import React, { useState, memo } from 'react';
import { ShareIcon, LinkIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useFeedActions } from '../../../hooks/useFeedActions';

interface ShareButtonProps {
  postId: string;
  postContent: string;
  label: string;
}

const ShareButton: React.FC<ShareButtonProps> = memo(({
  postId,
  postContent,
  label
}) => {
  const { lang } = useLanguage();
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const { sharePost, isSharing } = useFeedActions();

  const t = {
    en: {
      repost: 'Repost',
      copyLink: 'Copy link',
      copied: 'Copied!'
    },
    es: {
      repost: 'Repostear',
      copyLink: 'Copiar enlace',
      copied: '¡Copiado!'
    }
  };

  const translations = t[lang];

  const handleRepost = async () => {
    await sharePost(postId, 'REPOST');
    setShowMenu(false);
  };

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/feed/post/${postId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setShowMenu(false);
      }, 1500);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="relative flex-1">
      <button
        onClick={() => setShowMenu(!showMenu)}
        disabled={isSharing}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary rounded-lg transition-colors disabled:opacity-50"
      >
        {isSharing ? (
          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          <ShareIcon className="w-5 h-5" />
        )}
        <span className="text-sm font-medium">{label}</span>
      </button>

      {/* Dropdown menu */}
      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-white dark:bg-dark-bg-secondary rounded-lg shadow-lg border border-gray-200 dark:border-dark-border py-1 z-20">
            <button
              onClick={handleRepost}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary transition-colors"
            >
              <ShareIcon className="w-4 h-4" />
              {translations.repost}
            </button>
            <button
              onClick={handleCopyLink}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary transition-colors"
            >
              {copied ? (
                <>
                  <CheckIcon className="w-4 h-4 text-green-500" />
                  <span className="text-green-500">{translations.copied}</span>
                </>
              ) : (
                <>
                  <LinkIcon className="w-4 h-4" />
                  {translations.copyLink}
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
});

ShareButton.displayName = 'ShareButton';
export default ShareButton;
