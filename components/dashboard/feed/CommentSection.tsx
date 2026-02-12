import React, { useState } from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useFeedComments } from '../../../hooks/useFeedComments';
import CommentItem from './CommentItem';

interface CommentSectionProps {
  postId: string;
  currentUserId?: string;
  onCommentAdded?: () => void;
}

const CommentSection: React.FC<CommentSectionProps> = ({
  postId,
  currentUserId,
  onCommentAdded
}) => {
  const { lang } = useLanguage();
  const [newComment, setNewComment] = useState('');
  const {
    comments,
    loading,
    error,
    addComment,
    deleteComment,
    toggleCommentLike,
    isAdding
  } = useFeedComments(postId);

  const t = {
    en: {
      placeholder: 'Write a comment...',
      post: 'Post',
      posting: 'Posting...',
      noComments: 'Be the first to comment',
      loadingComments: 'Loading comments...'
    },
    es: {
      placeholder: 'Escribe un comentario...',
      post: 'Publicar',
      posting: 'Publicando...',
      noComments: 'Se el primero en comentar',
      loadingComments: 'Cargando comentarios...'
    }
  };

  const translations = t[lang];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isAdding) return;

    const result = await addComment(newComment.trim());
    if (result) {
      setNewComment('');
      onCommentAdded?.();
    }
  };

  const handleReply = async (content: string, parentId: string) => {
    await addComment(content, parentId);
  };

  return (
    <div className="border-t border-gray-100 dark:border-dark-border">
      {/* Comment input */}
      <form onSubmit={handleSubmit} className="p-4 flex gap-3">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder={translations.placeholder}
          className="flex-1 px-4 py-2 bg-gray-50 dark:bg-dark-bg-tertiary border border-gray-200 dark:border-dark-border rounded-full text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-cv-blue focus:border-transparent transition-all"
          maxLength={500}
        />
        <button
          type="submit"
          disabled={!newComment.trim() || isAdding}
          className="px-4 py-2 bg-cv-blue text-white text-sm font-medium rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isAdding ? translations.posting : translations.post}
        </button>
      </form>

      {/* Comments list */}
      <div className="px-4 pb-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-4">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
              <div className="w-5 h-5 border-2 border-cv-blue border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">{translations.loadingComments}</span>
            </div>
          </div>
        ) : comments.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 py-4 text-sm">
            {translations.noComments}
          </p>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUserId={currentUserId}
              onReply={(content) => handleReply(content, comment.id)}
              onDelete={() => deleteComment(comment.id)}
              onLike={() => toggleCommentLike(comment.id, comment.hasLiked || false)}
            />
          ))
        )}
      </div>

      {error && (
        <div className="px-4 pb-4">
          <p className="text-red-500 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
};

export default CommentSection;
