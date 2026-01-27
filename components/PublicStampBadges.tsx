import React, { useState } from 'react';
import { Stamp } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface PublicStampBadgesProps {
    stamps: Stamp[];
    compact?: boolean;
    showDetails?: boolean;
}

const PublicStampBadges: React.FC<PublicStampBadgesProps> = ({
    stamps,
    compact = false,
    showDetails = false
}) => {
    const { lang } = useLanguage();
    const [selectedStamp, setSelectedStamp] = useState<Stamp | null>(null);

    const getStampIcon = (type: string) => {
        const iconClass = "w-5 h-5";
        switch (type) {
            case 'EMAIL':
                return (
                    <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                );
            case 'PHONE':
                return (
                    <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                );
            case 'IDENTITY':
                return (
                    <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                    </svg>
                );
            case 'EDUCATION':
                return (
                    <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                    </svg>
                );
            case 'CERTIFICATION':
                return (
                    <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                );
            case 'EMPLOYMENT':
                return (
                    <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                );
            case 'SKILL':
                return (
                    <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                );
            case 'LANGUAGE':
                return (
                    <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                    </svg>
                );
            default:
                return (
                    <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
        }
    };

    const getStampLabel = (type: string, stamp?: Stamp): string => {
        const labels: Record<string, { es: string; en: string }> = {
            'EMAIL': { es: 'Email', en: 'Email' },
            'PHONE': { es: 'Teléfono', en: 'Phone' },
            'IDENTITY': { es: 'Identidad', en: 'Identity' },
            'EDUCATION': { es: 'Educación', en: 'Education' },
            'CERTIFICATION': { es: 'Certificación', en: 'Certification' },
            'EMPLOYMENT': { es: 'Empleo', en: 'Employment' },
            'SKILL': { es: 'Habilidad', en: 'Skill' },
            'LANGUAGE': { es: 'Idioma', en: 'Language' }
        };

        // For CERTIFICATION stamps, try to show specific certification name from metadata
        if (type === 'CERTIFICATION' && stamp?.metadata) {
            const certName = (stamp.metadata as any).certification_name || (stamp.metadata as any).name;
            if (certName) return certName;
        }

        return labels[type]?.[lang] || type;
    };

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (!stamps || stamps.length === 0) {
        return null;
    }

    if (compact) {
        // Compact mode: just show icons with tooltip
        return (
            <div className="flex items-center gap-1.5">
                {stamps.slice(0, 5).map((stamp) => (
                    <div
                        key={stamp.id}
                        className="relative group"
                        title={getStampLabel(stamp.type)}
                    >
                        <div className="flex items-center justify-center w-7 h-7 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
                            {getStampIcon(stamp.type)}
                        </div>
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                            ✓ {getStampLabel(stamp.type)}
                        </div>
                    </div>
                ))}
                {stamps.length > 5 && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                        +{stamps.length - 5}
                    </span>
                )}
            </div>
        );
    }

    // Full mode: show as badges
    return (
        <div className="space-y-4">
            {/* Header */}
            {showDetails && (
                <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary">
                        {lang === 'es' ? 'Verificaciones' : 'Verifications'}
                    </h3>
                    <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium rounded-full">
                        {stamps.length}
                    </span>
                </div>
            )}

            {/* Badges Grid */}
            <div className="flex flex-wrap gap-2">
                {stamps.map((stamp) => (
                    <button
                        key={stamp.id}
                        onClick={() => setSelectedStamp(stamp)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 rounded-full text-sm font-medium hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors cursor-pointer"
                    >
                        {getStampIcon(stamp.type)}
                        <span>{getStampLabel(stamp.type, stamp)}</span>
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                    </button>
                ))}
            </div>

            {/* Modal with stamp details */}
            {selectedStamp && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                    onClick={() => setSelectedStamp(null)}
                >
                    <div
                        className="bg-white dark:bg-dark-bg-primary rounded-lg shadow-xl max-w-md w-full p-6"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
                                    {getStampIcon(selectedStamp.type)}
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary">
                                        {getStampLabel(selectedStamp.type, selectedStamp)}
                                    </h3>
                                    <span className="inline-flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        {lang === 'es' ? 'Verificado' : 'Verified'}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedStamp(null)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Details */}
                        <div className="space-y-3 text-sm">
                            <div>
                                <p className="text-gray-500 dark:text-dark-text-secondary">
                                    {lang === 'es' ? 'Verificado el' : 'Verified on'}
                                </p>
                                <p className="text-gray-900 dark:text-dark-text-primary font-medium">
                                    {selectedStamp.verified_at && formatDate(selectedStamp.verified_at)}
                                </p>
                            </div>

                            {selectedStamp.provider && (
                                <div>
                                    <p className="text-gray-500 dark:text-dark-text-secondary">
                                        {lang === 'es' ? 'Proveedor' : 'Provider'}
                                    </p>
                                    <p className="text-gray-900 dark:text-dark-text-primary font-medium capitalize">
                                        {selectedStamp.provider}
                                    </p>
                                </div>
                            )}

                            {selectedStamp.expires_at && (
                                <div>
                                    <p className="text-gray-500 dark:text-dark-text-secondary">
                                        {lang === 'es' ? 'Válido hasta' : 'Valid until'}
                                    </p>
                                    <p className="text-gray-900 dark:text-dark-text-primary font-medium">
                                        {formatDate(selectedStamp.expires_at)}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-dark-border">
                            <p className="text-xs text-gray-500 dark:text-dark-text-secondary text-center">
                                {lang === 'es'
                                    ? 'Verificación autenticada por YourCVPassport'
                                    : 'Verification authenticated by YourCVPassport'}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PublicStampBadges;
