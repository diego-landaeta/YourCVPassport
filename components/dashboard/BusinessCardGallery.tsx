import React, { useState, useRef } from 'react';
import { Profile } from '../../types';
import QRCode from 'qrcode';
import { useLanguage } from '../../contexts/LanguageContext';
import { businessCardStyles, BusinessCardStyle } from './businessCardStyles';
import { templates } from '../templates/templateData';
import { supabase } from '../../supabase/client';
import { useToastContext } from '../../context/ToastContext';

interface BusinessCardGalleryProps {
  profile: Profile | null;
  shareUrl: string;
  userEmail?: string;
}

interface CardPreviewProps {
  style: BusinessCardStyle;
  templateName: string;
  isPro: boolean;
  isActive: boolean;
  profile: Profile | null;
  shareUrl: string;
  userEmail?: string;
  qrCodeUrl: string;
  onSelect?: () => void;
}

const CardPreview: React.FC<CardPreviewProps> = ({
  style,
  templateName,
  isPro,
  isActive,
  profile,
  shareUrl,
  userEmail,
  qrCodeUrl,
  onSelect
}) => {
  const customColor = profile?.template_color || style.accentColor;
  const displayName = profile?.full_name || 'Tu Nombre';
  const displayTitle = profile?.headline || 'Tu Título Profesional';
  const displayEmail = userEmail || 'email@ejemplo.com';

  const getShortId = (id: string | undefined) => {
    if (!id) return 'TU-ID';
    if (id.match(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/)) {
      return id.substring(0, 10).toUpperCase();
    }
    return id.substring(0, 10).toUpperCase();
  };

  const renderDecorativeElements = () => {
    if (style.decorativeElements === 'circles') {
      return (
        <>
          <div className="absolute top-0 left-0 w-20 h-20 opacity-10">
            <svg viewBox="0 0 100 100">
              <circle cx="0" cy="0" r="100" fill={customColor} />
            </svg>
          </div>
          <div className="absolute bottom-0 right-0 w-24 h-24 opacity-10">
            <svg viewBox="0 0 100 100">
              <circle cx="100" cy="100" r="100" fill={customColor} />
            </svg>
          </div>
        </>
      );
    } else if (style.decorativeElements === 'squares') {
      return (
        <>
          <div className="absolute top-0 right-0 w-16 h-16 opacity-10">
            <svg viewBox="0 0 100 100">
              <rect width="100" height="100" fill={customColor} />
            </svg>
          </div>
          <div className="absolute bottom-0 left-0 w-20 h-20 opacity-10">
            <svg viewBox="0 0 100 100">
              <rect width="100" height="100" fill={customColor} transform="rotate(45 50 50)" />
            </svg>
          </div>
        </>
      );
    }
    return null;
  };

  const isLightText = style.textColor === '#FFFFFF' || (style.background.includes('gradient') && !style.background.includes('#FFF'));

  return (
    <div className="space-y-3 group">
      {/* Template Name Badge */}
      <div className="flex items-center justify-between">
        <span className="inline-block px-3 py-1.5 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-lg text-xs font-bold text-gray-700 dark:text-gray-200 shadow-sm">
          {templateName}
        </span>
        {isPro && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold rounded-lg shadow-lg">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            PRO
          </span>
        )}
      </div>

      {/* Card Preview with Hover Effect */}
      <div className="relative">
        {/* Active Badge Overlay */}
        {isActive && (
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-30">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-bold rounded-full shadow-xl border-2 border-white dark:border-gray-800">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Tu Tarjeta Actual
            </div>
          </div>
        )}

        {/* Card Container with 3D Effect */}
        <div
          onClick={onSelect}
          className={`relative rounded-2xl p-5 shadow-2xl overflow-hidden transition-all duration-300 transform cursor-pointer ${
            isActive
              ? 'ring-4 ring-green-500 ring-opacity-50 scale-105'
              : 'hover:scale-105 hover:shadow-3xl hover:ring-2 hover:ring-blue-400 hover:ring-opacity-50'
          }`}
          style={{
            aspectRatio: '1.75 / 1',
            background: style.background,
            border: style.borderStyle || 'none',
            fontFamily: style.fontFamily,
          }}
        >
          {renderDecorativeElements()}

          {/* Content */}
          <div className="relative h-full flex flex-col justify-between z-10">
            {/* Logo */}
            <div className="flex items-start justify-between mb-2">
              <div
                className="font-bold text-sm tracking-tight"
                style={{
                  color: customColor,
                  fontFamily: style.fontFamily === 'serif' ? 'Georgia, serif' : 'inherit',
                }}
              >
                YourCVPassport
              </div>
            </div>

            {/* Main Content */}
            <div className="flex items-center justify-between flex-1">
              <div className="flex-1 pr-3">
                <div
                  className="text-[0.55rem] font-medium mb-1 uppercase tracking-wider opacity-70"
                  style={{ color: style.textColor }}
                >
                  Tarjeta de Visita
                </div>
                <h2
                  className="text-base font-bold mb-1 leading-tight"
                  style={{
                    color: style.textColor,
                    fontFamily: style.fontFamily === 'serif' ? 'Georgia, serif' : 'inherit',
                  }}
                >
                  {displayName}
                </h2>
                <p
                  className="text-xs font-semibold mb-3"
                  style={{
                    color: customColor,
                    background: style.headerGradient || 'transparent',
                    WebkitBackgroundClip: style.headerGradient ? 'text' : 'unset',
                    WebkitTextFillColor: style.headerGradient ? 'transparent' : 'unset',
                  }}
                >
                  {displayTitle}
                </p>

                {/* Contact Info */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5" style={{ color: style.textColor, opacity: 0.85 }}>
                    <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: customColor }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="text-[0.6rem] truncate font-medium">{displayEmail}</span>
                  </div>
                  <div className="flex items-center gap-1.5" style={{ color: style.textColor, opacity: 0.85 }}>
                    <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: customColor }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                    <span className="text-[0.6rem] truncate font-medium">yourcvpassport.com</span>
                  </div>
                </div>
              </div>

              {/* QR Code with Glow Effect */}
              {qrCodeUrl && (
                <div className="flex-shrink-0 relative">
                  <div className="absolute inset-0 bg-blue-400 opacity-20 blur-xl rounded-xl"></div>
                  <div className="relative bg-white p-2 rounded-xl shadow-2xl">
                    <img
                      src={qrCodeUrl}
                      alt="QR Code"
                      className="w-16 h-16"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div
              className="pt-2 mt-2"
              style={{
                borderTop: `1px solid ${isLightText ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}`,
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-[0.55rem] uppercase tracking-wider font-semibold" style={{ color: style.textColor, opacity: 0.6 }}>
                    ID:
                  </span>
                  <span className="text-[0.6rem] font-mono font-bold" style={{ color: customColor, opacity: 0.9 }}>
                    {getShortId(profile?.id)}
                  </span>
                </div>
                <div className="text-[0.55rem] font-medium" style={{ color: style.textColor, opacity: 0.5 }}>
                  yourcvpassport.com
                </div>
              </div>
            </div>
          </div>

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
        </div>

        {/* Selection Indicator for Active Card */}
        {isActive && (
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
            <div className="w-16 h-1 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full shadow-lg"></div>
          </div>
        )}
      </div>
    </div>
  );
};

const BusinessCardGallery: React.FC<BusinessCardGalleryProps> = ({ profile, shareUrl, userEmail }) => {
  const { lang } = useLanguage();
  const toast = useToastContext();
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [filter, setFilter] = useState<'all' | 'free' | 'pro'>('all');
  const [selectedCard, setSelectedCard] = useState<string>(profile?.business_card_template || profile?.template || 'classic');
  const [isSaving, setIsSaving] = useState(false);

  // Generate production URL for QR code
  const getProductionUrl = (url: string) => {
    // Replace localhost with production domain
    return url.replace(/localhost:\d+/, 'yourcvpassport.com').replace('http://', 'https://');
  };

  // Generate QR Code with production URL
  React.useEffect(() => {
    const generateQR = async () => {
      try {
        const productionUrl = getProductionUrl(shareUrl);
        const url = await QRCode.toDataURL(productionUrl, {
          width: 256,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
          errorCorrectionLevel: 'H',
        });
        setQrCodeUrl(url);
      } catch (err) {
        toast.error('Error al generar código QR');
      }
    };

    if (shareUrl) {
      generateQR();
    }
  }, [shareUrl]);

  // Filter templates based on selection
  const filteredTemplates = templates.filter(template => {
    if (filter === 'all') return true;
    if (filter === 'free') return !template.isPro;
    if (filter === 'pro') return template.isPro;
    return true;
  });

  const freeCount = templates.filter(t => !t.isPro).length;
  const proCount = templates.filter(t => t.isPro).length;

  // Handle card selection
  const handleCardSelect = async (templateId: string) => {
    if (!profile?.id) return;

    setIsSaving(true);
    setSelectedCard(templateId);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ business_card_template: templateId })
        .eq('id', profile.id);

      if (error) {
        toast.error('Error al guardar selección de tarjeta');
        // Revert selection on error
        setSelectedCard(profile?.business_card_template || profile?.template || 'classic');
      }
    } catch (error) {
      toast.error('Error al guardar tarjeta de presentación');
      setSelectedCard(profile?.business_card_template || profile?.template || 'classic');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-full mb-4">
          <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
          </svg>
          <span className="text-sm font-bold text-gray-700 dark:text-gray-200">Galería de Diseños</span>
        </div>

        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-3 bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
          Explora Todas las Tarjetas de Visita
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Cada diseño coincide perfectamente con el estilo de tu CV. Tu tarjeta se actualiza automáticamente cuando cambias de template.
        </p>

        {/* Filter Buttons */}
        <div className="flex justify-center gap-3 mt-6">
          <button
            onClick={() => setFilter('all')}
            className={`group relative px-6 py-3 rounded-xl font-bold transition-all duration-300 ${
              filter === 'all'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl scale-105'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-md hover:shadow-lg'
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Todas
              <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
                filter === 'all'
                  ? 'bg-white/20 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}>
                {templates.length}
              </span>
            </span>
          </button>

          <button
            onClick={() => setFilter('free')}
            className={`group relative px-6 py-3 rounded-xl font-bold transition-all duration-300 ${
              filter === 'free'
                ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-xl scale-105'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-md hover:shadow-lg'
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Gratis
              <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
                filter === 'free'
                  ? 'bg-white/20 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}>
                {freeCount}
              </span>
            </span>
          </button>

          <button
            onClick={() => setFilter('pro')}
            className={`group relative px-6 py-3 rounded-xl font-bold transition-all duration-300 ${
              filter === 'pro'
                ? 'bg-gradient-to-r from-yellow-500 to-orange-600 text-white shadow-xl scale-105'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-md hover:shadow-lg'
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              Pro
              <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
                filter === 'pro'
                  ? 'bg-white/20 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}>
                {proCount}
              </span>
            </span>
          </button>
        </div>
      </div>

      {/* Gallery Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {filteredTemplates.map((template) => {
          const style = businessCardStyles[template.id];
          if (!style) return null;

          return (
            <CardPreview
              key={template.id}
              style={style}
              templateName={template.name[lang]}
              isPro={template.isPro}
              isActive={selectedCard === template.id}
              profile={profile}
              shareUrl={shareUrl}
              userEmail={userEmail}
              qrCodeUrl={qrCodeUrl}
              onSelect={() => handleCardSelect(template.id)}
            />
          );
        })}
      </div>

      {/* Saving Indicator */}
      {isSaving && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-xl flex items-center gap-2 animate-fade-in z-50">
          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="font-medium">Guardando tarjeta...</span>
        </div>
      )}

      {/* Info Footer */}
      <div className="text-center pt-8 border-t border-gray-200 dark:border-gray-700">
        <div className="inline-flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl shadow-lg">
          <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-gray-900 dark:text-white">
              💡 Consejo Profesional
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Haz clic en cualquier tarjeta para seleccionarla. Puedes elegir un diseño diferente al de tu CV.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessCardGallery;
