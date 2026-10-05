-- =============================================================================
-- Storage: bucket `company-documents` privado + bucket público `company-logos`
-- =============================================================================
--
-- PROBLEMA (seguridad, auditoría 2026-10-05, A3)
--   20251230_create_company_storage.sql creó `company-documents` como bucket
--   PÚBLICO. El registro de empresa (components/company/CompanyRegistrationPage.tsx)
--   sube ahí la documentación fiscal (tax-documents/) y de verificación
--   (verification-documents/) y guarda su URL pública en companies:
--     - cualquiera con la URL descarga el documento, sin sesión;
--     - la política SELECT "TO public" además deja LISTAR el bucket con la API
--       de storage (las rutas son enumerables);
--     - UPDATE y DELETE se permitían a cualquier authenticated sobre cualquier
--       archivo del bucket (sin comprobar propietario).
--
-- QUÉ HACE
--   1. `company-documents` pasa a privado (public = false): la URL
--      /object/public/company-documents/... deja de servir archivos.
--   2. Políticas nuevas en storage.objects para `company-documents`
--      (se eliminan las 4 de 20251230_create_company_storage.sql):
--        Ruta nueva: <tipo>/<auth.uid() de quien sube>/<archivo>
--          tipo = tax-documents | verification-documents
--        - INSERT: authenticated, solo en su propia carpeta y solo esos tipos.
--        - SELECT: quien subió el archivo, los miembros de su empresa
--          (company_users: comparten company_id con quien subió) y los admins.
--        - UPDATE / DELETE: quien subió el archivo y los admins.
--      Archivos antiguos (tax-documents/<archivo>, sin carpeta de usuario):
--      solo los admins pueden leerlos (vía URL firmada).
--   3. Bucket nuevo `company-logos` PÚBLICO (los logos se muestran en ofertas y
--      búsqueda), solo imágenes PNG/JPEG de hasta 10 MB. Subida en
--      <auth.uid()>/<archivo>; leer (API)/modificar/borrar: quien subió o
--      admin. La URL pública funciona sin política SELECT; anon no puede
--      listar el bucket.
--   4. Helper public.shares_company_with(text): SECURITY DEFINER, ¿el usuario
--      actual pertenece a la misma empresa que el usuario indicado?
--      (Se usa en la política; evita depender de la RLS de company_users.)
--   El frontend nuevo:
--     - sube los logos a company-logos y los documentos a
--       company-documents/<tipo>/<uid>/..., y guarda en companies la RUTA del
--       documento (no una URL pública);
--     - el panel de admin (CompanyManagementSection) abre los documentos con
--       createSignedUrl (1 hora). Acepta también las URLs públicas antiguas:
--       extrae la ruta y firma.
--
-- IMPORTANTE
--   - Hasta aplicar esta migración, los documentos ya subidos siguen
--     accesibles (y listables) por URL pública. Después, solo con URL firmada.
--     Lo que se haya descargado antes no se puede recuperar: valorar si alguna
--     empresa debe ser avisada.
--   - Logos subidos antes a company-documents/logos/...: su URL pública deja
--     de funcionar al hacer el bucket privado. Se pueden volver a subir desde
--     el registro, o moverlos a company-logos desde el dashboard de Storage y
--     actualizar companies.logo_url. Para verlos antes de aplicar:
--       select name, created_at from storage.objects
--        where bucket_id = 'company-documents' order by name;
--       select id, company_name, logo_url from public.companies
--        where logo_url like '%/company-documents/%';
--
-- ORDEN DE DESPLIEGUE
--   1. Frontend nuevo.
--   2. Esta migración.
--   Entre 1 y 2: los documentos nuevos se suben a la carpeta del usuario
--   (las políticas antiguas lo permiten) y se guardan como ruta; los logos
--   nuevos fallan en silencio (el bucket company-logos aún no existe; el
--   registro continúa sin logo). Si se aplica antes del frontend: el registro
--   antiguo falla al subir documentos (tax-documents/<archivo> no es carpeta
--   del usuario).
--
-- CÓMO REVERTIR (reabre A3)
--   UPDATE storage.buckets SET public = true WHERE id = 'company-documents';
--   y volver a ejecutar 20251230_create_company_storage.sql (políticas).
--
-- Idempotente.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- Helpers (current_user_is_admin también está en 20261005_proteger_datos_profiles.sql;
-- misma definición, para que esta migración no dependa del orden)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_user_is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT lower(p.role) = 'admin' FROM public.profiles p WHERE p.id = auth.uid()),
    false
  );
