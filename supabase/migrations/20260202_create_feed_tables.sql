-- =============================================
-- FEED SOCIAL - Tablas principales
-- =============================================

-- 1. FEED_POSTS - Publicaciones
CREATE TABLE IF NOT EXISTS public.feed_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Autor (referencia a profiles para permitir joins)
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    -- Contenido
    content TEXT NOT NULL,
    content_type VARCHAR(50) DEFAULT 'TEXT' CHECK (content_type IN (
        'TEXT',
        'IMAGE',
        'ACHIEVEMENT',
        'MILESTONE',
        'JOB_UPDATE',
        'PROFILE_COMPLETE'
    )),

    -- Imagenes (URLs de Supabase Storage)
    image_urls TEXT[] DEFAULT '{}',

    -- Logros automaticos
    achievement_type VARCHAR(100),
    achievement_data JSONB DEFAULT '{}',

    -- Contadores denormalizados
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    shares_count INTEGER DEFAULT 0,

    -- Visibilidad
    visibility VARCHAR(50) DEFAULT 'PUBLIC' CHECK (visibility IN ('PUBLIC', 'CONNECTIONS', 'PRIVATE')),
    is_pinned BOOLEAN DEFAULT false,
    is_edited BOOLEAN DEFAULT false,

    -- Moderacion
    is_hidden BOOLEAN DEFAULT false,
    hidden_reason TEXT,
    hidden_by UUID REFERENCES public.profiles(id),

    metadata JSONB DEFAULT '{}'
);

-- Indices para feed_posts
CREATE INDEX IF NOT EXISTS idx_feed_posts_author ON public.feed_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_feed_posts_created ON public.feed_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_posts_type ON public.feed_posts(content_type);
CREATE INDEX IF NOT EXISTS idx_feed_posts_visible ON public.feed_posts(visibility, is_hidden) WHERE is_hidden = false;

