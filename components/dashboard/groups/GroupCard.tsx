import React, { useState } from 'react';
import { Group } from '../../../types/groups';
import { useLanguage } from '../../../contexts/LanguageContext';
import { ShareIcon, CheckIcon, UserGroupIcon, MegaphoneIcon } from '@heroicons/react/24/outline';

interface GroupCardProps {
  group: Group;
  onJoin?: (groupId: string) => void;
  onLeave?: (groupId: string) => void;
  onOpen?: (groupId: string) => void;
  loading?: boolean;
}

const GroupCard: React.FC<GroupCardProps> = ({ group, onJoin, onLeave, onOpen, loading }) => {
  const { lang } = useLanguage();
  const isEs = lang === 'es';
  const [copied, setCopied] = useState(false);

  const isChannel = group.metadata?.type === 'channel';

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const url = `${origin}/comunidad?grupo=${group.slug || group.id}`;
    const shareData = {
      title: group.name,
      text: isChannel
        ? (isEs
          ? `Sigue el canal "${group.name}" en YourCVPassport`
          : `Follow the "${group.name}" channel on YourCVPassport`)
        : (isEs
          ? `¡Únete al grupo "${group.name}" en YourCVPassport!`
          : `Join the "${group.name}" group on YourCVPassport!`),
      url,
    };

    if (navigator.share) {
      navigator.share(shareData).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }).catch(() => {});
    }
  };

  const coverGradient = isChannel
    ? 'from-purple-600/80 to-violet-700/80'
    : 'from-cv-blue/70 to-blue-600/80';

  const accentColor = isChannel ? 'bg-purple-500' : 'bg-cv-blue';
  const accentHover = isChannel ? 'hover:bg-purple-600' : 'hover:bg-blue-700';
  const accentBorder = isChannel ? 'border-purple-500 text-purple-600' : 'border-cv-blue text-cv-blue';
  const accentHoverFill = isChannel
    ? 'hover:bg-purple-500 hover:text-white'
    : 'hover:bg-cv-blue hover:text-white';

  return (
    <div
      className="group bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 cursor-pointer"
      onClick={() => onOpen?.(group.id)}
    >
      {/* Cover */}
      <div className={`h-28 bg-gradient-to-br ${coverGradient} relative overflow-hidden`}>
        {group.cover_url ? (
          <img src={group.cover_url} alt="" className="w-full h-full object-cover" />
        ) : (
          /* Decorative pattern for empty cover */
          <div className="absolute inset-0 opacity-20">
            <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/30" />
            <div className="absolute bottom-0 left-4 w-16 h-16 rounded-full bg-white/20" />
            <div className="absolute top-2 left-1/3 w-10 h-10 rounded-full bg-white/20" />
          </div>
        )}

        {/* Share button */}
        <button
          onClick={handleShare}
          className="absolute top-2 right-2 p-1.5 rounded-full bg-black/30 hover:bg-black/50 text-white transition-colors opacity-0 group-hover:opacity-100"
          title={isEs ? 'Compartir' : 'Share'}
        >
          {copied ? (
            <CheckIcon className="w-3.5 h-3.5 text-green-300" />
          ) : (
            <ShareIcon className="w-3.5 h-3.5" />
          )}
        </button>

        {/* Type badge */}
        <div className="absolute top-2 left-2">
          <span className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full text-white ${
            isChannel ? 'bg-purple-600/80' : 'bg-cv-blue/80'
          } backdrop-blur-sm`}>
            {isChannel
              ? <MegaphoneIcon className="w-2.5 h-2.5" />
              : <UserGroupIcon className="w-2.5 h-2.5" />
            }
            {isChannel ? (isEs ? 'Canal' : 'Channel') : (isEs ? 'Grupo' : 'Group')}
          </span>
        </div>

        {group.is_private && (
          <span className="absolute bottom-2 left-2 bg-black/40 text-white text-[10px] px-1.5 py-0.5 rounded-full backdrop-blur-sm">
            🔒 {isEs ? 'Privado' : 'Private'}
          </span>
        )}
      </div>

      {/* Avatar */}
      <div className="px-4 -mt-7 mb-2 flex items-end justify-between relative z-10">
        <div
          className={`w-14 h-14 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-lg overflow-hidden border-2 border-white dark:border-gray-900 ${
            group.avatar_url ? '' : `bg-gradient-to-br ${isChannel ? 'from-purple-500 to-violet-600' : 'from-cv-blue to-blue-600'}`
          }`}
        >
          {group.avatar_url ? (
            <img src={group.avatar_url} alt={group.name} className="w-full h-full object-cover" />
          ) : (
            group.name.charAt(0).toUpperCase()
          )}
        </div>
        {/* Member / follower count pill */}
        <span className="mb-1 text-xs text-gray-500 dark:text-gray-400 font-medium">
          {group.member_count} {isChannel
            ? (isEs ? 'seguidores' : 'followers')
            : (isEs ? 'miembros' : 'members')
          }
        </span>
      </div>

      {/* Info */}
      <div className="px-4 pb-4">
        <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm leading-tight truncate mb-0.5 group-hover:text-cv-blue transition-colors">
          {group.name}
        </h3>
        {group.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
            {group.description}
          </p>
        )}
        {group.post_count > 0 && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {group.post_count} posts
          </p>
        )}

        {/* Action buttons */}
        <div className="mt-3" onClick={e => e.stopPropagation()}>
          {group.isMember ? (
            <div className="flex gap-2">
              <button
                onClick={() => onOpen?.(group.id)}
                className={`flex-1 py-2 rounded-lg ${accentColor} ${accentHover} text-white text-xs font-semibold transition-colors`}
              >
                {isChannel ? (isEs ? 'Ver canal' : 'View channel') : (isEs ? 'Ver grupo' : 'View group')}
              </button>
              {!group.isOwner && (
                <button
                  onClick={() => onLeave?.(group.id)}
                  disabled={loading}
                  className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 text-xs hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-red-500 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                >
                  {isEs ? 'Salir' : 'Leave'}
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={() => onJoin?.(group.id)}
              disabled={loading}
              className={`w-full py-2 rounded-lg border ${accentBorder} text-xs font-semibold ${accentHoverFill} transition-colors disabled:opacity-50`}
            >
              {isChannel ? (isEs ? 'Seguir' : 'Follow') : (isEs ? 'Unirse' : 'Join')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupCard;
