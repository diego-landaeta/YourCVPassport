import React from 'react';
import { CVData } from '../types';
import { ExternalLink, Mail, Phone, MapPin, Globe } from '../components/ui/Icons';

export const NeoTheme: React.FC<{ data: CVData }> = ({ data }) => {
  return (
    <div className="font-sans text-black h-full bg-[#E0E7FF] p-8 md:p-12 flex flex-col gap-8 border-8 border-black">
      
      {/* Header Card */}
      <header className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-6">
            <div className="w-24 h-24 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex-shrink-0 bg-yellow-300 flex items-center justify-center font-black text-2xl">
                {data.personal.photo ? (
                    <img src={data.personal.photo} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                    <span>{data.personal.fullName.charAt(0)}</span>
                )}
            </div>
            <div>
                <h1 className="text-5xl font-black uppercase tracking-tighter mb-2 bg-[#A5B4FC] inline-block px-4 py-2 border-2 border-black transform -rotate-2">
                    {data.personal.fullName}
                </h1>
                <div className="mt-2">
                    <span className="text-xl font-bold bg-[#FDE047] px-3 py-1 border-2 border-black inline-block transform rotate-1">
                        {data.personal.role}
                    </span>
                </div>
            </div>
        </div>
        
        <div className="flex flex-col gap-2 text-sm font-bold">
            {data.personal.email && (
                <div className="flex items-center gap-2 bg-white px-2 py-1 border-2 border-black hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all cursor-default shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <Mail size={14} /> {data.personal.email}
                </div>
            )}
            {data.personal.phone && (
                <div className="flex items-center gap-2 bg-white px-2 py-1 border-2 border-black hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all cursor-default shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <Phone size={14} /> {data.personal.phone}
                </div>
            )}
            {data.personal.website && (
                <div className="flex items-center gap-2 bg-white px-2 py-1 border-2 border-black hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all cursor-default shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <Globe size={14} /> {data.personal.website}
                </div>
            )}
        </div>
      </header>

      <div className="flex-1 grid grid-cols-12 gap-8">
        
        {/* Left Col */}
        <div className="col-span-12 md:col-span-4 flex flex-col gap-8">
            
            {/* Skills */}
             {data.skills.length > 0 && (
                <div className="bg-[#FCA5A5] border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                    <h3 className="font-black text-2xl uppercase mb-4 border-b-4 border-black inline-block">Skills</h3>
                    <div className="flex flex-wrap gap-2">
                        {data.skills.map(s => (
                            <span key={s.id} className="bg-white border-2 border-black px-2 py-1 font-bold text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                {s.name}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Education */}
            {data.education.length > 0 && (
                <div className="bg-[#86EFAC] border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex-1">
                    <h3 className="font-black text-2xl uppercase mb-4 border-b-4 border-black inline-block">Edu</h3>
                    <div className="space-y-4">
                        {data.education.map(edu => (
                            <div key={edu.id} className="bg-white border-2 border-black p-3">
                                <div className="font-black text-sm">{edu.institution}</div>
                                <div className="text-xs font-bold mt-1">{edu.degree}</div>
                                <div className="text-[10px] font-bold mt-1 bg-black text-white inline-block px-1">{edu.endDate}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>

        {/* Right Col */}
        <div className="col-span-12 md:col-span-8 flex flex-col gap-8">
            
            {/* Summary */}
            {data.personal.summary && (
                <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                     <p className="font-medium text-lg leading-tight">
                        {data.personal.summary}
                     </p>
                </div>
            )}

            {/* Experience */}
            {data.experience.length > 0 && (
                <div className="bg-[#FDA4AF] border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                    <h3 className="font-black text-2xl uppercase mb-6 bg-white border-2 border-black inline-block px-4 py-1 transform -rotate-1">Experience</h3>
                    <div className="space-y-6">
                        {data.experience.map(exp => (
                            <div key={exp.id} className="bg-white border-2 border-black p-4 relative">
                                <div className="absolute top-0 right-0 bg-black text-white px-2 py-1 text-xs font-bold border-l-2 border-b-2 border-black">
                                    {exp.startDate} - {exp.current ? 'NOW' : exp.endDate}
                                </div>
                                <h4 className="font-black text-xl mb-1 mt-2">{exp.role}</h4>
                                <div className="font-bold text-sm uppercase mb-2 text-[#4F46E5]">{exp.company}</div>
                                <p className="font-medium text-sm leading-snug">
                                    {exp.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

             {/* Projects */}
             {data.projects.length > 0 && (
                <div className="bg-[#67E8F9] border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                    <h3 className="font-black text-2xl uppercase mb-4 border-b-4 border-black inline-block">Projects</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {data.projects.map(proj => (
                            <div key={proj.id} className="bg-white border-2 border-black p-3 hover:bg-yellow-200 transition-colors">
                                <div className="font-black text-sm flex items-center gap-2 mb-1">
                                    {proj.name}
                                    {proj.link && <ExternalLink size={12}/>}
                                </div>
                                <div className="text-xs font-medium">{proj.description}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

        </div>

      </div>
    </div>
  );
};