import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_DIR = path.join(__dirname, '../public/images/templates');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Template HTML generator functions
const generateCVTemplate = (config) => {
  const { name, title, color, style, industry } = config;

  let html = '';

  if (style === 'modern-minimal') {
    html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Arial', sans-serif;
            width: 794px;
            height: 1123px;
            background: white;
            padding: 60px;
          }
          .header { border-bottom: 3px solid ${color}; padding-bottom: 20px; margin-bottom: 30px; }
          .name { font-size: 36px; font-weight: bold; color: #2c3e50; margin-bottom: 5px; }
          .title { font-size: 18px; color: ${color}; }
          .contact { display: flex; gap: 20px; margin-top: 10px; font-size: 12px; color: #666; }
          .section { margin-bottom: 25px; }
          .section-title {
            font-size: 16px;
            font-weight: bold;
            color: ${color};
            margin-bottom: 15px;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .item { margin-bottom: 15px; }
          .item-title { font-weight: bold; color: #2c3e50; font-size: 14px; }
          .item-subtitle { color: #666; font-size: 12px; margin-top: 3px; }
          .item-description { color: #444; font-size: 12px; margin-top: 8px; line-height: 1.6; }
          .skills { display: flex; flex-wrap: wrap; gap: 10px; }
          .skill {
            background: ${color}15;
            color: ${color};
            padding: 6px 12px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 500;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="name">${name}</div>
          <div class="title">${title}</div>
          <div class="contact">
            <span>email@example.com</span>
            <span>+1 234 567 8900</span>
            <span>linkedin.com/in/profile</span>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Perfil Profesional</div>
          <div class="item-description">
            Profesional ${industry.toLowerCase()} con más de 5 años de experiencia en desarrollo de soluciones innovadoras.
            Especializado en liderar equipos multidisciplinarios y entregar proyectos de alto impacto.
          </div>
        </div>

        <div class="section">
          <div class="section-title">Experiencia Profesional</div>
          <div class="item">
            <div class="item-title">Senior ${title}</div>
            <div class="item-subtitle">Tech Company • 2020 - Presente</div>
            <div class="item-description">
              • Lideré el desarrollo de aplicaciones web escalables utilizando tecnologías modernas<br>
              • Implementé mejores prácticas de código y arquitectura de software<br>
              • Mentoricé a 5 desarrolladores junior en el equipo
            </div>
          </div>
          <div class="item">
            <div class="item-title">${title}</div>
            <div class="item-subtitle">Innovation Labs • 2018 - 2020</div>
            <div class="item-description">
              • Desarrollé soluciones innovadoras para clientes internacionales<br>
              • Colaboré en proyectos ágiles con equipos distribuidos
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Educación</div>
          <div class="item">
            <div class="item-title">Ingeniería en ${industry}</div>
            <div class="item-subtitle">Universidad Tecnológica • 2014 - 2018</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Habilidades Técnicas</div>
          <div class="skills">
            <span class="skill">JavaScript</span>
            <span class="skill">TypeScript</span>
            <span class="skill">React</span>
            <span class="skill">Node.js</span>
            <span class="skill">Python</span>
            <span class="skill">SQL</span>
            <span class="skill">Git</span>
            <span class="skill">AWS</span>
          </div>
        </div>
      </body>
      </html>
    `;
  } else if (style === 'creative') {
    html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Arial', sans-serif;
            width: 794px;
            height: 1123px;
            background: white;
            display: flex;
          }
          .sidebar {
            width: 280px;
            background: ${color};
            color: white;
            padding: 40px 30px;
          }
          .main {
            flex: 1;
            padding: 40px;
          }
          .profile-img {
            width: 120px;
            height: 120px;
            border-radius: 50%;
            background: white;
            margin: 0 auto 20px;
          }
          .name { font-size: 28px; font-weight: bold; text-align: center; margin-bottom: 10px; }
          .title { font-size: 14px; text-align: center; opacity: 0.9; margin-bottom: 30px; }
          .sidebar-section { margin-bottom: 25px; }
          .sidebar-title {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 12px;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .sidebar-item { font-size: 12px; margin-bottom: 8px; opacity: 0.95; }
          .main-section { margin-bottom: 30px; }
          .main-title {
            font-size: 18px;
            font-weight: bold;
            color: ${color};
            margin-bottom: 15px;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .exp-item { margin-bottom: 20px; }
          .exp-title { font-weight: bold; color: #2c3e50; font-size: 14px; }
          .exp-subtitle { color: #666; font-size: 12px; margin-top: 3px; }
          .exp-description { color: #444; font-size: 12px; margin-top: 8px; line-height: 1.6; }
        </style>
      </head>
      <body>
        <div class="sidebar">
          <div class="profile-img"></div>
          <div class="name">${name}</div>
          <div class="title">${title}</div>

          <div class="sidebar-section">
            <div class="sidebar-title">Contacto</div>
            <div class="sidebar-item">📧 email@example.com</div>
            <div class="sidebar-item">📱 +1 234 567 8900</div>
            <div class="sidebar-item">🔗 linkedin.com/in/profile</div>
            <div class="sidebar-item">📍 Ciudad, País</div>
          </div>

          <div class="sidebar-section">
            <div class="sidebar-title">Habilidades</div>
            <div class="sidebar-item">• Adobe Creative Suite</div>
            <div class="sidebar-item">• Figma & Sketch</div>
            <div class="sidebar-item">• UI/UX Design</div>
            <div class="sidebar-item">• Branding</div>
            <div class="sidebar-item">• Typography</div>
          </div>

          <div class="sidebar-section">
            <div class="sidebar-title">Idiomas</div>
            <div class="sidebar-item">Español - Nativo</div>
            <div class="sidebar-item">Inglés - Avanzado</div>
          </div>
        </div>

        <div class="main">
          <div class="main-section">
            <div class="main-title">Sobre Mí</div>
            <div class="exp-description">
              ${industry} creativo con pasión por el diseño y la innovación visual.
              Especializado en crear experiencias de usuario memorables y diseños que comunican.
            </div>
          </div>

          <div class="main-section">
            <div class="main-title">Experiencia</div>
            <div class="exp-item">
              <div class="exp-title">Senior ${title}</div>
              <div class="exp-subtitle">Creative Studio • 2020 - Presente</div>
              <div class="exp-description">
                • Lideré proyectos de branding para clientes Fortune 500<br>
                • Diseñé interfaces de usuario para aplicaciones móviles premiadas<br>
                • Mentoricé a un equipo de 4 diseñadores junior
              </div>
            </div>
            <div class="exp-item">
              <div class="exp-title">${title}</div>
              <div class="exp-subtitle">Design Agency • 2018 - 2020</div>
              <div class="exp-description">
                • Creé identidades visuales para startups tecnológicas<br>
                • Colaboré en campañas de marketing digital
              </div>
            </div>
          </div>

          <div class="main-section">
            <div class="main-title">Educación</div>
            <div class="exp-item">
              <div class="exp-title">Diseño Gráfico</div>
              <div class="exp-subtitle">Escuela de Arte y Diseño • 2014 - 2018</div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  } else if (style === 'corporate') {
    html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Times New Roman', serif;
            width: 794px;
            height: 1123px;
            background: white;
            padding: 50px 60px;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .name {
            font-size: 32px;
            font-weight: bold;
            color: #000;
            margin-bottom: 8px;
            letter-spacing: 2px;
          }
          .title { font-size: 16px; color: #333; margin-bottom: 12px; }
          .contact { font-size: 11px; color: #666; }
          .section { margin-bottom: 25px; }
          .section-title {
            font-size: 14px;
            font-weight: bold;
            color: #000;
            margin-bottom: 12px;
            text-transform: uppercase;
            letter-spacing: 2px;
            border-bottom: 1px solid #ccc;
            padding-bottom: 5px;
          }
          .item { margin-bottom: 15px; }
          .item-header { display: flex; justify-content: space-between; margin-bottom: 5px; }
          .item-title { font-weight: bold; color: #000; font-size: 13px; }
          .item-date { color: #666; font-size: 11px; font-style: italic; }
          .item-subtitle { color: #333; font-size: 12px; margin-bottom: 5px; }
          .item-description { color: #444; font-size: 11px; line-height: 1.7; text-align: justify; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="name">${name}</div>
          <div class="title">${title}</div>
          <div class="contact">
            email@example.com • +1 234 567 8900 • Ciudad, País
          </div>
        </div>

        <div class="section">
          <div class="section-title">Resumen Profesional</div>
          <div class="item-description">
            Profesional ${industry.toLowerCase()} con trayectoria comprobada en la gestión de proyectos complejos
            y liderazgo de equipos de alto rendimiento. Experiencia en optimización de procesos, análisis financiero
            y desarrollo de estrategias corporativas que impulsan el crecimiento organizacional.
          </div>
        </div>

        <div class="section">
          <div class="section-title">Experiencia Profesional</div>
          <div class="item">
            <div class="item-header">
              <div class="item-title">Senior ${title}</div>
              <div class="item-date">2020 - Presente</div>
            </div>
            <div class="item-subtitle">Corporación Internacional</div>
            <div class="item-description">
              Responsable de liderar iniciativas estratégicas que resultaron en un incremento del 25% en la eficiencia
              operacional. Gestioné un presupuesto anual de $5M y supervisé un equipo multidisciplinario de 15 profesionales.
              Implementé sistemas de análisis de datos que mejoraron la toma de decisiones ejecutivas.
            </div>
          </div>
          <div class="item">
            <div class="item-header">
              <div class="item-title">${title}</div>
              <div class="item-date">2017 - 2020</div>
            </div>
            <div class="item-subtitle">Firma Consultora</div>
            <div class="item-description">
              Desarrollé modelos financieros y análisis de mercado para clientes del sector corporativo.
              Colaboré en proyectos de transformación organizacional y optimización de recursos.
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Educación</div>
          <div class="item">
            <div class="item-header">
              <div class="item-title">MBA - Administración de Empresas</div>
              <div class="item-date">2015 - 2017</div>
            </div>
            <div class="item-subtitle">Universidad de Negocios</div>
          </div>
          <div class="item">
            <div class="item-header">
              <div class="item-title">Licenciatura en ${industry}</div>
              <div class="item-date">2011 - 2015</div>
            </div>
            <div class="item-subtitle">Universidad Nacional</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Competencias Clave</div>
          <div class="item-description">
            Gestión de Proyectos • Análisis Financiero • Liderazgo Estratégico • Optimización de Procesos •
            Negociación • Análisis de Datos • Planificación Presupuestaria • Gestión de Equipos
          </div>
        </div>
      </body>
      </html>
    `;
  }

  return html;
};

const generateCoverLetterTemplate = (config) => {
  const { color, style } = config;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Arial', sans-serif;
          width: 794px;
          height: 1123px;
          background: white;
          padding: 80px 70px;
        }
        .header { margin-bottom: 40px; }
        .sender { margin-bottom: 30px; }
        .sender-name { font-size: 18px; font-weight: bold; color: ${color}; }
        .sender-info { font-size: 12px; color: #666; margin-top: 5px; line-height: 1.6; }
        .date { font-size: 12px; color: #666; margin-bottom: 30px; }
        .recipient { margin-bottom: 30px; }
        .recipient-name { font-size: 14px; font-weight: bold; color: #2c3e50; }
        .recipient-info { font-size: 12px; color: #666; margin-top: 3px; line-height: 1.6; }
        .greeting { font-size: 13px; color: #2c3e50; margin-bottom: 20px; }
        .content { margin-bottom: 20px; }
        .paragraph {
          font-size: 12px;
          color: #444;
          line-height: 1.8;
          margin-bottom: 15px;
          text-align: justify;
        }
        .closing { margin-top: 30px; }
        .signature { font-size: 13px; color: #2c3e50; }
        .signature-name { font-size: 14px; font-weight: bold; color: ${color}; margin-top: 40px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="sender">
          <div class="sender-name">Tu Nombre Completo</div>
          <div class="sender-info">
            email@example.com<br>
            +1 234 567 8900<br>
            linkedin.com/in/tu-perfil
          </div>
        </div>

        <div class="date">15 de Enero, 2025</div>

        <div class="recipient">
          <div class="recipient-name">Departamento de Recursos Humanos</div>
          <div class="recipient-info">
            Nombre de la Empresa<br>
            Dirección de la Empresa<br>
            Ciudad, País
          </div>
        </div>
      </div>

      <div class="greeting">Estimado/a Reclutador/a,</div>

      <div class="content">
        <div class="paragraph">
          Me dirijo a usted con gran entusiasmo para expresar mi interés en la posición publicada en su
          organización. Con más de 5 años de experiencia en el sector y un historial comprobado de éxito
          en proyectos de alto impacto, estoy convencido/a de que puedo aportar un valor significativo a su equipo.
        </div>

        <div class="paragraph">
          A lo largo de mi carrera profesional, he desarrollado habilidades clave que se alinean perfectamente
          con los requisitos de la posición. Mi experiencia incluye liderazgo de equipos multidisciplinarios,
          gestión de proyectos complejos y la implementación de soluciones innovadoras que han generado
          resultados medibles para las organizaciones donde he colaborado.
        </div>

        <div class="paragraph">
          Lo que me distingue es mi capacidad para combinar expertise técnico con habilidades de comunicación
          efectiva y pensamiento estratégico. Estoy comprometido/a con el aprendizaje continuo y la excelencia
          en cada proyecto que emprendo, siempre buscando superar las expectativas y contribuir al crecimiento
          organizacional.
        </div>

        <div class="paragraph">
          Agradezco sinceramente su tiempo y consideración. Me encantaría tener la oportunidad de discutir
          cómo mi experiencia y habilidades pueden contribuir al éxito de su organización. Quedo a su
          disposición para una entrevista en el momento que considere conveniente.
        </div>
      </div>

      <div class="closing">
        <div class="signature">Atentamente,</div>
        <div class="signature-name">Tu Nombre Completo</div>
      </div>
    </body>
    </html>
  `;
};

const generateEmailTemplate = (config) => {
  const { type, color } = config;

  let subject = '';
  let content = '';

  if (type === 'followup') {
    subject = 'Seguimiento - Entrevista para [Posición]';
    content = `
      <p>Estimado/a [Nombre del Reclutador],</p>

      <p>Espero que este mensaje le encuentre bien. Quiero agradecerle nuevamente por la oportunidad
      de entrevistarme para la posición de [Nombre de la Posición] el pasado [fecha].</p>

      <p>Disfruté mucho nuestra conversación y aprendí más sobre los emocionantes proyectos en los que
      está trabajando el equipo. Estoy aún más entusiasmado/a con la posibilidad de contribuir con mis
      habilidades y experiencia a su organización.</p>

      <p>Si necesita información adicional o referencias, estaré encantado/a de proporcionarla. Quedo
      a la espera de sus noticias sobre los próximos pasos en el proceso.</p>
    `;
  } else if (type === 'networking') {
    subject = 'Conectar y Explorar Oportunidades de Colaboración';
    content = `
      <p>Hola [Nombre],</p>

      <p>Me gustaría conectar contigo ya que compartimos intereses profesionales en [industria/área].
      He seguido tu trabajo en [empresa/proyecto] y me ha impresionado tu enfoque en [aspecto específico].</p>

      <p>Actualmente me especializo en [tu área] y creo que podríamos beneficiarnos mutuamente de
      compartir perspectivas e ideas sobre [tema relevante].</p>

      <p>¿Estarías disponible para una breve conversación virtual en las próximas semanas? Me encantaría
      conocer más sobre tu experiencia y explorar posibles sinergias.</p>
    `;
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Arial', sans-serif;
          width: 794px;
          height: 1123px;
          background: #f5f5f5;
          padding: 40px;
        }
        .email-container {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          overflow: hidden;
        }
        .email-header {
          background: ${color};
          color: white;
          padding: 30px;
        }
        .email-subject {
          font-size: 20px;
          font-weight: bold;
        }
        .email-meta {
          font-size: 12px;
          margin-top: 10px;
          opacity: 0.9;
        }
        .email-body {
          padding: 30px;
        }
        .email-body p {
          font-size: 13px;
          color: #444;
          line-height: 1.8;
          margin-bottom: 15px;
        }
        .email-signature {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #eee;
          font-size: 12px;
          color: #666;
        }
        .signature-name {
          font-weight: bold;
          color: ${color};
          margin-bottom: 5px;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="email-header">
          <div class="email-subject">${subject}</div>
          <div class="email-meta">
            De: tu.email@example.com<br>
            Para: reclutador@empresa.com<br>
            Fecha: 15 de Enero, 2025
          </div>
        </div>

        <div class="email-body">
          ${content}

          <div class="email-signature">
            <div class="signature-name">Tu Nombre Completo</div>
            <div>Título Profesional</div>
            <div>email@example.com | +1 234 567 8900</div>
            <div>linkedin.com/in/tu-perfil</div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

const generateLinkedInTemplate = (config) => {
  const { type, color } = config;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
          width: 794px;
          height: 1123px;
          background: #f3f2ef;
          padding: 30px;
        }
        .linkedin-container {
          background: white;
          border-radius: 8px;
          box-shadow: 0 0 0 1px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.1);
          overflow: hidden;
        }
        .profile-header {
          position: relative;
          height: 150px;
          background: linear-gradient(135deg, ${color} 0%, ${color}dd 100%);
        }
        .profile-photo {
          width: 150px;
          height: 150px;
          border-radius: 50%;
          background: white;
          border: 4px solid white;
          position: absolute;
          bottom: -75px;
          left: 30px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }
        .profile-content {
          padding: 90px 30px 30px 30px;
        }
        .profile-name {
          font-size: 28px;
          font-weight: 600;
          color: rgba(0,0,0,0.9);
          margin-bottom: 5px;
        }
        .profile-headline {
          font-size: 18px;
          color: rgba(0,0,0,0.9);
          margin-bottom: 10px;
        }
        .profile-location {
          font-size: 14px;
          color: rgba(0,0,0,0.6);
          margin-bottom: 5px;
        }
        .profile-connections {
          font-size: 14px;
          color: ${color};
          font-weight: 600;
          margin-bottom: 20px;
        }
        .section {
          margin-top: 25px;
          padding-top: 25px;
          border-top: 1px solid rgba(0,0,0,0.08);
        }
        .section-title {
          font-size: 20px;
          font-weight: 600;
          color: rgba(0,0,0,0.9);
          margin-bottom: 15px;
        }
        .about-text {
          font-size: 14px;
          color: rgba(0,0,0,0.9);
          line-height: 1.6;
        }
        .experience-item {
          margin-bottom: 20px;
        }
        .exp-title {
          font-size: 16px;
          font-weight: 600;
          color: rgba(0,0,0,0.9);
        }
        .exp-company {
          font-size: 14px;
          color: rgba(0,0,0,0.6);
          margin-top: 2px;
        }
        .exp-dates {
          font-size: 13px;
          color: rgba(0,0,0,0.6);
          margin-top: 5px;
        }
        .skills {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 10px;
        }
        .skill-tag {
          background: rgba(0,0,0,0.08);
          color: rgba(0,0,0,0.9);
          padding: 6px 12px;
          border-radius: 16px;
          font-size: 13px;
          font-weight: 500;
        }
      </style>
    </head>
    <body>
      <div class="linkedin-container">
        <div class="profile-header">
          <div class="profile-photo"></div>
        </div>

        <div class="profile-content">
          <div class="profile-name">Tu Nombre Profesional</div>
          <div class="profile-headline">Senior Developer | Tech Innovator | Team Leader</div>
          <div class="profile-location">Ciudad, País</div>
          <div class="profile-connections">500+ conexiones</div>

          <div class="section">
            <div class="section-title">Acerca de</div>
            <div class="about-text">
              Profesional apasionado por la tecnología con más de 5 años de experiencia liderando
              proyectos innovadores y equipos de alto rendimiento. Especializado en desarrollo de
              software escalable, arquitectura de sistemas y mentoría técnica.<br><br>

              Me enfoco en crear soluciones que generan impacto real, combinando expertise técnico
              con visión estratégica. Siempre en búsqueda de nuevos desafíos y oportunidades para
              aprender y crecer profesionalmente.
            </div>
          </div>

          <div class="section">
            <div class="section-title">Experiencia</div>
            <div class="experience-item">
              <div class="exp-title">Senior Software Engineer</div>
              <div class="exp-company">Tech Company Inc.</div>
              <div class="exp-dates">2020 - Presente • 5 años</div>
            </div>
            <div class="experience-item">
              <div class="exp-title">Software Engineer</div>
              <div class="exp-company">Innovation Labs</div>
              <div class="exp-dates">2018 - 2020 • 2 años</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Habilidades</div>
            <div class="skills">
              <span class="skill-tag">JavaScript</span>
              <span class="skill-tag">React</span>
              <span class="skill-tag">Node.js</span>
              <span class="skill-tag">TypeScript</span>
              <span class="skill-tag">Python</span>
              <span class="skill-tag">AWS</span>
              <span class="skill-tag">Leadership</span>
              <span class="skill-tag">Agile</span>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Template configurations
const templates = [
  // Technology CVs (1-8)
  { id: 2, type: 'cv', name: 'Alex Rivera', title: 'Full Stack Engineer', color: '#3b82f6', style: 'modern-minimal', industry: 'Tecnología' },
  { id: 3, type: 'cv', name: 'María García', title: 'Frontend Developer', color: '#06b6d4', style: 'modern-minimal', industry: 'Tecnología' },
  { id: 4, type: 'cv', name: 'Carlos Mendez', title: 'Full Stack Engineer', color: '#0ea5e9', style: 'modern-minimal', industry: 'Tecnología' },
  { id: 5, type: 'cv', name: 'Ana Silva', title: 'DevOps Engineer', color: '#8b5cf6', style: 'modern-minimal', industry: 'Tecnología' },
  { id: 6, type: 'cv', name: 'Luis Torres', title: 'Data Scientist', color: '#10b981', style: 'modern-minimal', industry: 'Tecnología' },
  { id: 7, type: 'cv', name: 'Sofia Ramirez', title: 'Junior Developer', color: '#14b8a6', style: 'modern-minimal', industry: 'Tecnología' },
  { id: 8, type: 'cv', name: 'Diego Vargas', title: 'Software Architect', color: '#6366f1', style: 'modern-minimal', industry: 'Tecnología' },

  // Creative CVs (10-16)
  { id: 10, type: 'cv', name: 'Isabella Cruz', title: 'Graphic Designer', color: '#ec4899', style: 'creative', industry: 'Diseño' },
  { id: 11, type: 'cv', name: 'Javier Morales', title: 'UX/UI Designer', color: '#f97316', style: 'creative', industry: 'Diseño' },
  { id: 12, type: 'cv', name: 'Valentina Ruiz', title: 'Web Designer', color: '#f43f5e', style: 'creative', industry: 'Diseño' },
  { id: 13, type: 'cv', name: 'Mateo Santos', title: 'Art Director', color: '#a855f7', style: 'creative', industry: 'Arte' },
  { id: 14, type: 'cv', name: 'Camila Flores', title: 'Photographer', color: '#eab308', style: 'creative', industry: 'Fotografía' },
  { id: 15, type: 'cv', name: 'Santiago Diaz', title: 'Digital Illustrator', color: '#ef4444', style: 'creative', industry: 'Ilustración' },
  { id: 16, type: 'cv', name: 'Luciana Perez', title: 'Multimedia Designer', color: '#14b8a6', style: 'creative', industry: 'Multimedia' },

  // Corporate CVs (18-24)
  { id: 18, type: 'cv', name: 'Roberto Jiménez', title: 'Project Manager', color: '#1e40af', style: 'corporate', industry: 'Gestión' },
  { id: 19, type: 'cv', name: 'Patricia López', title: 'Financial Analyst', color: '#047857', style: 'corporate', industry: 'Finanzas' },
  { id: 20, type: 'cv', name: 'Fernando Castro', title: 'Accountant', color: '#1e3a8a', style: 'corporate', industry: 'Contabilidad' },
  { id: 21, type: 'cv', name: 'Elena Márquez', title: 'Business Consultant', color: '#7c2d12', style: 'corporate', industry: 'Consultoría' },
  { id: 22, type: 'cv', name: 'Andrés Rojas', title: 'HR Manager', color: '#be123c', style: 'corporate', industry: 'Recursos Humanos' },
  { id: 23, type: 'cv', name: 'Gabriela Vega', title: 'Executive Assistant', color: '#4338ca', style: 'corporate', industry: 'Administración' },
  { id: 24, type: 'cv', name: 'Miguel Herrera', title: 'Operations Director', color: '#0f766e', style: 'corporate', industry: 'Operaciones' },

  // Healthcare CVs (26-30)
  { id: 26, type: 'cv', name: 'Carmen Ortiz', title: 'Registered Nurse', color: '#0284c7', style: 'corporate', industry: 'Enfermería' },
  { id: 27, type: 'cv', name: 'Dr. Ricardo Navarro', title: 'Medical Specialist', color: '#059669', style: 'corporate', industry: 'Medicina' },
  { id: 29, type: 'cv', name: 'Laura Medina', title: 'Physiotherapist', color: '#7c3aed', style: 'modern-minimal', industry: 'Fisioterapia' },
  { id: 30, type: 'cv', name: 'Oscar Reyes', title: 'Lab Technician', color: '#0891b2', style: 'modern-minimal', industry: 'Laboratorio' },

  // Cover Letters (31-38)
  { id: 31, type: 'cover', color: '#3b82f6', style: 'modern' },
  { id: 32, type: 'cover', color: '#1e40af', style: 'corporate' },
  { id: 33, type: 'cover', color: '#ec4899', style: 'creative' },
  { id: 34, type: 'cover', color: '#0284c7', style: 'healthcare' },
  { id: 35, type: 'cover', color: '#14b8a6', style: 'entry' },
  { id: 36, type: 'cover', color: '#0f766e', style: 'executive' },
  { id: 37, type: 'cover', color: '#6366f1', style: 'career-change' },
  { id: 38, type: 'cover', color: '#f97316', style: 'freelance' },

  // Emails (39-45)
  { id: 39, type: 'email', emailType: 'followup', color: '#3b82f6' },
  { id: 40, type: 'email', emailType: 'networking', color: '#1e40af' },
  { id: 42, type: 'email', emailType: 'thankyou', color: '#10b981' },
  { id: 43, type: 'email', emailType: 'proposal', color: '#f97316' },
  { id: 44, type: 'email', emailType: 'salary', color: '#0f766e' },
  { id: 45, type: 'email', emailType: 'contact', color: '#14b8a6' },

  // LinkedIn (46-52)
  { id: 46, type: 'linkedin', color: '#0a66c2' },
  { id: 47, type: 'linkedin', color: '#ec4899' },
  { id: 48, type: 'linkedin', color: '#1e40af' },
  { id: 49, type: 'linkedin', color: '#0284c7' },
  { id: 50, type: 'linkedin', color: '#3b82f6' },
  { id: 51, type: 'linkedin', color: '#14b8a6' },
  { id: 52, type: 'linkedin', color: '#6366f1' },
];

async function generateTemplate(template, browser) {
  const page = await browser.newPage();
  await page.setViewport({ width: 794, height: 1123 });

  let html = '';
  if (template.type === 'cv') {
    html = generateCVTemplate(template);
  } else if (template.type === 'cover') {
    html = generateCoverLetterTemplate(template);
  } else if (template.type === 'email') {
    html = generateEmailTemplate(template);
  } else if (template.type === 'linkedin') {
    html = generateLinkedInTemplate(template);
  }

  await page.setContent(html, { waitUntil: 'networkidle0' });

  const filename = `template-${template.id}.png`;
  const filepath = path.join(OUTPUT_DIR, filename);

  await page.screenshot({
    path: filepath,
    fullPage: false,
  });

  await page.close();
  console.log(`✓ Generated ${filename}`);
}

async function main() {
  console.log('Starting template generation...\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  for (const template of templates) {
    try {
      await generateTemplate(template, browser);
    } catch (error) {
      console.error(`✗ Error generating template ${template.id}:`, error.message);
    }
  }

  await browser.close();
  console.log('\n✓ All templates generated successfully!');
}

main().catch(console.error);
