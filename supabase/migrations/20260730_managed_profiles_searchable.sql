-- ============================================================================
-- Perfiles gestionados invisibles en la busqueda de talento
-- Fecha: 2026-07-30
--
-- SINTOMA
--   Los perfiles creados desde /manager no aparecen en la busqueda de talento
--   de empresas, aunque esten publicados y con ficha publica accesible.
--
-- CAUSA (verificada contra el proyecto)
--   components/talent-search/CompanyTalentSearchPage.tsx:204 filtra por
--     .eq('wizard_completed', true)
--   y los 19 perfiles gestionados actuales tienen:
--     slug              -> 19 de 19  OK
--     template          -> 19 de 19  OK
--     headline          -> 19 de 19  OK
--     wizard_completed  ->  0 de 19  <-- unico bloqueante
--
--   La columna se creo con DEFAULT FALSE en 20260109_add_wizard_completed.sql,
--   y la Edge Function admin-create-managed-profile nunca la fija: el gestor
--   rellena el perfil pero no pasa por el paso de Finalizacion del wizard, que
--   es el unico sitio que la pone a TRUE.
--
--   Aquella migracion ya hizo exactamente este backfill para los usuarios que
--   existian entonces:
--     UPDATE profiles SET wizard_completed = TRUE
--     WHERE template IS NOT NULL AND slug IS NOT NULL;
--   Los perfiles gestionados se crearon despues, asi que se lo perdieron.
--
-- QUE HACE
--   Aplica el mismo criterio a los perfiles gestionados que ya cumplen los
--   requisitos de la busqueda. No inventa un criterio nuevo.
-- ============================================================================

UPDATE public.profiles
SET wizard_completed = TRUE
WHERE managed_by IS NOT NULL
  AND wizard_completed IS DISTINCT FROM TRUE
  AND slug IS NOT NULL
  AND template IS NOT NULL
  AND full_name IS NOT NULL AND full_name <> ''
  AND headline IS NOT NULL AND headline <> '';

-- Comprobacion: deberia devolver 0 filas despues de aplicar.
-- SELECT count(*) FROM public.profiles
--  WHERE managed_by IS NOT NULL AND wizard_completed IS DISTINCT FROM TRUE
--    AND slug IS NOT NULL AND template IS NOT NULL;

-- ============================================================================
-- PENDIENTE, NO LO RESUELVE ESTA MIGRACION
--
-- 1. Perfiles gestionados FUTUROS volveran a nacer con wizard_completed = FALSE
--    y desapareceran de la busqueda igual. Hay dos formas de cerrarlo:
--      a) que ManagedProfileEditor marque wizard_completed al guardar un perfil
--         que ya tiene slug + template (equivalente a finalizar el wizard), o
--      b) que la busqueda deje de usar wizard_completed como proxy de "perfil
--         completo" y filtre por los campos reales (slug + template + headline).
--    La (b) es mas honesta: hoy la busqueda depende de una bandera que solo
--    escribe una pantalla concreta.
--
-- 2. CompanyTalentSearchPage.tsx:146 consulta .eq('is_public', true) para
--    construir el filtro de ubicaciones, pero profiles NO tiene columna
--    is_public: esa consulta devuelve 400 y el desplegable de ubicaciones se
--    queda vacio en silencio. Bug independiente de este.
-- ============================================================================
