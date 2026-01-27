import React from 'react';
import { CVData } from '../types';
import { Mail, Phone, MapPin, ExternalLink, Globe, ShieldCheck } from '../components/ui/Icons';

export const UrbanTheme: React.FC<{ data: CVData }> = ({ data }) => {
  return (
    <div className="font-sans text-black h-full bg-[#f0f0f0] p-8 flex flex-col gap-8">
      
      {/* "Sticker" Header */}
      <header className="bg-black text-white p-8 transform -rotate-1 shadow-[10px_10px_0px_0px_#ff0000] border-4 border-black relative">
          <div className="absolute top-0 right-0 bg-yellow-400 text-black font-black text-xs px-2 py-1 border-l-4 border-b-4 border-black">
              HELLO_MY_NAME_IS
          </div>
          
          <div className="flex items-center gap-8">
              <div className="w-32 h-32 bg-white border-4 border-black flex-shrink-0 overflow-hidden flex items-center justify-center grayscale contrast-125">
                  {data.personal.photo ? (
                      <img src={data.personal.photo} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                      <span className="text-4xl font-black text-black">N/A</span>
                  )}
              </div>
              <div>
                  <h1 className="text-7xl font-black tracking-tighter leading-none mb-2 uppercase flex items-center gap-4">
                      <span>
                        {data.personal.fullName.split(' ')[0]}
                        <span className="text-transparent bg-clip-text bg-white/20 block md:inline md:ml-4">
                            {data.personal.fullName.split(' ').slice(1).join(' ')}
                        </span>
                      </span>
                      {data.personal.verified && <ShieldCheck className="w-16 h-16 text-blue-500 shrink-0" />}
                  </h1>
                  <div className="bg-red-600 text-white inline-block px-4 py-1 font-bold text-xl uppercase tracking-widest transform skew-x-12 border-2 border-white">
                      {data.personal.role}
                  </div>
              </div>
          </div>
      </header>

      <div className="grid grid-cols-12 gap-8 flex-1">
          
          {/* Main Content */}
          <div className="col-span-8 flex flex-col gap-8">
              
              {/* Bio "Ticket" */}
              {data.personal.summary && (
                  <section className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)]">
                      <h3 className="font-black text-3xl uppercase mb-4 underline decoration-4 decoration-yellow-400 underline-offset-4">Manifesto</h3>
                      <p className="text-lg font-bold leading-tight uppercase text-zinc-800">
                          {data.personal.summary}
                      </p>
                  </section>
              )}

              {/* Experience "List" */}
              {data.experience.length > 0 && (
                  <section>
                      <h3 className="bg-black text-white inline-block px-6 py-2 font-black text-2xl uppercase mb-6 transform rotate-2">Track Record</h3>
                      <div className="space-y-6">
                          {data.experience.map(exp => (
                              <div key={exp.id} className="border-b-4 border-black pb-4">
                                  <div className="flex justify-between items-end mb-2">
                                      <h4 className="text-3xl font-black uppercase leading-none">{exp.company}</h4>
                                      <span className="bg-yellow-400 px-2 font-bold border-2 border-black text-sm">{exp.startDate} - {exp.endDate}</span>
                                  </div>
                                  <div className="text-xl font-bold text-red-600 uppercase mb-2">{exp.role}</div>
                                  <p className="font-medium text-sm text-zinc-600 uppercase leading-snug">
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
                      <h3 className="bg-black text-white inline-block px-6 py-2 font-black text-2xl uppercase mb-6 transform -rotate-1">Drops</h3>
                      <div className="grid grid-cols-2 gap-4">
                          {data.projects.map(proj => (
                              <div key={proj.id} className="bg-black text-white p-4 relative group hover:bg-red-600 transition-colors cursor-default">
                                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100"><ExternalLink size={16}/></div>
                                  <div className="font-black text-xl uppercase mb-1">{proj.name}</div>
                                  <div className="text-xs font-mono">{proj.description}</div>
                              </div>
                          ))}
                      </div>
                  </section>
              )}

          </div>

          {/* Sidebar */}
          <div className="col-span-4 flex flex-col gap-8">
              
              {/* Contact "Barcode" */}
              <div className="bg-white border-4 border-black p-6 text-center">
                  <div className="h-12 w-full flex items-end justify-between gap-[2px] mb-4">
                      {[...Array(30)].map((_, i) => (
                          <div key={i} className="bg-black w-full" style={{ height: Math.random() > 0.3 ? '100%' : '50%'}}></div>
                      ))}
                  </div>
                  <div className="space-y-2 text-sm font-bold uppercase">
                      {data.personal.email && <div className="truncate bg-zinc-100 p-1">{data.personal.email}</div>}
                      {data.personal.phone && <div className="bg-zinc-100 p-1">{data.personal.phone}</div>}
                      {data.personal.location && <div className="bg-zinc-100 p-1">{data.personal.location}</div>}
                      {data.personal.website && <div className="bg-zinc-100 p-1 truncate">{data.personal.website}</div>}
                  </div>
              </div>

              {/* Skills "Tags" */}
              {data.skills.length > 0 && (
                  <div className="bg-yellow-400 border-4 border-black p-6">
                      <h3 className="font-black text-xl uppercase mb-4 border-b-4 border-black">Arsenal</h3>
                      <div className="flex flex-wrap gap-2">
                          {data.skills.map(s => (
                              <span key={s.id} className="bg-white border-2 border-black px-2 py-1 font-bold text-xs uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                  {s.name}
                              </span>
                          ))}
                      </div>
                  </div>
              )}

              {/* Education */}
              {data.education.length > 0 && (
                  <div>
                      <h3 className="font-black text-xl uppercase mb-4 bg-red-600 text-white inline-block px-2">Education</h3>
                      <div className="space-y-4">
                          {data.education.map(edu => (
                              <div key={edu.id} className="bg-black text-white p-4">
                                  <div className="font-black text-lg">{edu.institution}</div>
                                  <div className="text-zinc-400 font-bold text-xs">{edu.degree}</div>
                                  <div className="text-right text-xs mt-2 text-yellow-400">{edu.endDate}</div>
                              </div>
                          ))}
                      </div>
                  </div>
              )}

          </div>

      </div>
    </div>
  );
};