import React from 'react';
import { CVData } from '../types';
import { Github, Globe, Mail } from '../components/ui/Icons';

export const TechTheme: React.FC<{ data: CVData }> = ({ data }) => {
  return (
    <div className="font-mono text-zinc-800 h-full p-8 md:p-12 text-sm">
      
      {/* Top Bar */}
      <div className="border-b-2 border-zinc-800 pb-6 mb-8 flex justify-between items-start">
        <div className="flex gap-6">
            <div className="w-24 h-24 border-2 border-zinc-800 p-1 flex-shrink-0 flex items-center justify-center bg-zinc-100">
                {data.personal.photo ? (
                    <img src={data.personal.photo} className="w-full h-full object-cover grayscale" alt="User" />
                ) : (
                    <span className="text-zinc-400 font-bold text-xs">[NO_IMG]</span>
                )}
            </div>
            <div>
                <h1 className="text-3xl font-bold tracking-tighter text-zinc-900">
                    {data.personal.fullName}
                </h1>
                <div className="text-zinc-600 mt-1 mb-2">{`> ${data.personal.role}`}</div>
                <div className="text-xs space-y-1">
                    {data.personal.email && <div>{data.personal.email}</div>}
                    {data.personal.website && <div>{data.personal.website}</div>}
                    {data.personal.location && <div>{data.personal.location}</div>}
                </div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        
        {/* Left Col */}
        <div className="col-span-8 space-y-8">
            {/* Experience */}
            {data.experience.length > 0 && (
            <section>
                <h3 className="text-xs font-bold uppercase bg-zinc-200 inline-block px-1 mb-4">Experience</h3>
                <div className="space-y-6">
                {data.experience.map((exp) => (
                    <div key={exp.id}>
                    <div className="flex justify-between font-bold mb-1">
                        <span>{exp.company}</span>
                        <span>[{exp.startDate} : {exp.current ? 'NOW' : exp.endDate}]</span>
                    </div>
                    <div className="text-zinc-600 mb-2 italic text-xs">{exp.role}</div>
                    <p className="text-xs leading-5 text-zinc-700">
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
                <h3 className="text-xs font-bold uppercase bg-zinc-200 inline-block px-1 mb-4">Deployments</h3>
                <div className="space-y-4">
                {data.projects.map((proj) => (
                    <div key={proj.id} className="border border-zinc-300 p-3 rounded-sm">
                        <div className="font-bold mb-1">{proj.name}</div>
                        <p className="text-xs text-zinc-600 mb-1">{proj.description}</p>
                        {proj.link && <a href={proj.link} className="text-[10px] text-blue-600 underline truncate block">{proj.link}</a>}
                    </div>
                ))}
                </div>
            </section>
            )}
        </div>

        {/* Right Col */}
        <div className="col-span-4 space-y-8">
            
            {/* Summary */}
             {data.personal.summary && (
            <section>
                <h3 className="text-xs font-bold uppercase bg-zinc-200 inline-block px-1 mb-4">Init</h3>
                <p className="text-xs leading-5 text-zinc-700">
                {data.personal.summary}
                </p>
            </section>
            )}

            {/* Skills */}
            {data.skills.length > 0 && (
            <section>
                <h3 className="text-xs font-bold uppercase bg-zinc-200 inline-block px-1 mb-4">Stack</h3>
                <div className="flex flex-col gap-1">
                {data.skills.map((skill) => (
                    <div key={skill.id} className="flex items-center gap-2">
                        <span className="text-zinc-400 text-[10px]">{`>>`}</span>
                        <span>{skill.name}</span>
                    </div>
                ))}
                </div>
            </section>
            )}

            {/* Education */}
            {data.education.length > 0 && (
            <section>
                <h3 className="text-xs font-bold uppercase bg-zinc-200 inline-block px-1 mb-4">Education</h3>
                <div className="space-y-4">
                {data.education.map((edu) => (
                    <div key={edu.id}>
                    <div className="font-bold">{edu.institution}</div>
                    <div className="text-xs text-zinc-600">{edu.degree}</div>
                    <div className="text-[10px] text-zinc-400">{edu.endDate}</div>
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