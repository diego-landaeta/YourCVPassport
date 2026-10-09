// Columnas de `profiles` legibles por anon/authenticated (privilegios por columna,
// migración 20261006_cerrar_columnas_privadas_profiles_stamps.sql).
// Copia de lib/publicProfileColumns.ts del frontend: mantener sincronizadas.
// Con la anon key o el JWT de un usuario, `select('*')` sobre profiles falla con
// 42501; usar esta lista. Para el perfil propio completo: vista `profiles_full`.

export const PUBLIC_PROFILE_COLUMN_LIST = [
  'id', 'full_name', 'name', 'headline', 'summary', 'slug', 'handle', 'title',
  'meta_title', 'meta_description', 'template', 'template_color', 'availability',
  'location', 'country_code', 'gender', 'avatar_url', 'banner_url', 'linkedin_url',
  'github_url', 'portfolio_url', 'website_url', 'twitter_url', 'instagram_url',
  'youtube_url', 'behance_url', 'dribbble_url', 'job_seeking_status', 'job_type',
  'open_to_remote', 'remote', 'remote_preference', 'work_mode',
  'willing_to_relocate', 'preferred_locations', 'show_verified_credentials',
  'show_connect_links', 'show_qr_code', 'show_availability_badge',
  'is_open_to_messages', 'wizard_completed', 'is_premium', 'is_active',
  'profile_hidden', 'role', 'created_at', 'updated_at',
] as const

export const PUBLIC_PROFILE_COLUMNS = PUBLIC_PROFILE_COLUMN_LIST.join(', ')
