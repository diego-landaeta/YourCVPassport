import React from 'react';
import { CVData } from '../types';
import { Mail, Phone, MapPin, Globe } from '../components/ui/Icons';

export const ProTheme: React.FC<{ data: CVData }> = ({ data }) => {
  return (
    <div className="font-sans text-slate-800 h-full bg-slate-50 p-10 md:p-14">
      
      {/* Header Container */}
      <header className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 flex gap-6 items-center mb-8">
          {/* Photo */}
          <div className="w-24 h-24 bg-slate-200 rounded-lg overflow-hidden flex-shrink-0">
             {data.personal.photo ? (
                 <img src={data.personal.photo} className="w-full h-full object-cover" alt="Profile" />
             ) : (
                 <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-2xl">
                     {data.personal.fullName[0]}
                 </div>
             )}
          </div>
          
          <div className="flex-1">
              <h1 className="text-3xl font-bold text-slate-900 mb-1">{data.personal.fullName}</h1>
              <p className="text-slate-500 font-medium mb-4">{data.personal.role}</p>
              
              <div className="flex flex-wrap gap-4 text-xs font-medium text-slate-600">
                  {data.personal.email && <span className="flex items-center gap-1"><Mail size={12}/> {data.personal.email}</span>}
                  {data.personal.phone && <span className="flex items-center gap-1"><Phone size={12}/> {data.personal.phone}</span>}
                  {data.personal.location && <span className="flex items-center gap-1"><MapPin size={12}/> {data.personal.location}</span>}
                  {data.personal.website && <span className="flex items-center gap-1"><Globe size={12}/> {data.personal.website}</span>}
              </div>
          </div>
      </header>

      <div className="grid grid-cols-12 gap-8">
          
          {/* Left Column (Main) */}
          <div className="col-span-8 space-y-6">
              
              {/* Summary */}
              {data.personal.summary && (
                  <section className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                      <h3 className="text-xs font-bold uppercase text-slate-400 mb-3">Professional Summary</h3>
                      <p className="text-sm leading-6 text-slate-700">
                          {data.personal.summary}
                      </p>
                  </section>
              )}
              
              {/* Experience */}
              {data.experience.length > 0 && (
                  <section className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                      <h3 className="text-xs font-bold uppercase text-slate-400 mb-6">Experience</h3>
                      <div className="space-y-8">
                          {data.experience.map(exp => (
                              <div key={exp.id} className="relative pl-4 border-l-2 border-slate-100">
                                  <div className="flex justify-between items-start mb-1">
                                      <div>
                                          <h4 className="font-bold text-slate-900">{exp.role}</h4>
                                          <div className="text-xs font-semibold text-blue-600">{exp.company}</div>
                                      </div>
                                      <div className="text-xs font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded">
                                          {exp.startDate} - {exp.endDate}
                                      </div>
                                  </div>
                                  <p className="text-sm leading-6 text-slate-600 mt-2">
                                      {exp.description}
                                  </p>
                              </div>
                          ))}
                      </div>
                  </section>
              )}
              
               {/* Projects */}
               {data.projects.length > 0 && (
                  <section className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                      <h3 className="text-xs font-bold uppercase text-slate-400 mb-4">Projects</h3>
                      <div className="space-y-4">
                          {data.projects.map(proj => (
                              <div key={proj.id}>
                                  <div className="font-bold text-sm text-slate-900">{proj.name}</div>
                                  <p className="text-xs text-slate-500 mt-1">{proj.description}</p>
                              </div>
                          ))}
                      </div>
                  </section>
              )}

          </div>

          {/* Right Column (Sidebar) */}
          <div className="col-span-4 space-y-6">
               
               {/* Skills */}
               {data.skills.length > 0 && (
                  <section className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                      <h3 className="text-xs font-bold uppercase text-slate-400 mb-4">Core Skills</h3>
                      <div className="flex flex-wrap gap-2">
                          {data.skills.map(s => (
                              <span key={s.id} className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs font-medium border border-slate-200">
                                  {s.name}
                              </span>
                          ))}
                      </div>
                  </section>
              )}

               {/* Education */}
               {data.education.length > 0 && (
                  <section className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                      <h3 className="text-xs font-bold uppercase text-slate-400 mb-4">Education</h3>
                      <div className="space-y-4">
                          {data.education.map(edu => (
                              <div key={edu.id}>
                                  <div className="font-bold text-sm text-slate-900">{edu.institution}</div>
                                  <div className="text-xs text-slate-500">{edu.degree}</div>
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