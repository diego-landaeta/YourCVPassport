import React from 'react';
import { CVData } from '../types';

export const CinematicTheme: React.FC<{ data: CVData }> = ({ data }) => {
  return (
    <div className="font-sans text-amber-50 h-full bg-[#0a0a0a] p-10 flex flex-col items-center justify-between text-center relative overflow-hidden">
      
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-64 bg-gradient-to-b from-blue-900/20 to-transparent pointer-events-none"></div>

      {/* Header (Title Treatment) */}
      <header className="relative z-10 mt-8 w-full flex flex-col items-center">
        <div className="w-32 h-40 mb-6 border-2 border-zinc-800 shadow-[0_0_20px_rgba(255,255,255,0.1)] overflow-hidden bg-zinc-900 flex items-center justify-center text-zinc-600 font-bold text-3xl">
            {data.personal.photo ? (
                <img src={data.personal.photo} alt="Star" className="w-full h-full object-cover" />
            ) : (
                <span>★</span>
            )}
        </div>
        <div className="text-xs font-bold tracking-[0.5em] text-blue-300 uppercase mb-2">The Professional Portfolio Of</div>
        <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-400 leading-[0.85] mb-4 scale-y-125">
            {data.personal.fullName}
        </h1>
        <div className="flex items-center justify-center gap-4 text-amber-500/80 font-bold uppercase tracking-widest text-sm">
            <span>{data.personal.role}</span>
            <span>★</span>
            <span>{data.personal.location}</span>
        </div>
      </header>

      {/* Main Block (Experience) */}
      <div className="flex-1 w-full max-w-2xl my-12 flex flex-col justify-center space-y-12">
        
        {data.personal.summary && (
            <div className="text-center">
                <p className="text-lg md:text-xl font-light leading-relaxed text-zinc-300 max-w-xl mx-auto">
                    "{data.personal.summary}"
                </p>
            </div>
        )}

        {data.experience.length > 0 && (
            <div className="space-y-6">
                <div className="text-xs uppercase tracking-[0.3em] text-zinc-500 border-b border-zinc-800 pb-2 mb-6">Featuring</div>
                {data.experience.map(exp => (
                    <div key={exp.id} className="group">
                        <div className="text-2xl font-bold uppercase text-amber-50 mb-1">{exp.role}</div>
                        <div className="text-blue-300 font-bold uppercase tracking-wider text-xs mb-2">{exp.company} • {exp.startDate}</div>
                        <p className="text-sm text-zinc-400 leading-5 max-w-lg mx-auto">
                            {exp.description}
                        </p>
                    </div>
                ))}
            </div>
        )}

      </div>

      {/* Footer (Credits Block) */}
      <div className="w-full text-[10px] text-zinc-500 font-medium uppercase tracking-widest leading-loose text-justify text-last-center border-t border-zinc-800 pt-8 max-w-3xl">
          
          <span className="text-zinc-300">SKILLS:</span> {data.skills.map(s => s.name).join(' • ')} 
          
          <span className="ml-4 text-zinc-300">EDUCATION:</span> {data.education.map(e => `${e.institution} (${e.degree})`).join(' • ')}
          
          <span className="ml-4 text-zinc-300">CONTACT:</span> {data.personal.email} • {data.personal.phone} • {data.personal.website}
          
          <br/><br/>
          <div className="text-center text-zinc-700 text-[8px]">
              PRODUCED IN {new Date().getFullYear()} • DISTRIBUTED BY VELVET CV • RATED E FOR EVERYONE
          </div>
      </div>

    </div>
  );
};