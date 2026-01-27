// @ts-nocheck
/**
 * Admin PDF Generator
 *
 * Generador de PDFs profesionales para administradores
 * Usa @react-pdf/renderer para generar PDFs vectoriales y editables (no screenshots)
 */

import { pdf } from '@react-pdf/renderer';
import React from 'react';
import { supabase } from '../supabase/client';
import { FullProfileData, Stamp } from '../types';
import { ATSProcessedData } from '../types/ats-export.types';

interface AdminPDFOptions {
  profileId: string;
  profileSlug?: string;
  fileName?: string;
  template?: 'modern' | 'classic' | 'minimal';
  onProgress?: (progress: number) => void;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Fetch complete profile data from Supabase
 */
async function fetchProfileData(profileId: string): Promise<FullProfileData> {
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', profileId)
    .single();

  if (profileError) throw new Error('Error al cargar perfil: ' + profileError.message);

  // Fetch related data in parallel
  const [
    { data: experiences },
    { data: education },
    { data: skills },
    { data: languages },
    { data: certifications },
    { data: portfolio },
    { data: visas }
  ] = await Promise.all([
    supabase.from('experiences').select('*').eq('profile_id', profileId).order('start_date', { ascending: false }),
    supabase.from('education').select('*').eq('profile_id', profileId).order('start_date', { ascending: false }),
    supabase.from('skills').select('*').eq('profile_id', profileId),
    supabase.from('languages').select('*').eq('profile_id', profileId),
    supabase.from('certifications').select('*').eq('profile_id', profileId).order('issue_date', { ascending: false }),
    supabase.from('portfolio').select('*').eq('profile_id', profileId),
    supabase.from('visas').select('*').eq('profile_id', profileId)
  ]);

  return {
    profile,
    experiences: experiences || [],
    education: education || [],
    skills: skills || [],
    languages: languages || [],
    certifications: certifications || [],
    portfolio: portfolio || [],
    visas: visas || []
  };
}

/**
 * Fetch stamps for profile
 */
async function fetchStamps(profileId: string): Promise<Stamp[]> {
  const { data: stamps } = await supabase
    .from('stamps')
    .select('*')
    .eq('profile_id', profileId)
    .eq('status', 'VERIFIED');

  return stamps || [];
}

/**
 * Generate professional PDF using @react-pdf/renderer
 */
export async function generateAdminPDF(options: AdminPDFOptions): Promise<void> {
  const { profileId, fileName, template = 'modern', onProgress, onSuccess, onError } = options;

  try {
    if (onProgress) onProgress(10);

    // Fetch profile data
    const profileData = await fetchProfileData(profileId);

    if (onProgress) onProgress(30);

    // Fetch stamps
    const stamps = await fetchStamps(profileId);

    if (onProgress) onProgress(40);

    // Process data for ATS template
    const processedData: ATSProcessedData = {
      profile: profileData,
      stamps,
      keywords: [],
      sections: [
        { type: 'contact', title: 'Contact Information', enabled: true, order: 0 },
        { type: 'summary', title: 'Professional Summary', enabled: !!profileData.profile.summary, order: 1 },
        { type: 'experience', title: 'Work Experience', enabled: true, order: 2 },
        { type: 'education', title: 'Education', enabled: true, order: 3 },
        { type: 'skills', title: 'Skills', enabled: true, order: 4 },
        { type: 'languages', title: 'Languages', enabled: true, order: 5 },
        { type: 'certifications', title: 'Certifications', enabled: true, order: 6 },
        { type: 'portfolio', title: 'Portfolio', enabled: profileData.portfolio.length > 0, order: 7 }
      ]
    };

    if (onProgress) onProgress(50);

    // Use the admin-specific template that includes photo
    const { default: TemplateComponent } = await import('../components/ats-export/templates/AdminModernTemplate');

    if (onProgress) onProgress(60);

    // Create React element for the PDF
    const documentElement = React.createElement(TemplateComponent, {
      data: processedData,
      language: 'es'
    });

    if (onProgress) onProgress(70);

    // Generate PDF blob
    const blob = await pdf(documentElement).toBlob();

    if (onProgress) onProgress(90);

    // Generate filename
    const fullName = profileData.profile.full_name || 'usuario';
    const pdfFileName = fileName || `CV-${fullName.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;

    // Download the PDF
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = pdfFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    if (onProgress) onProgress(100);

    if (onSuccess) {
      onSuccess();
    }

  } catch (error) {
    console.error('Error generating admin PDF:', error);
    if (onError) {
      onError(error instanceof Error ? error : new Error('Unknown error'));
    }
    throw error;
  }
}
