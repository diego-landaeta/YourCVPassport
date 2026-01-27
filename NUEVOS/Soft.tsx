import React from 'react';
import { CVData } from '../types';
import { Mail, Phone, MapPin, Globe } from 'lucide-react';

export const SoftTheme: React.FC<{ data: CVData }> = ({ data }) => {
  // Styles for neumorphism
  const outerShadow = "shadow-[8px_8px_16px_#bebebe,-8px_-8px_16px_#ffffff]";
  const innerShadow = "shadow-[inset_6px_6px_12px_#bebebe,inset_-6px_-6px_12px_#ffffff]";
  
  return (
    <div className="font-sans text-slate-600 h-full bg-[#e0e5ec] p-10 md:p-14">
      
      {/* Header Card */}
      <header className={`rounded-[3rem] p-10 mb-12 flex flex-col md:flex-row items-center gap-10 ${outerShadow}`}>
          <div className={`w-32 h-32 rounded-full flex-shrink-0 flex items-center justify-center border-4 border-[#e0e5ec] ${outerShadow}`}>
              {data.personal.photo ? (
                  <img src={data.personal.photo} className="w-full h-full object-cover rounded-full" alt="Profile" />
              ) : (
                  <span className="text-4xl font-bold text-slate-400">{data.personal.fullName.charAt(0)}</span>
              )}
          </div>
          <div className="text-center md:text-left flex-1">
              <h1 className="text-4xl md:text-5xl font-bold text-slate-700 mb-2">{data.personal.fullName}</h1>
              <p className="text-xl text-slate-500 font-medium mb-6">{data.personal.role}</p>
              
              <div className="flex flex-wrap justify-center md:justify-start gap-4">
                  {data.personal.email && (
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-slate-500 hover:text-blue-500 transition-colors ${outerShadow}`}>
                          <Mail size={18} />
                      </div>
                  )}
                  {data.personal.phone && (
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-slate-500 hover:text-blue-500 transition-colors ${outerShadow}`}>
                          <Phone size={18} />
                      </div>
                  )}
                  {data.personal.website && (
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-slate-500 hover:text-blue-500 transition-colors ${outerShadow}`}>
                          <Globe size={18} />
                      </div>
                  )}
              </div>
          </div>
      </header>

      <div className="grid grid-cols-12 gap-10">
          
          {/* Main Content */}
          <div className="col-span-12 md:col-span-8 space-y-10">
              
              {/* Summary */}
              {data.personal.summary && (
                  <section>
                      <h3 className="ml-4 mb-4 text-sm font-bold uppercase tracking-widest text-slate-400">About Me</h3>
                      <div className={`rounded-[2rem] p-8 ${innerShadow}`}>
                          <p className="leading-7 text-slate-600">
                              {data.personal.summary}
                          </p>
                      </div>
                  </section>
              )}

              {/* Experience */}
              {data.experience.length > 0 && (
                  <section>
                      <h3 className="ml-4 mb-6 text-sm font-bold uppercase tracking-widest text-slate-400">Experience</h3>
                      <div className="space-y-8">
                          {data.experience.map(exp => (
                              <div key={exp.id} className={`rounded-[2rem] p-8 ${outerShadow}`}>
                                  <div className="flex justify-between items-center mb-2">
                                      <h4 className="text-xl font-bold text-slate-700">{exp.role}</h4>
                                      <span className={`text-xs font-bold text-slate-400 px-3 py-1 rounded-full ${innerShadow}`}>
                                          {exp.startDate} - {exp.endDate}
                                      </span>
                                  </div>
                                  <div className="text-blue-500 font-bold text-sm mb-4 uppercase tracking-wide">{exp.company}</div>
                                  <p className="text-sm leading-relaxed text-slate-500">
                                      {exp.description}
                                  </p>
                              </div>
                          ))}
                      </div>
                  </section>
              )}

          </div>

          {/* Sidebar */}
          <div className="col-span-12 md:col-span-4 space-y-10">
              
              {/* Contact Text (Details) */}
              <div className={`rounded-[2rem] p-8 ${outerShadow}`}>
                  <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-slate-400">Details</h3>
                  <div className="space-y-3 text-sm font-medium">
                      {data.personal.location && <div className="flex items-center gap-2"><MapPin size={14}/> {data.personal.location}</div>}
                      {data.personal.email && <div className="truncate">{data.personal.email}</div>}
                      {data.personal.phone && <div>{data.personal.phone}</div>}
                  </div>
              </div>

              {/* Skills */}
              {data.skills.length > 0 && (
                  <section>
                      <h3 className="ml-4 mb-4 text-sm font-bold uppercase tracking-widest text-slate-400">Skills</h3>
                      <div className="flex flex-wrap gap-4">
                          {data.skills.map(s => (
                              <span key={s.id} className={`px-4 py-2 rounded-full text-xs font-bold text-slate-500 ${outerShadow}`}>
                                  {s.name}
                              </span>
                          ))}
                      </div>
                  </section>
              )}

              {/* Education */}
              {data.education.length > 0 && (
                  <section>
                      <h3 className="ml-4 mb-4 text-sm font-bold uppercase tracking-widest text-slate-400">Education</h3>
                      <div className="space-y-6">
                          {data.education.map(edu => (
                              <div key={edu.id} className={`rounded-[2rem] p-6 ${outerShadow}`}>
                                  <div className="font-bold text-slate-700">{edu.institution}</div>
                                  <div className="text-xs text-slate-500 mt-1">{edu.degree}</div>
                                  <div className="text-[10px] text-slate-400 mt-2 font-bold">{edu.endDate}</div>
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