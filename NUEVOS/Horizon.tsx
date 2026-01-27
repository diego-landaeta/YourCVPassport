import React from 'react';
import { CVData } from '../types';
import { Mail, Phone, MapPin, Globe, ExternalLink } from '../components/ui/Icons';

export const HorizonTheme: React.FC<{ data: CVData }> = ({ data }) => {
  return (
    <div className="font-sans text-slate-800 h-full bg-white p-12 md:p-16 flex flex-col">
      
      {/* Header */}
      <header className="flex justify-between items-start mb-12 border-b-4 border-slate-800 pb-8">
        <div className="flex-1 pr-8">
            <h1 className="text-5xl font-black tracking-tight uppercase text-slate-900 mb-2">{data.personal.fullName}</h1>
            <p className="text-xl text-slate-500 font-medium mb-6">{data.personal.role}</p>
            
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-bold text-slate-600">
                {data.personal.email && <div className="flex items-center gap-2"><Mail size={14}/> {data.personal.email}</div>}
                {data.personal.phone && <div className="flex items-center gap-2"><Phone size={14}/> {data.personal.phone}</div>}
                {data.personal.location && <div className="flex items-center gap-2"><MapPin size={14}/> {data.personal.location}</div>}
                {data.personal.website && <div className="flex items-center gap-2"><Globe size={14}/> {data.personal.website}</div>}
            </div>
        </div>
        
        {/* Photo Slot */}
        <div className="w-32 h-32 bg-slate-100 border-4 border-slate-800 flex-shrink-0 overflow-hidden flex items-center justify-center text-slate-300 text-4xl font-bold">
             {data.personal.photo ? (
                 <img src={data.personal.photo} className="w-full h-full object-cover" alt="Profile" />
             ) : (
                 <span>{data.personal.fullName.charAt(0)}</span>
             )}
        </div>
      </header>

      {/* Summary */}
      {data.personal.summary && (
          <section className="mb-12">
              <h3 className="text-lg font-bold uppercase text-slate-900 mb-4 flex items-center gap-2">
                  <span className="w-4 h-4 bg-slate-800"></span> Profile
              </h3>
              <p className="text-slate-600 leading-7 text-justify border-l-2 border-slate-200 pl-4">
                  {data.personal.summary}
              </p>
          </section>
      )}

      <div className="grid grid-cols-12 gap-12 flex-1">
          
          {/* Main Column */}
          <div className="col-span-8 space-y-12">
              
              {/* Experience */}
              {data.experience.length > 0 && (
                  <section>
                      <h3 className="text-lg font-bold uppercase text-slate-900 mb-6 flex items-center gap-2">
                          <span className="w-4 h-4 bg-slate-800"></span> Experience
                      </h3>
                      <div className="space-y-10">
                          {data.experience.map(exp => (
                              <div key={exp.id}>
                                  <div className="flex justify-between items-baseline border-b border-slate-200 pb-2 mb-3">
                                      <h4 className="text-xl font-bold text-slate-800">{exp.role}</h4>
                                      <span className="text-sm font-bold text-slate-500">{exp.startDate} - {exp.endDate}</span>
                                  </div>
                                  <div className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3">{exp.company}</div>
                                  <p className="text-sm text-slate-600 leading-relaxed">
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
                      <h3 className="text-lg font-bold uppercase text-slate-900 mb-6 flex items-center gap-2">
                          <span className="w-4 h-4 bg-slate-800"></span> Projects
                      </h3>
                      <div className="grid grid-cols-2 gap-6">
                          {data.projects.map(proj => (
                              <div key={proj.id} className="bg-slate-50 p-4 border border-slate-100">
                                  <div className="font-bold text-slate-900 mb-1 flex items-center gap-2">
                                      {proj.name}
                                      {proj.link && <ExternalLink size={12}/>}
                                  </div>
                                  <p className="text-xs text-slate-500">{proj.description}</p>
                              </div>
                          ))}
                      </div>
                  </section>
              )}

          </div>

          {/* Side Column */}
          <div className="col-span-4 space-y-12">
              
              {/* Education */}
              {data.education.length > 0 && (
                  <section>
                      <h3 className="text-lg font-bold uppercase text-slate-900 mb-6 flex items-center gap-2">
                          <span className="w-4 h-4 bg-slate-800"></span> Education
                      </h3>
                      <div className="space-y-6">
                          {data.education.map(edu => (
                              <div key={edu.id} className="border-l-4 border-slate-800 pl-4">
                                  <div className="font-bold text-slate-900">{edu.institution}</div>
                                  <div className="text-sm text-slate-500 italic">{edu.degree}</div>
                                  <div className="text-xs text-slate-400 mt-1">{edu.endDate}</div>
                              </div>
                          ))}
                      </div>
                  </section>
              )}

              {/* Skills */}
              {data.skills.length > 0 && (
                  <section>
                      <h3 className="text-lg font-bold uppercase text-slate-900 mb-6 flex items-center gap-2">
                          <span className="w-4 h-4 bg-slate-800"></span> Skills
                      </h3>
                      <div className="flex flex-col gap-2">
                          {data.skills.map(s => (
                              <div key={s.id} className="flex items-center justify-between text-sm font-medium text-slate-600 border-b border-dashed border-slate-200 pb-1">
                                  <span>{s.name}</span>
                                  <span className="text-xs text-slate-400">{s.level}</span>
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