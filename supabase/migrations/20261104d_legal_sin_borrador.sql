-- 20261104d_legal_sin_borrador.sql
-- Quita la marca «borrador» (el aviso «pendiente de revisión por un abogado») de los textos
-- legales en vigor. borrador no está protegido por trg_documentos_legales_proteger: no cambia
-- lo que el usuario acepta, solo el aviso que se pinta encima. Aplicada en producción el 04/11/2026.
UPDATE public.documentos_legales SET borrador = false
 WHERE public.documento_legal_vigente(id) AND borrador;
