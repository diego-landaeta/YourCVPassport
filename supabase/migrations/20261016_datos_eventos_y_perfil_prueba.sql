-- Datos rotos visibles en producción (auditoría del 15/10/2026).
--
-- 1. Publicaciones de evento de ejemplo (semillas) con enlace a /eventos/<slug>:
--    esa ruta no existe y el enlace daba la página 404. Se quita solo el enlace;
--    la publicación se queda (FeedPost solo pinta el enlace si existe).
-- 2. Perfil de prueba público e indexable (/cv/hugo-santiiiago, contenido de
--    relleno: «titulo», «Sobre mí: a», «nada»...). Se oculta, no se borra.
--
-- Idempotente.

BEGIN;

UPDATE public.feed_posts
SET metadata = metadata #- '{event,link}'
WHERE metadata -> 'event' ->> 'link' LIKE 'https://yourcvpassport.com/eventos/%';

UPDATE public.profiles
SET profile_hidden = true, updated_at = now()
WHERE slug = 'hugo-santiiiago' AND full_name = 'Hugo Santiiiago' AND profile_hidden IS NOT TRUE;

COMMIT;
