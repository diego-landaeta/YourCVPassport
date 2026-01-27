import React from 'react';
import { CVData } from '../types';
import { Mail, Phone, MapPin, ExternalLink } from '../components/ui/Icons';

export const BotanicalTheme: React.FC<{ data: CVData }> = ({ data }) => {
  return (
    <div className="font-serif text-stone-800 h-full bg-[#f7f9f5] p-0 flex flex-col relative overflow-hidden">
      
      {/* Organic Background Shapes */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[30%] bg-[#e2e8de] rounded-full blur-3xl opacity-60"></div>
      <div className="absolute bottom-[-5%] left-[-5%] w-[40%] h-[40%] bg-[#dce4d9] rounded-full blur-3xl opacity-60"></div>

      {/* Header */}
      <header className="relative z-10 p-12 pb-6 text-center flex flex-col items-center">
        <div className="w-32 h-32 rounded-[2rem] overflow-hidden border-4 border-white shadow-sm mb-4 flex items-center justify-center bg-[#e2e8de] text-[#8f9f8f] text-3xl font-light">
            {data.personal.photo ? (
                <img src={data.personal.photo} alt="Profile" className="w-full h-full object-cover" />
            ) : (
                <span>{data.personal.fullName.charAt(0)}</span>
            )}
        </div>
        <h1 className="text-5xl font-normal text-[#2f4f2f] mb-3 tracking-wide">
          {data.personal.fullName}
        </h1>
        <div className="flex justify-center items-center gap-4">
             <div className="h-px w-8 bg-[#8f9f8f]"></div>
             <p className="text-lg text-[#5f6f5f] font-light italic">{data.personal.role}</p>
             <div className="h-px w-8 bg-[#8f9f8f]"></div>
        </div>
        
        <div className="flex justify-center gap-6 mt-6 text-sm text-[#4a5a4a] font-sans">
             {data.personal.email && (
                <div className="flex items-center gap-1"><Mail size={12}/> {data.personal.email}</div>
             )}
             {data.personal.phone && (
                <div className="flex items-center gap-1"><Phone size={12}/> {data.personal.phone}</div>
             )}
             {data.personal.location && (
                <div className="flex items-center gap-1"><MapPin size={12}/> {data.personal.location}</div>
             )}
        </div>
      </header>

      <div className="flex-1 relative z-10 p-12 pt-4 grid grid-cols-12 gap-10">
        
        {/* Left Column (Main) */}
        <div className="col-span-8 space-y-10">
            
            {/* Summary */}
            {data.personal.summary && (
                <div className="bg-white/60 p-6 rounded-2xl backdrop-blur-sm border border-white shadow-sm">
                    <p className="text-[#3a4a3a] leading-relaxed font-light text-justify">
                        {data.personal.summary}
                    </p>
                </div>
            )}

            {/* Experience */}
             {data.experience.length > 0 && (
                <section>
                    <h2 className="text-2xl text-[#2f4f2f] mb-6 flex items-center gap-3 font-normal">
                        Experience
                        <span className="flex-1 h-px bg-[#ccd5cc]"></span>
                    </h2>
                    <div className="space-y-8">
                        {data.experience.map(exp => (
                            <div key={exp.id} className="relative pl-6 border-l border-[#8f9f8f]">
                                <div className="absolute -left-[5px] top-2 w-2.5 h-2.5 rounded-full bg-[#8f9f8f] border-2 border-[#f7f9f5]"></div>
                                <h3 className="text-xl font-medium text-[#2a3a2a]">{exp.role}</h3>
                                <div className="flex justify-between items-center mb-2 mt-1">
                                    <span className="text-sm font-bold text-[#5f6f5f] uppercase tracking-wider font-sans">{exp.company}</span>
                                    <span className="text-xs text-[#7f8f7f] font-sans bg-[#e9efe8] px-2 py-1 rounded-full">{exp.startDate} — {exp.endDate}</span>
                                </div>
                                <p className="text-sm text-[#4a5a4a] leading-6 font-sans">
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
                    <h2 className="text-2xl text-[#2f4f2f] mb-6 flex items-center gap-3 font-normal">
                        Projects
                        <span className="flex-1 h-px bg-[#ccd5cc]"></span>
                    </h2>
                     <div className="grid grid-cols-2 gap-4">
                        {data.projects.map(proj => (
                            <div key={proj.id} className="bg-[#f0f4ee] p-4 rounded-xl hover:bg-[#e8ece6] transition-colors">
                                <div className="font-medium text-[#2f4f2f] mb-1 flex items-center gap-2">
                                    {proj.name}
                                    {proj.link && <ExternalLink size={12} className="text-[#8f9f8f]"/>}
                                </div>
                                <p className="text-xs text-[#5f6f5f] font-sans">{proj.description}</p>
                            </div>
                        ))}
                    </div>
                </section>
            )}

        </div>

        {/* Right Column (Sidebar) */}
        <div className="col-span-4 space-y-10">
            
            {/* Skills */}
             {data.skills.length > 0 && (
                <section className="bg-[#e2e8de]/50 p-6 rounded-[2rem] text-center">
                    <h2 className="text-lg text-[#2f4f2f] mb-4 font-normal uppercase tracking-widest text-sm">Skills</h2>
                    <div className="flex flex-wrap justify-center gap-2">
                        {data.skills.map(skill => (
                            <span key={skill.id} className="bg-white text-[#4a5a4a] px-3 py-1.5 rounded-full text-xs font-sans shadow-sm border border-[#dce4d9]">
                                {skill.name}
                            </span>
                        ))}
                    </div>
                </section>
            )}

             {/* Education */}
             {data.education.length > 0 && (
                <section>
                     <h2 className="text-lg text-[#2f4f2f] mb-4 font-normal uppercase tracking-widest text-sm text-center">Education</h2>
                     <div className="space-y-6">
                        {data.education.map(edu => (
                            <div key={edu.id} className="text-center">
                                <div className="font-medium text-[#2a3a2a] text-lg">{edu.institution}</div>
                                <div className="text-sm text-[#5f6f5f] italic">{edu.degree}</div>
                                <div className="text-xs text-[#8f9f8f] mt-1 font-sans">{edu.endDate}</div>
                            </div>
                        ))}
                     </div>
                </section>
            )}

        </div>
      </div>
    </div>
  );
};