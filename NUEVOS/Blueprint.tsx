import React from 'react';
import { CVData } from '../types';

export const BlueprintTheme: React.FC<{ data: CVData }> = ({ data }) => {
  return (
    <div className="font-mono text-white h-full bg-[#1e3a8a] p-8 md:p-12 relative overflow-hidden flex flex-col">
      
      {/* Grid Overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-20" 
           style={{ 
               backgroundImage: 'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)', 
               backgroundSize: '20px 20px' 
           }}>
      </div>
      
      {/* Border Container */}
      <div className="flex-1 border-4 border-white relative z-10 flex flex-col p-6">
        
        {/* Corner Markers */}
        <div className="absolute top-0 left-0 w-4 h-4 border-r border-b border-white bg-[#1e3a8a]"></div>
        <div className="absolute top-0 right-0 w-4 h-4 border-l border-b border-white bg-[#1e3a8a]"></div>
        <div className="absolute bottom-0 left-0 w-4 h-4 border-r border-t border-white bg-[#1e3a8a]"></div>
        <div className="absolute bottom-0 right-0 w-4 h-4 border-l border-t border-white bg-[#1e3a8a]"></div>

        {/* Title Block (Bottom Right style but placed top for CV) */}
        <header className="border-b-2 border-white pb-6 mb-8 flex flex-col md:flex-row justify-between items-end gap-4">
            <div className="flex gap-6 items-center">
                <div className="w-24 h-24 border-2 border-white bg-blue-900 overflow-hidden relative flex items-center justify-center">
                        {/* Photo overlay grid */}
                        <div className="absolute inset-0 z-10 pointer-events-none opacity-30" style={{ backgroundImage: 'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>
                        {data.personal.photo ? (
                            <img src={data.personal.photo} alt="Profile" className="w-full h-full object-cover mix-blend-luminosity opacity-80" />
                        ) : (
                            <span className="text-blue-300 text-xs">IMG_NULL</span>
                        )}
                </div>
                <div>
                    <div className="text-[10px] uppercase tracking-widest text-blue-200 mb-1">Project: Resume_V1.0</div>
                    <h1 className="text-4xl md:text-5xl font-bold uppercase tracking-widest leading-none">
                        {data.personal.fullName}
                    </h1>
                    <div className="text-lg mt-2 text-blue-200 font-bold">{data.personal.role}</div>
                </div>
            </div>
            <div className="text-right text-xs text-blue-100 border border-white p-2 min-w-[200px]">
                <div className="flex justify-between border-b border-blue-400/30 pb-1 mb-1">
                    <span>CONTACT</span>
                    <span>DETAIL</span>
                </div>
                {data.personal.email && <div className="block truncate">{data.personal.email}</div>}
                {data.personal.phone && <div className="block">{data.personal.phone}</div>}
                {data.personal.location && <div className="block">{data.personal.location}</div>}
            </div>
        </header>

        <div className="flex-1 grid grid-cols-12 gap-8">
            
            {/* Left Column */}
            <div className="col-span-12 md:col-span-8 space-y-8">
                
                {/* Summary */}
                {data.personal.summary && (
                    <section>
                        <h3 className="text-sm font-bold uppercase border-b border-dashed border-white mb-2 inline-block">01 // Specifications</h3>
                        <p className="text-sm leading-6 text-blue-100 text-justify">
                            {data.personal.summary}
                        </p>
                    </section>
                )}

                {/* Experience */}
                 {data.experience.length > 0 && (
                    <section>
                        <h3 className="text-sm font-bold uppercase border-b border-dashed border-white mb-4 inline-block">02 // Operational History</h3>
                        <div className="space-y-6">
                            {data.experience.map((exp, i) => (
                                <div key={exp.id} className="relative pl-6 border-l border-white/50">
                                    <div className="absolute -left-[3px] top-2 w-1.5 h-1.5 bg-white"></div>
                                    <div className="flex justify-between items-baseline mb-1">
                                        <h4 className="font-bold text-lg">{exp.role}</h4>
                                        <div className="text-xs border border-white px-1">{exp.startDate} - {exp.current ? 'CURR' : exp.endDate}</div>
                                    </div>
                                    <div className="text-blue-200 text-xs mb-2 uppercase tracking-wider">REF: {exp.company}</div>
                                    <p className="text-xs leading-5 text-blue-100">
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
                        <h3 className="text-sm font-bold uppercase border-b border-dashed border-white mb-4 inline-block">03 // Schematics</h3>
                        <div className="grid grid-cols-2 gap-4">
                            {data.projects.map(proj => (
                                <div key={proj.id} className="border border-white/50 p-2">
                                    <div className="font-bold text-sm mb-1">{proj.name}</div>
                                    <div className="text-[10px] text-blue-200 leading-tight">{proj.description}</div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

            </div>

            {/* Right Column */}
            <div className="col-span-12 md:col-span-4 space-y-8 border-l border-white pl-8">
                
                {/* Skills */}
                {data.skills.length > 0 && (
                    <section>
                        <h3 className="text-sm font-bold uppercase border-b border-dashed border-white mb-4 inline-block">04 // Components</h3>
                        <div className="space-y-2">
                            {data.skills.map((skill, i) => (
                                <div key={skill.id} className="flex items-center justify-between text-xs">
                                    <span>{skill.name}</span>
                                    <div className="w-12 h-2 border border-white p-0.5">
                                        <div className="h-full bg-white w-[70%]"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Education */}
                {data.education.length > 0 && (
                    <section>
                        <h3 className="text-sm font-bold uppercase border-b border-dashed border-white mb-4 inline-block">05 // Certification</h3>
                        <div className="space-y-4">
                            {data.education.map(edu => (
                                <div key={edu.id}>
                                    <div className="font-bold text-sm">{edu.institution}</div>
                                    <div className="text-xs text-blue-200">{edu.degree}</div>
                                    <div className="text-[10px] mt-1">{edu.endDate}</div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
                
                <div className="mt-auto pt-8 opacity-50 text-[10px] text-center">
                    <div>SCALE: 1:1</div>
                    <div>DWG NO: {data.id.substring(0,8)}</div>
                    <div>APPROVED BY: {data.personal.fullName.split(' ').map(n=>n[0]).join('')}</div>
                </div>

            </div>

        </div>

      </div>
    </div>
  );
};