import React from 'react';
import { CVData } from '../types';
import { Mail, Phone, MapPin } from '../components/ui/Icons';

export const ExecutiveTheme: React.FC<{ data: CVData }> = ({ data }) => {
  return (
    <div className="font-sans text-slate-800 h-full bg-white">
      
      {/* Header Bar */}
      <header className="bg-slate-900 text-white p-10 md:p-14 flex justify-between items-center gap-8">
        <div>
            <h1 className="text-4xl font-serif font-bold tracking-wide mb-2">
            {data.personal.fullName}
            </h1>
            <p className="text-lg text-slate-300 font-medium tracking-wider uppercase text-sm mb-6">{data.personal.role}</p>
            
            <div className="flex flex-wrap gap-6 text-xs text-slate-400">
            {data.personal.email && (
                <div className="flex items-center gap-2">
                <Mail size={12} />
                <span>{data.personal.email}</span>
                </div>
            )}
            {data.personal.phone && (
                <div className="flex items-center gap-2">
                <Phone size={12} />
                <span>{data.personal.phone}</span>
                </div>
            )}
            {data.personal.location && (
                <div className="flex items-center gap-2">
                <MapPin size={12} />
                <span>{data.personal.location}</span>
                </div>
            )}
            </div>
        </div>
        
        <div className="w-24 h-24 rounded-full border-4 border-slate-700 overflow-hidden flex-shrink-0 bg-slate-800 flex items-center justify-center text-slate-500 font-bold text-2xl">
            {data.personal.photo ? (
                <img src={data.personal.photo} className="w-full h-full object-cover" alt="Profile" />
            ) : (
                <span>{data.personal.fullName.charAt(0)}</span>
            )}
        </div>
      </header>

      <div className="p-10 md:p-14 grid grid-cols-1 md:grid-cols-3 gap-10">
        
        {/* Main Content */}
        <div className="md:col-span-2 space-y-8">
            {/* Summary */}
            {data.personal.summary && (
                <section>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest border-b-2 border-slate-200 pb-2 mb-4">Executive Profile</h3>
                    <p className="text-sm text-slate-600 leading-relaxed text-justify">
                        {data.personal.summary}
                    </p>
                </section>
            )}

            {/* Experience */}
            {data.experience.length > 0 && (
                <section>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest border-b-2 border-slate-200 pb-2 mb-6">Experience</h3>
                    <div className="space-y-6">
                        {data.experience.map((exp) => (
                        <div key={exp.id}>
                            <div className="flex justify-between items-baseline mb-1">
                                <h4 className="font-bold text-slate-800">{exp.company}</h4>
                                <span className="text-xs font-bold text-slate-500">
                                    {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
                                </span>
                            </div>
                            <div className="text-sm text-blue-800 font-medium mb-2">{exp.role}</div>
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
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest border-b-2 border-slate-200 pb-2 mb-6">Key Projects</h3>
                    <div className="grid grid-cols-1 gap-4">
                        {data.projects.map((proj) => (
                        <div key={proj.id} className="bg-slate-50 p-4 rounded border-l-4 border-slate-900">
                            <h4 className="font-bold text-slate-800 text-sm mb-1">{proj.name}</h4>
                             <p className="text-xs text-slate-600">
                                {proj.description}
                            </p>
                        </div>
                        ))}
                    </div>
                </section>
            )}
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
            
             {/* Skills */}
             {data.skills.length > 0 && (
                <section>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest border-b-2 border-slate-200 pb-2 mb-4">Competencies</h3>
                    <div className="flex flex-wrap gap-2">
                        {data.skills.map((skill) => (
                        <span key={skill.id} className="text-xs font-medium text-slate-700 bg-slate-100 px-3 py-1.5 rounded-full">
                            {skill.name}
                        </span>
                        ))}
                    </div>
                </section>
            )}

            {/* Education */}
            {data.education.length > 0 && (
                <section>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest border-b-2 border-slate-200 pb-2 mb-4">Education</h3>
                    <div className="space-y-4">
                        {data.education.map((edu) => (
                        <div key={edu.id}>
                            <h4 className="font-bold text-slate-800 text-sm">{edu.institution}</h4>
                            <div className="text-xs text-slate-600 italic">{edu.degree}</div>
                            <div className="text-xs text-slate-400 mt-1">{edu.location}</div>
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