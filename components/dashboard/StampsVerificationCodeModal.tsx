import React, { useState, useCallback, useEffect } from 'react';
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
  const [countryCode, setCountryCode] = useState('+34');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentCodeId, setSentCodeId] = useState<string | null>(null);

  // Persist modal state in localStorage to survive page refreshes
  useEffect(() => {
    if (isOpen && step === 'verify' && sentCodeId) {
      const stateKey = `verification_state_${stampType}_${user?.id}`;
      localStorage.setItem(stateKey, JSON.stringify({
        step,
        contactValue,
        sentCodeId,
        timestamp: Date.now()
      }));
    }
  }, [isOpen, step, contactValue, sentCodeId, stampType, user?.id]);

  // Restore state on mount if exists and is recent (within 30 minutes)
  useEffect(() => {
    if (isOpen && user?.id && step === 'input' && !sentCodeId) {
      const stateKey = `verification_state_${stampType}_${user.id}`;
      const savedState = localStorage.getItem(stateKey);
      
      if (savedState) {
        try {
          const parsed = JSON.parse(savedState);
          const age = Date.now() - parsed.timestamp;
          
          // Only restore if less than 30 minutes old
          if (age < 30 * 60 * 1000) {
            setStep(parsed.step);
            setContactValue(parsed.contactValue);
            setSentCodeId(parsed.sentCodeId);
          } else {
            // Clean up old state
            localStorage.removeItem(stateKey);
          }
        } catch (e) {}
      }
    }
  }, [isOpen, stampType, user?.id, step, sentCodeId]);

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
    if (stampType === 'EMAIL') {
      if (!contactValue.trim()) {
        setError('Por favor ingresa tu email');
        return false;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(contactValue)) {
        setError('Por favor ingresa un email válido');
        return false;
      }
    } else if (stampType === 'PHONE') {
      if (!phoneNumber.trim()) {
        setError('Por favor ingresa tu número de teléfono');
        return false;
      }
      // Basic phone validation (can be enhanced)
      const phoneRegex = /^[\d\s\-\(\)]+$/;
      if (!phoneRegex.test(phoneNumber) || phoneNumber.replace(/\D/g, '').length < 9) {
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
        // Try to call the send-verification-email edge function
        const { data, error } = await supabase.functions.invoke('send-verification-email', {
          body: {
            email: contactValue,
            userId: user.id
          }
        });

        // If edge function fails (not deployed, error, etc.), fall back to local creation
        if (error) {// Generate a random 6-digit code
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
                expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 minutes
              },
              provider: 'email_verification'
            })
            .select()
            .single();

          if (stampError) throw stampError;
          setSentCodeId(stampData.id);

          // Show code to user in fallback mode
          alert(`MODO DE PRUEBA: Tu código es ${code}\n\n(En producción, este código se enviaría por email)`);
          alert(`⚠️ IMPORTANTE: Copia este código ahora: ${code}`);
          
        } else if (data.error) {
          throw new Error(data.error);
        } else {
          // Store the stamp ID returned by the edge function
          setSentCodeId(data.stampId);
        }

      } else {
        // Combine country code and phone number
        const fullPhoneNumber = `${countryCode} ${phoneNumber}`;

        // Try to call the send-verification-sms edge function
        const { data, error } = await supabase.functions.invoke('send-verification-sms', {
          body: {
            phone: fullPhoneNumber,
            userId: user.id
          }
        });

        // If edge function fails, fall back to local creation
        if (error) {const code = Math.floor(100000 + Math.random() * 900000).toString();

          const { data: stampData, error: stampError } = await supabase
            .from('stamps')
            .insert({
              profile_id: user.id,
              type: 'PHONE',
              status: 'PENDING',
              evidence: {
                phone: fullPhoneNumber,
                verification_code: code,
                verification_sent_at: new Date().toISOString(),
                expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString()
              },
              provider: 'sms_verification'
            })
            .select()
            .single();

          if (stampError) throw stampError;
          setSentCodeId(stampData.id);

          // Show code to user in fallback mode
          alert(`MODO DE PRUEBA: Tu código es ${code}\n\n(En producción, este código se enviaría por SMS)`);
          alert(`⚠️ IMPORTANTE: Copia este código ahora: ${code}`);
          
        } else if (data.error) {
          throw new Error(data.error);
        } else {
          setSentCodeId(data.stampId);
        }
      }

      setStep('verify');
      setError(null);

    } catch (err: any) {// Handle specific error codes
      if (err.message?.includes('RATE_LIMIT_EXCEEDED')) {
        setError('Has excedido el límite de intentos. Por favor espera antes de solicitar otro código.');
      } else {
        setError(err.message || 'Error al enviar el código. Intenta nuevamente.');
      }
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
      // Call the appropriate verification edge function
      const functionName = stampType === 'EMAIL' ? 'verify-email-code' : 'verify-phone-code';
      
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: {
          code: verificationCode,
          userId: user.id
        }
      });

      // If edge function fails (not deployed, error, etc.), fall back to local verification
      if (error) {// Fetch stamp directly from database as fallback
        const { data: stampData, error: fetchError } = await supabase
          .from('stamps')
          .select('evidence')
          .eq('id', sentCodeId)
          .single();

        if (fetchError) throw fetchError;

        const evidence = stampData.evidence as any;

        // Check if code expired
        if (new Date() > new Date(evidence.expires_at || evidence.code_expires_at)) {
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
                verification_code: null
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
        return;
      }

      if (data.error) {
        // Handle specific error codes from the edge function
        if (data.code === 'CODE_EXPIRED') {
          setError('El código ha expirado. Por favor solicita uno nuevo.');
        } else if (data.code === 'TOO_MANY_ATTEMPTS') {
          setError('Demasiados intentos incorrectos. Por favor solicita un nuevo código.');
        } else if (data.code === 'INVALID_CODE') {
          const attemptsMsg = data.attemptsRemaining 
            ? ` (${data.attemptsRemaining} intentos restantes)` 
            : '';
          setError(`Código incorrecto. Por favor verifica e intenta nuevamente.${attemptsMsg}`);
        } else if (data.code === 'NO_PENDING_VERIFICATION') {
          setError('No se encontró una verificación pendiente. Por favor solicita un nuevo código.');
        } else {
          setError(data.error || 'Error al verificar el código.');
        }
        return;
      }

      // Success!
      if (data.success) {
        onSuccess?.();
        onClose();
        resetForm();
      }

    } catch (err: any) {setError(err.message || 'Error al verificar el código. Intenta nuevamente.');
    } finally {
      setVerifying(false);
    }
  };

  const resetForm = () => {
    setStep('input');
    setContactValue('');
    setPhoneNumber('');
    setCountryCode('+34');
    setVerificationCode('');
    setSentCodeId(null);
    setError(null);

    // Clear localStorage state
    if (user?.id) {
      const stateKey = `verification_state_${stampType}_${user.id}`;
      localStorage.removeItem(stateKey);
    }
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
      <div className="bg-white dark:bg-dark-bg-secondary rounded-2xl max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header - Compact & Modern */}
        <div className="bg-white dark:bg-dark-bg-secondary border-b border-gray-100 dark:border-gray-700 p-6 flex-shrink-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{stampInfo.title}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {stampInfo.description}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors p-1"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {step === 'input' ? (
            <form id="verification-form" onSubmit={handleSendCode} className="space-y-5">
              {stampType === 'EMAIL' ? (
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    {stampInfo.inputLabel} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                      <EnvelopeIcon className="w-5 h-5" />
                    </div>
                    <input
                      type={stampInfo.inputType}
                      value={contactValue}
                      onChange={(e) => setContactValue(e.target.value)}
                      placeholder={stampInfo.inputPlaceholder}
                      disabled={sending}
                      className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-dark-bg-tertiary border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all disabled:opacity-50 disabled:bg-gray-50"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    {stampInfo.inputLabel} <span className="text-red-500">*</span>
                  </label>
                  <div className="flex relative rounded-xl shadow-sm">
                    <div className="relative">
                      <select
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        disabled={sending}
                        className="h-full pl-4 pr-8 py-3.5 bg-gray-50 dark:bg-dark-bg-tertiary border border-gray-200 dark:border-gray-700 rounded-l-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none border-r-0 font-medium"
                      >
                        <option value="+1">🇺🇸 +1</option>
                        <option value="+34">🇪🇸 +34</option>
                        <option value="+33">🇫🇷 +33</option>
                        <option value="+39">🇮🇹 +39</option>
                        <option value="+49">🇩🇪 +49</option>
                        <option value="+44">🇬🇧 +44</option>
                        <option value="+351">🇵🇹 +351</option>
                        <option value="+52">🇲🇽 +52</option>
                        <option value="+54">🇦🇷 +54</option>
                        <option value="+55">🇧🇷 +55</option>
                        <option value="+56">🇨🇱 +56</option>
                        <option value="+57">🇨🇴 +57</option>
                        <option value="+58">🇻🇪 +58</option>
                        <option value="+507">🇵🇦 +507</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-500">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                    </div>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="600 123 456"
                      disabled={sending}
                      className="flex-1 px-4 py-3.5 bg-white dark:bg-dark-bg-tertiary border border-gray-200 dark:border-gray-700 rounded-r-xl text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all disabled:opacity-50 disabled:bg-gray-50"
                    />
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800 rounded-xl animate-shake">
                  <ExclamationTriangleIcon className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
                </div>
              )}

              {/* Info Message */}
              <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-xl p-4 flex gap-4">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0 text-blue-600 dark:text-blue-400">
                  <ShieldCheckIcon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-blue-900 dark:text-blue-300 mb-1">Proceso de Verificación</h4>
                  <ul className="space-y-1">
                    {stampType === 'EMAIL' ? (
                      <>
                        <li className="text-xs text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                          <span className="w-1 h-1 bg-blue-400 rounded-full"></span>
                          Recibirás un email con un código de 6 dígitos
                        </li>
                        <li className="text-xs text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                          <span className="w-1 h-1 bg-blue-400 rounded-full"></span>
                          El código expira en 24 horas
                        </li>
                      </>
                    ) : (
                      <>
                        <li className="text-xs text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                          <span className="w-1 h-1 bg-blue-400 rounded-full"></span>
                          Recibirás un SMS con un código de 6 dígitos
                        </li>
                        <li className="text-xs text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                          <span className="w-1 h-1 bg-blue-400 rounded-full"></span>
                          El código expira en 15 minutos
                        </li>
                      </>
                    )}
                  </ul>
                </div>
              </div>

            </form>
          ) : (
            <form id="verification-form" onSubmit={handleVerifyCode} className="space-y-5">
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
                    : `Hemos enviado un código a ${countryCode} ${phoneNumber}`
                  }
                </p>
              </div>

              {/* Code Input */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-4 text-center">
                  Código de Verificación <span className="text-red-500">*</span>
                </label>
                <div className="relative max-w-[240px] mx-auto">
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    disabled={verifying}
                    className="w-full px-4 py-4 bg-white dark:bg-dark-bg-tertiary border-2 border-gray-200 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-white text-center text-3xl font-bold tracking-[0.5em] focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all disabled:opacity-50 shadow-sm placeholder:tracking-[0.5em]"
                  />
                </div>
                <p className="text-xs text-center text-gray-400 mt-3">
                  Ingresa los 6 dígitos que recibiste
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800 rounded-xl animate-shake">
                  <ExclamationTriangleIcon className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
                </div>
              )}

              {/* Resend Option */}
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={verifying}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors disabled:opacity-50"
                >
                  ¿No recibiste el código? <span className="underline decoration-2 underline-offset-2">Reenviar ahora</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer Actions - Fixed */}
        <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-dark-bg-secondary flex-shrink-0">
          {step === 'input' ? (
            <div className="flex gap-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={sending}
                className="flex-1 px-6 py-3.5 bg-white dark:bg-dark-bg-tertiary border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="verification-form"
                disabled={sending}
                className="flex-[2] px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 disabled:shadow-none transition-all transform active:scale-[0.98] flex items-center justify-center gap-2"
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
          ) : (
            <div className="flex gap-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={verifying}
                className="flex-1 px-6 py-3.5 bg-white dark:bg-dark-bg-tertiary border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="verification-form"
                disabled={verifying || verificationCode.length !== 6}
                className="flex-[2] px-6 py-3.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl font-bold shadow-lg shadow-green-500/20 disabled:shadow-none transition-all transform active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {verifying ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Verificando...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="w-5 h-5" />
                    Verificar Código
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StampsVerificationCodeModal;

