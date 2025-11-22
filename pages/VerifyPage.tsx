import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabase/client';
import LoadingSpinner from '../components/LoadingSpinner';
import QRCode from 'qrcode';
import PageSEO from '../components/PageSEO';
import { useLanguage } from '../contexts/LanguageContext';

// Helper to get public URL
const getPublicUrl = () => {
    // @ts-ignore - Vite env variables
    return import.meta.env?.VITE_PUBLIC_URL || window.location.origin;
};

interface VerificationData {
    stamp_id: string;
    stamp_type: string;
    stamp_status: string;
    verified_at: string;
    expires_at: string | null;
    profile_full_name: string;
    profile_slug: string;
    evidence: any;
    provider: string;
    token: string;
    views_count: number;
}

const VerifyPage: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const { lang } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [verificationData, setVerificationData] = useState<VerificationData | null>(null);
    const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (token) {
            fetchVerificationData();
            generateQRCode();
        }
    }, [token]);

    const fetchVerificationData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Call the database function to get stamp details by token
            const { data, error: fetchError } = await supabase
                .rpc('get_stamp_by_token', { p_token: token });

            if (fetchError) throw fetchError;

            if (!data || data.length === 0) {
                setError(lang === 'es'
                    ? 'Token de verificación no válido o expirado'
                    : 'Invalid or expired verification token');
                return;
            }

            setVerificationData(data[0]);
        } catch (err: any) {
            console.error('Error fetching verification data:', err);
            setError(err.message || (lang === 'es'
                ? 'Error al cargar los datos de verificación'
                : 'Error loading verification data'));
        } finally {
            setLoading(false);
        }
    };

    const generateQRCode = async () => {
        try {
            const verificationUrl = `${getPublicUrl()}/verify/${token}`;
            const qrDataUrl = await QRCode.toDataURL(verificationUrl, {
                width: 300,
                margin: 2,
                color: {
                    dark: '#1E3A8A', // cv-blue
                    light: '#FFFFFF'
                }
            });
            setQrCodeUrl(qrDataUrl);
        } catch (err) {
            console.error('Error generating QR code:', err);
        }
    };

    const handleCopyLink = () => {
        const verificationUrl = `${getPublicUrl()}/verify/${token}`;
        navigator.clipboard.writeText(verificationUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownloadQR = () => {
        if (qrCodeUrl) {
            const link = document.createElement('a');
            link.download = `verification-qr-${token}.png`;
            link.href = qrCodeUrl;
            link.click();
        }
    };

    const shareOnLinkedIn = () => {
        const verificationUrl = `${getPublicUrl()}/verify/${token}`;
        const text = lang === 'es'
            ? `He verificado mi ${getStampTypeLabel(verificationData?.stamp_type)} en YourCVPassport`
            : `I've verified my ${getStampTypeLabel(verificationData?.stamp_type)} on YourCVPassport`;

        const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(verificationUrl)}&summary=${encodeURIComponent(text)}`;
        window.open(linkedInUrl, '_blank', 'width=600,height=600');
    };

    const getStampTypeLabel = (type?: string): string => {
        if (!type) return '';

        const labels: Record<string, { es: string; en: string }> = {
            'EMAIL': { es: 'Email', en: 'Email' },
            'PHONE': { es: 'Teléfono', en: 'Phone' },
            'IDENTITY': { es: 'Identidad', en: 'Identity' },
            'EDUCATION': { es: 'Educación', en: 'Education' },
            'CERTIFICATION': { es: 'Certificación', en: 'Certification' },
            'EMPLOYMENT': { es: 'Experiencia Laboral', en: 'Employment' },
            'SKILL': { es: 'Habilidad', en: 'Skill' }
        };

        return labels[type]?.[lang] || type;
    };

    const getStampIcon = (type?: string): React.ReactNode => {
        switch (type) {
            case 'EMAIL':
                return (
                    <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                );
            case 'PHONE':
                return (
                    <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                );
            case 'IDENTITY':
                return (
                    <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                    </svg>
                );
            case 'EDUCATION':
                return (
                    <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                    </svg>
                );
            case 'CERTIFICATION':
                return (
                    <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                );
            case 'EMPLOYMENT':
                return (
                    <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                );
            case 'SKILL':
                return (
                    <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                );
            default:
                return (
                    <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
        }
    };

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    if (error || !verificationData) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-dark-bg-secondary flex items-center justify-center px-4">
                <div className="max-w-md w-full bg-white dark:bg-dark-bg-primary rounded-lg shadow-lg p-8 text-center">
                    <div className="text-red-500 mb-4">
                        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary mb-2">
                        {lang === 'es' ? 'Verificación no válida' : 'Invalid Verification'}
                    </h1>
                    <p className="text-gray-600 dark:text-dark-text-secondary mb-6">
                        {error || (lang === 'es'
                            ? 'No se pudo encontrar esta verificación'
                            : 'This verification could not be found')}
                    </p>
                    <Link
                        to="/"
                        className="inline-block bg-cv-blue text-white px-6 py-2 rounded-lg hover:bg-opacity-90 transition"
                    >
                        {lang === 'es' ? 'Volver al inicio' : 'Back to Home'}
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <>
            <PageSEO
                title={lang === 'es'
                    ? `Verificación de ${getStampTypeLabel(verificationData.stamp_type)} - ${verificationData.profile_full_name}`
                    : `${getStampTypeLabel(verificationData.stamp_type)} Verification - ${verificationData.profile_full_name}`}
                description={lang === 'es'
                    ? `Credencial verificada de ${verificationData.profile_full_name} en YourCVPassport`
                    : `Verified credential for ${verificationData.profile_full_name} on YourCVPassport`}
                lang={lang}
            />

            <div className="min-h-screen bg-gradient-to-br from-cv-light-gray to-gray-100 dark:from-dark-bg-secondary dark:to-dark-bg-primary py-12 px-4">
                <div className="max-w-4xl mx-auto">
                    {/* Main Verification Card */}
                    <div className="bg-white dark:bg-dark-bg-primary rounded-2xl shadow-2xl overflow-hidden">
                        {/* Header with Badge */}
                        <div className="bg-gradient-to-r from-cv-blue to-blue-600 text-white p-8 text-center">
                            <div className="inline-flex items-center justify-center w-24 h-24 bg-white bg-opacity-20 rounded-full mb-4">
                                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h1 className="text-3xl font-bold mb-2">
                                {lang === 'es' ? '✓ Credencial Verificada' : '✓ Verified Credential'}
                            </h1>
                            <p className="text-blue-100">
                                {lang === 'es'
                                    ? 'Esta verificación ha sido autenticada por YourCVPassport'
                                    : 'This verification has been authenticated by YourCVPassport'}
                            </p>
                        </div>

                        {/* Content */}
                        <div className="p-8">
                            {/* Profile Info */}
                            <div className="flex items-center mb-8 pb-8 border-b border-gray-200 dark:border-dark-border">
                                <div className="flex-shrink-0 w-20 h-20 bg-cv-blue bg-opacity-10 rounded-full flex items-center justify-center text-cv-blue mr-4">
                                    <span className="text-2xl font-bold">
                                        {verificationData.profile_full_name.charAt(0)}
                                    </span>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary">
                                        {verificationData.profile_full_name}
                                    </h2>
                                    <Link
                                        to={`/cv/${verificationData.profile_slug}`}
                                        className="text-cv-blue hover:underline"
                                    >
                                        {lang === 'es' ? 'Ver perfil completo →' : 'View full profile →'}
                                    </Link>
                                </div>
                            </div>

                            {/* Verification Details */}
                            <div className="grid md:grid-cols-2 gap-6 mb-8">
                                <div className="flex items-start">
                                    <div className="flex-shrink-0 text-cv-green mr-4">
                                        {getStampIcon(verificationData.stamp_type)}
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500 dark:text-dark-text-secondary">
                                            {lang === 'es' ? 'Tipo de Verificación' : 'Verification Type'}
                                        </h3>
                                        <p className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary">
                                            {getStampTypeLabel(verificationData.stamp_type)}
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 dark:text-dark-text-secondary">
                                        {lang === 'es' ? 'Fecha de Verificación' : 'Verification Date'}
                                    </h3>
                                    <p className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary">
                                        {formatDate(verificationData.verified_at)}
                                    </p>
                                </div>

                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 dark:text-dark-text-secondary">
                                        {lang === 'es' ? 'Estado' : 'Status'}
                                    </h3>
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        {lang === 'es' ? 'Activa' : 'Active'}
                                    </span>
                                </div>

                                {verificationData.expires_at && (
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500 dark:text-dark-text-secondary">
                                            {lang === 'es' ? 'Válida hasta' : 'Valid Until'}
                                        </h3>
                                        <p className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary">
                                            {formatDate(verificationData.expires_at)}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* QR Code and Sharing */}
                            <div className="bg-gray-50 dark:bg-dark-bg-secondary rounded-lg p-6">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary mb-4">
                                    {lang === 'es' ? 'Compartir Verificación' : 'Share Verification'}
                                </h3>

                                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                    {/* QR Code */}
                                    <div className="text-center">
                                        {qrCodeUrl && (
                                            <div className="bg-white p-4 rounded-lg inline-block shadow-md">
                                                <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48" />
                                            </div>
                                        )}
                                        <button
                                            onClick={handleDownloadQR}
                                            className="mt-3 text-sm text-cv-blue hover:underline"
                                        >
                                            {lang === 'es' ? '↓ Descargar QR' : '↓ Download QR'}
                                        </button>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex-1 space-y-3 w-full md:w-auto">
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
                                    </div>
                                </div>
                            </div>

                            {/* Trust Badge */}
                            <div className="mt-8 pt-8 border-t border-gray-200 dark:border-dark-border text-center">
                                <div className="flex items-center justify-center text-gray-500 dark:text-dark-text-secondary text-sm">
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                    {lang === 'es'
                                        ? 'Verificación autenticada y segura por YourCVPassport'
                                        : 'Authenticated and secured by YourCVPassport'}
                                </div>
                                <p className="text-xs text-gray-400 dark:text-dark-text-secondary mt-2">
                                    {lang === 'es'
                                        ? `Visto ${verificationData.views_count} veces`
                                        : `Viewed ${verificationData.views_count} times`}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Call to Action */}
                    <div className="mt-8 text-center">
                        <p className="text-gray-600 dark:text-dark-text-secondary mb-4">
                            {lang === 'es'
                                ? '¿Quieres verificar tus propias credenciales?'
                                : 'Want to verify your own credentials?'}
                        </p>
                        <Link
                            to="/"
                            className="inline-block bg-cv-blue text-white px-8 py-3 rounded-lg font-semibold hover:bg-opacity-90 transition transform hover:scale-105"
                        >
                            {lang === 'es' ? 'Comenzar ahora' : 'Get Started'}
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
};

export default VerifyPage;
