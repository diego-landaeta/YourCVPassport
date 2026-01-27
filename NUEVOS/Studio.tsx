import React from 'react';
import { CVData } from '../types';
import { ExternalLink } from '../components/ui/Icons';

export const StudioTheme: React.FC<{ data: CVData }> = ({ data }) => {
  return (
    <div className="font-sans text-neutral-900 h-full bg-white flex flex-col">
      
      {/* Top Section with Large Photo Layout */}
      <div className="grid grid-cols-12 h-[350px]">
        {/* Photo Area */}
        <div className="col-span-5 bg-neutral-100 relative overflow-hidden">
             {data.personal.photo ? (
                 <img src={data.personal.photo} className="w-full h-full object-cover grayscale" alt={data.personal.fullName} />
             ) : (
                 <div className="w-full h-full flex items-center justify-center text-neutral-300 text-6xl font-serif italic">
                     {data.personal.fullName[0]}
                 </div>
             )}
        </div>
        
        {/* Header Info */}
        <div className="col-span-7 p-12 flex flex-col justify-center bg-white">
            <h1 className="text-5xl font-serif font-medium tracking-tight mb-2 leading-[0.9]">
                {data.personal.fullName}
            </h1>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-neutral-400 mb-8">{data.personal.role}</p>
            
            <div className="text-xs space-y-1 font-medium text-neutral-500">
                 {data.personal.email && <div>{data.personal.email}</div>}
                 {data.personal.phone && <div>{data.personal.phone}</div>}
                 {data.personal.location && <div>{data.personal.location}</div>}
                 {data.personal.website && <div className="underline">{data.personal.website}</div>}
            </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-12 pt-8 flex-1 grid grid-cols-12 gap-12">
          
          <div className="col-span-4 space-y-10 border-r border-neutral-100 pr-8">
               {/* Skills */}
                {data.skills.length > 0 && (
                    <section>
                        <h3 className="text-xs font-bold uppercase tracking-widest mb-4 text-neutral-900">Expertise</h3>
                        <ul className="text-sm space-y-2 text-neutral-600">
                            {data.skills.map(s => <li key={s.id} className="border-b border-neutral-100 pb-1">{s.name}</li>)}
                        </ul>
                    </section>
                )}
                
                {/* Education */}
                {data.education.length > 0 && (
                    <section>
                        <h3 className="text-xs font-bold uppercase tracking-widest mb-4 text-neutral-900">Education</h3>
                        <div className="space-y-6">
                            {data.education.map(edu => (
                                <div key={edu.id}>
                                    <div className="font-bold text-sm">{edu.institution}</div>
                                    <div className="text-xs text-neutral-500 italic mb-1">{edu.degree}</div>
                                    <div className="text-[10px] text-neutral-400">{edu.endDate}</div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
          </div>

          <div className="col-span-8 space-y-10">
               {/* Summary */}
               {data.personal.summary && (
                   <section className="mb-8">
                       <p className="text-lg font-serif italic leading-relaxed text-neutral-700">
                           {data.personal.summary}
                       </p>
                   </section>
               )}

               {/* Experience */}
               {data.experience.length > 0 && (
                    <section>
                        <h3 className="text-xs font-bold uppercase tracking-widest mb-6 text-neutral-900">Experience</h3>
                        <div className="space-y-10">
                            {data.experience.map(exp => (
                                <div key={exp.id}>
                                    <div className="flex justify-between items-baseline mb-1">
                                        <h4 className="font-bold text-lg">{exp.role}</h4>
                                        <span className="text-xs font-medium text-neutral-400">{exp.startDate} – {exp.endDate}</span>
                                    </div>
                                    <div className="text-sm font-medium text-neutral-500 mb-3">{exp.company}</div>
                                    <p className="text-sm leading-6 text-neutral-600">
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
                         <h3 className="text-xs font-bold uppercase tracking-widest mb-6 text-neutral-900 border-t border-neutral-100 pt-8">Selected Works</h3>
                         <div className="grid grid-cols-2 gap-6">
                             {data.projects.map(proj => (
                                 <div key={proj.id}>
                                     <div className="font-bold text-sm mb-1">{proj.name}</div>
                                     <p className="text-xs text-neutral-500">{proj.description}</p>
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