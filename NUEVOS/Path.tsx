import React from 'react';
import { CVData } from '../types';
import { ExternalLink, Globe, Mail, MapPin, Phone } from '../components/ui/Icons';

export const PathTheme: React.FC<{ data: CVData }> = ({ data }) => {
  return (
    <div className="font-sans text-slate-600 h-full bg-slate-50 relative">
      
      {/* Sidebar / Header Combo */}
      <div className="absolute left-0 top-0 bottom-0 w-1/3 bg-slate-800 text-slate-300 p-8 flex flex-col justify-between">
          <div>
              <div className="flex flex-col gap-6">
                <div className="w-24 h-24 bg-slate-700 rounded-full border-4 border-teal-500 overflow-hidden flex items-center justify-center text-teal-500 text-3xl font-bold">
                    {data.personal.photo ? (
                        <img src={data.personal.photo} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                        <span>{data.personal.fullName.charAt(0)}</span>
                    )}
                </div>
                <div>
                    <div className="w-20 h-1 bg-teal-400 mb-4"></div>
                    <h1 className="text-4xl font-bold text-white mb-2 leading-tight">
                        {data.personal.fullName}
                    </h1>
                    <p className="text-teal-400 font-medium text-lg mb-8">{data.personal.role}</p>
                </div>
              </div>
              
              <div className="space-y-6 text-sm">
                  {data.personal.summary && (
                      <p className="leading-6 text-slate-400">{data.personal.summary}</p>
                  )}
                  
                  {/* Contact */}
                  <div className="space-y-2 pt-6 border-t border-slate-700">
                    {data.personal.email && <div className="flex items-center gap-3"><Mail size={14} /> {data.personal.email}</div>}
                    {data.personal.phone && <div className="flex items-center gap-3"><Phone size={14} /> {data.personal.phone}</div>}
                    {data.personal.location && <div className="flex items-center gap-3"><MapPin size={14} /> {data.personal.location}</div>}
                    {data.personal.website && <div className="flex items-center gap-3"><Globe size={14} /> {data.personal.website}</div>}
                  </div>
              </div>
          </div>

          {/* Skills at Bottom Left */}
          {data.skills.length > 0 && (
            <div className="mt-8">
                <h3 className="text-white font-bold uppercase tracking-widest text-xs mb-4">Skillset</h3>
                <div className="flex flex-wrap gap-2">
                    {data.skills.map(s => (
                        <span key={s.id} className="bg-slate-700 text-white text-xs px-2 py-1 rounded">
                            {s.name}
                        </span>
                    ))}
                </div>
            </div>
          )}
      </div>

      {/* Main Content: Timeline */}
      <div className="absolute right-0 top-0 bottom-0 w-2/3 p-10 overflow-hidden">
          
          <div className="h-full relative pl-8 border-l-2 border-slate-200 space-y-12">
              
              {/* Experience Nodes */}
              {data.experience.length > 0 && (
                  <section>
                      <h3 className="font-bold text-slate-900 uppercase tracking-widest mb-6 -ml-12 flex items-center gap-4">
                           <span className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center text-white text-xs font-bold">01</span>
                           Experience
                      </h3>
                      <div className="space-y-10">
                          {data.experience.map(exp => (
                              <div key={exp.id} className="relative group">
                                  {/* Timeline Dot */}
                                  <div className="absolute -left-[41px] top-1.5 w-4 h-4 rounded-full bg-white border-4 border-teal-400 group-hover:scale-125 transition-transform"></div>
                                  
                                  <div className="flex justify-between items-baseline mb-1">
                                      <h4 className="font-bold text-slate-800 text-lg">{exp.role}</h4>
                                      <span className="text-xs font-medium text-teal-600 bg-teal-50 px-2 py-1 rounded">{exp.startDate} - {exp.endDate}</span>
                                  </div>
                                  <div className="text-sm font-bold text-slate-400 mb-2 uppercase">{exp.company}</div>
                                  <p className="text-sm leading-6">
                                      {exp.description}
                                  </p>
                              </div>
                          ))}
                      </div>
                  </section>
              )}

              {/* Projects Nodes */}
               {data.projects.length > 0 && (
                  <section className="pt-8">
                      <h3 className="font-bold text-slate-900 uppercase tracking-widest mb-6 -ml-12 flex items-center gap-4">
                           <span className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center text-white text-xs font-bold">02</span>
                           Projects
                      </h3>
                      <div className="grid grid-cols-1 gap-6">
                          {data.projects.map(proj => (
                              <div key={proj.id} className="relative">
                                  <div className="absolute -left-[41px] top-1.5 w-4 h-4 rounded-full bg-slate-300"></div>
                                  <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                                      {proj.name}
                                      {proj.link && <ExternalLink size={12} className="text-slate-400"/>}
                                  </h4>
                                  <p className="text-xs mt-1 text-slate-500">{proj.description}</p>
                              </div>
                          ))}
                      </div>
                  </section>
              )}

              {/* Education Nodes */}
               {data.education.length > 0 && (
                  <section className="pt-8">
                      <h3 className="font-bold text-slate-900 uppercase tracking-widest mb-6 -ml-12 flex items-center gap-4">
                           <span className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center text-white text-xs font-bold">03</span>
                           Education
                      </h3>
                      <div className="space-y-6">
                          {data.education.map(edu => (
                              <div key={edu.id} className="relative">
                                  <div className="absolute -left-[41px] top-1.5 w-4 h-4 rounded-full bg-slate-300"></div>
                                  <h4 className="font-bold text-slate-800 text-sm">{edu.institution}</h4>
                                  <div className="text-xs text-teal-600 font-medium">{edu.degree}</div>
                                  <div className="text-[10px] text-slate-400 mt-1">{edu.endDate}</div>
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