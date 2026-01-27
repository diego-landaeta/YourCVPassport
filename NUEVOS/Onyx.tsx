import React from 'react';
import { CVData } from '../types';
import { ExternalLink, Globe, Mail, MapPin, Phone } from '../components/ui/Icons';

export const OnyxTheme: React.FC<{ data: CVData }> = ({ data }) => {
  return (
    <div className="font-sans text-zinc-900 h-full bg-zinc-100 flex flex-row">
      
      {/* Sidebar (Dark) */}
      <aside className="w-[30%] bg-zinc-900 text-zinc-300 p-8 flex flex-col gap-10 min-h-[297mm]">
        
        {/* Avatar Placeholder / Initials */}
        <div className="w-24 h-24 bg-zinc-800 rounded-full flex items-center justify-center border-4 border-zinc-700 mt-4 overflow-hidden mx-auto">
            {data.personal.photo ? (
                <img src={data.personal.photo} className="w-full h-full object-cover" alt="Profile" />
            ) : (
                <span className="text-3xl font-bold text-white tracking-widest">
                    {data.personal.fullName.split(' ').map(n => n[0]).join('').substring(0,2)}
                </span>
            )}
        </div>

        {/* Contact */}
        <div className="space-y-4 text-xs font-medium">
            <div className="uppercase tracking-widest text-zinc-500 text-[10px] mb-2 font-bold">Connect</div>
            {data.personal.email && (
                <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-zinc-800 rounded"><Mail size={10} /></div>
                    <span className="break-all">{data.personal.email}</span>
                </div>
            )}
            {data.personal.phone && (
                <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-zinc-800 rounded"><Phone size={10} /></div>
                    <span>{data.personal.phone}</span>
                </div>
            )}
            {data.personal.location && (
                <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-zinc-800 rounded"><MapPin size={10} /></div>
                    <span>{data.personal.location}</span>
                </div>
            )}
             {data.personal.website && (
                <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-zinc-800 rounded"><Globe size={10} /></div>
                    <span className="break-all">{data.personal.website}</span>
                </div>
            )}
        </div>

        {/* Education */}
        {data.education.length > 0 && (
            <div>
                 <div className="uppercase tracking-widest text-zinc-500 text-[10px] mb-4 font-bold">Education</div>
                 <div className="space-y-6">
                    {data.education.map(edu => (
                        <div key={edu.id}>
                            <div className="text-white font-bold text-sm">{edu.institution}</div>
                            <div className="text-xs text-zinc-400">{edu.degree}</div>
                            <div className="text-[10px] text-zinc-500 mt-1">{edu.endDate}</div>
                        </div>
                    ))}
                 </div>
            </div>
        )}

        {/* Skills */}
        {data.skills.length > 0 && (
            <div>
                 <div className="uppercase tracking-widest text-zinc-500 text-[10px] mb-4 font-bold">Expertise</div>
                 <div className="space-y-2">
                    {data.skills.map(skill => (
                        <div key={skill.id} className="flex justify-between items-center text-sm">
                            <span>{skill.name}</span>
                            <div className="w-12 h-1 bg-zinc-800 rounded-full overflow-hidden">
                                <div className="h-full bg-zinc-500 w-[80%]"></div>
                            </div>
                        </div>
                    ))}
                 </div>
            </div>
        )}

      </aside>


      {/* Main Content (Light) */}
      <main className="flex-1 p-10 md:p-14 bg-white">
        
        {/* Header */}
        <header className="mb-12 border-b-2 border-zinc-900 pb-8">
            <h1 className="text-5xl font-bold text-zinc-900 tracking-tight uppercase leading-[0.9] mb-2">
                {data.personal.fullName}
            </h1>
            <p className="text-xl text-zinc-500 font-medium tracking-wide">{data.personal.role}</p>
        </header>

        {/* Profile */}
        {data.personal.summary && (
            <section className="mb-12">
                <h3 className="font-bold text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 bg-zinc-900"></span> Profile
                </h3>
                <p className="text-sm leading-7 text-zinc-600">
                    {data.personal.summary}
                </p>
            </section>
        )}

        {/* Experience */}
        {data.experience.length > 0 && (
             <section className="mb-12">
                <h3 className="font-bold text-sm uppercase tracking-widest mb-6 flex items-center gap-2">
                    <span className="w-2 h-2 bg-zinc-900"></span> Experience
                </h3>
                <div className="space-y-10">
                    {data.experience.map(exp => (
                        <div key={exp.id} className="group">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h4 className="text-lg font-bold text-zinc-900">{exp.role}</h4>
                                    <div className="text-sm font-semibold text-zinc-500">{exp.company}</div>
                                </div>
                                <div className="text-xs font-bold bg-zinc-100 px-3 py-1 rounded text-zinc-600">
                                    {exp.startDate} — {exp.endDate}
                                </div>
                            </div>
                            <p className="text-sm text-zinc-600 leading-relaxed">
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
                <h3 className="font-bold text-sm uppercase tracking-widest mb-6 flex items-center gap-2">
                    <span className="w-2 h-2 bg-zinc-900"></span> Projects
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data.projects.map(proj => (
                        <div key={proj.id} className="border border-zinc-200 p-4 hover:bg-zinc-50 transition-colors">
                            <div className="font-bold text-zinc-900 mb-1 flex items-center gap-2">
                                {proj.name}
                                {proj.link && <ExternalLink size={12} className="text-zinc-400" />}
                            </div>
                            <p className="text-xs text-zinc-500 leading-5">{proj.description}</p>
                        </div>
                    ))}
                </div>
            </section>
        )}

      </main>
    </div>
  );
};