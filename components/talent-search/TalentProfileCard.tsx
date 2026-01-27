import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import type { ProfileWithSkills } from './types';
import { MapPinIcon, StarIcon } from '@heroicons/react/24/outline';
import { CheckBadgeIcon as CheckBadgeIconSolid } from '@heroicons/react/24/solid';
import { isPremiumProfile, getVerifiedStampsCount } from '../../utils/profileSorting';

interface TalentProfileCardProps {
  profile: ProfileWithSkills;
  onViewProfile: (profileId: string) => void;
  onClick?: () => void;
  companyMode?: boolean;
  showContactButton?: boolean;
}

const TalentProfileCard: React.FC<TalentProfileCardProps> = ({
  profile,
  onViewProfile,
  onClick,
  companyMode = false,
}) => {
  const { lang } = useLanguage();

  const translations = {
    en: {
      yearsExp: 'years experience',
      skills: 'Skills',
      viewProfile: 'View Profile',
      more: 'more',
    },
    es: {
      yearsExp: 'años de experiencia',
      skills: 'Habilidades',
      viewProfile: 'Ver Perfil',
      more: 'más',
    },
  };

  const t = translations[lang as keyof typeof translations];

  // Check premium and certified status
  const isPremium = isPremiumProfile(profile);
  const verifiedStampsCount = getVerifiedStampsCount(profile);
  const isCertified = verifiedStampsCount > 0;

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      onViewProfile(profile.id);
    }
  };

  const avatarUrl = profile.photo_url || profile.avatar_url || profile.profile_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name || 'User')}&background=2563eb&color=fff&size=200`;

  return (
    <div
      className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 rounded-xl cursor-pointer transition-all hover:shadow-lg overflow-hidden ${
        onClick ? 'cursor-pointer' : ''
      }`}
      onClick={onClick ? handleClick : undefined}
    >
      {/* Card Content */}
      <div className="p-5">
        {/* Avatar and Name Row */}
        <div className="flex items-center gap-3 mb-3">
          <div className="relative flex-shrink-0">
            <img
              src={avatarUrl}
              alt={profile.full_name || ''}
              className="w-14 h-14 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
              onError={(e) => {
                e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name || 'User')}&background=2563eb&color=fff&size=200`;
              }}
            />
            {/* Verified Badge */}
            {isCertified && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-600 dark:bg-green-500 flex items-center justify-center border-2 border-white dark:border-gray-800">
                <CheckBadgeIconSolid className="w-3.5 h-3.5 text-white" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {profile.full_name || 'Anonymous'}
              </h3>
              {isPremium && (
                <StarIcon className="w-4 h-4 text-amber-500 flex-shrink-0" />
              )}
            </div>
            {(profile.title || profile.professional_title || profile.headline) && (
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
                {profile.title || profile.professional_title || profile.headline}
              </p>
            )}
          </div>
        </div>

        {/* Bio/Headline */}
        {(profile.headline || profile.bio) && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
            {profile.headline || profile.bio}
          </p>
        )}

        {/* Location */}
        {profile.location && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-3">
            <MapPinIcon className="w-3.5 h-3.5" />
            <span className="truncate">{profile.location}</span>
          </div>
        )}

        {/* Skills */}
        {profile.skills && profile.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {profile.skills.slice(0, 3).map((skill) => (
              <span
                key={skill.id}
                className="inline-flex px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs font-medium rounded"
              >
                {skill.name}
              </span>
            ))}
            {profile.skills.length > 3 && (
              <span className="inline-flex px-2 py-1 text-gray-500 dark:text-gray-400 text-xs">
                +{profile.skills.length - 3}
              </span>
            )}
          </div>
        )}

        {/* View Profile Button */}
        {!onClick && (
          <button
            onClick={() => onViewProfile(profile.id)}
            className="w-full px-4 py-2 text-sm font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-all flex items-center justify-center gap-2"
          >
            {t.viewProfile}
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default TalentProfileCard;
