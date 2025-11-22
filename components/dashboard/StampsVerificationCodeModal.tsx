import React, { useState, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabase/client';
import { StampType } from '../../types';
import {
  XMarkIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  EnvelopeIcon,
  PhoneIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

interface StampsVerificationCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  stampType: 'EMAIL' | 'PHONE';
  onSuccess?: () => void;
}

const StampsVerificationCodeModal: React.FC<StampsVerificationCodeModalProps> = ({
  isOpen,
  onClose,
  stampType,
  onSuccess
}) => {
  const { user, profile } = useAuth();
  const [step, setStep] = useState<'input' | 'verify'>('input');
  const [contactValue, setContactValue] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentCodeId, setSentCodeId] = useState<string | null>(null);

  const getStampInfo = () => {
    if (stampType === 'EMAIL') {
      return {
        title: 'Verificación de Email',
        description: 'Te enviaremos un código de verificación a tu correo',
        icon: EnvelopeIcon,
        inputLabel: 'Dirección de Email',
        inputType: 'email',
        inputPlaceholder: 'tu@email.com',
        verifyButtonText: 'Enviar Código'
      };
    } else {
      return {
        title: 'Verificación de Teléfono',
        description: 'Te enviaremos un código SMS a tu número',
        icon: PhoneIcon,
        inputLabel: 'Número de Teléfono',
        inputType: 'tel',
        inputPlaceholder: '+34 600 123 456',
        verifyButtonText: 'Enviar SMS'
      };
    }
  };

  const stampInfo = getStampInfo();
  const Icon = stampInfo.icon;

  const validateInput = (): boolean => {
    if (!contactValue.trim()) {
      setError(`Por favor ingresa tu ${stampType === 'EMAIL' ? 'email' : 'teléfono'}`);
      return false;
    }

    if (stampType === 'EMAIL') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(contactValue)) {
        setError('Por favor ingresa un email válido');
        return false;
      }
    } else if (stampType === 'PHONE') {
      // Basic phone validation (can be enhanced)
      const phoneRegex = /^[\d\s\+\-\(\)]+$/;
      if (!phoneRegex.test(contactValue) || contactValue.replace(/\D/g, '').length < 9) {
        setError('Por favor ingresa un número de teléfono válido');
        return false;
      }
    }

    return true;
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setError(null);
    if (!validateInput()) return;

    setSending(true);

    try {
      if (stampType === 'EMAIL') {
        // Generate a random 6-digit code for email
        const code = Math.floor(100000 + Math.random() * 900000).toString();

        // Create a pending stamp record with the code
        const { data: stampData, error: stampError } = await supabase
          .from('stamps')
          .insert({
            profile_id: user.id,
            type: 'EMAIL',
            status: 'PENDING',
            evidence: {
              email: contactValue,
              verification_code: code,
              verification_sent_at: new Date().toISOString(),
              code_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
            },
            provider: 'email_verification'
          })
          .select()
          .single();

        if (stampError) throw stampError;
        setSentCodeId(stampData.id);

        // In production, send email via API route or email service
        // For now, log the code for testing
        console.log(`Email Verification Code for ${contactValue}: ${code}`);

      } else {
        // For phone, we'll use a custom verification system
        // Generate a random 6-digit code
        const code = Math.floor(100000 + Math.random() * 900000).toString();

        // Store the code temporarily in the database
        const { data: stampData, error: stampError } = await supabase
          .from('stamps')
          .insert({
            profile_id: user.id,
            type: 'PHONE',
            status: 'PENDING',
            evidence: {
              phone: contactValue,
              verification_code: code,
              verification_sent_at: new Date().toISOString(),
              code_expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 minutes
            },
            provider: 'sms_verification'
          })
          .select()
          .single();

        if (stampError) throw stampError;
        setSentCodeId(stampData.id);

        // In production, integrate with SMS service (Twilio, AWS SNS, etc.)
        // For now, we'll just show the code in console for testing
        console.log(`SMS Verification Code for ${contactValue}: ${code}`);
      }

      setStep('verify');
      setError(null);

    } catch (err: any) {
      console.error('Send code error:', err);
      setError(err.message || 'Error al enviar el código. Intenta nuevamente.');
    } finally {
      setSending(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !sentCodeId) return;

    if (!verificationCode.trim()) {
      setError('Por favor ingresa el código de verificación');
      return;
    }

    setVerifying(true);
    setError(null);

    try {
      // Both EMAIL and PHONE use the same code verification logic
      const { data: stampData, error: fetchError } = await supabase
        .from('stamps')
        .select('evidence')
        .eq('id', sentCodeId)
        .single();

      if (fetchError) throw fetchError;

      const evidence = stampData.evidence as any;

      // Check if code expired
      if (new Date() > new Date(evidence.code_expires_at)) {
        setError('El código ha expirado. Por favor solicita uno nuevo.');
        return;
      }

      // Verify code
      if (verificationCode === evidence.verification_code) {
        // Update stamp status to VERIFIED
        const { error: updateError } = await supabase
          .from('stamps')
          .update({
            status: 'VERIFIED',
            verified_at: new Date().toISOString(),
            evidence: {
              ...evidence,
              verified: true,
              verification_code: null // Remove code after verification
            }
          })
          .eq('id', sentCodeId);

        if (updateError) throw updateError;

        onSuccess?.();
        onClose();
        resetForm();
      } else {
        setError('Código incorrecto. Por favor verifica e intenta nuevamente.');
      }

    } catch (err: any) {
      console.error('Verify code error:', err);
      setError(err.message || 'Error al verificar el código. Intenta nuevamente.');
    } finally {
      setVerifying(false);
    }
  };

  const resetForm = () => {
    setStep('input');
    setContactValue('');
    setVerificationCode('');
    setSentCodeId(null);
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleResendCode = async () => {
    setStep('input');
    setVerificationCode('');
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-dark-bg-secondary rounded-2xl max-w-md w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-700 p-6 rounded-t-2xl">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white dark:bg-dark-bg-tertiary rounded-lg flex items-center justify-center">
                <Icon className="w-7 h-7 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{stampInfo.title}</h2>
                <p className="text-blue-100 dark:text-blue-200 text-sm mt-1">
                  {stampInfo.description}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'input' ? (
            <form onSubmit={handleSendCode} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {stampInfo.inputLabel} <span className="text-red-500">*</span>
                </label>
                <input
                  type={stampInfo.inputType}
                  value={contactValue}
                  onChange={(e) => setContactValue(e.target.value)}
                  placeholder={stampInfo.inputPlaceholder}
                  disabled={sending}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-bg-tertiary border-2 border-gray-300 dark:border-dark-border rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all disabled:opacity-50"
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <ExclamationTriangleIcon className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                </div>
              )}

              {/* Info Message */}
              <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <ShieldCheckIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-700 dark:text-blue-400">
                  <p className="font-medium mb-1">Proceso de Verificación</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    {stampType === 'EMAIL' ? (
                      <>
                        <li>Recibirás un email con un código de 6 dígitos</li>
                        <li>Ingresa el código en el siguiente paso</li>
                        <li>El código expira en 24 horas</li>
                      </>
                    ) : (
                      <>
                        <li>Recibirás un SMS con un código de 6 dígitos</li>
                        <li>Ingresa el código en el siguiente paso</li>
                        <li>El código expira en 15 minutos</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={sending}
                  className="flex-1 px-6 py-3 bg-gray-200 dark:bg-dark-bg-tertiary hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={sending}
                  className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {sending ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Enviando...
                    </>
                  ) : (
                    <>
                      <PaperAirplaneIcon className="w-5 h-5" />
                      {stampInfo.verifyButtonText}
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyCode} className="space-y-5">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircleIcon className="w-10 h-10 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  {stampType === 'EMAIL' ? 'Código Enviado' : 'SMS Enviado'}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {stampType === 'EMAIL'
                    ? `Hemos enviado un código a ${contactValue}`
                    : `Hemos enviado un código a ${contactValue}`
                  }
                </p>
              </div>

              {/* Code Input - for both EMAIL and PHONE */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Código de Verificación <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  maxLength={6}
                  disabled={verifying}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-bg-tertiary border-2 border-gray-300 dark:border-dark-border rounded-lg text-gray-900 dark:text-white text-center text-2xl font-bold tracking-widest focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all disabled:opacity-50"
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <ExclamationTriangleIcon className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                </div>
              )}

              {/* Resend Option */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={verifying}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50"
                >
                  ¿No recibiste el código? Reenviar
                </button>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={verifying}
                  className="flex-1 px-6 py-3 bg-gray-200 dark:bg-dark-bg-tertiary hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={verifying || verificationCode.length !== 6}
                  className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {verifying ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Verificando...
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="w-5 h-5" />
                      Verificar
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default StampsVerificationCodeModal;
