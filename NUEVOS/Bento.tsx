import React from 'react';
import { CVData } from '../types';
import { Mail, Phone, MapPin, Globe, ArrowUpRight } from 'lucide-react';

export const BentoTheme: React.FC<{ data: CVData }> = ({ data }) => {
  return (
    <div className="font-sans text-slate-800 h-full bg-[#f2f2f7] p-8 md:p-10 flex flex-col">
      
      {/* Bento Grid Layout */}
      <div className="grid grid-cols-4 grid-rows-[auto_auto_1fr] gap-4 h-full">
          
          {/* 1. Profile Photo (Large Square) */}
          <div className="col-span-1 row-span-1 aspect-square bg-white rounded-[2rem] overflow-hidden shadow-sm relative group">
              {data.personal.photo ? (
                  <img src={data.personal.photo} alt="Profile" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              ) : (
                  <div className="w-full h-full bg-slate-200 flex items-center justify-center text-4xl font-bold text-slate-400">
                      {data.personal.fullName[0]}
                  </div>
              )}
          </div>

          {/* 2. Header / Name (Wide Rectangle) */}
          <div className="col-span-3 row-span-1 bg-white rounded-[2rem] shadow-sm p-8 flex flex-col justify-center">
              <h1 className="text-5xl font-bold tracking-tight text-slate-900 mb-2">{data.personal.fullName}</h1>
              <p className="text-xl text-slate-500 font-medium">{data.personal.role}</p>
          </div>

          {/* 3. Contact (Tall vertical) */}
          <div className="col-span-1 row-span-2 bg-slate-900 text-white rounded-[2rem] shadow-sm p-6 flex flex-col justify-between">
              <div>
                  <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center mb-6">
                      <Globe size={20} className="text-blue-400"/>
                  </div>
                  <h3 className="font-bold text-lg mb-4">Get in touch</h3>
                  <div className="space-y-4 text-sm font-medium text-slate-300">
                      {data.personal.email && <div className="flex flex-col"><span className="text-xs text-slate-500 uppercase">Email</span>{data.personal.email}</div>}
                      {data.personal.phone && <div className="flex flex-col"><span className="text-xs text-slate-500 uppercase">Phone</span>{data.personal.phone}</div>}
                      {data.personal.location && <div className="flex flex-col"><span className="text-xs text-slate-500 uppercase">Base</span>{data.personal.location}</div>}
                  </div>
              </div>
              
              {data.personal.website && (
                  <a href={data.personal.website} target="_blank" rel="noreferrer" className="mt-4 bg-blue-500 hover:bg-blue-600 transition-colors text-white py-3 px-4 rounded-xl text-center text-sm font-bold flex items-center justify-center gap-2">
                      Portfolio <ArrowUpRight size={16}/>
                  </a>
              )}
          </div>

          {/* 4. Experience (Large Central Block) */}
          <div className="col-span-3 row-span-1 bg-white rounded-[2rem] shadow-sm p-8 overflow-hidden">
              <h3 className="text-lg font-bold mb-6 text-slate-400 uppercase tracking-wider">Experience</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {data.experience.map(exp => (
                      <div key={exp.id} className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                          <div className="font-bold text-lg text-slate-900 mb-1">{exp.role}</div>
                          <div className="text-sm font-semibold text-blue-600 mb-3">{exp.company}</div>
                          <p className="text-sm text-slate-600 leading-relaxed line-clamp-4">
                              {exp.description}
                          </p>
                      </div>
                  ))}
              </div>
          </div>

          {/* 5. Summary (Medium Block) */}
          <div className="col-span-2 bg-white rounded-[2rem] shadow-sm p-8">
               <h3 className="text-lg font-bold mb-4 text-slate-400 uppercase tracking-wider">About</h3>
               {data.personal.summary && (
                   <p className="text-slate-700 leading-7 font-medium">
                       {data.personal.summary}
                   </p>
               )}
          </div>

          {/* 6. Skills & Education (Stacked) */}
          <div className="col-span-2 grid grid-rows-2 gap-4">
              
              {/* Skills */}
              <div className="bg-blue-500 text-white rounded-[2rem] shadow-sm p-6">
                  <h3 className="text-sm font-bold mb-4 opacity-80 uppercase tracking-wider">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                      {data.skills.map(s => (
                          <span key={s.id} className="bg-white/20 px-3 py-1 rounded-lg text-xs font-bold backdrop-blur-sm">
                              {s.name}
                          </span>
                      ))}
                  </div>
              </div>

              {/* Education */}
              <div className="bg-white rounded-[2rem] shadow-sm p-6 flex flex-col justify-center">
                   {data.education.length > 0 && (
                       <div>
                           <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Education</div>
                           <div className="font-bold text-slate-900">{data.education[0].institution}</div>
                           <div className="text-sm text-slate-500">{data.education[0].degree}</div>
                           <div className="text-xs text-slate-400 mt-1">{data.education[0].endDate}</div>
                       </div>
                   )}
              </div>

          </div>

      </div>
    </div>
  );
};