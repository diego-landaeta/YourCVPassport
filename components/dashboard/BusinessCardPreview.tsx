import React, { useRef } from 'react';
import { Profile } from '../../types';
import QRCode from 'qrcode';
import { getBusinessCardStyle, BusinessCardStyle } from './businessCardStyles';
import { useTranslations } from '../../hooks/useTranslations';

interface BusinessCardPreviewProps {
  profile: Profile | null;
  shareUrl: string;
  userEmail?: string;
  onDownload?: () => void;
}

const BusinessCardPreview: React.FC<BusinessCardPreviewProps> = ({ profile, shareUrl, userEmail, onDownload }) => {
  const t = useTranslations();
  const cardRef = useRef<HTMLDivElement>(null);
  const [qrCodeUrl, setQrCodeUrl] = React.useState<string>('');

  // Get the style based on user's selected template
  const style: BusinessCardStyle = getBusinessCardStyle(profile?.template);
  const customColor = profile?.template_color || style.accentColor;

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
      } catch (err) {}
    };

    if (shareUrl) {
      generateQR();
    }
  }, [shareUrl]);

  const handleDownloadPNG = async () => {
    if (!cardRef.current) return;

    try {
      const html2canvas = (await import('html2canvas')).default;

      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        backgroundColor: null,
        logging: false,
        useCORS: true,
      });

      const link = document.createElement('a');
      link.download = `${profile?.slug || 'tarjeta'}-business-card.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      if (onDownload) onDownload();
    } catch (error) {}
  };

  const handleDownloadPDF = async () => {
    if (!cardRef.current) return;

    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        backgroundColor: null,
        logging: false,
        useCORS: true,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [85.6, 54], // Business card size (3.5" x 2.125")
      });

      pdf.addImage(imgData, 'PNG', 0, 0, 85.6, 54);
      pdf.save(`${profile?.slug || 'tarjeta'}-business-card.pdf`);

      if (onDownload) onDownload();
    } catch (error) {}
  };

  const displayName = profile?.full_name || t.dashboard.businessCard.yourName;
  const displayTitle = profile?.headline || t.dashboard.businessCard.yourTitle;
  const displayEmail = userEmail || t.dashboard.businessCard.emailPlaceholder;

  // Generate production URL instead of localhost
  const getDisplayUrl = (url: string) => {
    // Replace localhost with production domain
    const productionUrl = url.replace(/localhost:\d+/, 'yourcvpassport.com');
    // Remove protocol for display
    return productionUrl.replace('https://', '').replace('http://', '');
  };

  const displayUrl = getDisplayUrl(shareUrl);

  // Extract first 10 characters of UUID for ID display (in uppercase)
  const getShortId = (id: string | undefined) => {
    if (!id) return t.dashboard.businessCard.yourId;
    if (id.match(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/)) {
      return id.substring(0, 10).toUpperCase();
    }
    return id.substring(0, 10).toUpperCase();
  };

  // Render decorative elements based on style
  const renderDecorativeElements = () => {
    const adjustColorOpacity = (color: string, opacity: number) => {
      if (color.startsWith('#')) {
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
      }
      return color;
    };
    
    return (
      <>
        <div className="absolute inset-0 overflow-hidden">
          <svg className="absolute -bottom-10 -left-10 w-[500px] h-[500px]" viewBox="0 0 500 500">
            <path d="M 0 250 Q 100 150 200 200 T 400 250 T 500 400 L 500 500 L 0 500 Z" fill={adjustColorOpacity(customColor, 0.12)} />
          </svg>
          <svg className="absolute -top-20 -left-20 w-[450px] h-[450px]" viewBox="0 0 500 500">
            <path d="M 0 0 Q 150 100 250 80 T 450 150 L 0 300 Z" fill={adjustColorOpacity(customColor, 0.08)} />
          </svg>
          <svg className="absolute top-0 -right-32 w-[600px] h-[600px]" viewBox="0 0 500 500">
            <path d="M 400 100 Q 500 150 480 250 Q 460 350 380 400 Q 300 450 250 380 Q 200 310 280 250 Q 360 190 400 100 Z" fill="rgba(255, 255, 255, 0.95)" />
          </svg>
          <svg className="absolute -bottom-16 right-0 w-[400px] h-[300px]" viewBox="0 0 400 300">
            <path d="M 400 200 Q 300 150 200 180 T 0 250 L 0 300 L 400 300 Z" fill={adjustColorOpacity(customColor, 0.1)} />
          </svg>
        </div>
      </>
    );
  };

  // Determine if text should be light or dark based on background
  const isLightText = style.textColor === '#FFFFFF' || style.background.includes('gradient') && !style.background.includes('#FFF');

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Card Preview */}
      <div
        ref={cardRef}
        className="relative rounded-2xl sm:rounded-3xl shadow-xl sm:shadow-2xl w-full max-w-3xl mx-auto overflow-hidden"
        style={{
          aspectRatio: '1.75 / 1',
          background: style.background,
          border: style.borderStyle || 'none',
          fontFamily: style.fontFamily,
        }}
      >
        {/* Decorative Elements */}
        {renderDecorativeElements()}

        {/* Content */}
        <div className="relative h-full flex flex-col z-10 p-4 sm:p-6 md:p-8 lg:p-10">
          {/* Header with Logo - Minimal */}
          <div className="flex items-start justify-between mb-auto relative z-10">
            <div
              className="font-bold text-base sm:text-lg tracking-tight"
              style={{
                color: 'rgba(0,0,0,0.4)',
                fontFamily: style.fontFamily === 'serif' ? 'Georgia, serif' : 'inherit',
              }}
            >
              YourCVPassport
            </div>
          </div>

          {/* Main Content - Layout varies by style */}
          {style.layout === 'split' ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between flex-1 px-2 sm:px-6 md:px-10 py-4 sm:py-6 md:py-8 gap-4 sm:gap-6">
              {/* Left Content - Clean and Professional */}
              <div className="flex-1 space-y-3 sm:space-y-4 md:space-y-6 w-full sm:w-auto">
                {/* Name and Title */}
                <div>
                  <h2
                    className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-1 sm:mb-2 leading-tight"
                    style={{
                      color: style.textColor,
                      fontFamily: style.fontFamily === 'serif' ? 'Georgia, serif' : 'inherit',
                    }}
                  >
                    {displayName}
                  </h2>
                  <div 
                    className="inline-block px-4 py-1.5 rounded-md"
                    style={{ 
                      backgroundColor: `${customColor}15`,
                      borderLeft: `3px solid ${customColor}`
                    }}
                  >
                    <p
                      className="text-sm sm:text-base font-semibold uppercase tracking-wide"
                      style={{ color: customColor }}
                    >
                      {displayTitle}
                    </p>
                  </div>
                </div>

                {/* Contact Info - Clean List */}
                <div className="space-y-1.5 sm:space-y-2 md:space-y-2.5 pt-1 sm:pt-2">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                      style={{ color: customColor }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span className="text-xs sm:text-sm font-medium" style={{ color: style.textColor, opacity: 0.8 }}>
                      {profile?.phone || '(+00) 123 456 780'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                      style={{ color: customColor }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="text-xs sm:text-sm font-medium break-all" style={{ color: style.textColor, opacity: 0.8 }}>
                      {displayEmail}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                      style={{ color: customColor }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                    <span className="text-xs sm:text-sm font-medium break-all" style={{ color: style.textColor, opacity: 0.8 }}>
                      {displayUrl}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right QR Code - Clean and Simple */}
              {qrCodeUrl && (
                <div className="flex-shrink-0 self-center sm:self-auto">
                  <div
                    className="p-2 sm:p-3 md:p-4 rounded-xl sm:rounded-2xl"
                    style={{ 
                      backgroundColor: 'white',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
                    }}
                  >
                    <img
                      src={qrCodeUrl}
                      alt="QR Code"
                      className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32"
                    />
                  </div>
                </div>
              )}
            </div>
          ) : style.layout === 'centered' ? (
            <div className="flex items-center justify-between flex-1 px-12 py-10">
              <div className="flex-1">
                <h2 className="text-5xl sm:text-6xl md:text-7xl font-bold mb-6 leading-none" style={{ color: style.textColor, fontFamily: style.fontFamily === 'serif' ? 'Georgia, serif' : 'inherit' }}>
                  {displayName}
                </h2>
                <div className="space-y-3 text-base sm:text-lg" style={{ color: style.textColor, opacity: 0.9 }}>
                  <div>{profile?.phone || '1234567-32'}</div>
                  <div>{displayEmail}</div>
                  <div>{displayUrl}</div>
                </div>
              </div>
              {qrCodeUrl && (
                <div className="flex-shrink-0">
                  <div className="p-5 rounded-2xl" style={{ backgroundColor: 'white' }}>
                    <img src={qrCodeUrl} alt="QR Code" className="w-36 h-36" />
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Left layout - Same clean design
            <div className="flex items-center justify-between flex-1 px-10 py-8">
              {/* Left Content - Clean and Professional */}
              <div className="flex-1 space-y-6">
                {/* Name and Title */}
                <div>
                  <h2
                    className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2 leading-tight"
                    style={{
                      color: style.textColor,
                      fontFamily: style.fontFamily === 'serif' ? 'Georgia, serif' : 'inherit',
                    }}
                  >
                    {displayName}
                  </h2>
                  <div 
                    className="inline-block px-4 py-1.5 rounded-md"
                    style={{ 
                      backgroundColor: `${customColor}15`,
                      borderLeft: `3px solid ${customColor}`
                    }}
                  >
                    <p
                      className="text-sm sm:text-base font-semibold uppercase tracking-wide"
                      style={{ color: customColor }}
                    >
                      {displayTitle}
                    </p>
                  </div>
                </div>

                {/* Contact Info - Clean List */}
                <div className="space-y-1.5 sm:space-y-2 md:space-y-2.5 pt-1 sm:pt-2">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                      style={{ color: customColor }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span className="text-xs sm:text-sm font-medium" style={{ color: style.textColor, opacity: 0.8 }}>
                      {profile?.phone || '(+00) 123 456 780'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                      style={{ color: customColor }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="text-xs sm:text-sm font-medium break-all" style={{ color: style.textColor, opacity: 0.8 }}>
                      {displayEmail}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                      style={{ color: customColor }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                    <span className="text-xs sm:text-sm font-medium break-all" style={{ color: style.textColor, opacity: 0.8 }}>
                      {displayUrl}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right QR Code - Clean and Simple */}
              {qrCodeUrl && (
                <div className="flex-shrink-0 self-center sm:self-auto">
                  <div
                    className="p-2 sm:p-3 md:p-4 rounded-xl sm:rounded-2xl"
                    style={{ 
                      backgroundColor: 'white',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
                    }}
                  >
                    <img
                      src={qrCodeUrl}
                      alt="QR Code"
                      className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer with ID - Minimal */}
          <div className="mt-auto pt-4 relative z-10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-medium" 
                style={{ color: 'rgba(0,0,0,0.35)' }}>
                {getShortId(profile?.id)}
              </span>
              <span className="text-xs font-medium" 
                style={{ color: 'rgba(0,0,0,0.35)' }}>
                yourcvpassport.com
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Download Buttons */}
      <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 px-4 sm:px-0">
        <button
          onClick={handleDownloadPNG}
          className="group relative flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-6 md:px-8 py-3 sm:py-4 rounded-lg sm:rounded-xl font-semibold text-sm sm:text-base transition-all shadow-md sm:shadow-lg hover:shadow-lg sm:hover:shadow-2xl hover:-translate-y-0.5 overflow-hidden"
          style={{
            backgroundColor: customColor,
            color: '#FFFFFF',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
          <svg className="w-4 h-4 sm:w-5 sm:h-5 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="relative z-10">{t.dashboard.businessCard.downloadPNG}</span>
        </button>

        <button
          onClick={handleDownloadPDF}
          className="group relative flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-6 md:px-8 py-3 sm:py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg sm:rounded-xl font-semibold text-sm sm:text-base transition-all shadow-md sm:shadow-lg hover:shadow-lg sm:hover:shadow-2xl hover:-translate-y-0.5 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
          <svg className="w-4 h-4 sm:w-5 sm:h-5 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <span className="relative z-10">{t.dashboard.businessCard.downloadPDF}</span>
        </button>
      </div>

      {/* Info Text */}
      <p className="text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400 px-4">
        {t.dashboard.businessCard.downloadDescription}
      </p>
    </div>
  );
};

export default BusinessCardPreview;

