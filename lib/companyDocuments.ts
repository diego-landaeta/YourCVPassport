import { supabase } from '../supabase/client';

/** Bucket PRIVADO con la documentación fiscal y de verificación de empresas. */
export const COMPANY_DOCUMENTS_BUCKET = 'company-documents';
/** Bucket público para los logos de empresa. */
export const COMPANY_LOGOS_BUCKET = 'company-logos';

const PUBLIC_MARKER = `/storage/v1/object/public/${COMPANY_DOCUMENTS_BUCKET}/`;
const SIGNED_MARKER = `/storage/v1/object/sign/${COMPANY_DOCUMENTS_BUCKET}/`;

/**
 * Ruta del objeto dentro de `company-documents` a partir de lo guardado en
 * companies.tax_document_url / verification_document_url:
 *   - registros nuevos: la ruta tal cual ("tax-documents/<uid>/archivo.pdf");
 *   - registros antiguos: la URL pública de cuando el bucket era público.
 * Devuelve null si no es un documento de ese bucket.
 */
export function companyDocumentPath(stored: string | null | undefined): string | null {
  if (!stored) return null;
  for (const marker of [PUBLIC_MARKER, SIGNED_MARKER]) {
    const i = stored.indexOf(marker);
    if (i >= 0) {
      const rest = stored.slice(i + marker.length).split('?')[0];
      try {
        return decodeURIComponent(rest);
      } catch {
        return rest;
      }
    }
  }
  if (/^https?:\/\//i.test(stored)) return null;
  return stored.replace(/^\/+/, '');
}

/**
 * URL firmada (por defecto 1 hora) para ver un documento de empresa. Solo
 * funciona para quien lo subió, los miembros de su empresa y los admins
 * (políticas de storage.objects).
 */
export async function getCompanyDocumentSignedUrl(
  stored: string | null | undefined,
  expiresInSeconds = 3600,
): Promise<string | null> {
  const path = companyDocumentPath(stored);
  if (!path) return null;
  const { data, error } = await supabase.storage
    .from(COMPANY_DOCUMENTS_BUCKET)
    .createSignedUrl(path, expiresInSeconds);
  if (error || !data?.signedUrl) {
    console.error('No se pudo firmar el documento:', error?.message);
    return null;
  }
  return data.signedUrl;
}
