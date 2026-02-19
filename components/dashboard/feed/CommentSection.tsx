import React, { useState, useRef } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useTranslations } from '../../../hooks/useTranslations';
import { useFeedComments } from '../../../hooks/useFeedComments';
import CommentItem from './CommentItem';
import EmojiPicker from './EmojiPicker';
import GifPicker from './GifPicker';
import { PaperAirplaneIcon } from '@heroicons/react/24/solid';
import { FaceSmileIcon, GifIcon } from '@heroicons/react/24/outline';

interface CommentSectionProps {
  postId: string;
  currentUserId?: string;
  onCommentAdded?: () => void;
}

const CommentSection: React.FC<CommentSectionProps> = ({
  postId,
  currentUserId,
  onCommentAdded,
}) => {
  const { profile } = useAuth();
  const t = useTranslations();
  const tc = t.feed.comments;

  const [newComment, setNewComment] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const hasGifApi = !!import.meta.env.VITE_TENOR_API_KEY;

  const {
    comments,
    loading,
    error,
    addComment,
    deleteComment,
    editComment,
    toggleCommentLike,
    isAdding,
  } = useFeedComments(postId);

  /* ── Handlers ── */
  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newComment.trim() || isAdding) return;
    const result = await addComment(newComment.trim());
    if (result) {
      setNewComment('');
      onCommentAdded?.();
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setNewComment(prev => prev + emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  const handleGifSelect = async (gifUrl: string) => {
    setShowGifPicker(false);
    if (isAdding) return;
    const result = await addComment(`GIF:${gifUrl}`);
    if (result) {
      onCommentAdded?.();
    }
  };

  // Called by CommentItem — parentId is always the top-level thread root
  const handleReply = async (content: string, parentId: string) => {
    await addComment(content, parentId);
    onCommentAdded?.();
  };

  const handleLike = (commentId: string, currentlyLiked: boolean) => {
    toggleCommentLike(commentId, currentlyLiked);
  };

  const handleDelete = (commentId: string) => {
    deleteComment(commentId);
  };

  const handleEdit = (commentId: string, newContent: string) => {
    editComment(commentId, newContent);
  };

  /* ── Avatar ── */
  const avatarUrl =
    profile?.avatar_url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      profile?.full_name || 'U'
    )}&background=3B82F6&color=fff&size=40`;

  const charCount = newComment.length;
  const charLimit = 500;
  const nearLimit = charCount > charLimit * 0.8;

  return (
    <div className="border-t border-gray-100 dark:border-dark-border">

      {/* ── Comment input ── */}
      <form
        onSubmit={handleSubmit}
        className="px-4 py-3 flex gap-2.5 items-start bg-gray-50/60 dark:bg-dark-bg-tertiary/30 relative"
      >
        {/* Current user avatar */}
        <img
          src={avatarUrl}
          alt={profile?.full_name || 'User'}
          className="hidden sm:block w-8 h-8 rounded-full object-cover ring-2 ring-white dark:ring-dark-bg-secondary flex-shrink-0 mt-0.5"
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 bg-white dark:bg-dark-bg-secondary border border-gray-200 dark:border-dark-border rounded-2xl rounded-tl-sm shadow-sm px-3.5 py-2 focus-within:border-cv-blue focus-within:ring-2 focus-within:ring-cv-blue/20 transition-all">
            <button
              type="button"
              onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowGifPicker(false); }}
              className={`flex-shrink-0 transition-colors ${
                showEmojiPicker
                  ? 'text-amber-400'
                  : 'text-gray-300 dark:text-gray-600 hover:text-amber-400'
              }`}
              title="Emoji"
            >
              <FaceSmileIcon className="w-4 h-4" />
            </button>

            {hasGifApi && (
              <button
                type="button"
                onClick={() => { setShowGifPicker(!showGifPicker); setShowEmojiPicker(false); }}
                className={`flex-shrink-0 transition-colors ${
                  showGifPicker
                    ? 'text-cv-blue'
                    : 'text-gray-300 dark:text-gray-600 hover:text-purple-400'
                }`}
                title="GIF"
              >
                <GifIcon className="w-4 h-4" />
              </button>
            )}

            <input
              ref={inputRef}
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={tc.placeholder}
              maxLength={charLimit}
              className="flex-1 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 bg-transparent focus:outline-none min-w-0"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (newComment.trim() && !isAdding) handleSubmit();
                }
              }}
            />

            {/* Character counter */}
            {charCount > 0 && (
              <span className={`text-[10px] flex-shrink-0 tabular-nums ${
                nearLimit
                  ? charCount >= charLimit ? 'text-red-500 font-bold' : 'text-amber-500'
                  : 'text-gray-300 dark:text-gray-600'
              }`}>
                {charLimit - charCount}
              </span>
            )}
          </div>

          {/* Hint row */}
          <p className="text-[10px] text-gray-300 dark:text-gray-600 mt-1 pl-1 select-none">
            {tc.inputHint}
          </p>

          {/* Emoji Picker */}
          {showEmojiPicker && (
            <EmojiPicker
              onSelect={handleEmojiSelect}
              onClose={() => setShowEmojiPicker(false)}
            />
          )}

          {/* GIF Picker */}
          {showGifPicker && (
            <GifPicker
              onSelect={handleGifSelect}
              onClose={() => setShowGifPicker(false)}
            />
          )}
        </div>

        {/* Send button */}
        <button
          type="submit"
          disabled={!newComment.trim() || isAdding}
          className="flex-shrink-0 mt-0.5 w-8 h-8 flex items-center justify-center bg-cv-blue text-white rounded-full hover:bg-blue-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95 shadow-sm"
          title={tc.post}
        >
          {isAdding ? (
            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <PaperAirplaneIcon className="w-3.5 h-3.5" />
          )}
        </button>
      </form>

      {/* ── Comments list ── */}
      <div className="px-4 pb-4 pt-3 space-y-4">
        {loading ? (
          /* Loading skeletons */
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="flex gap-2.5 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-dark-bg-tertiary flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="bg-gray-100 dark:bg-dark-bg-tertiary rounded-2xl rounded-tl-sm px-4 py-3">
                    <div className="h-2.5 w-24 bg-gray-200 dark:bg-dark-border rounded mb-2" />
                    <div className="h-2 w-48 bg-gray-200 dark:bg-dark-border rounded" />
                    {i === 1 && <div className="h-2 w-36 bg-gray-200 dark:bg-dark-border rounded mt-1.5" />}
                  </div>
                  <div className="h-2 w-20 bg-gray-100 dark:bg-dark-bg-tertiary rounded ml-2" />
                </div>
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          /* Empty state */
          <div className="text-center py-6">
            <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-dark-bg-tertiary flex items-center justify-center mx-auto mb-2">
              <svg className="w-5 h-5 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-sm text-gray-400 dark:text-gray-500">{tc.noComments}</p>
            <button
              onClick={() => inputRef.current?.focus()}
              className="mt-2 text-xs font-medium text-cv-blue hover:underline"
            >
              {tc.writeComment}
            </button>
          </div>
        ) : (
          /* Comments */
          <div className="space-y-4">
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                currentUserId={currentUserId}
                onReply={handleReply}
                onDelete={handleDelete}
                onLike={handleLike}
                onEdit={handleEdit}
              />
            ))}
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 pb-3">
          <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/10 rounded-lg px-3 py-2">
            {error}
          </p>
        </div>
      )}
    </div>
  );
};

export default CommentSection;
