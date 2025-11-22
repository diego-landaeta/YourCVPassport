import React from 'react';

// Componente que muestra un CV genérico mal formateado (ejemplo de lo que NO se debe hacer)
const BadCVExample: React.FC = () => {
    return (
        <div className="w-full min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden" style={{ maxWidth: '100%' }}>
            <div className="w-full bg-white p-6 font-serif text-xs leading-tight overflow-hidden" style={{ fontFamily: 'Times New Roman, serif', maxWidth: '100%' }}>
            {/* Header mal formateado con demasiada información */}
            <div className="text-center mb-3 border-4 border-double border-black p-3 overflow-hidden">
                <h1 className="text-lg font-bold underline mb-1">CURRICULUM VITAE</h1>
                <div className="text-[10px] mt-2 space-y-0.5">
                    <p className="break-words"><strong>Full Legal Name:</strong> Jonathan Michael Doe Smith Jr., III</p>
                    <p className="break-words"><strong>Complete Address:</strong> 4523 Willow Creek Drive, Apartment 204, Building C, Springfield, Illinois, 62704, USA</p>
                    <p className="break-words"><strong>Home Phone:</strong> (217) 555-0123 | <strong>Cell:</strong> (217) 555-0124 | <strong>Work:</strong> (217) 555-0125</p>
                    <p className="break-words"><strong>Email:</strong> jon.doe.personal.1985@freemail.com | <strong>Alt Email:</strong> jondoe_backup@mail.net</p>
                    <p className="break-words"><strong>DOB:</strong> March 15, 1985 (Age: 38) | <strong>SSN:</strong> ***-**-6789 | <strong>Driver's License:</strong> IL-D456-7890-1234</p>
                    <p className="break-words"><strong>Marital Status:</strong> Married | <strong>Spouse:</strong> Jane Doe | <strong>Children:</strong> 2 (Ages 8 & 5)</p>
                    <p className="break-words"><strong>Height:</strong> 5'11" | <strong>Weight:</strong> 175 lbs | <strong>Blood Type:</strong> O+</p>
                </div>
            </div>

            {/* Foto inapropiada placeholder */}
            <div className="float-right ml-3 mb-2 w-20 h-24 border-2 border-black bg-gray-200 flex items-center justify-center text-[8px] text-center p-1">
                <span>Casual<br/>Photo<br/>Here</span>
            </div>

            {/* Objetivo genérico y sin valor */}
            <div className="mb-2 overflow-hidden">
                <h2 className="text-sm font-bold underline mb-1 bg-gray-300 px-1">CAREER OBJECTIVE:</h2>
                <p className="text-justify text-[11px] break-words">
                    Seeking a challenging and rewarding position with a reputable organization where I can effectively utilize my diverse skill set, gain valuable experience, contribute to team success, advance my professional career, and make a meaningful impact while continuously learning and growing in a dynamic work environment.
                </p>
            </div>

            {/* Experiencia mal organizada sin logros concretos */}
            <div className="mb-2 clear-both overflow-hidden">
                <h2 className="text-sm font-bold underline mb-1 bg-gray-300 px-1">PROFESSIONAL WORK EXPERIENCE:</h2>
                <div className="space-y-1.5 text-[10px] overflow-hidden">
                    <div>
                        <p><strong>ABC Corporation, Inc.</strong> (Springfield, IL) - 2015 to Present</p>
                        <p className="italic">Title: Various positions in multiple departments</p>
                        <ul className="list-disc ml-4 mt-0.5 space-y-0.5">
                            <li>Performed various administrative tasks as assigned by supervisor including data entry, filing, photocopying, and answering phones</li>
                            <li>Attended meetings and took notes</li>
                            <li>Helped with organizing office events and birthday celebrations</li>
                            <li>Maintained office supplies inventory</li>
                            <li>Covered reception desk during lunch breaks</li>
                            <li>Did other duties as needed</li>
                        </ul>
                    </div>
                    <div>
                        <p><strong>XYZ Services LLC</strong> - Part-time (2012-2015)</p>
                        <p className="italic">Customer Service Representative / General Helper</p>
                        <ul className="list-disc ml-4 mt-0.5 space-y-0.5">
                            <li>Talked to customers on the phone</li>
                            <li>Solved problems when they came up</li>
                            <li>Worked with team members</li>
                        </ul>
                    </div>
                    <div>
                        <p><strong>RetailMart Store #4523</strong> (2010-2012)</p>
                        <p className="italic">Cashier & Stock Associate</p>
                        <p className="ml-4">Operated cash register, stocked shelves, helped customers, cleaned store.</p>
                    </div>
                </div>
            </div>

            {/* Educación con información irrelevante */}
            <div className="mb-2 overflow-hidden">
                <h2 className="text-sm font-bold underline mb-1 bg-gray-300 px-1">EDUCATIONAL BACKGROUND:</h2>
                <div className="text-[10px] space-y-1">
                    <p>• <strong>Springfield Community College</strong> - Associates Degree (General Studies) - 2005-2007<br/>
                    <span className="ml-3 text-[9px]">GPA: 2.8/4.0 | Relevant Coursework: English 101, Math 110, History 201</span></p>
                    <p>• <strong>Online University</strong> - Some credits towards Bachelor's Degree (2008-2010, incomplete)<br/>
                    <span className="ml-3 text-[9px]">Took various courses online but did not complete program due to work schedule</span></p>
                    <p>• <strong>Springfield Central High School</strong> - Diploma - Graduated 2003<br/>
                    <span className="ml-3 text-[9px]">Member of Chess Club, Participated in School Play (Junior Year)</span></p>
                    <p>• <strong>Various Online Certificates:</strong>
                    <span className="ml-3 text-[9px]">Microsoft Office Basics (YouTube Tutorial - 2015), Excel for Beginners (Free Webinar - 2016), Time Management Skills (Company Training - 2018)</span></p>
                </div>
            </div>

            {/* Skills genéricos sin evidencia */}
            <div className="mb-2 overflow-hidden">
                <h2 className="text-sm font-bold underline mb-1 bg-gray-300 px-1">SKILLS & COMPETENCIES:</h2>
                <p className="text-[10px]">
                    Proficient in Microsoft Office Suite (Word, Excel, PowerPoint, Outlook), Internet browsing, Email, Basic typing (45 WPM), Filing, Data entry, Phones, Fax machine, Photocopier, Scanner, Excellent communication skills, Team player, Hard worker, Fast learner, Detail-oriented, Organized, Self-motivated, Reliable, Punctual, Honest, Friendly personality, Good attitude, Willing to learn, Flexible schedule
                </p>
            </div>

            {/* Información personal irrelevante */}
            <div className="mb-2 overflow-hidden">
                <h2 className="text-sm font-bold underline mb-1 bg-gray-300 px-1">ADDITIONAL INFORMATION:</h2>
                <div className="text-[10px] space-y-0.5">
                    <p>• <strong>Hobbies & Interests:</strong> Reading, watching movies, spending time with family, cooking, traveling (when possible), social media</p>
                    <p>• <strong>Languages:</strong> English (Native), Spanish (took in high school - basic level)</p>
                    <p>• <strong>Volunteer Experience:</strong> Helped at local food bank (2016), participated in company charity walk (2019)</p>
                    <p>• <strong>Transportation:</strong> Own reliable vehicle with valid driver's license and insurance</p>
                    <p>• <strong>Availability:</strong> Flexible, can start immediately, willing to work weekends if needed</p>
                </div>
            </div>

            {/* Referencias inapropiadas */}
            <div className="mb-2 overflow-hidden">
                <h2 className="text-sm font-bold underline mb-1 bg-gray-300 px-1">PROFESSIONAL REFERENCES:</h2>
                <div className="text-[10px] space-y-1">
                    <p><strong>Available upon request</strong></p>
                    <p className="text-[9px] italic">(Personal references include: Former supervisor, college professor, family friend who owns a business)</p>
                </div>
            </div>

            {/* Footer innecesario y poco profesional */}
            <div className="mt-2 pt-2 border-t-2 border-double border-black text-center text-[9px] italic overflow-hidden">
                <p>Thank you very much for taking the time to review my resume!</p>
                <p>I am very excited about this opportunity and look forward to hearing from you soon! :)</p>
                <p className="mt-1">* Please feel free to contact me at any time via phone or email *</p>
                <p className="font-bold mt-1">References and additional documentation available upon request!</p>
            </div>

            {/* Marca de agua innecesaria */}
            <div className="mt-1 text-center text-[8px] text-gray-400">
                <p>Created using Microsoft Word 2010 | Last Updated: {new Date().toLocaleDateString()}</p>
            </div>
            </div>
        </div>
    );
};

export default BadCVExample;
