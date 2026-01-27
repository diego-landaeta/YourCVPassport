import React from 'react';
import { CVData } from '../types';
import { QrCode } from '../components/ui/Icons';

export const ParcelTheme: React.FC<{ data: CVData }> = ({ data }) => {
  return (
    <div className="font-sans text-black h-full bg-white p-8 flex flex-col justify-center items-center">
      
      {/* Label Container */}
      <div className="w-full max-w-[210mm] border-[6px] border-black p-2 relative h-full flex flex-col">
        
        {/* Top Section: Branding & Priority */}
        <div className="border-b-[4px] border-black flex h-32">
            <div className="w-2/3 border-r-[4px] border-black p-4 flex flex-col justify-between bg-black text-white">
                <div className="text-[10px] uppercase font-bold tracking-widest">Express Delivery</div>
                <h1 className="text-5xl font-black uppercase tracking-tighter leading-none whitespace-nowrap overflow-hidden">
                    {data.personal.fullName}
                </h1>
            </div>
            <div className="w-1/3 p-4 flex flex-col items-center justify-center text-center">
                <div className="text-4xl font-black uppercase border-4 border-black px-4 py-1 transform -rotate-6">
                    PRIORITY
                </div>
                <div className="text-xs font-bold mt-2 uppercase tracking-wide">
                    {data.personal.role}
                </div>
            </div>
        </div>

        {/* Section: From/To (Contact) */}
        <div className="border-b-[4px] border-black flex">
            <div className="w-1/2 border-r-[4px] border-black p-4">
                <div className="text-[10px] uppercase font-bold text-gray-500 mb-1">Origin / Contact</div>
                <div className="text-sm font-bold uppercase leading-snug">
                    {data.personal.email}<br/>
                    {data.personal.phone}<br/>
                    {data.personal.location || "EARTH"}
                </div>
            </div>
            <div className="w-1/2 p-4 bg-yellow-300">
                <div className="text-[10px] uppercase font-bold text-black mb-1">Destination / Objective</div>
                <div className="text-sm font-bold uppercase leading-tight">
                    FUTURE EMPLOYER<br/>
                    HR DEPARTMENT<br/>
                    IMMEDIATE HIRE
                </div>
            </div>
        </div>

        {/* Main Body */}
        <div className="flex-1 flex">
            
            {/* Sidebar (Skills/Edu) */}
            <div className="w-1/3 border-r-[4px] border-black flex flex-col">
                
                {data.skills.length > 0 && (
                    <div className="p-4 border-b-[4px] border-black">
                        <div className="text-[10px] uppercase font-bold text-gray-500 mb-2">Contents / Skills</div>
                        <div className="flex flex-col gap-1">
                            {data.skills.map(s => (
                                <div key={s.id} className="flex justify-between items-center text-xs font-bold uppercase">
                                    <span>{s.name}</span>
                                    <span className="text-[10px]">[OK]</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {data.education.length > 0 && (
                    <div className="p-4 flex-1">
                        <div className="text-[10px] uppercase font-bold text-gray-500 mb-2">Manifest / Education</div>
                        <div className="space-y-4">
                            {data.education.map(edu => (
                                <div key={edu.id}>
                                    <div className="font-bold text-sm leading-tight uppercase">{edu.institution}</div>
                                    <div className="text-xs uppercase">{edu.degree}</div>
                                    <div className="text-[10px] text-gray-600">{edu.endDate}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Main Content (Exp) */}
            <div className="w-2/3 p-6">
                
                {data.personal.summary && (
                    <div className="mb-8 border-l-[4px] border-black pl-4">
                        <p className="text-sm font-medium uppercase leading-relaxed">
                            {data.personal.summary}
                        </p>
                    </div>
                )}

                {data.experience.length > 0 && (
                    <div className="space-y-8">
                        <div className="text-[10px] uppercase font-bold text-gray-500 border-b-2 border-black pb-1 mb-4">Tracking History (Experience)</div>
                        {data.experience.map(exp => (
                            <div key={exp.id}>
                                <div className="flex justify-between items-baseline mb-1">
                                    <h4 className="text-lg font-black uppercase">{exp.role}</h4>
                                    <span className="text-xs font-bold bg-black text-white px-2 py-0.5">{exp.startDate} - {exp.endDate}</span>
                                </div>
                                <div className="text-xs font-bold uppercase mb-2 text-gray-600">@ {exp.company}</div>
                                <p className="text-sm leading-tight font-medium">
                                    {exp.description}
                                </p>
                            </div>
                        ))}
                    </div>
                )}

            </div>
        </div>

        {/* Footer Barcode */}
        <div className="border-t-[4px] border-black h-24 flex items-center p-4 justify-between bg-white">
            <div className="flex flex-col justify-center h-full w-2/3">
                {/* Fake Barcode */}
                <div className="h-12 w-full flex items-end gap-[2px]">
                    {[...Array(60)].map((_, i) => (
                        <div key={i} className="bg-black w-full" style={{ height: Math.random() > 0.3 ? '100%' : '50%'}}></div>
                    ))}
                </div>
                <div className="text-xs font-mono tracking-[0.5em] mt-1 text-center">{data.id.toUpperCase()}</div>
            </div>
            
            <div className="border-[3px] border-black p-1">
                <QrCode className="w-14 h-14" />
            </div>
        </div>

      </div>
    </div>
  );
};