import React from 'react';
import { CVData } from '../types';

export const BrutalTheme: React.FC<{ data: CVData }> = ({ data }) => {
  return (
    <div className="font-serif text-black h-full bg-white p-4 md:p-8 flex flex-col overflow-hidden">
      
      {/* Brutalist Header */}
      <div className="border-4 border-black mb-8 p-4">
          <h1 className="text-6xl md:text-8xl font-black uppercase leading-none mb-4" style={{ fontFamily: 'Impact, sans-serif' }}>
              {data.personal.fullName}
          </h1>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-t-4 border-black pt-4 gap-4">
              <span className="text-2xl font-bold bg-blue-600 text-white px-2">{data.personal.role}</span>
              <div className="flex gap-4 font-mono text-sm underline text-blue-800 font-bold">
                  {data.personal.email && <a href="#">{data.personal.email}</a>}
                  {data.personal.website && <a href="#">{data.personal.website}</a>}
              </div>
          </div>
      </div>

      <div className="flex-1 grid grid-cols-12 gap-0 border-4 border-black h-full">
          
          {/* Sidebar */}
          <div className="col-span-12 md:col-span-4 border-b-4 md:border-b-0 md:border-r-4 border-black p-4 bg-[#ffff00]">
              
              <div className="mb-8">
                  <h2 className="font-bold text-xl uppercase border-b-4 border-black mb-4">Meta_Data</h2>
                  {data.personal.photo && (
                      <div className="border-4 border-black p-1 bg-white mb-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                          <img src={data.personal.photo} className="w-full h-auto grayscale contrast-200" alt="Profile" />
                      </div>
                  )}
                  <div className="font-mono text-sm space-y-2">
                      <p><strong>LOC:</strong> {data.personal.location}</p>
                      <p><strong>TEL:</strong> {data.personal.phone}</p>
                  </div>
              </div>

              {/* Skills */}
              {data.skills.length > 0 && (
                  <div className="mb-8">
                      <h2 className="font-bold text-xl uppercase border-b-4 border-black mb-4">Tools</h2>
                      <div className="flex flex-wrap gap-2">
                          {data.skills.map(s => (
                              <div key={s.id} className="border-2 border-black bg-white px-2 py-1 font-bold text-sm hover:bg-black hover:text-white transition-colors cursor-help">
                                  {s.name}
                              </div>
                          ))}
                      </div>
                  </div>
              )}

              {/* Education */}
              {data.education.length > 0 && (
                  <div>
                      <h2 className="font-bold text-xl uppercase border-b-4 border-black mb-4">Education</h2>
                      {data.education.map(edu => (
                          <div key={edu.id} className="mb-4">
                              <div className="font-black text-lg leading-tight">{edu.institution}</div>
                              <div className="text-sm font-mono">{edu.degree}</div>
                              <div className="text-xs bg-black text-white inline-block px-1 mt-1">{edu.endDate}</div>
                          </div>
                      ))}
                  </div>
              )}

          </div>

          {/* Main Content */}
          <div className="col-span-12 md:col-span-8 p-0 flex flex-col">
              
              {/* Marquee Effect (Static simulation) */}
              <div className="bg-black text-white font-mono text-xs py-1 px-2 overflow-hidden whitespace-nowrap">
                  *** WELCOME TO MY RESUME *** AVAILABLE FOR HIRE *** SCROLL DOWN ***
              </div>

              <div className="p-6 flex-1 overflow-y-auto">
                  
                  {/* Summary */}
                  {data.personal.summary && (
                      <section className="mb-10">
                          <p className="text-xl md:text-2xl font-bold leading-tight">
                              {data.personal.summary}
                          </p>
                      </section>
                  )}

                  {/* Experience Table Style */}
                  {data.experience.length > 0 && (
                      <section className="mb-10">
                          <h2 className="text-4xl font-black uppercase mb-6 bg-red-600 text-white inline-block px-2">Work_Log</h2>
                          <div className="border-4 border-black">
                              {data.experience.map((exp, idx) => (
                                  <div key={exp.id} className={`p-4 ${idx !== data.experience.length - 1 ? 'border-b-4 border-black' : ''} hover:bg-gray-100`}>
                                      <div className="flex flex-col md:flex-row justify-between md:items-center mb-2">
                                          <h3 className="text-2xl font-bold">{exp.role}</h3>
                                          <div className="font-mono text-sm font-bold bg-gray-200 px-2 border border-black">
                                              {exp.startDate} → {exp.endDate}
                                          </div>
                                      </div>
                                      <div className="text-blue-700 font-bold uppercase tracking-wider mb-2">{exp.company}</div>
                                      <p className="font-serif text-lg leading-relaxed">
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
                          <h2 className="text-4xl font-black uppercase mb-6 bg-green-600 text-white inline-block px-2">Index</h2>
                          <ul className="list-decimal list-inside space-y-4 font-mono text-sm">
                              {data.projects.map(proj => (
                                  <li key={proj.id} className="border-b-2 border-black pb-2">
                                      <span className="font-bold text-lg font-serif">"{proj.name}"</span> 
                                      <span className="ml-2 text-gray-600">-- {proj.description}</span>
                                      {proj.link && <a href={proj.link} className="block text-blue-600 underline mt-1">[Link]</a>}
                                  </li>
                              ))}
                          </ul>
                      </section>
                  )}

              </div>
          </div>

      </div>
    </div>
  );
};