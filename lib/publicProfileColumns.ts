/**
 * Columnas de `profiles` que pueden leer anon y authenticated.
 *
 * Desde la migración 20261006_cerrar_columnas_privadas_profiles_stamps.sql la
 * tabla `profiles` tiene privilegios por columna: pedir cualquier otra columna
 * (o `select('*')`) a `profiles` falla con 42501 (permission denied).
 *
 * - Lecturas públicas (CV público, comunidad, feed, búsqueda de talento, SEO):
 *   `supabase.from('profiles').select(PUBLIC_PROFILE_COLUMNS)` o un subconjunto.
 * - Perfil propio, perfiles gestionados (gestor) y panel de admin:
 *   `supabase.from('profiles_full')` (vista con todas las columnas, solo filas
 *   permitidas). Las escrituras siguen yendo a `profiles`.
 *
 * Mantener sincronizado con la lista `v_public` de esa migración y con
 * supabase/functions/_shared/publicProfileColumns.ts.
 */
export const PUBLIC_PROFILE_COLUMN_LIST = [
  'id',
  'full_name',
  'name',
  'headline',
  'summary',
  'slug',
  'handle',
  'title',
  'meta_title',
  'meta_description',
  'template',
  'template_color',
  'availability',
  'location',
  'country_code',
  'gender',
  'avatar_url',
  'banner_url',
  'linkedin_url',
  'github_url',
  'portfolio_url',
  'website_url',
  'twitter_url',
  'instagram_url',
  'youtube_url',
  'behance_url',
  'dribbble_url',
  'job_seeking_status',
  'job_type',
  'open_to_remote',
  'remote',
  'remote_preference',
  'work_mode',
  'willing_to_relocate',
  'preferred_locations',
  'show_verified_credentials',
  'show_connect_links',
  'show_qr_code',
  'show_availability_badge',
  'is_open_to_messages',
  'wizard_completed',
  'is_premium',
  'is_active',
  'profile_hidden',
  'role',
  'created_at',
  'updated_at',
] as const;

export type PublicProfileColumn = (typeof PUBLIC_PROFILE_COLUMN_LIST)[number];

/**
 * Lista lista para `.select(...)`. Escrita como literal (no con .join) para que
 * supabase-js pueda inferir el tipo de las filas. Debe coincidir con
 * PUBLIC_PROFILE_COLUMN_LIST (lo comprueba tests/qa/privacidad.local.spec.ts).
 */
export const PUBLIC_PROFILE_COLUMNS =
  'id, full_name, name, headline, summary, slug, handle, title, meta_title, meta_description, template, template_color, availability, location, country_code, gender, avatar_url, banner_url, linkedin_url, github_url, portfolio_url, website_url, twitter_url, instagram_url, youtube_url, behance_url, dribbble_url, job_seeking_status, job_type, open_to_remote, remote, remote_preference, work_mode, willing_to_relocate, preferred_locations, show_verified_credentials, show_connect_links, show_qr_code, show_availability_badge, is_open_to_messages, wizard_completed, is_premium, is_active, profile_hidden, role, created_at, updated_at' as const;

/** Columnas que solo se leen desde `profiles_full` (o con service_role). */
export const PRIVATE_PROFILE_COLUMN_LIST = [
  'email',
  'phone',
  'plan',
  'salary_min',
  'salary_max',
  'salary_currency',
  'managed_by',
  'suspension_reason',
  'suspended_until',
  'search_blocked',
  'messages_blocked',
  'slug_validation_error',
  'last_slug_changed_at',
  'dashboard_tour_completed',
  'first_login_completed',
] as const;

/** Columnas públicas de un sello (vista `public_stamps`). */
export const PUBLIC_STAMP_COLUMNS =
  'id, profile_id, type, status, provider, created_at, verified_at, expires_at, entity_id, entity_type, metadata' as const;
