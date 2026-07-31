-- ============================================================================
-- Normalizar la plantilla heredada 'modern' a 'passport'
-- Fecha: 2026-07-31
--
-- DIAGNOSTICO (verificado contra la base de datos)
--
--   Reparto de profiles.template:
--     passport   74 perfiles  (ISEIE, PsikoAprende y el resto)
--     modern     22 perfiles  (19 de ellos gestionados)
--     classic     2 perfiles
--
--   'modern' es un identificador heredado: no aparece en la lista de plantillas
--   validas, ni en el switch de ProfileViewPage, ni en StandardTemplateLoader.
--   Tampoco corresponde a ninguna de las tres tarjetas del paso de Finalizacion
--   del wizard, que ofrecen passport, classic y creative.
--
--   Consecuencia real: el switch de ProfileViewPage no tiene case 'modern', asi
--   que esos perfiles caen al default y se renderizan con ClassicTemplate. Los
--   19 tutores gestionados se estaban viendo con una plantilla distinta a los
--   otros 74, y por accidente, no por eleccion de nadie.
--
--   Efecto secundario: al abrir el paso de Finalizacion sobre uno de ellos,
--   ninguna tarjeta aparece seleccionada, porque 'modern' no es ninguno de los
--   tres ids ofrecidos.
--
-- QUE HACE
--   Pasa los perfiles GESTIONADOS de 'modern' a 'passport', que es la plantilla
--   que usa el resto del catalogo.
--
--   OJO: esto SI cambia el aspecto de sus fichas publicas. Pasan de renderizarse
--   con ClassicTemplate (por el default) a PassportTemplate. Es el cambio
--   buscado: alinearlos con los demas.
--
-- ALCANCE
--   Solo perfiles con managed_by no nulo. Los 3 perfiles con 'modern' que NO
--   son gestionados pertenecen a otros usuarios y quedan fuera a proposito:
--   cambiar como se ve la ficha de alguien sin que lo pida es otra decision.
--   Siguen afectados por el mismo fallo de renderizado.
--
-- ROLLBACK
--   UPDATE public.profiles SET template = 'modern'
--   WHERE managed_by IS NOT NULL AND template = 'passport';
--   (solo valido inmediatamente despues, antes de crear perfiles nuevos)
-- ============================================================================

UPDATE public.profiles
SET template = 'passport'
WHERE managed_by IS NOT NULL
  AND template = 'modern';

-- Comprobacion: deberia devolver 0 filas.
-- SELECT count(*) FROM public.profiles
--  WHERE managed_by IS NOT NULL AND template = 'modern';
