// Business card style configurations for each CV template
export interface BusinessCardStyle {
  id: string;
  background: string;
  headerGradient?: string;
  textColor: string;
  accentColor: string;
  fontFamily: string;
  borderStyle?: string;
  decorativeElements?: 'circles' | 'squares' | 'none';
  layout: 'centered' | 'left' | 'split';
}

export const businessCardStyles: Record<string, BusinessCardStyle> = {
  // FREE TEMPLATES
  'passport': {
    id: 'passport',
    background: 'linear-gradient(135deg, #0052FF 0%, #4F46E5 100%)',
    textColor: '#FFFFFF',
    accentColor: '#60A5FA',
    fontFamily: 'sans-serif',
    decorativeElements: 'circles',
    layout: 'centered',
  },
  'classic': {
    id: 'classic',
    background: 'linear-gradient(to bottom right, #FFFFFF, #F9FAFB)',
    headerGradient: 'linear-gradient(to right, #0052FF, #0052FFCC)',
    textColor: '#111827',
    accentColor: '#0052FF',
    fontFamily: 'serif',
    borderStyle: '2px solid #E5E7EB',
    decorativeElements: 'none',
    layout: 'centered',
  },
  'modern-minimalist': {
    id: 'modern-minimalist',
    background: 'linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%)',
    textColor: '#374151',
    accentColor: '#60A5FA',
    fontFamily: 'sans-serif',
    borderStyle: 'none',
    decorativeElements: 'none',
    layout: 'left',
  },
  'creative-bold': {
    id: 'creative-bold',
    background: 'linear-gradient(135deg, #1F2937 0%, #111827 100%)',
    headerGradient: 'linear-gradient(to right, #3B82F6, #2563EB)',
    textColor: '#FFFFFF',
    accentColor: '#3B82F6',
    fontFamily: 'sans-serif',
    decorativeElements: 'squares',
    layout: 'split',
  },
  'professional-classic': {
    id: 'professional-classic',
    background: '#FFFFFF',
    textColor: '#1F2937',
    accentColor: '#2563EB',
    fontFamily: 'serif',
    borderStyle: '1px solid #D1D5DB',
    decorativeElements: 'none',
    layout: 'centered',
  },
  'healthcare-professional': {
    id: 'healthcare-professional',
    background: 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)',
    textColor: '#FFFFFF',
    accentColor: '#38BDF8',
    fontFamily: 'sans-serif',
    decorativeElements: 'circles',
    layout: 'centered',
  },
  'modern-professional': {
    id: 'modern-professional',
    background: 'linear-gradient(135deg, #F9FAFB 0%, #FFFFFF 100%)',
    textColor: '#111827',
    accentColor: '#3B82F6',
    fontFamily: 'sans-serif',
    borderStyle: '1px solid #E5E7EB',
    decorativeElements: 'none',
    layout: 'centered',
  },
  'corporate-classic': {
    id: 'corporate-classic',
    background: '#FFFFFF',
    textColor: '#1F2937',
    accentColor: '#1E40AF',
    fontFamily: 'sans-serif',
    borderStyle: '2px solid #1E40AF',
    decorativeElements: 'none',
    layout: 'centered',
  },
  'creative-minimalist': {
    id: 'creative-minimalist',
    background: 'linear-gradient(135deg, #FAFAFA 0%, #FFFFFF 100%)',
    textColor: '#374151',
    accentColor: '#6366F1',
    fontFamily: 'sans-serif',
    decorativeElements: 'none',
    layout: 'left',
  },
  'academic-standard': {
    id: 'academic-standard',
    background: '#FFFFFF',
    textColor: '#1F2937',
    accentColor: '#4B5563',
    fontFamily: 'serif',
    borderStyle: '1px solid #9CA3AF',
    decorativeElements: 'none',
    layout: 'centered',
  },

  // PRO TEMPLATES
  'minimalist-yellow': {
    id: 'minimalist-yellow',
    background: 'linear-gradient(135deg, #FEF3C7 0%, #FCD34D 100%)',
    textColor: '#78350F',
    accentColor: '#F59E0B',
    fontFamily: 'sans-serif',
    decorativeElements: 'squares',
    layout: 'left',
  },
  'gradient-blue': {
    id: 'gradient-blue',
    background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
    textColor: '#FFFFFF',
    accentColor: '#A5B4FC',
    fontFamily: 'sans-serif',
    decorativeElements: 'circles',
    layout: 'split',
  },
  'coral-pink': {
    id: 'coral-pink',
    background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
    textColor: '#FFFFFF',
    accentColor: '#FB923C',
    fontFamily: 'sans-serif',
    decorativeElements: 'circles',
    layout: 'centered',
  },
  'green-minimal': {
    id: 'green-minimal',
    background: 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)',
    textColor: '#064E3B',
    accentColor: '#10B981',
    fontFamily: 'sans-serif',
    decorativeElements: 'none',
    layout: 'left',
  },
  'creative-orange': {
    id: 'creative-orange',
    background: 'linear-gradient(135deg, #FFEDD5 0%, #FED7AA 100%)',
    textColor: '#7C2D12',
    accentColor: '#F97316',
    fontFamily: 'sans-serif',
    decorativeElements: 'squares',
    layout: 'split',
  },
  'classic-sidebar': {
    id: 'classic-sidebar',
    background: 'linear-gradient(to right, #1F2937 50%, #FFFFFF 50%)',
    textColor: '#111827',
    accentColor: '#3B82F6',
    fontFamily: 'sans-serif',
    decorativeElements: 'none',
    layout: 'split',
  },
  'modern-clean': {
    id: 'modern-clean',
    background: 'linear-gradient(135deg, #FFFFFF 0%, #F3F4F6 100%)',
    headerGradient: 'linear-gradient(to right, #8B5CF6, #6366F1)',
    textColor: '#111827',
    accentColor: '#8B5CF6',
    fontFamily: 'sans-serif',
    decorativeElements: 'none',
    layout: 'centered',
  },
  'elegant-minimal': {
    id: 'elegant-minimal',
    background: '#FFFFFF',
    textColor: '#1F2937',
    accentColor: '#6B7280',
    fontFamily: 'serif',
    borderStyle: '1px solid #E5E7EB',
    decorativeElements: 'none',
    layout: 'left',
  },
  'professional-blue': {
    id: 'professional-blue',
    background: 'linear-gradient(135deg, #1E40AF 0%, #1E3A8A 100%)',
    textColor: '#FFFFFF',
    accentColor: '#60A5FA',
    fontFamily: 'sans-serif',
    decorativeElements: 'circles',
    layout: 'centered',
  },
  'creative-modern': {
    id: 'creative-modern',
    background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
    textColor: '#FFFFFF',
    accentColor: '#FCD34D',
    fontFamily: 'sans-serif',
    decorativeElements: 'squares',
    layout: 'split',
  },
};

// Default fallback style
export const getBusinessCardStyle = (templateId: string | null | undefined): BusinessCardStyle => {
  if (!templateId || !businessCardStyles[templateId]) {
    return businessCardStyles['passport']; // Default to passport style
  }
  return businessCardStyles[templateId];
};
