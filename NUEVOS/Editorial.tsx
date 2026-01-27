import React from 'react';
import { CVData } from '../types';
import { ExternalLink } from '../components/ui/Icons';

export const EditorialTheme: React.FC<{ data: CVData }> = ({ data }) => {
  return (
    <div className="font-serif text-zinc-900 h-full bg-[#faf9f6] p-10 md:p-16">
      
      {/* Decorative Border Container */}
      <div className="h-full border border-zinc-900 p-8 md:p-12 relative flex flex-col">
        
        {/* Corner Accents */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-zinc-900"></div>
        <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-zinc-900"></div>
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-zinc-900"></div>
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-zinc-900"></div>

        {/* Header */}
        <header className="text-center mb-12 flex flex-col items-center">
            <div className="w-24 h-24 mb-6 bg-zinc-100 grayscale contrast-125 border border-zinc-300 p-1 flex items-center justify-center text-2xl font-bold">
                {data.personal.photo ? (
                    <img src={data.personal.photo} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                    <span>{data.personal.fullName.charAt(0)}</span>
                )}
            </div>
            <h1 className="text-6xl font-light tracking-wide mb-2 italic">
                {data.personal.fullName.split(' ')[0]} 
                <span className="font-bold not-italic ml-2">{data.personal.fullName.split(' ').slice(1).join(' ')}</span>
            </h1>
            <div className="flex items-center justify-center gap-4 mb-6">
                <div className="h-px w-12 bg-zinc-400"></div>
                <p className="text-sm font-sans uppercase tracking-[0.2em] text-zinc-500">{data.personal.role}</p>
                <div className="h-px w-12 bg-zinc-400"></div>
            </div>
            
            <div className="text-xs font-sans flex flex-wrap justify-center gap-6 text-zinc-600">
                <span>{data.personal.email}</span>
                {data.personal.phone && <span>{data.personal.phone}</span>}
                {data.personal.website && <span>{data.personal.website}</span>}
            </div>
        </header>

        {/* Three Column Layout for Skills/Summary/Education (Top) */}
        <div className="grid grid-cols-3 gap-8 mb-12 border-b border-zinc-200 pb-12">
            
            {/* Left: Skills */}
            <div className="font-sans text-right">
                <h3 className="font-bold text-xs uppercase tracking-widest mb-4">Competencies</h3>
                <ul className="text-xs space-y-1 text-zinc-600">
                    {data.skills.map(s => <li key={s.id}>{s.name}</li>)}
                </ul>
            </div>

            {/* Center: Summary */}
            <div className="text-center">
                 <h3 className="font-sans font-bold text-xs uppercase tracking-widest mb-4">Profile</h3>
                 <p className="text-sm leading-relaxed italic text-zinc-700">
                     {data.personal.summary || "Professional summary not provided."}
                 </p>
            </div>

            {/* Right: Education */}
            <div className="font-sans text-left">
                <h3 className="font-bold text-xs uppercase tracking-widest mb-4">Education</h3>
                <div className="space-y-4">
                {data.education.map(edu => (
                    <div key={edu.id}>
                        <div className="font-bold text-xs">{edu.institution}</div>
                        <div className="text-[10px] text-zinc-500">{edu.degree}</div>
                    </div>
                ))}
                </div>
            </div>
        </div>

        {/* Main Body: Experience */}
        <div className="flex-1">
             <h2 className="text-2xl italic text-center mb-8">Professional History</h2>
             
             <div className="space-y-10 max-w-3xl mx-auto">
                {data.experience.map(exp => (
                    <div key={exp.id} className="grid grid-cols-12 gap-6">
                        <div className="col-span-3 text-right font-sans pt-1">
                            <div className="font-bold text-sm">{exp.company}</div>
                            <div className="text-xs text-zinc-400 mt-1">{exp.startDate} — {exp.endDate}</div>
                        </div>
                        <div className="col-span-9 border-l border-zinc-200 pl-6">
                            <h3 className="text-lg font-bold mb-2">{exp.role}</h3>
                            <p className="text-sm text-zinc-600 leading-relaxed font-sans text-justify">
                                {exp.description}
                            </p>
                        </div>
                    </div>
                ))}
             </div>
        </div>

        {/* Footer: Projects */}
        {data.projects.length > 0 && (
             <div className="mt-12 pt-8 border-t border-zinc-900 border-dashed">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-sans font-bold text-xs uppercase tracking-widest">Select Projects</h3>
                </div>
                <div className="grid grid-cols-3 gap-6 font-sans">
                    {data.projects.slice(0,3).map(proj => (
                        <div key={proj.id}>
                            <div className="font-bold text-sm mb-1">{proj.name}</div>
                            <p className="text-xs text-zinc-500 leading-tight">{proj.description}</p>
                        </div>
                    ))}
                </div>
             </div>
        )}

      </div>
    </div>
  );
};