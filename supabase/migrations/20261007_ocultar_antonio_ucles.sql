-- ============================================================================
-- OCULTAR: Antonio Uclés Cruz (slug antonio-ucles)
-- Date: 2026-10-07
--
-- Se oculta en lugar de borrar: el efecto público es el mismo y es reversible.
--   - profile_hidden = true: la política RLS "Perfiles publicados visibles para
--     todos" deja de devolver la fila a anon/authenticated, y get-public-profile,
--     server.mjs, generate-profile-html y generate-sitemap la filtran. Entrar
--     por /cv/antonio-ucles da "perfil no encontrado".
--   - search_blocked = true: tampoco aparece en búsquedas.
-- Se mantienen auth.user, datos y slug, para poder volver a publicarlo.
--
-- Ejecutar en el SQL editor (sin JWT: el trigger de campos protegidos lo permite).
--
-- REVERTIR:
--   UPDATE public.profiles SET profile_hidden = false, search_blocked = false
--   WHERE id = '351e963c-8497-4ada-934a-f62645490f44';
--   y regenerar sitemap + HTML estático.
-- ============================================================================

UPDATE public.profiles SET
  profile_hidden = true,
  search_blocked = true
WHERE id = '351e963c-8497-4ada-934a-f62645490f44'
  AND slug = 'antonio-ucles';
