/**
 * ATS PDF Preview Component
 *
 * Componente para previsualizar y generar PDFs ATS-friendly
 * Permite seleccionar entre diferentes plantillas y opciones de exportación
 */

import React, { useState, useMemo } from 'react';
import { PDFViewer, PDFDownloadLink, pdf } from '@react-pdf/renderer';
import { ClassicATSTemplate, ModernATSTemplate, MinimalATSTemplate } from './templates';
import {
  ATSTemplateType,
  ATSExportOptions,
  ATSProcessedData,
} from '../../types/ats-export.types';
import {
  processProfileForATS,
  generateFileName,
  validateProfileForExport,
  ATS_TEMPLATE_CONFIGS,
} from '../../utils/pdf/ats-optimizer';
import { FullProfileData, Stamp } from '../../types';
import { useATSExport } from '../../hooks/useATSExport';

interface ATSPDFPreviewProps {
  profile: FullProfileData;
  stamps: Stamp[];
  language?: 'en' | 'es';
  onDownloadComplete?: () => void;
}

export const ATSPDFPreview: React.FC<ATSPDFPreviewProps> = ({
  profile,
  stamps,
  language = 'en',
  onDownloadComplete,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<ATSTemplateType>('modern');
  const [showPreview, setShowPreview] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [useServerSide, setUseServerSide] = useState(false);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'docx'>('pdf');

  // Use the new export hook
  const { exportAndDownload, isExporting, error: exportError, progress } = useATSExport({
    preferServerSide: useServerSide,
  });

  // Procesar datos del perfil para ATS
  const processedData: ATSProcessedData = useMemo(
    () => processProfileForATS(profile, stamps, language),
    [profile, stamps, language]
  );

  // Validar perfil
  const validation = useMemo(
    () => validateProfileForExport(profile),
    [profile]
  );

  // Generar el documento PDF según la plantilla seleccionada
  const generateDocument = () => {
    switch (selectedTemplate) {
      case 'classic':
        return <ClassicATSTemplate data={processedData} language={language} />;
      case 'modern':
        return <ModernATSTemplate data={processedData} language={language} />;
      case 'minimal':
        return <MinimalATSTemplate data={processedData} language={language} />;
      default:
        return <ModernATSTemplate data={processedData} language={language} />;
    }
  };

  // Nombre del archivo
  const fileName = useMemo(
    () => generateFileName(profile.profile.full_name, selectedTemplate),
    [profile.profile.full_name, selectedTemplate]
  );

  // Descargar documento (PDF o DOCX)
  const handleDirectDownload = async () => {
    setIsGenerating(true);
    try {
      const doc = generateDocument();

      await exportAndDownload(
        profile.profile.id,
        {
          template: selectedTemplate,
          language,
          format: exportFormat,
          includeStamps: true,
          includeSummary: true,
          includeSkills: true,
          includeLanguages: true,
          includePortfolio: true,
          includeCertifications: true,
        },
        doc,
        processedData,
        fileName
      );

      onDownloadComplete?.();
    } catch (error) {
      console.error(`Error generating ${exportFormat.toUpperCase()}:`, error);
    } finally {
      setIsGenerating(false);
    }
  };

  const templates: Array<{
    id: ATSTemplateType;
    name: string;
    description: string;
    preview: string;
  }> = [
    {
      id: 'classic',
      name: 'Classic',
      description: language === 'en'
        ? 'Traditional serif fonts, black & white, conservative layout'
        : 'Fuentes serif tradicionales, blanco y negro, diseño conservador',
      preview: '📄',
    },
    {
      id: 'modern',
      name: 'Modern',
      description: language === 'en'
        ? 'Clean sans-serif, professional blue accent, contemporary'
        : 'Sans-serif limpio, acento azul profesional, contemporáneo',
      preview: '📋',
    },
    {
      id: 'minimal',
      name: 'Minimal',
      description: language === 'en'
        ? 'Ultra-clean, maximum whitespace, modern aesthetic'
        : 'Ultra-limpio, máximo espacio en blanco, estética moderna',
      preview: '📃',
    },
  ];

  if (!validation.valid) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-300 mb-3">
          {language === 'en'
            ? 'Profile Incomplete'
            : 'Perfil Incompleto'}
        </h3>
        <p className="text-yellow-700 dark:text-yellow-200 mb-4">
          {language === 'en'
            ? 'Please complete your profile before exporting:'
            : 'Por favor completa tu perfil antes de exportar:'}
        </p>
        <ul className="list-disc list-inside space-y-1 text-yellow-700 dark:text-yellow-200">
          {validation.errors.map((error, index) => (
            <li key={index}>{error}</li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Template Selector */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary mb-4">
          {language === 'en' ? 'Choose Template' : 'Elige Plantilla'}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {templates.map((template) => {
            const config = ATS_TEMPLATE_CONFIGS[template.id];
            return (
              <button
                key={template.id}
                onClick={() => setSelectedTemplate(template.id)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  selectedTemplate === template.id
                    ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-dark-border hover:border-gray-300 dark:hover:border-dark-border-light bg-white dark:bg-dark-bg-secondary'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{template.preview}</span>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-dark-text-primary">
                      {template.name}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-dark-text-secondary mt-1">
                      {template.description}
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-xs text-gray-500 dark:text-dark-text-tertiary">
                      <span>Font: {config.font.family}</span>
                      {config.colors.accent && (
                        <span
                          className="w-3 h-3 rounded-full border border-gray-300 dark:border-dark-border"
                          style={{ backgroundColor: config.colors.accent }}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Format Selector */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-dark-text-primary mb-3">
          {language === 'en' ? 'Export Format' : 'Formato de Exportación'}
        </h3>
        <div className="flex gap-3">
          <button
            onClick={() => setExportFormat('pdf')}
            className={`flex-1 p-3 rounded-lg border-2 transition-all ${
              exportFormat === 'pdf'
                ? 'border-purple-500 dark:border-purple-400 bg-purple-100 dark:bg-purple-900/40 text-purple-900 dark:text-purple-200'
                : 'border-gray-200 dark:border-dark-border hover:border-gray-300 dark:hover:border-dark-border-light bg-white dark:bg-dark-bg-secondary'
            }`}
          >
            <div className="text-center">
              <div className="text-2xl mb-1">📄</div>
              <div className="font-semibold text-gray-900 dark:text-dark-text-primary">PDF</div>
              <div className="text-xs text-gray-600 dark:text-dark-text-tertiary mt-1">
                {language === 'en' ? 'Non-editable' : 'No editable'}
              </div>
            </div>
          </button>
          <button
            onClick={() => setExportFormat('docx')}
            className={`flex-1 p-3 rounded-lg border-2 transition-all ${
              exportFormat === 'docx'
                ? 'border-purple-500 dark:border-purple-400 bg-purple-100 dark:bg-purple-900/40 text-purple-900 dark:text-purple-200'
                : 'border-gray-200 dark:border-dark-border hover:border-gray-300 dark:hover:border-dark-border-light bg-white dark:bg-dark-bg-secondary'
            }`}
          >
            <div className="text-center">
              <div className="text-2xl mb-1">📝</div>
              <div className="font-semibold text-gray-900 dark:text-dark-text-primary">DOCX</div>
              <div className="text-xs text-gray-600 dark:text-dark-text-tertiary mt-1">
                {language === 'en' ? 'Editable' : 'Editable'}
              </div>
            </div>
          </button>
        </div>
        <p className="text-xs text-gray-600 dark:text-dark-text-secondary mt-3">
          {exportFormat === 'pdf'
            ? language === 'en'
              ? '📄 PDF is ATS-friendly and preserves exact formatting'
              : '📄 PDF es compatible con ATS y preserva el formato exacto'
            : language === 'en'
            ? '📝 DOCX is editable in Word/Google Docs and ATS-compatible'
            : '📝 DOCX es editable en Word/Google Docs y compatible con ATS'}
        </p>
      </div>

      {/* Export Method Toggle */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={useServerSide}
                onChange={(e) => setUseServerSide(e.target.checked)}
                className="w-5 h-5 text-blue-600 dark:text-blue-400 rounded focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-dark-bg-secondary border-gray-300 dark:border-dark-border"
              />
              <div>
                <span className="font-medium text-gray-900 dark:text-dark-text-primary">
                  {language === 'en' ? 'Use Server-Side Generation' : 'Usar Generación en Servidor'}
                </span>
                <p className="text-sm text-gray-600 dark:text-dark-text-secondary">
                  {language === 'en'
                    ? 'Generate PDF on server for better compatibility (experimental)'
                    : 'Generar PDF en el servidor para mejor compatibilidad (experimental)'}
                </p>
              </div>
            </label>
          </div>
          {progress > 0 && progress < 100 && (
            <div className="ml-4">
              <div className="w-32 bg-gray-200 dark:bg-dark-bg-tertiary rounded-full h-2">
                <div
                  className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-gray-600 dark:text-dark-text-tertiary mt-1">{progress}%</p>
            </div>
          )}
        </div>
        {exportError && (
          <div className="mt-3 text-sm text-red-600 dark:text-red-400 flex items-start gap-2">
            <span>⚠️</span>
            <span>{exportError}</span>
          </div>
        )}
      </div>

      {/* Profile Stats */}
      <div className="bg-gray-50 dark:bg-dark-bg-secondary border border-transparent dark:border-dark-border rounded-lg p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary">
              {processedData.profile.experiences?.length || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-dark-text-secondary">
              {language === 'en' ? 'Experiences' : 'Experiencias'}
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary">
              {processedData.profile.skills?.length || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-dark-text-secondary">
              {language === 'en' ? 'Skills' : 'Habilidades'}
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary">
              {processedData.stamps.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-dark-text-secondary">
              {language === 'en' ? 'Verified' : 'Verificado'}
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary">
              {processedData.keywords.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-dark-text-secondary">
              {language === 'en' ? 'Keywords' : 'Palabras clave'}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleDirectDownload}
          disabled={isGenerating}
          className="flex-1 sm:flex-none px-6 py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
        >
          {isGenerating
            ? language === 'en'
              ? 'Generating...'
              : 'Generando...'
            : language === 'en'
            ? `⬇ Download ${exportFormat.toUpperCase()}`
            : `⬇ Descargar ${exportFormat.toUpperCase()}`}
        </button>

        <button
          onClick={() => setShowPreview(!showPreview)}
          className="flex-1 sm:flex-none px-6 py-3 bg-white dark:bg-dark-bg-secondary border border-gray-300 dark:border-dark-border text-gray-700 dark:text-dark-text-primary rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary transition-colors"
        >
          {showPreview
            ? language === 'en'
              ? '👁 Hide Preview'
              : '👁 Ocultar Vista'
            : language === 'en'
            ? '👁 Show Preview'
            : '👁 Mostrar Vista'}
        </button>

        {/* Alternative: PDFDownloadLink (less control, but simpler) */}
        <PDFDownloadLink
          document={generateDocument()}
          fileName={fileName}
          className="flex-1 sm:flex-none px-6 py-3 bg-gray-600 dark:bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors text-center"
        >
          {({ loading }) =>
            loading
              ? language === 'en'
                ? 'Preparing...'
                : 'Preparando...'
              : language === 'en'
              ? '💾 Save As'
              : '💾 Guardar Como'
          }
        </PDFDownloadLink>
      </div>

      {/* PDF Preview */}
      {showPreview && (
        <div className="border-2 border-gray-300 dark:border-dark-border rounded-lg overflow-hidden">
          <div className="bg-gray-100 dark:bg-dark-bg-secondary px-4 py-2 border-b border-gray-300 dark:border-dark-border">
            <p className="text-sm text-gray-600 dark:text-dark-text-secondary">
              {language === 'en' ? 'PDF Preview' : 'Vista Previa del PDF'}
            </p>
          </div>
          <div style={{ height: '800px' }}>
            <PDFViewer width="100%" height="100%">
              {generateDocument()}
            </PDFViewer>
          </div>
        </div>
      )}

      {/* ATS Tips */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
          {language === 'en' ? '💡 ATS Optimization Tips' : '💡 Consejos de Optimización ATS'}
        </h4>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>
            ✓ {language === 'en'
              ? 'Uses standard fonts for maximum compatibility'
              : 'Usa fuentes estándar para máxima compatibilidad'}
          </li>
          <li>
            ✓ {language === 'en'
              ? 'Simple layout without tables or columns'
              : 'Diseño simple sin tablas ni columnas'}
          </li>
          <li>
            ✓ {language === 'en'
              ? 'Standard section names recognized by ATS'
              : 'Nombres de sección estándar reconocidos por ATS'}
          </li>
          <li>
            ✓ {language === 'en'
              ? `${processedData.keywords.length} keywords extracted automatically`
              : `${processedData.keywords.length} palabras clave extraídas automáticamente`}
          </li>
          {processedData.stamps.length > 0 && (
            <li>
              ✓ {language === 'en'
                ? `Includes ${processedData.stamps.length} verified credentials`
                : `Incluye ${processedData.stamps.length} credenciales verificadas`}
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default ATSPDFPreview;
