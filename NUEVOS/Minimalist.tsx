import React from 'react';
import { CVData } from '../types';
import { ExternalLink } from '../components/ui/Icons';

export const MinimalistTheme: React.FC<{ data: CVData }> = ({ data }) => {
  return (
    <div className="font-sans text-zinc-900 h-full p-10 md:p-16 max-w-[210mm] mx-auto">
      
      {/* Header */}
      <header className="mb-16 flex justify-between items-start">
        <div>
            <h1 className="text-4xl font-light tracking-tight mb-2 uppercase text-zinc-900">
            {data.personal.fullName}
            </h1>
            <div className="text-sm font-medium tracking-widest uppercase text-zinc-500 mb-6">
                {data.personal.role}
            </div>
            
            <div className="text-xs text-zinc-600 space-y-1 font-mono">
            {data.personal.email && <div>{data.personal.email}</div>}
            {data.personal.phone && <div>{data.personal.phone}</div>}
            {data.personal.location && <div>{data.personal.location}</div>}
            {data.personal.website && <div>{data.personal.website}</div>}
            </div>
        </div>
        
        <div className="w-32 h-32 bg-zinc-50 border border-zinc-200 overflow-hidden flex items-center justify-center text-zinc-300 font-light text-4xl">
            {data.personal.photo ? (
                <img src={data.personal.photo} alt={data.personal.fullName} className="w-full h-full object-cover grayscale opacity-90" />
            ) : (
                <span>{data.personal.fullName.charAt(0)}</span>
            )}
        </div>
      </header>

      {/* Main Content - Single Column, lots of spacing */}
      <div className="space-y-12">
        
        {/* Summary */}
        {data.personal.summary && (
          <section>
            <p className="text-sm leading-7 text-zinc-800 max-w-lg">
              {data.personal.summary}
            </p>
          </section>
        )}

        {/* Experience */}
        {data.experience.length > 0 && (
          <section>
            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-900 mb-8 border-b border-zinc-200 pb-2 w-12">Exp.</h3>
            <div className="space-y-10 pl-12 border-l border-zinc-200">
              {data.experience.map((exp) => (
                <div key={exp.id} className="relative">
                  <div className="absolute -left-[53px] top-1 text-[10px] text-zinc-400 font-mono w-8 text-right">
                      {exp.startDate.split(' ')[1] || exp.startDate}
                  </div>
                  <h4 className="font-medium text-zinc-900 text-sm">{exp.role}</h4>
                  <div className="text-xs text-zinc-500 mb-2">{exp.company}</div>
                  <p className="text-xs leading-6 text-zinc-600 text-justify">
                    {exp.description}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Two Columns for Projects / Education / Skills */}
        <div className="grid grid-cols-2 gap-12">
            
            <div className="space-y-12">
                {/* Projects */}
                {data.projects.length > 0 && (
                <section>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-900 mb-6 border-b border-zinc-200 pb-2 w-12">Wrk.</h3>
                    <div className="space-y-6">
                    {data.projects.map((proj) => (
                        <div key={proj.id}>
                        <div className="font-medium text-sm text-zinc-900 flex items-center gap-2">
                            {proj.name}
                            {proj.link && <ExternalLink size={10} className="text-zinc-400"/>}
                        </div>
                        <p className="text-xs text-zinc-500 mt-1">{proj.description}</p>
                        </div>
                    ))}
                    </div>
                </section>
                )}
            </div>

            <div className="space-y-12">
                {/* Education */}
                {data.education.length > 0 && (
                <section>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-900 mb-6 border-b border-zinc-200 pb-2 w-12">Edu.</h3>
                    <div className="space-y-4">
                    {data.education.map((edu) => (
                        <div key={edu.id}>
                        <div className="text-sm font-medium text-zinc-900">{edu.institution}</div>
                        <div className="text-xs text-zinc-500">{edu.degree}</div>
                        </div>
                    ))}
                    </div>
                </section>
                )}

                {/* Skills */}
                {data.skills.length > 0 && (
                <section>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-900 mb-6 border-b border-zinc-200 pb-2 w-12">Skl.</h3>
                    <div className="text-xs text-zinc-600 leading-6">
                        {data.skills.map(s => s.name).join('  /  ')}
                    </div>
                </section>
                )}
            </div>
        </div>

      </div>
    </div>
  );
};