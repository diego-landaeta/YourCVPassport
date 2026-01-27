import React from 'react';
import { CVData } from '../types';

export const ReceiptTheme: React.FC<{ data: CVData }> = ({ data }) => {
  return (
    <div className="font-mono text-zinc-900 h-full bg-[#eee] p-8 flex justify-center items-start overflow-y-auto">
      
      {/* The Receipt Paper */}
      <div className="bg-white w-full max-w-[80mm] min-h-full shadow-xl p-6 relative text-xs leading-relaxed">
        
        {/* Jagged Top (CSS trick) */}
        <div className="absolute top-0 left-0 w-full h-2 bg-[#eee]" style={{ clipPath: 'polygon(0% 0%, 5% 100%, 10% 0%, 15% 100%, 20% 0%, 25% 100%, 30% 0%, 35% 100%, 40% 0%, 45% 100%, 50% 0%, 55% 100%, 60% 0%, 65% 100%, 70% 0%, 75% 100%, 80% 0%, 85% 100%, 90% 0%, 95% 100%, 100% 0%)'}}></div>
        
        {/* Header */}
        <div className="text-center mb-6 mt-4 flex flex-col items-center">
            <div className="w-16 h-16 bg-black rounded-full overflow-hidden mb-4 border-2 border-black flex items-center justify-center text-white font-bold text-xl">
                {data.personal.photo ? (
                    <img src={data.personal.photo} alt="Logo" className="w-full h-full object-cover grayscale" />
                ) : (
                    <span>{data.personal.fullName.charAt(0)}</span>
                )}
            </div>
            <h1 className="text-2xl font-bold uppercase mb-1">{data.personal.fullName}</h1>
            <div className="uppercase tracking-widest text-[10px] mb-4">*** {data.personal.role} ***</div>
            
            <div className="space-y-1 text-[10px]">
                {data.personal.email && <div>E: {data.personal.email}</div>}
                {data.personal.phone && <div>T: {data.personal.phone}</div>}
                {data.personal.location && <div>L: {data.personal.location}</div>}
                <div className="mt-2">{new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</div>
                <div>TRANSACTION #: {data.id.split('-')[0].toUpperCase()}</div>
            </div>
        </div>

        {/* Divider */}
        <div className="border-b border-dashed border-black mb-4"></div>
        
        {/* Experience as Items */}
        {data.experience.length > 0 && (
            <div className="mb-6">
                <div className="flex justify-between font-bold mb-2 uppercase text-[10px]">
                    <span>Item (Experience)</span>
                    <span>Yrs</span>
                </div>
                {data.experience.map(exp => (
                    <div key={exp.id} className="mb-4">
                        <div className="flex justify-between font-bold">
                            <span className="uppercase">{exp.company}</span>
                            <span>{exp.startDate.split(' ')[1] || '20XX'}</span>
                        </div>
                        <div className="italic mb-1">&gt; {exp.role}</div>
                        <div className="text-[10px] text-zinc-600 leading-tight pl-2 border-l border-zinc-300">
                            {exp.description.substring(0, 150)}{exp.description.length > 150 && '...'}
                        </div>
                    </div>
                ))}
            </div>
        )}

        <div className="border-b border-dashed border-black mb-4"></div>

        {/* Education */}
        {data.education.length > 0 && (
            <div className="mb-6">
                <div className="font-bold mb-2 uppercase text-[10px] text-center">--- EDUCATION ---</div>
                {data.education.map(edu => (
                    <div key={edu.id} className="mb-2 text-center">
                        <div className="font-bold">{edu.institution}</div>
                        <div className="text-[10px]">{edu.degree}</div>
                    </div>
                ))}
            </div>
        )}

        <div className="border-b border-dashed border-black mb-4"></div>

        {/* Skills as Extras */}
        {data.skills.length > 0 && (
            <div className="mb-6">
                <div className="font-bold mb-2 uppercase text-[10px]">EXTRAS (SKILLS)</div>
                <div className="flex flex-wrap gap-x-2 gap-y-1">
                    {data.skills.map(s => (
                        <span key={s.id}>{s.name.toUpperCase()} ... 1</span>
                    ))}
                </div>
            </div>
        )}

        {/* Footer */}
        <div className="border-t border-dashed border-black pt-4 text-center space-y-4">
            <div className="uppercase font-bold text-lg">TOTAL: HIRED</div>
            <div className="text-[10px]">
                THANK YOU FOR YOUR BUSINESS!<br/>
                PLEASE RETAIN FOR YOUR RECORDS.
            </div>
            
            {/* Fake Barcode */}
            <div className="h-12 w-3/4 mx-auto flex items-end justify-between gap-[1px]">
                {[...Array(40)].map((_, i) => (
                    <div key={i} className="bg-black w-full" style={{ height: Math.random() > 0.5 ? '100%' : '80%'}}></div>
                ))}
            </div>
            <div className="text-[10px] tracking-[0.5em]">{data.id.split('-').join('').substring(0,12).toUpperCase()}</div>
        </div>

         {/* Jagged Bottom */}
         <div className="absolute bottom-0 left-0 w-full h-2 bg-[#eee]" style={{ clipPath: 'polygon(0% 100%, 5% 0%, 10% 100%, 15% 0%, 20% 100%, 25% 0%, 30% 100%, 35% 0%, 40% 100%, 45% 0%, 50% 100%, 55% 0%, 60% 100%, 65% 0%, 70% 100%, 75% 0%, 80% 100%, 85% 0%, 90% 100%, 95% 0%, 100% 100%)'}}></div>

      </div>
    </div>
  );
};