import React from 'react';
import { CVData } from '../types';
import { Mail, Phone, MapPin, Globe, ExternalLink } from '../components/ui/Icons';

export const GlacierTheme: React.FC<{ data: CVData }> = ({ data }) => {
  return (
    <div className="font-sans text-slate-800 h-full bg-white flex flex-col">
      
      {/* Header Block */}
      <header className="bg-slate-800 text-white p-12">
        <div className="flex justify-between items-start">
            <div className="flex items-center gap-6">
                <div className="w-24 h-24 bg-slate-700 rounded-lg overflow-hidden flex-shrink-0 border-2 border-slate-600 flex items-center justify-center text-slate-500 font-bold text-2xl">
                    {data.personal.photo ? (
                        <img src={data.personal.photo} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                        <span>{data.personal.fullName.charAt(0)}</span>
                    )}
                </div>
                <div className="space-y-2">
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                        {data.personal.fullName}
                    </h1>
                    <p className="text-xl text-sky-300 font-medium">{data.personal.role}</p>
                </div>
            </div>
            {/* Grid of dots decoration */}
            <div className="hidden md:grid grid-cols-4 gap-1 opacity-20">
                {[...Array(16)].map((_,i) => <div key={i} className="w-1 h-1 bg-white rounded-full"></div>)}
            </div>
        </div>
        
        <div className="mt-8 flex flex-wrap gap-6 text-sm font-medium text-slate-300 pt-6 border-t border-slate-700">
             {data.personal.email && <span>{data.personal.email}</span>}
             {data.personal.phone && <span className="text-slate-600">/</span>}
             {data.personal.phone && <span>{data.personal.phone}</span>}
             {data.personal.location && <span className="text-slate-600">/</span>}
             {data.personal.location && <span>{data.personal.location}</span>}
             {data.personal.website && <span className="text-slate-600">/</span>}
             {data.personal.website && <span>{data.personal.website}</span>}
        </div>
      </header>

      <div className="flex-1 p-12 grid grid-cols-12 gap-8">
        
        {/* Left Sidebar (Narrow) */}
        <div className="col-span-4 space-y-12">
            
            {/* Skills as Tags */}
            {data.skills.length > 0 && (
                <section>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Technical Stack</h3>
                    <div className="flex flex-wrap gap-2">
                        {data.skills.map((skill) => (
                        <span key={skill.id} className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded hover:bg-sky-100 transition-colors">
                            {skill.name}
                        </span>
                        ))}
                    </div>
                </section>
            )}

            {/* Education */}
            {data.education.length > 0 && (
                <section>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Education</h3>
                    <div className="space-y-6">
                        {data.education.map((edu) => (
                        <div key={edu.id} className="border-l-2 border-sky-200 pl-4">
                            <h4 className="font-bold text-slate-900 text-sm">{edu.institution}</h4>
                            <div className="text-xs text-slate-600 mt-1">{edu.degree}</div>
                            <div className="text-xs text-slate-400 mt-1">{edu.endDate}</div>
                        </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Summary (Moved to sidebar for this layout) */}
            {data.personal.summary && (
                <section>
                     <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">About</h3>
                     <p className="text-sm text-slate-600 leading-6">
                        {data.personal.summary}
                     </p>
                </section>
            )}

        </div>

        {/* Right Content (Wide) */}
        <div className="col-span-8 space-y-12">
            
             {/* Experience */}
             {data.experience.length > 0 && (
                <section>
                    <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                        Experience
                    </h3>
                    <div className="space-y-8">
                        {data.experience.map((exp) => (
                        <div key={exp.id} className="bg-slate-50 p-6 rounded-lg border border-slate-100">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h4 className="font-bold text-lg text-slate-800">{exp.role}</h4>
                                    <div className="text-sky-700 font-medium text-sm">{exp.company}</div>
                                </div>
                                <span className="text-xs font-bold text-slate-400 bg-white px-2 py-1 rounded border border-slate-100 shadow-sm">
                                    {exp.startDate} — {exp.endDate}
                                </span>
                            </div>
                            <p className="text-sm text-slate-600 leading-relaxed mt-3">
                                {exp.description}
                            </p>
                        </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Projects */}
            {data.projects.length > 0 && (
                <section>
                    <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                        Projects & Research
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        {data.projects.map((proj) => (
                        <div key={proj.id} className="border-t-4 border-slate-200 pt-4 hover:border-sky-400 transition-colors">
                            <h4 className="font-bold text-slate-800 text-sm mb-1">{proj.name}</h4>
                            <p className="text-xs text-slate-500 leading-5">
                                {proj.description}
                            </p>
                            {proj.link && <div className="mt-2 text-xs text-sky-600 underline truncate">{proj.link}</div>}
                        </div>
                        ))}
                    </div>
                </section>
            )}

        </div>

      </div>
    </div>
  );
};