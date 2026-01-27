import React from 'react';
import { CVData } from '../types';
import { Mail, Phone, MapPin, Globe, ExternalLink } from '../components/ui/Icons';

export const ModernTheme: React.FC<{ data: CVData }> = ({ data }) => {
  return (
    <div className="font-sans text-zinc-800 h-full flex flex-col md:flex-row print:flex-row h-full absolute inset-0">
      
      {/* Sidebar (Left) */}
      <div className="w-full md:w-1/3 print:w-1/3 bg-slate-900 text-white p-8 md:p-10 print:p-10 flex flex-col gap-8 h-full min-h-[297mm]">
        
        {/* Photo */}
        <div className="w-32 h-32 rounded-lg overflow-hidden border-2 border-slate-700 mx-auto md:mx-0 flex items-center justify-center bg-slate-800 text-slate-600 font-bold text-4xl">
            {data.personal.photo ? (
                <img src={data.personal.photo} alt="Profile" className="w-full h-full object-cover" />
            ) : (
                <span>{data.personal.fullName.charAt(0)}</span>
            )}
        </div>

        {/* Contact Info */}
        <div className="mt-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 border-b border-slate-700 pb-2">Contact</h3>
          <div className="space-y-3 text-sm text-slate-300">
            {data.personal.email && (
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-emerald-400" />
                <span className="break-all">{data.personal.email}</span>
              </div>
            )}
            {data.personal.phone && (
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-emerald-400" />
                <span>{data.personal.phone}</span>
              </div>
            )}
            {data.personal.location && (
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-emerald-400" />
                <span>{data.personal.location}</span>
              </div>
            )}
            {data.personal.website && (
              <div className="flex items-center gap-2">
                <Globe size={14} className="text-emerald-400" />
                <span className="break-all">{data.personal.website}</span>
              </div>
            )}
          </div>
        </div>

        {/* Education */}
        {data.education.length > 0 && (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 border-b border-slate-700 pb-2">Education</h3>
            <div className="space-y-5">
              {data.education.map((edu) => (
                <div key={edu.id}>
                  <div className="font-bold text-white text-sm">{edu.institution}</div>
                  <div className="text-xs text-emerald-400">{edu.degree}</div>
                  <div className="text-xs text-slate-500 mt-1">{edu.startDate} - {edu.endDate}</div>
                  <div className="text-xs text-slate-500">{edu.location}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills */}
        {data.skills.length > 0 && (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 border-b border-slate-700 pb-2">Skills</h3>
            <div className="flex flex-wrap gap-2">
              {data.skills.map((skill) => (
                <span 
                  key={skill.id} 
                  className="px-2 py-1 bg-slate-800 text-slate-200 text-xs rounded border border-slate-700"
                >
                  {skill.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Content (Right) */}
      <div className="flex-1 p-8 md:p-12 print:p-12 bg-white">
        
        {/* Header */}
        <header className="mb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-2 uppercase tracking-tight">
            {data.personal.fullName}
          </h1>
          <p className="text-xl text-emerald-600 font-medium tracking-wide">{data.personal.role}</p>
        </header>

        {/* Summary */}
        {data.personal.summary && (
          <section className="mb-10">
            <h2 className="text-lg font-bold uppercase tracking-wider text-slate-900 mb-4 flex items-center gap-2">
              <span className="w-8 h-1 bg-slate-900 block"></span>
              Profile
            </h2>
            <p className="text-slate-700 leading-relaxed text-sm">
              {data.personal.summary}
            </p>
          </section>
        )}

        {/* Experience */}
        {data.experience.length > 0 && (
          <section className="mb-10">
            <h2 className="text-lg font-bold uppercase tracking-wider text-slate-900 mb-6 flex items-center gap-2">
              <span className="w-8 h-1 bg-slate-900 block"></span>
              Experience
            </h2>
            <div className="space-y-8">
              {data.experience.map((exp) => (
                <div key={exp.id} className="group">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="font-bold text-slate-800 text-lg">{exp.role}</h3>
                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">
                       {exp.startDate} — {exp.current ? 'Present' : exp.endDate}
                    </span>
                  </div>
                  <div className="text-emerald-600 font-medium text-sm mb-2">{exp.company}</div>
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
            <h2 className="text-lg font-bold uppercase tracking-wider text-slate-900 mb-6 flex items-center gap-2">
              <span className="w-8 h-1 bg-slate-900 block"></span>
              Projects
            </h2>
            <div className="grid grid-cols-1 gap-6">
              {data.projects.map((proj) => (
                <div key={proj.id} className="border-l-2 border-emerald-500 pl-4">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-slate-900">{proj.name}</h4>
                    {proj.link && (
                      <a href={proj.link} target="_blank" rel="noreferrer" className="text-emerald-500 hover:text-emerald-700">
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {proj.description}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  );
};