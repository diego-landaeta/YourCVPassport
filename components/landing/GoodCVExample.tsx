import React from 'react';

// Componente que muestra un CV bien formateado usando una de nuestras plantillas
const GoodCVExample: React.FC = () => {
    return (
        <div className="w-full min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
            {/* Premium Header */}
            <header className="relative bg-white dark:bg-gray-800 shadow-lg overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-5"></div>
                <div className="relative px-8 py-10">
                    <div className="flex items-start gap-6">
                        {/* Avatar */}
                        <div className="relative">
                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white text-3xl font-bold shadow-2xl">
                                JD
                            </div>
                            <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-green-400 to-green-600 text-white rounded-full p-1 shadow-lg">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1">
                            <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-2">
                                John Doe
                            </h1>
                            <p className="text-xl text-gray-600 dark:text-gray-300 font-medium mb-3">
                                Senior Software Engineer
                            </p>
                            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-4">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span className="font-medium">Springfield, IL</span>
                            </div>

                            {/* Contact Buttons */}
                            <div className="flex gap-3">
                                <button className="inline-flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg text-sm">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    Contact
                                </button>
                                <button className="inline-flex items-center gap-2 px-5 py-2 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-xl font-semibold shadow-md text-sm">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Download
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="p-8">
                <div className="grid grid-cols-3 gap-6">
                    {/* Main Column */}
                    <div className="col-span-2 space-y-6">
                        {/* About */}
                        <section className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border-l-4 border-blue-500">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                    </svg>
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Professional Summary</h2>
                            </div>
                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                                Results-driven Software Engineer with 10+ years of experience building scalable applications. Specialized in full-stack development, cloud architecture, and agile methodologies.
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {['Leadership', 'Innovation', 'Problem Solving'].map((tag) => (
                                    <span key={tag} className="px-3 py-1 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 rounded-lg text-xs font-semibold border border-blue-200">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </section>

                        {/* Experience */}
                        <section className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Experience</h2>
                            </div>
                            <div className="space-y-6">
                                <div className="relative pl-8 pb-6 border-l-2 border-gray-200 dark:border-gray-600">
                                    <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 ring-4 ring-white dark:ring-gray-800 -translate-x-[9px] shadow-lg"></div>
                                    <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-5">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Senior Software Engineer</h3>
                                        <p className="text-base text-blue-600 dark:text-blue-400 font-semibold">TechCorp Inc.</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">2018 - Present</p>
                                        <p className="text-gray-700 dark:text-gray-300 text-sm">
                                            Led development of cloud-native microservices architecture, reducing infrastructure costs by 40% and improving system reliability.
                                        </p>
                                    </div>
                                </div>
                                <div className="relative pl-8 pb-6 border-l-2 border-gray-200 dark:border-gray-600">
                                    <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 ring-4 ring-white dark:ring-gray-800 -translate-x-[9px] shadow-lg"></div>
                                    <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-5">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Software Engineer</h3>
                                        <p className="text-base text-blue-600 dark:text-blue-400 font-semibold">Digital Solutions LLC</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">2015 - 2018</p>
                                        <p className="text-gray-700 dark:text-gray-300 text-sm">
                                            Developed and maintained enterprise web applications serving 100K+ users, implementing CI/CD pipelines and automated testing.
                                        </p>
                                    </div>
                                </div>
                                <div className="relative pl-8 last:border-l-0 last:pb-0">
                                    <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-gradient-to-r from-green-600 to-teal-600 ring-4 ring-white dark:ring-gray-800 -translate-x-[9px] shadow-lg"></div>
                                    <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-5">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Junior Developer</h3>
                                        <p className="text-base text-blue-600 dark:text-blue-400 font-semibold">StartupHub</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">2014 - 2015</p>
                                        <p className="text-gray-700 dark:text-gray-300 text-sm">
                                            Built responsive front-end interfaces and RESTful APIs, collaborating with cross-functional teams in agile environment.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Skills */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Skills</h2>
                            <div className="flex flex-wrap gap-2">
                                {['JavaScript', 'React', 'Node.js', 'AWS', 'Docker'].map((skill) => (
                                    <span key={skill} className="px-3 py-2 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 text-gray-800 dark:text-gray-200 rounded-lg text-xs font-semibold shadow-sm">
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Education */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Education</h2>
                            <div className="space-y-3">
                                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                                    <h3 className="font-bold text-gray-900 dark:text-white text-sm">Computer Science, B.S.</h3>
                                    <p className="text-gray-600 dark:text-gray-300 text-xs">MIT</p>
                                    <p className="text-gray-500 dark:text-gray-400 text-xs">2010 - 2014</p>
                                </div>
                            </div>
                        </div>

                        {/* Certifications */}
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6 shadow-lg border-2 border-green-200 dark:border-green-800">
                            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-3">Certifications</h3>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 p-2 bg-green-100/50 dark:bg-green-900/30 rounded-lg">
                                    <svg className="w-5 h-5 text-green-500 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-gray-700 dark:text-gray-200 text-xs font-medium">AWS Certified</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GoodCVExample;
