import React from 'react';
import { CVData } from '../types';
import { Mail, Phone, MapPin, Globe } from '../components/ui/Icons';

export const ZenithTheme: React.FC<{ data: CVData }> = ({ data }) => {
  return (
    <div className="font-sans text-neutral-800 h-full bg-neutral-100 flex flex-row">
      
      {/* Main Content (Left) */}
      <div className="flex-1 bg-white p-12 py-16">
          
          <header className="mb-16">
              <h1 className="text-6xl font-black tracking-tight text-neutral-900 mb-2">{data.personal.fullName}</h1>
              <div className="h-2 w-24 bg-neutral-900 mb-6"></div>
              <p className="text-2xl text-neutral-500 font-light">{data.personal.role}</p>
          </header>

          {data.personal.summary && (
              <section className="mb-16">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-6 flex items-center gap-4">
                      Profile <span className="flex-1 h-px bg-neutral-100"></span>
                  </h3>
                  <p className="text-lg text-neutral-600 leading-8 font-light">
                      {data.personal.summary}
                  </p>
              </section>
          )}

          {data.experience.length > 0 && (
              <section className="mb-16">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-8 flex items-center gap-4">
                      Career History <span className="flex-1 h-px bg-neutral-100"></span>
                  </h3>
                  <div className="space-y-12">
                      {data.experience.map(exp => (
                          <div key={exp.id} className="grid grid-cols-12 gap-4">
                              <div className="col-span-3 text-xs font-bold text-neutral-400 pt-1.5 uppercase">
                                  {exp.startDate} - {exp.endDate}
                              </div>
                              <div className="col-span-9">
                                  <h4 className="text-xl font-bold text-neutral-900 mb-1">{exp.role}</h4>
                                  <div className="text-sm font-bold text-neutral-500 mb-4">{exp.company}</div>
                                  <p className="text-sm text-neutral-600 leading-7">
                                      {exp.description}
                                  </p>
                              </div>
                          </div>
                      ))}
                  </div>
              </section>
          )}

          {data.projects.length > 0 && (
              <section>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-8 flex items-center gap-4">
                      Projects <span className="flex-1 h-px bg-neutral-100"></span>
                  </h3>
                  <div className="grid grid-cols-2 gap-8">
                      {data.projects.map(proj => (
                          <div key={proj.id} className="bg-neutral-50 p-6 border-l-4 border-neutral-900">
                              <h4 className="font-bold text-neutral-900 mb-2">{proj.name}</h4>
                              <p className="text-xs text-neutral-500 leading-relaxed">{proj.description}</p>
                          </div>
                      ))}
                  </div>
              </section>
          )}

      </div>

      {/* Sidebar (Right) */}
      <div className="w-[280px] bg-[#171717] text-neutral-400 p-10 flex flex-col min-h-[297mm]">
          
          <div className="mb-12">
              <div className="w-32 h-32 bg-neutral-800 rounded-full mb-8 overflow-hidden border-4 border-neutral-700 flex items-center justify-center text-4xl font-bold text-neutral-600 mx-auto">
                  {data.personal.photo ? (
                      <img src={data.personal.photo} className="w-full h-full object-cover" alt="Profile" />
                  ) : (
                      <span>{data.personal.fullName.charAt(0)}</span>
                  )}
              </div>
          </div>

          <section className="mb-12">
              <h3 className="text-white text-xs font-bold uppercase tracking-widest mb-6 border-b border-neutral-800 pb-2">Contact</h3>
              <div className="space-y-4 text-xs font-medium">
                  {data.personal.email && <div>{data.personal.email}</div>}
                  {data.personal.phone && <div>{data.personal.phone}</div>}
                  {data.personal.location && <div>{data.personal.location}</div>}
                  {data.personal.website && <div className="text-neutral-500">{data.personal.website}</div>}
              </div>
          </section>

          {data.education.length > 0 && (
              <section className="mb-12">
                  <h3 className="text-white text-xs font-bold uppercase tracking-widest mb-6 border-b border-neutral-800 pb-2">Education</h3>
                  <div className="space-y-6">
                      {data.education.map(edu => (
                          <div key={edu.id}>
                              <div className="text-white font-bold text-sm">{edu.institution}</div>
                              <div className="text-xs text-neutral-500 mt-1">{edu.degree}</div>
                              <div className="text-[10px] text-neutral-600 mt-1 uppercase">{edu.endDate}</div>
                          </div>
                      ))}
                  </div>
              </section>
          )}

          {data.skills.length > 0 && (
              <section>
                  <h3 className="text-white text-xs font-bold uppercase tracking-widest mb-6 border-b border-neutral-800 pb-2">Skills</h3>
                  <div className="flex flex-col gap-2">
                      {data.skills.map(s => (
                          <div key={s.id} className="flex justify-between items-center text-xs">
                              <span>{s.name}</span>
                              <div className="w-2 h-2 bg-neutral-800 rounded-full"></div>
                          </div>
                      ))}
                  </div>
              </section>
          )}

      </div>

    </div>
  );
};