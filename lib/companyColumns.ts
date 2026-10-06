/**
 * Columnas de `companies`.
 *
 * Desde la migración 20261009b_cerrar_columnas_privadas_companies.sql la tabla
 * `companies` tiene privilegios por columna: anon y authenticated solo pueden
 * leer PUBLIC_COMPANY_COLUMN_LIST. Pedir cualquier otra columna (o
 * `select('*')`) a `companies` falla con 42501 (permission denied).
 *
 * - Lecturas públicas (embeds desde ofertas y candidaturas): solo estas
 *   columnas, contra `companies`. Los counts, con `select('id', { head: true })`.
 * - Miembros, creador y admin: `supabase.from('companies_full')` (vista con
 *   todas las columnas, solo filas permitidas) con COMPANY_FULL_COLUMNS.
 * - Las escrituras siguen yendo a `companies`; un insert/update encadenado con
 *   `.select()` solo puede pedir columnas públicas.
 *
 * Mantener sincronizado con `v_public` de esa migración.
 */
export const PUBLIC_COMPANY_COLUMN_LIST = ['id', 'company_name', 'logo_url'] as const;

/**
 * Columnas del tipo `Company` (types.ts), para leer de `companies_full`.
 * Escrita como literal para que supabase-js pueda inferir el tipo de las filas.
 */
export const COMPANY_FULL_COLUMNS =
  'id, created_at, updated_at, company_name, legal_name, tax_id, company_email, company_phone, website_url, address_street, address_city, address_state, address_country, address_postal, industry, company_size, description, logo_url, tax_document_url, verification_document_url, status, verified_at, verified_by, rejection_reason, admin_notes, credit_balance, total_credits_purchased, total_credits_used, signup_ip, last_login_at, metadata' as const;
