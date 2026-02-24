// Feed Types

export type FeedContentType =
  | 'TEXT'
  | 'IMAGE'
  | 'ACHIEVEMENT'
  | 'MILESTONE'
  | 'JOB_UPDATE'
  | 'PROFILE_COMPLETE'
  | 'POLL'
  | 'EVENT';

export type PollDuration = '1d' | '3d' | '1w';

export interface PollData {
  question: string;
  options: string[];
  duration: PollDuration;
  expires_at: string; // ISO date
}

export interface EventData {
  title: string;
  date: string; // ISO date
  time?: string; // HH:mm
  location?: string;
  link?: string;
}

export type ReactionType = 'LIKE' | 'CELEBRATE' | 'SUPPORT' | 'LOVE' | 'INSIGHTFUL';

export type ShareType = 'REPOST' | 'QUOTE' | 'EXTERNAL';

export type FeedVisibility = 'PUBLIC' | 'CONNECTIONS' | 'PRIVATE';

export interface FeedAuthor {
  id: string;
  full_name: string;
  headline?: string | null;
  avatar_url?: string | null;
  slug?: string | null;
}

export interface FeedPost {
  id: string;
  created_at: string;
  updated_at: string;
  author_id: string;
  content: string;
  content_type: FeedContentType;
  image_urls: string[];
  achievement_type?: string | null;
  achievement_data?: Record<string, unknown>;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  views_count: number;
  visibility: FeedVisibility;
  is_pinned: boolean;
  is_edited: boolean;
  is_hidden: boolean;
  metadata?: Record<string, unknown>;
  // Joined data
  author?: FeedAuthor;
  hasLiked?: boolean;
  hasReposted?: boolean;
  hasBookmarked?: boolean;
  userReaction?: ReactionType | null;
  topReactions?: ReactionType[];
  // Group context
  group_id?: string | null;
  group?: { id: string; name: string; metadata?: Record<string, unknown> } | null;
  // Poll-specific joined data
  userPollVote?: number | null;
  pollVoteCounts?: { option_index: number; count: number }[];
}

export interface FeedLike {
  id: string;
  created_at: string;
  post_id: string;
  user_id: string;
  reaction_type: ReactionType;
}

export interface FeedComment {
  id: string;
  created_at: string;
  updated_at: string;
  post_id: string;
  author_id: string;
  parent_id?: string | null;
  content: string;
  likes_count: number;
  replies_count: number;
  is_edited: boolean;
  is_hidden: boolean;
  // Joined data
  author?: FeedAuthor;
  replies?: FeedComment[];
  hasLiked?: boolean;
}

export interface FeedShare {
  id: string;
  created_at: string;
  original_post_id: string;
  shared_by: string;
  new_post_id?: string | null;
  share_comment?: string | null;
  share_type: ShareType;
}

export interface CreatePostInput {
  content: string;
  contentType?: FeedContentType;
  imageUrls?: string[];
  achievementType?: string;
  achievementData?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  visibility?: FeedVisibility;
  group_id?: string;
}

export interface FeedFilters {
  contentType?: FeedContentType | 'all';
  authorId?: string;
  dateFrom?: string;
  dateTo?: string;
}
