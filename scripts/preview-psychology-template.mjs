import { chromium } from 'playwright';

const SAMPLE_DATA = {
  profile: {
    id: 'preview-psych-1',
    full_name: 'Tatiana Ferrari',
    email: 'tatiana.ferrari@psikoaprende.com',
    phone: '+34 671 230 841',
    location: 'Palma de Mallorca, España',
    headline: 'Psicóloga Sanitaria | Especialista en Terapia de Pareja y Familia | Multilingüe',
    summary: 'Psicóloga Sanitaria con más de 20 años de trayectoria multicultural. Formada en Italia y España, combina psicoterapia clínica, mediación familiar y coordinación de parentalidad. Especialista en intervención con mujeres, adolescentes y familias en conflicto, con amplia experiencia en violencia de género. Ofrece atención en cuatro idiomas.',
    avatar_url: 'https://psikoaprende.com/wp-content/uploads/2025/10/tatiana-ferrari-e1761650705176.webp',
    country_code: 'ES',
    template: 'psychology-professional',
    slug: 'tatiana-ferrari',
    is_public: true,
    linkedin_url: 'https://linkedin.com/in/tatiana-ferrari-0a820a242',
    role: 'professional',
  },
  experiences: [
    {
      id: 'e1',
      position: 'Psicóloga Sanitaria',
      company_name: 'Clínica Bonaire Salud — Palma de Mallorca',
      start_date: '2018-01',
      end_date: null,
      is_current: true,
      description: 'Intervención clínica presencial con adultos, adolescentes y familias. Coordinación parental y mediación familiar en casos de alta conflictividad.',
      achievements: ['Coordinación de más de 80 casos de mediación familiar', 'Especialización en intervención con víctimas de violencia de género'],
    },
    {
      id: 'e2',
      position: 'Psicóloga Online — Consulta Internacional',
      company_name: 'Consulta Privada',
      start_date: '2015-03',
      end_date: null,
      is_current: true,
      description: 'Atención terapéutica online en español, italiano e inglés. Especialización en terapia de pareja y vínculos afectivos con pacientes en Europa y Latinoamérica.',
    },
    {
      id: 'e3',
      position: 'Psicóloga y Mediadora Familiar',
      company_name: 'Práctica Privada — Barcelona',
      start_date: '2010-09',
      end_date: '2015-02',
      is_current: false,
      description: 'Terapia individual y familiar. Atención a víctimas de violencia de género. Gestión de conflictos familiares con adolescentes.',
    },
  ],
  education: [
    {
      id: 'ed1',
      institution_name: 'Universidad de Florencia, Italia',
      degree: 'Licenciatura en Psicología Clínica',
      field_of_study: 'Psicología Clínica',
      start_date: '1999-09',
      end_date: '2003-06',
      is_current: false,
    },
    {
      id: 'ed2',
      institution_name: 'Universidad Autónoma de Barcelona',
      degree: 'Máster en Psicología y Psicoterapia Clínica',
      field_of_study: 'Psicoterapia Clínica',
      start_date: '2008-09',
      end_date: '2010-06',
      is_current: false,
    },
    {
      id: 'ed3',
      institution_name: 'Universidad Complutense de Madrid',
      degree: 'Experta Universitaria en Coordinación Parental',
      field_of_study: 'Coordinación Parental',
      start_date: '2023-01',
      end_date: '2023-12',
      is_current: false,
    },
  ],
  skills: [
    { id: 's1', name: 'Terapia de Pareja', level: 'EXPERT', category: 'Enfoque Terapéutico' },
    { id: 's2', name: 'Mediación Familiar', level: 'EXPERT', category: 'Enfoque Terapéutico' },
    { id: 's3', name: 'Coordinación de Parentalidad', level: 'EXPERT', category: 'Especialidad' },
    { id: 's4', name: 'Violencia de Género', level: 'ADVANCED', category: 'Especialidad' },
    { id: 's5', name: 'Terapia Cognitivo-Conductual', level: 'ADVANCED', category: 'Enfoque Terapéutico' },
    { id: 's6', name: 'Yoga Terapéutico', level: 'ADVANCED', category: 'Complementario' },
    { id: 's7', name: 'Coaching', level: 'INTERMEDIATE', category: 'Complementario' },
    { id: 's8', name: 'Psicomotricidad', level: 'INTERMEDIATE', category: 'Complementario' },
  ],
  languages: [
    { id: 'l1', profile_id: 'preview-psych-1', name: 'Italiano', level: 'NATIVE', is_native: true },
    { id: 'l2', profile_id: 'preview-psych-1', name: 'Español', level: 'C2', is_native: false },
    { id: 'l3', profile_id: 'preview-psych-1', name: 'Inglés', level: 'C1', is_native: false },
    { id: 'l4', profile_id: 'preview-psych-1', name: 'Catalán', level: 'B2', is_native: false },
  ],
  portfolioItems: [
    {
      id: 'c1',
      title: 'EMDR — Nivel Avanzado',
      type: 'CERTIFICATION',
      issuer: 'EMDR España',
      issue_date: '2019-06',
      verified: true,
      description: '',
    },
    {
      id: 'c2',
      title: 'Yoga Terapéutico',
      type: 'CERTIFICATION',
      issuer: 'Yoga Alliance',
      issue_date: '2016-03',
      verified: false,
      description: 'Formación en Barcelona e India',
    },
    {
      id: 'c3',
      title: 'Certificación en Coaching',
      type: 'CERTIFICATION',
      issuer: 'ALIMENTA Barcelona',
      issue_date: '2014-09',
      verified: false,
    },
    {
      id: 'p1',
      title: 'Máster en Terapia de Pareja y Vínculos Afectivos',
      type: 'PROJECT',
      description: '12 meses, 10 módulos — PsikoAprende',
      tags: ['Terapia de Pareja', 'Vínculos', 'Online'],
    },
    {
      id: 'p2',
      title: 'Curso de Terapia de Pareja',
      type: 'PROJECT',
      description: '2 meses, 8 módulos — PsikoAprende',
      tags: ['Terapia de Pareja', 'Intensivo'],
    },
  ],
  services: [
    { id: 'sv1', title: 'Terapia de Pareja', description: 'Presencial y online' },
    { id: 'sv2', title: 'Terapia Individual', description: 'Adultos y adolescentes' },
    { id: 'sv3', title: 'Mediación Familiar', description: 'Conflictos de alta intensidad' },
    { id: 'sv4', title: 'Coordinación de Parentalidad', description: 'Post-separación' },
  ],
  certifications: [],
  stamps: [
    {
      id: 'st1',
      profile_id: 'preview-psych-1',
      type: 'CERTIFICATION',
      status: 'VERIFIED',
      evidence: {
        name: 'Psicóloga Sanitaria Colegiada',
        issuer: 'Colegio Oficial de Psicología de Baleares',
        credential_id: 'B-03375',
      },
      provider: 'manual_admin',
      verified_by: 'admin',
      created_at: '2024-01-01',
      verified_at: '2024-01-15',
      metadata: {},
    },
    {
      id: 'st2',
      profile_id: 'preview-psych-1',
      type: 'EDUCATION',
      status: 'VERIFIED',
      evidence: {
        institution: 'Universidad de Florencia',
        degree: 'Licenciatura en Psicología Clínica',
      },
      provider: 'manual_admin',
      verified_by: 'admin',
      created_at: '2024-01-01',
      verified_at: '2024-01-15',
      metadata: {},
    },
    {
      id: 'st3',
      profile_id: 'preview-psych-1',
      type: 'EMAIL',
      status: 'VERIFIED',
      evidence: { email: 'tatiana.ferrari@psikoaprende.com' },
      provider: 'email_provider',
      verified_by: 'system',
      created_at: '2024-01-01',
      verified_at: '2024-01-01',
      metadata: {},
    },
  ],
  stats: [],
};

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  // Build a standalone HTML that renders the template data as a visual preview
  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=1280">
  <title>Psychology Professional Template Preview</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    * { font-family: 'Inter', system-ui, sans-serif; }
    body { margin: 0; background: #f9fafb; }
  </style>
</head>
<body>
  <div style="max-width: 900px; margin: 0 auto; background: white; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">

    <!-- HEADER -->
    <header style="position: relative; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #f0fdfa 0%, #ecfeff 50%, #f0fdf4 100%); padding: 40px;">
        <div style="display: flex; gap: 32px; align-items: flex-start; max-width: 820px; margin: 0 auto;">
          <!-- Avatar -->
          <div style="position: relative; flex-shrink: 0;">
            <div style="width: 144px; height: 144px; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.12); border: 4px solid rgba(255,255,255,0.8);">
              <img src="${SAMPLE_DATA.profile.avatar_url}" alt="" style="width: 100%; height: 100%; object-fit: cover;" />
            </div>
            <div style="position: absolute; bottom: -8px; right: -8px; width: 40px; height: 40px; border-radius: 12px; background: #0D9488; display: flex; align-items: center; justify-content: center; color: white; font-family: Georgia, serif; font-size: 24px; font-weight: bold; box-shadow: 0 4px 12px rgba(13,148,136,0.4);">&#936;</div>
          </div>
          <!-- Info -->
          <div style="flex: 1; padding-top: 4px;">
            <h1 style="font-size: 36px; font-weight: 800; color: #111827; margin: 0 0 8px 0; letter-spacing: -0.5px;">${SAMPLE_DATA.profile.full_name}</h1>
            <p style="font-size: 18px; font-weight: 600; color: #0D9488; margin: 0 0 12px 0;">${SAMPLE_DATA.profile.headline}</p>
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
              <span style="font-size: 13px; color: #6B7280;">🇪🇸 ${SAMPLE_DATA.profile.location}</span>
            </div>
            <div style="display: flex; gap: 6px; flex-wrap: wrap;">
              <span style="display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; background: #dcfce7; color: #166534; border-radius: 9999px; font-size: 11px; font-weight: 700;">✓ Colegiada Verificada</span>
              <span style="display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; background: #dbeafe; color: #1e40af; border-radius: 9999px; font-size: 11px; font-weight: 700;">✓ Educación Verificada</span>
              <span style="display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; background: #f3e8ff; color: #6b21a8; border-radius: 9999px; font-size: 11px; font-weight: 700;">✓ Email Verificado</span>
            </div>
            <div style="display: flex; gap: 8px; margin-top: 14px;">
              <button style="padding: 10px 24px; background: linear-gradient(to right, #0D9488, #0891B2); color: white; border: none; border-radius: 12px; font-weight: 600; font-size: 13px; cursor: pointer; box-shadow: 0 4px 12px rgba(13,148,136,0.3);">✉ Contactar</button>
              <button style="padding: 10px 24px; background: white; color: #374151; border: 2px solid #E5E7EB; border-radius: 12px; font-weight: 600; font-size: 13px; cursor: pointer;">📅 Agendar</button>
            </div>
          </div>
        </div>
      </div>
      <div style="height: 6px; background: linear-gradient(to right, #0D9488, #06B6D4, #0D9488);"></div>
    </header>

    <!-- BODY -->
    <div style="max-width: 820px; margin: 0 auto; padding: 40px; display: grid; grid-template-columns: 2fr 1fr; gap: 40px;">

      <!-- MAIN COLUMN -->
      <div>
        <!-- Perfil Profesional -->
        <section style="margin-bottom: 36px;">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
            <div style="width: 40px; height: 40px; border-radius: 12px; background: rgba(13,148,136,0.08); display: flex; align-items: center; justify-content: center; color: #0D9488; font-family: Georgia; font-size: 22px; font-weight: bold;">&#936;</div>
            <h2 style="font-size: 18px; font-weight: 700; color: #111827; text-transform: uppercase; letter-spacing: 1px; margin: 0;">Perfil Profesional</h2>
          </div>
          <p style="color: #374151; line-height: 1.7; font-size: 14px; margin: 0; padding-left: 52px;">${SAMPLE_DATA.profile.summary}</p>
        </section>

        <!-- Experiencia -->
        <section style="margin-bottom: 36px;">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px;">
            <div style="width: 40px; height: 40px; border-radius: 12px; background: rgba(13,148,136,0.08); display: flex; align-items: center; justify-content: center; color: #0D9488; font-size: 18px;">💼</div>
            <h2 style="font-size: 18px; font-weight: 700; color: #111827; text-transform: uppercase; letter-spacing: 1px; margin: 0;">Experiencia Clínica y Profesional</h2>
          </div>
          <div style="padding-left: 52px;">
            ${SAMPLE_DATA.experiences.map(exp => `
            <div style="position: relative; padding-left: 24px; border-left: 2px solid rgba(13,148,136,0.25); margin-bottom: 24px;">
              <div style="position: absolute; left: -7px; top: 6px; width: 12px; height: 12px; border-radius: 50%; background: #0D9488; border: 2px solid white;"></div>
              <div style="display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; gap: 8px; margin-bottom: 4px;">
                <h3 style="font-size: 16px; font-weight: 700; color: #111827; margin: 0;">${exp.position}</h3>
                <span style="font-size: 11px; font-weight: 600; padding: 3px 12px; border-radius: 9999px; background: rgba(13,148,136,0.12); color: #0D9488; white-space: nowrap;">${exp.start_date.slice(0,4)} – ${exp.end_date ? exp.end_date.slice(0,4) : 'Presente'}</span>
              </div>
              <p style="font-size: 13px; font-weight: 600; color: #0D9488; margin: 0 0 8px 0;">${exp.company_name}</p>
              <p style="font-size: 13px; color: #6B7280; line-height: 1.6; margin: 0;">${exp.description}</p>
              ${exp.achievements ? `<ul style="margin: 8px 0 0 0; padding: 0; list-style: none;">${exp.achievements.map(a => `<li style="display: flex; align-items: flex-start; gap: 6px; font-size: 12px; color: #6B7280; margin-bottom: 4px;"><span style="color: #0D9488; flex-shrink: 0;">✓</span> ${a}</li>`).join('')}</ul>` : ''}
            </div>`).join('')}
          </div>
        </section>

        <!-- Formación -->
        <section>
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px;">
            <div style="width: 40px; height: 40px; border-radius: 12px; background: rgba(13,148,136,0.08); display: flex; align-items: center; justify-content: center; color: #0D9488; font-size: 18px;">🎓</div>
            <h2 style="font-size: 18px; font-weight: 700; color: #111827; text-transform: uppercase; letter-spacing: 1px; margin: 0;">Formación Académica</h2>
          </div>
          <div style="padding-left: 52px; display: flex; flex-direction: column; gap: 12px;">
            ${SAMPLE_DATA.education.map(edu => `
            <div style="display: flex; gap: 12px; padding: 14px; border-radius: 12px; background: rgba(13,148,136,0.05); border: 1px solid rgba(13,148,136,0.15);">
              <div style="width: 44px; height: 44px; border-radius: 10px; background: rgba(13,148,136,0.12); display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 18px;">🎓</div>
              <div>
                <h3 style="font-size: 14px; font-weight: 700; color: #111827; margin: 0;">${edu.degree}</h3>
                <p style="font-size: 13px; color: #6B7280; margin: 2px 0 0 0;">${edu.institution_name}</p>
                <p style="font-size: 11px; color: #9CA3AF; margin: 4px 0 0 0;">${edu.start_date.slice(0,4)} – ${edu.end_date ? edu.end_date.slice(0,4) : 'En curso'}</p>
              </div>
            </div>`).join('')}
          </div>
        </section>
      </div>

      <!-- SIDEBAR -->
      <div>
        <!-- Servicios -->
        <div style="border-radius: 16px; padding: 20px; border: 1px solid rgba(13,148,136,0.2); margin-bottom: 20px;">
          <h3 style="font-size: 16px; font-weight: 700; color: #111827; margin: 0 0 14px 0; display: flex; align-items: center; gap: 8px;">❤️ Servicios</h3>
          ${SAMPLE_DATA.services.map(s => `
          <div style="padding: 10px; border-radius: 10px; background: rgba(13,148,136,0.06); margin-bottom: 8px;">
            <p style="font-size: 13px; font-weight: 600; color: #111827; margin: 0;">${s.title}</p>
            <p style="font-size: 11px; color: #9CA3AF; margin: 2px 0 0 0;">${s.description}</p>
          </div>`).join('')}
        </div>

        <!-- Especialidades -->
        <div style="border-radius: 16px; padding: 20px; border: 1px solid rgba(13,148,136,0.2); margin-bottom: 20px;">
          <h3 style="font-size: 16px; font-weight: 700; color: #111827; margin: 0 0 14px 0; display: flex; align-items: center; gap: 8px;">✨ Especialidades</h3>
          ${SAMPLE_DATA.skills.map(s => `
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 10px; border-radius: 10px; background: rgba(13,148,136,0.06); margin-bottom: 6px;">
            <span style="font-size: 13px; font-weight: 600; color: #1F2937;">${s.name}</span>
            <span style="padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; ${s.level === 'EXPERT' ? 'background: #ccfbf1; color: #115e59;' : s.level === 'ADVANCED' ? 'background: #cffafe; color: #155e75;' : 'background: #e0f2fe; color: #075985;'}">${s.level === 'EXPERT' ? 'Expert' : s.level === 'ADVANCED' ? 'Avanzado' : 'Intermedio'}</span>
          </div>`).join('')}
        </div>

        <!-- Idiomas -->
        <div style="border-radius: 16px; padding: 20px; border: 1px solid rgba(13,148,136,0.2); margin-bottom: 20px;">
          <h3 style="font-size: 16px; font-weight: 700; color: #111827; margin: 0 0 14px 0; display: flex; align-items: center; gap: 8px;">🌐 Idiomas</h3>
          ${SAMPLE_DATA.languages.map(l => `
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px; border-radius: 10px; background: rgba(13,148,136,0.06); margin-bottom: 6px;">
            <span style="font-size: 13px; font-weight: 600; color: #1F2937;">${l.name}</span>
            <span style="padding: 3px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; ${l.is_native ? 'background: #ccfbf1; color: #115e59;' : 'background: #cffafe; color: #155e75;'}">${l.is_native ? 'Nativo' : l.level}</span>
          </div>`).join('')}
        </div>

        <!-- Certificaciones -->
        <div style="border-radius: 16px; padding: 20px; border: 1px solid rgba(13,148,136,0.2); margin-bottom: 20px;">
          <h3 style="font-size: 16px; font-weight: 700; color: #111827; margin: 0 0 14px 0; display: flex; align-items: center; gap: 8px;">🏅 Certificaciones</h3>
          ${SAMPLE_DATA.portfolioItems.filter(p => p.type === 'CERTIFICATION').map(c => `
          <div style="padding: 10px; border-radius: 10px; background: rgba(13,148,136,0.06); border-left: 3px solid #0D9488; margin-bottom: 8px;">
            <h4 style="font-size: 13px; font-weight: 700; color: #111827; margin: 0; display: flex; align-items: center; gap: 6px;">${c.title}${c.verified ? ' <span style="padding: 1px 6px; background: #dcfce7; color: #166534; border-radius: 9999px; font-size: 9px;">✓ Verificada</span>' : ''}</h4>
            <p style="font-size: 11px; color: #6B7280; margin: 3px 0 0 0;">${c.issuer}</p>
          </div>`).join('')}
        </div>

        <!-- Docencia -->
        <div style="border-radius: 16px; padding: 20px; border: 1px solid rgba(13,148,136,0.2);">
          <h3 style="font-size: 16px; font-weight: 700; color: #111827; margin: 0 0 14px 0; display: flex; align-items: center; gap: 8px;">🎓 Docencia</h3>
          ${SAMPLE_DATA.portfolioItems.filter(p => p.type !== 'CERTIFICATION').map(p => `
          <div style="padding: 10px; border-radius: 10px; background: rgba(13,148,136,0.06); margin-bottom: 8px;">
            <p style="font-size: 13px; font-weight: 600; color: #1F2937; margin: 0;">${p.title}</p>
            ${p.description ? `<p style="font-size: 11px; color: #9CA3AF; margin: 3px 0 0 0;">${p.description}</p>` : ''}
            ${p.tags ? `<div style="display: flex; gap: 4px; flex-wrap: wrap; margin-top: 6px;">${p.tags.map(t => `<span style="padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-weight: 500; background: rgba(13,148,136,0.12); color: #0D9488;">${t}</span>`).join('')}</div>` : ''}
          </div>`).join('')}
        </div>
      </div>
    </div>

    <!-- FOOTER -->
    <footer style="border-top: 1px solid rgba(13,148,136,0.12); padding: 20px 40px; display: flex; align-items: center; justify-content: space-between;">
      <div style="display: flex; align-items: center; gap: 8px; font-size: 11px; color: #9CA3AF;">
        <span style="font-family: Georgia; font-weight: bold; color: #0D9488;">&#936;</span>
        Perfil profesional generado en YourCVPassport
      </div>
    </footer>
  </div>
</body>
</html>`;

  await page.setContent(html, { waitUntil: 'networkidle' });

  // Wait for images
  await page.waitForTimeout(2000);

  await page.screenshot({
    path: 'public/images/templates/psychology-professional.png',
    fullPage: true,
  });

  console.log('Screenshot saved to public/images/templates/psychology-professional.png');
  await browser.close();
})();
