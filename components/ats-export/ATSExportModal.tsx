/**
 * ATS Export Modal Component
 *
 * Modal completo para exportar CVs con opciones ATS-friendly
 * Incluye selector de plantillas, opciones de exportación y preview
 */

import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { ATSPDFPreview } from './ATSPDFPreview';
import { FullProfileData, Stamp } from '../../types';

interface ATSExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: FullProfileData;
  stamps: Stamp[];
  language?: 'en' | 'es';
}

export const ATSExportModal: React.FC<ATSExportModalProps> = ({
  isOpen,
  onClose,
  profile,
  stamps,
  language = 'en',
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'info'>('export');

  if (!isOpen) return null;

  const translations = {
    en: {
      title: 'Export ATS-Friendly CV',
      subtitle: 'Download your CV optimized for Applicant Tracking Systems',
      exportTab: 'Export',
      infoTab: 'ATS Info',
      close: 'Close',
      whatIsATS: 'What is an ATS?',
      atsDescription:
        'An Applicant Tracking System (ATS) is software used by recruiters and employers to collect, sort, scan, and rank job applications. Over 98% of Fortune 500 companies use ATS to filter candidates.',
      whyOptimize: 'Why optimize for ATS?',
      optimizeReasons: [
        'Increase chances of getting past automated screening',
        'Ensure all your information is correctly parsed',
        'Stand out with verified credentials',
        'Use industry-standard formatting',
      ],
      howItWorks: 'How our ATS optimization works:',
      optimizationFeatures: [
        'Simple, parseable fonts (Times, Helvetica)',
        'Linear layout without tables or columns',
        'Standard section names (Experience, Education, Skills)',
        'Automatic keyword extraction from your profile',
        'Verified credentials badges included',
        'Clean, professional formatting',
      ],
      bestPractices: 'Best Practices:',
      practices: [
        'Use the Classic template for traditional industries',
        'Modern template works well for tech companies',
        'Minimal is perfect for creative roles',
        'Always include your verified credentials',
        'Tailor keywords to job descriptions',
      ],
    },
    es: {
      title: 'Exportar CV ATS-Friendly',
      subtitle: 'Descarga tu CV optimizado para Sistemas de Seguimiento de Candidatos',
      exportTab: 'Exportar',
      infoTab: 'Info ATS',
      close: 'Cerrar',
      whatIsATS: '¿Qué es un ATS?',
      atsDescription:
        'Un Sistema de Seguimiento de Candidatos (ATS) es un software utilizado por reclutadores y empleadores para recopilar, ordenar, escanear y clasificar solicitudes de empleo. Más del 98% de las empresas Fortune 500 usan ATS para filtrar candidatos.',
      whyOptimize: '¿Por qué optimizar para ATS?',
      optimizeReasons: [
        'Aumentar las posibilidades de pasar el filtrado automatizado',
        'Asegurar que toda tu información se analice correctamente',
        'Destacar con credenciales verificadas',
        'Usar formato estándar de la industria',
      ],
      howItWorks: 'Cómo funciona nuestra optimización ATS:',
      optimizationFeatures: [
        'Fuentes simples y parseables (Times, Helvetica)',
        'Diseño lineal sin tablas ni columnas',
        'Nombres de sección estándar (Experiencia, Educación, Habilidades)',
        'Extracción automática de palabras clave de tu perfil',
        'Badges de credenciales verificadas incluidos',
        'Formato limpio y profesional',
      ],
      bestPractices: 'Mejores Prácticas:',
      practices: [
        'Usa la plantilla Classic para industrias tradicionales',
        'Modern funciona bien para empresas tecnológicas',
        'Minimal es perfecta para roles creativos',
        'Siempre incluye tus credenciales verificadas',
        'Adapta palabras clave a las descripciones de trabajo',
      ],
    },
  };

  const t = translations[language];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white dark:bg-dark-bg-primary rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-dark-bg-primary border-b border-gray-200 dark:border-dark-border px-6 py-4 z-10">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary">{t.title}</h2>
                <p className="text-sm text-gray-600 dark:text-dark-text-secondary mt-1">{t.subtitle}</p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:text-dark-text-tertiary dark:hover:text-dark-text-secondary transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mt-4 border-b border-gray-200 dark:border-dark-border -mb-px">
              <button
                onClick={() => setActiveTab('export')}
                className={`pb-3 px-1 border-b-2 font-medium transition-colors ${
                  activeTab === 'export'
                    ? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-dark-text-secondary hover:text-gray-900 dark:hover:text-dark-text-primary'
                }`}
              >
                {t.exportTab}
              </button>
              <button
                onClick={() => setActiveTab('info')}
                className={`pb-3 px-1 border-b-2 font-medium transition-colors ${
                  activeTab === 'info'
                    ? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-dark-text-secondary hover:text-gray-900 dark:hover:text-dark-text-primary'
                }`}
              >
                {t.infoTab}
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 140px)' }}>
            {activeTab === 'export' ? (
              <ATSPDFPreview
                profile={profile}
                stamps={stamps}
                language={language}
                onDownloadComplete={onClose}
              />
            ) : (
              <div className="space-y-6">
                {/* What is ATS */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary mb-3">
                    {t.whatIsATS}
                  </h3>
                  <p className="text-gray-700 dark:text-dark-text-secondary leading-relaxed">
                    {t.atsDescription}
                  </p>
                </div>

                {/* Why Optimize */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary mb-3">
                    {t.whyOptimize}
                  </h3>
                  <ul className="space-y-2">
                    {t.optimizeReasons.map((reason, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <span className="text-green-500 dark:text-green-400 mt-1">✓</span>
                        <span className="text-gray-700 dark:text-dark-text-secondary">{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* How it works */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary mb-3">
                    {t.howItWorks}
                  </h3>
                  <ul className="space-y-2">
                    {t.optimizationFeatures.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <span className="text-blue-500 dark:text-blue-400 mt-1">→</span>
                        <span className="text-gray-700 dark:text-dark-text-secondary">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Best Practices */}
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-300 mb-3">
                    💡 {t.bestPractices}
                  </h3>
                  <ul className="space-y-2">
                    {t.practices.map((practice, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <span className="text-yellow-600 dark:text-yellow-400 mt-1">•</span>
                        <span className="text-yellow-800 dark:text-yellow-200">{practice}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center border border-transparent dark:border-blue-800">
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">98%</div>
                    <div className="text-sm text-blue-800 dark:text-blue-300 mt-1">
                      {language === 'en' ? 'Fortune 500 use ATS' : 'Fortune 500 usan ATS'}
                    </div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center border border-transparent dark:border-green-800">
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400">75%</div>
                    <div className="text-sm text-green-800 dark:text-green-300 mt-1">
                      {language === 'en' ? 'CVs filtered by ATS' : 'CVs filtrados por ATS'}
                    </div>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 text-center border border-transparent dark:border-purple-800">
                    <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">3</div>
                    <div className="text-sm text-purple-800 dark:text-purple-300 mt-1">
                      {language === 'en' ? 'Optimized templates' : 'Plantillas optimizadas'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 dark:bg-dark-bg-secondary border-t border-gray-200 dark:border-dark-border px-6 py-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600 dark:text-dark-text-secondary">
                {language === 'en'
                  ? 'Powered by YourCVPassport'
                  : 'Desarrollado por YourCVPassport'}
              </p>
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 dark:text-dark-text-secondary hover:text-gray-900 dark:hover:text-dark-text-primary font-medium transition-colors"
              >
                {t.close}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ATSExportModal;
