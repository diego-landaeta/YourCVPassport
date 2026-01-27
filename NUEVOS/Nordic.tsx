import React from 'react';
import { CVData } from '../types';
import { Mail, Phone, MapPin, Globe } from '../components/ui/Icons';

export const NordicTheme: React.FC<{ data: CVData }> = ({ data }) => {
  return (
    <div className="font-sans text-slate-700 h-full bg-white p-8 md:p-12 flex flex-col gap-8">
      
      {/* Soft Header */}
      <header className="bg-indigo-50 rounded-[2rem] p-10 text-center relative overflow-hidden flex flex-col items-center">
        {/* Soft Blobs */}
        <div className="absolute top-[-50px] left-[-50px] w-40 h-40 bg-indigo-100 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute bottom-[-50px] right-[-50px] w-40 h-40 bg-rose-100 rounded-full blur-3xl opacity-50"></div>

        <div className="relative z-10 w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-sm mb-4 flex items-center justify-center bg-indigo-100 text-indigo-400 text-3xl font-light">
            {data.personal.photo ? (
                <img src={data.personal.photo} alt="Profile" className="w-full h-full object-cover" />
            ) : (
                <span>{data.personal.fullName.charAt(0)}</span>
            )}
        </div>

        <h1 className="relative z-10 text-4xl md:text-5xl font-bold text-slate-800 tracking-tight mb-3">
            {data.personal.fullName}
        </h1>
        <p className="relative z-10 text-lg text-indigo-500 font-medium bg-white/60 inline-block px-4 py-1 rounded-full backdrop-blur-sm">
            {data.personal.role}
        </p>
        
        <div className="relative z-10 mt-6 flex flex-wrap justify-center gap-4 text-xs font-bold text-slate-500">
             {data.personal.email && (
                 <div className="flex items-center gap-1 bg-white px-3 py-1.5 rounded-full shadow-sm">
                    <Mail size={12} className="text-indigo-400"/> {data.personal.email}
                 </div>
             )}
             {data.personal.phone && (
                 <div className="flex items-center gap-1 bg-white px-3 py-1.5 rounded-full shadow-sm">
                    <Phone size={12} className="text-indigo-400"/> {data.personal.phone}
                 </div>
             )}
              {data.personal.location && (
                 <div className="flex items-center gap-1 bg-white px-3 py-1.5 rounded-full shadow-sm">
                    <MapPin size={12} className="text-indigo-400"/> {data.personal.location}
                 </div>
             )}
        </div>
      </header>

      <div className="grid grid-cols-12 gap-8 flex-1">
        
        {/* Left Sidebar */}
        <div className="col-span-12 md:col-span-4 space-y-6">
            
            {/* Skills (Pill badges) */}
             {data.skills.length > 0 && (
                <div className="bg-slate-50 rounded-3xl p-6">
                    <h3 className="text-sm font-bold text-slate-800 mb-4 ml-1">My Skills</h3>
                    <div className="flex flex-wrap gap-2">
                        {data.skills.map((skill) => (
                            <span key={skill.id} className="bg-white text-slate-600 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-sm border border-slate-100">
                                {skill.name}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Education */}
            {data.education.length > 0 && (
                <div className="bg-rose-50 rounded-3xl p-6">
                    <h3 className="text-sm font-bold text-rose-800 mb-4 ml-1">Education</h3>
                    <div className="space-y-4">
                        {data.education.map((edu) => (
                            <div key={edu.id} className="bg-white/60 p-3 rounded-2xl">
                                <div className="font-bold text-sm text-slate-800">{edu.institution}</div>
                                <div className="text-xs text-rose-500 font-medium">{edu.degree}</div>
                                <div className="text-[10px] text-slate-400 mt-1">{edu.endDate}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

        </div>

        {/* Main Content */}
        <div className="col-span-12 md:col-span-8 space-y-8">
            
            {/* Summary */}
            {data.personal.summary && (
                <section>
                    <h3 className="text-sm font-bold text-slate-800 mb-3 ml-2">About Me</h3>
                    <p className="text-sm text-slate-500 leading-7 bg-white border border-slate-100 p-6 rounded-3xl shadow-sm">
                        {data.personal.summary}
                    </p>
                </section>
            )}

            {/* Experience */}
             {data.experience.length > 0 && (
                <section>
                    <h3 className="text-sm font-bold text-slate-800 mb-4 ml-2">Experience</h3>
                    <div className="space-y-4">
                        {data.experience.map((exp) => (
                            <div key={exp.id} className="group bg-slate-50 hover:bg-indigo-50/50 transition-colors p-6 rounded-[1.5rem] border border-transparent hover:border-indigo-100">
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="font-bold text-slate-800 text-lg">{exp.role}</h4>
                                    <span className="text-xs font-bold text-white bg-slate-800 px-3 py-1 rounded-full">
                                        {exp.startDate} - {exp.endDate}
                                    </span>
                                </div>
                                <div className="text-sm font-bold text-indigo-500 mb-3">{exp.company}</div>
                                <p className="text-sm text-slate-600 leading-relaxed">
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
                    <h3 className="text-sm font-bold text-slate-800 mb-4 ml-2">Projects</h3>
                    <div className="grid grid-cols-2 gap-4">
                        {data.projects.map((proj) => (
                            <div key={proj.id} className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm">
                                <div className="font-bold text-slate-800 text-sm mb-1">{proj.name}</div>
                                <p className="text-xs text-slate-500">{proj.description}</p>
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