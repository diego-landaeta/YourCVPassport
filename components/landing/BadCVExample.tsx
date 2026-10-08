import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

// Textos del CV de ejemplo en cada idioma (antes solo en inglés también en /producto/ats).
// Son datos inventados a propósito: el ejemplo enseña lo que NO se debe poner en un CV.
const BAD_CV = {
    es: {
        heading: 'CURRICULUM VITAE',
        personal: [
            ['Nombre completo:', 'Juan Antonio Pérez García de la Fuente'],
            ['Dirección completa:', 'Calle de los Olivos 45, Escalera B, 3.º Izquierda, Portal 2, 28045 Madrid, España'],
            ['Tel. fijo:', '91 555 01 23 | Móvil: 600 555 012 | Trabajo: 91 555 01 25'],
            ['Email:', 'juanito.perez.1985@correogratis.com | Email alternativo: juanperez_copia@correo.net'],
            ['Fecha de nacimiento:', '15 de marzo de 1985 (38 años) | DNI: 12345678-X | Carné de conducir: B'],
            ['Estado civil:', 'Casado | Cónyuge: María López | Hijos: 2 (8 y 5 años)'],
            ['Altura:', '1,80 m | Peso: 79 kg | Grupo sanguíneo: 0+'],
        ],
        photo: ['Foto', 'informal', 'aquí'],
        objectiveTitle: 'OBJETIVO PROFESIONAL:',
        objective: 'Busco un puesto estimulante y gratificante en una organización de prestigio donde pueda aprovechar mis diversas habilidades, adquirir experiencia valiosa, contribuir al éxito del equipo, avanzar en mi carrera profesional y generar un impacto significativo mientras sigo aprendiendo y creciendo en un entorno de trabajo dinámico.',
        experienceTitle: 'EXPERIENCIA LABORAL PROFESIONAL:',
        jobs: [
            {
                company: 'ABC Corporación, S. A.', meta: ' (Madrid) - De 2015 a la actualidad', role: 'Puesto: varios puestos en distintos departamentos',
                tasks: [
                    'Realicé diversas tareas administrativas que me encargaba mi supervisor, como introducir datos, archivar, hacer fotocopias y atender el teléfono',
                    'Asistí a reuniones y tomé notas',
                    'Ayudé a organizar eventos de la oficina y celebraciones de cumpleaños',
                    'Mantuve el inventario de material de oficina',
                    'Cubrí la recepción durante la hora de la comida',
                    'Otras tareas según necesidad',
                ],
            },
            {
                company: 'XYZ Servicios, S. L.', meta: ' - Media jornada (2012-2015)', role: 'Atención al cliente / Ayudante general',
                tasks: ['Hablaba con clientes por teléfono', 'Resolvía problemas cuando surgían', 'Trabajaba con compañeros'],
            },
        ],
        lastJob: { company: 'SuperMercado Tienda n.º 4523', meta: ' (2010-2012)', role: 'Cajero y reponedor', text: 'Manejaba la caja registradora, reponía estanterías, ayudaba a los clientes y limpiaba la tienda.' },
        educationTitle: 'FORMACIÓN ACADÉMICA:',
        education: [
            { name: 'Instituto Municipal de Estudios', text: ' - Ciclo formativo (Estudios generales) - 2005-2007', note: 'Nota media: 6,2/10 | Asignaturas relevantes: Lengua I, Matemáticas II, Historia' },
            { name: 'Universidad Online', text: ' - Algunos créditos del grado (2008-2010, sin terminar)', note: 'Hice varias asignaturas online pero no terminé por el horario de trabajo' },
            { name: 'IES Central de Madrid', text: ' - Bachillerato - Terminado en 2003', note: 'Miembro del club de ajedrez, participé en la obra de teatro del instituto' },
        ],
        certificatesLabel: 'Varios certificados online:',
        certificates: 'Office básico (tutorial de YouTube - 2015), Excel para principiantes (webinar gratuito - 2016), Gestión del tiempo (formación de la empresa - 2018)',
        skillsTitle: 'HABILIDADES Y COMPETENCIAS:',
        skills: 'Dominio de Microsoft Office (Word, Excel, PowerPoint, Outlook), navegar por Internet, correo electrónico, mecanografía básica (45 ppm), archivo, introducción de datos, teléfono, fax, fotocopiadora, escáner, excelentes dotes de comunicación, trabajo en equipo, muy trabajador, aprendo rápido, detallista, organizado, automotivado, responsable, puntual, honrado, simpático, buena actitud, ganas de aprender, horario flexible',
        additionalTitle: 'INFORMACIÓN ADICIONAL:',
        additional: [
            ['Aficiones e intereses:', 'Leer, ver películas, pasar tiempo con la familia, cocinar, viajar (cuando se puede), redes sociales'],
            ['Idiomas:', 'Español (nativo), inglés (lo di en el instituto - nivel básico)'],
            ['Voluntariado:', 'Ayudé en el banco de alimentos del barrio (2016), participé en la carrera solidaria de la empresa (2019)'],
            ['Transporte:', 'Coche propio con carné de conducir en vigor y seguro'],
            ['Disponibilidad:', 'Flexible, incorporación inmediata, dispuesto a trabajar fines de semana si hace falta'],
        ],
        referencesTitle: 'REFERENCIAS PROFESIONALES:',
        referencesAvailable: 'Disponibles bajo petición',
        referencesNote: '(Referencias personales: antiguo supervisor, profesor de la universidad, amigo de la familia con negocio propio)',
        footer: [
            '¡Muchas gracias por dedicar su tiempo a revisar mi currículum!',
            '¡Estoy muy ilusionado con esta oportunidad y espero tener noticias suyas pronto! :)',
            '* No dude en contactarme en cualquier momento por teléfono o email *',
        ],
        footerStrong: '¡Referencias y documentación adicional disponibles bajo petición!',
        watermark: 'Creado con Microsoft Word 2010 | Última actualización:',
    },
    en: {
        heading: 'CURRICULUM VITAE',
        personal: [
            ['Full Legal Name:', 'Jonathan Michael Doe Smith Jr., III'],
            ['Complete Address:', '4523 Willow Creek Drive, Apartment 204, Building C, Springfield, Illinois, 62704, USA'],
            ['Home Phone:', '(217) 555-0123 | Cell: (217) 555-0124 | Work: (217) 555-0125'],
            ['Email:', 'jon.doe.personal.1985@freemail.com | Alt Email: jondoe_backup@mail.net'],
            ['DOB:', "March 15, 1985 (Age: 38) | SSN: ***-**-6789 | Driver's License: IL-D456-7890-1234"],
            ['Marital Status:', 'Married | Spouse: Jane Doe | Children: 2 (Ages 8 & 5)'],
            ['Height:', '5\'11" | Weight: 175 lbs | Blood Type: O+'],
        ],
        photo: ['Casual', 'Photo', 'Here'],
        objectiveTitle: 'CAREER OBJECTIVE:',
        objective: 'Seeking a challenging and rewarding position with a reputable organization where I can effectively utilize my diverse skill set, gain valuable experience, contribute to team success, advance my professional career, and make a meaningful impact while continuously learning and growing in a dynamic work environment.',
        experienceTitle: 'PROFESSIONAL WORK EXPERIENCE:',
        jobs: [
            {
                company: 'ABC Corporation, Inc.', meta: ' (Springfield, IL) - 2015 to Present', role: 'Title: Various positions in multiple departments',
                tasks: [
                    'Performed various administrative tasks as assigned by supervisor including data entry, filing, photocopying, and answering phones',
                    'Attended meetings and took notes',
                    'Helped with organizing office events and birthday celebrations',
                    'Maintained office supplies inventory',
                    'Covered reception desk during lunch breaks',
                    'Did other duties as needed',
                ],
            },
            {
                company: 'XYZ Services LLC', meta: ' - Part-time (2012-2015)', role: 'Customer Service Representative / General Helper',
                tasks: ['Talked to customers on the phone', 'Solved problems when they came up', 'Worked with team members'],
            },
        ],
        lastJob: { company: 'RetailMart Store #4523', meta: ' (2010-2012)', role: 'Cashier & Stock Associate', text: 'Operated cash register, stocked shelves, helped customers, cleaned store.' },
        educationTitle: 'EDUCATIONAL BACKGROUND:',
        education: [
            { name: 'Springfield Community College', text: ' - Associates Degree (General Studies) - 2005-2007', note: 'GPA: 2.8/4.0 | Relevant Coursework: English 101, Math 110, History 201' },
            { name: 'Online University', text: " - Some credits towards Bachelor's Degree (2008-2010, incomplete)", note: 'Took various courses online but did not complete program due to work schedule' },
            { name: 'Springfield Central High School', text: ' - Diploma - Graduated 2003', note: 'Member of Chess Club, Participated in School Play (Junior Year)' },
        ],
        certificatesLabel: 'Various Online Certificates:',
        certificates: 'Microsoft Office Basics (YouTube Tutorial - 2015), Excel for Beginners (Free Webinar - 2016), Time Management Skills (Company Training - 2018)',
        skillsTitle: 'SKILLS & COMPETENCIES:',
        skills: 'Proficient in Microsoft Office Suite (Word, Excel, PowerPoint, Outlook), Internet browsing, Email, Basic typing (45 WPM), Filing, Data entry, Phones, Fax machine, Photocopier, Scanner, Excellent communication skills, Team player, Hard worker, Fast learner, Detail-oriented, Organized, Self-motivated, Reliable, Punctual, Honest, Friendly personality, Good attitude, Willing to learn, Flexible schedule',
        additionalTitle: 'ADDITIONAL INFORMATION:',
        additional: [
            ['Hobbies & Interests:', 'Reading, watching movies, spending time with family, cooking, traveling (when possible), social media'],
            ['Languages:', 'English (Native), Spanish (took in high school - basic level)'],
            ['Volunteer Experience:', 'Helped at local food bank (2016), participated in company charity walk (2019)'],
            ['Transportation:', "Own reliable vehicle with valid driver's license and insurance"],
            ['Availability:', 'Flexible, can start immediately, willing to work weekends if needed'],
        ],
        referencesTitle: 'PROFESSIONAL REFERENCES:',
        referencesAvailable: 'Available upon request',
        referencesNote: '(Personal references include: Former supervisor, college professor, family friend who owns a business)',
        footer: [
            'Thank you very much for taking the time to review my resume!',
            'I am very excited about this opportunity and look forward to hearing from you soon! :)',
            '* Please feel free to contact me at any time via phone or email *',
        ],
        footerStrong: 'References and additional documentation available upon request!',
        watermark: 'Created using Microsoft Word 2010 | Last Updated:',
    },
} as const;

