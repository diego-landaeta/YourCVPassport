import React from 'react';
import { CVData } from '../types';
import { ExternalLink, Mail, Phone, Globe } from '../components/ui/Icons';

export const ComicTheme: React.FC<{ data: CVData }> = ({ data }) => {
  return (
    <div className="font-sans text-black h-full bg-yellow-50 p-8 md:p-12 overflow-hidden" style={{ backgroundImage: 'radial-gradient(circle, #fbbf24 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
      
      {/* Header Panel */}
      <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-8 transform -rotate-1">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
                <div className="w-24 h-24 rounded-full border-4 border-black overflow-hidden bg-yellow-300 flex items-center justify-center text-black font-black text-4xl">
                    {data.personal.photo ? (
                        <img src={data.personal.photo} alt="Hero" className="w-full h-full object-cover" />
                    ) : (
                        <span>{data.personal.fullName.charAt(0)}</span>
                    )}
                </div>
                <div>
                    <h1 className="text-6xl font-black uppercase italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-600 drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]" style={{ WebkitTextStroke: '2px black' }}>
                        {data.personal.fullName}
                    </h1>
                    <div className="inline-block bg-pink-500 text-white font-bold text-xl px-4 py-1 border-2 border-black mt-2 transform skew-x-12 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        {data.personal.role}
                    </div>
                </div>
            </div>
            
            {/* Speech Bubble Contact */}
            <div className="relative bg-white border-4 border-black p-4 rounded-[2rem] rounded-bl-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="text-xs font-bold space-y-1">
                    {data.personal.email && <div className="flex items-center gap-2"><Mail size={12}/> {data.personal.email}</div>}
                    {data.personal.phone && <div className="flex items-center gap-2"><Phone size={12}/> {data.personal.phone}</div>}
                    {data.personal.website && <div className="flex items-center gap-2"><Globe size={12}/> {data.personal.website}</div>}
                </div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        
        {/* Left Column */}
        <div className="col-span-12 md:col-span-8 flex flex-col gap-6">
            
            {/* Summary Panel */}
            {data.personal.summary && (
                <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,188,212,1)]">
                    <h3 className="text-xl font-black uppercase mb-2 bg-cyan-400 inline-block px-2 border-2 border-black">Origin Story</h3>
                    <p className="font-medium text-lg leading-tight">
                        {data.personal.summary}
                    </p>
                </div>
            )}

            {/* Experience Panel */}
            {data.experience.length > 0 && (
                <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(233,30,99,1)] flex-1">
                    <h3 className="text-2xl font-black uppercase mb-6 bg-pink-500 text-white inline-block px-3 py-1 border-2 border-black transform rotate-1">Adventures</h3>
                    <div className="space-y-8">
                        {data.experience.map(exp => (
                            <div key={exp.id} className="relative pl-4">
                                {/* Bullet */}
                                <div className="absolute left-0 top-2 w-3 h-3 bg-black rounded-full"></div>
                                <h4 className="font-black text-xl uppercase leading-none">{exp.role}</h4>
                                <div className="flex flex-wrap gap-2 items-center text-sm font-bold mt-1 mb-2">
                                    <span className="bg-yellow-300 border-2 border-black px-2">{exp.company}</span>
                                    <span>{exp.startDate} - {exp.endDate}</span>
                                </div>
                                <p className="text-sm font-bold text-gray-700 leading-snug">
                                    {exp.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

        </div>

        {/* Right Column */}
        <div className="col-span-12 md:col-span-4 flex flex-col gap-6">
            
            {/* Skills Panel */}
            {data.skills.length > 0 && (
                <div className="bg-black p-6 border-4 border-black shadow-[6px_6px_0px_0px_rgba(255,255,255,1)]">
                    <h3 className="text-xl font-black uppercase mb-4 text-yellow-400">Superpowers</h3>
                    <div className="flex flex-wrap gap-2">
                        {data.skills.map(s => (
                            <span key={s.id} className="bg-white text-black font-bold text-xs px-2 py-1 border-2 border-white hover:bg-yellow-300 hover:border-yellow-300 transition-colors cursor-default">
                                {s.name.toUpperCase()}
                            </span>
                        ))}
                    </div>
                </div>
            )}

             {/* Education Panel */}
             {data.education.length > 0 && (
                <div className="bg-blue-600 p-6 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-white">
                    <h3 className="text-xl font-black uppercase mb-4 border-b-4 border-white inline-block">Training</h3>
                    <div className="space-y-4">
                        {data.education.map(edu => (
                            <div key={edu.id} className="bg-blue-500 p-2 border-2 border-black">
                                <div className="font-black text-sm">{edu.institution}</div>
                                <div className="text-xs font-bold text-yellow-300">{edu.degree}</div>
                                <div className="text-[10px] font-bold mt-1">{edu.endDate}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {/* Projects Panel */}
            {data.projects.length > 0 && (
                <div className="bg-white p-6 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                    <h3 className="text-xl font-black uppercase mb-4 bg-yellow-300 inline-block border-2 border-black px-1">Missions</h3>
                    <div className="space-y-4">
                        {data.projects.map(proj => (
                            <div key={proj.id}>
                                <div className="font-black text-sm flex items-center gap-1">
                                    {proj.name}
                                    {proj.link && <ExternalLink size={12}/>}
                                </div>
                                <div className="text-xs font-bold text-gray-500">{proj.description}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

        </div>

      </div>
    </div>
  );
};