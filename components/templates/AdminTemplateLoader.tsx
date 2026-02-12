import React, { Suspense } from 'react';
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

// Mapeo de IDs a componentes (las plantillas NUEVOS fueron eliminadas)
const templateComponents: Record<string, any> = {};

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

// Lista vacía - las plantillas NUEVOS fueron eliminadas
export const adminTemplatesList: { id: string; name: string }[] = [];
