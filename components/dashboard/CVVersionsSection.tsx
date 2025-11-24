/**
 * CV Versions Management Section
 * Allows users to create and manage multiple CV versions for different countries/roles
 */

import { useState } from 'react';
import { useCVVersions } from '../../hooks/useCVVersions';
import { useATSExport } from '../../hooks/useATSExport';
import { useAuth } from '../../contexts/AuthContext';
import { CVVersion } from '../../types';
import { CreateVersionModal } from './CreateVersionModal';

// SVG Icons
const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
  </svg>
);

const FileTextIcon = () => (
  <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const GlobeIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const BriefcaseIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const DownloadIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

const EditIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const CopyIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

// Helper function to get template-specific styles
function getTemplateStyles(template: string): string {
  const baseStyles = `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { line-height: 1.6; color: #333; padding: 40px; max-width: 900px; margin: 0 auto; }
    .version-badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; margin-bottom: 12px; }
    .header { margin-bottom: 30px; padding-bottom: 20px; }
    .headline { margin-bottom: 12px; }
    .contact-info { display: flex; gap: 16px; flex-wrap: wrap; font-size: 14px; }
    .section { margin-bottom: 24px; page-break-inside: avoid; }
    .item { margin-bottom: 16px; page-break-inside: avoid; }
    .item-title { font-weight: 600; }
    .item-subtitle { color: #666; font-size: 15px; }
    .item-date { color: #888; font-size: 14px; margin-bottom: 8px; }
    .skills-grid { display: flex; flex-wrap: wrap; gap: 8px; }
    @media print { body { padding: 20px; } .no-print { display: none; } }
  `;

  switch (template) {
    // Basic Free Templates
    case 'classic':
      return baseStyles + `
        body { font-family: 'Times New Roman', Georgia, serif; background: #fafafa; }
        .version-badge { background: #8b4513; color: white; }
        h1 { font-size: 36px; margin-bottom: 8px; color: #1a1a1a; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
        h2 { font-size: 20px; margin: 24px 0 12px; padding-bottom: 8px; border-bottom: 3px double #1a1a1a; color: #1a1a1a; font-weight: 700; text-transform: uppercase; }
        h3 { font-size: 17px; margin-bottom: 4px; font-weight: 600; }
        .header { text-align: center; border-bottom: 3px double #1a1a1a; }
        .headline { font-size: 18px; color: #555; font-style: italic; }
        .contact-info { justify-content: center; color: #555; }
        .skill-tag { background: #e8e8e8; padding: 6px 14px; border-radius: 4px; font-size: 14px; border: 1px solid #ccc; }
      `;

    case 'modern':
      return baseStyles + `
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', Arial, sans-serif; }
        .version-badge { background: #2563eb; color: white; }
        h1 { font-size: 32px; margin-bottom: 8px; color: #2563eb; font-weight: 700; }
        h2 { font-size: 22px; margin: 24px 0 12px; padding-bottom: 8px; border-bottom: 2px solid #2563eb; color: #2563eb; font-weight: 600; }
        h3 { font-size: 18px; margin-bottom: 4px; font-weight: 600; color: #111; }
        .header { text-align: center; border-bottom: 2px solid #e5e7eb; }
        .headline { font-size: 18px; color: #666; }
        .contact-info { justify-content: center; color: #666; }
        .skill-tag { background: #dbeafe; padding: 6px 14px; border-radius: 16px; font-size: 14px; color: #1e40af; font-weight: 500; }
      `;

    case 'minimal':
      return baseStyles + `
        body { font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif; font-weight: 300; }
        .version-badge { background: #6b7280; color: white; }
        h1 { font-size: 42px; margin-bottom: 8px; color: #111; font-weight: 300; letter-spacing: -1px; }
        h2 { font-size: 16px; margin: 28px 0 12px; padding-bottom: 4px; border-bottom: 1px solid #e5e5e5; color: #666; font-weight: 400; text-transform: uppercase; letter-spacing: 2px; }
        h3 { font-size: 16px; margin-bottom: 4px; font-weight: 500; color: #111; }
        .header { text-align: left; border-bottom: none; padding-bottom: 16px; }
        .headline { font-size: 16px; color: #666; font-weight: 300; }
        .contact-info { justify-content: flex-start; color: #999; font-size: 13px; }
        .skill-tag { background: white; padding: 4px 12px; border-radius: 2px; font-size: 13px; border: 1px solid #e5e5e5; font-weight: 300; }
        .item-date { font-weight: 300; }
      `;

    // Premium Templates
    case 'passport':
      return baseStyles + `
        body { font-family: 'Courier New', monospace; background: #f5f5dc; }
        .version-badge { background: #8b0000; color: white; }
        h1 { font-size: 28px; margin-bottom: 8px; color: #8b0000; font-weight: 700; text-transform: uppercase; letter-spacing: 3px; }
        h2 { font-size: 18px; margin: 20px 0 12px; padding: 8px 0; border-top: 2px solid #8b0000; border-bottom: 2px solid #8b0000; color: #8b0000; font-weight: 700; text-transform: uppercase; }
        h3 { font-size: 16px; margin-bottom: 4px; font-weight: 600; }
        .header { text-align: center; border: 3px solid #8b0000; padding: 20px; }
        .headline { font-size: 16px; color: #333; text-transform: uppercase; }
        .contact-info { justify-content: center; color: #555; }
        .skill-tag { background: #fff; padding: 4px 10px; border-radius: 0; font-size: 13px; border: 1px solid #8b0000; }
      `;

    case 'modern-professional':
      return baseStyles + `
        body { font-family: 'Arial', sans-serif; background: #fff; }
        .version-badge { background: #1e3a8a; color: white; }
        h1 { font-size: 34px; margin-bottom: 8px; color: #1e3a8a; font-weight: 700; }
        h2 { font-size: 20px; margin: 24px 0 12px; padding-bottom: 6px; border-bottom: 3px solid #1e3a8a; color: #1e3a8a; font-weight: 600; }
        h3 { font-size: 17px; margin-bottom: 4px; font-weight: 600; color: #111; }
        .header { text-align: center; border-bottom: 4px solid #1e3a8a; }
        .headline { font-size: 17px; color: #555; }
        .contact-info { justify-content: center; color: #666; }
        .skill-tag { background: #eff6ff; padding: 6px 14px; border-radius: 4px; font-size: 14px; color: #1e3a8a; font-weight: 500; }
      `;

    case 'corporate-classic':
      return baseStyles + `
        body { font-family: 'Georgia', serif; background: #fafafa; }
        .version-badge { background: #374151; color: white; }
        h1 { font-size: 32px; margin-bottom: 8px; color: #1f2937; font-weight: 700; }
        h2 { font-size: 19px; margin: 24px 0 12px; padding-bottom: 8px; border-bottom: 2px solid #374151; color: #374151; font-weight: 700; }
        h3 { font-size: 16px; margin-bottom: 4px; font-weight: 600; }
        .header { text-align: center; border-bottom: 3px solid #374151; }
        .headline { font-size: 17px; color: #4b5563; font-style: italic; }
        .contact-info { justify-content: center; color: #6b7280; }
        .skill-tag { background: #f3f4f6; padding: 6px 12px; border-radius: 3px; font-size: 14px; border: 1px solid #d1d5db; }
      `;

    case 'creative-minimalist':
      return baseStyles + `
        body { font-family: 'Futura', 'Trebuchet MS', sans-serif; font-weight: 300; }
        .version-badge { background: #10b981; color: white; }
        h1 { font-size: 40px; margin-bottom: 8px; color: #10b981; font-weight: 300; letter-spacing: -1px; }
        h2 { font-size: 18px; margin: 28px 0 12px; padding-bottom: 4px; border-bottom: 2px solid #10b981; color: #10b981; font-weight: 400; }
        h3 { font-size: 16px; margin-bottom: 4px; font-weight: 500; }
        .header { text-align: left; border-bottom: none; }
        .headline { font-size: 16px; color: #6b7280; font-weight: 300; }
        .contact-info { justify-content: flex-start; color: #9ca3af; }
        .skill-tag { background: #d1fae5; padding: 5px 12px; border-radius: 20px; font-size: 13px; color: #047857; }
      `;

    case 'academic-standard':
      return baseStyles + `
        body { font-family: 'Times New Roman', serif; background: #fff; }
        .version-badge { background: #4f46e5; color: white; }
        h1 { font-size: 30px; margin-bottom: 8px; color: #1f2937; font-weight: 700; text-align: center; }
        h2 { font-size: 18px; margin: 24px 0 12px; padding-bottom: 6px; border-bottom: 1px solid #4b5563; color: #1f2937; font-weight: 700; }
        h3 { font-size: 16px; margin-bottom: 4px; font-weight: 600; font-style: italic; }
        .header { text-align: center; border-bottom: 2px solid #1f2937; }
        .headline { font-size: 16px; color: #4b5563; }
        .contact-info { justify-content: center; color: #6b7280; font-size: 13px; }
        .skill-tag { background: #f3f4f6; padding: 4px 10px; border-radius: 2px; font-size: 13px; border: 1px solid #d1d5db; }
      `;

    case 'yellow-minimalist':
      return baseStyles + `
        body { font-family: 'Arial', sans-serif; background: #fffbeb; }
        .version-badge { background: #f59e0b; color: white; }
        h1 { font-size: 36px; margin-bottom: 8px; color: #d97706; font-weight: 700; }
        h2 { font-size: 20px; margin: 24px 0 12px; padding-bottom: 8px; border-bottom: 3px solid #fbbf24; color: #92400e; font-weight: 600; }
        h3 { font-size: 17px; margin-bottom: 4px; font-weight: 600; }
        .header { text-align: center; border-bottom: 3px solid #fbbf24; }
        .headline { font-size: 17px; color: #78350f; }
        .contact-info { justify-content: center; color: #92400e; }
        .skill-tag { background: #fef3c7; padding: 6px 14px; border-radius: 16px; font-size: 14px; color: #92400e; font-weight: 500; }
      `;

    case 'blue-gradient':
      return baseStyles + `
        body { font-family: 'Helvetica', sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff; }
        .version-badge { background: #fff; color: #667eea; }
        h1 { font-size: 34px; margin-bottom: 8px; color: #fff; font-weight: 700; }
        h2 { font-size: 20px; margin: 24px 0 12px; padding-bottom: 8px; border-bottom: 2px solid #fff; color: #fff; font-weight: 600; }
        h3 { font-size: 17px; margin-bottom: 4px; font-weight: 600; color: #fff; }
        .header { text-align: center; border-bottom: 2px solid rgba(255,255,255,0.5); }
        .headline { font-size: 17px; color: rgba(255,255,255,0.9); }
        .contact-info { justify-content: center; color: rgba(255,255,255,0.8); }
        .item-subtitle { color: rgba(255,255,255,0.8); }
        .item-date { color: rgba(255,255,255,0.7); }
        .skill-tag { background: rgba(255,255,255,0.2); padding: 6px 14px; border-radius: 16px; font-size: 14px; color: #fff; border: 1px solid rgba(255,255,255,0.3); }
      `;

    case 'coral-pink':
      return baseStyles + `
        body { font-family: 'Poppins', sans-serif; background: #fff5f5; }
        .version-badge { background: #f472b6; color: white; }
        h1 { font-size: 34px; margin-bottom: 8px; color: #ec4899; font-weight: 700; }
        h2 { font-size: 20px; margin: 24px 0 12px; padding-bottom: 8px; border-bottom: 2px solid #f472b6; color: #be185d; font-weight: 600; }
        h3 { font-size: 17px; margin-bottom: 4px; font-weight: 600; }
        .header { text-align: center; border-bottom: 3px solid #fbcfe8; }
        .headline { font-size: 17px; color: #9f1239; }
        .contact-info { justify-content: center; color: #be185d; }
        .skill-tag { background: #fce7f3; padding: 6px 14px; border-radius: 20px; font-size: 14px; color: #be185d; font-weight: 500; }
      `;

    case 'green-minimal':
      return baseStyles + `
        body { font-family: 'Roboto', sans-serif; background: #f0fdf4; }
        .version-badge { background: #22c55e; color: white; }
        h1 { font-size: 36px; margin-bottom: 8px; color: #16a34a; font-weight: 700; }
        h2 { font-size: 20px; margin: 24px 0 12px; padding-bottom: 8px; border-bottom: 2px solid #22c55e; color: #15803d; font-weight: 600; }
        h3 { font-size: 17px; margin-bottom: 4px; font-weight: 600; }
        .header { text-align: left; border-bottom: 3px solid #86efac; }
        .headline { font-size: 17px; color: #166534; }
        .contact-info { justify-content: flex-start; color: #15803d; }
        .skill-tag { background: #dcfce7; padding: 6px 14px; border-radius: 4px; font-size: 14px; color: #166534; font-weight: 500; }
      `;

    case 'creative-orange':
      return baseStyles + `
        body { font-family: 'Ubuntu', sans-serif; background: #fff7ed; }
        .version-badge { background: #f97316; color: white; }
        h1 { font-size: 38px; margin-bottom: 8px; color: #ea580c; font-weight: 700; }
        h2 { font-size: 21px; margin: 24px 0 12px; padding-bottom: 8px; border-bottom: 3px solid #fb923c; color: #c2410c; font-weight: 600; }
        h3 { font-size: 18px; margin-bottom: 4px; font-weight: 600; }
        .header { text-align: center; border-bottom: 3px solid #fed7aa; }
        .headline { font-size: 18px; color: #9a3412; }
        .contact-info { justify-content: center; color: #c2410c; }
        .skill-tag { background: #ffedd5; padding: 6px 14px; border-radius: 8px; font-size: 14px; color: #9a3412; font-weight: 500; }
      `;

    case 'classic-sidebar':
      return baseStyles + `
        body { font-family: 'Garamond', serif; background: #f9fafb; display: grid; grid-template-columns: 250px 1fr; gap: 30px; }
        .version-badge { background: #6366f1; color: white; }
        h1 { font-size: 30px; margin-bottom: 8px; color: #1e293b; font-weight: 700; }
        h2 { font-size: 18px; margin: 20px 0 12px; padding-bottom: 6px; border-bottom: 2px solid #6366f1; color: #475569; font-weight: 700; }
        h3 { font-size: 16px; margin-bottom: 4px; font-weight: 600; }
        .header { text-align: left; border-bottom: 2px solid #cbd5e1; }
        .headline { font-size: 16px; color: #64748b; }
        .contact-info { justify-content: flex-start; color: #64748b; flex-direction: column; }
        .skill-tag { background: #e0e7ff; padding: 5px 12px; border-radius: 4px; font-size: 13px; color: #4338ca; }
      `;

    case 'modern-clean':
      return baseStyles + `
        body { font-family: 'Open Sans', sans-serif; background: #fff; }
        .version-badge { background: #06b6d4; color: white; }
        h1 { font-size: 35px; margin-bottom: 8px; color: #0e7490; font-weight: 700; }
        h2 { font-size: 20px; margin: 24px 0 12px; padding-bottom: 8px; border-bottom: 2px solid #06b6d4; color: #155e75; font-weight: 600; }
        h3 { font-size: 17px; margin-bottom: 4px; font-weight: 600; }
        .header { text-align: center; border-bottom: 2px solid #cffafe; }
        .headline { font-size: 17px; color: #164e63; }
        .contact-info { justify-content: center; color: #0e7490; }
        .skill-tag { background: #cffafe; padding: 6px 14px; border-radius: 12px; font-size: 14px; color: #164e63; font-weight: 500; }
      `;

    case 'elegant-minimal':
      return baseStyles + `
        body { font-family: 'Didot', 'Bodoni MT', serif; font-weight: 300; background: #fafafa; }
        .version-badge { background: #737373; color: white; }
        h1 { font-size: 44px; margin-bottom: 8px; color: #171717; font-weight: 300; letter-spacing: -1px; }
        h2 { font-size: 17px; margin: 28px 0 12px; padding-bottom: 4px; border-bottom: 1px solid #d4d4d4; color: #525252; font-weight: 400; text-transform: uppercase; letter-spacing: 3px; }
        h3 { font-size: 16px; margin-bottom: 4px; font-weight: 500; }
        .header { text-align: center; border-bottom: 1px solid #e5e5e5; }
        .headline { font-size: 16px; color: #737373; font-weight: 300; }
        .contact-info { justify-content: center; color: #a3a3a3; font-size: 13px; }
        .skill-tag { background: #fff; padding: 4px 12px; border-radius: 0; font-size: 13px; border: 1px solid #d4d4d4; font-weight: 300; }
      `;

    case 'professional-blue':
      return baseStyles + `
        body { font-family: 'Calibri', Arial, sans-serif; background: #eff6ff; }
        .version-badge { background: #3b82f6; color: white; }
        h1 { font-size: 32px; margin-bottom: 8px; color: #1e40af; font-weight: 700; }
        h2 { font-size: 20px; margin: 24px 0 12px; padding-bottom: 8px; border-bottom: 2px solid #3b82f6; color: #1e3a8a; font-weight: 600; }
        h3 { font-size: 17px; margin-bottom: 4px; font-weight: 600; }
        .header { text-align: center; border-bottom: 3px solid #3b82f6; }
        .headline { font-size: 17px; color: #1e40af; }
        .contact-info { justify-content: center; color: #1e40af; }
        .skill-tag { background: #dbeafe; padding: 6px 14px; border-radius: 4px; font-size: 14px; color: #1e40af; font-weight: 500; }
      `;

    case 'creative-modern':
      return baseStyles + `
        body { font-family: 'Montserrat', sans-serif; background: #fafafa; }
        .version-badge { background: #8b5cf6; color: white; }
        h1 { font-size: 36px; margin-bottom: 8px; color: #7c3aed; font-weight: 700; }
        h2 { font-size: 20px; margin: 24px 0 12px; padding-bottom: 8px; border-bottom: 3px solid #c4b5fd; color: #6d28d9; font-weight: 600; }
        h3 { font-size: 17px; margin-bottom: 4px; font-weight: 600; }
        .header { text-align: center; border-bottom: 3px solid #ddd6fe; }
        .headline { font-size: 17px; color: #5b21b6; }
        .contact-info { justify-content: center; color: #6d28d9; }
        .skill-tag { background: #ede9fe; padding: 6px 14px; border-radius: 20px; font-size: 14px; color: #6d28d9; font-weight: 500; }
      `;

    case 'modern-minimalist':
      return baseStyles + `
        body { font-family: 'Inter', sans-serif; font-weight: 400; background: #fff; }
        .version-badge { background: #1f2937; color: white; }
        h1 { font-size: 38px; margin-bottom: 8px; color: #111827; font-weight: 600; }
        h2 { font-size: 18px; margin: 26px 0 12px; padding-bottom: 6px; border-bottom: 2px solid #1f2937; color: #374151; font-weight: 500; }
        h3 { font-size: 16px; margin-bottom: 4px; font-weight: 500; }
        .header { text-align: left; border-bottom: none; }
        .headline { font-size: 16px; color: #6b7280; font-weight: 400; }
        .contact-info { justify-content: flex-start; color: #9ca3af; font-size: 14px; }
        .skill-tag { background: #f3f4f6; padding: 5px 12px; border-radius: 6px; font-size: 13px; color: #1f2937; font-weight: 400; }
      `;

    case 'creative-bold':
      return baseStyles + `
        body { font-family: 'Impact', 'Arial Black', sans-serif; background: #0f172a; color: #fff; }
        .version-badge { background: #ef4444; color: white; }
        h1 { font-size: 40px; margin-bottom: 8px; color: #fbbf24; font-weight: 900; text-transform: uppercase; }
        h2 { font-size: 22px; margin: 24px 0 12px; padding-bottom: 8px; border-bottom: 3px solid #ef4444; color: #fbbf24; font-weight: 700; text-transform: uppercase; }
        h3 { font-size: 18px; margin-bottom: 4px; font-weight: 700; color: #fff; }
        .header { text-align: center; border-bottom: 3px solid #ef4444; }
        .headline { font-size: 18px; color: #cbd5e1; }
        .contact-info { justify-content: center; color: #e2e8f0; }
        .item-subtitle { color: #cbd5e1; }
        .item-date { color: #94a3b8; }
        .skill-tag { background: #dc2626; padding: 6px 14px; border-radius: 0; font-size: 14px; color: #fff; font-weight: 700; }
      `;

    case 'professional-classic':
      return baseStyles + `
        body { font-family: 'Palatino', 'Book Antiqua', serif; background: #fff; }
        .version-badge { background: #059669; color: white; }
        h1 { font-size: 32px; margin-bottom: 8px; color: #064e3b; font-weight: 700; }
        h2 { font-size: 19px; margin: 24px 0 12px; padding-bottom: 8px; border-bottom: 2px solid #059669; color: #065f46; font-weight: 700; }
        h3 { font-size: 17px; margin-bottom: 4px; font-weight: 600; }
        .header { text-align: center; border-bottom: 2px solid #065f46; }
        .headline { font-size: 17px; color: #047857; font-style: italic; }
        .contact-info { justify-content: center; color: #059669; }
        .skill-tag { background: #d1fae5; padding: 6px 14px; border-radius: 4px; font-size: 14px; color: #065f46; font-weight: 500; }
      `;

    case 'healthcare-professional':
      return baseStyles + `
        body { font-family: 'Verdana', sans-serif; background: #f0fdfa; }
        .version-badge { background: #0d9488; color: white; }
        h1 { font-size: 30px; margin-bottom: 8px; color: #0f766e; font-weight: 700; }
        h2 { font-size: 18px; margin: 22px 0 12px; padding-bottom: 8px; border-bottom: 2px solid #14b8a6; color: #115e59; font-weight: 700; }
        h3 { font-size: 16px; margin-bottom: 4px; font-weight: 600; }
        .header { text-align: center; border-bottom: 3px solid #14b8a6; }
        .headline { font-size: 16px; color: #134e4a; }
        .contact-info { justify-content: center; color: #0f766e; }
        .skill-tag { background: #ccfbf1; padding: 5px 12px; border-radius: 4px; font-size: 13px; color: #115e59; font-weight: 500; }
      `;

    default:
      // Fallback to modern template
      return baseStyles + `
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', Arial, sans-serif; }
        .version-badge { background: #2563eb; color: white; }
        h1 { font-size: 32px; margin-bottom: 8px; color: #2563eb; font-weight: 700; }
        h2 { font-size: 22px; margin: 24px 0 12px; padding-bottom: 8px; border-bottom: 2px solid #2563eb; color: #2563eb; font-weight: 600; }
        h3 { font-size: 18px; margin-bottom: 4px; font-weight: 600; color: #111; }
        .header { text-align: center; border-bottom: 2px solid #e5e7eb; }
        .headline { font-size: 18px; color: #666; }
        .contact-info { justify-content: center; color: #666; }
        .skill-tag { background: #dbeafe; padding: 6px 14px; border-radius: 16px; font-size: 14px; color: #1e40af; font-weight: 500; }
      `;
  }
}

// Helper function to generate HTML from snapshot data
function generateHTMLFromSnapshot(data: any, versionName: string, template: string): string {
  const profile = data?.profile || {};
  const experiences = data?.experiences || [];
  const education = data?.education || [];
  const skills = data?.skills || [];
  const languages = data?.languages || [];

  const styles = getTemplateStyles(template);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${versionName} - ${profile.full_name || 'CV'}</title>
  <style>
    ${styles}
  </style>
</head>
<body>
  <div class="header">
    <div class="version-badge no-print">📄 ${versionName}</div>
    <h1>${profile.full_name || 'Sin nombre'}</h1>
    <p class="headline">${profile.headline || ''}</p>
    <div class="contact-info">
      ${profile.email ? `<span>✉️ ${profile.email}</span>` : ''}
      ${profile.phone ? `<span>📱 ${profile.phone}</span>` : ''}
      ${profile.location ? `<span>📍 ${profile.location}</span>` : ''}
    </div>
  </div>

  ${profile.summary ? `
  <div class="section">
    <h2>Resumen Profesional</h2>
    <p>${profile.summary}</p>
  </div>
  ` : ''}

  ${experiences.length > 0 ? `
  <div class="section">
    <h2>Experiencia Laboral</h2>
    ${experiences.map((exp: any) => `
      <div class="item">
        <h3 class="item-title">${exp.position || exp.title || 'Posición'}</h3>
        <p class="item-subtitle">${exp.company_name || exp.company || 'Empresa'}</p>
        <p class="item-date">
          ${formatDate(exp.start_date)} - ${exp.is_current ? 'Presente' : formatDate(exp.end_date)}
        </p>
        ${exp.description ? `<p>${exp.description}</p>` : ''}
      </div>
    `).join('')}
  </div>
  ` : ''}

  ${education.length > 0 ? `
  <div class="section">
    <h2>Educación</h2>
    ${education.map((edu: any) => `
      <div class="item">
        <h3 class="item-title">${edu.degree || 'Título'}</h3>
        <p class="item-subtitle">${edu.institution || 'Institución'}</p>
        <p class="item-date">
          ${formatDate(edu.start_date)} - ${formatDate(edu.end_date)}
        </p>
        ${edu.field_of_study ? `<p>${edu.field_of_study}</p>` : ''}
      </div>
    `).join('')}
  </div>
  ` : ''}

  ${skills.length > 0 ? `
  <div class="section">
    <h2>Habilidades</h2>
    <div class="skills-grid">
      ${skills.map((skill: any) => `<span class="skill-tag">${skill.name}</span>`).join('')}
    </div>
  </div>
  ` : ''}

  ${languages.length > 0 ? `
  <div class="section">
    <h2>Idiomas</h2>
    ${languages.map((lang: any) => `
      <div class="item">
        <span class="item-title">${lang.name}</span> -
        <span class="item-subtitle">${lang.proficiency || lang.level}</span>
      </div>
    `).join('')}
  </div>
  ` : ''}

  <div class="no-print" style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #999; font-size: 12px;">
    <p>Generado con YourCVPassport - ${new Date().toLocaleDateString()}</p>
    <p style="margin-top: 8px;">Usa Ctrl+P (Cmd+P en Mac) para guardar como PDF</p>
  </div>
</body>
</html>
  `;

  function formatDate(dateStr: string | null): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'short' });
  }
}

export function CVVersionsSection() {
  const { session } = useAuth();
  const {
    versions,
    stats,
    isLoading,
    error,
    deleteVersion,
    duplicateVersion
  } = useCVVersions();

  const { exportAndDownload, isExporting: isExportingFile } = useATSExport({ preferServerSide: true });

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<CVVersion | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [exportingId, setExportingId] = useState<string | null>(null);

  // Check if error is due to missing table
  const isTableMissing = error && (
    error.includes('relation "cv_versions" does not exist') ||
    error.includes('table') ||
    error.includes('does not exist')
  );

  const handleDelete = async (versionId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta versión?')) {
      return;
    }

    setDeletingId(versionId);
    const success = await deleteVersion(versionId);
    setDeletingId(null);

    if (!success) {
      alert('Error al eliminar la versión');
    }
  };

  const handleDuplicate = async (version: CVVersion) => {
    const newName = prompt(
      'Nombre para la copia:',
      `${version.version_name} (Copia)`
    );

    if (!newName) return;

    const newId = await duplicateVersion(version.id, newName);
    if (!newId) {
      alert('Error al duplicar la versión');
    }
  };

  const handleExport = async (version: CVVersion) => {
    if (!session?.user?.id) {
      alert('Debes iniciar sesión para exportar');
      return;
    }

    setExportingId(version.id);

    try {
      // Use snapshot_data from the version for export
      const snapshotData = version.snapshot_data;

      if (!snapshotData) {
        throw new Error('No hay datos disponibles para exportar en esta versión');
      }

      // Extract template from version or use default
      const template = version.template || 'modern';

      // Generate HTML content from snapshot_data
      const htmlContent = generateHTMLFromSnapshot(snapshotData, version.version_name, template);

      // Create a temporary window with the CV data
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('No se pudo abrir la ventana de impresión. Verifica los bloqueadores de pop-ups.');
      }

      printWindow.document.write(htmlContent);
      printWindow.document.close();

      // Trigger print dialog
      setTimeout(() => {
        printWindow.print();
      }, 500);

    } catch (error) {
      console.error('Error exporting version:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      alert(`Error al exportar la versión: ${errorMessage}\n\nPor favor, intenta nuevamente.`);
    } finally {
      setExportingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If table is missing, show setup instructions
  if (isTableMissing) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-2 border-yellow-300 dark:border-yellow-700 rounded-2xl p-10 text-center shadow-lg">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="bg-yellow-100 dark:bg-yellow-900/50 rounded-full p-5">
              <svg className="w-16 h-16 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
            Configuración de Base de Datos Requerida
          </h2>

          {/* Description */}
          <p className="text-gray-700 dark:text-gray-300 mb-6 text-lg leading-relaxed">
            La función "CV Versions" requiere que apliques una migración de base de datos.
            Esta es una configuración única que solo necesitas hacer una vez.
          </p>

          {/* Instructions */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-6 text-left max-w-2xl mx-auto">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Instrucciones de Configuración
            </h3>

            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-4">
                <p className="font-semibold text-gray-900 dark:text-white mb-2">Opción 1: Supabase Dashboard (Recomendado)</p>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li>Abre <a href="https://app.supabase.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Supabase Dashboard</a></li>
                  <li>Ve a tu proyecto → <strong>SQL Editor</strong></li>
                  <li>Abre el archivo: <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">supabase/migrations/20250120_cv_versions_fix.sql</code></li>
                  <li>Copia todo el contenido y pégalo en el SQL Editor</li>
                  <li>Click en <strong>Run</strong></li>
                  <li>Refresca esta página</li>
                </ol>
              </div>

              <div className="border-l-4 border-green-500 pl-4">
                <p className="font-semibold text-gray-900 dark:text-white mb-2">Opción 2: Supabase CLI</p>
                <pre className="bg-gray-900 text-green-400 p-3 rounded text-xs overflow-x-auto">
{`cd c:\\Users\\molin\\Downloads\\yourcvpassport
supabase db push`}
                </pre>
              </div>
            </div>
          </div>

          {/* Help Link */}
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Consulta <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">APPLY_CV_VERSIONS_FIX.md</code> para más detalles</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Versiones de CV
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Crea versiones personalizadas de tu CV para diferentes países y roles
            </p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusIcon />
            Nueva Versión
          </button>
        </div>

        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {stats.total_versions}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total de Versiones</div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {Object.keys(stats.versions_by_country || {}).length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Países</div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {Object.keys(stats.versions_by_template || {}).length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Plantillas Usadas</div>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Empty State */}
      {versions.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <div className="flex justify-center mb-4 text-gray-400 dark:text-gray-600">
            <FileTextIcon />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No tienes versiones de CV
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
            Crea diferentes versiones de tu CV optimizadas para distintos países,
            roles o industrias. Cada versión puede tener secciones y contenido personalizado.
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusIcon />
            Crear Primera Versión
          </button>
        </div>
      ) : (
        /* Versions List */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {versions.map((version) => (
            <VersionCard
              key={version.id}
              version={version}
              onEdit={() => {
                setSelectedVersion(version);
                setIsCreateModalOpen(true);
              }}
              onDelete={() => handleDelete(version.id)}
              onDuplicate={() => handleDuplicate(version)}
              onExport={() => handleExport(version)}
              isDeleting={deletingId === version.id}
              isExporting={exportingId === version.id}
            />
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {isCreateModalOpen && (
        <CreateVersionModal
          isOpen={isCreateModalOpen}
          onClose={() => {
            setIsCreateModalOpen(false);
            setSelectedVersion(null);
          }}
          editingVersion={selectedVersion}
        />
      )}
    </div>
  );
}

// Version Card Component
interface VersionCardProps {
  version: CVVersion;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onExport: () => void;
  isDeleting: boolean;
  isExporting: boolean;
}

function VersionCard({
  version,
  onEdit,
  onDelete,
  onDuplicate,
  onExport,
  isDeleting,
  isExporting
}: VersionCardProps) {
  const templateColors = {
    classic: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400',
    modern: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400',
    minimal: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
  };

  const templateColor = version.template
    ? templateColors[version.template]
    : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow overflow-hidden">
      {/* Card Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-1">
            {version.version_name}
          </h3>
          <span
            className={`px-2 py-1 text-xs font-medium rounded ${templateColor}`}
          >
            {version.template}
          </span>
        </div>

        {/* Country and Role */}
        <div className="space-y-1">
          {version.country && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <GlobeIcon />
              <span>{version.country}</span>
            </div>
          )}
          {version.role && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <BriefcaseIcon />
              <span>{version.role}</span>
            </div>
          )}
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4">
        {/* Sections */}
        <div className="mb-4">
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
            Secciones incluidas ({version.sections.length})
          </div>
          <div className="flex flex-wrap gap-1">
            {version.sections.slice(0, 4).map((section) => (
              <span
                key={section}
                className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
              >
                {section}
              </span>
            ))}
            {version.sections.length > 4 && (
              <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                +{version.sections.length - 4}
              </span>
            )}
          </div>
        </div>

        {/* Date */}
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-4">
          <CalendarIcon />
          <span>
            Creada: {new Date(version.created_at).toLocaleDateString('es-ES')}
          </span>
        </div>

        {/* Notes */}
        {version.notes && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
            {version.notes}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onExport}
            disabled={isExporting}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Exportando...
              </>
            ) : (
              <>
                <DownloadIcon />
                Exportar
              </>
            )}
          </button>
          <button
            onClick={onEdit}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
            title="Editar"
          >
            <EditIcon />
          </button>
          <button
            onClick={onDuplicate}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded transition-colors"
            title="Duplicar"
          >
            <CopyIcon />
          </button>
          <button
            onClick={onDelete}
            disabled={isDeleting}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors disabled:opacity-50"
            title="Eliminar"
          >
            {isDeleting ? (
              <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <TrashIcon />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
