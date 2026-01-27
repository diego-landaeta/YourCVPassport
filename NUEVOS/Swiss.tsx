import React from 'react';
import { CVData } from '../types';
import { Mail, Phone, MapPin, Globe, ExternalLink, ShieldCheck } from '../components/ui/Icons';

export const SwissTheme: React.FC<{ data: CVData }> = ({ data }) => {
  return (
    <div className="font-sans text-zinc-800 h-full">
      {/* Header Section */}
      <header className="mb-12 border-b border-zinc-900 pb-8 flex justify-between items-start">
        <div>
            <h1 className="text-5xl font-serif font-bold tracking-tight text-zinc-900 mb-2 leading-none flex items-center gap-3">
              {data.personal.fullName}
              {data.personal.verified && <ShieldCheck className="w-8 h-8 text-blue-500" />}
            </h1>
            <p className="text-xl text-zinc-500 font-light tracking-wide mb-6">{data.personal.role}</p>
            
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
            {data.personal.email && (
                <div className="flex items-center gap-1.5 hover:text-zinc-900 transition-colors">
                <Mail size={12} />
                <span>{data.personal.email}</span>
                </div>
            )}
            {data.personal.phone && (
                <div className="flex items-center gap-1.5">
                <Phone size={12} />
                <span>{data.personal.phone}</span>
                </div>
            )}
            {data.personal.location && (
                <div className="flex items-center gap-1.5">
                <MapPin size={12} />
                <span>{data.personal.location}</span>
                </div>
            )}
            {data.personal.website && (
                <div className="flex items-center gap-1.5 hover:text-zinc-900 transition-colors">
                <Globe size={12} />
                <span>{data.personal.website}</span>
                </div>
            )}
            </div>
        </div>
        
        <div className="w-32 h-32 bg-zinc-100 rounded-full overflow-hidden flex-shrink-0 border border-zinc-200 flex items-center justify-center text-zinc-300 font-bold text-3xl">
            {data.personal.photo ? (
                <img src={data.personal.photo} alt={data.personal.fullName} className="w-full h-full object-cover" />
            ) : (
                <span>{data.personal.fullName.charAt(0)}</span>
            )}
        </div>
      </header>

      <div className="grid grid-cols-12 gap-8 print:gap-6">
        
        {/* Main Content Column */}
        <div className="col-span-12 md:col-span-8 print:col-span-8 space-y-10">
          
          {/* Summary */}
          {data.personal.summary && (
            <section>
              <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4">Profile</h3>
              <p className="text-sm leading-relaxed text-zinc-700 whitespace-pre-wrap">
                {data.personal.summary}
              </p>
            </section>
          )}

          {/* Experience */}
          {data.experience.length > 0 && (
            <section>
              <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-6">Experience</h3>
              <div className="space-y-8">
                {data.experience.map((exp) => (
                  <div key={exp.id} className="relative pl-4 border-l-2 border-zinc-100 group">
                    <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-zinc-200 group-hover:bg-zinc-400 transition-colors"></div>
                    <div className="flex flex-col sm:flex-row sm:items-baseline justify-between mb-1">
                      <h4 className="font-bold text-zinc-900">{exp.role}</h4>
                      <span className="text-xs text-zinc-500 font-medium tabular-nums">
                        {exp.startDate} — {exp.current ? 'Present' : exp.endDate}
                      </span>
                    </div>
                    <div className="text-sm font-medium text-zinc-600 mb-2">{exp.company}</div>
                    <p className="text-sm text-zinc-600 leading-relaxed whitespace-pre-wrap">
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
              <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-6">Projects</h3>
              <div className="grid grid-cols-1 gap-6">
                {data.projects.map((proj) => (
                  <div key={proj.id}>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-zinc-900">{proj.name}</h4>
                      {proj.link && (
                        <a href={proj.link} target="_blank" rel="noreferrer" className="text-zinc-400 hover:text-indigo-600">
                          <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                    <p className="text-sm text-zinc-600 leading-relaxed">
                      {proj.description}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar Column */}
        <div className="col-span-12 md:col-span-4 print:col-span-4 space-y-10">
          
          {/* Education */}
          {data.education.length > 0 && (
            <section>
              <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-6">Education</h3>
              <div className="space-y-6">
                {data.education.map((edu) => (
                  <div key={edu.id}>
                    <h4 className="font-bold text-zinc-900 text-sm">{edu.institution}</h4>
                    <div className="text-sm text-zinc-600 mb-1">{edu.degree}</div>
                    <div className="flex justify-between items-center text-xs text-zinc-400">
                      <span>{edu.endDate}</span>
                      <span>{edu.location}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Skills */}
          {data.skills.length > 0 && (
            <section>
              <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-6">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {data.skills.map((skill) => (
                  <span 
                    key={skill.id} 
                    className="px-3 py-1 bg-zinc-100 text-zinc-700 text-xs font-medium rounded-full border border-zinc-200"
                  >
                    {skill.name}
                  </span>
                ))}
              </div>
            </section>
          )}

        </div>
      </div>
    </div>
  );
};