import React from 'react';
import { CVData } from '../types';
import { Mail, Link } from 'lucide-react';

export const NewsletterTheme: React.FC<{ data: CVData }> = ({ data }) => {
  return (
    <div className="font-sans text-zinc-900 h-full bg-white p-8 md:p-12 flex flex-col items-center">
      
      <div className="max-w-xl w-full">
        
        {/* Navbar-ish Header */}
        <header className="mb-12 border-b border-zinc-100 pb-6 flex justify-between items-center">
            <div className="font-bold text-xl tracking-tight flex items-center gap-2">
                 {data.personal.photo ? (
                    <div className="w-8 h-8 rounded-md overflow-hidden">
                        <img src={data.personal.photo} className="w-full h-full object-cover" alt="Author" />
                    </div>
                 ) : (
                    <div className="w-8 h-8 bg-orange-500 rounded-md flex items-center justify-center text-white font-serif italic font-bold">
                        {data.personal.fullName[0]}
                    </div>
                 )}
                <span>{data.personal.fullName.split(' ')[0]}'s Notes</span>
            </div>
            {data.personal.website && <div className="text-xs text-zinc-400 bg-zinc-50 px-3 py-1 rounded-full">Subscribe</div>}
        </header>

        {/* Hero Title */}
        <div className="mb-10">
            <div className="text-sm font-medium text-orange-600 mb-2 uppercase tracking-wide">Issue #{new Date().getMonth() + 1}</div>
            <h1 className="text-4xl font-black tracking-tight mb-4 leading-tight">
                Hello, I'm {data.personal.fullName}. <br/>
                <span className="text-zinc-400">I work as a {data.personal.role}.</span>
            </h1>
            <div className="flex items-center gap-4 text-sm text-zinc-500 border-l-2 border-orange-500 pl-4">
                 {data.personal.location && <span>{data.personal.location}</span>}
                 <span>•</span>
                 {data.personal.email && <span className="underline decoration-orange-200 decoration-2">{data.personal.email}</span>}
            </div>
        </div>

        {/* Content Body */}
        <div className="space-y-12 text-lg leading-relaxed text-zinc-800">
            
            {/* Summary */}
            {data.personal.summary && (
                <section>
                    <p>{data.personal.summary}</p>
                </section>
            )}

            {/* Experience */}
            {data.experience.length > 0 && (
                <section>
                    <h2 className="text-2xl font-bold mb-6 mt-8">What I've been working on</h2>
                    <div className="space-y-8">
                        {data.experience.map(exp => (
                            <div key={exp.id} className="bg-zinc-50 p-6 rounded-2xl border border-zinc-100">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-xl">{exp.company}</h3>
                                    <span className="text-xs bg-white border border-zinc-200 px-2 py-1 rounded-full text-zinc-500">
                                        {exp.startDate} - {exp.current ? 'Now' : exp.endDate}
                                    </span>
                                </div>
                                <div className="text-orange-600 font-medium text-sm mb-3">{exp.role}</div>
                                <p className="text-base text-zinc-600">
                                    {exp.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Skills & Tools */}
            {data.skills.length > 0 && (
                <section>
                    <h2 className="text-2xl font-bold mb-6">My Stack</h2>
                    <div className="flex flex-wrap gap-2">
                        {data.skills.map(s => (
                            <span key={s.id} className="bg-white border-2 border-zinc-100 px-3 py-1.5 rounded-lg text-sm font-bold text-zinc-700 hover:border-orange-200 transition-colors cursor-default">
                                {s.name}
                            </span>
                        ))}
                    </div>
                </section>
            )}

            {/* Projects */}
            {data.projects.length > 0 && (
                <section>
                    <h2 className="text-2xl font-bold mb-6">Side Projects</h2>
                    <ul className="space-y-4">
                        {data.projects.map(proj => (
                            <li key={proj.id} className="flex gap-4 items-start group">
                                <div className="mt-1.5 w-2 h-2 rounded-full bg-orange-400 group-hover:scale-125 transition-transform"></div>
                                <div>
                                    <div className="font-bold text-lg underline decoration-zinc-200 underline-offset-4 group-hover:decoration-orange-300">
                                        {proj.name}
                                    </div>
                                    <p className="text-base text-zinc-600 mt-1">{proj.description}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

        </div>

        {/* Footer */}
        <footer className="mt-20 pt-10 border-t border-zinc-100 text-center text-sm text-zinc-400 pb-10">
            <p>© {new Date().getFullYear()} {data.personal.fullName}. All rights reserved.</p>
            <div className="mt-2 flex justify-center gap-4">
                {data.personal.website && <a href={`https://${data.personal.website}`} className="hover:text-orange-500">Website</a>}
                {data.personal.email && <a href={`mailto:${data.personal.email}`} className="hover:text-orange-500">Email</a>}
            </div>
        </footer>

      </div>
    </div>
  );
};