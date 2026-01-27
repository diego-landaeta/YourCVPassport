import React from 'react';
import { CVData } from '../types';
import { Mail, Phone, MapPin, Globe, ExternalLink, ShieldCheck } from '../components/ui/Icons';

export const AuraTheme: React.FC<{ data: CVData }> = ({ data }) => {
  return (
    <div className="font-sans text-slate-800 h-full p-8 md:p-12 relative overflow-hidden flex flex-col">
      
      {/* Background Mesh Gradients */}
      <div className="absolute top-0 left-0 w-full h-full bg-slate-50 z-0"></div>
      <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-300 rounded-full blur-[100px] opacity-40 z-0 animate-pulse"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-300 rounded-full blur-[100px] opacity-40 z-0"></div>
      <div className="absolute top-[40%] left-[30%] w-[300px] h-[300px] bg-pink-300 rounded-full blur-[80px] opacity-30 z-0"></div>

      {/* Main Glass Card */}
      <div className="relative z-10 h-full bg-white/40 backdrop-blur-xl border border-white/60 rounded-[2rem] shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <header className="p-10 pb-6 flex items-center gap-8 border-b border-white/30">
            <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white/80 flex items-center justify-center bg-white/50 text-slate-400 text-4xl font-light">
                    {data.personal.photo ? (
                        <img src={data.personal.photo} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                        <span>{data.personal.fullName.charAt(0)}</span>
                    )}
                </div>
            </div>
            
            <div className="flex-1 text-slate-800">
                <h1 className="text-5xl font-bold tracking-tight mb-2 text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-600 flex items-center gap-3">
                    {data.personal.fullName}
                    {data.personal.verified && <ShieldCheck className="text-blue-500 w-8 h-8 drop-shadow-sm" />}
                </h1>
                <p className="text-xl font-medium text-purple-900/70 mb-4">{data.personal.role}</p>
                
                <div className="flex flex-wrap gap-4 text-sm font-medium text-slate-600/90">
                    {data.personal.email && <div className="flex items-center gap-2 bg-white/50 px-3 py-1 rounded-full"><Mail size={12}/> {data.personal.email}</div>}
                    {data.personal.phone && <div className="flex items-center gap-2 bg-white/50 px-3 py-1 rounded-full"><Phone size={12}/> {data.personal.phone}</div>}
                    {data.personal.location && <div className="flex items-center gap-2 bg-white/50 px-3 py-1 rounded-full"><MapPin size={12}/> {data.personal.location}</div>}
                </div>
            </div>
        </header>

        <div className="flex-1 p-10 grid grid-cols-12 gap-10 overflow-hidden">
            
            {/* Left Content */}
            <div className="col-span-8 space-y-10">
                
                {data.personal.summary && (
                    <section className="bg-white/30 p-6 rounded-2xl border border-white/40 shadow-sm">
                        <p className="text-slate-700 leading-relaxed font-medium">
                            {data.personal.summary}
                        </p>
                    </section>
                )}

                {data.experience.length > 0 && (
                    <section>
                        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-purple-500"></span> Experience
                        </h3>
                        <div className="space-y-6">
                            {data.experience.map(exp => (
                                <div key={exp.id} className="relative pl-6 border-l-2 border-purple-200/50">
                                    <div className="absolute -left-[5px] top-2 w-2 h-2 rounded-full bg-purple-400 ring-4 ring-white/50"></div>
                                    <div className="flex justify-between items-baseline mb-1">
                                        <h4 className="text-xl font-bold text-slate-800">{exp.role}</h4>
                                        <span className="text-xs font-bold text-purple-700 bg-purple-100/50 px-2 py-1 rounded-lg">
                                            {exp.startDate} - {exp.endDate}
                                        </span>
                                    </div>
                                    <div className="text-sm font-semibold text-slate-500 mb-2">{exp.company}</div>
                                    <p className="text-sm text-slate-600 leading-relaxed">
                                        {exp.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {data.projects.length > 0 && (
                    <section>
                        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-pink-500"></span> Projects
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            {data.projects.map(proj => (
                                <div key={proj.id} className="bg-white/40 p-4 rounded-xl border border-white/50 hover:bg-white/60 transition-colors">
                                    <div className="font-bold text-slate-800 mb-1 flex items-center gap-2">
                                        {proj.name}
                                        {proj.link && <ExternalLink size={12} className="text-slate-400"/>}
                                    </div>
                                    <p className="text-xs text-slate-600">{proj.description}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

            </div>

            {/* Sidebar Content */}
            <div className="col-span-4 space-y-8">
                
                {data.skills.length > 0 && (
                    <section className="bg-white/20 p-6 rounded-2xl border border-white/30 backdrop-blur-md">
                        <h3 className="text-sm font-bold uppercase text-slate-500 mb-4 tracking-wider">Skillset</h3>
                        <div className="flex flex-wrap gap-2">
                            {data.skills.map(s => (
                                <span key={s.id} className="bg-white/60 text-slate-700 px-3 py-1 rounded-lg text-xs font-bold shadow-sm border border-white/50">
                                    {s.name}
                                </span>
                            ))}
                        </div>
                    </section>
                )}

                {data.education.length > 0 && (
                    <section className="bg-white/20 p-6 rounded-2xl border border-white/30 backdrop-blur-md">
                        <h3 className="text-sm font-bold uppercase text-slate-500 mb-4 tracking-wider">Education</h3>
                        <div className="space-y-4">
                            {data.education.map(edu => (
                                <div key={edu.id}>
                                    <div className="font-bold text-slate-800 text-sm">{edu.institution}</div>
                                    <div className="text-xs text-purple-600 font-medium">{edu.degree}</div>
                                    <div className="text-[10px] text-slate-400 mt-1">{edu.endDate}</div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {data.personal.website && (
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 rounded-2xl text-white shadow-lg text-center">
                        <Globe className="w-6 h-6 mx-auto mb-2 opacity-80" />
                        <div className="text-xs font-bold opacity-90">{data.personal.website}</div>
                    </div>
                )}

            </div>

        </div>
      </div>
    </div>
  );
};