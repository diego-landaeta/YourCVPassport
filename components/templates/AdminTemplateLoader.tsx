import React, { lazy, Suspense } from 'react';
import { FullProfileData } from '../../types';

// Adaptador de datos de FullProfileData a CVData
const adaptToCVData = (data: FullProfileData) => {
  const { profile, experiences = [], education = [], skills = [], portfolioItems = [] } = data;

  return {
    id: profile.id || 'sample-id',
    personal: {
      fullName: profile.full_name || '',
      role: profile.headline || profile.role || '',
      email: profile.email || '',
      phone: profile.phone || '',
      location: profile.location || '',
      website: profile.website || '',
      linkedin: profile.linkedin || '',
      github: profile.github || '',
      summary: profile.summary || '',
      photo: profile.photo_url || profile.avatar_url || '',
    },
    experience: experiences.map(exp => ({
      id: exp.id,
      company: exp.company,
      role: exp.title,
      startDate: exp.start_date,
      endDate: exp.end_date,
      current: exp.current || false,
      description: exp.description || '',
      achievements: [], // No hay achievements en FullProfileData
    })),
    education: education.map(edu => ({
      id: edu.id,
      institution: edu.institution,
      degree: edu.degree,
      field: edu.field_of_study || '',
      startDate: edu.start_date,
      endDate: edu.end_date,
      current: edu.current || false,
      description: edu.description || '',
    })),
    skills: skills.map(skill => ({
      id: skill.id,
      name: skill.name,
      level: skill.level || 'intermediate',
      category: skill.category || 'other',
    })),
    projects: portfolioItems.map(item => ({
      id: item.id,
      name: item.title,
      description: item.description || '',
      link: item.url || '',
    })),
  };
};

