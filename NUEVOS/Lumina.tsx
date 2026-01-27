import React from 'react';
import { CVData } from '../types';
import { Mail, Phone, MapPin, Globe } from '../components/ui/Icons';

export const LuminaTheme: React.FC<{ data: CVData }> = ({ data }) => {
  return (
    <div className="font-serif text-gray-800 h-full bg-[#f8f9fa] p-10 md:p-16 flex flex-col">
      
      {/* Header */}
      <header className="flex flex-col items-center text-center mb-16">
          <div className="w-32 h-32 rounded-2xl bg-white shadow-xl mb-8 p-1 flex items-center justify-center text-gray-200 text-4xl">
              {data.personal.photo ? (
                  <img src={data.personal.photo} className="w-full h-full object-cover rounded-xl" alt="Profile" />
              ) : (
                  <span>{data.personal.fullName.charAt(0)}</span>
              )}
          </div>
          <h1 className="text-5xl font-light tracking-wide text-gray-900 mb-2">{data.personal.fullName}</h1>
          <p className="text-sm font-sans uppercase tracking-[0.3em] text-gray-400 mb-8">{data.personal.role}</p>
          
          <div className="flex gap-8 text-xs font-sans text-gray-500 uppercase tracking-widest border-t border-gray-200 pt-6">
              {data.personal.email && <span>{data.personal.email}</span>}
              {data.personal.phone && <span>{data.personal.phone}</span>}
              {data.personal.location && <span>{data.personal.location}</span>}
          </div>
      </header>

      <div className="grid grid-cols-12 gap-16">
          
          {/* Main Content */}
          <div className="col-span-8 space-y-14">
              
              {data.personal.summary && (
                  <section>
                      <p className="text-lg italic text-gray-600 leading-8 border-l-2 border-gray-300 pl-6">
                          {data.personal.summary}
                      </p>
                  </section>
              )}

              {data.experience.length > 0 && (
                  <section>
                      <h3 className="font-sans font-bold text-xs uppercase tracking-widest text-gray-400 mb-8">Work Experience</h3>
                      <div className="space-y-12">
                          {data.experience.map(exp => (
                              <div key={exp.id} className="relative">
                                  <div className="flex flex-col mb-2">
                                      <h4 className="text-xl font-medium text-gray-900">{exp.role}</h4>
                                      <span className="font-sans text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">{exp.company} / {exp.startDate} - {exp.endDate}</span>
                                  </div>
                                  <p className="font-sans text-sm text-gray-600 leading-7">
                                      {exp.description}
                                  </p>
                              </div>
                          ))}
                      </div>
                  </section>
              )}

          </div>

          {/* Sidebar */}
          <div className="col-span-4 space-y-12 pt-2">
              
              {data.education.length > 0 && (
                  <section>
                      <h3 className="font-sans font-bold text-xs uppercase tracking-widest text-gray-400 mb-6">Education</h3>
                      <div className="space-y-6">
                          {data.education.map(edu => (
                              <div key={edu.id}>
                                  <div className="font-medium text-gray-900">{edu.institution}</div>
                                  <div className="text-sm text-gray-500 italic">{edu.degree}</div>
                                  <div className="font-sans text-xs text-gray-400 mt-1">{edu.endDate}</div>
                              </div>
                          ))}
                      </div>
                  </section>
              )}

              {data.skills.length > 0 && (
                  <section>
                      <h3 className="font-sans font-bold text-xs uppercase tracking-widest text-gray-400 mb-6">Expertise</h3>
                      <div className="space-y-2">
                          {data.skills.map(s => (
                              <div key={s.id} className="font-sans text-sm text-gray-600 border-b border-gray-100 pb-2 mb-2">
                                  {s.name}
                              </div>
                          ))}
                      </div>
                  </section>
              )}

              {data.projects.length > 0 && (
                  <section>
                      <h3 className="font-sans font-bold text-xs uppercase tracking-widest text-gray-400 mb-6">Projects</h3>
                      <div className="space-y-4">
                          {data.projects.map(proj => (
                              <div key={proj.id}>
                                  <div className="font-medium text-gray-900 mb-1">{proj.name}</div>
                                  <div className="font-sans text-xs text-gray-500 leading-5">{proj.description}</div>
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