import React from 'react';
import { CVData } from '../types';

export const SystemTheme: React.FC<{ data: CVData }> = ({ data }) => {
  return (
    <div className="font-mono text-gray-200 h-full bg-[#0000AA] p-4 md:p-8 flex flex-col justify-between">
      
      {/* Outer Double Border */}
      <div className="border-4 border-double border-gray-400 h-full p-1 flex flex-col">
        <div className="border border-gray-400 h-full flex flex-col">
            
            {/* Header Bar */}
            <div className="bg-gray-300 text-[#0000AA] px-4 py-1 text-center font-bold uppercase tracking-widest mb-4 shadow-sm">
                Velvet BIOS Setup Utility - {new Date().getFullYear()}
            </div>

            <div className="flex-1 px-4 md:px-8 py-4 overflow-hidden flex flex-col gap-6">
                
                {/* User Info Section */}
                <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-12 border border-gray-400 p-4 relative">
                        <span className="absolute -top-2 left-4 bg-[#0000AA] px-2 text-yellow-400 font-bold">User_Config</span>
                        <div className="flex gap-6 items-center">
                            {data.personal.photo && (
                                <div className="w-20 h-20 border-2 border-gray-400 p-1">
                                    <img src={data.personal.photo} className="w-full h-full object-cover grayscale brightness-150 contrast-125" alt="User" />
                                </div>
                            )}
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold text-white uppercase text-shadow">{data.personal.fullName}</h1>
                                <div className="text-yellow-400">{data.personal.role}</div>
                                <div className="mt-2 text-xs text-gray-300">
                                    ID: {data.id.split('-')[0].toUpperCase()} <br/>
                                    LOC: {data.personal.location || 'N/A'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-12 gap-6 flex-1">
                    
                    {/* Left Panel: Menu Items (Experience) */}
                    <div className="col-span-12 md:col-span-8 border border-gray-400 p-4 relative">
                        <span className="absolute -top-2 left-4 bg-[#0000AA] px-2 text-yellow-400 font-bold">Main_Boot_Sequence</span>
                        
                        {/* Summary */}
                        {data.personal.summary && (
                            <div className="mb-6 pb-4 border-b border-dashed border-gray-500">
                                <p className="text-sm leading-relaxed text-gray-300">
                                    {data.personal.summary}
                                </p>
                            </div>
                        )}

                        {/* Experience */}
                        <div className="space-y-4">
                            {data.experience.map((exp, idx) => (
                                <div key={exp.id} className="group">
                                    <div className="flex justify-between text-white mb-1 group-hover:bg-gray-200 group-hover:text-[#0000AA] px-1 transition-colors cursor-default">
                                        <span className="font-bold">[{idx+1}] {exp.company}</span>
                                        <span>{exp.startDate} - {exp.endDate}</span>
                                    </div>
                                    <div className="px-2 text-yellow-400 text-xs mb-1">{`> ${exp.role}`}</div>
                                    <div className="px-2 text-gray-300 text-xs leading-5">
                                        {exp.description}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Projects */}
                        {data.projects.length > 0 && (
                            <div className="mt-6 pt-4 border-t border-gray-400">
                                <div className="text-yellow-400 font-bold mb-2">Extended_Memory (Projects)</div>
                                {data.projects.map(proj => (
                                    <div key={proj.id} className="mb-2">
                                        <span className="text-white font-bold">{proj.name}</span>
                                        <span className="text-gray-400 text-xs ml-2"> // {proj.description}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right Panel: Item Help (Skills/Contact) */}
                    <div className="col-span-12 md:col-span-4 border border-gray-400 p-4 relative">
                        <span className="absolute -top-2 left-4 bg-[#0000AA] px-2 text-yellow-400 font-bold">Item_Help</span>
                        
                        <div className="space-y-6 text-sm">
                            
                            {/* Contact */}
                            <div>
                                <div className="text-white font-bold mb-1 underline">Connection</div>
                                <div className="text-gray-300 text-xs space-y-1">
                                    {data.personal.email && <div>E: {data.personal.email}</div>}
                                    {data.personal.phone && <div>T: {data.personal.phone}</div>}
                                    {data.personal.website && <div>W: {data.personal.website}</div>}
                                </div>
                            </div>

                            {/* Skills */}
                            {data.skills.length > 0 && (
                                <div>
                                    <div className="text-white font-bold mb-1 underline">Drivers</div>
                                    <ul className="text-xs text-yellow-400 list-disc pl-4 space-y-1">
                                        {data.skills.map(s => (
                                            <li key={s.id}>{s.name}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Education */}
                            {data.education.length > 0 && (
                                <div>
                                    <div className="text-white font-bold mb-1 underline">Firmware</div>
                                    {data.education.map(edu => (
                                        <div key={edu.id} className="mb-2 text-xs">
                                            <div className="text-white">{edu.institution}</div>
                                            <div className="text-gray-400">{edu.degree}</div>
                                            <div className="text-gray-500">{edu.endDate}</div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="mt-8 text-[10px] text-gray-500">
                                <p>Use &uarr;&darr; keys to select item.</p>
                                <p>Use Enter to view details.</p>
                                <p>F10: Save and Exit.</p>
                            </div>

                        </div>
                    </div>

                </div>

            </div>

            {/* Footer Bar */}
            <div className="bg-gray-300 text-[#0000AA] px-4 py-1 flex justify-between text-xs font-bold">
                <div className="space-x-4">
                    <span>F1:Help</span>
                    <span>Esc:Exit</span>
                    <span>&uarr;&darr;:Select Item</span>
                </div>
                <div className="space-x-4">
                    <span>F5:Previous Values</span>
                    <span>F10:Save&Exit</span>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};