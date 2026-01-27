import React from 'react';
import { CVData } from '../types';
import { Mail, Phone, MapPin, Globe, ShieldCheck, Briefcase, GraduationCap, LayoutTemplate, ExternalLink } from '../components/ui/Icons';

export const ClassicTheme: React.FC<{ data: CVData }> = ({ data }) => {
  return (
    <div className="font-sans text-slate-800 h-full bg-slate-50 min-h-[297mm]">
        
        {/* Hero Card Header */}
        <div className="bg-[#111827] text-white p-12 pb-16 relative overflow-hidden print:bg-[#111827] print:text-white">
            
            {/* Background Glow Effect */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-4xl bg-blue-900/20 blur-[100px] rounded-full pointer-events-none"></div>

            <div className="relative z-10 flex flex-col items-center text-center">
                {/* Avatar */}
                <div className="w-36 h-36 rounded-full p-1.5 bg-[#1f2937] border border-slate-700 mb-6 shadow-2xl">
                    <div className="w-full h-full rounded-full overflow-hidden bg-slate-800 flex items-center justify-center">
                        {data.personal.photo ? (
                            <img src={data.personal.photo} className="w-full h-full object-cover" alt={data.personal.fullName} />
                        ) : (
                            <span className="text-5xl text-slate-600 font-bold">{data.personal.fullName.charAt(0)}</span>
                        )}
                    </div>
                </div>
                
                {/* Name */}
                <h1 className="text-4xl md:text-5xl font-bold mb-3 tracking-tight text-white">
                    {data.personal.fullName}
                </h1>
                
                {/* Role */}
                <p className="text-lg md:text-xl text-blue-400 font-medium mb-6 max-w-3xl leading-relaxed">
                    {data.personal.role}
                </p>
                
                {/* Location Pill */}
                {data.personal.location && (
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-300 bg-[#1f2937]/80 backdrop-blur-sm px-5 py-2 rounded-full border border-white/10 mb-8">
                        <MapPin size={16} className="text-red-500" />
                        <span>{data.personal.location}</span>
                    </div>
                )}

                {/* Primary Action */}
                {data.personal.email && (
                    <a 
                        href={`mailto:${data.personal.email}`} 
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-lg font-semibold transition-all shadow-lg shadow-blue-900/50 hover:shadow-blue-900/70 hover:-translate-y-0.5 print:hidden"
                    >
                        <Mail size={18} />
                        <span>Send Message</span>
                    </a>
                )}
                
                {/* Print Only Contact */}
                <div className="hidden print:flex gap-6 mt-4 text-sm text-slate-400">
                    {data.personal.email && <span>{data.personal.email}</span>}
                    {data.personal.phone && <span>{data.personal.phone}</span>}
                    {data.personal.website && <span>{data.personal.website}</span>}
                </div>

                {/* Secondary Contact Info (Web/Phone) */}
                <div className="flex flex-wrap justify-center gap-6 mt-10 text-sm font-medium text-slate-400 print:hidden">
                    {data.personal.phone && (
                        <div className="flex items-center gap-2 hover:text-white transition-colors">
                            <Phone size={16} className="text-slate-500" /> 
                            {data.personal.phone}
                        </div>
                    )}
                    {data.personal.website && (
                        <div className="flex items-center gap-2 hover:text-white transition-colors">
                            <Globe size={16} className="text-slate-500" /> 
                            {data.personal.website}
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Content Body */}
        <div className="max-w-5xl mx-auto p-10 md:p-14 grid grid-cols-1 md:grid-cols-12 gap-12 bg-white -mt-4 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.05)] relative z-20 min-h-[500px]">
            
            {/* Sidebar (Skills & Profile) */}
            <div className="md:col-span-4 space-y-12">
                {data.personal.summary && (
                    <section>
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <span className="w-8 h-[2px] bg-blue-600"></span> Profile
                        </h3>
                        <p className="text-sm text-slate-600 leading-7 text-justify">
                            {data.personal.summary}
                        </p>
                    </section>
                )}

                {data.skills.length > 0 && (
                    <section>
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <span className="w-8 h-[2px] bg-blue-600"></span> Skills
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {data.skills.map(skill => (
                                <span key={skill.id} className="bg-slate-50 text-slate-700 px-3 py-1.5 rounded-md text-sm font-medium border border-slate-100">
                                    {skill.name}
                                </span>
                            ))}
                        </div>
                    </section>
                )}

                {data.education.length > 0 && (
                    <section>
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <span className="w-8 h-[2px] bg-blue-600"></span> Education
                        </h3>
                        <div className="space-y-6">
                            {data.education.map(edu => (
                                <div key={edu.id} className="group">
                                    <h4 className="font-bold text-slate-900">{edu.institution}</h4>
                                    <div className="text-sm text-blue-600 font-medium mb-1">{edu.degree}</div>
                                    <div className="text-xs text-slate-400">{edu.endDate} • {edu.location}</div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </div>

            {/* Main (Experience & Projects) */}
            <div className="md:col-span-8 space-y-12">
                {data.experience.length > 0 && (
                    <section>
                        <h3 className="text-xl font-bold text-slate-900 mb-8 flex items-center gap-3">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Briefcase size={20}/></div>
                            Work Experience
                        </h3>
                        <div className="space-y-10 border-l-2 border-slate-100 pl-8 ml-3">
                            {data.experience.map(exp => (
                                <div key={exp.id} className="relative group">
                                    <div className="absolute -left-[39px] top-1.5 h-4 w-4 rounded-full bg-white border-4 border-blue-600 shadow-sm transition-transform group-hover:scale-110"></div>
                                    <div className="mb-2">
                                        <h4 className="text-xl font-bold text-slate-800">{exp.role}</h4>
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                                            <span className="text-blue-600 font-semibold">{exp.company}</span>
                                            <span className="text-xs text-slate-400 font-medium bg-slate-50 px-2 py-0.5 rounded">
                                                {exp.startDate} – {exp.endDate}
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-slate-600 leading-relaxed text-sm">
                                        {exp.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {data.projects.length > 0 && (
                    <section>
                        <h3 className="text-xl font-bold text-slate-900 mb-8 flex items-center gap-3">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><LayoutTemplate size={20}/></div>
                            Featured Projects
                        </h3>
                        <div className="grid grid-cols-1 gap-6">
                            {data.projects.map(proj => (
                                <div key={proj.id} className="bg-slate-50 p-6 rounded-xl border border-slate-100 hover:border-blue-200 transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-slate-900 text-lg">{proj.name}</h4>
                                        {proj.link && <ExternalLink size={16} className="text-slate-400 hover:text-blue-600" />}
                                    </div>
                                    <p className="text-sm text-slate-600 leading-relaxed">{proj.description}</p>
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