import React from 'react';
import { CVData } from '../types';
import { Mail, Phone, MapPin, Globe } from '../components/ui/Icons';

export const GalleryTheme: React.FC<{ data: CVData }> = ({ data }) => {
  return (
    <div className="font-sans text-gray-800 h-full bg-white flex flex-row">
      
      {/* Sidebar with Photo */}
      <aside className="w-[35%] bg-zinc-900 text-white p-8 flex flex-col min-h-[297mm]">
          
          {/* Photo Circle */}
          <div className="w-32 h-32 mx-auto rounded-full bg-zinc-800 border-4 border-zinc-700 overflow-hidden mb-8 shadow-2xl">
              {data.personal.photo ? (
                  <img src={data.personal.photo} className="w-full h-full object-cover" alt="Profile" />
              ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-600 font-bold text-3xl">
                      {data.personal.fullName[0]}
                  </div>
              )}
          </div>
          
          <h1 className="text-2xl font-bold text-center mb-2">{data.personal.fullName}</h1>
          <div className="text-center text-sm font-medium text-zinc-400 uppercase tracking-widest mb-10 pb-10 border-b border-zinc-800">
              {data.personal.role}
          </div>

          {/* Contact */}
          <div className="space-y-4 text-sm text-zinc-300 mb-10">
              {data.personal.email && <div className="flex items-center gap-3"><Mail size={14} className="text-zinc-500"/> {data.personal.email}</div>}
              {data.personal.phone && <div className="flex items-center gap-3"><Phone size={14} className="text-zinc-500"/> {data.personal.phone}</div>}
              {data.personal.location && <div className="flex items-center gap-3"><MapPin size={14} className="text-zinc-500"/> {data.personal.location}</div>}
              {data.personal.website && <div className="flex items-center gap-3"><Globe size={14} className="text-zinc-500"/> {data.personal.website}</div>}
          </div>

          {/* Skills */}
          {data.skills.length > 0 && (
             <div className="mt-auto">
                 <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4">Skills</h3>
                 <div className="flex flex-wrap gap-2">
                     {data.skills.map(s => (
                         <span key={s.id} className="text-xs bg-zinc-800 px-2 py-1 rounded text-zinc-300">
                             {s.name}
                         </span>
                     ))}
                 </div>
             </div>
          )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-12 bg-white">
          
          {/* Summary */}
          {data.personal.summary && (
              <section className="mb-12">
                  <h3 className="text-xs font-bold uppercase text-zinc-400 mb-4 tracking-widest">About</h3>
                  <p className="text-base text-gray-600 leading-7">
                      {data.personal.summary}
                  </p>
              </section>
          )}

          {/* Experience */}
          {data.experience.length > 0 && (
              <section className="mb-12">
                  <h3 className="text-xs font-bold uppercase text-zinc-400 mb-6 tracking-widest">Experience</h3>
                  <div className="space-y-10">
                      {data.experience.map(exp => (
                          <div key={exp.id} className="relative pl-6 border-l-2 border-gray-100">
                              <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-zinc-300"></div>
                              <h4 className="font-bold text-lg text-gray-900">{exp.role}</h4>
                              <div className="text-sm font-semibold text-zinc-500 mb-2">
                                  {exp.company} <span className="font-normal text-zinc-300 mx-2">|</span> {exp.startDate} - {exp.endDate}
                              </div>
                              <p className="text-sm text-gray-600 leading-relaxed">
                                  {exp.description}
                              </p>
                          </div>
                      ))}
                  </div>
              </section>
          )}

          {/* Education & Projects Split */}
          <div className="grid grid-cols-1 gap-10">
              
               {/* Projects */}
               {data.projects.length > 0 && (
                  <section>
                      <h3 className="text-xs font-bold uppercase text-zinc-400 mb-4 tracking-widest">Projects</h3>
                      <div className="space-y-4">
                          {data.projects.map(proj => (
                              <div key={proj.id}>
                                  <div className="font-bold text-sm text-gray-900">{proj.name}</div>
                                  <p className="text-xs text-gray-500">{proj.description}</p>
                              </div>
                          ))}
                      </div>
                  </section>
              )}
              
               {/* Education */}
               {data.education.length > 0 && (
                  <section>
                      <h3 className="text-xs font-bold uppercase text-zinc-400 mb-4 tracking-widest">Education</h3>
                      <div className="space-y-4">
                          {data.education.map(edu => (
                              <div key={edu.id}>
                                  <div className="font-bold text-sm text-gray-900">{edu.institution}</div>
                                  <div className="text-xs text-gray-500">{edu.degree}</div>
                              </div>
                          ))}
                      </div>
                  </section>
              )}

          </div>

      </main>
    </div>
  );
};