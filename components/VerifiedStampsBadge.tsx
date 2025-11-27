import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase/client';
import { Stamp, StampType } from '../types';
import {
    CheckBadgeIcon,
    EnvelopeIcon,
    PhoneIcon,
    IdentificationIcon,
    AcademicCapIcon,
    DocumentTextIcon,
    BriefcaseIcon,
    CodeBracketIcon
} from '@heroicons/react/24/solid';

interface VerifiedStampsBadgeProps {
    profileId: string;
    size?: 'sm' | 'md' | 'lg';
    showCount?: boolean;
    showTooltip?: boolean;
    className?: string;
}

const VerifiedStampsBadge: React.FC<VerifiedStampsBadgeProps> = ({
    profileId,
    size = 'md',
    showCount = true,
    showTooltip = true,
    className = ''
}) => {
    const [verifiedStamps, setVerifiedStamps] = useState<Stamp[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchVerifiedStamps();
    }, [profileId]);

    const fetchVerifiedStamps = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('stamps')
                .select('*')
                .eq('profile_id', profileId)
                .eq('status', 'VERIFIED')
                .or('expires_at.is.null,expires_at.gt.now()');

            if (error) throw error;
            setVerifiedStamps(data || []);
        } catch (error) {} finally {
            setLoading(false);
        }
    };

    const getStampIcon = (type: StampType, iconClass: string) => {
        switch (type) {
            case 'EMAIL': return <EnvelopeIcon className={iconClass} />;
            case 'PHONE': return <PhoneIcon className={iconClass} />;
            case 'IDENTITY': return <IdentificationIcon className={iconClass} />;
            case 'EDUCATION': return <AcademicCapIcon className={iconClass} />;
            case 'CERTIFICATION': return <DocumentTextIcon className={iconClass} />;
            case 'EMPLOYMENT': return <BriefcaseIcon className={iconClass} />;
            case 'SKILL': return <CodeBracketIcon className={iconClass} />;
            default: return <CheckBadgeIcon className={iconClass} />;
        }
    };

    const getStampLabel = (type: StampType): string => {
        const labels: Record<StampType, string> = {
            'EMAIL': 'Email Verificado',
            'PHONE': 'Teléfono Verificado',
            'IDENTITY': 'Identidad Verificada',
            'EDUCATION': 'Educación Verificada',
            'CERTIFICATION': 'Certificación Verificada',
            'EMPLOYMENT': 'Empleo Verificado',
            'SKILL': 'Habilidad Verificada'
        };
        return labels[type];
    };

    if (loading || verifiedStamps.length === 0) {
        return null;
    }

    const sizes = {
        sm: {
            badge: 'h-6',
            icon: 'w-4 h-4',
            text: 'text-xs',
            gap: 'gap-1',
            px: 'px-2',
            py: 'py-1'
        },
        md: {
            badge: 'h-8',
            icon: 'w-5 h-5',
            text: 'text-sm',
            gap: 'gap-1.5',
            px: 'px-3',
            py: 'py-1.5'
        },
        lg: {
            badge: 'h-10',
            icon: 'w-6 h-6',
            text: 'text-base',
            gap: 'gap-2',
            px: 'px-4',
            py: 'py-2'
        }
    };

    const sizeClasses = sizes[size];

    return (
        <div className={`inline-flex items-center ${sizeClasses.gap} ${className}`}>
            {/* Main Verified Badge */}
            <div className={`group relative inline-flex items-center ${sizeClasses.gap} ${sizeClasses.px} ${sizeClasses.py} ${sizeClasses.badge} bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full font-medium`}>
                <CheckBadgeIcon className={sizeClasses.icon} />
                {showCount && (
                    <span className={sizeClasses.text}>
                        {verifiedStamps.length} Verificada{verifiedStamps.length !== 1 ? 's' : ''}
                    </span>
                )}

                {/* Tooltip with stamp details */}
                {showTooltip && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg">
                        <div className="font-semibold mb-2">Credenciales Verificadas:</div>
                        <ul className="space-y-1">
                            {verifiedStamps.map(stamp => (
                                <li key={stamp.id} className="flex items-center gap-2">
                                    {getStampIcon(stamp.type, 'w-4 h-4')}
                                    <span>{getStampLabel(stamp.type)}</span>
                                </li>
                            ))}
                        </ul>
                        {/* Triangle pointer */}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
                    </div>
                )}
            </div>

            {/* Individual stamp icons (optional, for larger displays) */}
            {size === 'lg' && verifiedStamps.length <= 5 && (
                <div className="flex items-center gap-1">
                    {verifiedStamps.map(stamp => (
                        <div
                            key={stamp.id}
                            className="w-6 h-6 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center"
                            title={getStampLabel(stamp.type)}
                        >
                            {getStampIcon(stamp.type, 'w-3.5 h-3.5')}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default VerifiedStampsBadge;

