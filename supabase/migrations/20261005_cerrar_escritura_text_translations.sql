-- =============================================================================
-- Cerrar la escritura pública en la caché de traducciones `text_translations`
-- =============================================================================
--
-- PROBLEMA (seguridad)
--   20260202_text_translations_cache.sql creó políticas INSERT/UPDATE con
--   WITH CHECK (true) / USING (true) para todos (incluido `anon`). Cualquiera
--   con la anon key pública podía insertar o modificar traducciones y cambiar
--   lo que otros usuarios ven como "traducción" de perfiles, posts y grupos
--   (envenenamiento de la caché).
--
-- QUÉ HACE
--   1. Elimina las políticas de INSERT y UPDATE abiertas. La lectura (SELECT)
--      sigue siendo pública: es una caché compartida.
--   2. Sin políticas de escritura, solo el service role (que ignora RLS) puede
--      escribir. La única vía de escritura es la Edge Function
--      `translate-texts`, que traduce ella misma (el cliente nunca aporta el
--      texto traducido).
--   3. Recrea increment_translation_hit_count como SECURITY DEFINER para que el
--      contador de aciertos siga funcionando sin UPDATE público: solo puede
--      sumar 1 a hit_count, no tocar el texto.
--   Idempotente (DROP POLICY IF EXISTS / CREATE OR REPLACE).
--
-- ORDEN DE DESPLIEGUE (para no romper la traducción de perfiles)
--   1. supabase functions deploy translate-texts --no-verify-jwt
--   2. Esta migración.
--   3. Frontend (usa la Edge Function como proveedor preferente).
--   Entre 2 y 3 el frontend antiguo sigue traduciendo (Google/MyMemory desde el
--   navegador) y leyendo la caché; solo fallan, en silencio, sus escrituras.
--
-- CÓMO REVERTIR (NO recomendado: reabre el agujero)
--   CREATE POLICY "Anyone can insert text translations" ON public.text_translations
--     FOR INSERT WITH CHECK (true);
--   CREATE POLICY "Anyone can update text translations" ON public.text_translations
--     FOR UPDATE USING (true);
--   y volver a crear increment_translation_hit_count sin SECURITY DEFINER.
--
-- NOTA: las filas existentes pudieron ser manipuladas mientras la escritura
-- estuvo abierta. Si se quiere partir de una caché limpia (se volverá a llenar
-- sola, con coste de nuevas llamadas al traductor), ejecutar a mano:
--   TRUNCATE public.text_translations;
-- =============================================================================

BEGIN;

ALTER TABLE public.text_translations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert text translations" ON public.text_translations;
DROP POLICY IF EXISTS "Anyone can update text translations" ON public.text_translations;

-- Lectura pública (se recrea por si no existiera)
DROP POLICY IF EXISTS "Anyone can read text translations" ON public.text_translations;
CREATE POLICY "Anyone can read text translations"
  ON public.text_translations FOR SELECT
  USING (true);

-- Defensa en profundidad: sin privilegios de escritura para los roles públicos
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.text_translations FROM anon, authenticated;
GRANT SELECT ON public.text_translations TO anon, authenticated;

-- Contador de aciertos: solo incrementa hit_count
CREATE OR REPLACE FUNCTION public.increment_translation_hit_count(
  p_text_hash VARCHAR,
  p_source_lang VARCHAR,
  p_target_lang VARCHAR
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.text_translations
     SET hit_count = COALESCE(hit_count, 0) + 1
   WHERE text_hash = p_text_hash
     AND source_lang = p_source_lang
     AND target_lang = p_target_lang;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_translation_hit_count(VARCHAR, VARCHAR, VARCHAR) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_translation_hit_count(VARCHAR, VARCHAR, VARCHAR) TO anon, authenticated, service_role;

COMMIT;
