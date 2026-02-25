import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useTranslations } from '../../../hooks/useTranslations';
import { useFeedActions } from '../../../hooks/useFeedActions';
import {
  HandThumbUpIcon,
  ChatBubbleOvalLeftEllipsisIcon,
  ArrowPathRoundedSquareIcon,
  GlobeAltIcon,
  TrophyIcon,
  ShareIcon,
  BriefcaseIcon,
  UserCircleIcon,
  StarIcon,
  BookmarkIcon,
  MapPinIcon,
  ChartBarIcon,
  CalendarDaysIcon,
  LinkIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import {
  HandThumbUpIcon as HandThumbUpSolidIcon,
  HeartIcon as HeartSolidIcon,
  LightBulbIcon as LightBulbSolidIcon,
  HandRaisedIcon as HandRaisedSolidIcon,
  SparklesIcon as SparklesSolidIcon,
  CheckBadgeIcon,
  BookmarkIcon as BookmarkSolidIcon,
} from '@heroicons/react/24/solid';
import { supabase } from '../../../supabase/client';
import CommentSection from './CommentSection';
import ImageGallery from './ImageGallery';
import PostOptionsMenu from './PostOptionsMenu';
import ShareModal from './ShareModal';
import ConfirmModal from './ConfirmModal';
import type { FeedPost as FeedPostType, ReactionType, PollData, EventData } from '../../../types/feed';

/* ── Constants ── */
const TRUNCATE_LENGTH = 280;
const LONG_PRESS_MS = 500;

/* ── Reaction icon components (LinkedIn-style SVG icons) ── */
const ReactionIcons: Record<ReactionType, React.FC<{ className?: string }>> = {
  LIKE:        ({ className }) => <HandThumbUpSolidIcon className={className} />,
  CELEBRATE:   ({ className }) => <SparklesSolidIcon className={className} />,
  LOVE:        ({ className }) => <HeartSolidIcon className={className} />,
  INSIGHTFUL:  ({ className }) => <LightBulbSolidIcon className={className} />,
  SUPPORT:     ({ className }) => <HandRaisedSolidIcon className={className} />,
};

/* ── Reaction config ── */
interface ReactionConfig {
  type: ReactionType;
  color: string;
  bgActive: string;
  bgBubble: string;
  gradient: string;
}

const REACTIONS: ReactionConfig[] = [
  { type: 'LIKE',        color: 'text-cv-blue',    bgActive: 'bg-blue-50 dark:bg-blue-900/20',     bgBubble: 'bg-cv-blue',     gradient: 'from-blue-500 to-blue-600'    },
  { type: 'CELEBRATE',   color: 'text-green-600',  bgActive: 'bg-green-50 dark:bg-green-900/20',   bgBubble: 'bg-green-500',   gradient: 'from-green-500 to-emerald-600' },
  { type: 'LOVE',        color: 'text-red-500',    bgActive: 'bg-red-50 dark:bg-red-900/20',       bgBubble: 'bg-red-500',     gradient: 'from-red-500 to-rose-600'     },
  { type: 'INSIGHTFUL',  color: 'text-amber-500',  bgActive: 'bg-amber-50 dark:bg-amber-900/20',   bgBubble: 'bg-amber-500',   gradient: 'from-amber-400 to-amber-600'  },
  { type: 'SUPPORT',     color: 'text-purple-500', bgActive: 'bg-purple-50 dark:bg-purple-900/20', bgBubble: 'bg-purple-500',  gradient: 'from-purple-500 to-violet-600' },
];

const reactionMap = Object.fromEntries(REACTIONS.map(r => [r.type, r])) as Record<ReactionType, ReactionConfig>;

/* ── Flag emoji → image (Windows doesn't render country flags) ── */
const FLAG_RE = /[\u{1F1E6}-\u{1F1FF}]{2}/gu;
const flagToCode = (flag: string): string =>
  [...flag].map(cp => String.fromCharCode(cp.codePointAt(0)! - 0x1F1E6 + 65)).join('').toLowerCase();

const renderFlags = (text: string, keyPrefix: string): React.ReactNode[] => {
  const result: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  FLAG_RE.lastIndex = 0;
  while ((match = FLAG_RE.exec(text)) !== null) {
    if (match.index > lastIndex) result.push(text.slice(lastIndex, match.index));
    const code = flagToCode(match[0]);
    result.push(
      <img
        key={`${keyPrefix}-flag-${match.index}`}
        src={`https://flagcdn.com/w40/${code}.png`}
        alt={code.toUpperCase()}
        className="inline-block w-5 h-4 object-cover rounded-sm align-text-bottom mx-0.5"
      />
    );
    lastIndex = FLAG_RE.lastIndex;
  }
  if (lastIndex < text.length) result.push(text.slice(lastIndex));
  return result.length > 0 ? result : [text];
};

/* ── Linkify URLs + Hashtags in text ── */
const renderContent = (
  text: string,
  onHashtagClick?: (tag: string) => void
): React.ReactNode[] => {
  const parts = text.split(/(https?:\/\/[^\s<]+|#[a-zA-ZáéíóúñÁÉÍÓÚÑ0-9_]+|@[a-zA-Z0-9_-]+)/g);
  return parts.flatMap((part, i) => {
    if (/^https?:\/\//.test(part)) {
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-cv-blue hover:underline break-all"
        >
          {part}
        </a>
      );
    }
    if (/^#[a-zA-ZáéíóúñÁÉÍÓÚÑ0-9_]+$/.test(part)) {
      return (
        <button
          key={i}
          onClick={() => onHashtagClick?.(part)}
          className="text-cv-blue font-semibold hover:underline"
        >
          {part}
        </button>
      );
    }
    if (/^@[a-zA-Z0-9_-]+$/.test(part)) {
      const slug = part.slice(1);
      return (
        <a
          key={i}
          href={`/cv/${slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-cv-blue font-semibold hover:underline"
        >
          {part}
        </a>
      );
    }
    // For plain text segments, render flag emojis as images
    return renderFlags(part, String(i));
  });
};

/* ── Content-type badge config ── */
const CONTENT_BADGES: Record<string, { icon: React.ReactNode; label: { es: string; en: string }; colors: string }> = {
  JOB_UPDATE: {
    icon: <BriefcaseIcon className="w-3.5 h-3.5" />,
    label: { es: 'Actualización Laboral', en: 'Job Update' },
    colors: 'bg-indigo-50 dark:bg-indigo-900/15 text-indigo-700 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/30',
  },
  PROFILE_COMPLETE: {
    icon: <UserCircleIcon className="w-3.5 h-3.5" />,
    label: { es: 'Perfil Completado', en: 'Profile Completed' },
    colors: 'bg-emerald-50 dark:bg-emerald-900/15 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30',
  },
  ACHIEVEMENT: {
    icon: <TrophyIcon className="w-3.5 h-3.5" />,
    label: { es: 'Logro Profesional', en: 'Achievement' },
    colors: 'bg-amber-50 dark:bg-amber-900/15 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900/30',
  },
  MILESTONE: {
    icon: <StarIcon className="w-3.5 h-3.5" />,
    label: { es: 'Hito Profesional', en: 'Milestone' },
    colors: 'bg-purple-50 dark:bg-purple-900/15 text-purple-700 dark:text-purple-400 border-purple-100 dark:border-purple-900/30',
  },
  POLL: {
    icon: <ChartBarIcon className="w-3.5 h-3.5" />,
    label: { es: 'Encuesta', en: 'Poll' },
    colors: 'bg-teal-50 dark:bg-teal-900/15 text-teal-700 dark:text-teal-400 border-teal-100 dark:border-teal-900/30',
  },
  EVENT: {
    icon: <CalendarDaysIcon className="w-3.5 h-3.5" />,
    label: { es: 'Evento', en: 'Event' },
    colors: 'bg-rose-50 dark:bg-rose-900/15 text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-900/30',
  },
};

interface FeedPostProps {
  post: FeedPostType;
  currentUserId?: string;
  onPostUpdated: () => void;
  onHashtagClick?: (tag: string) => void;
  onPollVote?: (postId: string, optionIndex: number) => Promise<{ success: boolean }>;
  onNotify?: (targetUserId: string, type: 'reaction' | 'comment' | 'reply' | 'mention' | 'repost', postId?: string, commentId?: string) => void;
  onAuthRequired?: () => void;
  /** Navigate to in-app user profile instead of /cv/ external link */
  onAuthorClick?: (userId: string) => void;
  /** When true, disables reactions, comments and poll votes (channel read-only mode) */
  readOnly?: boolean;
}

const FeedPost: React.FC<FeedPostProps> = memo(({ post, currentUserId, onPostUpdated, onHashtagClick, onPollVote, onNotify, onAuthRequired, onAuthorClick, readOnly }) => {
  const { lang } = useLanguage();
  const t = useTranslations();
  const tp = t.feed.post;
  const [showComments, setShowComments] = useState(false);
  const [localPost, setLocalPost] = useState(post);
  const [isEditingPost, setIsEditingPost] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Read more state
  const [isExpanded, setIsExpanded] = useState(false);
  const needsTruncation = localPost.content.length > TRUNCATE_LENGTH;

  // Bookmark state (synced with DB)
  const [isBookmarked, setIsBookmarked] = useState(post.hasBookmarked || false);

  // Reactions picker state
  const [showReactions, setShowReactions] = useState(false);
  const reactionsTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);
  const reactionsRef = useRef<HTMLDivElement>(null);

  // Mobile long-press refs
  const longPressTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const longPressTriggered = useRef(false);

  // Track reaction types the user added optimistically (vs types from server)
  const originalTopReactions = useRef<ReactionType[]>(post.topReactions || []);
  const userAddedTypes = useRef<Set<ReactionType>>(new Set());

  // View tracking
  const articleRef = useRef<HTMLElement>(null);
  const viewTracked = useRef(false);

  // Translation state
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);

  const {
    toggleReaction,
    deletePost,
    editPost,
    toggleRepost,
    toggleBookmark,
    togglePin,
    reportPost,
    sharePost,
    isLiking,
    isDeleting,
    isEditing: isSavingEdit,
    isSharing,
  } = useFeedActions();

  const isOwner = currentUserId === post.author_id;
  const isAchievement = post.content_type === 'ACHIEVEMENT' || post.content_type === 'MILESTONE';
  const isEvent = post.content_type === 'EVENT';
  const badge = CONTENT_BADGES[post.content_type];

  const timeAgo = formatDistanceToNow(new Date(post.created_at), {
    addSuffix: true,
    locale: lang === 'es' ? es : undefined,
  });

  // Current active reaction config
  const activeReaction = localPost.userReaction ? reactionMap[localPost.userReaction] : null;

  // Bookmark loading state
  const [isBookmarkLoading, setIsBookmarkLoading] = useState(false);
  const [isPinLoading, setIsPinLoading] = useState(false);

  /* ── Handlers ── */

  const handleReaction = useCallback(async (reactionType: ReactionType) => {
    if (!currentUserId || readOnly) { onAuthRequired?.(); return; }
    setShowReactions(false);

    const snapshot = { ...localPost };
    const prevReaction = localPost.userReaction;
    const isSame = prevReaction === reactionType;
    const newReaction = isSame ? null : reactionType;

    // Build topReactions optimistically using tracked user additions.
    // If topReactions is empty but likes_count > 0, seed data uses LIKE as implicit type.
    const baseReactions = (localPost.topReactions?.length)
      ? localPost.topReactions
      : (localPost.likes_count > 0 ? ['LIKE' as ReactionType] : []);
    const effectiveOriginal = originalTopReactions.current.length > 0
      ? originalTopReactions.current
      : (localPost.likes_count > 0 ? ['LIKE' as ReactionType] : []);

    let newTopReactions = [...baseReactions];
    if (isSame) {
      // Removing — only remove if WE added this type (not from server/seed)
      if (localPost.likes_count <= 1) {
        newTopReactions = [];
      } else if (userAddedTypes.current.has(reactionType)) {
        newTopReactions = newTopReactions.filter(r => r !== reactionType);
      }
      userAddedTypes.current.delete(reactionType);
    } else {
      // Adding/switching — add new type if not already shown
      if (newReaction && !newTopReactions.includes(newReaction)) {
        newTopReactions.push(newReaction);
        if (!effectiveOriginal.includes(newReaction)) {
          userAddedTypes.current.add(newReaction);
        }
      }
      // If switching, remove old type only if WE added it
      if (prevReaction && userAddedTypes.current.has(prevReaction)) {
        newTopReactions = newTopReactions.filter(r => r !== prevReaction);
        userAddedTypes.current.delete(prevReaction);
      }
    }

    setLocalPost(prev => ({
      ...prev,
      hasLiked: !isSame,
      userReaction: newReaction,
      likes_count: isSame
        ? prev.likes_count - 1
        : (prevReaction ? prev.likes_count : prev.likes_count + 1),
      topReactions: newTopReactions,
    }));

    const result = await toggleReaction(post.id, reactionType, prevReaction || null);
    if (!result.success) {
      setLocalPost(snapshot);
    } else if (!prevReaction && post.author_id) {
      onNotify?.(post.author_id, 'reaction', post.id);
    }
  }, [post.id, post.author_id, localPost, toggleReaction, onNotify]);

  const handleQuickLike = useCallback(() => {
    // Toggle current reaction, or default to LIKE
    handleReaction(localPost.userReaction || 'LIKE');
  }, [handleReaction, localPost.userReaction]);

  // Mobile long-press handlers
  const handleTouchStart = useCallback(() => {
    longPressTriggered.current = false;
    longPressTimer.current = setTimeout(() => {
      longPressTriggered.current = true;
      setShowReactions(true);
    }, LONG_PRESS_MS);
  }, []);

  const handleTouchEnd = useCallback(() => {
    clearTimeout(longPressTimer.current);
    // If long-press didn't trigger, do quick like
    if (!longPressTriggered.current && !showReactions) {
      handleQuickLike();
    }
  }, [handleQuickLike, showReactions]);

  const handleTouchMove = useCallback(() => {
    // Cancel long-press if finger moves
    clearTimeout(longPressTimer.current);
  }, []);

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    const success = await deletePost(post.id);
    if (success) {
      setShowDeleteConfirm(false);
      onPostUpdated();
    }
  };

  const handleSaveEdit = async () => {
    if (editContent.trim() === localPost.content) { setIsEditingPost(false); return; }
    const success = await editPost(post.id, editContent.trim());
    if (success) {
      setLocalPost(prev => ({ ...prev, content: editContent.trim(), is_edited: true }));
      setIsEditingPost(false);
    }
  };

  const handleRepost = async () => {
    if (!currentUserId || readOnly) { onAuthRequired?.(); return; }
    if (isSharing) return;
    const result = await toggleRepost(post.id, localPost.hasReposted || false);
    if (result.success) {
      setLocalPost(prev => ({
        ...prev,
        hasReposted: result.newRepostedState,
        shares_count: result.newRepostedState
          ? prev.shares_count + 1
          : Math.max(0, prev.shares_count - 1),
      }));
      if (result.newRepostedState && post.author_id) {
        onNotify?.(post.author_id, 'repost', post.id);
      }
    }
  };

  /** Quote post or share to a group — called from the enhanced ShareModal */
  const handleSharePost = async (comment: string, groupId?: string): Promise<boolean> => {
    if (!currentUserId || readOnly) { onAuthRequired?.(); return false; }

    const snapshot = {
      content: post.content,
      author_name: post.author?.full_name || '',
      author_avatar: post.author?.avatar_url || null,
      author_slug: post.author?.slug || null,
      created_at: post.created_at,
    };

    const result = await sharePost(post.id, 'QUOTE', comment || undefined, snapshot);
    if (result.success) {
      setLocalPost(prev => ({ ...prev, shares_count: prev.shares_count + 1 }));
      if (post.author_id) onNotify?.(post.author_id, 'repost', post.id);
      // If sharing to a group, also create a post in that group
      if (groupId) {
        await supabase.from('feed_posts').insert({
          author_id: currentUserId,
          content: comment || post.content.slice(0, 200),
          content_type: 'TEXT',
          group_id: groupId,
          metadata: { shared_from: post.id, quoted_snapshot: snapshot },
        });
      }
    }
    return result.success;
  };

  const handleBookmark = async () => {
    if (!currentUserId) { onAuthRequired?.(); return; }
    setIsBookmarkLoading(true);
    // Optimistic
    const prev = isBookmarked;
    setIsBookmarked(!prev);
    const result = await toggleBookmark(post.id, prev);
    if (!result.success) setIsBookmarked(prev); // rollback
    setIsBookmarkLoading(false);
  };

  const handleTogglePin = async () => {
    setIsPinLoading(true);
    const currentlyPinned = localPost.is_pinned;
    // Optimistic
    setLocalPost(prev => ({ ...prev, is_pinned: !currentlyPinned }));
    const success = await togglePin(post.id, currentlyPinned);
    if (success) {
      onPostUpdated();
    } else {
      setLocalPost(prev => ({ ...prev, is_pinned: currentlyPinned })); // rollback
    }
    setIsPinLoading(false);
  };

  // Close reactions picker on outside click/touch
  useEffect(() => {
    if (!showReactions) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      if (reactionsRef.current && !reactionsRef.current.contains(e.target as Node)) {
        setShowReactions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [showReactions]);

  // View tracking: increment when post enters viewport
  useEffect(() => {
    if (viewTracked.current || !articleRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !viewTracked.current) {
          viewTracked.current = true;
          setLocalPost(prev => ({ ...prev, views_count: (prev.views_count || 0) + 1 }));
          supabase.rpc('increment_post_views', { post_ids: [post.id] }).then(() => {});
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(articleRef.current);
    return () => observer.disconnect();
  }, [post.id]);

  // Translation handler
  const handleTranslate = useCallback(async () => {
    if (translatedText) { setTranslatedText(null); return; }
    setIsTranslating(true);
    try {
      const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(post.content.slice(0, 500))}&langpair=${lang === 'es' ? 'en|es' : 'es|en'}`);
      const data = await res.json();
      if (data?.responseData?.translatedText) {
        setTranslatedText(data.responseData.translatedText);
      }
    } catch {
      setTranslatedText(lang === 'es' ? '(Error al traducir)' : '(Translation error)');
    } finally {
      setIsTranslating(false);
    }
  }, [post.content, lang, translatedText]);

  const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/p/${post.id}`;
  const shareText = `${post.author?.full_name || ''}: ${post.content.slice(0, 120)}${post.content.length > 120 ? '...' : ''}`;

  const avatarUrl =
    post.author?.avatar_url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author?.full_name || 'U')}&background=3B82F6&color=fff`;
  const profileLink = post.author?.slug ? `/cv/${post.author.slug}` : null;

  // Truncated content for "Read more"
  const displayContent = (!isExpanded && needsTruncation)
    ? localPost.content.slice(0, TRUNCATE_LENGTH)
    : localPost.content;

  // Reaction label helper
  const getReactionLabel = (type: ReactionType) =>
    tp.reactions[type.toLowerCase() as keyof typeof tp.reactions];

  return (
    <>
      <article
        ref={articleRef}
        className="bg-white dark:bg-dark-bg-secondary rounded-2xl border border-gray-200 dark:border-dark-border shadow-sm hover:shadow-md transition-shadow duration-300"
        aria-label={`${tp.postBy || 'Post by'} ${post.author?.full_name || 'User'}`}
      >

        {/* Pinned indicator */}
        {localPost.is_pinned && (
          <div className="px-5 py-2 border-b border-gray-100 dark:border-dark-border/50 flex items-center gap-1.5 rounded-t-2xl">
            <MapPinIcon className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
            <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
              {tp.pinned}
            </span>
          </div>
        )}

        {/* Achievement Banner */}
        {isAchievement && (
          <div className={`bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-dark-bg-secondary px-5 py-2.5 border-b border-amber-100 dark:border-amber-900/30 flex items-center gap-2 ${!localPost.is_pinned ? 'rounded-t-2xl' : ''}`}>
            <div className="bg-amber-100 dark:bg-amber-900/50 p-1.5 rounded-full">
              <TrophyIcon className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            </div>
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide">
              {tp.achievementBanner}
            </span>
          </div>
        )}

        <div className="p-4 sm:p-5">
          {/* ── Header ── */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex gap-3 min-w-0">
              {onAuthorClick && post.author?.id ? (
                <button onClick={() => onAuthorClick(post.author!.id)} className="flex-shrink-0 group">
                  <img
                    src={avatarUrl}
                    alt={post.author?.full_name || 'User'}
                    className="w-12 h-12 rounded-full object-cover bg-gray-100 dark:bg-dark-bg-tertiary ring-2 ring-transparent group-hover:ring-cv-blue/30 transition-all"
                  />
                </button>
              ) : profileLink ? (
                <a href={profileLink} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 group">
                  <img
                    src={avatarUrl}
                    alt={post.author?.full_name || 'User'}
                    className="w-12 h-12 rounded-full object-cover bg-gray-100 dark:bg-dark-bg-tertiary ring-2 ring-transparent group-hover:ring-cv-blue/30 transition-all"
                  />
                </a>
              ) : (
                <img src={avatarUrl} alt={post.author?.full_name || 'User'} className="w-12 h-12 rounded-full object-cover bg-gray-100 dark:bg-dark-bg-tertiary flex-shrink-0" />
              )}

              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {onAuthorClick && post.author?.id ? (
                    <button
                      onClick={() => onAuthorClick(post.author!.id)}
                      className="font-bold text-gray-900 dark:text-white hover:text-cv-blue transition-colors text-[15px] leading-tight text-left"
                    >
                      {post.author?.full_name || 'Usuario'}
                    </button>
                  ) : profileLink ? (
                    <a
                      href={profileLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-gray-900 dark:text-white hover:text-cv-blue transition-colors text-[15px] leading-tight"
                    >
                      {post.author?.full_name || 'Usuario'}
                    </a>
                  ) : (
                    <h4 className="font-bold text-gray-900 dark:text-white text-[15px] leading-tight">
                      {post.author?.full_name || 'Usuario'}
                    </h4>
                  )}

                  {post.author?.slug && (
                    <CheckBadgeIcon className="w-[18px] h-[18px] text-cv-blue flex-shrink-0" title={tp.verified} />
                  )}

                  {badge && !isAchievement && (
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${badge.colors}`}>
                      {badge.icon}
                      {badge.label[lang === 'es' ? 'es' : 'en']}
                    </span>
                  )}
                </div>

                {post.author?.headline && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[220px] mt-0.5">
                    {post.author.headline}
                  </p>
                )}

                <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                  <span className="text-[11px] text-gray-400 dark:text-gray-500">{timeAgo}</span>
                  {localPost.is_edited && (
                    <span className="text-[11px] text-gray-300 dark:text-gray-600 italic"> · {tp.edited}</span>
                  )}
                  <span className="text-[11px] text-gray-300 dark:text-gray-600">·</span>
                  <span className="text-[11px] text-gray-400 dark:text-gray-500 flex items-center gap-0.5">
                    <GlobeAltIcon className="w-3 h-3" />
                    {tp.public}
                  </span>
                  {post.group && (
                    <>
                      <span className="text-[11px] text-gray-300 dark:text-gray-600">·</span>
                      <span className="text-[11px] font-semibold text-cv-blue/80 dark:text-cv-blue/70 truncate max-w-[140px]">
                        {post.group.name}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Bookmark */}
              <button
                onClick={handleBookmark}
                disabled={isBookmarkLoading}
                className={`p-1.5 rounded-full transition-all active:scale-90 ${
                  isBookmarked
                    ? 'text-cv-blue'
                    : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary'
                } disabled:opacity-50`}
                aria-label={isBookmarked ? tp.unsave : tp.save}
              >
                {isBookmarkLoading ? (
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : isBookmarked ? (
                  <BookmarkSolidIcon className="w-5 h-5" />
                ) : (
                  <BookmarkIcon className="w-5 h-5" />
                )}
              </button>

              {currentUserId && (
                <PostOptionsMenu
                  isOwner={isOwner}
                  isPinned={localPost.is_pinned}
                  onEdit={() => { setIsEditingPost(true); setEditContent(localPost.content); }}
                  onDelete={handleDeleteClick}
                  onPin={isOwner ? handleTogglePin : undefined}
                  isPinLoading={isPinLoading}
                  onReport={async (reason, details) => {
                    const success = await reportPost(post.id, reason, details);
                    return success;
                  }}
                  isDeleting={isDeleting}
                />
              )}
            </div>
          </div>

          {/* ── Content ── */}
          <div className="mb-4">
            {isEditingPost ? (
              <div className="space-y-2">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-dark-border rounded-xl bg-gray-50 dark:bg-dark-bg-tertiary text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-cv-blue focus:border-transparent text-sm leading-relaxed"
                  rows={4}
                  maxLength={2000}
                  autoFocus
                  aria-label={tp.edit}
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => { setIsEditingPost(false); setEditContent(localPost.content); }}
                    className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary rounded-lg transition-colors"
                  >
                    {tp.cancel}
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={isSavingEdit || !editContent.trim()}
                    className="px-4 py-1.5 text-sm bg-cv-blue text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium"
                  >
                    {isSavingEdit ? '...' : tp.save}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-gray-700 dark:text-gray-200 text-[15px] leading-relaxed whitespace-pre-wrap">
                  {renderContent(displayContent, onHashtagClick)}
                  {!isExpanded && needsTruncation && (
                    <span className="text-gray-400">...</span>
                  )}
                </p>
                {needsTruncation && (
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-cv-blue text-sm font-semibold hover:underline mt-1"
                    aria-expanded={isExpanded}
                  >
                    {isExpanded ? tp.showLess : tp.readMore}
                  </button>
                )}
                {/* Translate button */}
                {post.content.length > 10 && (
                  <button
                    onClick={handleTranslate}
                    disabled={isTranslating}
                    className="text-gray-400 dark:text-gray-500 text-xs hover:text-cv-blue transition-colors mt-1.5 block"
                  >
                    {isTranslating ? (lang === 'es' ? 'Traduciendo...' : 'Translating...') :
                     translatedText ? (lang === 'es' ? 'Ver original' : 'See original') :
                     (lang === 'es' ? 'Ver traducción' : 'See translation')}
                  </button>
                )}
                {translatedText && (
                  <p className="text-gray-600 dark:text-gray-300 text-[15px] leading-relaxed whitespace-pre-wrap mt-2 pl-3 border-l-2 border-cv-blue/30 italic">
                    {translatedText}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* ── Images ── */}
          {post.image_urls && post.image_urls.length > 0 && (
            <div className="mb-4 -mx-5 sm:mx-0 sm:rounded-xl overflow-hidden border border-gray-100 dark:border-dark-border">
              <ImageGallery images={post.image_urls} />
            </div>
          )}

          {/* ── Quote preview ── */}
          {(() => {
            const meta = post.metadata as { quoted_snapshot?: { content: string; author_name: string; author_avatar?: string | null; author_slug?: string | null; created_at?: string } } | null;
            const snap = meta?.quoted_snapshot;
            if (!snap) return null;
            const snapAvatarUrl = snap.author_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(snap.author_name || 'U')}&background=3B82F6&color=fff`;
            const snapProfileLink = snap.author_slug ? `/cv/${snap.author_slug}` : null;
            return (
              <div className="mb-4 border border-gray-200 dark:border-dark-border rounded-xl overflow-hidden bg-gray-50 dark:bg-dark-bg-tertiary p-3">
                <div className="flex items-center gap-2 mb-1.5">
                  {snapProfileLink ? (
                    <a href={snapProfileLink} target="_blank" rel="noopener noreferrer">
                      <img src={snapAvatarUrl} alt={snap.author_name} className="w-6 h-6 rounded-full object-cover bg-gray-100 dark:bg-dark-bg-tertiary flex-shrink-0 hover:opacity-80 transition-opacity" />
                    </a>
                  ) : (
                    <img src={snapAvatarUrl} alt={snap.author_name} className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
                  )}
                  {snapProfileLink ? (
                    <a href={snapProfileLink} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-gray-800 dark:text-gray-200 hover:text-cv-blue transition-colors">
                      {snap.author_name}
                    </a>
                  ) : (
                    <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">{snap.author_name}</span>
                  )}
                  {snap.created_at && (
                    <span className="text-[10px] text-gray-400 dark:text-gray-500">
                      · {formatDistanceToNow(new Date(snap.created_at), { addSuffix: true, locale: lang === 'es' ? es : undefined })}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3 leading-relaxed whitespace-pre-wrap">
                  {snap.content}
                </p>
              </div>
            );
          })()}

          {/* ── Link preview ── */}
          {(() => {
            const meta = post.metadata as { linkPreview?: { url: string; title?: string; description?: string; image?: string } } | null;
            const lp = meta?.linkPreview;
            if (!lp?.url) return null;
            let domain = '';
            try { domain = new URL(lp.url).hostname.replace('www.', ''); } catch { /* ignore */ }
            return (
              <a
                href={lp.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block mb-4 border border-gray-200 dark:border-dark-border rounded-xl overflow-hidden hover:shadow-md transition-shadow group"
              >
                {lp.image && (
                  <div className="aspect-[2/1] max-h-52 overflow-hidden bg-gray-100 dark:bg-dark-bg-tertiary">
                    <img src={lp.image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                )}
                <div className="px-4 py-3">
                  {domain && <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">{domain}</p>}
                  {lp.title && <p className="text-sm font-semibold text-gray-800 dark:text-white line-clamp-2">{lp.title}</p>}
                  {lp.description && <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5">{lp.description}</p>}
                </div>
              </a>
            );
          })()}

          {/* ── POLL rendering ── */}
          {post.content_type === 'POLL' && (() => {
            const pollData = (post.metadata as { poll?: PollData })?.poll;
            if (!pollData) return null;

            const hasVoted = localPost.userPollVote != null;
            const isAuthor = isOwner;
            const isExpiredPoll = new Date(pollData.expires_at) < new Date();
            const showResults = hasVoted || isAuthor || isExpiredPoll;
            const voteCounts = localPost.pollVoteCounts || [];
            const totalVotes = voteCounts.reduce((sum, vc) => sum + vc.count, 0);

            const getCount = (idx: number) => voteCounts.find(v => v.option_index === idx)?.count || 0;

            const handleVote = async (idx: number) => {
              if (showResults || !onPollVote || readOnly) { if (readOnly) onAuthRequired?.(); return; }
              // Optimistic update
              setLocalPost(prev => ({
                ...prev,
                userPollVote: idx,
                pollVoteCounts: [
                  ...(prev.pollVoteCounts || []).filter(v => v.option_index !== idx),
                  { option_index: idx, count: getCount(idx) + 1 }
                ],
              }));
              const result = await onPollVote(post.id, idx);
              if (!result.success) {
                // Rollback
                setLocalPost(prev => ({
                  ...prev,
                  userPollVote: post.userPollVote,
                  pollVoteCounts: post.pollVoteCounts,
                }));
              }
            };

            // Time remaining
            const msLeft = new Date(pollData.expires_at).getTime() - Date.now();
            const hoursLeft = Math.max(0, Math.floor(msLeft / 3600000));
            const daysLeft = Math.floor(hoursLeft / 24);
            const timeLabel = isExpiredPoll
              ? (lang === 'es' ? 'Encuesta cerrada' : 'Poll closed')
              : daysLeft > 0
                ? `${daysLeft}${lang === 'es' ? 'd restantes' : 'd left'}`
                : `${hoursLeft}${lang === 'es' ? 'h restante' : 'h left'}`;

            return (
              <div className="mb-4 space-y-2">
                <p className="text-sm font-bold text-gray-800 dark:text-white">{pollData.question}</p>
                <div className="space-y-1.5">
                  {pollData.options.map((option, idx) => {
                    const count = getCount(idx);
                    const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                    const isMyVote = localPost.userPollVote === idx;

                    if (showResults) {
                      return (
                        <div key={idx} className="relative">
                          <div className="flex items-center justify-between relative z-10 px-3 py-2.5 rounded-xl">
                            <span className={`text-sm ${isMyVote ? 'font-bold text-teal-700 dark:text-teal-400' : 'text-gray-700 dark:text-gray-300'}`}>
                              {isMyVote && <span className="mr-1">✓</span>}
                              {option}
                            </span>
                            <span className={`text-xs font-bold tabular-nums ${isMyVote ? 'text-teal-600 dark:text-teal-400' : 'text-gray-500 dark:text-gray-400'}`}>
                              {pct}%
                            </span>
                          </div>
                          {/* Progress bar background */}
                          <div className="absolute inset-0 rounded-xl overflow-hidden bg-gray-100 dark:bg-dark-bg-tertiary">
                            <div
                              className={`h-full transition-all duration-500 ease-out ${isMyVote ? 'bg-teal-100 dark:bg-teal-900/30' : 'bg-gray-200/60 dark:bg-gray-700/30'}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    }

                    return (
                      <button
                        key={idx}
                        onClick={() => handleVote(idx)}
                        className="w-full text-left px-3 py-2.5 rounded-xl border-2 border-gray-200 dark:border-dark-border text-sm text-gray-700 dark:text-gray-300 hover:border-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-all font-medium"
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
                  <span className="tabular-nums">{totalVotes} {totalVotes === 1 ? (lang === 'es' ? 'voto' : 'vote') : (lang === 'es' ? 'votos' : 'votes')}</span>
                  <span>·</span>
                  <span className="flex items-center gap-0.5">
                    <ClockIcon className="w-3 h-3" />
                    {timeLabel}
                  </span>
                </div>
              </div>
            );
          })()}

          {/* ── EVENT rendering ── */}
          {post.content_type === 'EVENT' && (() => {
            const eventData = (post.metadata as { event?: EventData })?.event;
            if (!eventData) return null;

            const eventDateObj = new Date(eventData.date + 'T00:00:00');
            // Guard against invalid dates
            if (isNaN(eventDateObj.getTime())) return null;
            const isPast = eventDateObj < new Date();
            const monthStr = eventDateObj.toLocaleString(lang === 'es' ? 'es' : 'en', { month: 'short' }).toUpperCase();
            const dayNum = eventDateObj.getDate();
            const formattedDate = eventDateObj.toLocaleDateString(
              lang === 'es' ? 'es-ES' : 'en-US',
              { day: 'numeric', month: 'short', year: 'numeric' }
            );

            return (
              <div className={`mb-4 rounded-xl border ${isPast ? 'border-gray-200 dark:border-dark-border opacity-75' : 'border-rose-200 dark:border-rose-800/30'} overflow-hidden`}>
                <div className={`flex items-start gap-4 p-4 ${isPast ? 'bg-gray-50 dark:bg-dark-bg-tertiary' : 'bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-900/10 dark:to-pink-900/10'}`}>
                  {/* Calendar date block */}
                  <div className={`flex-shrink-0 w-16 h-16 rounded-xl flex flex-col items-center justify-center shadow-sm ${
                    isPast
                      ? 'bg-gray-200 dark:bg-gray-700'
                      : 'bg-white dark:bg-dark-bg-secondary border border-rose-200 dark:border-rose-800/30'
                  }`}>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${isPast ? 'text-gray-500' : 'text-rose-500'}`}>
                      {monthStr}
                    </span>
                    <span className={`text-2xl font-black leading-none ${isPast ? 'text-gray-600 dark:text-gray-400' : 'text-gray-800 dark:text-white'}`}>
                      {dayNum}
                    </span>
                  </div>

                  {/* Event details */}
                  <div className="min-w-0 flex-1">
                    <h4 className={`text-sm font-bold ${isPast ? 'text-gray-500 dark:text-gray-400' : 'text-gray-800 dark:text-white'}`}>
                      {eventData.title}
                      {isPast && (
                        <span className="ml-2 text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase">
                          {lang === 'es' ? 'Finalizado' : 'Past'}
                        </span>
                      )}
                    </h4>
                    <div className="mt-1 space-y-0.5">
                      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <CalendarDaysIcon className="w-3.5 h-3.5 flex-shrink-0" />
                        {formattedDate}{eventData.time ? ` · ${eventData.time}` : ''}
                      </p>
                      {eventData.location && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <MapPinIcon className="w-3.5 h-3.5 flex-shrink-0" />
                          {eventData.location}
                        </p>
                      )}
                    </div>
                    {eventData.link && (
                      <a
                        href={eventData.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline"
                      >
                        <LinkIcon className="w-3.5 h-3.5" />
                        {lang === 'es' ? 'Ver más' : 'Learn more'}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ── Stats divider ── */}
          {(localPost.likes_count > 0 || localPost.comments_count > 0 || localPost.shares_count > 0 || (localPost.views_count || 0) > 0) && (
            <div className="flex items-center justify-between py-2.5 border-b border-gray-100 dark:border-dark-border/50 mb-1">
              {localPost.likes_count > 0 && (
                <div className="flex items-center gap-1.5">
                  <div className="flex -space-x-1">
                    {(localPost.topReactions?.length ? localPost.topReactions : ['LIKE' as ReactionType]).map((rt, i) => {
                      const IconComp = ReactionIcons[rt];
                      const cfg = reactionMap[rt];
                      return (
                        <span
                          key={rt}
                          className={`w-[22px] h-[22px] rounded-full bg-gradient-to-br ${cfg.gradient} ring-2 ring-white dark:ring-dark-bg-secondary flex items-center justify-center shadow-sm`}
                          style={{ zIndex: 10 - i }}
                        >
                          <IconComp className="w-3 h-3 text-white" />
                        </span>
                      );
                    })}
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 hover:text-cv-blue hover:underline cursor-pointer tabular-nums">
                    {localPost.likes_count}
                  </span>
                </div>
              )}

              <div className="flex gap-3 text-xs text-gray-500 dark:text-gray-400 ml-auto">
                {(localPost.views_count || 0) > 0 && (
                  <span className="tabular-nums">{localPost.views_count} {lang === 'es' ? 'vistas' : 'views'}</span>
                )}
                {localPost.comments_count > 0 && (
                  <button
                    onClick={() => setShowComments(!showComments)}
                    className="hover:text-cv-blue hover:underline transition-colors"
                  >
                    {localPost.comments_count} {t.feed.stats.comments}
                  </button>
                )}
                {localPost.shares_count > 0 && (
                  <span>{localPost.shares_count} {t.feed.stats.shares}</span>
                )}
              </div>
            </div>
          )}

          {/* ── Action Buttons ── */}
          <div className="flex items-center pt-1 -mx-1" role="group" aria-label={tp.actions || 'Post actions'}>
            {/* Like / Reaction button with picker */}
            <div
              ref={reactionsRef}
              className="flex-1 relative mx-0.5"
              onMouseEnter={() => {
                clearTimeout(reactionsTimeout.current);
                reactionsTimeout.current = setTimeout(() => setShowReactions(true), 300);
              }}
              onMouseLeave={() => {
                clearTimeout(reactionsTimeout.current);
                reactionsTimeout.current = setTimeout(() => setShowReactions(false), 400);
              }}
            >
              {/* Reactions picker flyout — all 5 reaction types */}
              {showReactions && (
                <div
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 flex items-center gap-1 px-2.5 py-2 bg-white dark:bg-dark-bg-secondary rounded-full shadow-xl border border-gray-200 dark:border-dark-border z-50"
                  style={{
                    opacity: 0,
                    animation: 'reactionPopIn 200ms ease-out forwards',
                    transformOrigin: 'center bottom',
                  }}
                  onMouseEnter={() => clearTimeout(reactionsTimeout.current)}
                  onMouseLeave={() => {
                    reactionsTimeout.current = setTimeout(() => setShowReactions(false), 400);
                  }}
                  role="group"
                  aria-label={tp.chooseReaction || 'Choose a reaction'}
                >
                  {REACTIONS.map((r, idx) => {
                    const isActive = localPost.userReaction === r.type;
                    const label = getReactionLabel(r.type);
                    const IconComp = ReactionIcons[r.type];
                    return (
                      <button
                        key={r.type}
                        onClick={() => handleReaction(r.type)}
                        className={`group relative flex items-center justify-center w-11 h-11 rounded-full transition-all duration-150 hover:scale-[1.35] hover:-translate-y-1 active:scale-100 ${
                          isActive ? 'scale-110 ring-2 ring-gray-200 dark:ring-dark-border' : ''
                        }`}
                        style={{ animationDelay: `${idx * 30}ms` }}
                        aria-label={label}
                        aria-pressed={isActive}
                      >
                        <span className={`w-9 h-9 rounded-full bg-gradient-to-br ${r.gradient} flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow`}>
                          <IconComp className="w-[18px] h-[18px] text-white" />
                        </span>
                        <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-0.5 text-[10px] font-bold text-white bg-gray-900 dark:bg-gray-700 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none shadow-sm">
                          {label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Main like/reaction button — desktop: click=toggle, hover=picker / mobile: tap=toggle, long-press=picker */}
              <button
                onClick={(e) => {
                  if ((e.nativeEvent as PointerEvent).pointerType !== 'touch') {
                    handleQuickLike();
                  }
                }}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onTouchMove={handleTouchMove}
                disabled={isLiking}
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all active:scale-95 text-sm font-semibold select-none ${
                  activeReaction
                    ? `${activeReaction.color} ${activeReaction.bgActive}`
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary hover:text-gray-700 dark:hover:text-gray-200'
                } disabled:opacity-50`}
                aria-label={activeReaction ? getReactionLabel(localPost.userReaction!) : isEvent ? (lang === 'es' ? 'Interesado' : 'Interested') : tp.like}
                aria-pressed={!!activeReaction}
              >
                {isLiking ? (
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : activeReaction ? (
                  (() => {
                    const ActiveIcon = ReactionIcons[localPost.userReaction!];
                    return (
                      <span className={`w-6 h-6 rounded-full bg-gradient-to-br ${activeReaction.gradient} flex items-center justify-center shadow-sm`}>
                        <ActiveIcon className="w-3.5 h-3.5 text-white" />
                      </span>
                    );
                  })()
                ) : (
                  <HandThumbUpIcon className="w-5 h-5" />
                )}
                <span className="hidden sm:inline">
                  {activeReaction
                    ? getReactionLabel(localPost.userReaction!)
                    : isEvent
                      ? (lang === 'es' ? 'Interesado' : 'Interested')
                      : tp.like}
                </span>
              </button>
            </div>

            {/* Comment */}
            <button
              onClick={() => { if (!currentUserId || readOnly) { onAuthRequired?.(); return; } setShowComments(!showComments); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl transition-colors text-sm font-semibold mx-0.5 ${
                showComments
                  ? 'text-cv-blue bg-blue-50 dark:bg-blue-900/20'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary hover:text-gray-700 dark:hover:text-gray-200'
              }`}
              aria-label={tp.comment}
              aria-expanded={showComments}
            >
              <ChatBubbleOvalLeftEllipsisIcon className="w-5 h-5" />
              <span className="hidden sm:inline">{tp.comment}</span>
              {localPost.comments_count > 0 && (
                <span className="sm:hidden text-xs opacity-70">{localPost.comments_count}</span>
              )}
            </button>

            {/* Repost */}
            <button
              onClick={handleRepost}
              disabled={isSharing}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all active:scale-95 text-sm font-semibold mx-0.5 ${
                localPost.hasReposted
                  ? 'text-green-600 bg-green-50 dark:bg-green-900/20'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary hover:text-gray-700 dark:hover:text-gray-200'
              } disabled:opacity-50`}
              aria-label={localPost.hasReposted ? tp.reposted : tp.repost}
              aria-pressed={localPost.hasReposted}
            >
              {isSharing ? (
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <ArrowPathRoundedSquareIcon className="w-5 h-5" />
              )}
              <span className="hidden sm:inline">
                {localPost.hasReposted ? tp.reposted : tp.repost}
              </span>
            </button>

            {/* Send / Share */}
            <button
              onClick={() => setShowShareModal(true)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all active:scale-95 text-sm font-semibold mx-0.5 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary hover:text-gray-700 dark:hover:text-gray-200"
              aria-label={tp.share}
            >
              <ShareIcon className="w-5 h-5" />
              <span className="hidden sm:inline">
                {tp.share}
              </span>
            </button>
          </div>
        </div>

        {/* Comments */}
        {showComments && (
          <CommentSection
            postId={post.id}
            currentUserId={currentUserId}
            onCommentAdded={() => {
              setLocalPost(prev => ({ ...prev, comments_count: prev.comments_count + 1 }));
              if (post.author_id) onNotify?.(post.author_id, 'comment', post.id);
            }}
            onCountSync={(realCount) => {
              setLocalPost(prev => prev.comments_count !== realCount ? { ...prev, comments_count: realCount } : prev);
            }}
          />
        )}
      </article>

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        postUrl={shareUrl}
        shareText={shareText}
        authorName={post.author?.full_name || ''}
        postId={post.id}
        currentUserId={currentUserId}
        hasReposted={localPost.hasReposted}
        onRepost={handleRepost}
        onSharePost={handleSharePost}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title={tp.deleteTitle}
        message={tp.confirmDelete}
        confirmLabel={isDeleting ? tp.deleting : tp.delete}
        cancelLabel={tp.cancel}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteConfirm(false)}
        isLoading={isDeleting}
        variant="danger"
      />
    </>
  );
});

FeedPost.displayName = 'FeedPost';
export default FeedPost;
