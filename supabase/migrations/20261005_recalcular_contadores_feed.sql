-- =============================================================================
-- Recalcular contadores desnormalizados del feed y de los grupos (#3)
-- =============================================================================
--
-- PROBLEMA
--   Varias migraciones de seed (20260224_more_groups_content.sql,
--   20260226_enhance_groups_channels.sql, 20260226_more_channels.sql,
--   20260226_more_groups_and_channels.sql) insertaron posts con
--   comments_count / likes_count fijos (22, 34, 29...) y grupos con
--   member_count / post_count fijos, SIN crear las filas reales. Resultado:
--   un post dice "34 comentarios" y al abrirlo sale "Sé el primero en comentar".
--
-- QUÉ HACE ESTA MIGRACIÓN (idempotente: se puede ejecutar varias veces)
--   1. Guarda una copia de TODOS los contadores actuales en
--      public.feed_counters_backup_20261005 (solo la primera vez que ve cada
--      fila: si se re-ejecuta, la copia conserva los valores ORIGINALES).
--   2. Sustituye el trigger de comentarios para que cuente solo los
--      comentarios VISIBLES (is_hidden = false), igual que la UI, y para que
--      reaccione también al ocultar/mostrar un comentario. Las respuestas
--      siguen sin contar en feed_posts.comments_count (van a replies_count).
--   3. Recalcula desde las filas reales:
--        feed_posts.likes_count     = nº de filas en feed_likes
--        feed_posts.comments_count  = nº de comentarios de primer nivel visibles
--        feed_posts.shares_count    = nº de filas en feed_shares (original_post_id)
--        feed_comments.likes_count  = nº de filas en feed_comment_likes
--        feed_comments.replies_count= nº de respuestas visibles
--        groups.member_count        = nº de filas en group_members
--        groups.post_count          = nº de posts con ese group_id
--      Solo se actualizan las filas cuyo valor cambia (IS DISTINCT FROM).
--
-- QUÉ NO HACE
--   - feed_posts.views_count NO se recalcula: no existe una tabla de vistas por
--     post de la que derivarlo (se generó con random() en
--     20260225_fix_seed_realism.sql y 20260226_enhance_groups_channels.sql).
--     Se guarda en la copia por si producto decide ponerlo a 0.
--   - No inserta comentarios/likes ficticios. Si producto quiere "actividad",
--     tendrá que sembrar filas reales; nunca números sin respaldo.
--
-- EFECTO VISIBLE
--   La comunidad mostrará los números reales (más bajos). Es una decisión de
--   producto aplicarla en producción.
--
-- CÓMO REVERTIR (datos)
--   UPDATE public.feed_posts p SET
--     likes_count    = (b.counters->>'likes_count')::int,
--     comments_count = (b.counters->>'comments_count')::int,
--     shares_count   = (b.counters->>'shares_count')::int
--   FROM public.feed_counters_backup_20261005 b
--   WHERE b.table_name = 'feed_posts' AND b.row_id = p.id;
--
--   UPDATE public.feed_comments c SET
--     likes_count   = (b.counters->>'likes_count')::int,
--     replies_count = (b.counters->>'replies_count')::int
--   FROM public.feed_counters_backup_20261005 b
--   WHERE b.table_name = 'feed_comments' AND b.row_id = c.id;
--
--   UPDATE public.groups g SET
--     member_count = (b.counters->>'member_count')::int,
--     post_count   = (b.counters->>'post_count')::int
--   FROM public.feed_counters_backup_20261005 b
--   WHERE b.table_name = 'groups' AND b.row_id = g.id;
--
-- CÓMO REVERTIR (trigger)
--   Volver a ejecutar el bloque "Trigger para actualizar comments_count en
--   posts" de 20260202_create_feed_tables.sql (función + CREATE TRIGGER
--   AFTER INSERT OR DELETE).
--
-- La tabla de copia se puede borrar cuando ya no haga falta:
--   DROP TABLE public.feed_counters_backup_20261005;
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. Copia de seguridad de los contadores actuales
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.feed_counters_backup_20261005 (
  table_name   TEXT        NOT NULL,
  row_id       UUID        NOT NULL,
  counters     JSONB       NOT NULL,
  backed_up_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (table_name, row_id)
);

