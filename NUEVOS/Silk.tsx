import React from 'react';
import { CVData } from '../types';
import { Mail, Phone, MapPin, Globe } from '../components/ui/Icons';

export const SilkTheme: React.FC<{ data: CVData }> = ({ data }) => {
  return (
    <div className="font-serif text-stone-800 h-full bg-[#f3f0e9] p-12 md:p-16 flex flex-col">
      
      {/* Centered Minimal Header */}
      <header className="text-center mb-16 relative flex flex-col items-center">
        <div className="w-28 h-28 rounded-full overflow-hidden border border-stone-400 mb-6 p-1">
            <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-stone-200 text-stone-400 text-3xl font-light">
                 {data.personal.photo ? (
                     <img src={data.personal.photo} alt={data.personal.fullName} className="w-full h-full object-cover" />
                 ) : (
                     <span>{data.personal.fullName.charAt(0)}</span>
                 )}
            </div>
        </div>
        <div className="inline-block border-b border-stone-800 pb-8 px-10">
            <h1 className="text-4xl md:text-5xl font-normal tracking-wide uppercase mb-3">
            {data.personal.fullName}
            </h1>
            <p className="text-sm font-sans tracking-[0.3em] uppercase text-stone-500">{data.personal.role}</p>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-12 gap-12">
        
        {/* Left Column (Details) */}
        <div className="col-span-4 text-right space-y-12 border-r border-stone-300 pr-12">
            
            {/* Contact */}
            <section>
                <h3 className="font-sans text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-4">Contact</h3>
                <div className="text-xs font-sans space-y-2 text-stone-600">
                    {data.personal.email && <div>{data.personal.email}</div>}
                    {data.personal.phone && <div>{data.personal.phone}</div>}
                    {data.personal.location && <div>{data.personal.location}</div>}
                    {data.personal.website && <div>{data.personal.website}</div>}
                </div>
            </section>

             {/* Education */}
             {data.education.length > 0 && (
                <section>
                    <h3 className="font-sans text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-4">Education</h3>
                    <div className="space-y-6">
                        {data.education.map(edu => (
                            <div key={edu.id}>
                                <div className="font-bold text-sm">{edu.institution}</div>
                                <div className="text-xs italic text-stone-500 mb-1">{edu.degree}</div>
                                <div className="text-[10px] font-sans text-stone-400">{edu.endDate}</div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Skills */}
            {data.skills.length > 0 && (
                <section>
                    <h3 className="font-sans text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-4">Expertise</h3>
                    <div className="flex flex-col gap-1 text-xs font-medium text-stone-700">
                        {data.skills.map(s => <span key={s.id}>{s.name}</span>)}
                    </div>
                </section>
            )}

        </div>

        {/* Right Column (Content) */}
        <div className="col-span-8 space-y-12">
            
            {/* Summary */}
            {data.personal.summary && (
                <section>
                    <p className="text-lg italic leading-8 text-stone-600 font-light">
                        {data.personal.summary}
                    </p>
                </section>
            )}

            {/* Experience */}
            {data.experience.length > 0 && (
                <section>
                    <h3 className="font-sans text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-8">Professional Experience</h3>
                    <div className="space-y-10">
                        {data.experience.map(exp => (
                            <div key={exp.id}>
                                <div className="flex justify-between items-baseline mb-2">
                                    <h4 className="text-xl font-medium">{exp.role}</h4>
                                    <span className="font-sans text-[10px] text-stone-400 uppercase tracking-widest border border-stone-300 px-2 py-1 rounded-full">
                                        {exp.startDate} - {exp.endDate}
                                    </span>
                                </div>
                                <div className="text-sm font-sans font-bold uppercase tracking-wider text-stone-500 mb-4">{exp.company}</div>
                                <p className="text-sm leading-7 text-stone-600 text-justify">
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
                     <h3 className="font-sans text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-8">Selected Works</h3>
                     <div className="grid grid-cols-2 gap-6">
                         {data.projects.map(proj => (
                             <div key={proj.id} className="bg-white p-6 shadow-sm">
                                 <div className="font-bold text-sm mb-2">{proj.name}</div>
                                 <p className="text-xs text-stone-500 leading-relaxed">{proj.description}</p>
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