$$;
REVOKE ALL ON FUNCTION public.current_user_is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_user_is_admin() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.shares_company_with(p_user_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.company_users a
    JOIN public.company_users b ON b.company_id = a.company_id
    WHERE a.user_id = auth.uid()
      AND b.user_id::text = p_user_id
  );
$$;
REVOKE ALL ON FUNCTION public.shares_company_with(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.shares_company_with(text) TO authenticated, service_role;

COMMENT ON FUNCTION public.shares_company_with(text) IS
'true si auth.uid() pertenece a alguna empresa (company_users) de la que también es miembro el usuario indicado.';

-- -----------------------------------------------------------------------------
-- 1. Bucket de documentos privado
-- -----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-documents', 'company-documents', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- -----------------------------------------------------------------------------
-- 2. Políticas de company-documents
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can upload company documents" ON storage.objects;
DROP POLICY IF EXISTS "Public read access to company documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their company documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their company documents" ON storage.objects;

DROP POLICY IF EXISTS "company-documents: subir en carpeta propia" ON storage.objects;
CREATE POLICY "company-documents: subir en carpeta propia"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'company-documents'
    AND (storage.foldername(name))[1] IN ('tax-documents', 'verification-documents')
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

DROP POLICY IF EXISTS "company-documents: leer empresa propia o admin" ON storage.objects;
CREATE POLICY "company-documents: leer empresa propia o admin"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'company-documents'
    AND (
      (storage.foldername(name))[2] = auth.uid()::text
      OR public.shares_company_with((storage.foldername(name))[2])
      OR public.current_user_is_admin()
    )
  );

DROP POLICY IF EXISTS "company-documents: modificar propios o admin" ON storage.objects;
CREATE POLICY "company-documents: modificar propios o admin"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'company-documents'
    AND ((storage.foldername(name))[2] = auth.uid()::text OR public.current_user_is_admin())
  )
  WITH CHECK (
    bucket_id = 'company-documents'
    AND ((storage.foldername(name))[2] = auth.uid()::text OR public.current_user_is_admin())
  );

DROP POLICY IF EXISTS "company-documents: borrar propios o admin" ON storage.objects;
CREATE POLICY "company-documents: borrar propios o admin"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'company-documents'
    AND ((storage.foldername(name))[2] = auth.uid()::text OR public.current_user_is_admin())
  );

-- -----------------------------------------------------------------------------
-- 3. Bucket público para logos
-- -----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('company-logos', 'company-logos', true, 10485760, ARRAY['image/png', 'image/jpeg'])
ON CONFLICT (id) DO UPDATE
  SET public = true,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "company-logos: subir en carpeta propia" ON storage.objects;
CREATE POLICY "company-logos: subir en carpeta propia"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'company-logos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- SELECT solo de la carpeta propia: hace falta para que la subida (INSERT ...
-- RETURNING) pase la RLS. No abre el listado público del bucket.
DROP POLICY IF EXISTS "company-logos: leer propios o admin" ON storage.objects;
CREATE POLICY "company-logos: leer propios o admin"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'company-logos'
    AND ((storage.foldername(name))[1] = auth.uid()::text OR public.current_user_is_admin())
  );

DROP POLICY IF EXISTS "company-logos: modificar propios o admin" ON storage.objects;
CREATE POLICY "company-logos: modificar propios o admin"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'company-logos'
    AND ((storage.foldername(name))[1] = auth.uid()::text OR public.current_user_is_admin())
  )
  WITH CHECK (
    bucket_id = 'company-logos'
    AND ((storage.foldername(name))[1] = auth.uid()::text OR public.current_user_is_admin())
  );

DROP POLICY IF EXISTS "company-logos: borrar propios o admin" ON storage.objects;
CREATE POLICY "company-logos: borrar propios o admin"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'company-logos'
    AND ((storage.foldername(name))[1] = auth.uid()::text OR public.current_user_is_admin())
  );

COMMIT;