COMMENT ON TABLE public.feed_counters_backup_20261005 IS
  'Copia de los contadores desnormalizados antes de 20261005_recalcular_contadores_feed.sql (para revertir).';

-- Regla del proyecto: toda tabla nueva con RLS. Sin políticas = solo
-- service_role / propietario pueden leerla o escribirla.
ALTER TABLE public.feed_counters_backup_20261005 ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.feed_counters_backup_20261005 FROM anon, authenticated;

INSERT INTO public.feed_counters_backup_20261005 (table_name, row_id, counters)
SELECT 'feed_posts', p.id, jsonb_build_object(
  'likes_count',    p.likes_count,
  'comments_count', p.comments_count,
  'shares_count',   p.shares_count,
  'views_count',    p.views_count
)
FROM public.feed_posts p
ON CONFLICT (table_name, row_id) DO NOTHING;

INSERT INTO public.feed_counters_backup_20261005 (table_name, row_id, counters)
SELECT 'feed_comments', c.id, jsonb_build_object(
  'likes_count',   c.likes_count,
  'replies_count', c.replies_count
)
FROM public.feed_comments c
ON CONFLICT (table_name, row_id) DO NOTHING;

INSERT INTO public.feed_counters_backup_20261005 (table_name, row_id, counters)
SELECT 'groups', g.id, jsonb_build_object(
  'member_count', g.member_count,
  'post_count',   g.post_count
)
FROM public.groups g
ON CONFLICT (table_name, row_id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 2. Trigger de comentarios: contar solo comentarios visibles
-- -----------------------------------------------------------------------------
-- Antes: +1/-1 en INSERT/DELETE sin mirar is_hidden, y ocultar un comentario no
-- restaba. La UI (useFeedComments) solo muestra is_hidden = false, así que el
-- contador y la lista podían divergir. Se mantiene el modelo incremental
-- (UPDATE ... SET x = x ± 1) porque es seguro con inserciones concurrentes.
CREATE OR REPLACE FUNCTION public.update_post_comments_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_delta INTEGER := 0;
  v_row   public.feed_comments%ROWTYPE;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF COALESCE(NEW.is_hidden, false) THEN RETURN NULL; END IF;
    v_delta := 1;
    v_row := NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF COALESCE(OLD.is_hidden, false) THEN RETURN NULL; END IF;
    v_delta := -1;
    v_row := OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    IF COALESCE(OLD.is_hidden, false) = COALESCE(NEW.is_hidden, false) THEN RETURN NULL; END IF;
    v_delta := CASE WHEN COALESCE(NEW.is_hidden, false) THEN -1 ELSE 1 END;
    v_row := NEW;
  END IF;

  IF v_row.parent_id IS NULL THEN
    UPDATE public.feed_posts
       SET comments_count = GREATEST(COALESCE(comments_count, 0) + v_delta, 0)
     WHERE id = v_row.post_id;
  ELSE
    UPDATE public.feed_comments
       SET replies_count = GREATEST(COALESCE(replies_count, 0) + v_delta, 0)
     WHERE id = v_row.parent_id;
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_post_comments ON public.feed_comments;
CREATE TRIGGER trigger_update_post_comments
AFTER INSERT OR DELETE OR UPDATE OF is_hidden ON public.feed_comments
FOR EACH ROW EXECUTE FUNCTION public.update_post_comments_count();

-- -----------------------------------------------------------------------------
-- 3. Recalcular contadores desde las filas reales
-- -----------------------------------------------------------------------------
-- Desactivamos temporalmente los triggers de updated_at para que el recálculo
-- no cambie la fecha de "última modificación" de cientos de posts/comentarios.
ALTER TABLE public.feed_posts    DISABLE TRIGGER trigger_feed_posts_updated;
ALTER TABLE public.feed_comments DISABLE TRIGGER trigger_feed_comments_updated;

-- 3.1 feed_posts.likes_count
UPDATE public.feed_posts p
   SET likes_count = s.n
  FROM (
    SELECT p2.id, COUNT(l.id)::int AS n
      FROM public.feed_posts p2
      LEFT JOIN public.feed_likes l ON l.post_id = p2.id
     GROUP BY p2.id
  ) s
 WHERE s.id = p.id
   AND p.likes_count IS DISTINCT FROM s.n;

-- 3.2 feed_posts.comments_count (solo primer nivel y visibles, como la UI)
UPDATE public.feed_posts p
   SET comments_count = s.n
  FROM (
    SELECT p2.id, COUNT(c.id)::int AS n
      FROM public.feed_posts p2
      LEFT JOIN public.feed_comments c
        ON c.post_id = p2.id
       AND c.parent_id IS NULL
       AND COALESCE(c.is_hidden, false) = false
     GROUP BY p2.id
  ) s
 WHERE s.id = p.id
   AND p.comments_count IS DISTINCT FROM s.n;

-- 3.3 feed_posts.shares_count (mismo criterio que update_post_shares_count)
UPDATE public.feed_posts p
   SET shares_count = s.n
  FROM (
    SELECT p2.id, COUNT(sh.id)::int AS n
      FROM public.feed_posts p2
      LEFT JOIN public.feed_shares sh ON sh.original_post_id = p2.id
     GROUP BY p2.id
  ) s
 WHERE s.id = p.id
   AND p.shares_count IS DISTINCT FROM s.n;

-- 3.4 feed_comments.likes_count
UPDATE public.feed_comments c
   SET likes_count = s.n
  FROM (
    SELECT c2.id, COUNT(cl.id)::int AS n
      FROM public.feed_comments c2
      LEFT JOIN public.feed_comment_likes cl ON cl.comment_id = c2.id
     GROUP BY c2.id
  ) s
 WHERE s.id = c.id
   AND c.likes_count IS DISTINCT FROM s.n;

-- 3.5 feed_comments.replies_count (respuestas visibles)
UPDATE public.feed_comments c
   SET replies_count = s.n
  FROM (
    SELECT c2.id, COUNT(r.id)::int AS n
      FROM public.feed_comments c2
      LEFT JOIN public.feed_comments r
        ON r.parent_id = c2.id
       AND COALESCE(r.is_hidden, false) = false
     GROUP BY c2.id
  ) s
 WHERE s.id = c.id
   AND c.replies_count IS DISTINCT FROM s.n;

ALTER TABLE public.feed_posts    ENABLE TRIGGER trigger_feed_posts_updated;
ALTER TABLE public.feed_comments ENABLE TRIGGER trigger_feed_comments_updated;

-- 3.6 groups.member_count (mismo criterio que update_group_member_count)
UPDATE public.groups g
   SET member_count = s.n
  FROM (
    SELECT g2.id, COUNT(m.id)::int AS n
      FROM public.groups g2
      LEFT JOIN public.group_members m ON m.group_id = g2.id
     GROUP BY g2.id
  ) s
 WHERE s.id = g.id
   AND g.member_count IS DISTINCT FROM s.n;

-- 3.7 groups.post_count (mismo criterio que update_group_post_count: todos los posts del grupo)
UPDATE public.groups g
   SET post_count = s.n
  FROM (
    SELECT g2.id, COUNT(p.id)::int AS n
      FROM public.groups g2
      LEFT JOIN public.feed_posts p ON p.group_id = g2.id
     GROUP BY g2.id
  ) s
 WHERE s.id = g.id
   AND g.post_count IS DISTINCT FROM s.n;

COMMIT;

-- -----------------------------------------------------------------------------
-- Comprobación (opcional, ejecutar a mano después): debe devolver 0 filas
-- -----------------------------------------------------------------------------
-- SELECT p.id, p.comments_count,
--        (SELECT COUNT(*) FROM public.feed_comments c
--          WHERE c.post_id = p.id AND c.parent_id IS NULL AND NOT c.is_hidden) AS reales
--   FROM public.feed_posts p
--  WHERE p.comments_count <> (SELECT COUNT(*) FROM public.feed_comments c
--          WHERE c.post_id = p.id AND c.parent_id IS NULL AND NOT c.is_hidden);
