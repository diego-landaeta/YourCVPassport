import React from 'react';
import { CVData } from '../types';
import { Mail, Phone, MapPin, Globe } from '../components/ui/Icons';

export const ElementTheme: React.FC<{ data: CVData }> = ({ data }) => {
  return (
    <div className="font-sans text-gray-700 h-full bg-gray-100 p-8 md:p-10 flex flex-col gap-6">
      
      {/* Header Card */}
      <header className="bg-white p-8 rounded-2xl shadow-sm flex flex-col md:flex-row items-center gap-8">
          <div className="w-32 h-32 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden border-4 border-white shadow-md flex items-center justify-center text-gray-400 text-4xl font-bold">
              {data.personal.photo ? (
                  <img src={data.personal.photo} className="w-full h-full object-cover" alt="Profile" />
              ) : (
                  <span>{data.personal.fullName.charAt(0)}</span>
              )}
          </div>
          <div className="text-center md:text-left flex-1">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">{data.personal.fullName}</h1>
              <p className="text-xl text-indigo-500 font-medium mb-4">{data.personal.role}</p>
              
              <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-gray-500">
                  {data.personal.email && <div className="bg-gray-50 px-3 py-1 rounded-full border border-gray-200">{data.personal.email}</div>}
                  {data.personal.phone && <div className="bg-gray-50 px-3 py-1 rounded-full border border-gray-200">{data.personal.phone}</div>}
                  {data.personal.location && <div className="bg-gray-50 px-3 py-1 rounded-full border border-gray-200">{data.personal.location}</div>}
              </div>
          </div>
      </header>

      <div className="flex gap-6 flex-1">
          
          {/* Main Column */}
          <div className="flex-[2] flex flex-col gap-6">
              
              {/* Summary Card */}
              {data.personal.summary && (
                  <div className="bg-white p-8 rounded-2xl shadow-sm">
                      <h3 className="text-sm font-bold uppercase text-indigo-500 mb-4 tracking-wider">About Me</h3>
                      <p className="text-gray-600 leading-7">
                          {data.personal.summary}
                      </p>
                  </div>
              )}

              {/* Experience Card */}
              {data.experience.length > 0 && (
                  <div className="bg-white p-8 rounded-2xl shadow-sm flex-1">
                      <h3 className="text-sm font-bold uppercase text-indigo-500 mb-6 tracking-wider">Work Experience</h3>
                      <div className="space-y-8">
                          {data.experience.map(exp => (
                              <div key={exp.id} className="relative pl-6 border-l-2 border-indigo-100">
                                  <div className="absolute -left-[9px] top-0 w-4 h-4 bg-indigo-500 rounded-full border-4 border-white"></div>
                                  <div className="mb-2">
                                      <h4 className="text-lg font-bold text-gray-900">{exp.role}</h4>
                                      <div className="flex justify-between items-center">
                                          <span className="text-sm font-medium text-indigo-600">{exp.company}</span>
                                          <span className="text-xs text-gray-400 font-mono">{exp.startDate} - {exp.endDate}</span>
                                      </div>
                                  </div>
                                  <p className="text-sm text-gray-600 leading-relaxed">
                                      {exp.description}
                                  </p>
                              </div>
                          ))}
                      </div>
                  </div>
              )}

          </div>

          {/* Sidebar Column */}
          <div className="flex-1 flex flex-col gap-6">
              
              {/* Skills Card */}
              {data.skills.length > 0 && (
                  <div className="bg-indigo-600 text-white p-8 rounded-2xl shadow-sm">
                      <h3 className="text-sm font-bold uppercase text-indigo-200 mb-4 tracking-wider">Skills</h3>
                      <div className="flex flex-wrap gap-2">
                          {data.skills.map(s => (
                              <span key={s.id} className="bg-indigo-700 px-3 py-1.5 rounded-lg text-xs font-medium border border-indigo-500">
                                  {s.name}
                              </span>
                          ))}
                      </div>
                  </div>
              )}

              {/* Education Card */}
              {data.education.length > 0 && (
                  <div className="bg-white p-8 rounded-2xl shadow-sm flex-1">
                      <h3 className="text-sm font-bold uppercase text-indigo-500 mb-4 tracking-wider">Education</h3>
                      <div className="space-y-6">
                          {data.education.map(edu => (
                              <div key={edu.id} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                                  <div className="font-bold text-gray-900">{edu.institution}</div>
                                  <div className="text-sm text-gray-500">{edu.degree}</div>
                                  <div className="text-xs text-gray-400 mt-1">{edu.endDate}</div>
                              </div>
                          ))}
                      </div>
                  </div>
              )}

              {/* Website Card */}
              {data.personal.website && (
                  <div className="bg-white p-6 rounded-2xl shadow-sm flex items-center justify-center text-center">
                      <div>
                          <Globe className="w-6 h-6 text-gray-400 mx-auto mb-2"/>
                          <div className="text-sm font-bold text-indigo-600 underline truncate max-w-[150px]">
                              {data.personal.website}
                          </div>
                      </div>
                  </div>
              )}

          </div>

      </div>
    </div>
  );
};