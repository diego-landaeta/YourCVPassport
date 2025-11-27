/**
 * Handle/Slug Validation Utilities
 * Sistema de validación para handles personalizados de usuarios
 */

// Palabras reservadas que no pueden ser usadas como handles
export const RESERVED_HANDLES = [
  'admin',
  'api',
  'auth',
  'login',
  'logout',
  'signup',
  'signin',
  'dashboard',
  'settings',
  'profile',
  'user',
  'users',
  'account',
  'accounts',
  'about',
  'help',
  'support',
  'contact',
  'privacy',
  'terms',
  'tos',
  'careers',
  'jobs',
  'blog',
  'news',
  'static',
  'assets',
  'public',
  'www',
  'ftp',
  'mail',
  'smtp',
  'pop',
  'imap',
  'root',
  'system',
  'test',
  'demo',
  'example',
  'sample',
  'null',
  'undefined',
  'true',
  'false',
  'cv',
  'cvs',
  'passport',
  'passports',
  'yourcvpassport',
];

// Configuración de validación
export const HANDLE_CONSTRAINTS = {
  MIN_LENGTH: 3,
  MAX_LENGTH: 30,
  PATTERN: /^[a-z0-9-]+$/,
  PATTERN_WITH_FLAGS: /^[a-zA-Z0-9-]+$/,
  NO_CONSECUTIVE_HYPHENS: /--/,
  NO_LEADING_TRAILING_HYPHEN: /^-|-$/,
};

export interface HandleValidationResult {
  isValid: boolean;
  error?: string;
  suggestions?: string[];
}

/**
 * Valida un handle según las reglas establecidas
 */
export function validateHandle(handle: string): HandleValidationResult {
  // Normalizar a minúsculas
  const normalizedHandle = handle.toLowerCase().trim();

  // Verificar longitud mínima
  if (normalizedHandle.length < HANDLE_CONSTRAINTS.MIN_LENGTH) {
    return {
      isValid: false,
      error: `Handle must be at least ${HANDLE_CONSTRAINTS.MIN_LENGTH} characters long`,
    };
  }

  // Verificar longitud máxima
  if (normalizedHandle.length > HANDLE_CONSTRAINTS.MAX_LENGTH) {
    return {
      isValid: false,
      error: `Handle must be no more than ${HANDLE_CONSTRAINTS.MAX_LENGTH} characters long`,
    };
  }

  // Verificar patrón (solo alfanuméricos y guiones)
  if (!HANDLE_CONSTRAINTS.PATTERN.test(normalizedHandle)) {
    return {
      isValid: false,
      error: 'Handle can only contain lowercase letters, numbers, and hyphens',
    };
  }

  // Verificar guiones consecutivos
  if (HANDLE_CONSTRAINTS.NO_CONSECUTIVE_HYPHENS.test(normalizedHandle)) {
    return {
      isValid: false,
      error: 'Handle cannot contain consecutive hyphens',
    };
  }

  // Verificar guiones al inicio o final
  if (HANDLE_CONSTRAINTS.NO_LEADING_TRAILING_HYPHEN.test(normalizedHandle)) {
    return {
      isValid: false,
      error: 'Handle cannot start or end with a hyphen',
    };
  }

  // Verificar palabras reservadas
  if (RESERVED_HANDLES.includes(normalizedHandle)) {
    return {
      isValid: false,
      error: 'This handle is reserved and cannot be used',
      suggestions: generateHandleSuggestions(normalizedHandle),
    };
  }

  return {
    isValid: true,
  };
}

/**
 * Genera sugerencias de handles alternativos
 */
export function generateHandleSuggestions(baseHandle: string, count: number = 5): string[] {
  const normalizedBase = baseHandle.toLowerCase().trim();
  const suggestions: string[] = [];

  // Sugerencias con números
  for (let i = 1; i <= count; i++) {
    suggestions.push(`${normalizedBase}${Math.floor(Math.random() * 999) + 1}`);
  }

  // Sugerencias con sufijos comunes
  const suffixes = ['pro', 'official', 'cv', 'work', 'portfolio'];
  suffixes.slice(0, count - 3).forEach(suffix => {
    if (suggestions.length < count) {
      suggestions.push(`${normalizedBase}-${suffix}`);
    }
  });

  // Sugerencias con año actual
  const currentYear = new Date().getFullYear();
  if (suggestions.length < count) {
    suggestions.push(`${normalizedBase}${currentYear}`);
  }

  return suggestions.slice(0, count);
}

/**
 * Normaliza un string para convertirlo en un handle válido
 */
export function normalizeToHandle(input: string): string {
  return input
    .toLowerCase()
    .trim()
    // Reemplazar espacios y caracteres especiales con guiones
    .replace(/[^a-z0-9-]/g, '-')
    // Eliminar guiones consecutivos
    .replace(/--+/g, '-')
    // Eliminar guiones al inicio y final
    .replace(/^-|-$/g, '')
    // Limitar longitud
    .substring(0, HANDLE_CONSTRAINTS.MAX_LENGTH);
}

/**
 * Verifica si un handle está disponible en la base de datos
 * Esta función debe ser llamada desde el backend/API
 */
export async function checkHandleAvailability(
  handle: string,
  supabase: any,
  currentUserId?: string
): Promise<{ available: boolean; error?: string }> {
  try {
    const normalizedHandle = handle.toLowerCase().trim();

    // Validar formato
    const validation = validateHandle(normalizedHandle);
    if (!validation.isValid) {
      return { available: false, error: validation.error };
    }

    // Verificar en la base de datos
    const { data, error } = await supabase
      .from('profiles')
      .select('id, slug')
      .eq('slug', normalizedHandle)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 es el código cuando no se encuentra ningún resultado
      throw error;
    }

    // Si se encuentra un perfil y no es el usuario actual
    if (data && data.id !== currentUserId) {
      return { available: false, error: 'This handle is already taken' };
    }

    return { available: true };
  } catch (error: any) {
    
    return { available: false, error: 'Error checking handle availability' };
  }
}
