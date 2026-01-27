import React from 'react';
import { CVData } from '../types';
import { Globe, Mail, Phone, ExternalLink } from '../components/ui/Icons';

export const RetroTheme: React.FC<{ data: CVData }> = ({ data }) => {
  return (
    <div className="font-sans text-black h-full bg-[#008080] p-8 flex flex-col gap-6 relative overflow-hidden" style={{ fontFamily: '"MS Sans Serif", Tahoma, sans-serif' }}>
      
      {/* Desktop Icons (Decoration) */}
      <div className="absolute top-4 left-4 flex flex-col gap-6 text-white text-center w-16">
          <div className="flex flex-col items-center gap-1 group cursor-pointer">
              <div className="w-8 h-8 bg-white/20 border-2 border-white flex items-center justify-center text-black text-xs font-bold shadow-lg group-hover:bg-blue-800 group-hover:text-white transition-colors">CV</div>
              <span className="text-[10px] bg-[#008080] group-hover:bg-blue-800 px-1 border border-dotted border-transparent group-hover:border-white">My PC</span>
          </div>
          <div className="flex flex-col items-center gap-1 group cursor-pointer">
              <div className="w-8 h-8 bg-white/20 border-2 border-white flex items-center justify-center text-black text-xs font-bold shadow-lg group-hover:bg-blue-800 group-hover:text-white transition-colors">@</div>
              <span className="text-[10px] bg-[#008080] group-hover:bg-blue-800 px-1 border border-dotted border-transparent group-hover:border-white">Email</span>
          </div>
      </div>

      {/* Main Window */}
      <div className="flex-1 bg-[#c0c0c0] border-2 border-white border-r-black border-b-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)] flex flex-col p-1 ml-16 md:ml-0 max-w-4xl mx-auto w-full">
        
        {/* Title Bar */}
        <div className="bg-[#000080] px-2 py-1 flex justify-between items-center text-white mb-4">
            <div className="flex items-center gap-2 font-bold text-sm">
                <span className="italic font-serif">NotePad</span> - {data.personal.fullName}.txt
            </div>
            <div className="flex gap-1">
                <button className="w-4 h-4 bg-[#c0c0c0] border border-white border-r-black border-b-black text-black text-[10px] leading-3 font-bold flex items-center justify-center active:border-l-black active:border-t-black active:border-r-white active:border-b-white">_</button>
                <button className="w-4 h-4 bg-[#c0c0c0] border border-white border-r-black border-b-black text-black text-[10px] leading-3 font-bold flex items-center justify-center active:border-l-black active:border-t-black active:border-r-white active:border-b-white">□</button>
                <button className="w-4 h-4 bg-[#c0c0c0] border border-white border-r-black border-b-black text-black text-[10px] leading-3 font-bold flex items-center justify-center active:border-l-black active:border-t-black active:border-r-white active:border-b-white">×</button>
            </div>
        </div>

        {/* Menu Bar */}
        <div className="flex gap-4 px-2 text-sm mb-2 border-b border-gray-400 pb-1">
            <span className="underline cursor-pointer">F</span>ile
            <span className="underline cursor-pointer">E</span>dit
            <span className="underline cursor-pointer">S</span>earch
            <span className="underline cursor-pointer">H</span>elp
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white border-2 border-gray-400 border-r-white border-b-white p-6 overflow-y-auto font-mono text-sm leading-6 shadow-inner relative">
            
            <div className="absolute top-4 right-4 w-24 h-24 border-2 border-black p-1 bg-white shadow-lg transform rotate-2 flex items-center justify-center">
                {data.personal.photo ? (
                    <img src={data.personal.photo} alt="Profile" className="w-full h-full object-cover grayscale" />
                ) : (
                    <span className="text-[10px]">No IMG</span>
                )}
                <div className="text-[9px] text-center mt-0.5 absolute -bottom-4 bg-white px-1 border border-black">fig_1.jpg</div>
            </div>

            <h1 className="text-2xl font-bold uppercase mb-2 text-black">{data.personal.fullName}</h1>
            <div className="mb-6 text-gray-600">****************************************<br/>ROLE: {data.personal.role.toUpperCase()}<br/>****************************************</div>
            
            <div className="grid grid-cols-12 gap-8">
                <div className="col-span-12 md:col-span-8">
                    {/* Summary */}
                    {data.personal.summary && (
                        <div className="mb-8">
                            <h3 className="font-bold border-b border-black mb-2 uppercase">1.0 Profile</h3>
                            <p>{data.personal.summary}</p>
                        </div>
                    )}

                    {/* Experience */}
                    {data.experience.length > 0 && (
                        <div className="mb-8">
                            <h3 className="font-bold border-b border-black mb-4 uppercase">2.0 Experience_Log</h3>
                            <div className="space-y-6">
                                {data.experience.map(exp => (
                                    <div key={exp.id}>
                                        <div className="font-bold">{`>> ${exp.role}`}</div>
                                        <div className="text-gray-500 mb-1">   at {exp.company} [{exp.startDate} - {exp.endDate}]</div>
                                        <p className="pl-6">{exp.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="col-span-12 md:col-span-4 border-l border-dashed border-gray-400 pl-4">
                     {/* Contact */}
                    <div className="mb-8">
                        <h3 className="font-bold border-b border-black mb-2 uppercase">Connect.exe</h3>
                        <div className="text-xs space-y-1">
                            {data.personal.email && <div>E: {data.personal.email}</div>}
                            {data.personal.phone && <div>T: {data.personal.phone}</div>}
                            {data.personal.website && <div>W: {data.personal.website}</div>}
                        </div>
                    </div>

                    {/* Skills */}
                    {data.skills.length > 0 && (
                        <div className="mb-8">
                            <h3 className="font-bold border-b border-black mb-2 uppercase">Sys.Config</h3>
                            <ul className="list-disc pl-4 text-xs">
                                {data.skills.map(s => <li key={s.id}>{s.name}</li>)}
                            </ul>
                        </div>
                    )}
                    
                    {/* Education */}
                     {data.education.length > 0 && (
                        <div className="mb-8">
                            <h3 className="font-bold border-b border-black mb-2 uppercase">Install.Hist</h3>
                            <div className="space-y-4">
                                {data.education.map(edu => (
                                    <div key={edu.id}>
                                        <div className="font-bold text-xs">{edu.institution}</div>
                                        <div className="text-xs text-gray-500">{edu.degree}</div>
                                        <div className="text-[10px]">{edu.endDate}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
             {/* Cursor */}
             <div className="mt-8 animate-pulse">_</div>
        </div>

        {/* Scrollbars (Visual Only) */}
        <div className="h-4 bg-[#c0c0c0] border-t border-white flex justify-between items-center px-1 mt-1">
             <div className="flex gap-1 text-[10px]">
                 <span>Ln 1, Col 1</span>
             </div>
             <div className="w-4 h-4 bg-[#c0c0c0] border border-white border-r-black border-b-black"></div>
        </div>

      </div>

      {/* Taskbar */}
      <div className="h-10 bg-[#c0c0c0] border-t-2 border-white absolute bottom-0 left-0 right-0 flex items-center px-1 py-1 gap-2">
           <button className="h-full px-2 flex items-center gap-1 bg-[#c0c0c0] border-2 border-white border-r-black border-b-black font-bold text-sm active:border-l-black active:border-t-black active:border-r-white active:border-b-white shadow-sm">
                <div className="w-4 h-4 bg-black flex items-center justify-center text-white italic font-serif font-bold">W</div>
                Start
           </button>
           <div className="w-[2px] h-full bg-gray-500 mx-1 border-l border-white"></div>
           <div className="h-full px-4 flex items-center gap-2 bg-[#d4d4d4] border-2 border-black border-r-white border-b-white font-bold text-xs active:bg-[#c0c0c0]">
                 <span className="italic font-serif">NotePad</span>
           </div>
           <div className="flex-1"></div>
           <div className="h-full px-4 flex items-center bg-[#c0c0c0] border-2 border-gray-500 border-r-white border-b-white text-xs inset-shadow">
                10:24 AM
           </div>
      </div>

    </div>
  );
};