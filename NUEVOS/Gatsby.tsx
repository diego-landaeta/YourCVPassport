import React from 'react';
import { CVData } from '../types';
import { ExternalLink } from '../components/ui/Icons';

export const GatsbyTheme: React.FC<{ data: CVData }> = ({ data }) => {
  return (
    <div className="font-serif text-amber-900 h-full bg-[#FFFBF0] p-6 md:p-8 flex flex-col items-center text-center">
      
      {/* Decorative Border Frame */}
      <div className="w-full h-full border-4 border-double border-amber-900 p-1 relative flex flex-col">
        <div className="w-full h-full border border-amber-900/50 p-8 md:p-12 flex flex-col items-center">
            
            {/* Corner Ornaments (CSS shapes) */}
            <div className="absolute top-2 left-2 w-16 h-16 border-t-4 border-l-4 border-amber-900"></div>
            <div className="absolute top-2 right-2 w-16 h-16 border-t-4 border-r-4 border-amber-900"></div>
            <div className="absolute bottom-2 left-2 w-16 h-16 border-b-4 border-l-4 border-amber-900"></div>
            <div className="absolute bottom-2 right-2 w-16 h-16 border-b-4 border-r-4 border-amber-900"></div>

            {/* Header */}
            <header className="mb-10 relative w-full flex flex-col items-center">
                <div className="w-28 h-28 border-2 border-amber-900 p-1 mb-6 rounded-full flex items-center justify-center bg-amber-100 text-amber-900 text-4xl font-light">
                    {data.personal.photo ? (
                        <img src={data.personal.photo} alt="Profile" className="w-full h-full object-cover rounded-full grayscale sepia" />
                    ) : (
                        <span>{data.personal.fullName.charAt(0)}</span>
                    )}
                </div>

                <div className="h-px bg-amber-900 w-1/3 mx-auto mb-4"></div>
                <h1 className="text-5xl md:text-6xl font-normal tracking-widest uppercase mb-2">
                    {data.personal.fullName}
                </h1>
                <div className="text-sm font-bold tracking-[0.3em] uppercase mb-6 bg-amber-900 text-[#FFFBF0] inline-block px-4 py-1">
                    {data.personal.role}
                </div>
                
                <div className="flex justify-center gap-6 text-xs font-sans font-bold tracking-widest uppercase text-amber-800/70">
                    {data.personal.email && <span>{data.personal.email}</span>}
                    {data.personal.location && <span>• {data.personal.location}</span>}
                    {data.personal.phone && <span>• {data.personal.phone}</span>}
                </div>
                 <div className="h-px bg-amber-900 w-1/3 mx-auto mt-4"></div>
            </header>

            {/* Summary */}
            {data.personal.summary && (
                <section className="mb-10 max-w-xl mx-auto">
                    <p className="text-base italic leading-8">
                        "{data.personal.summary}"
                    </p>
                </section>
            )}

            {/* Main Content Split */}
            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-12 text-left">
                
                {/* Left: Experience */}
                <div className="md:border-r border-amber-900/30 md:pr-12">
                    {data.experience.length > 0 && (
                        <section>
                            <h3 className="text-center text-xl font-normal uppercase tracking-[0.2em] border-b-2 border-amber-900 mb-8 pb-2">Experience</h3>
                            <div className="space-y-10">
                                {data.experience.map(exp => (
                                    <div key={exp.id} className="relative">
                                        <h4 className="text-lg font-bold uppercase tracking-wide">{exp.company}</h4>
                                        <div className="text-amber-700 italic font-medium mb-1">{exp.role}</div>
                                        <div className="text-xs font-sans text-amber-900/50 mb-3 uppercase tracking-wider">{exp.startDate} — {exp.endDate}</div>
                                        <p className="text-sm leading-6 text-amber-900/80 text-justify font-sans">
                                            {exp.description}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>

                {/* Right: Education & Projects */}
                <div className="md:pl-4">
                    
                     {/* Projects */}
                     {data.projects.length > 0 && (
                        <section className="mb-10">
                            <h3 className="text-center text-xl font-normal uppercase tracking-[0.2em] border-b-2 border-amber-900 mb-8 pb-2">Creations</h3>
                            <div className="space-y-6">
                                {data.projects.map(proj => (
                                    <div key={proj.id} className="text-center">
                                        <div className="font-bold uppercase tracking-widest text-sm mb-1">{proj.name}</div>
                                        <p className="text-xs text-amber-900/70 font-sans">{proj.description}</p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Education */}
                    {data.education.length > 0 && (
                        <section className="mb-10">
                            <h3 className="text-center text-xl font-normal uppercase tracking-[0.2em] border-b-2 border-amber-900 mb-8 pb-2">Education</h3>
                            <div className="space-y-6 text-center">
                                {data.education.map(edu => (
                                    <div key={edu.id}>
                                        <div className="font-bold text-sm">{edu.institution}</div>
                                        <div className="italic text-sm text-amber-700">{edu.degree}</div>
                                        <div className="text-[10px] font-sans text-amber-900/50 mt-1 uppercase">{edu.endDate}</div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                    
                     {/* Skills */}
                     {data.skills.length > 0 && (
                        <section>
                            <h3 className="text-center text-xl font-normal uppercase tracking-[0.2em] border-b-2 border-amber-900 mb-8 pb-2">Skills</h3>
                            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 font-sans text-xs uppercase tracking-widest">
                                {data.skills.map(skill => (
                                    <span key={skill.id}>• {skill.name}</span>
                                ))}
                                <span>•</span>
                            </div>
                        </section>
                    )}

                </div>

            </div>

        </div>
      </div>
    </div>
  );
};