// Componente que muestra un CV genérico mal formateado (ejemplo de lo que NO se debe hacer)
const BadCVExample: React.FC = () => {
    const { lang } = useLanguage();
    const c = BAD_CV[lang];
    return (
        <div className="w-full min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden" style={{ maxWidth: '100%' }}>
            <div className="w-full bg-white p-6 font-serif text-xs leading-tight overflow-hidden" style={{ fontFamily: 'Times New Roman, serif', maxWidth: '100%' }}>
            {/* Header mal formateado con demasiada información */}
            <div className="text-center mb-3 border-4 border-double border-black p-3 overflow-hidden">
                <h1 className="text-lg font-bold underline mb-1">{c.heading}</h1>
                <div className="text-[10px] mt-2 space-y-0.5">
                    {c.personal.map(([label, value]) => (
                        <p key={label} className="break-words"><strong>{label}</strong> {value}</p>
                    ))}
                </div>
            </div>

            {/* Foto inapropiada placeholder */}
            <div className="float-right ml-3 mb-2 w-20 h-24 border-2 border-black bg-gray-200 flex items-center justify-center text-[8px] text-center p-1">
                <span>{c.photo[0]}<br/>{c.photo[1]}<br/>{c.photo[2]}</span>
            </div>

            {/* Objetivo genérico y sin valor */}
            <div className="mb-2 overflow-hidden">
                <h2 className="text-sm font-bold underline mb-1 bg-gray-300 px-1">{c.objectiveTitle}</h2>
                <p className="text-justify text-[11px] break-words">
                    {c.objective}
                </p>
            </div>

            {/* Experiencia mal organizada sin logros concretos */}
            <div className="mb-2 clear-both overflow-hidden">
                <h2 className="text-sm font-bold underline mb-1 bg-gray-300 px-1">{c.experienceTitle}</h2>
                <div className="space-y-1.5 text-[10px] overflow-hidden">
                    {c.jobs.map(job => (
                        <div key={job.company}>
                            <p><strong>{job.company}</strong>{job.meta}</p>
                            <p className="italic">{job.role}</p>
                            <ul className="list-disc ml-4 mt-0.5 space-y-0.5">
                                {job.tasks.map(task => <li key={task}>{task}</li>)}
                            </ul>
                        </div>
                    ))}
                    <div>
                        <p><strong>{c.lastJob.company}</strong>{c.lastJob.meta}</p>
                        <p className="italic">{c.lastJob.role}</p>
                        <p className="ml-4">{c.lastJob.text}</p>
                    </div>
                </div>
            </div>

            {/* Educación con información irrelevante */}
            <div className="mb-2 overflow-hidden">
                <h2 className="text-sm font-bold underline mb-1 bg-gray-300 px-1">{c.educationTitle}</h2>
                <div className="text-[10px] space-y-1">
                    {c.education.map(item => (
                        <p key={item.name}>• <strong>{item.name}</strong>{item.text}<br/>
                        <span className="ml-3 text-[9px]">{item.note}</span></p>
                    ))}
                    <p>• <strong>{c.certificatesLabel}</strong>
                    <span className="ml-3 text-[9px]">{c.certificates}</span></p>
                </div>
            </div>

            {/* Skills genéricos sin evidencia */}
            <div className="mb-2 overflow-hidden">
                <h2 className="text-sm font-bold underline mb-1 bg-gray-300 px-1">{c.skillsTitle}</h2>
                <p className="text-[10px]">
                    {c.skills}
                </p>
            </div>

            {/* Información personal irrelevante */}
            <div className="mb-2 overflow-hidden">
                <h2 className="text-sm font-bold underline mb-1 bg-gray-300 px-1">{c.additionalTitle}</h2>
                <div className="text-[10px] space-y-0.5">
                    {c.additional.map(([label, value]) => (
                        <p key={label}>• <strong>{label}</strong> {value}</p>
                    ))}
                </div>
            </div>

            {/* Referencias inapropiadas */}
            <div className="mb-2 overflow-hidden">
                <h2 className="text-sm font-bold underline mb-1 bg-gray-300 px-1">{c.referencesTitle}</h2>
                <div className="text-[10px] space-y-1">
                    <p><strong>{c.referencesAvailable}</strong></p>
                    <p className="text-[9px] italic">{c.referencesNote}</p>
                </div>
            </div>

            {/* Footer innecesario y poco profesional */}
            <div className="mt-2 pt-2 border-t-2 border-double border-black text-center text-[9px] italic overflow-hidden">
                <p>{c.footer[0]}</p>
                <p>{c.footer[1]}</p>
                <p className="mt-1">{c.footer[2]}</p>
                <p className="font-bold mt-1">{c.footerStrong}</p>
            </div>

            {/* Marca de agua innecesaria */}
            <div className="mt-1 text-center text-[8px] text-gray-400">
                <p>{c.watermark} {new Date().toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US')}</p>
            </div>
            </div>
        </div>
    );
};

export default BadCVExample;
