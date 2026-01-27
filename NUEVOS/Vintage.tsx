import React from 'react';
import { CVData } from '../types';
import { Mail, Phone, MapPin } from '../components/ui/Icons';

export const VintageTheme: React.FC<{ data: CVData }> = ({ data }) => {
  return (
    <div className="font-mono text-[#3e3b36] h-full p-10 md:p-14 bg-[#f0e6d2] relative overflow-hidden" style={{ fontFamily: '"Courier New", Courier, monospace' }}>
      
      {/* Paper Texture Overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-10 bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')]"></div>
      
      {/* Main Border */}
      <div className="h-full border-2 border-[#5c554b] p-2 relative z-10 flex flex-col">
        <div className="h-full border border-dashed border-[#5c554b] p-8 flex flex-col">
            
            {/* Header */}
            <header className="border-b-2 border-[#3e3b36] pb-6 mb-8 flex items-center justify-between">
                <div>
                    <div className="text-xs uppercase tracking-widest mb-2 opacity-70">Confidential Personnel Record</div>
                    <h1 className="text-4xl font-bold uppercase tracking-tighter mb-2 scale-y-90 transform origin-left">
                        {data.personal.fullName}
                    </h1>
                    <div className="bg-[#3e3b36] text-[#f0e6d2] inline-block px-2 py-1 text-sm font-bold uppercase">
                        {data.personal.role}
                    </div>
                </div>
                
                {/* Photo Stamp */}
                <div className="w-28 h-32 bg-white border-4 border-white shadow-md transform rotate-2 overflow-hidden relative">
                    {data.personal.photo ? (
                        <img src={data.personal.photo} alt="Subject" className="w-full h-full object-cover sepia contrast-125" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-[#e0d8c8] text-[#5c554b] text-xs text-center font-bold p-2">
                            NO PHOTO FILED
                        </div>
                    )}
                    {/* Stamp Mark */}
                    <div className="absolute -bottom-2 -right-2 w-16 h-16 border-2 border-red-800 rounded-full opacity-60 flex items-center justify-center transform -rotate-12">
                        <span className="text-[8px] font-bold text-red-800 uppercase text-center leading-none">Official<br/>Record</span>
                    </div>
                </div>
            </header>

            <div className="flex-1 grid grid-cols-12 gap-8">
                
                {/* Left Column */}
                <div className="col-span-8 pr-4 border-r border-dotted border-[#8b857c]">
                    
                    {/* Summary */}
                    {data.personal.summary && (
                        <section className="mb-10">
                            <h3 className="text-sm font-bold uppercase border-b border-[#3e3b36] mb-3 w-max">01. Summary</h3>
                            <p className="text-sm leading-6 text-justify opacity-90">
                                {data.personal.summary}
                            </p>
                        </section>
                    )}

                    {/* Experience */}
                    {data.experience.length > 0 && (
                        <section>
                            <h3 className="text-sm font-bold uppercase border-b border-[#3e3b36] mb-6 w-max">02. Employment History</h3>
                            <div className="space-y-8">
                                {data.experience.map((exp, index) => (
                                    <div key={exp.id}>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold text-lg">{exp.role}</span>
                                            <span className="text-xs opacity-60"> // Ref #{index + 101}</span>
                                        </div>
                                        <div className="text-xs uppercase font-bold mb-2">
                                            {exp.company} <span className="mx-2">---</span> {exp.startDate} TO {exp.endDate}
                                        </div>
                                        <p className="text-xs leading-5 opacity-80 pl-4 border-l border-[#3e3b36]">
                                            {exp.description}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                </div>

                {/* Right Column */}
                <div className="col-span-4 space-y-8">
                    
                    {/* Contact Stamp */}
                    <div className="border border-[#3e3b36] p-4 bg-white/20">
                        <h3 className="text-xs font-bold uppercase mb-2 underline">Contact Coordinates</h3>
                        <div className="text-xs space-y-2 opacity-80">
                            {data.personal.email && <div className="break-all">{data.personal.email}</div>}
                            {data.personal.phone && <div>{data.personal.phone}</div>}
                            {data.personal.location && <div>{data.personal.location}</div>}
                        </div>
                    </div>

                    {/* Skills */}
                    {data.skills.length > 0 && (
                        <section>
                            <h3 className="text-sm font-bold uppercase border-b border-[#3e3b36] mb-3 w-max">03. Capabilities</h3>
                            <ul className="text-xs list-square ml-4 space-y-1">
                                {data.skills.map(s => <li key={s.id}>{s.name}</li>)}
                            </ul>
                        </section>
                    )}

                    {/* Education */}
                    {data.education.length > 0 && (
                        <section>
                            <h3 className="text-sm font-bold uppercase border-b border-[#3e3b36] mb-3 w-max">04. Academia</h3>
                            <div className="space-y-4">
                                {data.education.map(edu => (
                                    <div key={edu.id}>
                                        <div className="font-bold text-xs">{edu.institution}</div>
                                        <div className="text-[10px] italic">{edu.degree}</div>
                                        <div className="text-[10px] opacity-60">{edu.endDate}</div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                </div>

            </div>
            
            {/* Footer */}
            <div className="mt-auto pt-4 border-t border-dotted border-[#8b857c] flex justify-between text-[10px] uppercase opacity-50">
                <span>Doc: CV-{new Date().getFullYear()}</span>
                <span>Authorized Copy</span>
            </div>

        </div>
      </div>
    </div>
  );
};