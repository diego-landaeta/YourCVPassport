import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase/client';
import { useAuth } from '../../contexts/AuthContext';
import { Stamp, StampType, StampStatus, CreateStampRequest, StampsSummary } from '../../types';
import StampsUploadModal from './StampsUploadModal';
import StampsVerificationCodeModal from './StampsVerificationCodeModal';
import VerificationBadge from '../VerificationBadge';
import Modal from '../ui/Modal';
import { useToastContext } from '../../context/ToastContext';
import {
    CheckBadgeIcon,
    ClockIcon,
    XCircleIcon,
    EnvelopeIcon,
    PhoneIcon,
    IdentificationIcon,
    AcademicCapIcon,
    DocumentTextIcon,
    BriefcaseIcon,
    CodeBracketIcon,
    PlusIcon,
    ExclamationTriangleIcon,
    CloudArrowUpIcon,
    ShieldCheckIcon,
    CheckCircleIcon,
    LanguageIcon
} from '@heroicons/react/24/outline';
import { CheckBadgeIcon as CheckBadgeSolidIcon } from '@heroicons/react/24/solid';

interface StampsSectionProps {
    onStampsUpdate?: () => void;
}

const StampsSection: React.FC<StampsSectionProps> = ({ onStampsUpdate }) => {
    const { session } = useAuth();
    const [stamps, setStamps] = useState<Stamp[]>([]);
    const [summary, setSummary] = useState<StampsSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showVerificationModal, setShowVerificationModal] = useState(false);
    const [selectedStampType, setSelectedStampType] = useState<StampType | null>(null);
    
    // Delete modal state
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [stampToDelete, setStampToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const toast = useToastContext();

    useEffect(() => {
        if (session?.user.id) {
            fetchStamps();
            fetchSummary();
        }
    }, [session]);

    const fetchStamps = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('stamps')
                .select('*')
                .eq('profile_id', session?.user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setStamps(data || []);
        } catch (error) {} finally {
            setLoading(false);
        }
    };

    const fetchSummary = async () => {
        try {
            const { data, error } = await supabase
                .from('stamps_summary')
                .select('*')
                .eq('profile_id', session?.user.id)
                .single();

            if (error && error.code !== 'PGRST116') throw error; // Ignore "not found" error
            setSummary(data);
        } catch (error) {}
    };

    const getStampIcon = (type: StampType) => {
        const iconClass = "w-6 h-6";
        switch (type) {
            case 'EMAIL': return <EnvelopeIcon className={iconClass} />;
            case 'PHONE': return <PhoneIcon className={iconClass} />;
            case 'IDENTITY': return <IdentificationIcon className={iconClass} />;
            case 'EDUCATION': return <AcademicCapIcon className={iconClass} />;
            case 'CERTIFICATION': return <DocumentTextIcon className={iconClass} />;
            case 'EMPLOYMENT': return <BriefcaseIcon className={iconClass} />;
            case 'SKILL': return <CodeBracketIcon className={iconClass} />;
        }
    };

    const getStatusBadge = (status: StampStatus) => {
        switch (status) {
            case 'VERIFIED':
                return (
                    <span className="flex items-center gap-1.5 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm font-medium">
                        <CheckBadgeSolidIcon className="w-4 h-4" />
                        Verificado
                    </span>
                );
            case 'PENDING':
                return (
                    <span className="flex items-center gap-1.5 px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full text-sm font-medium">
                        <ClockIcon className="w-4 h-4" />
                        Pendiente
                    </span>
                );
            case 'REJECTED':
                return (
                    <span className="flex items-center gap-1.5 px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full text-sm font-medium">
                        <XCircleIcon className="w-4 h-4" />
                        Rechazado
                    </span>
                );
            case 'EXPIRED':
                return (
                    <span className="flex items-center gap-1.5 px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full text-sm font-medium">
                        <ExclamationTriangleIcon className="w-4 h-4" />
                        Expirado
                    </span>
                );
        }
    };

    const getStampTypeName = (type: StampType): string => {
        const names: Record<StampType, string> = {
            'EMAIL': 'Email',
            'PHONE': 'Teléfono',
            'IDENTITY': 'Identidad',
            'EDUCATION': 'Educación',
            'CERTIFICATION': 'Certificación',
            'EMPLOYMENT': 'Empleo',
            'SKILL': 'Habilidad'
        };
        return names[type];
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getStampDescription = (stamp: Stamp): string => {
        switch (stamp.type) {
            case 'EMAIL':
                return (stamp.evidence as any).email || 'Email verification';
            case 'PHONE':
                return (stamp.evidence as any).phone || 'Phone verification';
            case 'IDENTITY':
                return `${(stamp.evidence as any).document_type || 'Document'}: ${(stamp.evidence as any).document_number || ''}`;
            case 'EDUCATION':
                return `${(stamp.evidence as any).degree || ''} - ${(stamp.evidence as any).institution || ''}`;
            case 'CERTIFICATION':
                return `${(stamp.evidence as any).name || ''} by ${(stamp.evidence as any).issuer || ''}`;
            case 'EMPLOYMENT':
                return `${(stamp.evidence as any).position || ''} at ${(stamp.evidence as any).company || ''}`;
            case 'SKILL':
                return (stamp.evidence as any).skill_name || 'Skill verification';
            default:
                return 'Verification';
        }
    };


    const handleDeleteStamp = (stampId: string) => {
        setStampToDelete(stampId);
        setShowDeleteModal(true);
    };

    const confirmDeleteStamp = async () => {
        if (!stampToDelete) return;
        
        setIsDeleting(true);
        try {
            const { error } = await supabase
                .from('stamps')
                .delete()
                .eq('id', stampToDelete)
                .eq('profile_id', session?.user.id);

            if (error) throw error;

            // Refresh stamps list
            await fetchStamps();
            await fetchSummary();
            onStampsUpdate?.();
            
            toast.success('Verificación eliminada exitosamente');
            setShowDeleteModal(false);
            setStampToDelete(null);
        } catch (error: any) {
            toast.error(`Error al eliminar la verificación: ${error.message || 'Error desconocido'}`);
        } finally {
            setIsDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header with Summary Stats */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-blue-100 dark:border-blue-800">
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            Verificaciones de Credenciales
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400">
                            Verifica tus credenciales para generar confianza con empleadores
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            setTimeout(() => {
                                const element = document.getElementById('available-stamps');
                                if (element) {
                                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                }
                            }, 100);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                    >
                        <PlusIcon className="w-5 h-5" />
                        Ver Verificaciones
                    </button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                                <CheckBadgeSolidIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {summary?.verified_count || 0}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Verificadas</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                                <ClockIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {summary?.pending_count || 0}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Pendientes</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                                <XCircleIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {summary?.rejected_count || 0}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Rechazadas</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                                <ExclamationTriangleIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {summary?.expired_count || 0}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Expiradas</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stamps List */}
            {stamps.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                    <CheckBadgeIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        No tienes verificaciones aún
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        Solicita tu primera verificación para aumentar la confianza en tu perfil
                    </p>
                    <button
                        onClick={() => {
                            setTimeout(() => {
                                const element = document.getElementById('available-stamps');
                                if (element) {
                                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                }
                            }, 100);
                        }}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                    >
                        <PlusIcon className="w-5 h-5" />
                        Ver Verificaciones Disponibles
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {stamps.map(stamp => (
                        <div
                            key={stamp.id}
                            className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-4 flex-1">
                                    <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0 text-blue-600 dark:text-blue-400">
                                        {getStampIcon(stamp.type)}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                {getStampTypeName(stamp.type)}
                                            </h3>
                                            {getStatusBadge(stamp.status)}
                                        </div>
                                        <p className="text-gray-600 dark:text-gray-400 mb-3">
                                            {getStampDescription(stamp)}
                                        </p>
                                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                            <span>Solicitado: {formatDate(stamp.created_at)}</span>
                                            {stamp.verified_at && (
                                                <span>Verificado: {formatDate(stamp.verified_at)}</span>
                                            )}
                                            {stamp.expires_at && (
                                                <span>Expira: {formatDate(stamp.expires_at)}</span>
                                            )}
                                        </div>
                                        {stamp.admin_notes && (
                                            <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                                    <span className="font-medium">Nota del administrador:</span> {stamp.admin_notes}
                                                </p>
                                            </div>
                                        )}

                                        {/* Verification Badge with QR and Sharing */}
                                        <VerificationBadge
                                            stampId={stamp.id}
                                            stampType={stamp.type}
                                            status={stamp.status}
                                        />
                                    </div>
                                </div>
                                
                                {/* Delete button for pending stamps */}
                                {stamp.status === 'PENDING' && (
                                    <button
                                        onClick={() => handleDeleteStamp(stamp.id)}
                                        className="ml-4 p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                        title="Eliminar verificación pendiente"
                                    >
                                        <XCircleIcon className="w-6 h-6" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Available Stamps to Request */}
            <div id="available-stamps" className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center gap-3 mb-6">
                    <ShieldCheckIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        Verificaciones Disponibles
                    </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Identity Stamp */}
                    <StampCard
                        type="IDENTITY"
                        icon={IdentificationIcon}
                        title="Identidad"
                        description="Verifica tu identidad con DNI o pasaporte"
                        requiresDocument={true}
                        onClick={() => {
                            setSelectedStampType('IDENTITY');
                            setShowUploadModal(true);
                        }}
                        hasStamp={stamps.some(s => s.type === 'IDENTITY' && s.status === 'VERIFIED')}
                    />

                    {/* Education Stamp */}
                    <StampCard
                        type="EDUCATION"
                        icon={AcademicCapIcon}
                        title="Educación"
                        description="Verifica tus títulos académicos y diplomas"
                        requiresDocument={true}
                        onClick={() => {
                            setSelectedStampType('EDUCATION');
                            setShowUploadModal(true);
                        }}
                        hasStamp={stamps.some(s => s.type === 'EDUCATION' && s.status === 'VERIFIED')}
                    />

                    {/* Certification Stamp */}
                    <StampCard
                        type="CERTIFICATION"
                        icon={LanguageIcon}
                        title="Idiomas"
                        description="Verifica certificados de idiomas (TOEFL, IELTS, DELE, DELF, etc.)"
                        requiresDocument={true}
                        onClick={() => {
                            setSelectedStampType('CERTIFICATION');
                            setShowUploadModal(true);
                        }}
                        hasStamp={stamps.some(s => s.type === 'CERTIFICATION' && s.status === 'VERIFIED')}
                    />

                    {/* Email Stamp */}
                    <StampCard
                        type="EMAIL"
                        icon={EnvelopeIcon}
                        title="Email"
                        description="Verifica tu dirección de correo"
                        requiresDocument={false}
                        onClick={() => {
                            setSelectedStampType('EMAIL');
                            setShowVerificationModal(true);
                        }}
                        hasStamp={stamps.some(s => s.type === 'EMAIL' && s.status === 'VERIFIED')}
                    />

                    {/* Phone Stamp - Temporarily Disabled
                    <StampCard
                        type="PHONE"
                        icon={PhoneIcon}
                        title="Teléfono (Pausado)"
                        description="Verificación por SMS temporalmente no disponible"
                        requiresDocument={false}
                        onClick={() => {
                            // Disabled temporarily
                        }}
                        hasStamp={true}
                    />
                    */}

                    {/* Employment Stamp */}
                    <StampCard
                        type="EMPLOYMENT"
                        icon={BriefcaseIcon}
                        title="Empleo"
                        description="Verifica tu experiencia laboral"
                        requiresDocument={true}
                        onClick={() => {
                            setSelectedStampType('EMPLOYMENT');
                            setShowUploadModal(true);
                        }}
                        hasStamp={stamps.some(s => s.type === 'EMPLOYMENT' && s.status === 'VERIFIED')}
                    />
                </div>
            </div>

            {/* Upload Modal for Documents */}
            {selectedStampType && !['EMAIL', 'PHONE'].includes(selectedStampType) && (
                <StampsUploadModal
                    isOpen={showUploadModal}
                    onClose={() => {
                        setShowUploadModal(false);
                        setSelectedStampType(null);
                    }}
                    stampType={selectedStampType}
                    onSuccess={() => {
                        fetchStamps();
                        fetchSummary();
                        onStampsUpdate?.();
                    }}
                />
            )}

            {/* Verification Code Modal for Email and Phone */}
            {selectedStampType && ['EMAIL', 'PHONE'].includes(selectedStampType) && (
                <StampsVerificationCodeModal
                    isOpen={showVerificationModal}
                    onClose={() => {
                        setShowVerificationModal(false);
                        setSelectedStampType(null);
                    }}
                    stampType={selectedStampType as 'EMAIL' | 'PHONE'}
                    onSuccess={() => {
                        fetchStamps();
                        fetchSummary();
                        onStampsUpdate?.();
                    }}
                />
            )}

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={showDeleteModal}
                onClose={() => {
                    if (!isDeleting) {
                        setShowDeleteModal(false);
                        setStampToDelete(null);
                    }
                }}
                title="Eliminar Verificación"
            >
                <div className="p-6">
                    <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 dark:bg-red-900/30 rounded-full mb-4">
                        <ExclamationTriangleIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
                    </div>
                    <h3 className="text-lg font-medium text-center text-gray-900 dark:text-white mb-2">
                        ¿Estás seguro?
                    </h3>
                    <p className="text-sm text-center text-gray-500 dark:text-gray-400 mb-6">
                        ¿Estás seguro de que deseas eliminar esta verificación pendiente? Esta acción no se puede deshacer.
                    </p>
                    <div className="flex gap-3 justify-center">
                        <button
                            onClick={() => {
                                setShowDeleteModal(false);
                                setStampToDelete(null);
                            }}
                            disabled={isDeleting}
                            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={confirmDeleteStamp}
                            disabled={isDeleting}
                            className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {isDeleting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Eliminando...
                                </>
                            ) : (
                                'Eliminar'
                            )}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

// Stamp Card Component
interface StampCardProps {
    type: StampType;
    icon: React.FC<React.SVGProps<SVGSVGElement>>;
    title: string;
    description: string;
    requiresDocument: boolean;
    onClick: () => void;
    hasStamp: boolean;
}

const StampCard: React.FC<StampCardProps> = ({
    type,
    icon: Icon,
    title,
    description,
    requiresDocument,
    onClick,
    hasStamp
}) => {
    return (
        <button
            onClick={onClick}
            disabled={hasStamp}
            className={`relative p-6 rounded-xl border-2 transition-all text-left ${
                hasStamp
                    ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 cursor-not-allowed'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-lg'
            }`}
        >
            {hasStamp && (
                <div className="absolute top-3 right-3">
                    <CheckBadgeSolidIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
            )}

            <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${
                hasStamp
                    ? 'bg-green-100 dark:bg-green-900/30'
                    : 'bg-blue-50 dark:bg-blue-900/30'
            }`}>
                <Icon className={`w-6 h-6 ${
                    hasStamp
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-blue-600 dark:text-blue-400'
                }`} />
            </div>

            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {title}
            </h4>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {description}
            </p>

            {requiresDocument && (
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <CloudArrowUpIcon className="w-4 h-4" />
                    <span>Requiere subir documento</span>
                </div>
            )}

            {hasStamp ? (
                <div className="mt-4 flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400">
                    <CheckCircleIcon className="w-5 h-5" />
                    Verificado
                </div>
            ) : (
                <div className="mt-4 flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400">
                    <PlusIcon className="w-5 h-5" />
                    Solicitar Verificación
                </div>
            )}
        </button>
    );
};

export default StampsSection;

