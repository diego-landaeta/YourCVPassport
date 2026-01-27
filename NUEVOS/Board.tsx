import React from 'react';
import { CVData } from '../types';
import { Mail, Phone } from '../components/ui/Icons';

export const BoardTheme: React.FC<{ data: CVData }> = ({ data }) => {
  return (
    <div className="font-sans text-slate-700 h-full bg-[#0079bf] p-6 flex flex-col gap-6 overflow-hidden">
      
      {/* Header (Board Bar) */}
      <header className="bg-black/20 backdrop-blur-sm p-4 rounded-lg flex justify-between items-center text-white">
        <div className="flex items-center gap-4">
            <div className="font-bold text-xl bg-[#dfe1e6] text-[#172b4d] px-3 py-1 rounded shadow-sm overflow-hidden p-0 min-w-[40px] h-[40px] flex items-center justify-center">
                 {data.personal.photo ? (
                    <img src={data.personal.photo} className="w-10 h-10 object-cover" alt="User" />
                 ) : (
                    <span>{data.personal.fullName.charAt(0)}</span>
                 )}
            </div>
            <h1 className="text-xl font-bold">{data.personal.fullName} / {data.personal.role}</h1>
        </div>
        <div className="flex gap-3 text-sm font-medium">
             {data.personal.email && <span className="bg-white/20 px-2 py-1 rounded hover:bg-white/30 cursor-pointer">{data.personal.email}</span>}
             <span className="bg-white/20 px-2 py-1 rounded hover:bg-white/30 cursor-pointer">Public</span>
             <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-orange-400"></div>
        </div>
      </header>

      {/* Columns Container */}
      <div className="flex-1 grid grid-cols-3 gap-6 overflow-hidden items-start">
        
        {/* Column 1: Backlog (Education & Skills) */}
        <div className="bg-[#ebecf0] p-3 rounded-xl shadow-lg flex flex-col gap-3 max-h-full">
            <h3 className="font-bold text-[#172b4d] px-2 text-sm">Backlog (Skills & Edu)</h3>
            
            {data.skills.length > 0 && (
                <div className="bg-white p-3 rounded shadow-sm border-b border-slate-200 cursor-pointer hover:bg-slate-50">
                    <div className="flex flex-wrap gap-1 mb-2">
                        <div className="h-2 w-8 bg-red-400 rounded-full"></div>
                        <div className="h-2 w-8 bg-yellow-400 rounded-full"></div>
                    </div>
                    <div className="text-sm font-medium text-[#172b4d] mb-2">Master the following stack</div>
                    <div className="flex flex-wrap gap-1">
                        {data.skills.map(s => (
                            <span key={s.id} className="text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 border border-slate-200">{s.name}</span>
                        ))}
                    </div>
                </div>
            )}

            {data.education.map(edu => (
                <div key={edu.id} className="bg-white p-3 rounded shadow-sm border-b border-slate-200 cursor-pointer hover:bg-slate-50">
                     <div className="h-2 w-8 bg-purple-400 rounded-full mb-2"></div>
                    <div className="text-sm font-medium text-[#172b4d]">{edu.institution}</div>
                    <div className="text-xs text-slate-500 mt-1">{edu.degree}</div>
                    <div className="flex items-center gap-1 mt-2 text-[10px] text-slate-400">
                        <span>🕒 {edu.endDate}</span>
                    </div>
                </div>
            ))}
            
            <div className="text-slate-500 text-sm p-2 hover:bg-[#091e4214] rounded cursor-pointer transition-colors">+ Add a card</div>
        </div>

        {/* Column 2: In Progress (Current Exp & Summary) */}
        <div className="bg-[#ebecf0] p-3 rounded-xl shadow-lg flex flex-col gap-3 max-h-full">
            <h3 className="font-bold text-[#172b4d] px-2 text-sm">In Progress (Current)</h3>
            
            {data.personal.summary && (
                <div className="bg-white p-3 rounded shadow-sm border-b border-slate-200 cursor-pointer hover:bg-slate-50">
                     <div className="h-2 w-8 bg-blue-400 rounded-full mb-2"></div>
                    <div className="text-sm font-medium text-[#172b4d] mb-1">About Me</div>
                    <p className="text-xs text-slate-600 leading-relaxed">{data.personal.summary}</p>
                </div>
            )}

            {data.experience.filter(e => e.current).map(exp => (
                 <div key={exp.id} className="bg-white p-3 rounded shadow-sm border-b border-slate-200 cursor-pointer hover:bg-slate-50">
                    <div className="h-40 bg-cover bg-center rounded mb-2 -mx-3 -mt-3 rounded-b-none border-b border-slate-100" style={{ backgroundImage: `url('https://placehold.co/400x200/e2e8f0/94a3b8?text=${encodeURIComponent(exp.company)}')` }}></div>
                    <div className="text-sm font-medium text-[#172b4d]">{exp.role} @ {exp.company}</div>
                    <div className="text-xs text-slate-600 mt-1 line-clamp-4">{exp.description}</div>
                     <div className="flex items-center justify-between mt-3 text-[10px] text-slate-400">
                        <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold">ACTIVE</span>
                        <div className="w-5 h-5 bg-slate-200 rounded-full text-center leading-5 text-[8px] font-bold text-slate-500">ME</div>
                    </div>
                </div>
            ))}
            <div className="text-slate-500 text-sm p-2 hover:bg-[#091e4214] rounded cursor-pointer transition-colors">+ Add a card</div>
        </div>

        {/* Column 3: Done (Past Exp & Projects) */}
        <div className="bg-[#ebecf0] p-3 rounded-xl shadow-lg flex flex-col gap-3 max-h-full">
            <h3 className="font-bold text-[#172b4d] px-2 text-sm">Done (History)</h3>
            
            {data.experience.filter(e => !e.current).map(exp => (
                 <div key={exp.id} className="bg-white p-3 rounded shadow-sm border-b border-slate-200 cursor-pointer hover:bg-slate-50 opacity-80">
                    <div className="text-sm font-medium text-[#172b4d] decoration-slate-400">{exp.role}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{exp.company}</div>
                     <div className="flex items-center gap-1 mt-2 text-[10px] text-green-700">
                        <span>✓ Completed {exp.endDate}</span>
                    </div>
                </div>
            ))}

            {data.projects.map(proj => (
                 <div key={proj.id} className="bg-white p-3 rounded shadow-sm border-b border-slate-200 cursor-pointer hover:bg-slate-50">
                    <div className="h-2 w-8 bg-sky-400 rounded-full mb-2"></div>
                    <div className="text-sm font-medium text-[#172b4d]">{proj.name}</div>
                    <div className="text-xs text-slate-600 mt-1">{proj.description}</div>
                    {proj.link && <div className="mt-2 text-[10px] text-blue-500 underline">Attachment: Link</div>}
                </div>
            ))}

            <div className="text-slate-500 text-sm p-2 hover:bg-[#091e4214] rounded cursor-pointer transition-colors">+ Add a card</div>
        </div>

      </div>
    </div>
  );
};