// Mapeo de IDs a componentes
const templateComponents: Record<string, any> = {
  'admin-air': lazy(() => import('../../NUEVOS/Air').then(m => ({ default: (props: any) => <m.AirTheme {...props} /> }))),
  'admin-apex': lazy(() => import('../../NUEVOS/Apex').then(m => ({ default: (props: any) => <m.ApexTheme {...props} /> }))),
  'admin-aura': lazy(() => import('../../NUEVOS/Aura').then(m => ({ default: (props: any) => <m.AuraTheme {...props} /> }))),
  'admin-bauhaus': lazy(() => import('../../NUEVOS/Bauhaus').then(m => ({ default: (props: any) => <m.BauhausTheme {...props} /> }))),
  'admin-bento': lazy(() => import('../../NUEVOS/Bento').then(m => ({ default: (props: any) => <m.BentoTheme {...props} /> }))),
  'admin-blueprint': lazy(() => import('../../NUEVOS/Blueprint').then(m => ({ default: (props: any) => <m.BlueprintTheme {...props} /> }))),
  'admin-board': lazy(() => import('../../NUEVOS/Board').then(m => ({ default: (props: any) => <m.BoardTheme {...props} /> }))),
  'admin-botanical': lazy(() => import('../../NUEVOS/Botanical').then(m => ({ default: (props: any) => <m.BotanicalTheme {...props} /> }))),
  'admin-brutal': lazy(() => import('../../NUEVOS/Brutal').then(m => ({ default: (props: any) => <m.BrutalTheme {...props} /> }))),
  'admin-cinematic': lazy(() => import('../../NUEVOS/Cinematic').then(m => ({ default: (props: any) => <m.CinematicTheme {...props} /> }))),
  'admin-classic': lazy(() => import('../../NUEVOS/Classic').then(m => ({ default: (props: any) => <m.ClassicTheme {...props} /> }))),
  'admin-code': lazy(() => import('../../NUEVOS/Code').then(m => ({ default: (props: any) => <m.CodeTheme {...props} /> }))),
  'admin-comic': lazy(() => import('../../NUEVOS/Comic').then(m => ({ default: (props: any) => <m.ComicTheme {...props} /> }))),
  'admin-cyber': lazy(() => import('../../NUEVOS/Cyber').then(m => ({ default: (props: any) => <m.CyberTheme {...props} /> }))),
  'admin-editorial': lazy(() => import('../../NUEVOS/Editorial').then(m => ({ default: (props: any) => <m.EditorialTheme {...props} /> }))),
  'admin-element': lazy(() => import('../../NUEVOS/Element').then(m => ({ default: (props: any) => <m.ElementTheme {...props} /> }))),
  'admin-executive': lazy(() => import('../../NUEVOS/Executive').then(m => ({ default: (props: any) => <m.ExecutiveTheme {...props} /> }))),
  'admin-folio': lazy(() => import('../../NUEVOS/Folio').then(m => ({ default: (props: any) => <m.FolioTheme {...props} /> }))),
  'admin-gallery': lazy(() => import('../../NUEVOS/Gallery').then(m => ({ default: (props: any) => <m.GalleryTheme {...props} /> }))),
  'admin-gatsby': lazy(() => import('../../NUEVOS/Gatsby').then(m => ({ default: (props: any) => <m.GatsbyTheme {...props} /> }))),
  'admin-glacier': lazy(() => import('../../NUEVOS/Glacier').then(m => ({ default: (props: any) => <m.GlacierTheme {...props} /> }))),
  'admin-horizon': lazy(() => import('../../NUEVOS/Horizon').then(m => ({ default: (props: any) => <m.HorizonTheme {...props} /> }))),
  'admin-journal': lazy(() => import('../../NUEVOS/Journal').then(m => ({ default: (props: any) => <m.JournalTheme {...props} /> }))),
  'admin-lumina': lazy(() => import('../../NUEVOS/Lumina').then(m => ({ default: (props: any) => <m.LuminaTheme {...props} /> }))),
  'admin-minimalist': lazy(() => import('../../NUEVOS/Minimalist').then(m => ({ default: (props: any) => <m.MinimalistTheme {...props} /> }))),
  'admin-modern': lazy(() => import('../../NUEVOS/Modern').then(m => ({ default: (props: any) => <m.ModernTheme {...props} /> }))),
  'admin-neo': lazy(() => import('../../NUEVOS/Neo').then(m => ({ default: (props: any) => <m.NeoTheme {...props} /> }))),
  'admin-newsletter': lazy(() => import('../../NUEVOS/Newsletter').then(m => ({ default: (props: any) => <m.NewsletterTheme {...props} /> }))),
  'admin-nordic': lazy(() => import('../../NUEVOS/Nordic').then(m => ({ default: (props: any) => <m.NordicTheme {...props} /> }))),
  'admin-nova': lazy(() => import('../../NUEVOS/Nova').then(m => ({ default: (props: any) => <m.NovaTheme {...props} /> }))),
  'admin-onyx': lazy(() => import('../../NUEVOS/Onyx').then(m => ({ default: (props: any) => <m.OnyxTheme {...props} /> }))),
  'admin-parcel': lazy(() => import('../../NUEVOS/Parcel').then(m => ({ default: (props: any) => <m.ParcelTheme {...props} /> }))),
  'admin-path': lazy(() => import('../../NUEVOS/Path').then(m => ({ default: (props: any) => <m.PathTheme {...props} /> }))),
  'admin-prestige': lazy(() => import('../../NUEVOS/Prestige').then(m => ({ default: (props: any) => <m.PrestigeTheme {...props} /> }))),
  'admin-pro': lazy(() => import('../../NUEVOS/Pro').then(m => ({ default: (props: any) => <m.ProTheme {...props} /> }))),
  'admin-receipt': lazy(() => import('../../NUEVOS/Receipt').then(m => ({ default: (props: any) => <m.ReceiptTheme {...props} /> }))),
  'admin-retro': lazy(() => import('../../NUEVOS/Retro').then(m => ({ default: (props: any) => <m.RetroTheme {...props} /> }))),
  'admin-shadow': lazy(() => import('../../NUEVOS/Shadow').then(m => ({ default: (props: any) => <m.ShadowTheme {...props} /> }))),
  'admin-silk': lazy(() => import('../../NUEVOS/Silk').then(m => ({ default: (props: any) => <m.SilkTheme {...props} /> }))),
  'admin-soft': lazy(() => import('../../NUEVOS/Soft').then(m => ({ default: (props: any) => <m.SoftTheme {...props} /> }))),
  'admin-stark': lazy(() => import('../../NUEVOS/Stark').then(m => ({ default: (props: any) => <m.StarkTheme {...props} /> }))),
  'admin-studio': lazy(() => import('../../NUEVOS/Studio').then(m => ({ default: (props: any) => <m.StudioTheme {...props} /> }))),
  'admin-swiss': lazy(() => import('../../NUEVOS/Swiss').then(m => ({ default: (props: any) => <m.SwissTheme {...props} /> }))),
  'admin-system': lazy(() => import('../../NUEVOS/System').then(m => ({ default: (props: any) => <m.SystemTheme {...props} /> }))),
  'admin-tech': lazy(() => import('../../NUEVOS/Tech').then(m => ({ default: (props: any) => <m.TechTheme {...props} /> }))),
  'admin-urban': lazy(() => import('../../NUEVOS/Urban').then(m => ({ default: (props: any) => <m.UrbanTheme {...props} /> }))),
  'admin-vibrant': lazy(() => import('../../NUEVOS/Vibrant').then(m => ({ default: (props: any) => <m.VibrantTheme {...props} /> }))),
  'admin-vintage': lazy(() => import('../../NUEVOS/Vintage').then(m => ({ default: (props: any) => <m.VintageTheme {...props} /> }))),
  'admin-zenith': lazy(() => import('../../NUEVOS/Zenith').then(m => ({ default: (props: any) => <m.ZenithTheme {...props} /> }))),
};

