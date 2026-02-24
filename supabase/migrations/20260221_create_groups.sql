-- ============================================================
-- Groups (Comunidades) System
-- Run this in the Supabase SQL editor
-- ============================================================

-- 1. Groups table
CREATE TABLE IF NOT EXISTS public.groups (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  owner_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name        VARCHAR(100) NOT NULL,
  description TEXT,
  avatar_url  TEXT,
  cover_url   TEXT,
  is_private  BOOLEAN NOT NULL DEFAULT false,
  member_count INTEGER NOT NULL DEFAULT 0,
  post_count   INTEGER NOT NULL DEFAULT 0,
  slug        TEXT UNIQUE,
  metadata    JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_groups_owner_id ON public.groups(owner_id);
CREATE INDEX IF NOT EXISTS idx_groups_is_private ON public.groups(is_private);
CREATE INDEX IF NOT EXISTS idx_groups_slug ON public.groups(slug) WHERE slug IS NOT NULL;

-- 2. Group membership table
CREATE TABLE IF NOT EXISTS public.group_members (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id    UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role        TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (group_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON public.group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON public.group_members(user_id);

-- 3. Add group_id column to feed_posts (nullable — NULL means public feed)
ALTER TABLE public.feed_posts
  ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_feed_posts_group_id ON public.feed_posts(group_id)
  WHERE group_id IS NOT NULL;

-- ============================================================
-- 4. Counter triggers
-- ============================================================

-- member_count trigger
CREATE OR REPLACE FUNCTION public.update_group_member_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.groups SET member_count = member_count + 1 WHERE id = NEW.group_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.groups SET member_count = GREATEST(0, member_count - 1) WHERE id = OLD.group_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_group_member_count ON public.group_members;
CREATE TRIGGER trg_group_member_count
  AFTER INSERT OR DELETE ON public.group_members
  FOR EACH ROW EXECUTE FUNCTION public.update_group_member_count();

-- post_count trigger
CREATE OR REPLACE FUNCTION public.update_group_post_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.group_id IS NOT NULL THEN
    UPDATE public.groups SET post_count = post_count + 1 WHERE id = NEW.group_id;
  ELSIF TG_OP = 'DELETE' AND OLD.group_id IS NOT NULL THEN
    UPDATE public.groups SET post_count = GREATEST(0, post_count - 1) WHERE id = OLD.group_id;
  ELSIF TG_OP = 'UPDATE' THEN
    -- group changed
    IF OLD.group_id IS DISTINCT FROM NEW.group_id THEN
      IF OLD.group_id IS NOT NULL THEN
        UPDATE public.groups SET post_count = GREATEST(0, post_count - 1) WHERE id = OLD.group_id;
      END IF;
      IF NEW.group_id IS NOT NULL THEN
        UPDATE public.groups SET post_count = post_count + 1 WHERE id = NEW.group_id;
      END IF;
    END IF;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_group_post_count ON public.feed_posts;
CREATE TRIGGER trg_group_post_count
  AFTER INSERT OR DELETE OR UPDATE OF group_id ON public.feed_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_group_post_count();

-- ============================================================
-- 5. RLS Policies
-- ============================================================

ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- Helper: SECURITY DEFINER bypasses RLS to avoid infinite recursion
CREATE OR REPLACE FUNCTION public.is_group_member(p_group_id UUID, p_user_id UUID)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = p_group_id AND user_id = p_user_id
  );
$$;

-- groups: public groups readable by everyone, private only by members
DROP POLICY IF EXISTS "groups_select_public" ON public.groups;
CREATE POLICY "groups_select_public" ON public.groups
  FOR SELECT
  USING (
    is_private = false
    OR owner_id = auth.uid()
    OR public.is_group_member(id, auth.uid())
  );

-- authenticated users can create groups
DROP POLICY IF EXISTS "groups_insert_auth" ON public.groups;
CREATE POLICY "groups_insert_auth" ON public.groups
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND owner_id = auth.uid());

-- only owner/admin can update
DROP POLICY IF EXISTS "groups_update_owner" ON public.groups;
CREATE POLICY "groups_update_owner" ON public.groups
  FOR UPDATE
  USING (
    owner_id = auth.uid()
    OR public.is_group_member(id, auth.uid())
  );

-- only owner can delete
DROP POLICY IF EXISTS "groups_delete_owner" ON public.groups;
CREATE POLICY "groups_delete_owner" ON public.groups
  FOR DELETE
  USING (owner_id = auth.uid());

-- group_members: no recursive subquery
DROP POLICY IF EXISTS "group_members_select" ON public.group_members;
CREATE POLICY "group_members_select" ON public.group_members
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.groups g
      WHERE g.id = group_members.group_id
        AND (g.is_private = false OR g.owner_id = auth.uid())
    )
  );

-- users can join (insert themselves)
DROP POLICY IF EXISTS "group_members_insert_self" ON public.group_members;
CREATE POLICY "group_members_insert_self" ON public.group_members
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- users can leave (delete themselves); admins/owners can remove others
DROP POLICY IF EXISTS "group_members_delete" ON public.group_members;
CREATE POLICY "group_members_delete" ON public.group_members
  FOR DELETE
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.groups g
      WHERE g.id = group_members.group_id AND g.owner_id = auth.uid()
    )
  );

-- ============================================================
-- 6. Auto-insert owner as member when group is created
-- ============================================================
CREATE OR REPLACE FUNCTION public.auto_add_group_owner()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.group_members (group_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner')
  ON CONFLICT (group_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_add_group_owner ON public.groups;
CREATE TRIGGER trg_auto_add_group_owner
  AFTER INSERT ON public.groups
  FOR EACH ROW EXECUTE FUNCTION public.auto_add_group_owner();

-- ============================================================
-- 7. Auto-generate slug from name if not provided
-- ============================================================
CREATE OR REPLACE FUNCTION public.auto_group_slug()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INT := 0;
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    base_slug := lower(regexp_replace(trim(NEW.name), '[^a-z0-9]+', '-', 'g'));
    base_slug := trim(both '-' from base_slug);
    final_slug := base_slug;
    WHILE EXISTS (SELECT 1 FROM public.groups WHERE slug = final_slug AND id != NEW.id) LOOP
      counter := counter + 1;
      final_slug := base_slug || '-' || counter;
    END LOOP;
    NEW.slug := final_slug;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_group_slug ON public.groups;
CREATE TRIGGER trg_auto_group_slug
  BEFORE INSERT OR UPDATE OF name ON public.groups
  FOR EACH ROW EXECUTE FUNCTION public.auto_group_slug();
