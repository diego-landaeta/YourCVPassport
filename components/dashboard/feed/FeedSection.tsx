import React, { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useTranslations } from '../../../hooks/useTranslations';
import { useFeed } from '../../../hooks/useFeed';
import CreatePostForm from './CreatePostForm';
import FeedPost from './FeedPost';
import FeedSkeleton from './FeedSkeleton';
import EmptyFeed from './EmptyFeed';

const FeedSection: React.FC = () => {
  const { profile, session } = useAuth();
  const { lang } = useLanguage();
  const t = useTranslations();
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const {
    posts,
    loading,
    error,
    hasMore,
    loadMore,
    createPost,
    refreshFeed,
    isCreating
  } = useFeed();

  // Infinite scroll
  useEffect(() => {
    if (loading) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [loading, hasMore, loadMore]);

  const handlePostCreated = useCallback(async (content: string, images: string[]) => {
    await createPost({
      content,
      imageUrls: images,
      contentType: images.length > 0 ? 'IMAGE' : 'TEXT'
    });
  }, [createPost]);

  const handlePostUpdated = useCallback(() => {
    refreshFeed();
  }, [refreshFeed]);

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-8">
      {/* Header */}
      <div className="bg-white dark:bg-dark-bg-secondary rounded-xl shadow-sm p-6 border border-gray-100 dark:border-dark-border">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t.feed.title}
          </h2>
          <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs font-medium rounded-full">
            {t.feed.beta}
          </span>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {t.feed.subtitle}
        </p>
      </div>

      {/* Create Post Form */}
      <CreatePostForm
        profile={profile}
        onSubmit={handlePostCreated}
        isSubmitting={isCreating}
      />

      {/* Posts List */}
      <div className="space-y-4">
        {loading && posts.length === 0 ? (
          <FeedSkeleton count={3} />
        ) : posts.length === 0 ? (
          <EmptyFeed />
        ) : (
          <>
            {posts.map((post) => (
              <FeedPost
                key={post.id}
                post={post}
                currentUserId={session?.user.id}
                onPostUpdated={handlePostUpdated}
              />
            ))}

            {/* Load more trigger */}
            <div ref={loadMoreRef} className="h-10 flex items-center justify-center">
              {loading && <FeedSkeleton count={1} />}
              {!hasMore && posts.length > 0 && (
                <p className="text-gray-400 dark:text-gray-500 text-sm">
                  {t.feed.noMore}
                </p>
              )}
            </div>
          </>
        )}
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-700 dark:text-red-400">{error}</p>
          <button
            onClick={refreshFeed}
            className="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline"
          >
            {t.feed.errors.retry}
          </button>
        </div>
      )}
    </div>
  );
};

export default FeedSection;
