import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase/client';
import QRCode from 'qrcode';
import { useLanguage } from '../contexts/LanguageContext';

// Helper to get public URL
const getPublicUrl = () => {
    // @ts-ignore - Vite env variables
    return import.meta.env?.VITE_PUBLIC_URL || window.location.origin;
};

interface VerificationBadgeProps {
    stampId: string;
    stampType: string;
    status: string;
    compact?: boolean;
}

interface VerificationToken {
    id: string;
    token: string;
    stamp_id: string;
    views_count: number;
    created_at: string;
}

const VerificationBadge: React.FC<VerificationBadgeProps> = ({
    stampId,
    stampType,
    status,
    compact = false
}) => {
    const { lang } = useLanguage();
    const [token, setToken] = useState<VerificationToken | null>(null);
    const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
    const [showQR, setShowQR] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (status === 'VERIFIED') {
            fetchOrCreateToken();
        }
    }, [stampId, status]);

    const fetchOrCreateToken = async () => {
        try {
            // First, try to get existing token
            const { data: existingToken } = await supabase
                .from('verification_tokens')
                .select('*')
                .eq('stamp_id', stampId)
                .single();

            if (existingToken) {
                setToken(existingToken);
                return;
            }

            // If no token exists, create one
            const { data: newToken, error: createError } = await supabase
                .rpc('get_or_create_verification_token', { p_stamp_id: stampId });

            if (createError) {
                console.error('Error creating token:', createError);
                return;
            }

            if (newToken) {
                setToken(newToken);
            }
        } catch (err) {
            console.error('Error with verification token:', err);
        }
    };

    const generateQRCode = async (tokenString: string) => {
        try {
            const verificationUrl = `${getPublicUrl()}/verify/${tokenString}`;
            const qrDataUrl = await QRCode.toDataURL(verificationUrl, {
                width: 300,
                margin: 2,
                color: {
                    dark: '#1E3A8A',
                    light: '#FFFFFF'
                }
            });
            setQrCodeUrl(qrDataUrl);
        } catch (err) {
            console.error('Error generating QR code:', err);
        }
    };

    const handleShowQR = async () => {
        if (token && !qrCodeUrl) {
            await generateQRCode(token.token);
        }
        setShowQR(!showQR);
    };

    const handleCopyLink = () => {
        if (token) {
            const verificationUrl = `${getPublicUrl()}/verify/${token.token}`;
            navigator.clipboard.writeText(verificationUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleDownloadQR = () => {
        if (qrCodeUrl) {
            const link = document.createElement('a');
            link.download = `verification-${stampType.toLowerCase()}-qr.png`;
            link.href = qrCodeUrl;
            link.click();
        }
    };

    const shareOnLinkedIn = () => {
        if (!token) return;

        const verificationUrl = `${getPublicUrl()}/verify/${token.token}`;
        const stampLabels: Record<string, { es: string; en: string }> = {
            'EMAIL': { es: 'Email', en: 'Email' },
            'PHONE': { es: 'Teléfono', en: 'Phone' },
            'IDENTITY': { es: 'Identidad', en: 'Identity' },
            'EDUCATION': { es: 'Educación', en: 'Education' },
            'CERTIFICATION': { es: 'Certificación', en: 'Certification' },
            'EMPLOYMENT': { es: 'Experiencia Laboral', en: 'Employment' },
            'SKILL': { es: 'Habilidad', en: 'Skill' }
        };

        const label = stampLabels[stampType]?.[lang] || stampType;
        const text = lang === 'es'
            ? `He verificado mi ${label} en YourCVPassport`
            : `I've verified my ${label} on YourCVPassport`;

        const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(verificationUrl)}&summary=${encodeURIComponent(text)}`;
        window.open(linkedInUrl, '_blank', 'width=600,height=600');
    };

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
                    {lang === 'es' ? 'Verificado' : 'Verified'}
                </span>
            </div>
        );
    }

    return (
        <div className="mt-4 space-y-4">
            {/* Verification Badge */}
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <svg className="w-6 h-6 text-cv-green mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <div>
                            <h4 className="font-semibold text-green-900 dark:text-green-100">
                                {lang === 'es' ? 'Credencial Verificada' : 'Verified Credential'}
                            </h4>
                            <p className="text-sm text-green-700 dark:text-green-300">
                                {lang === 'es' ? 'Compartible públicamente' : 'Publicly shareable'}
                            </p>
                        </div>
                    </div>
                    {token && (
                        <button
                            onClick={handleShowQR}
                            className="text-cv-blue hover:text-blue-700 font-medium text-sm"
                        >
                            {showQR
                                ? (lang === 'es' ? 'Ocultar' : 'Hide')
                                : (lang === 'es' ? 'Compartir' : 'Share')}
                        </button>
                    )}
                </div>
            </div>

            {/* QR Code and Sharing Options */}
            {showQR && token && (
                <div className="bg-gray-50 dark:bg-dark-bg-secondary rounded-lg p-6 space-y-4 animate-fade-in">
                    <h4 className="font-semibold text-gray-900 dark:text-dark-text-primary">
                        {lang === 'es' ? 'Compartir Verificación' : 'Share Verification'}
                    </h4>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* QR Code */}
                        <div className="text-center">
                            {qrCodeUrl ? (
                                <div className="bg-white p-4 rounded-lg inline-block shadow-sm">
                                    <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48" />
                                </div>
                            ) : (
                                <div className="bg-white p-4 rounded-lg inline-block shadow-sm w-48 h-48 flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cv-blue"></div>
                                </div>
                            )}
                            {qrCodeUrl && (
                                <button
                                    onClick={handleDownloadQR}
                                    className="mt-2 text-sm text-cv-blue hover:underline"
                                >
                                    {lang === 'es' ? '↓ Descargar QR' : '↓ Download QR'}
                                </button>
                            )}
                        </div>

                        {/* Sharing Options */}
                        <div className="space-y-3">
                            <button
                                onClick={handleCopyLink}
                                className="w-full flex items-center justify-center px-4 py-3 bg-white dark:bg-dark-bg-primary border border-gray-300 dark:border-dark-border rounded-lg hover:bg-gray-50 dark:hover:bg-dark-bg-secondary transition"
                            >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                {copied
                                    ? (lang === 'es' ? '✓ Copiado!' : '✓ Copied!')
                                    : (lang === 'es' ? 'Copiar enlace' : 'Copy link')}
                            </button>

                            <button
                                onClick={shareOnLinkedIn}
                                className="w-full flex items-center justify-center px-4 py-3 bg-[#0077B5] text-white rounded-lg hover:bg-opacity-90 transition"
                            >
                                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                                </svg>
                                {lang === 'es' ? 'Compartir en LinkedIn' : 'Share on LinkedIn'}
                            </button>

                            <button
                                onClick={() => window.open(`${getPublicUrl()}/verify/${token.token}`, '_blank')}
                                className="w-full flex items-center justify-center px-4 py-3 bg-cv-blue text-white rounded-lg hover:bg-opacity-90 transition"
                            >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                                {lang === 'es' ? 'Ver página pública' : 'View public page'}
                            </button>

                            <p className="text-xs text-gray-500 dark:text-dark-text-secondary text-center">
                                {lang === 'es'
                                    ? `Vista ${token.views_count} veces`
                                    : `Viewed ${token.views_count} times`}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VerificationBadge;
