import React from 'react';
import { CVData } from '../types';
import { Mail, Phone, MapPin, Globe, ExternalLink } from '../components/ui/Icons';

export const FolioTheme: React.FC<{ data: CVData }> = ({ data }) => {
  return (
    <div className="font-sans text-zinc-800 h-full flex flex-row">
      
      {/* Sidebar (Wide, Stone Color) */}
      <aside className="w-[35%] bg-[#e7e5e4] p-10 flex flex-col gap-10 min-h-[297mm]">
        
        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-md mx-auto flex items-center justify-center bg-[#d6d3d1] text-zinc-500 text-3xl font-serif italic font-bold">
            {data.personal.photo ? (
                <img src={data.personal.photo} alt="Profile" className="w-full h-full object-cover" />
            ) : (
                <span>{data.personal.fullName.charAt(0)}</span>
            )}
        </div>

        <header>
            <h1 className="text-4xl font-serif font-black text-zinc-900 leading-none mb-4 text-center md:text-left">
                {data.personal.fullName}
            </h1>
            <p className="text-sm font-bold uppercase tracking-widest text-zinc-500 border-t border-zinc-400 pt-4 text-center md:text-left">
                {data.personal.role}
            </p>
        </header>

        {/* Contact Grid */}
        <div className="grid grid-cols-1 gap-4 text-xs font-medium text-zinc-700">
             {data.personal.email && (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white flex items-center justify-center rounded-full shadow-sm"><Mail size={12} /></div>
                    <span className="break-all">{data.personal.email}</span>
                </div>
            )}
            {data.personal.phone && (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white flex items-center justify-center rounded-full shadow-sm"><Phone size={12} /></div>
                    <span>{data.personal.phone}</span>
                </div>
            )}
            {data.personal.location && (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white flex items-center justify-center rounded-full shadow-sm"><MapPin size={12} /></div>
                    <span>{data.personal.location}</span>
                </div>
            )}
            {data.personal.website && (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white flex items-center justify-center rounded-full shadow-sm"><Globe size={12} /></div>
                    <span className="break-all">{data.personal.website}</span>
                </div>
            )}
        </div>

         {/* Education */}
         {data.education.length > 0 && (
            <section>
                <h3 className="font-bold text-sm text-zinc-900 uppercase tracking-wider mb-6">Education</h3>
                <div className="space-y-6">
                    {data.education.map((edu) => (
                    <div key={edu.id} className="bg-white/50 p-4 rounded-lg">
                        <h4 className="font-bold text-zinc-900 text-sm">{edu.institution}</h4>
                        <div className="text-xs text-zinc-600 mt-1">{edu.degree}</div>
                        <div className="text-[10px] text-zinc-400 mt-2 uppercase font-bold">{edu.endDate}</div>
                    </div>
                    ))}
                </div>
            </section>
        )}

        {/* Skills */}
        {data.skills.length > 0 && (
            <section>
                 <h3 className="font-bold text-sm text-zinc-900 uppercase tracking-wider mb-4">Expertise</h3>
                 <div className="flex flex-wrap gap-2">
                    {data.skills.map((skill) => (
                        <span key={skill.id} className="bg-white px-3 py-1 text-xs font-medium rounded-sm shadow-sm text-zinc-700">
                            {skill.name}
                        </span>
                    ))}
                 </div>
            </section>
        )}

      </aside>


      {/* Main Content (White, Structured) */}
      <main className="flex-1 p-10 md:p-14 bg-white relative">
        
        {/* Profile */}
        {data.personal.summary && (
            <section className="mb-14">
                <p className="text-lg text-zinc-600 font-serif leading-8 italic">
                    "{data.personal.summary}"
                </p>
            </section>
        )}

        {/* Experience Timeline */}
        {data.experience.length > 0 && (
            <section className="mb-14 relative">
                <h2 className="text-xl font-black text-zinc-900 mb-8 flex items-center gap-3">
                    <BriefcaseIcon /> Professional Experience
                </h2>
                
                <div className="space-y-0 relative border-l-2 border-zinc-100 ml-3">
                    {data.experience.map((exp) => (
                        <div key={exp.id} className="relative pl-10 pb-10 last:pb-0">
                            {/* Dot */}
                            <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-zinc-800 border-4 border-white shadow-sm"></div>
                            
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline mb-2">
                                <h3 className="font-bold text-lg text-zinc-900">{exp.role}</h3>
                                <span className="text-xs font-bold bg-zinc-100 px-2 py-1 rounded text-zinc-500 whitespace-nowrap">
                                    {exp.startDate} - {exp.endDate}
                                </span>
                            </div>
                            
                            <div className="text-sm font-bold text-zinc-500 mb-3 uppercase tracking-wide">{exp.company}</div>
                            
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
                <h2 className="text-xl font-black text-zinc-900 mb-6 flex items-center gap-3">
                    <FolderIcon /> Selected Projects
                </h2>
                <div className="grid grid-cols-1 gap-0 divide-y divide-zinc-100">
                    {data.projects.map((proj) => (
                        <div key={proj.id} className="py-4 first:pt-0">
                             <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-bold text-zinc-800">{proj.name}</h4>
                                {proj.link && <a href={proj.link} className="text-zinc-400 hover:text-zinc-800"><ExternalLink size={14}/></a>}
                             </div>
                             <p className="text-sm text-zinc-500">
                                {proj.description}
                            </p>
                        </div>
                    ))}
                </div>
            </section>
        )}

      </main>
    </div>
  );
};

// Internal icons for this component to keep it self-contained if needed, or stick to LUCIDE
const BriefcaseIcon = () => (
    <div className="w-8 h-8 bg-zinc-900 text-white flex items-center justify-center rounded-lg">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
    </div>
)

const FolderIcon = () => (
    <div className="w-8 h-8 bg-zinc-100 text-zinc-900 flex items-center justify-center rounded-lg">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>
    </div>
)