import React from 'react';
import { CVData } from '../types';
import { Mail, Phone, MapPin, ExternalLink } from '../components/ui/Icons';

export const PrestigeTheme: React.FC<{ data: CVData }> = ({ data }) => {
  return (
    <div className="font-serif text-zinc-900 h-full p-12 md:p-16 border-t-8 border-amber-700 bg-white">
      
      {/* Header */}
      <header className="border-b-4 border-double border-zinc-200 pb-8 mb-10 flex justify-between items-end">
        <div className="flex items-end gap-6">
            <div className="w-28 h-28 border-4 border-double border-zinc-300 shadow-sm overflow-hidden flex-shrink-0 flex items-center justify-center bg-zinc-50 text-zinc-400 font-bold text-3xl">
                {data.personal.photo ? (
                    <img src={data.personal.photo} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                    <span>{data.personal.fullName.charAt(0)}</span>
                )}
            </div>
            <div>
                <h1 className="text-5xl font-bold tracking-tight text-zinc-900 mb-2">
                    {data.personal.fullName.toUpperCase()}
                </h1>
                <p className="text-xl text-amber-700 font-bold italic tracking-wide">{data.personal.role}</p>
            </div>
        </div>
        
        <div className="text-right text-sm font-sans text-zinc-600 space-y-1">
          {data.personal.email && (
            <div className="flex items-center justify-end gap-2">
              <span>{data.personal.email}</span>
              <Mail size={12} className="text-amber-700"/>
            </div>
          )}
          {data.personal.phone && (
            <div className="flex items-center justify-end gap-2">
              <span>{data.personal.phone}</span>
              <Phone size={12} className="text-amber-700"/>
            </div>
          )}
          {data.personal.location && (
            <div className="flex items-center justify-end gap-2">
              <span>{data.personal.location}</span>
              <MapPin size={12} className="text-amber-700"/>
            </div>
          )}
        </div>
      </header>

      <div className="grid grid-cols-12 gap-10">
        
        {/* Main Column */}
        <div className="col-span-8 space-y-10">
            
            {/* Summary */}
            {data.personal.summary && (
                <section>
                     <h3 className="font-sans font-bold text-xs uppercase tracking-[0.2em] text-zinc-400 mb-4 flex items-center gap-2">
                        Professional Profile <span className="flex-1 h-px bg-zinc-200"></span>
                     </h3>
                     <p className="text-sm leading-7 text-zinc-800 text-justify">
                        {data.personal.summary}
                    </p>
                </section>
            )}

            {/* Experience */}
            {data.experience.length > 0 && (
                <section>
                    <h3 className="font-sans font-bold text-xs uppercase tracking-[0.2em] text-zinc-400 mb-6 flex items-center gap-2">
                        Work History <span className="flex-1 h-px bg-zinc-200"></span>
                     </h3>
                    <div className="space-y-8">
                        {data.experience.map((exp) => (
                        <div key={exp.id}>
                            <div className="flex justify-between items-baseline mb-1">
                                <h4 className="text-lg font-bold text-zinc-900">{exp.role}</h4>
                                <span className="font-sans text-xs font-bold text-zinc-500 border border-zinc-200 px-2 py-0.5 rounded">
                                    {exp.startDate} — {exp.endDate}
                                </span>
                            </div>
                            <div className="text-amber-700 font-bold text-sm mb-3 font-sans uppercase tracking-wide">{exp.company}</div>
                            <p className="text-sm text-zinc-700 leading-relaxed font-sans">
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
                    <h3 className="font-sans font-bold text-xs uppercase tracking-[0.2em] text-zinc-400 mb-6 flex items-center gap-2">
                        Key Initiatives <span className="flex-1 h-px bg-zinc-200"></span>
                     </h3>
                    <div className="grid grid-cols-2 gap-6">
                        {data.projects.map((proj) => (
                        <div key={proj.id} className="bg-zinc-50 p-4 border border-zinc-100">
                             <div className="flex justify-between items-start mb-2">
                                <h4 className="font-bold text-zinc-900 text-sm">{proj.name}</h4>
                                {proj.link && <ExternalLink size={12} className="text-amber-700"/>}
                             </div>
                            <p className="text-xs text-zinc-600 font-sans leading-5">
                                {proj.description}
                            </p>
                        </div>
                        ))}
                    </div>
                </section>
            )}

        </div>

        {/* Side Column */}
        <div className="col-span-4 space-y-10 pl-6 border-l border-zinc-100">
            
            {/* Skills */}
             {data.skills.length > 0 && (
                <section>
                    <h3 className="font-sans font-bold text-xs uppercase tracking-[0.2em] text-zinc-400 mb-4">Core Competencies</h3>
                    <div className="space-y-3">
                        {data.skills.map((skill) => (
                        <div key={skill.id} className="group">
                             <div className="font-sans text-xs font-bold text-zinc-700 mb-1">{skill.name}</div>
                             <div className="h-1 w-full bg-zinc-100 rounded-full overflow-hidden">
                                <div className="h-full bg-amber-700/60 w-3/4 group-hover:w-full transition-all duration-500"></div>
                             </div>
                        </div>
                        ))}
                    </div>
                </section>
            )}

             {/* Education */}
             {data.education.length > 0 && (
                <section>
                    <h3 className="font-sans font-bold text-xs uppercase tracking-[0.2em] text-zinc-400 mb-4">Education</h3>
                    <div className="space-y-6">
                        {data.education.map((edu) => (
                        <div key={edu.id}>
                            <h4 className="font-bold text-base text-zinc-900 leading-tight">{edu.institution}</h4>
                            <div className="text-sm text-zinc-600 italic mt-1">{edu.degree}</div>
                            <div className="text-xs text-zinc-400 mt-2 font-sans">{edu.endDate} • {edu.location}</div>
                        </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Contact Box */}
             <div className="bg-zinc-900 text-zinc-300 p-6 text-center font-sans text-xs leading-6">
                <div className="uppercase tracking-widest text-amber-500 font-bold mb-2">Contact</div>
                <div>{data.personal.email}</div>
                <div>{data.personal.phone}</div>
                <div className="mt-2 text-zinc-500">{data.personal.website}</div>
             </div>

        </div>

      </div>
    </div>
  );
};