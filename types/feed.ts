// Feed Types

export type FeedContentType =
  | 'TEXT'
  | 'IMAGE'
  | 'ACHIEVEMENT'
  | 'MILESTONE'
  | 'JOB_UPDATE'
  | 'PROFILE_COMPLETE';

export type ReactionType = 'LIKE' | 'CELEBRATE' | 'SUPPORT' | 'LOVE' | 'INSIGHTFUL';

export type ShareType = 'REPOST' | 'QUOTE' | 'EXTERNAL';

export type FeedVisibility = 'PUBLIC' | 'CONNECTIONS' | 'PRIVATE';

export interface FeedAuthor {
  id: string;
  full_name: string;
  headline?: string | null;
  avatar_url?: string | null;
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
  visibility: FeedVisibility;
  is_pinned: boolean;
  is_edited: boolean;
  is_hidden: boolean;
  metadata?: Record<string, unknown>;
  // Joined data
  author?: FeedAuthor;
  hasLiked?: boolean;
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
  visibility?: FeedVisibility;
}

export interface FeedFilters {
  contentType?: FeedContentType | 'all';
  authorId?: string;
  dateFrom?: string;
  dateTo?: string;
}
