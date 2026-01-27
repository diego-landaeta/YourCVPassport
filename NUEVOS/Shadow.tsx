import React from 'react';
import { CVData } from '../types';
import { ExternalLink, Mail, MapPin, Phone } from '../components/ui/Icons';

export const ShadowTheme: React.FC<{ data: CVData }> = ({ data }) => {
  return (
    <div className="font-sans text-zinc-700 h-full bg-zinc-200 p-10 md:p-14 flex flex-col gap-6">
      
      {/* Floating Header Card */}
      <header className="bg-white p-8 rounded-2xl shadow-lg flex justify-between items-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-full bg-indigo-50 transform skew-x-12 translate-x-16"></div>
        
        <div className="relative z-10 flex items-center gap-6">
            <div className="w-20 h-20 rounded-xl overflow-hidden shadow-md ring-4 ring-zinc-50 flex items-center justify-center bg-zinc-100 text-zinc-300 font-bold text-2xl">
                {data.personal.photo ? (
                    <img src={data.personal.photo} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                    <span>{data.personal.fullName.charAt(0)}</span>
                )}
            </div>
            <div>
                <h1 className="text-3xl font-bold text-zinc-900 tracking-tight mb-1">
                {data.personal.fullName}
                </h1>
                <p className="text-indigo-600 font-medium">{data.personal.role}</p>
            </div>
        </div>

        <div className="relative z-10 text-right text-xs font-medium text-zinc-500 space-y-1">
             {data.personal.email && <div>{data.personal.email}</div>}
             {data.personal.phone && <div>{data.personal.phone}</div>}
             {data.personal.location && <div>{data.personal.location}</div>}
        </div>
      </header>

      <div className="flex gap-6 h-full">
          
          {/* Main Content Card */}
          <div className="flex-1 bg-white rounded-2xl shadow-lg p-8 flex flex-col gap-10">
              
               {/* Summary */}
                {data.personal.summary && (
                    <section>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">Profile</h3>
                        <p className="text-sm leading-6 text-zinc-600">
                            {data.personal.summary}
                        </p>
                    </section>
                )}

                {/* Experience */}
                {data.experience.length > 0 && (
                    <section>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-6">Experience</h3>
                        <div className="space-y-8">
                            {data.experience.map(exp => (
                                <div key={exp.id} className="relative pl-6 border-l-2 border-indigo-100">
                                    <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-indigo-500 ring-4 ring-white"></div>
                                    <div className="flex justify-between items-center mb-1">
                                        <h4 className="font-bold text-zinc-900">{exp.role}</h4>
                                        <span className="text-[10px] font-bold bg-zinc-100 px-2 py-1 rounded text-zinc-500">{exp.startDate} - {exp.endDate}</span>
                                    </div>
                                    <div className="text-xs text-indigo-500 font-bold uppercase mb-2">{exp.company}</div>
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
                        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-4">Projects</h3>
                        <div className="grid grid-cols-2 gap-4">
                            {data.projects.map(proj => (
                                <div key={proj.id} className="bg-zinc-50 p-4 rounded-xl border border-zinc-100 hover:shadow-md transition-shadow">
                                    <div className="font-bold text-zinc-900 text-sm mb-1">{proj.name}</div>
                                    <p className="text-xs text-zinc-500">{proj.description}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

          </div>

          {/* Sidebar Card */}
          <div className="w-1/3 flex flex-col gap-6">
              
              {/* Education Card */}
               {data.education.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-lg p-6">
                       <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-4">Education</h3>
                       <div className="space-y-4">
                           {data.education.map(edu => (
                               <div key={edu.id}>
                                   <div className="font-bold text-sm text-zinc-900">{edu.institution}</div>
                                   <div className="text-xs text-zinc-500">{edu.degree}</div>
                                   <div className="text-[10px] text-zinc-400 mt-1">{edu.endDate}</div>
                               </div>
                           ))}
                       </div>
                  </div>
              )}

              {/* Skills Card */}
              {data.skills.length > 0 && (
                  <div className="bg-indigo-600 rounded-2xl shadow-lg p-6 text-white flex-1">
                       <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-200 mb-4">Skills</h3>
                       <div className="flex flex-wrap gap-2">
                           {data.skills.map(skill => (
                               <span key={skill.id} className="bg-indigo-700 px-3 py-1.5 rounded-lg text-xs font-medium border border-indigo-500">
                                   {skill.name}
                               </span>
                           ))}
                       </div>
                  </div>
              )}
          </div>

      </div>
    </div>
  );
};