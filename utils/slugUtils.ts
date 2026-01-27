/**
 * Utility functions for creating clean, URL-safe slugs
 *
 * These functions ensure that all URLs are clean and don't contain
 * encoded characters like %20, %C3%B1, etc.
 */

/**
 * Sanitizes a string to create a clean, URL-safe slug
 *
 * This function:
 * - Converts to lowercase
 * - Removes accents and diacritical marks (á → a, é → e, ñ → n)
 * - Replaces spaces with hyphens
 * - Removes special characters
 * - Removes consecutive hyphens
 * - Trims leading/trailing hyphens
 *
 * @param text - The text to convert to a slug
 * @param maxLength - Maximum length of the slug (default: 50)
 * @returns Clean, URL-safe slug
 *
 * @example
 * sanitizeSlug("José García Pérez") // returns "jose-garcia-perez"
 * sanitizeSlug("María José Ñoño") // returns "maria-jose-nono"
 * sanitizeSlug("Full Stack Developer @ Company") // returns "full-stack-developer-company"
 */
export const sanitizeSlug = (text: string, maxLength: number = 50): string => {
  if (!text) return '';

  return text
    .toLowerCase()
    .normalize("NFD")                        // Descompone caracteres acentuados (é → e + ´)
    .replace(/[\u0300-\u036f]/g, "")        // Elimina marcas diacríticas (acentos, tildes, diéresis)
    .replace(/ñ/g, 'n')                     // Reemplaza ñ explícitamente por n
    .replace(/\s+/g, '-')                   // Reemplaza espacios con guiones
    .replace(/[^a-z0-9-]/g, '')             // Elimina caracteres especiales
    .replace(/--+/g, '-')                   // Elimina guiones consecutivos
    .replace(/^-+|-+$/g, '')                // Elimina guiones al inicio y final
    .substring(0, maxLength);               // Limita longitud
};

/**
 * Generates a slug from a full name only (no headline)
 *
 * @param fullName - The person's full name
 * @returns Generated slug from name only
 *
 * @example
 * generateProfileSlug("José García")
 * // returns "jose-garcia"
 */
export const generateProfileSlug = (fullName: string): string => {
  if (!fullName) return '';

  return sanitizeSlug(fullName, 50);
};

/**
 * Generates a unique slug by adding a numeric suffix if needed
 *
 * @param baseSlug - The base slug to check
 * @param existingSlugs - Array of existing slugs to check against
 * @returns Unique slug with numeric suffix if needed
 *
 * @example
 * generateUniqueSlug("jose-garcia", ["jose-garcia"])
 * // returns "jose-garcia-2"
 */
export const generateUniqueSlug = (baseSlug: string, existingSlugs: string[]): string => {
  if (!existingSlugs.includes(baseSlug)) {
    return baseSlug;
  }

  let counter = 2;
  let uniqueSlug = `${baseSlug}-${counter}`;

  while (existingSlugs.includes(uniqueSlug)) {
    counter++;
    uniqueSlug = `${baseSlug}-${counter}`;
  }

  return uniqueSlug;
};

/**
 * Validates if a slug meets the requirements
 *
 * @param slug - The slug to validate
 * @returns Object with isValid boolean and optional error message
 *
 * @example
 * validateSlugFormat("jose-garcia") // { isValid: true }
 * validateSlugFormat("ab") // { isValid: false, error: "Minimum 3 characters" }
 * validateSlugFormat("josé") // { isValid: false, error: "Contains invalid characters" }
 */
export const validateSlugFormat = (slug: string): { isValid: boolean; error?: string } => {
  if (!slug) {
    return { isValid: false, error: 'Slug is required' };
  }

  if (slug.length < 3) {
    return { isValid: false, error: 'Minimum 3 characters required' };
  }

  if (slug.length > 50) {
    return { isValid: false, error: 'Maximum 50 characters allowed' };
  }

  // Check if slug contains only lowercase letters, numbers, and hyphens
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return { isValid: false, error: 'Only lowercase letters, numbers, and hyphens allowed' };
  }

  // Check if slug starts or ends with hyphen
  if (/^-|-$/.test(slug)) {
    return { isValid: false, error: 'Cannot start or end with hyphen' };
  }

  // Check for consecutive hyphens
  if (/--/.test(slug)) {
    return { isValid: false, error: 'Cannot contain consecutive hyphens' };
  }

  return { isValid: true };
};

/**
 * Checks if a slug is available in the database
 *
 * @param slug - The slug to check
 * @param currentUserId - Current user ID to exclude from check
 * @returns True if available, false if taken
 */
export const checkSlugAvailability = async (
  slug: string,
  currentUserId?: string
): Promise<boolean> => {
  const { supabase } = await import('../supabase/client');

  const query = supabase
    .from('profiles')
    .select('id')
    .eq('slug', slug);

  if (currentUserId) {
    query.neq('id', currentUserId);
  }

  const { data, error } = await query.single();

  // If error is PGRST116, it means no rows found (slug is available)
  if (error && error.code === 'PGRST116') {
    return true;
  }

  // If there's data, slug is taken
  return !data;
};

/**
 * Common test cases and examples for URL slug generation
 */
export const SLUG_EXAMPLES = {
  // Spanish names with accents
  'José García': 'jose-garcia',
  'María José Pérez': 'maria-jose-perez',
  'Ángel López': 'angel-lopez',

  // Duplicate handling
  'John Doe (first)': 'john-doe',
  'John Doe (second)': 'john-doe-2',
  'John Doe (third)': 'john-doe-3',

  // Edge cases
  'Ñoño': 'nono',
  'François': 'francois',
  'São Paulo': 'sao-paulo',

  // Multiple spaces and punctuation
  'John   Doe...': 'john-doe',
  'Jane-Doe': 'jane-doe',
  'Mike_Smith': 'mike-smith',
};
