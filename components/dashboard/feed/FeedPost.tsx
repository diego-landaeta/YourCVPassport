import React, { useState, memo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useFeedActions } from '../../../hooks/useFeedActions';
import LikeButton from './LikeButton';
import ShareButton from './ShareButton';
import CommentSection from './CommentSection';
import ImageGallery from './ImageGallery';
import PostOptionsMenu from './PostOptionsMenu';
import type { FeedPost as FeedPostType } from '../../../types/feed';

interface FeedPostProps {
  post: FeedPostType;
  currentUserId?: string;
  onPostUpdated: () => void;
}

const FeedPost: React.FC<FeedPostProps> = memo(({ post, currentUserId, onPostUpdated }) => {
  const { lang } = useLanguage();
  const [showComments, setShowComments] = useState(false);
  const [localPost, setLocalPost] = useState(post);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const { toggleLike, deletePost, editPost, isLiking, isDeleting, isEditing: isSavingEdit } = useFeedActions();

  const isOwner = currentUserId === post.author_id;
  const timeAgo = formatDistanceToNow(new Date(post.created_at), {
    addSuffix: true,
    locale: lang === 'es' ? es : undefined
  });

  const t = {
    en: {
      like: 'Like',
      comment: 'Comment',
      share: 'Share',
      edited: 'Edited',
      comments: 'comments',
      likes: 'likes',
      shares: 'shares',
      confirmDelete: 'Are you sure you want to delete this post?',
      save: 'Save',
      cancel: 'Cancel'
    },
    es: {
      like: 'Me gusta',
      comment: 'Comentar',
      share: 'Compartir',
      edited: 'Editado',
      comments: 'comentarios',
      likes: 'me gusta',
      shares: 'compartidos',
      confirmDelete: '¿Estas seguro de eliminar esta publicacion?',
      save: 'Guardar',
      cancel: 'Cancelar'
    }
  };

  const translations = t[lang];

  const handleLike = async () => {
    const result = await toggleLike(post.id, localPost.hasLiked || false);
    if (result.success) {
      setLocalPost(prev => ({
        ...prev,
        hasLiked: result.newLikedState,
        likes_count: result.newLikedState ? prev.likes_count + 1 : prev.likes_count - 1
      }));
    }
  };

  const handleDelete = async () => {
    if (window.confirm(translations.confirmDelete)) {
      const success = await deletePost(post.id);
      if (success) {
        onPostUpdated();
      }
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditContent(localPost.content);
  };

  const handleSaveEdit = async () => {
    if (editContent.trim() === localPost.content) {
      setIsEditing(false);
      return;
    }

    const success = await editPost(post.id, editContent.trim());
    if (success) {
      setLocalPost(prev => ({
        ...prev,
        content: editContent.trim(),
        is_edited: true
      }));
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(localPost.content);
  };

  const avatarUrl = post.author?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author?.full_name || 'U')}&background=3B82F6&color=fff`;

  // Achievement post styling
  const isAchievement = post.content_type === 'ACHIEVEMENT' || post.content_type === 'MILESTONE';

  return (
    <article className={`bg-white dark:bg-dark-bg-secondary rounded-xl shadow-sm border overflow-hidden ${
      isAchievement
        ? 'border-amber-200 dark:border-amber-800'
        : 'border-gray-100 dark:border-dark-border'
    }`}>
      {/* Achievement banner */}
      {isAchievement && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 px-4 py-2 border-b border-amber-200 dark:border-amber-800">
          <p className="text-amber-700 dark:text-amber-400 text-sm font-medium flex items-center gap-2">
            <span>🏆</span>
            {lang === 'es' ? 'Logro desbloqueado' : 'Achievement unlocked'}
          </p>
        </div>
      )}

      {/* Header */}
      <div className="p-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <img
            src={avatarUrl}
            alt={post.author?.full_name || 'User'}
            className="w-12 h-12 rounded-full object-cover"
          />
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white">
              {post.author?.full_name || 'Usuario'}
            </h4>
            {post.author?.headline && (
              <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                {post.author.headline}
              </p>
            )}
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              {timeAgo}
              {localPost.is_edited && ` • ${translations.edited}`}
            </p>
          </div>
        </div>

        {isOwner && (
          <PostOptionsMenu
            onEdit={handleEdit}
            onDelete={handleDelete}
            isDeleting={isDeleting}
          />
        )}
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-cv-blue focus:border-transparent"
              rows={4}
              maxLength={2000}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={handleCancelEdit}
                className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary rounded-lg transition-colors"
              >
                {translations.cancel}
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isSavingEdit || !editContent.trim()}
                className="px-3 py-1.5 text-sm bg-cv-blue text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isSavingEdit ? '...' : translations.save}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
            {localPost.content}
          </p>
        )}
      </div>

      {/* Images */}
      {post.image_urls && post.image_urls.length > 0 && (
        <ImageGallery images={post.image_urls} />
      )}

      {/* Stats */}
      {(localPost.likes_count > 0 || localPost.comments_count > 0 || localPost.shares_count > 0) && (
        <div className="px-4 py-2 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-dark-border">
          <span>
            {localPost.likes_count > 0 && `${localPost.likes_count} ${translations.likes}`}
          </span>
          <div className="flex gap-4">
            {localPost.comments_count > 0 && (
              <button
                onClick={() => setShowComments(!showComments)}
                className="hover:text-cv-blue transition-colors"
              >
                {localPost.comments_count} {translations.comments}
              </button>
            )}
            {localPost.shares_count > 0 && (
              <span>{localPost.shares_count} {translations.shares}</span>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="px-2 py-1 flex items-center justify-around border-t border-gray-100 dark:border-dark-border">
        <LikeButton
          hasLiked={localPost.hasLiked || false}
          onClick={handleLike}
          isLoading={isLiking}
          label={translations.like}
        />
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="text-sm font-medium">{translations.comment}</span>
        </button>
        <ShareButton
          postId={post.id}
          postContent={post.content}
          label={translations.share}
        />
      </div>

      {/* Comments Section */}
      {showComments && (
        <CommentSection
          postId={post.id}
          currentUserId={currentUserId}
          onCommentAdded={() => {
            setLocalPost(prev => ({
              ...prev,
              comments_count: prev.comments_count + 1
            }));
          }}
        />
      )}
    </article>
  );
});

FeedPost.displayName = 'FeedPost';
export default FeedPost;
