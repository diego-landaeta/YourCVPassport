import React from 'react';
import { CVData } from '../types';
import { ExternalLink, Globe, Mail, MapPin, Phone, Code } from '../components/ui/Icons';

export const CyberTheme: React.FC<{ data: CVData }> = ({ data }) => {
  return (
    <div className="font-mono text-green-400 bg-zinc-950 h-full p-8 md:p-12 selection:bg-green-400 selection:text-black">
      
      {/* Container with glowing border */}
      <div className="h-full border border-green-500/50 shadow-[0_0_20px_rgba(74,222,128,0.1)] p-6 relative flex flex-col">
        
        {/* Decor: Corner brackets */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-green-400"></div>
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-green-400"></div>
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-green-400"></div>
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-green-400"></div>

        {/* Header */}
        <header className="border-b border-green-500/30 pb-6 mb-8 flex flex-col md:flex-row justify-between items-end gap-4">
            <div className="flex items-center gap-6">
                <div className="w-24 h-24 border-2 border-green-500 p-1 relative flex items-center justify-center">
                    <div className="absolute inset-0 bg-green-500/20 pointer-events-none"></div>
                    {data.personal.photo ? (
                        <img src={data.personal.photo} alt="User" className="w-full h-full object-cover grayscale contrast-125" />
                    ) : (
                        <span className="text-green-500 font-bold text-xs">[USER]</span>
                    )}
                     <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-500"></div>
                </div>
                <div>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tighter uppercase text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600 mb-2 filter drop-shadow-[0_0_5px_rgba(74,222,128,0.5)]">
                        {data.personal.fullName}
                    </h1>
                    <div className="text-sm tracking-widest uppercase bg-green-500/10 inline-block px-2 py-1 border border-green-500/20 text-green-300">
                    {`> ${data.personal.role}_`}
                    </div>
                </div>
            </div>
            
            <div className="text-right text-xs space-y-1 text-green-300/80">
                {data.personal.email && <div className="hover:text-green-400 cursor-pointer">[{data.personal.email}]</div>}
                {data.personal.phone && <div>[{data.personal.phone}]</div>}
                {data.personal.website && <div>[{data.personal.website}]</div>}
                {data.personal.location && <div>[{data.personal.location}]</div>}
            </div>
        </header>

        <div className="flex-1 grid grid-cols-12 gap-8 overflow-hidden">
            
            {/* Main Column */}
            <div className="col-span-12 md:col-span-8 space-y-8">
                
                {/* Summary */}
                {data.personal.summary && (
                    <section>
                        <h3 className="text-xs font-bold uppercase mb-2 text-green-500 flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 animate-pulse"></span>
                            System.Identity
                        </h3>
                        <p className="text-sm leading-6 text-green-300/90 border-l-2 border-green-500/20 pl-4">
                            {data.personal.summary}
                        </p>
                    </section>
                )}

                {/* Experience */}
                 {data.experience.length > 0 && (
                    <section>
                        <h3 className="text-xs font-bold uppercase mb-4 text-green-500 flex items-center gap-2">
                             <span className="w-2 h-2 bg-green-500"></span>
                            Runtime.Logs (Experience)
                        </h3>
                        <div className="space-y-6">
                            {data.experience.map((exp) => (
                                <div key={exp.id} className="group hover:bg-green-500/5 p-2 transition-colors border border-transparent hover:border-green-500/20 rounded">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <h4 className="font-bold text-lg text-green-200">{exp.role}</h4>
                                        <span className="text-xs text-green-500 font-bold">
                                            {`// ${exp.startDate} → ${exp.current ? 'RUNNING' : exp.endDate}`}
                                        </span>
                                    </div>
                                    <div className="text-xs text-emerald-500 uppercase tracking-wider mb-2 font-bold">{exp.company}</div>
                                    <p className="text-xs leading-5 text-green-400/80">
                                        {exp.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

            </div>

            {/* Sidebar */}
            <div className="col-span-12 md:col-span-4 space-y-8">
                
                {/* Skills */}
                {data.skills.length > 0 && (
                    <section className="border border-green-500/30 p-4 bg-green-500/5">
                        <h3 className="text-xs font-bold uppercase mb-3 text-green-500 border-b border-green-500/30 pb-1">
                            Modules (Skills)
                        </h3>
                        <div className="flex flex-col gap-2">
                            {data.skills.map((skill) => (
                                <div key={skill.id} className="flex items-center gap-2 text-xs">
                                    <span className="text-green-600">{`>>`}</span>
                                    <span className="text-green-200">{skill.name}</span>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Projects */}
                {data.projects.length > 0 && (
                    <section>
                        <h3 className="text-xs font-bold uppercase mb-3 text-green-500 border-b border-green-500/30 pb-1">
                            Executed.Binaries
                        </h3>
                        <div className="space-y-4">
                            {data.projects.map((proj) => (
                                <div key={proj.id} className="border border-green-900 bg-black p-3 hover:border-green-500 transition-colors">
                                    <div className="font-bold text-xs text-green-100 mb-1 flex items-center gap-2">
                                        {proj.name}
                                        {proj.link && <ExternalLink size={10} />}
                                    </div>
                                    <p className="text-[10px] text-green-400/70">{proj.description}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                 {/* Education */}
                 {data.education.length > 0 && (
                    <section>
                         <h3 className="text-xs font-bold uppercase mb-3 text-green-500 border-b border-green-500/30 pb-1">
                            Data.Origin
                        </h3>
                        <div className="space-y-3">
                            {data.education.map((edu) => (
                                <div key={edu.id}>
                                    <div className="font-bold text-xs text-green-100">{edu.institution}</div>
                                    <div className="text-[10px] text-green-400/60">{edu.degree}</div>
                                    <div className="text-[10px] text-green-600">{edu.endDate}</div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

            </div>
        </div>
        
        <div className="mt-auto pt-4 border-t border-green-500/30 text-[10px] text-green-600 flex justify-between uppercase">
            <span>SECURE CONNECTION ESTABLISHED</span>
            <span>ID: {data.id.split('-')[0].toUpperCase()}</span>
        </div>

      </div>
    </div>
  );
};