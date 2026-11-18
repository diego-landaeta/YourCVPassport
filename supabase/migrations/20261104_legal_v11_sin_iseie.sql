-- =============================================================================
-- 20261104_legal_v11_sin_iseie.sql
-- Publica la versión 1.1 de los textos legales que en la 1.0 nombraban a ISEIE como
-- titular o responsable. YourCVPassport es un proyecto propio: la 1.1 es la 1.0 con
-- esa frase cambiada por «YourCVPassport (yourcvpassport.com)». Nada más cambia.
--
-- Por qué una versión nueva y no un UPDATE: una versión en vigor es inmutable
-- (trg_documentos_legales_proteger), es lo que firmó cada usuario.
--
-- Cómo: entra en vigor ya (publicación urgente del servicio: app.legal_urgente) y
-- NO encola el correo de aviso (no llama a legal_encolar_aviso). Quien tenga
-- aceptada la 1.0 verá la 1.1 pendiente de aceptar en la app, como con cualquier
-- versión nueva.
--
-- Se ejecuta entero en el SQL Editor de Supabase. Reaplicable: si la 1.1 ya
-- existe no inserta nada. Aborta (y no deja nada a medias) si después queda algún
-- texto en vigor que nombre a ISEIE.
--
-- Comprobación:
--   SELECT tipo, idioma, version FROM public.documentos_legales
--    WHERE public.documento_legal_vigente(id) ORDER BY 1, 2;
--   SELECT count(*) FROM public.documentos_legales
--    WHERE public.documento_legal_vigente(id) AND texto ILIKE '%iseie%';   -- 0
-- Vuelta atrás (solo antes de que alguien la acepte; luego es inmutable):
--   no hay: se publica otra versión.
-- =============================================================================
BEGIN;

SELECT set_config('request.jwt.claims', '{"role":"service_role"}', true);
SELECT set_config('request.jwt.claim.role', 'service_role', true);
SELECT set_config('app.legal_urgente', 'on', true);

INSERT INTO public.documentos_legales
  (tipo, version, idioma, titulo, texto, audiencia, requiere_aceptacion, casillas_obligatorias, borrador, vigente_desde)
SELECT d.tipo, '1.1', d.idioma, d.titulo,
  CASE
    WHEN d.tipo = 'terminos_candidato' AND d.idioma = 'es' THEN replace(d.texto, '1. Titular. YourCVPassport es un servicio de ISEIE Innovation School, S.L. (CIF B67799247), Av. Aragón 30, 5º, 46021 Valencia. Contacto: support@yourcvpassport.com.', '1. Titular. YourCVPassport (yourcvpassport.com). Contacto: support@yourcvpassport.com.')
    WHEN d.tipo = 'terminos_candidato' AND d.idioma = 'en' THEN replace(d.texto, '1. Provider. YourCVPassport is a service of ISEIE Innovation School, S.L. (tax ID B67799247), Av. Aragón 30, 5º, 46021 Valencia, Spain. Contact: support@yourcvpassport.com.', '1. Provider. YourCVPassport (yourcvpassport.com). Contact: support@yourcvpassport.com.')
    WHEN d.tipo = 'terminos_empleador' AND d.idioma = 'es' THEN replace(d.texto, '1. Titular. YourCVPassport es un servicio de ISEIE Innovation School, S.L. (CIF B67799247), Av. Aragón 30, 5º, 46021 Valencia. Contacto: support@yourcvpassport.com.', '1. Titular. YourCVPassport (yourcvpassport.com). Contacto: support@yourcvpassport.com.')
    WHEN d.tipo = 'terminos_empleador' AND d.idioma = 'en' THEN replace(d.texto, '1. Provider. YourCVPassport is a service of ISEIE Innovation School, S.L. (tax ID B67799247), Av. Aragón 30, 5º, 46021 Valencia, Spain. Contact: support@yourcvpassport.com.', '1. Provider. YourCVPassport (yourcvpassport.com). Contact: support@yourcvpassport.com.')
    WHEN d.tipo = 'privacidad' AND d.idioma = 'es' THEN replace(d.texto, 'Responsable: ISEIE Innovation School, S.L. (CIF B67799247), Av. Aragón 30, 5º, 46021 Valencia. Contacto y ejercicio de derechos: support@yourcvpassport.com.', 'Responsable: YourCVPassport (yourcvpassport.com). Contacto y ejercicio de derechos: support@yourcvpassport.com.')
    WHEN d.tipo = 'privacidad' AND d.idioma = 'en' THEN replace(d.texto, 'Controller: ISEIE Innovation School, S.L. (tax ID B67799247), Av. Aragón 30, 5º, 46021 Valencia, Spain. Contact and exercise of rights: support@yourcvpassport.com.', 'Controller: YourCVPassport (yourcvpassport.com). Contact and exercise of rights: support@yourcvpassport.com.')
    WHEN d.tipo = 'condiciones_publicacion' AND d.idioma = 'es' THEN replace(d.texto, '1. Quién publica. Estas condiciones las acepta quien publica ofertas en nombre de una empresa verificada en YourCVPassport (servicio de ISEIE Innovation School, S.L.). Contacto: support@yourcvpassport.com.', '1. Quién publica. Estas condiciones las acepta quien publica ofertas en nombre de una empresa verificada en YourCVPassport. Contacto: support@yourcvpassport.com.')
    WHEN d.tipo = 'condiciones_publicacion' AND d.idioma = 'en' THEN replace(d.texto, '1. Who publishes. These terms are accepted by whoever posts job offers on behalf of a verified company on YourCVPassport (a service of ISEIE Innovation School, S.L.). Contact: support@yourcvpassport.com.', '1. Who publishes. These terms are accepted by whoever posts job offers on behalf of a verified company on YourCVPassport. Contact: support@yourcvpassport.com.')
  END,
  d.audiencia, d.requiere_aceptacion, d.casillas_obligatorias, d.borrador, now()
FROM public.documentos_legales d
WHERE d.version = '1.0'
  AND (d.tipo, d.idioma) IN (('terminos_candidato', 'es'), ('terminos_candidato', 'en'), ('terminos_empleador', 'es'), ('terminos_empleador', 'en'), ('privacidad', 'es'), ('privacidad', 'en'), ('condiciones_publicacion', 'es'), ('condiciones_publicacion', 'en'))
ON CONFLICT (tipo, version, idioma) DO NOTHING;

DO $$
DECLARE n int;
BEGIN
  SELECT count(*) INTO n FROM public.documentos_legales d
   WHERE public.documento_legal_vigente(d.id) AND d.texto ILIKE '%iseie%';
  IF n > 0 THEN
    RAISE EXCEPTION 'ABORTADO: quedan % textos en vigor que nombran a ISEIE', n;
  END IF;
END $$;

SELECT set_config('app.legal_urgente', 'off', true);

COMMIT;

SELECT tipo, idioma, version, vigente_desde
  FROM public.documentos_legales
 WHERE public.documento_legal_vigente(id)
 ORDER BY tipo, idioma;
