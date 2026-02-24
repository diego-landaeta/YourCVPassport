import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '../../supabase/client';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNotifications } from '../../hooks/useNotifications';
import FeedPost from '../dashboard/feed/FeedPost';
import LoadingSpinner from '../shared/LoadingSpinner';
import type { FeedPost as FeedPostType } from '../../types/feed';
import {
  ArrowLeftIcon,
  ChatBubbleLeftRightIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

/* ── Supabase select for a single post (same shape as the feed) ── */
const POST_SELECT = `
  *,
  author:profiles!author_id (
    id, full_name, headline, avatar_url, slug
  )
`;

const PostViewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { session } = useAuth();
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const isEs = lang === 'es';

  const [post, setPost] = useState<FeedPostType | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const { sendNotification } = useNotifications();

  useEffect(() => {
    if (!id) { setNotFound(true); setLoading(false); return; }

    const fetchPost = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('feed_posts')
          .select(POST_SELECT)
          .eq('id', id)
          .eq('is_hidden', false)
          .maybeSingle();

        if (error || !data) {
          setNotFound(true);
        } else {
          setPost(data as FeedPostType);
        }
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id]);

  const communityPath = isEs ? '/comunidad' : '/feed';
  const loginPath = '/login';

  /* ── SEO ── */
  const seoTitle = post
    ? `${post.author?.full_name || 'YourCVPassport'} — ${post.content.slice(0, 60)}${post.content.length > 60 ? '...' : ''}`
    : 'YourCVPassport';

  const seoDescription = post
    ? post.content.slice(0, 160)
    : isEs
      ? 'Publicación de la comunidad YourCVPassport.'
      : 'YourCVPassport community post.';

  return (
    <>
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        {/* Don't index individual post pages — UGC content */}
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="min-h-screen bg-gray-50 dark:bg-dark-bg-primary">
        {/* ── Top bar ── */}
        <div className="sticky top-0 z-30 bg-white dark:bg-dark-bg-secondary border-b border-gray-200 dark:border-dark-border shadow-sm">
          <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary transition-colors text-gray-500 dark:text-gray-400"
              aria-label={isEs ? 'Volver' : 'Back'}
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </button>
            <span className="font-bold text-gray-900 dark:text-white text-base">
              {isEs ? 'Publicación' : 'Post'}
            </span>

            {/* Right: go to community */}
            <Link
              to={communityPath}
              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cv-blue text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              <ChatBubbleLeftRightIcon className="w-4 h-4" />
              {isEs ? 'Comunidad' : 'Community'}
            </Link>
          </div>
        </div>

        {/* ── Content ── */}
        <div className="max-w-2xl mx-auto px-4 py-6">
          {loading ? (
            <div className="flex justify-center py-16">
              <LoadingSpinner />
            </div>
          ) : notFound ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">🔍</div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {isEs ? 'Publicación no encontrada' : 'Post not found'}
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                {isEs
                  ? 'Esta publicación puede haber sido eliminada o no existe.'
                  : 'This post may have been deleted or does not exist.'}
              </p>
              <Link
                to={communityPath}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cv-blue text-white font-semibold text-sm hover:bg-blue-700 transition-colors"
              >
                {isEs ? 'Ver comunidad' : 'Browse community'}
                <ArrowRightIcon className="w-4 h-4" />
              </Link>
            </div>
          ) : post ? (
            <>
              <FeedPost
                post={post}
                currentUserId={session?.user.id}
                onPostUpdated={() => {}}
                onNotify={(targetUserId, type, postId, commentId) =>
                  sendNotification(targetUserId, type, postId, commentId)
                }
                onAuthRequired={() => navigate(loginPath)}
              />

              {/* CTA for anonymous users */}
              {!session && (
                <div className="mt-4 bg-white dark:bg-dark-bg-secondary rounded-2xl border border-gray-200 dark:border-dark-border p-6 text-center shadow-sm">
                  <ChatBubbleLeftRightIcon className="w-10 h-10 text-cv-blue mx-auto mb-3" />
                  <h3 className="font-bold text-gray-900 dark:text-white text-base mb-1">
                    {isEs ? '¿Quieres unirte a la conversación?' : 'Want to join the conversation?'}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    {isEs
                      ? 'Crea tu cuenta gratis y conecta con profesionales.'
                      : 'Create your free account and connect with professionals.'}
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Link
                      to="/signup"
                      className="px-5 py-2 rounded-xl bg-cv-blue text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
                    >
                      {isEs ? 'Registrarse' : 'Sign up'}
                    </Link>
                    <Link
                      to="/login"
                      className="px-5 py-2 rounded-xl border border-gray-200 dark:border-dark-border text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary transition-colors"
                    >
                      {isEs ? 'Iniciar sesión' : 'Log in'}
                    </Link>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </>
  );
};

export default PostViewPage;
