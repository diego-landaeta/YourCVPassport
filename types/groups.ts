export interface Group {
  id: string;
  created_at: string;
  owner_id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  is_private: boolean;
  member_count: number;
  post_count: number;
  slug: string | null;
  metadata: Record<string, unknown>;
  // Joined/derived fields
  isMember?: boolean;
  isOwner?: boolean;
  role?: 'owner' | 'admin' | 'member';
  owner?: {
    full_name: string;
    avatar_url: string | null;
    slug: string | null;
  };
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  joined_at: string;
  profile?: {
    full_name: string;
    avatar_url: string | null;
    slug: string | null;
    headline: string | null;
  };
}

export interface CreateGroupPayload {
  name: string;
  description?: string;
  is_private?: boolean;
  avatar_url?: string;
  cover_url?: string;
  metadata?: Record<string, unknown>;
}
