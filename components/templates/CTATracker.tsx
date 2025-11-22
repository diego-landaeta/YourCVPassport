import React from 'react';
import { trackClick } from '../../hooks/useAnalytics';
import { useAuth } from '../../contexts/AuthContext';

interface CTATrackerProps {
  profileId: string;
  ctaType: string;
  ctaLabel: string;
  href?: string;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  target?: string;
  rel?: string;
}

/**
 * Wrapper component that automatically tracks CTA clicks
 * Use this for any clickable element that should be tracked in analytics
 * Note: Does NOT track clicks when user is viewing their own profile
 */
export const CTATracker: React.FC<CTATrackerProps> = ({
  profileId,
  ctaType,
  ctaLabel,
  href,
  onClick,
  children,
  className,
  target,
  rel,
}) => {
  const { user } = useAuth();
  const isOwnProfile = user?.id === profileId;

  const handleClick = () => {
    // Only track if NOT viewing own profile
    if (!isOwnProfile) {
      trackClick(profileId, ctaType, ctaLabel);
    }
    
    // Call the original onClick if provided
    if (onClick) {
      onClick();
    }
  };

  if (href) {
    return (
      <a
        href={href}
        onClick={handleClick}
        className={className}
        target={target}
        rel={rel}
      >
        {children}
      </a>
    );
  }

  return (
    <button onClick={handleClick} className={className}>
      {children}
    </button>
  );
};

export default CTATracker;
