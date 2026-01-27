import React from 'react';
import { CVData } from '../types';
import { Mail, Phone, MapPin, Globe, ExternalLink } from '../components/ui/Icons';

export const ApexTheme: React.FC<{ data: CVData }> = ({ data }) => {
  return (
    <div className="font-sans text-slate-800 h-full bg-white flex flex-col">
      
      {/* Dark Header */}
      <header className="bg-[#1a202c] text-white p-12 grid grid-cols-12 gap-8 items-center">
         <div className="col-span-8">
             <h1 className="text-5xl font-bold tracking-tight mb-2 uppercase">{data.personal.fullName}</h1>
             <p className="text-xl text-blue-400 font-medium tracking-wide mb-6">{data.personal.role}</p>
             
             <div className="flex flex-wrap gap-6 text-xs text-slate-400 font-medium">
                 {data.personal.email && <div className="flex items-center gap-2"><Mail size={14}/> {data.personal.email}</div>}
                 {data.personal.phone && <div className="flex items-center gap-2"><Phone size={14}/> {data.personal.phone}</div>}
                 {data.personal.location && <div className="flex items-center gap-2"><MapPin size={14}/> {data.personal.location}</div>}
             </div>
         </div>
         <div className="col-span-4 flex justify-end">
             <div className="w-32 h-32 rounded-lg bg-slate-700 border-4 border-slate-600 overflow-hidden flex items-center justify-center text-slate-500 text-3xl font-bold">
                 {data.personal.photo ? (
                     <img src={data.personal.photo} className="w-full h-full object-cover" alt="Profile" />
                 ) : (
                     <span>{data.personal.fullName.charAt(0)}</span>
                 )}
             </div>
         </div>
      </header>

      {/* Content */}
      <div className="flex-1 p-12 grid grid-cols-12 gap-10">
          
          {/* Main */}
          <div className="col-span-8 space-y-12">
              
              {data.personal.summary && (
                  <section>
                      <h3 className="text-sm font-bold uppercase text-slate-900 border-b-2 border-slate-200 pb-2 mb-4 tracking-widest">Executive Summary</h3>
                      <p className="text-slate-600 leading-7 text-justify">{data.personal.summary}</p>
                  </section>
              )}

              {data.experience.length > 0 && (
                  <section>
                      <h3 className="text-sm font-bold uppercase text-slate-900 border-b-2 border-slate-200 pb-2 mb-6 tracking-widest">Experience</h3>
                      <div className="space-y-8">
                          {data.experience.map(exp => (
                              <div key={exp.id}>
                                  <div className="flex justify-between items-baseline mb-1">
                                      <h4 className="text-lg font-bold text-slate-900">{exp.role}</h4>
                                      <span className="text-xs font-bold text-slate-500">{exp.startDate} - {exp.endDate}</span>
                                  </div>
                                  <div className="text-blue-700 font-bold text-sm mb-2">{exp.company}</div>
                                  <p className="text-sm text-slate-600 leading-relaxed">{exp.description}</p>
                              </div>
                          ))}
                      </div>
                  </section>
              )}

              {data.projects.length > 0 && (
                  <section>
                      <h3 className="text-sm font-bold uppercase text-slate-900 border-b-2 border-slate-200 pb-2 mb-6 tracking-widest">Projects</h3>
                      <div className="grid grid-cols-2 gap-4">
                          {data.projects.map(proj => (
                              <div key={proj.id} className="bg-slate-50 p-4 border border-slate-100">
                                  <div className="font-bold text-sm text-slate-900 mb-1">{proj.name}</div>
                                  <p className="text-xs text-slate-600">{proj.description}</p>
                              </div>
                          ))}
                      </div>
                  </section>
              )}

          </div>

          {/* Sidebar */}
          <div className="col-span-4 space-y-10">
              
              {data.skills.length > 0 && (
                  <section>
                      <h3 className="text-sm font-bold uppercase text-slate-900 border-b-2 border-slate-200 pb-2 mb-4 tracking-widest">Competencies</h3>
                      <div className="flex flex-wrap gap-2">
                          {data.skills.map(s => (
                              <span key={s.id} className="text-xs font-bold bg-slate-100 text-slate-700 px-3 py-1.5 rounded-full border border-slate-200">{s.name}</span>
                          ))}
                      </div>
                  </section>
              )}

              {data.education.length > 0 && (
                  <section>
                      <h3 className="text-sm font-bold uppercase text-slate-900 border-b-2 border-slate-200 pb-2 mb-4 tracking-widest">Education</h3>
                      <div className="space-y-4">
                          {data.education.map(edu => (
                              <div key={edu.id}>
                                  <div className="font-bold text-sm text-slate-900">{edu.institution}</div>
                                  <div className="text-xs text-slate-500 italic">{edu.degree}</div>
                                  <div className="text-xs text-slate-400 mt-1">{edu.endDate}</div>
                              </div>
                          ))}
                      </div>
                  </section>
              )}

              {data.personal.website && (
                  <section>
                      <h3 className="text-sm font-bold uppercase text-slate-900 border-b-2 border-slate-200 pb-2 mb-4 tracking-widest">Portfolio</h3>
                      <div className="text-sm text-blue-600 underline flex items-center gap-2">
                          <Globe size={14}/> {data.personal.website}
                      </div>
                  </section>
              )}

          </div>

      </div>
    </div>
  );
};