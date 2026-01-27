import React from 'react';
import { CVData } from '../types';

export const CodeTheme: React.FC<{ data: CVData }> = ({ data }) => {
  return (
    <div className="font-mono text-[13px] text-[#d4d4d4] h-full bg-[#1e1e1e] flex overflow-hidden leading-relaxed">
      
      {/* Activity Bar */}
      <div className="w-12 bg-[#333333] flex flex-col items-center py-4 gap-4 border-r border-[#1e1e1e]">
        <div className="w-6 h-6 border-2 border-[#d4d4d4] opacity-50"></div>
        <div className="w-6 h-6 border-2 border-[#d4d4d4] opacity-50"></div>
        <div className="w-6 h-6 border-2 border-[#d4d4d4] opacity-100 border-l-4 border-l-white"></div>
        <div className="w-6 h-6 border-2 border-[#d4d4d4] opacity-50"></div>
      </div>

      {/* Sidebar (Explorer) */}
      <div className="w-64 bg-[#252526] flex flex-col border-r border-[#1e1e1e] pt-2">
        <div className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-[#bbbbbb] mb-2">Explorer</div>
        
        <div className="px-2">
            
            {/* Folder: Project */}
            <div className="flex items-center gap-1 text-[#d4d4d4] font-bold mb-1 cursor-default">
                <span className="transform rotate-90 text-[10px]">▶</span> PORTFOLIO
            </div>
            
             {/* Profile Photo as a "file" preview */}
            <div className="pl-4 mb-4 mt-2">
                <div className="w-20 h-20 bg-[#333] rounded overflow-hidden border border-[#444] flex items-center justify-center">
                    {data.personal.photo ? (
                        <img src={data.personal.photo} className="w-full h-full object-cover opacity-80" alt="profile.png" />
                    ) : (
                        <span className="text-xs text-gray-500">img_404</span>
                    )}
                </div>
                <div className="text-[10px] text-[#999] mt-1 ml-1">profile.png</div>
            </div>

            {/* Contact "Files" */}
            <div className="pl-4 flex flex-col gap-1 mb-4 text-[#cccccc]">
                 <div className="flex items-center gap-2 hover:bg-[#37373d] px-2 py-0.5 cursor-pointer">
                    <span className="text-[#569cd6] text-[10px]">TS</span> contact.ts
                 </div>
                 {data.personal.website && (
                    <div className="flex items-center gap-2 hover:bg-[#37373d] px-2 py-0.5 cursor-pointer">
                        <span className="text-[#e37933] text-[10px]">HTML</span> index.html
                    </div>
                 )}
            </div>

            {/* Skills as dependencies */}
            <div className="flex items-center gap-1 text-[#d4d4d4] font-bold mb-1 cursor-default">
                <span className="transform rotate-90 text-[10px]">▶</span> PACKAGE.JSON
            </div>
            <div className="pl-6 text-[#9cdcfe] mb-4">
                {`"dependencies": {`}
                <div className="pl-4 flex flex-col text-[#ce9178]">
                    {data.skills.map(s => (
                        <span key={s.id}>"{s.name}": <span className="text-[#b5cea8]">"^{s.level === 'Expert' ? '3.0.0' : s.level === 'Intermediate' ? '2.0.0' : '1.0.0'}"</span>,</span>
                    ))}
                </div>
                {`}`}
            </div>
            
             {/* Education */}
             {data.education.length > 0 && (
                 <>
                    <div className="flex items-center gap-1 text-[#d4d4d4] font-bold mb-1 cursor-default">
                        <span className="transform rotate-90 text-[10px]">▶</span> EDUCATION
                    </div>
                    <div className="pl-4 flex flex-col gap-1 text-[#cccccc]">
                        {data.education.map(edu => (
                            <div key={edu.id} className="hover:bg-[#37373d] px-2 py-0.5 cursor-pointer truncate">
                                🎓 {edu.institution}
                            </div>
                        ))}
                    </div>
                 </>
             )}
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col bg-[#1e1e1e]">
        
        {/* Tabs */}
        <div className="h-9 bg-[#2d2d2d] flex items-center">
            <div className="px-4 h-full bg-[#1e1e1e] border-t-2 border-[#569cd6] flex items-center gap-2 text-[#d4d4d4] text-xs">
                <span className="text-[#569cd6] text-[10px]">TS</span> {data.personal.fullName.replace(' ', '_').toLowerCase()}.tsx
                <span className="ml-2 hover:bg-[#333] rounded-sm px-1">×</span>
            </div>
            <div className="px-4 h-full bg-[#2d2d2d] flex items-center gap-2 text-[#969696] text-xs border-r border-[#1e1e1e]">
                <span className="text-[#d7ba7d] text-[10px]">{}</span> experience.json
            </div>
        </div>

        {/* Breadcrumbs */}
        <div className="h-6 flex items-center px-4 text-[11px] text-[#888888] gap-1 border-b border-[#333]">
            src <span className="text-[#bbb]">›</span> components <span className="text-[#bbb]">›</span> {data.personal.fullName}
        </div>

        {/* Code Area */}
        <div className="flex-1 p-4 overflow-hidden relative">
            
            {/* Line Numbers */}
            <div className="absolute left-0 top-4 bottom-0 w-10 text-right pr-3 text-[#858585] text-[13px] select-none">
                {Array.from({length: 40}, (_, i) => i + 1).map(n => <div key={n}>{n}</div>)}
            </div>

            <div className="pl-10">
                <div className="text-[#569cd6]">import <span className="text-[#9cdcfe]">React</span> from <span className="text-[#ce9178]">'react'</span>;</div>
                <div className="mb-4 text-[#569cd6]">import <span className="text-[#ce9178]">'./styles.css'</span>;</div>

                <div className="text-[#6a9955] italic">/**</div>
                <div className="text-[#6a9955] italic"> * {data.personal.role}</div>
                <div className="text-[#6a9955] italic"> * {data.personal.summary}</div>
                <div className="text-[#6a9955] italic"> * @contact {data.personal.email}</div>
                <div className="text-[#6a9955] italic"> */</div>
                
                <div className="mt-2">
                    <span className="text-[#569cd6]">export const</span> <span className="text-[#dcdcaa]">{data.personal.fullName.replace(/ /g, '')}</span> = () <span className="text-[#569cd6]">{`=>`}</span> {'{'}
                </div>

                {/* Experience Map */}
                <div className="pl-4 mt-2">
                    <span className="text-[#c586c0]">return</span> (
                    <div className="pl-4">
                        <span className="text-[#808080]">{`<>`}</span>
                        
                        {/* Render Experience */}
                         {data.experience.length > 0 && (
                            <div className="mt-2">
                                <span className="text-[#569cd6]">{`{`}</span><span className="text-[#9cdcfe]">experience</span>.<span className="text-[#dcdcaa]">map</span>( (<span className="text-[#9cdcfe]">job</span>) <span className="text-[#569cd6]">{`=>`}</span> (
                                <div className="pl-4 border-l border-[#404040] ml-2 my-2">
                                    <span className="text-[#808080]">{`<`}</span><span className="text-[#4ec9b0]">Job</span>
                                    <div className="pl-4">
                                        <span className="text-[#9cdcfe]">company</span>=<span className="text-[#ce9178]">"{data.experience[0].company}"</span>
                                    </div>
                                    <div className="pl-4">
                                        <span className="text-[#9cdcfe]">role</span>=<span className="text-[#ce9178]">"{data.experience[0].role}"</span>
                                    </div>
                                    <div className="pl-4">
                                        <span className="text-[#9cdcfe]">period</span>=<span className="text-[#ce9178]">"{data.experience[0].startDate} - {data.experience[0].endDate}"</span>
                                    </div>
                                    <span className="text-[#808080]">{`>`}</span>
                                    <div className="pl-4 text-[#ce9178]">
                                        {`"{data.experience[0].description}"`}
                                    </div>
                                    <span className="text-[#808080]">{`</`}</span><span className="text-[#4ec9b0]">Job</span><span className="text-[#808080]">{`>`}</span>
                                </div>
                                ))<span className="text-[#569cd6]">{`}`}</span>
                            </div>
                         )}
                         
                         {/* More Experience Placeholder if needed */}
                         {data.experience.length > 1 && (
                             <div className="text-[#6a9955] mt-2">// ... more history loaded from database</div>
                         )}

                         <div className="mt-2">
                            <span className="text-[#808080]">{`</>`}</span>
                        </div>
                    </div>
                    );
                </div>
                <div>{`}`}</div>
            </div>
        </div>

        {/* Status Bar */}
        <div className="h-6 bg-[#007acc] text-white flex items-center px-2 text-xs justify-between">
            <div className="flex gap-4">
                <div className="flex items-center gap-1"><span className="transform rotate-45">⑂</span> main*</div>
                <div className="flex items-center gap-1">0 errors</div>
            </div>
            <div className="flex gap-4">
                <div>Ln 42, Col 10</div>
                <div>UTF-8</div>
                <div>TypeScript React</div>
            </div>
        </div>
      </div>
    </div>
  );
};