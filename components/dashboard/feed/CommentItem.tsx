import React, { useState, memo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useLanguage } from '../../../contexts/LanguageContext';
import { HeartIcon, TrashIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import type { FeedComment } from '../../../types/feed';

interface CommentItemProps {
  comment: FeedComment;
  currentUserId?: string;
  onReply: (content: string) => void;
  onDelete: () => void;
  onLike: () => void;
  isReply?: boolean;
}

const CommentItem: React.FC<CommentItemProps> = memo(({
  comment,
  currentUserId,
  onReply,
  onDelete,
  onLike,
  isReply = false
}) => {
  const { lang } = useLanguage();
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [showReplies, setShowReplies] = useState(false);

  const isOwner = currentUserId === comment.author_id;

  const timeAgo = formatDistanceToNow(new Date(comment.created_at), {
    addSuffix: true,
    locale: lang === 'es' ? es : undefined
  });

  const t = {
    en: {
      reply: 'Reply',
      replies: 'replies',
      showReplies: 'Show replies',
      hideReplies: 'Hide replies',
      edited: 'edited'
    },
    es: {
      reply: 'Responder',
      replies: 'respuestas',
      showReplies: 'Ver respuestas',
      hideReplies: 'Ocultar respuestas',
      edited: 'editado'
    }
  };

  const translations = t[lang];

  const handleReplySubmit = () => {
    if (!replyContent.trim()) return;
    onReply(replyContent.trim());
    setReplyContent('');
    setShowReplyInput(false);
  };

  const avatarUrl = comment.author?.avatar_url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.author?.full_name || 'U')}&background=3B82F6&color=fff&size=32`;

  return (
    <div className={`${isReply ? 'ml-10' : ''}`}>
      <div className="flex gap-2">
        <img
          src={avatarUrl}
          alt={comment.author?.full_name || 'User'}
          className={`rounded-full object-cover flex-shrink-0 ${isReply ? 'w-8 h-8' : 'w-9 h-9'}`}
        />
        <div className="flex-1 min-w-0">
          {/* Comment bubble */}
          <div className="bg-gray-100 dark:bg-dark-bg-tertiary rounded-2xl px-3 py-2">
            <p className="font-semibold text-sm text-gray-900 dark:text-white">
              {comment.author?.full_name || 'Usuario'}
            </p>
            <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words">
              {comment.content}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 mt-1 px-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {timeAgo}
              {comment.is_edited && ` • ${translations.edited}`}
            </span>

            <button
              onClick={onLike}
              className={`text-xs font-medium transition-colors ${
                comment.hasLiked
                  ? 'text-red-500'
                  : 'text-gray-500 dark:text-gray-400 hover:text-red-500'
              }`}
            >
              {comment.hasLiked ? (
                <span className="flex items-center gap-1">
                  <HeartSolidIcon className="w-3 h-3" />
                  {comment.likes_count > 0 && comment.likes_count}
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <HeartIcon className="w-3 h-3" />
                  {comment.likes_count > 0 && comment.likes_count}
                </span>
              )}
            </button>

            {!isReply && (
              <button
                onClick={() => setShowReplyInput(!showReplyInput)}
                className="text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-cv-blue transition-colors"
              >
                {translations.reply}
              </button>
            )}

            {isOwner && (
              <button
                onClick={onDelete}
                className="text-xs text-gray-400 hover:text-red-500 transition-colors"
              >
                <TrashIcon className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Reply input */}
          {showReplyInput && (
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder={`${translations.reply}...`}
                className="flex-1 px-3 py-1.5 bg-gray-50 dark:bg-dark-bg-secondary border border-gray-200 dark:border-dark-border rounded-full text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:ring-1 focus:ring-cv-blue focus:border-transparent"
                maxLength={300}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleReplySubmit();
                  }
                }}
              />
              <button
                onClick={handleReplySubmit}
                disabled={!replyContent.trim()}
                className="px-3 py-1.5 bg-cv-blue text-white text-xs font-medium rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {translations.reply}
              </button>
            </div>
          )}

          {/* Show/hide replies */}
          {comment.replies && comment.replies.length > 0 && (
            <button
              onClick={() => setShowReplies(!showReplies)}
              className="mt-2 text-xs font-medium text-cv-blue hover:underline"
            >
              {showReplies
                ? translations.hideReplies
                : `${translations.showReplies} (${comment.replies.length})`
              }
            </button>
          )}

          {/* Replies */}
          {showReplies && comment.replies && (
            <div className="mt-2 space-y-2">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  currentUserId={currentUserId}
                  onReply={() => {}}
                  onDelete={() => {}}
                  onLike={() => {}}
                  isReply
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

CommentItem.displayName = 'CommentItem';
export default CommentItem;
