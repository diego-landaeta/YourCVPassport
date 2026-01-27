/**
 * Utility functions for sorting profiles in talent search
 * Prioritizes premium users and verified/certified users
 */

export interface SortableProfile {
  id: string;
  plan?: string | null;
  stamps?: Array<{ status: string }> | null;
  [key: string]: any;
}

/**
 * Checks if a profile is premium
 * Premium plans are anything other than 'free' or null
 */
export const isPremiumProfile = (profile: SortableProfile): boolean => {
  if (!profile.plan) return false;
  const planLower = profile.plan.toLowerCase();
  return planLower !== 'free' && planLower !== '';
};

/**
 * Counts the number of verified stamps a profile has
 */
export const getVerifiedStampsCount = (profile: SortableProfile): number => {
  if (!profile.stamps || !Array.isArray(profile.stamps)) return 0;
  return profile.stamps.filter((stamp: any) => stamp.status === 'VERIFIED').length;
};

/**
 * Checks if a profile is certified (has at least one verified stamp)
 */
export const isCertifiedProfile = (profile: SortableProfile): boolean => {
  return getVerifiedStampsCount(profile) > 0;
};

/**
 * Calculates a priority score for a profile
 * Higher score = higher priority in search results
 *
 * Scoring:
 * - Premium user: +100 points
 * - Each verified stamp: +10 points
 * - Has both premium and stamps: +50 bonus points
 */
export const calculateProfilePriorityScore = (profile: SortableProfile): number => {
  let score = 0;

  const isPremium = isPremiumProfile(profile);
  const verifiedStampsCount = getVerifiedStampsCount(profile);
  const isCertified = verifiedStampsCount > 0;

  // Premium bonus
  if (isPremium) {
    score += 100;
  }

  // Verified stamps bonus
  score += verifiedStampsCount * 10;

  // Combo bonus: both premium and certified
  if (isPremium && isCertified) {
    score += 50;
  }

  return score;
};

/**
 * Sorts profiles by priority
 * Premium and certified users appear first
 *
 * Priority order:
 * 1. Premium + Certified (highest)
 * 2. Premium only
 * 3. Certified only
 * 4. Regular users (lowest)
 *
 * Within each tier, profiles are sorted by number of verified stamps (descending)
 */
export const sortProfilesByPriority = <T extends SortableProfile>(
  profiles: T[]
): T[] => {
  return [...profiles].sort((a, b) => {
    const scoreA = calculateProfilePriorityScore(a);
    const scoreB = calculateProfilePriorityScore(b);

    // Sort by score descending (higher priority first)
    return scoreB - scoreA;
  });
};

/**
 * Categorizes profiles into priority tiers for display
 */
export interface ProfileTiers<T extends SortableProfile> {
  premiumCertified: T[];  // Both premium and certified
  premiumOnly: T[];       // Premium but not certified
  certifiedOnly: T[];     // Certified but not premium
  regular: T[];           // Neither premium nor certified
}

export const categorizeProfilesByTier = <T extends SortableProfile>(
  profiles: T[]
): ProfileTiers<T> => {
  const tiers: ProfileTiers<T> = {
    premiumCertified: [],
    premiumOnly: [],
    certifiedOnly: [],
    regular: [],
  };

  profiles.forEach(profile => {
    const isPremium = isPremiumProfile(profile);
    const isCertified = isCertifiedProfile(profile);

    if (isPremium && isCertified) {
      tiers.premiumCertified.push(profile);
    } else if (isPremium) {
      tiers.premiumOnly.push(profile);
    } else if (isCertified) {
      tiers.certifiedOnly.push(profile);
    } else {
      tiers.regular.push(profile);
    }
  });

  // Sort each tier by verified stamps count
  Object.keys(tiers).forEach(key => {
    const tierKey = key as keyof ProfileTiers<T>;
    tiers[tierKey].sort((a, b) =>
      getVerifiedStampsCount(b) - getVerifiedStampsCount(a)
    );
  });

  return tiers;
};

/**
 * Gets a flattened array of profiles sorted by tier priority
 */
export const getProfilesSortedByTier = <T extends SortableProfile>(
  profiles: T[]
): T[] => {
  const tiers = categorizeProfilesByTier(profiles);
  return [
    ...tiers.premiumCertified,
    ...tiers.premiumOnly,
    ...tiers.certifiedOnly,
    ...tiers.regular,
  ];
};
