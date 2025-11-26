/**
 * Hook for ATS PDF/DOCX Export
 *
 * Provides functions to export CVs using either:
 * - Client-side generation (@react-pdf/renderer or docx.js)
 * - Server-side generation (Supabase Edge Functions)
 */

import { useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { Document, Packer } from 'docx';
import { saveAs } from 'file-saver';
import { supabase } from '../supabase/client';
import { ATSTemplateType } from '../types/ats-export.types';
import { FullProfileData, Stamp } from '../types';
import { generateDOCX, generateDOCXFileName } from '../utils/docx/templates';

interface UseATSExportOptions {
  preferServerSide?: boolean; // Use server-side generation if available
}

interface ExportOptions {
  template: ATSTemplateType;
  language?: 'en' | 'es';
  format?: 'pdf' | 'docx'; // NEW: formato de exportación
  includePhoto?: boolean;
  includeStamps?: boolean;
  includeSummary?: boolean;
  includeSkills?: boolean;
  includeLanguages?: boolean;
  includePortfolio?: boolean;
  includeCertifications?: boolean;
}

export function useATSExport(options: UseATSExportOptions = {}) {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  /**
   * Export using server-side Edge Function (PDF or DOCX)
   */
  const exportServerSide = async (
    profileId: string,
    exportOptions: ExportOptions
  ): Promise<Blob> => {
    setProgress(10);

    // Get session token
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Not authenticated');
    }

    setProgress(30);

    const format = exportOptions.format || 'pdf';
    const endpoint = format === 'docx' ? 'export-docx' : 'export-pdf';

    // Call Edge Function
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/${endpoint}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profileId,
          template: exportOptions.template,
          language: exportOptions.language || 'en',
          options: {
            includePhoto: exportOptions.includePhoto,
            includeStamps: exportOptions.includeStamps,
            includeSummary: exportOptions.includeSummary,
            includeSkills: exportOptions.includeSkills,
            includeLanguages: exportOptions.includeLanguages,
            includePortfolio: exportOptions.includePortfolio,
            includeCertifications: exportOptions.includeCertifications,
          },
        }),
      }
    );

    setProgress(80);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to export ${format.toUpperCase()}`);
    }

    const blob = await response.blob();
    setProgress(100);

    return blob;
  };

  /**
   * Export PDF using client-side generation (@react-pdf/renderer)
   */
  const exportClientSidePDF = async (
    document: React.ReactElement,
    fileName: string
  ): Promise<Blob> => {
    setProgress(20);

    // Generate PDF blob
    const blob = await pdf(document).toBlob();

    setProgress(100);

    return blob;
  };

  /**
   * Export DOCX using client-side generation (docx.js)
   */
  const exportClientSideDOCX = async (
    processedData: any,
    template: ATSTemplateType,
    language: 'en' | 'es' = 'en'
  ): Promise<Blob> => {
    setProgress(20);

    // Generate DOCX document
    const doc = generateDOCX(processedData, template, language);

    setProgress(60);

    // Convert to blob
    const blob = await Packer.toBlob(doc);

    setProgress(100);

    return blob;
  };

  /**
   * Main export function - supports PDF and DOCX
   */
  const exportDocument = async (
    profileId: string,
    exportOptions: ExportOptions,
    document?: React.ReactElement,
    processedData?: any,
    fileName?: string
  ): Promise<{ blob: Blob; fileName: string }> => {
    setIsExporting(true);
    setError(null);
    setProgress(0);

    try {
      const format = exportOptions.format || 'pdf';
      const extension = format === 'docx' ? '.docx' : '.pdf';
      const generatedFileName = fileName || `cv-${exportOptions.template}-${Date.now()}${extension}`;

      let blob: Blob;

      // Choose export method
      if (options.preferServerSide) {
        try {
          // Try server-side first
          blob = await exportServerSide(profileId, exportOptions);
        } catch (serverError) {
          console.warn('Server-side export failed, falling back to client-side:', serverError);

          // Fallback to client-side if server fails
          if (format === 'pdf') {
            if (!document) throw new Error('PDF document required for client-side export');
            blob = await exportClientSidePDF(document, generatedFileName);
          } else {
            if (!processedData) throw new Error('Processed data required for DOCX client-side export');
            blob = await exportClientSideDOCX(
              processedData,
              exportOptions.template,
              exportOptions.language || 'en'
            );
          }
        }
      } else {
        // Use client-side by default
        if (format === 'pdf') {
          if (!document) throw new Error('PDF document required for client-side export');
          blob = await exportClientSidePDF(document, generatedFileName);
        } else {
          if (!processedData) throw new Error('Processed data required for DOCX client-side export');
          blob = await exportClientSideDOCX(
            processedData,
            exportOptions.template,
            exportOptions.language || 'en'
          );
        }
      }

      setProgress(100);
      return { blob, fileName: generatedFileName };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setIsExporting(false);
    }
  };

  // Mantener compatibilidad con nombre anterior
  const exportPDF = exportDocument;

  /**
   * Download file (PDF or DOCX)
   */
  const downloadFile = (blob: Blob, fileName: string) => {
    saveAs(blob, fileName);
  };

  // Mantener compatibilidad
  const downloadPDF = downloadFile;

  /**
   * Export and download in one step
   */
  const exportAndDownload = async (
    profileId: string,
    exportOptions: ExportOptions,
    document?: React.ReactElement,
    processedData?: any,
    fileName?: string
  ) => {
    const { blob, fileName: generatedFileName } = await exportDocument(
      profileId,
      exportOptions,
      document,
      processedData,
      fileName
    );

    downloadFile(blob, generatedFileName);
  };

  /**
   * Get preview URL (client-side only)
   */
  const getPreviewURL = async (document: React.ReactElement): Promise<string> => {
    const blob = await pdf(document).toBlob();
    return URL.createObjectURL(blob);
  };

  return {
    exportDocument,
    exportPDF, // Mantener compatibilidad
    downloadFile,
    downloadPDF, // Mantener compatibilidad
    exportAndDownload,
    getPreviewURL,
    isExporting,
    error,
    progress,
  };
}

/**
 * Helper hook for batch exports
 */
export function useBatchATSExport() {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const exportMultiple = async (
    exports: Array<{
      profileId: string;
      options: ExportOptions;
      document?: React.ReactElement;
      fileName?: string;
    }>
  ) => {
    setIsExporting(true);
    setProgress({});
    setErrors({});

    const results = await Promise.allSettled(
      exports.map(async (exp, index) => {
        try {
          const { exportAndDownload } = useATSExport();
          await exportAndDownload(
            exp.profileId,
            exp.options,
            exp.document,
            exp.fileName
          );

          setProgress(prev => ({ ...prev, [index]: 100 }));
          return { success: true, index };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          setErrors(prev => ({ ...prev, [index]: errorMessage }));
          return { success: false, index, error: errorMessage };
        }
      })
    );

    setIsExporting(false);

    return results;
  };

  return {
    exportMultiple,
    isExporting,
    progress,
    errors,
  };
}
