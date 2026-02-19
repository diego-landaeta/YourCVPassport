import React, { useState, useRef, memo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useTranslations } from '../../../hooks/useTranslations';
import {
  HeartIcon,
  TrashIcon,
  ChatBubbleOvalLeftIcon,
  PencilSquareIcon,
  XMarkIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import type { FeedComment } from '../../../types/feed';

interface CommentItemProps {
  comment: FeedComment;
  currentUserId?: string;
  /** parentId = thread-root comment id (all replies share same thread) */
  onReply: (content: string, parentId: string) => void;
  onDelete: (commentId: string) => void;
  onLike: (commentId: string, currentlyLiked: boolean) => void;
  onEdit?: (commentId: string, newContent: string) => void;
  isReply?: boolean;
  /** Passed down so replies-of-replies go to the correct thread */
  threadRootId?: string;
  hasRepliesBelow?: boolean;
}

const CommentItem: React.FC<CommentItemProps> = memo(({
  comment,
  currentUserId,
  onReply,
  onDelete,
  onLike,
  onEdit,
  isReply = false,
  threadRootId,
  hasRepliesBelow = false,
}) => {
  const { lang } = useLanguage();
  const t = useTranslations();
  const tc = t.feed.comments;

  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [showReplies, setShowReplies] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);

  const replyInputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLTextAreaElement>(null);

  const isOwner = currentUserId === comment.author_id;

  const timeAgo = formatDistanceToNow(new Date(comment.created_at), {
    addSuffix: true,
    locale: lang === 'es' ? es : undefined,
  });

  const avatarUrl =
    comment.author?.avatar_url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      comment.author?.full_name || 'U'
    )}&background=3B82F6&color=fff&size=40`;

  const firstName = comment.author?.full_name?.split(' ')[0] || '';

  // Thread root = if this is a reply, use threadRootId; if top-level, use own id
  const myThreadRoot = isReply ? (threadRootId ?? comment.id) : comment.id;

  const handleReplyClick = () => {
    const mention = isReply ? `@${firstName} ` : '';
    setReplyContent(mention);
    setShowReplyInput(true);
    setTimeout(() => {
      replyInputRef.current?.focus();
      replyInputRef.current?.setSelectionRange(mention.length, mention.length);
    }, 50);
  };

  const handleReplySubmit = () => {
    const trimmed = replyContent.trim();
    if (!trimmed) return;
    onReply(trimmed, myThreadRoot);
    setReplyContent('');
    setShowReplyInput(false);
  };

  const handleEditSubmit = () => {
    const trimmed = editContent.trim();
    if (!trimmed || trimmed === comment.content) { setIsEditing(false); return; }
    onEdit?.(comment.id, trimmed);
    setIsEditing(false);
  };

  const repliesCount = comment.replies?.length ?? 0;
  const showThreadLine = !isReply && repliesCount > 0 && showReplies;

  return (
    <div className={`flex gap-2.5 group/comment ${isReply ? 'pl-10 sm:pl-12' : ''}`}>

      {/* Avatar column */}
      <div className="flex flex-col items-center flex-shrink-0">
        <img
          src={avatarUrl}
          alt={comment.author?.full_name || 'User'}
          className={`rounded-full object-cover ring-2 ring-white dark:ring-dark-bg-secondary flex-shrink-0 ${
            isReply ? 'w-7 h-7' : 'w-8 h-8'
          }`}
        />
        {/* Vertical thread line connecting to replies */}
        {showThreadLine && (
          <div className="w-px flex-1 bg-gradient-to-b from-gray-200 via-gray-200 to-transparent dark:from-dark-border/50 dark:via-dark-border/30 dark:to-transparent mt-1.5 min-h-[8px]" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">

        {/* "Replying to @Name" chip — only for reply-to-reply */}
        {isReply && comment.content.startsWith('@') && (
          <div className="flex items-center gap-1 mb-1">
            <ChatBubbleOvalLeftIcon className="w-3 h-3 text-gray-400" />
            <span className="text-[10px] text-gray-400 dark:text-gray-500 italic truncate">
              {comment.content.split(' ')[0]}
            </span>
          </div>
        )}

        {/* Bubble */}
        {isEditing ? (
          <div className="bg-white dark:bg-dark-bg-secondary border border-cv-blue/40 rounded-2xl rounded-tl-sm shadow-sm px-3.5 py-2.5">
            <p className="font-semibold text-xs text-gray-900 dark:text-white mb-1.5">
              {comment.author?.full_name || 'Usuario'}
            </p>
            <textarea
              ref={editInputRef}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={2}
              maxLength={500}
              autoFocus
              className="w-full text-sm text-gray-800 dark:text-gray-200 bg-transparent resize-none focus:outline-none leading-relaxed"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEditSubmit(); }
                if (e.key === 'Escape') { setIsEditing(false); setEditContent(comment.content); }
              }}
            />
            <div className="flex items-center justify-end gap-2 mt-1.5">
              <button
                onClick={() => { setIsEditing(false); setEditContent(comment.content); }}
                className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="w-3.5 h-3.5" />
                {t.feed.post.cancel}
              </button>
              <button
                onClick={handleEditSubmit}
                disabled={!editContent.trim() || editContent.trim() === comment.content}
                className="flex items-center gap-1 text-[11px] font-medium text-white bg-cv-blue rounded-full px-2.5 py-1 hover:bg-blue-700 disabled:opacity-40 transition-colors"
              >
                <CheckIcon className="w-3 h-3" />
                {t.feed.post.save}
              </button>
            </div>
          </div>
        ) : (
          <div className={`
            bg-white dark:bg-dark-bg-secondary
            border border-gray-100 dark:border-dark-border/50
            rounded-2xl rounded-tl-sm
            shadow-sm
            px-3.5 py-2.5
            transition-colors
            group-hover/comment:border-gray-200 dark:group-hover/comment:border-dark-border
          `}>
            <p className="font-semibold text-xs text-gray-900 dark:text-white leading-tight">
              {comment.author?.full_name || 'Usuario'}
            </p>
            {comment.content.startsWith('GIF:') ? (
              <div className="mt-1.5 rounded-lg overflow-hidden max-w-[240px]">
                <img
                  src={comment.content.slice(4)}
                  alt="GIF"
                  className="w-full h-auto rounded-lg"
                  loading="lazy"
                />
              </div>
            ) : (
              <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap break-words leading-relaxed mt-0.5">
                {comment.content}
              </p>
            )}
          </div>
        )}

        {/* Actions row */}
        {!isEditing && (
          <div className="flex items-center gap-3 mt-1 px-1 flex-wrap">

            {/* Timestamp */}
            <span className="text-[11px] text-gray-400 dark:text-gray-500 select-none">
              {timeAgo}
              {comment.is_edited && (
                <span className="italic text-gray-300 dark:text-gray-600"> · {tc.edited}</span>
              )}
            </span>

            {/* Like */}
            <button
              onClick={() => onLike(comment.id, comment.hasLiked ?? false)}
              className={`flex items-center gap-1 text-[11px] font-semibold transition-all hover:scale-105 active:scale-95 ${
                comment.hasLiked
                  ? 'text-rose-500'
                  : 'text-gray-400 dark:text-gray-500 hover:text-rose-400'
              }`}
              title={comment.hasLiked ? (lang === 'es' ? 'Quitar me gusta' : 'Unlike') : (lang === 'es' ? 'Me gusta' : 'Like')}
            >
              {comment.hasLiked ? (
                <HeartSolidIcon className="w-3.5 h-3.5" />
              ) : (
                <HeartIcon className="w-3.5 h-3.5" />
              )}
              {comment.likes_count > 0 && (
                <span>{comment.likes_count}</span>
              )}
            </button>

            {/* Reply — always visible for any level */}
            <button
              onClick={handleReplyClick}
              className="flex items-center gap-1 text-[11px] font-semibold text-gray-400 dark:text-gray-500 hover:text-cv-blue dark:hover:text-cv-blue transition-colors"
            >
              <ChatBubbleOvalLeftIcon className="w-3.5 h-3.5" />
              {tc.reply}
            </button>

            {/* Owner actions */}
            {isOwner && (
              <>
                <button
                  onClick={() => { setIsEditing(true); setTimeout(() => editInputRef.current?.focus(), 50); }}
                  className="flex items-center gap-1 text-[11px] text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 transition-colors"
                  title={lang === 'es' ? 'Editar' : 'Edit'}
                >
                  <PencilSquareIcon className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onDelete(comment.id)}
                  className="flex items-center gap-1 text-[11px] text-gray-300 dark:text-gray-600 hover:text-red-400 transition-colors"
                  title={lang === 'es' ? 'Eliminar' : 'Delete'}
                >
                  <TrashIcon className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        )}

        {/* Inline reply input */}
        {showReplyInput && (
          <div className="mt-2.5 space-y-1.5">
            {isReply && (
              <p className="text-[11px] text-gray-400 dark:text-gray-500 pl-1">
                {tc.replyingTo}{' '}
                <span className="font-semibold text-cv-blue">@{firstName}</span>
              </p>
            )}
            <div className="flex gap-2 items-center">
              <input
                ref={replyInputRef}
                type="text"
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder={tc.replyPlaceholder}
                maxLength={300}
                className="flex-1 px-3 py-2 bg-gray-50 dark:bg-dark-bg-tertiary border border-gray-200 dark:border-dark-border rounded-full text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:ring-2 focus:ring-cv-blue/40 focus:border-cv-blue transition-all min-w-0"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReplySubmit(); }
                  if (e.key === 'Escape') { setShowReplyInput(false); setReplyContent(''); }
                }}
              />
              <button
                onClick={handleReplySubmit}
                disabled={!replyContent.trim()}
                className="px-3 py-2 bg-cv-blue text-white text-xs font-semibold rounded-full hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
              >
                {tc.post}
              </button>
              <button
                onClick={() => { setShowReplyInput(false); setReplyContent(''); }}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex-shrink-0"
              >
                <XMarkIcon className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[10px] text-gray-300 dark:text-gray-600 pl-1">
              {replyContent.length}/300 · {tc.enterToSend}
            </p>
          </div>
        )}

        {/* Show / hide replies toggle */}
        {!isReply && repliesCount > 0 && (
          <button
            onClick={() => setShowReplies(!showReplies)}
            className="mt-2 flex items-center gap-2 text-[11px] font-semibold text-cv-blue hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
          >
            <div className="w-5 h-px bg-gray-200 dark:bg-dark-border" />
            {showReplies
              ? tc.hideReplies
              : `${tc.showReplies} (${repliesCount})`}
          </button>
        )}

        {/* Nested replies */}
        {!isReply && showReplies && repliesCount > 0 && (
          <div className="mt-2 space-y-2.5">
            {comment.replies!.map((reply, idx) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                currentUserId={currentUserId}
                threadRootId={comment.id}
                onReply={onReply}
                onDelete={onDelete}
                onLike={onLike}
                onEdit={onEdit}
                isReply
                hasRepliesBelow={idx < repliesCount - 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

CommentItem.displayName = 'CommentItem';
export default CommentItem;
