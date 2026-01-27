import React from 'react';
import { CVData } from '../types';
import { ExternalLink, Mail, MapPin, Phone, Globe } from '../components/ui/Icons';

export const VibrantTheme: React.FC<{ data: CVData }> = ({ data }) => {
  return (
    <div className="font-sans text-zinc-900 h-full bg-white flex flex-col">
      
      {/* Heavy Header Block */}
      <header className="bg-yellow-400 p-10 md:p-14 text-zinc-900 relative overflow-hidden">
        {/* Decorative Circle */}
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-yellow-300 rounded-full blur-2xl opacity-50"></div>
        
        <div className="relative z-10 flex justify-between items-start">
            <div>
                <h1 className="text-5xl md:text-6xl font-black tracking-tighter uppercase mb-4 leading-none">
                {data.personal.fullName}
                </h1>
                <div className="inline-block bg-zinc-900 text-yellow-400 font-bold uppercase tracking-widest text-sm px-4 py-1.5 transform -skew-x-12">
                    <span className="block transform skew-x-12">{data.personal.role}</span>
                </div>
            </div>
            
            <div className="w-32 h-32 rounded-full border-4 border-zinc-900 overflow-hidden shadow-xl transform rotate-3 flex-shrink-0 bg-white flex items-center justify-center text-zinc-900 font-black text-4xl">
                {data.personal.photo ? (
                    <img src={data.personal.photo} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                    <span>{data.personal.fullName.charAt(0)}</span>
                )}
            </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-6 text-sm font-bold text-zinc-800">
             {data.personal.email && (
                <div className="flex items-center gap-2 border-b-2 border-zinc-900 pb-0.5">
                    <Mail size={14} /> {data.personal.email}
                </div>
            )}
             {data.personal.phone && (
                <div className="flex items-center gap-2 border-b-2 border-zinc-900 pb-0.5">
                    <Phone size={14} /> {data.personal.phone}
                </div>
            )}
            {data.personal.website && (
                <div className="flex items-center gap-2 border-b-2 border-zinc-900 pb-0.5">
                    <Globe size={14} /> {data.personal.website}
                </div>
            )}
        </div>
      </header>

      <div className="flex-1 p-10 md:p-14 grid grid-cols-12 gap-10">
        
        {/* Left Column (Main) */}
        <div className="col-span-12 md:col-span-7 space-y-10">
            
            {/* Summary */}
            {data.personal.summary && (
                <section>
                     <p className="text-lg font-medium leading-relaxed text-zinc-800">
                        {data.personal.summary}
                    </p>
                </section>
            )}

            {/* Experience */}
            {data.experience.length > 0 && (
                <section>
                    <h2 className="text-2xl font-black uppercase text-zinc-900 mb-6 flex items-center gap-3">
                        <span className="w-4 h-4 bg-yellow-400 rounded-sm"></span> Experience
                    </h2>
                    <div className="space-y-8 border-l-4 border-zinc-100 pl-6 ml-2">
                        {data.experience.map((exp) => (
                        <div key={exp.id} className="relative">
                             <div className="absolute -left-[34px] top-1.5 w-4 h-4 bg-zinc-200 rounded-full border-4 border-white"></div>
                            <h3 className="text-xl font-bold text-zinc-900">{exp.role}</h3>
                            <div className="text-sm font-bold text-zinc-500 uppercase tracking-wide mb-2">
                                {exp.company} <span className="text-yellow-500 mx-1">•</span> {exp.startDate} — {exp.current ? 'Present' : exp.endDate}
                            </div>
                            <p className="text-zinc-700 leading-relaxed">
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
                    <h2 className="text-2xl font-black uppercase text-zinc-900 mb-6 flex items-center gap-3">
                        <span className="w-4 h-4 bg-yellow-400 rounded-sm"></span> Projects
                    </h2>
                    <div className="grid grid-cols-1 gap-4">
                        {data.projects.map((proj) => (
                        <div key={proj.id} className="bg-zinc-50 p-5 rounded-lg border border-zinc-100 hover:border-yellow-400 transition-colors">
                             <div className="flex justify-between items-start mb-2">
                                <h4 className="font-bold text-zinc-900">{proj.name}</h4>
                                {proj.link && <ExternalLink size={14} className="text-zinc-400"/>}
                             </div>
                            <p className="text-sm text-zinc-600">
                                {proj.description}
                            </p>
                        </div>
                        ))}
                    </div>
                </section>
            )}

        </div>

        {/* Right Column (Sidebar) */}
        <div className="col-span-12 md:col-span-5 space-y-10 pl-0 md:pl-4">
            
            {/* Skills */}
             {data.skills.length > 0 && (
                <section className="bg-zinc-900 text-white p-6 rounded-2xl shadow-xl transform rotate-1 hover:rotate-0 transition-transform">
                    <h2 className="text-xl font-black uppercase text-yellow-400 mb-6">Skillset</h2>
                    <div className="flex flex-wrap gap-2">
                        {data.skills.map((skill) => (
                        <span key={skill.id} className="px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm font-bold tracking-wide">
                            {skill.name}
                        </span>
                        ))}
                    </div>
                </section>
            )}

             {/* Education */}
             {data.education.length > 0 && (
                <section>
                    <h2 className="text-xl font-black uppercase text-zinc-900 mb-6 border-b-4 border-yellow-400 inline-block pb-1">Education</h2>
                    <div className="space-y-6">
                        {data.education.map((edu) => (
                        <div key={edu.id}>
                            <h4 className="font-bold text-lg text-zinc-900">{edu.institution}</h4>
                            <div className="text-zinc-600 font-medium">{edu.degree}</div>
                            <div className="text-xs text-zinc-400 mt-1 uppercase font-bold tracking-wider">{edu.endDate} • {edu.location}</div>
                        </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Info Box */}
            {data.personal.location && (
                <div className="bg-yellow-50 p-6 rounded-xl border-2 border-yellow-400/20 text-center">
                    <MapPin className="w-6 h-6 mx-auto text-yellow-500 mb-2" />
                    <span className="font-bold text-zinc-800">{data.personal.location}</span>
                </div>
            )}

        </div>

      </div>
    </div>
  );
};