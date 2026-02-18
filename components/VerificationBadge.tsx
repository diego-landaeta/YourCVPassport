import React from 'react';
import { useTranslations } from '../hooks/useTranslations';

interface VerificationBadgeProps {
    stampId: string;
    stampType: string;
    status: string;
    compact?: boolean;
}

const VerificationBadge: React.FC<VerificationBadgeProps> = ({
    status,
    compact = false
}) => {
    const t = useTranslations();

    if (status !== 'VERIFIED') {
        return null;
    }

    if (compact) {
        return (
            <div className="inline-flex items-center">
                <svg className="w-5 h-5 text-cv-green" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="ml-1 text-sm font-medium text-cv-green">
                    {t.common.verified}
                </span>
            </div>
        );
    }

    return null;
};

export default VerificationBadge;

