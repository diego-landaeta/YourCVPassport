import { supabase } from '../supabase/client';

/**
 * Calculate days remaining until slug can be changed again
 * @param lastChangedAt - The timestamp when slug was last changed
 * @returns Number of days remaining (0 if can change now)
 */
export const calculateDaysUntilSlugChange = (lastChangedAt: string | null): number => {
  if (!lastChangedAt) return 0;

  const lastChanged = new Date(lastChangedAt);
  const now = new Date();
  const daysPassed = Math.floor((now.getTime() - lastChanged.getTime()) / (1000 * 60 * 60 * 24));
  const daysRemaining = Math.max(0, 90 - daysPassed);

  return daysRemaining;
};

/**
 * Check if user can change their slug (90 days must have passed since last change)
 * @param lastChangedAt - The timestamp when slug was last changed
 * @returns Object with canChange boolean and daysRemaining number
 */
export const canChangeSlug = (lastChangedAt: string | null): { canChange: boolean; daysRemaining: number } => {
  const daysRemaining = calculateDaysUntilSlugChange(lastChangedAt);
  return {
    canChange: daysRemaining === 0,
    daysRemaining,
  };
};

/**
 * Format the next available change date
 * @param lastChangedAt - The timestamp when slug was last changed
 * @returns Formatted date string or null if can change now
 */
export const getNextSlugChangeDate = (lastChangedAt: string | null): string | null => {
  if (!lastChangedAt) return null;

  const lastChanged = new Date(lastChangedAt);
  const nextChangeDate = new Date(lastChanged);
  nextChangeDate.setDate(nextChangeDate.getDate() + 90);

  return nextChangeDate.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Validate and update slug with 90-day restriction
 * @param userId - User ID
 * @param newSlug - The new slug to set
 * @param currentSlug - The current slug
 * @param lastChangedAt - When slug was last changed
 * @returns Object with success boolean, error message if failed, and updated timestamp
 */
export const updateSlugWithValidation = async (
  userId: string,
  newSlug: string,
  currentSlug: string | null,
  lastChangedAt: string | null
): Promise<{ success: boolean; error?: string; lastChangedAt?: string }> => {
  // If slug hasn't changed, no need to update
  if (newSlug === currentSlug) {
    return { success: true };
  }

  // Check if enough time has passed (90 days)
  const { canChange, daysRemaining } = canChangeSlug(lastChangedAt);

  if (!canChange) {
    const nextDate = getNextSlugChangeDate(lastChangedAt);
    return {
      success: false,
      error: `Debes esperar ${daysRemaining} días más para cambiar tu URL. Próxima fecha disponible: ${nextDate}`,
    };
  }

  // Validate slug format
  if (!newSlug || newSlug.length < 3) {
    return {
      success: false,
      error: 'La URL debe tener al menos 3 caracteres',
    };
  }

  // Check if slug is already taken by another user
  const { data: existingProfile, error: checkError } = await supabase
    .from('profiles')
    .select('id')
    .eq('slug', newSlug)
    .neq('id', userId)
    .maybeSingle();

  if (checkError) {
    return {
      success: false,
      error: 'Error al verificar disponibilidad de la URL',
    };
  }

  if (existingProfile) {
    return {
      success: false,
      error: 'Esta URL ya está en uso. Por favor elige otra.',
    };
  }

  // Update slug and timestamp
  const now = new Date().toISOString();
  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      slug: newSlug,
      last_slug_changed_at: now,
    })
    .eq('id', userId);

  if (updateError) {
    return {
      success: false,
      error: 'Error al actualizar la URL',
    };
  }

  return {
    success: true,
    lastChangedAt: now,
  };
};