interface AdminTemplateLoaderProps {
  templateId: string;
  data: FullProfileData;
}

export const AdminTemplateLoader: React.FC<AdminTemplateLoaderProps> = ({ templateId, data }) => {
  const TemplateComponent = templateComponents[templateId];

  if (!TemplateComponent) {
    return <div className="p-8 text-center">Plantilla no encontrada: {templateId}</div>;
  }

  const cvData = adaptToCVData(data);

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center items-start p-8 print:p-0 print:bg-white">
      <div className="w-full max-w-[210mm] min-h-[297mm] bg-white shadow-lg print:shadow-none print:max-w-full">
        <Suspense fallback={<div className="p-8 text-center">Cargando plantilla...</div>}>
          <TemplateComponent data={cvData} />
        </Suspense>
      </div>
    </div>
  );
};

export const adminTemplatesList = [
  { id: 'admin-air', name: 'Air' },
  { id: 'admin-apex', name: 'Apex' },
  { id: 'admin-aura', name: 'Aura' },
  { id: 'admin-bauhaus', name: 'Bauhaus' },
  { id: 'admin-bento', name: 'Bento' },
  { id: 'admin-blueprint', name: 'Blueprint' },
  { id: 'admin-board', name: 'Board' },
  { id: 'admin-botanical', name: 'Botanical' },
  { id: 'admin-brutal', name: 'Brutal' },
  { id: 'admin-cinematic', name: 'Cinematic' },
  { id: 'admin-classic', name: 'Classic (Admin)' },
  { id: 'admin-code', name: 'Code' },
  { id: 'admin-comic', name: 'Comic' },
  { id: 'admin-cyber', name: 'Cyber' },
  { id: 'admin-editorial', name: 'Editorial' },
  { id: 'admin-element', name: 'Element' },
  { id: 'admin-executive', name: 'Executive' },
  { id: 'admin-folio', name: 'Folio' },
  { id: 'admin-gallery', name: 'Gallery' },
  { id: 'admin-gatsby', name: 'Gatsby' },
  { id: 'admin-glacier', name: 'Glacier' },
  { id: 'admin-horizon', name: 'Horizon' },
  { id: 'admin-journal', name: 'Journal' },
  { id: 'admin-lumina', name: 'Lumina' },
  { id: 'admin-minimalist', name: 'Minimalist (Admin)' },
  { id: 'admin-modern', name: 'Modern (Admin)' },
  { id: 'admin-neo', name: 'Neo' },
  { id: 'admin-newsletter', name: 'Newsletter' },
  { id: 'admin-nordic', name: 'Nordic' },
  { id: 'admin-nova', name: 'Nova' },
  { id: 'admin-onyx', name: 'Onyx' },
  { id: 'admin-parcel', name: 'Parcel' },
  { id: 'admin-path', name: 'Path' },
  { id: 'admin-prestige', name: 'Prestige' },
  { id: 'admin-pro', name: 'Pro' },
  { id: 'admin-receipt', name: 'Receipt' },
  { id: 'admin-retro', name: 'Retro' },
  { id: 'admin-shadow', name: 'Shadow' },
  { id: 'admin-silk', name: 'Silk' },
  { id: 'admin-soft', name: 'Soft' },
  { id: 'admin-stark', name: 'Stark' },
  { id: 'admin-studio', name: 'Studio' },
  { id: 'admin-swiss', name: 'Swiss' },
  { id: 'admin-system', name: 'System' },
  { id: 'admin-tech', name: 'Tech' },
  { id: 'admin-urban', name: 'Urban (Admin)' },
  { id: 'admin-vibrant', name: 'Vibrant' },
  { id: 'admin-vintage', name: 'Vintage' },
  { id: 'admin-zenith', name: 'Zenith' },
];
