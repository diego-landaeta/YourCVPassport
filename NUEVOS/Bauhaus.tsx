import React from 'react';
import { CVData } from '../types';
import { ExternalLink } from '../components/ui/Icons';

export const BauhausTheme: React.FC<{ data: CVData }> = ({ data }) => {
  return (
    <div className="font-sans text-zinc-900 h-full p-8 md:p-12 bg-white flex flex-col h-full">
      
      {/* Top Grid */}
      <div className="grid grid-cols-12 border-4 border-black mb-0">
        
        {/* Name Block */}
        <div className="col-span-8 p-6 border-r-4 border-black bg-yellow-400 flex justify-between items-start">
            <div>
                <h1 className="text-5xl font-black tracking-tighter uppercase leading-[0.85] mb-2 break-words">
                    {data.personal.fullName}
                </h1>
                <div className="font-bold text-sm tracking-widest uppercase border-t-2 border-black pt-2 inline-block mt-2">
                    {data.personal.role}
                </div>
            </div>
            <div className="w-24 h-24 border-4 border-black bg-white flex-shrink-0 ml-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center font-black text-2xl">
                {data.personal.photo ? (
                    <img src={data.personal.photo} alt="Profile" className="w-full h-full object-cover grayscale contrast-125" />
                ) : (
                    <span>{data.personal.fullName.charAt(0)}</span>
                )}
            </div>
        </div>

        {/* Contact Block */}
        <div className="col-span-4 bg-white p-6 flex flex-col justify-center text-xs font-bold space-y-2">
            {data.personal.email && <div className="truncate">{data.personal.email}</div>}
            {data.personal.phone && <div>{data.personal.phone}</div>}
            {data.personal.location && <div>{data.personal.location}</div>}
            {data.personal.website && <div className="truncate underline">{data.personal.website}</div>}
        </div>
      </div>

      {/* Middle Grid */}
      <div className="flex-1 grid grid-cols-12 border-l-4 border-r-4 border-black min-h-0">
        
        {/* Sidebar (Left) */}
        <div className="col-span-4 border-r-4 border-black flex flex-col">
            
            {/* Skills Box */}
            {data.skills.length > 0 && (
                <div className="p-6 border-b-4 border-black bg-blue-500 text-white">
                    <h3 className="font-black uppercase text-xl mb-4 underline decoration-4 underline-offset-4">Skills</h3>
                    <ul className="text-sm font-bold space-y-2">
                        {data.skills.map(s => <li key={s.id} className="list-square ml-4">{s.name}</li>)}
                    </ul>
                </div>
            )}

            {/* Education Box */}
             {data.education.length > 0 && (
                <div className="p-6 bg-white flex-1">
                    <h3 className="font-black uppercase text-xl mb-4 underline decoration-4 underline-offset-4 decoration-yellow-400">Education</h3>
                    <div className="space-y-6">
                        {data.education.map(edu => (
                            <div key={edu.id}>
                                <div className="font-black text-sm">{edu.institution}</div>
                                <div className="text-xs font-medium italic">{edu.degree}</div>
                                <div className="text-xs mt-1 border border-black inline-block px-1">{edu.endDate}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>

        {/* Main Content (Right) */}
        <div className="col-span-8 bg-zinc-50 flex flex-col">
            
            {/* Summary */}
            {data.personal.summary && (
                <div className="p-8 border-b-4 border-black">
                     <p className="text-lg font-medium leading-tight">
                        {data.personal.summary}
                     </p>
                </div>
            )}

            {/* Experience */}
            {data.experience.length > 0 && (
                <div className="p-8 flex-1">
                    <h3 className="font-black uppercase text-4xl mb-8 text-stroke-1 text-transparent bg-clip-text bg-black" style={{ WebkitTextStroke: '1px black' }}>
                        Experience
                    </h3>
                    
                    <div className="space-y-8">
                        {data.experience.map(exp => (
                            <div key={exp.id} className="relative pl-6 border-l-4 border-black">
                                <div className="absolute -left-[10px] top-0 w-4 h-4 bg-red-500 border-2 border-black"></div>
                                <h4 className="font-black text-xl leading-none mb-1">{exp.role}</h4>
                                <div className="text-sm font-bold uppercase mb-2">
                                    {exp.company} <span className="bg-black text-white px-1 ml-1">{exp.startDate.split(' ')[1] || exp.startDate} - {exp.current ? 'NOW' : exp.endDate.split(' ')[1] || exp.endDate}</span>
                                </div>
                                <p className="text-sm font-medium leading-relaxed">
                                    {exp.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

        </div>
      </div>

      {/* Footer Grid */}
      {data.projects.length > 0 && (
          <div className="border-4 border-black border-t-0 p-6 bg-red-500 text-white">
               <h3 className="font-black uppercase text-xl mb-4">Projects</h3>
               <div className="grid grid-cols-2 gap-4">
                   {data.projects.map(proj => (
                       <div key={proj.id} className="bg-white text-black p-3 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                           <div className="font-bold uppercase text-sm flex items-center gap-2">
                               {proj.name}
                               {proj.link && <ExternalLink size={12}/>}
                           </div>
                           <div className="text-xs mt-1">{proj.description}</div>
                       </div>
                   ))}
               </div>
          </div>
      )}
      
      {/* Decorative Bottom if no projects */}
      {data.projects.length === 0 && (
          <div className="h-4 border-4 border-black border-t-0 bg-black pattern-diagonal-lines"></div>
      )}

    </div>
  );
};