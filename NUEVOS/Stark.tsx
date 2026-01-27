import React from 'react';
import { CVData } from '../types';
import { Mail, Phone, MapPin, Globe } from '../components/ui/Icons';

export const StarkTheme: React.FC<{ data: CVData }> = ({ data }) => {
  return (
    <div className="font-serif text-black h-full bg-white flex flex-row">
      
      {/* Sidebar (Black) */}
      <aside className="w-[30%] bg-black text-white flex flex-col min-h-[297mm]">
          
          {/* Photo takes up top chunk */}
          <div className="w-full aspect-square bg-zinc-900 flex items-center justify-center overflow-hidden relative">
              {data.personal.photo ? (
                  <img src={data.personal.photo} className="w-full h-full object-cover grayscale contrast-125" alt="Profile" />
              ) : (
                  <span className="text-9xl font-bold text-zinc-800 select-none">
                      {data.personal.fullName.charAt(0)}
                  </span>
              )}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80"></div>
          </div>

          <div className="p-8 flex-1 flex flex-col gap-10">
              
              {/* Contact */}
              <div className="space-y-4 text-sm font-sans">
                  <h3 className="font-bold uppercase tracking-widest text-zinc-500 text-xs border-b border-zinc-800 pb-2 mb-4">Contact</h3>
                  {data.personal.email && <div className="break-all">{data.personal.email}</div>}
                  {data.personal.phone && <div>{data.personal.phone}</div>}
                  {data.personal.location && <div>{data.personal.location}</div>}
                  {data.personal.website && <div className="break-all underline decoration-zinc-500">{data.personal.website}</div>}
              </div>

              {/* Education */}
              {data.education.length > 0 && (
                  <div className="space-y-6">
                      <h3 className="font-bold uppercase tracking-widest text-zinc-500 text-xs border-b border-zinc-800 pb-2 mb-4 font-sans">Education</h3>
                      {data.education.map(edu => (
                          <div key={edu.id}>
                              <div className="font-bold text-lg leading-tight">{edu.institution}</div>
                              <div className="text-zinc-400 text-sm mt-1">{edu.degree}</div>
                              <div className="text-zinc-600 text-xs mt-1 font-sans">{edu.endDate}</div>
                          </div>
                      ))}
                  </div>
              )}

              {/* Skills */}
              {data.skills.length > 0 && (
                  <div className="mt-auto">
                      <h3 className="font-bold uppercase tracking-widest text-zinc-500 text-xs border-b border-zinc-800 pb-2 mb-4 font-sans">Skills</h3>
                      <ul className="text-sm space-y-2 font-sans">
                          {data.skills.map(s => <li key={s.id} className="text-zinc-300">{s.name}</li>)}
                      </ul>
                  </div>
              )}

          </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-12 md:p-16 flex flex-col justify-center">
          
          <header className="mb-16 border-b-4 border-black pb-8">
              <h1 className="text-6xl md:text-7xl font-black uppercase tracking-tighter leading-[0.85] mb-4">
                  {data.personal.fullName}
              </h1>
              <p className="text-2xl font-sans font-light tracking-widest text-zinc-500 uppercase">{data.personal.role}</p>
          </header>

          {data.personal.summary && (
              <section className="mb-16">
                  <p className="text-xl leading-relaxed font-light">
                      {data.personal.summary}
                  </p>
              </section>
          )}

          {data.experience.length > 0 && (
              <section className="mb-16">
                  <h3 className="font-sans font-black uppercase text-3xl mb-8">Experience</h3>
                  <div className="space-y-12">
                      {data.experience.map(exp => (
                          <div key={exp.id} className="grid grid-cols-12 gap-6">
                              <div className="col-span-3 font-sans text-xs font-bold uppercase pt-2">
                                  {exp.startDate} - {exp.endDate}
                              </div>
                              <div className="col-span-9 border-l border-zinc-200 pl-8">
                                  <h4 className="text-2xl font-bold mb-1">{exp.role}</h4>
                                  <div className="text-lg font-sans text-zinc-500 mb-4">{exp.company}</div>
                                  <p className="text-sm font-sans leading-7 text-zinc-700">
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
                  <h3 className="font-sans font-black uppercase text-3xl mb-8">Selected Works</h3>
                  <div className="grid grid-cols-2 gap-8">
                      {data.projects.map(proj => (
                          <div key={proj.id} className="bg-zinc-50 p-6">
                              <div className="font-bold text-lg mb-2">{proj.name}</div>
                              <p className="font-sans text-sm text-zinc-600">{proj.description}</p>
                          </div>
                      ))}
                  </div>
              </section>
          )}

      </main>
    </div>
  );
};