-- 2. FEED_LIKES - Likes en publicaciones
CREATE TABLE IF NOT EXISTS public.feed_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),

    post_id UUID NOT NULL REFERENCES public.feed_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    reaction_type VARCHAR(50) DEFAULT 'LIKE' CHECK (reaction_type IN (
        'LIKE', 'CELEBRATE', 'SUPPORT', 'LOVE', 'INSIGHTFUL'
    )),

    UNIQUE(post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_feed_likes_post ON public.feed_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_feed_likes_user ON public.feed_likes(user_id);

-- 3. FEED_COMMENTS - Comentarios
CREATE TABLE IF NOT EXISTS public.feed_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    post_id UUID NOT NULL REFERENCES public.feed_posts(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES public.feed_comments(id) ON DELETE CASCADE,

    content TEXT NOT NULL,

    likes_count INTEGER DEFAULT 0,
    replies_count INTEGER DEFAULT 0,

    is_edited BOOLEAN DEFAULT false,
    is_hidden BOOLEAN DEFAULT false,
    hidden_reason TEXT,

    metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_feed_comments_post ON public.feed_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_feed_comments_author ON public.feed_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_feed_comments_parent ON public.feed_comments(parent_id);

-- 4. FEED_SHARES - Compartidos
CREATE TABLE IF NOT EXISTS public.feed_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),

    original_post_id UUID NOT NULL REFERENCES public.feed_posts(id) ON DELETE CASCADE,
    shared_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    new_post_id UUID REFERENCES public.feed_posts(id) ON DELETE SET NULL,

    share_comment TEXT,
    share_type VARCHAR(50) DEFAULT 'REPOST' CHECK (share_type IN ('REPOST', 'QUOTE', 'EXTERNAL')),

    metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_feed_shares_original ON public.feed_shares(original_post_id);
CREATE INDEX IF NOT EXISTS idx_feed_shares_by ON public.feed_shares(shared_by);

-- 5. FEED_COMMENT_LIKES - Likes en comentarios
CREATE TABLE IF NOT EXISTS public.feed_comment_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),

    comment_id UUID NOT NULL REFERENCES public.feed_comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    UNIQUE(comment_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_feed_comment_likes_comment ON public.feed_comment_likes(comment_id);

-- =============================================
-- TRIGGERS - Contadores automaticos
-- =============================================

-- Trigger para actualizar likes_count en posts
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.feed_posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.feed_posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.post_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_post_likes ON public.feed_likes;
CREATE TRIGGER trigger_update_post_likes
AFTER INSERT OR DELETE ON public.feed_likes
FOR EACH ROW EXECUTE FUNCTION update_post_likes_count();

-- Trigger para actualizar comments_count en posts
CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.parent_id IS NULL THEN
            UPDATE public.feed_posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
        ELSE
            UPDATE public.feed_comments SET replies_count = replies_count + 1 WHERE id = NEW.parent_id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.parent_id IS NULL THEN
            UPDATE public.feed_posts SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = OLD.post_id;
        ELSE
            UPDATE public.feed_comments SET replies_count = GREATEST(replies_count - 1, 0) WHERE id = OLD.parent_id;
        END IF;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_post_comments ON public.feed_comments;
CREATE TRIGGER trigger_update_post_comments
AFTER INSERT OR DELETE ON public.feed_comments
FOR EACH ROW EXECUTE FUNCTION update_post_comments_count();

-- Trigger para actualizar shares_count en posts
CREATE OR REPLACE FUNCTION update_post_shares_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.feed_posts SET shares_count = shares_count + 1 WHERE id = NEW.original_post_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.feed_posts SET shares_count = GREATEST(shares_count - 1, 0) WHERE id = OLD.original_post_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_post_shares ON public.feed_shares;
CREATE TRIGGER trigger_update_post_shares
AFTER INSERT OR DELETE ON public.feed_shares
FOR EACH ROW EXECUTE FUNCTION update_post_shares_count();

-- Trigger para likes en comentarios
CREATE OR REPLACE FUNCTION update_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.feed_comments SET likes_count = likes_count + 1 WHERE id = NEW.comment_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.feed_comments SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.comment_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_comment_likes ON public.feed_comment_likes;
CREATE TRIGGER trigger_update_comment_likes
AFTER INSERT OR DELETE ON public.feed_comment_likes
FOR EACH ROW EXECUTE FUNCTION update_comment_likes_count();

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_feed_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_feed_posts_updated ON public.feed_posts;
CREATE TRIGGER trigger_feed_posts_updated
BEFORE UPDATE ON public.feed_posts
FOR EACH ROW EXECUTE FUNCTION update_feed_updated_at();

DROP TRIGGER IF EXISTS trigger_feed_comments_updated ON public.feed_comments;
CREATE TRIGGER trigger_feed_comments_updated
BEFORE UPDATE ON public.feed_comments
FOR EACH ROW EXECUTE FUNCTION update_feed_updated_at();

-- =============================================
-- RLS POLICIES
-- =============================================

ALTER TABLE public.feed_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_comment_likes ENABLE ROW LEVEL SECURITY;

-- FEED_POSTS policies
CREATE POLICY "Users can view public posts"
ON public.feed_posts FOR SELECT
TO authenticated
USING (is_hidden = false AND visibility = 'PUBLIC');

CREATE POLICY "Users can view own posts"
ON public.feed_posts FOR SELECT
TO authenticated
USING (author_id = auth.uid());

CREATE POLICY "Users can create posts"
ON public.feed_posts FOR INSERT
TO authenticated
WITH CHECK (author_id = auth.uid());

CREATE POLICY "Users can update own posts"
ON public.feed_posts FOR UPDATE
TO authenticated
USING (author_id = auth.uid());

CREATE POLICY "Users can delete own posts"
ON public.feed_posts FOR DELETE
TO authenticated
USING (author_id = auth.uid());

CREATE POLICY "Admins can manage all posts"
ON public.feed_posts FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- FEED_LIKES policies
CREATE POLICY "Anyone can view likes"
ON public.feed_likes FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can add likes"
ON public.feed_likes FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can remove own likes"
ON public.feed_likes FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- FEED_COMMENTS policies
CREATE POLICY "Anyone can view comments"
ON public.feed_comments FOR SELECT
TO authenticated
USING (is_hidden = false);

CREATE POLICY "Users can create comments"
ON public.feed_comments FOR INSERT
TO authenticated
WITH CHECK (author_id = auth.uid());

CREATE POLICY "Users can update own comments"
ON public.feed_comments FOR UPDATE
TO authenticated
USING (author_id = auth.uid());

CREATE POLICY "Users can delete own comments"
ON public.feed_comments FOR DELETE
TO authenticated
USING (author_id = auth.uid());

-- FEED_SHARES policies
CREATE POLICY "Anyone can view shares"
ON public.feed_shares FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can share"
ON public.feed_shares FOR INSERT
TO authenticated
WITH CHECK (shared_by = auth.uid());

CREATE POLICY "Users can delete own shares"
ON public.feed_shares FOR DELETE
TO authenticated
USING (shared_by = auth.uid());

-- FEED_COMMENT_LIKES policies
CREATE POLICY "Anyone can view comment likes"
ON public.feed_comment_likes FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can add comment likes"
ON public.feed_comment_likes FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can remove comment likes"
ON public.feed_comment_likes FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- =============================================
-- STORAGE BUCKET para imagenes
-- =============================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'feed-images',
    'feed-images',
    true,
    5242880,
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Users can upload feed images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'feed-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Public read feed images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'feed-images');

CREATE POLICY "Users can delete own feed images"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'feed-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- =============================================
-- COMENTARIOS
-- =============================================

COMMENT ON TABLE public.feed_posts IS 'Publicaciones del feed social';
COMMENT ON TABLE public.feed_likes IS 'Likes en publicaciones';
COMMENT ON TABLE public.feed_comments IS 'Comentarios en publicaciones';
COMMENT ON TABLE public.feed_shares IS 'Registro de publicaciones compartidas';
COMMENT ON TABLE public.feed_comment_likes IS 'Likes en comentarios';
