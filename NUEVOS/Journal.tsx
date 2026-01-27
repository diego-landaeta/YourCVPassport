import React from 'react';
import { CVData } from '../types';

export const JournalTheme: React.FC<{ data: CVData }> = ({ data }) => {
  return (
    <div className="font-serif text-zinc-900 h-full bg-[#fdfbf7] p-10 md:p-14 text-justify">
      
      {/* Newspaper Header */}
      <header className="text-center border-b-4 border-double border-zinc-900 pb-6 mb-8">
        <div className="text-[10px] font-sans uppercase tracking-widest text-zinc-500 mb-2 flex justify-between items-center w-full px-2">
             <span>Vol. 01</span>
             <span>Professional Chronicle</span>
             <span>{new Date().getFullYear()}</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-4 font-serif text-zinc-900 leading-none">
            {data.personal.fullName}
        </h1>
        
        <div className="flex items-center justify-center border-t border-b border-zinc-300 py-2 gap-6 text-xs font-sans font-bold uppercase tracking-wide">
             <span className="flex-1 text-right">{data.personal.role}</span>
             <span className="w-1 h-1 bg-zinc-400 rounded-full"></span>
             <span className="flex-1 text-center">{data.personal.location}</span>
             <span className="w-1 h-1 bg-zinc-400 rounded-full"></span>
             <span className="flex-1 text-left">{data.personal.email}</span>
        </div>
      </header>

      {/* Summary as "Lead Story" */}
      {data.personal.summary && (
        <section className="mb-10 column-count-1 relative">
            <div className="float-left mr-6 mb-2 w-32 h-32 border-2 border-zinc-800 p-1 flex items-center justify-center bg-zinc-100 text-zinc-400 font-bold text-3xl">
                {data.personal.photo ? (
                    <img src={data.personal.photo} alt="Profile" className="w-full h-full object-cover grayscale" />
                ) : (
                    <span>{data.personal.fullName.charAt(0)}</span>
                )}
            </div>
             <p className="text-base leading-7 font-medium first-letter:text-5xl first-letter:font-bold first-letter:mr-2 first-letter:float-left first-letter:leading-[0.8]">
                 {data.personal.summary}
             </p>
             <div className="clear-both"></div>
        </section>
      )}

      <div className="grid grid-cols-12 gap-8 border-t border-zinc-900 pt-8">
        
        {/* Left Col (Main Story) */}
        <div className="col-span-8 pr-4 border-r border-zinc-200">
            
             {/* Experience */}
             {data.experience.length > 0 && (
                <section>
                    <h3 className="font-sans font-bold text-xs uppercase border-b border-zinc-900 mb-4 inline-block pr-4">Career Retrospective</h3>
                    <div className="space-y-8">
                        {data.experience.map((exp) => (
                            <div key={exp.id}>
                                <h4 className="text-xl font-bold leading-tight mb-1">{exp.role}</h4>
                                <div className="text-xs font-sans font-bold text-zinc-500 mb-2 uppercase flex items-center gap-2">
                                    {exp.company}
                                    <div className="h-px bg-zinc-300 flex-1"></div>
                                    <span>{exp.startDate} - {exp.endDate}</span>
                                </div>
                                <p className="text-sm leading-6 text-zinc-800">
                                    {exp.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Projects */}
             {data.projects.length > 0 && (
                <section className="mt-10 pt-8 border-t border-zinc-200">
                    <h3 className="font-sans font-bold text-xs uppercase border-b border-zinc-900 mb-4 inline-block pr-4">Notable Works</h3>
                    <div className="grid grid-cols-2 gap-6">
                        {data.projects.map((proj) => (
                            <div key={proj.id}>
                                <h5 className="font-bold text-sm mb-1">{proj.name}</h5>
                                <p className="text-xs leading-5 text-zinc-600">{proj.description}</p>
                            </div>
                        ))}
                    </div>
                </section>
            )}

        </div>

        {/* Right Col (Sidebar/Ads) */}
        <div className="col-span-4 space-y-10">
            
            {/* Education Box */}
            {data.education.length > 0 && (
                <section className="bg-zinc-100 p-4 border border-zinc-200">
                     <h3 className="font-sans font-bold text-center text-xs uppercase mb-3 pb-2 border-b border-zinc-300">Academic Background</h3>
                     <div className="space-y-4 text-center">
                        {data.education.map(edu => (
                            <div key={edu.id}>
                                <div className="font-bold text-sm">{edu.institution}</div>
                                <div className="text-xs italic text-zinc-600">{edu.degree}</div>
                                <div className="text-[10px] font-sans text-zinc-400 mt-1 uppercase">{edu.endDate}</div>
                            </div>
                        ))}
                     </div>
                </section>
            )}

            {/* Skills List */}
             {data.skills.length > 0 && (
                <section>
                    <h3 className="font-sans font-bold text-xs uppercase border-b border-zinc-900 mb-3">Core Competencies</h3>
                    <ul className="text-sm space-y-1 list-disc pl-4 leading-6">
                        {data.skills.map(s => <li key={s.id}>{s.name}</li>)}
                    </ul>
                </section>
            )}
            
            <div className="mt-auto border-t-2 border-zinc-900 pt-2 text-center">
                <p className="font-sans text-[10px] uppercase font-bold text-zinc-400">End of File</p>
            </div>

        </div>
      </div>
    </div>
  );
};