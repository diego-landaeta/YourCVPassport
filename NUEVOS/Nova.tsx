import React from 'react';
import { CVData } from '../types';
import { Mail, Phone, MapPin, Globe, ExternalLink } from '../components/ui/Icons';

export const NovaTheme: React.FC<{ data: CVData }> = ({ data }) => {
  return (
    <div className="font-sans text-cyan-50 h-full bg-[#050510] p-10 flex flex-col relative overflow-hidden">
      
      {/* Background Stars/Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/40 via-[#050510] to-[#050510] pointer-events-none"></div>
      
      {/* Header */}
      <header className="relative z-10 flex items-center justify-between border-b border-cyan-900/50 pb-8 mb-10">
          <div className="flex items-center gap-8">
              <div className="w-28 h-28 rounded-full p-1 bg-gradient-to-br from-cyan-400 to-purple-600 shadow-[0_0_15px_rgba(34,211,238,0.5)]">
                  <div className="w-full h-full rounded-full overflow-hidden bg-black">
                      {data.personal.photo ? (
                          <img src={data.personal.photo} alt="User" className="w-full h-full object-cover" />
                      ) : (
                          <div className="w-full h-full flex items-center justify-center text-cyan-500 text-3xl font-bold">
                              {data.personal.fullName[0]}
                          </div>
                      )}
                  </div>
              </div>
              
              <div>
                  <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-purple-300 tracking-wide mb-2 filter drop-shadow-[0_0_2px_rgba(255,255,255,0.5)]">
                      {data.personal.fullName}
                  </h1>
                  <p className="text-xl text-cyan-200/70 font-light tracking-[0.2em] uppercase">{data.personal.role}</p>
              </div>
          </div>

          <div className="text-right text-xs font-mono text-cyan-400/60 space-y-1">
              <div>SYS.STATUS: ONLINE</div>
              <div>LOC: {data.personal.location || 'UNKNOWN'}</div>
              <div>ID: {data.id.substring(0,8).toUpperCase()}</div>
          </div>
      </header>

      <div className="relative z-10 flex-1 grid grid-cols-12 gap-10">
          
          {/* Main Column */}
          <div className="col-span-8 space-y-10">
              
              {/* Summary */}
              {data.personal.summary && (
                  <section className="bg-white/5 border border-white/10 p-6 rounded-lg backdrop-blur-sm">
                      <p className="text-cyan-100 leading-relaxed font-light">
                          {data.personal.summary}
                      </p>
                  </section>
              )}

              {/* Experience */}
              {data.experience.length > 0 && (
                  <section>
                      <h3 className="text-cyan-400 font-bold uppercase tracking-widest mb-6 flex items-center gap-2 text-sm shadow-[0_1px_0_0_rgba(34,211,238,0.2)] pb-2">
                          <span className="w-1 h-4 bg-cyan-400 shadow-[0_0_8px_cyan]"></span> Mission History
                      </h3>
                      <div className="space-y-8">
                          {data.experience.map(exp => (
                              <div key={exp.id} className="relative pl-6 border-l border-cyan-800/50">
                                  <div className="absolute -left-[5px] top-1.5 w-2 h-2 bg-cyan-500 rounded-full shadow-[0_0_10px_cyan]"></div>
                                  <div className="flex justify-between items-baseline mb-1">
                                      <h4 className="text-xl font-bold text-white">{exp.role}</h4>
                                      <span className="text-xs font-mono text-cyan-300">{exp.startDate} :: {exp.endDate}</span>
                                  </div>
                                  <div className="text-sm font-bold text-purple-400 uppercase tracking-wide mb-3">{exp.company}</div>
                                  <p className="text-sm text-cyan-100/70 leading-relaxed">
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
                      <h3 className="text-cyan-400 font-bold uppercase tracking-widest mb-6 flex items-center gap-2 text-sm shadow-[0_1px_0_0_rgba(34,211,238,0.2)] pb-2">
                          <span className="w-1 h-4 bg-purple-500 shadow-[0_0_8px_purple]"></span> Deployments
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                          {data.projects.map(proj => (
                              <div key={proj.id} className="bg-[#0a0a1a] border border-cyan-900/30 p-4 rounded hover:border-cyan-500/50 transition-colors group">
                                  <div className="font-bold text-white mb-1 group-hover:text-cyan-300 transition-colors flex items-center gap-2">
                                      {proj.name}
                                      {proj.link && <ExternalLink size={12}/>}
                                  </div>
                                  <p className="text-xs text-gray-400">{proj.description}</p>
                              </div>
                          ))}
                      </div>
                  </section>
              )}

          </div>

          {/* Sidebar */}
          <div className="col-span-4 space-y-8">
              
              {/* Skills */}
              {data.skills.length > 0 && (
                  <section>
                      <h3 className="text-cyan-400 font-bold uppercase tracking-widest mb-4 text-xs">Skill Matrix</h3>
                      <div className="flex flex-wrap gap-2">
                          {data.skills.map(s => (
                              <div key={s.id} className="bg-white/5 border border-white/10 px-3 py-1 text-xs text-cyan-100 rounded-full">
                                  {s.name}
                              </div>
                          ))}
                      </div>
                  </section>
              )}

              {/* Contact Grid */}
              <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
                  <div className="p-3 border-b border-white/5 text-xs font-bold text-cyan-500 uppercase bg-black/20">Comms Link</div>
                  <div className="p-4 space-y-3 text-xs">
                      {data.personal.email && <div className="flex items-center gap-3 text-gray-300"><Mail size={12} className="text-cyan-600"/> {data.personal.email}</div>}
                      {data.personal.phone && <div className="flex items-center gap-3 text-gray-300"><Phone size={12} className="text-cyan-600"/> {data.personal.phone}</div>}
                      {data.personal.website && <div className="flex items-center gap-3 text-gray-300"><Globe size={12} className="text-cyan-600"/> {data.personal.website}</div>}
                  </div>
              </div>

              {/* Education */}
              {data.education.length > 0 && (
                  <section>
                      <h3 className="text-cyan-400 font-bold uppercase tracking-widest mb-4 text-xs">Training Data</h3>
                      <div className="space-y-4">
                          {data.education.map(edu => (
                              <div key={edu.id} className="text-right border-r-2 border-purple-500/50 pr-4">
                                  <div className="text-white font-bold text-sm">{edu.institution}</div>
                                  <div className="text-xs text-gray-400">{edu.degree}</div>
                                  <div className="text-[10px] text-cyan-600 mt-1">{edu.endDate}</div>
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