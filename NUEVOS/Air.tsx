import React from 'react';
import { CVData } from '../types';
import { ExternalLink } from '../components/ui/Icons';

export const AirTheme: React.FC<{ data: CVData }> = ({ data }) => {
  return (
    <div className="font-sans text-slate-800 h-full bg-white p-12 md:p-16 relative overflow-hidden flex flex-col">
      
      {/* Abstract Background Orbs */}
      <div className="absolute top-[-10%] left-[10%] w-[500px] h-[500px] bg-rose-200 rounded-full blur-[120px] opacity-40 pointer-events-none mix-blend-multiply"></div>
      <div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] bg-blue-200 rounded-full blur-[100px] opacity-40 pointer-events-none mix-blend-multiply"></div>
      <div className="absolute top-[40%] right-[20%] w-[300px] h-[300px] bg-amber-100 rounded-full blur-[80px] opacity-60 pointer-events-none mix-blend-multiply"></div>

      {/* Content Container */}
      <div className="relative z-10 flex-1 flex flex-col">
          
          <header className="text-center mb-16 space-y-6">
              <h1 className="text-6xl md:text-7xl font-thin tracking-tighter text-slate-900 leading-none">
                  {data.personal.fullName}
              </h1>
              <p className="text-xl font-light text-slate-500 tracking-[0.2em] uppercase">
                  {data.personal.role}
              </p>
              
              <div className="flex justify-center gap-8 text-sm font-medium text-slate-400 mt-4">
                  {data.personal.email && <span className="hover:text-slate-600 transition-colors cursor-pointer">{data.personal.email}</span>}
                  {data.personal.website && <span className="hover:text-slate-600 transition-colors cursor-pointer">{data.personal.website}</span>}
              </div>
          </header>

          <div className="grid grid-cols-12 gap-16 flex-1">
              
              {/* Left Side: Summary & Education */}
              <div className="col-span-12 md:col-span-4 space-y-16 text-right border-r border-slate-100 pr-16">
                  
                  {data.personal.summary && (
                      <section>
                          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-[0.2em] mb-6">Manifesto</h3>
                          <p className="text-lg leading-8 font-light text-slate-600">
                              {data.personal.summary}
                          </p>
                      </section>
                  )}

                  {data.education.length > 0 && (
                      <section>
                          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-[0.2em] mb-6">Learning</h3>
                          <div className="space-y-8">
                              {data.education.map(edu => (
                                  <div key={edu.id}>
                                      <div className="font-normal text-slate-800 text-lg">{edu.institution}</div>
                                      <div className="text-sm font-light text-slate-500 italic">{edu.degree}</div>
                                      <div className="text-xs text-slate-300 mt-1">{edu.endDate}</div>
                                  </div>
                              ))}
                          </div>
                      </section>
                  )}

                  {data.skills.length > 0 && (
                      <section>
                          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-[0.2em] mb-6">Elements</h3>
                          <div className="flex flex-wrap justify-end gap-3">
                              {data.skills.map(s => (
                                  <span key={s.id} className="text-sm font-light text-slate-600 border border-slate-200 px-3 py-1 rounded-full bg-white/50 backdrop-blur-sm">
                                      {s.name}
                                  </span>
                              ))}
                          </div>
                      </section>
                  )}

              </div>

              {/* Right Side: Experience */}
              <div className="col-span-12 md:col-span-8 space-y-16">
                  
                  {data.experience.length > 0 && (
                      <section>
                          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-[0.2em] mb-10">Journey</h3>
                          <div className="space-y-12">
                              {data.experience.map(exp => (
                                  <div key={exp.id} className="relative group">
                                      <div className="absolute -left-6 top-2 w-1 h-1 bg-slate-300 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                      <h4 className="text-2xl font-light text-slate-900 mb-1">{exp.role}</h4>
                                      <div className="flex items-center gap-4 text-sm font-medium text-slate-400 mb-4 uppercase tracking-wide">
                                          <span>{exp.company}</span>
                                          <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                                          <span>{exp.startDate} — {exp.endDate}</span>
                                      </div>
                                      <p className="text-base text-slate-500 leading-7 font-light">
                                          {exp.description}
                                      </p>
                                  </div>
                              ))}
                          </div>
                      </section>
                  )}

                  {data.projects.length > 0 && (
                      <section>
                          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-[0.2em] mb-10">Selected Works</h3>
                          <div className="grid grid-cols-2 gap-8">
                              {data.projects.map(proj => (
                                  <div key={proj.id} className="bg-white/60 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                                      <div className="text-lg font-normal text-slate-800 mb-2 flex items-center gap-2">
                                          {proj.name}
                                          {proj.link && <ExternalLink size={14} className="text-slate-300"/>}
                                      </div>
                                      <p className="text-sm font-light text-slate-500 leading-relaxed">
                                          {proj.description}
                                      </p>
                                  </div>
                              ))}
                          </div>
                      </section>
                  )}

              </div>

          </div>
      </div>
    </div>
  );
};