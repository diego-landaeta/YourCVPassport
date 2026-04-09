from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})

    # Read the preview HTML that was used for the PNG generation
    # We'll navigate directly to the standalone HTML preview
    page.goto('http://localhost:5177')
    page.wait_for_load_state('networkidle')
    page.screenshot(path='/tmp/home-check.png')
    print("Home page screenshot saved")

    # Now load the template preview as a standalone page
    # We'll create it inline from the file
    import os
    preview_path = os.path.abspath(os.path.join(
        os.path.dirname(__file__), '..', 'public', 'images', 'templates', 'psychology-professional-preview.html'
    ))

    html_content = open(preview_path, 'r', encoding='utf-8').read() if os.path.exists(preview_path) else None

    if not html_content:
        # Build the preview HTML inline
        html_content = """<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=1440">
  <title>Psychology Professional Template — YourCVPassport</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    * { font-family: 'Inter', system-ui, sans-serif; }
    body { margin: 0; background: #f3f4f6; }
  </style>
</head>
<body>
  <div style="max-width: 960px; margin: 0 auto; background: white; box-shadow: 0 4px 24px rgba(0,0,0,0.08); min-height: 100vh;">

    <!-- ===== HEADER ===== -->
    <header style="position: relative; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #f0fdfa 0%, #ecfeff 40%, #f0fdf4 100%); padding: 44px 48px;">
        <!-- Subtle dot pattern -->
        <div style="position: absolute; inset: 0; opacity: 0.03; background-image: radial-gradient(circle, #0D9488 1px, transparent 1px); background-size: 24px 24px;"></div>
        <div style="position: relative; display: flex; gap: 36px; align-items: flex-start;">
          <!-- Avatar -->
          <div style="position: relative; flex-shrink: 0;">
            <div style="width: 152px; height: 152px; border-radius: 18px; overflow: hidden; box-shadow: 0 12px 36px rgba(0,0,0,0.12); border: 4px solid rgba(255,255,255,0.85);">
              <img src="https://psikoaprende.com/wp-content/uploads/2025/10/tatiana-ferrari-e1761650705176.webp" alt="Tatiana Ferrari" style="width: 100%; height: 100%; object-fit: cover;" />
            </div>
            <!-- Psi badge -->
            <div style="position: absolute; bottom: -8px; right: -8px; width: 42px; height: 42px; border-radius: 13px; background: #0D9488; display: flex; align-items: center; justify-content: center; color: white; font-family: Georgia, serif; font-size: 26px; font-weight: bold; box-shadow: 0 4px 14px rgba(13,148,136,0.45);">&#936;</div>
          </div>
          <!-- Info -->
          <div style="flex: 1; padding-top: 2px;">
            <h1 style="font-size: 38px; font-weight: 800; color: #111827; margin: 0 0 6px 0; letter-spacing: -0.6px;">Tatiana Ferrari</h1>
            <p style="font-size: 17px; font-weight: 600; color: #0D9488; margin: 0 0 14px 0; line-height: 1.4;">Psicóloga Sanitaria | Especialista en Terapia de Pareja y Familia | Multilingüe</p>
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 14px;">
              <span style="font-size: 13px; color: #6B7280; display: flex; align-items: center; gap: 4px;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="2"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
                Palma de Mallorca, España
              </span>
              <span style="font-size: 20px;">🇪🇸</span>
            </div>
            <!-- Stamps -->
            <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 16px;">
              <span style="display: inline-flex; align-items: center; gap: 5px; padding: 5px 12px; background: #dcfce7; color: #166534; border-radius: 9999px; font-size: 11px; font-weight: 700;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 6L9 17l-5-5"/></svg>
                Colegiada B-03375 Verificada
              </span>
              <span style="display: inline-flex; align-items: center; gap: 5px; padding: 5px 12px; background: #dbeafe; color: #1e40af; border-radius: 9999px; font-size: 11px; font-weight: 700;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 6L9 17l-5-5"/></svg>
                Educación Verificada
              </span>
              <span style="display: inline-flex; align-items: center; gap: 5px; padding: 5px 12px; background: #f3e8ff; color: #6b21a8; border-radius: 9999px; font-size: 11px; font-weight: 700;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 6L9 17l-5-5"/></svg>
                Email Verificado
              </span>
            </div>
            <!-- Buttons -->
            <div style="display: flex; gap: 10px;">
              <button style="padding: 11px 28px; background: linear-gradient(135deg, #0D9488, #0891B2); color: white; border: none; border-radius: 13px; font-weight: 700; font-size: 13px; cursor: pointer; box-shadow: 0 4px 14px rgba(13,148,136,0.35); display: flex; align-items: center; gap: 6px;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                Contactar
              </button>
              <button style="padding: 11px 28px; background: white; color: #374151; border: 2px solid #E5E7EB; border-radius: 13px; font-weight: 700; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 6px;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                Agendar Cita
              </button>
            </div>
          </div>
        </div>
      </div>
      <!-- Accent bar -->
      <div style="height: 5px; background: linear-gradient(to right, #0D9488, #06B6D4, #14B8A6, #0D9488);"></div>
    </header>

    <!-- ===== BODY — Two columns ===== -->
    <div style="padding: 44px 48px; display: grid; grid-template-columns: 1.8fr 1fr; gap: 44px;">

      <!-- ===== MAIN COLUMN ===== -->
      <div>
        <!-- PERFIL PROFESIONAL -->
        <section style="margin-bottom: 40px;">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 18px;">
            <div style="width: 42px; height: 42px; border-radius: 12px; background: rgba(13,148,136,0.08); display: flex; align-items: center; justify-content: center; color: #0D9488; font-family: Georgia, serif; font-size: 24px; font-weight: bold;">&#936;</div>
            <h2 style="font-size: 16px; font-weight: 800; color: #111827; text-transform: uppercase; letter-spacing: 1.5px; margin: 0;">Perfil Profesional</h2>
          </div>
          <p style="color: #4B5563; line-height: 1.75; font-size: 14px; margin: 0; padding-left: 54px;">Psicóloga Sanitaria con más de 20 años de trayectoria multicultural. Formada en Italia y España, combina psicoterapia clínica, mediación familiar y coordinación de parentalidad. Especialista en intervención con mujeres, adolescentes y familias en conflicto, con amplia experiencia en violencia de género. Ofrece atención en cuatro idiomas.</p>
        </section>

        <!-- EXPERIENCIA CLÍNICA Y PROFESIONAL -->
        <section style="margin-bottom: 40px;">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 22px;">
            <div style="width: 42px; height: 42px; border-radius: 12px; background: rgba(13,148,136,0.08); display: flex; align-items: center; justify-content: center;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0D9488" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>
            </div>
            <h2 style="font-size: 16px; font-weight: 800; color: #111827; text-transform: uppercase; letter-spacing: 1.5px; margin: 0;">Experiencia Clínica y Profesional</h2>
          </div>
          <div style="padding-left: 54px;">
            <!-- Exp 1 -->
            <div style="position: relative; padding-left: 26px; border-left: 2px solid rgba(13,148,136,0.25); margin-bottom: 28px; padding-bottom: 4px;">
              <div style="position: absolute; left: -7px; top: 5px; width: 12px; height: 12px; border-radius: 50%; background: #0D9488; border: 3px solid white; box-shadow: 0 0 0 1px rgba(13,148,136,0.3);"></div>
              <div style="display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; gap: 8px; margin-bottom: 4px;">
                <h3 style="font-size: 16px; font-weight: 700; color: #111827; margin: 0;">Psicóloga Sanitaria</h3>
                <span style="font-size: 11px; font-weight: 700; padding: 3px 14px; border-radius: 9999px; background: rgba(13,148,136,0.1); color: #0D9488; white-space: nowrap;">2018 – Presente</span>
              </div>
              <p style="font-size: 13px; font-weight: 600; color: #0D9488; margin: 0 0 8px 0;">Clínica Bonaire Salud — Palma de Mallorca</p>
              <p style="font-size: 13px; color: #6B7280; line-height: 1.6; margin: 0;">Intervención clínica presencial con adultos, adolescentes y familias. Coordinación parental y mediación familiar en casos de alta conflictividad.</p>
              <ul style="margin: 10px 0 0 0; padding: 0; list-style: none;">
                <li style="display: flex; align-items: flex-start; gap: 7px; font-size: 12px; color: #6B7280; margin-bottom: 5px;">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0D9488" stroke-width="2.5" style="flex-shrink: 0; margin-top: 1px;"><path d="M20 6L9 17l-5-5"/></svg>
                  Coordinación de más de 80 casos de mediación familiar
                </li>
                <li style="display: flex; align-items: flex-start; gap: 7px; font-size: 12px; color: #6B7280; margin-bottom: 5px;">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0D9488" stroke-width="2.5" style="flex-shrink: 0; margin-top: 1px;"><path d="M20 6L9 17l-5-5"/></svg>
                  Especialización en intervención con víctimas de violencia de género
                </li>
              </ul>
            </div>

            <!-- Exp 2 -->
            <div style="position: relative; padding-left: 26px; border-left: 2px solid rgba(13,148,136,0.25); margin-bottom: 28px; padding-bottom: 4px;">
              <div style="position: absolute; left: -7px; top: 5px; width: 12px; height: 12px; border-radius: 50%; background: #0D9488; border: 3px solid white; box-shadow: 0 0 0 1px rgba(13,148,136,0.3);"></div>
              <div style="display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; gap: 8px; margin-bottom: 4px;">
                <h3 style="font-size: 16px; font-weight: 700; color: #111827; margin: 0;">Psicóloga Online — Consulta Internacional</h3>
                <span style="font-size: 11px; font-weight: 700; padding: 3px 14px; border-radius: 9999px; background: rgba(13,148,136,0.1); color: #0D9488; white-space: nowrap;">2015 – Presente</span>
              </div>
              <p style="font-size: 13px; font-weight: 600; color: #0D9488; margin: 0 0 8px 0;">Consulta Privada</p>
              <p style="font-size: 13px; color: #6B7280; line-height: 1.6; margin: 0;">Atención terapéutica online en español, italiano e inglés. Especialización en terapia de pareja y vínculos afectivos con pacientes en Europa y Latinoamérica.</p>
            </div>

            <!-- Exp 3 -->
            <div style="position: relative; padding-left: 26px; border-left: 2px solid transparent; padding-bottom: 0;">
              <div style="position: absolute; left: -7px; top: 5px; width: 12px; height: 12px; border-radius: 50%; background: #0D9488; border: 3px solid white; box-shadow: 0 0 0 1px rgba(13,148,136,0.3);"></div>
              <div style="display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; gap: 8px; margin-bottom: 4px;">
                <h3 style="font-size: 16px; font-weight: 700; color: #111827; margin: 0;">Psicóloga y Mediadora Familiar</h3>
                <span style="font-size: 11px; font-weight: 700; padding: 3px 14px; border-radius: 9999px; background: rgba(13,148,136,0.1); color: #0D9488; white-space: nowrap;">2010 – 2015</span>
              </div>
              <p style="font-size: 13px; font-weight: 600; color: #0D9488; margin: 0 0 8px 0;">Práctica Privada — Barcelona</p>
              <p style="font-size: 13px; color: #6B7280; line-height: 1.6; margin: 0;">Terapia individual y familiar. Atención a víctimas de violencia de género. Gestión de conflictos familiares con adolescentes.</p>
            </div>
          </div>
        </section>

        <!-- FORMACIÓN ACADÉMICA -->
        <section>
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 22px;">
            <div style="width: 42px; height: 42px; border-radius: 12px; background: rgba(13,148,136,0.08); display: flex; align-items: center; justify-content: center;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0D9488" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 1 2 3 6 3s6-2 6-3v-5"/></svg>
            </div>
            <h2 style="font-size: 16px; font-weight: 800; color: #111827; text-transform: uppercase; letter-spacing: 1.5px; margin: 0;">Formación Académica</h2>
          </div>
          <div style="padding-left: 54px; display: flex; flex-direction: column; gap: 12px;">
            <div style="display: flex; gap: 14px; padding: 16px; border-radius: 14px; background: rgba(13,148,136,0.04); border: 1px solid rgba(13,148,136,0.12);">
              <div style="width: 46px; height: 46px; border-radius: 12px; background: rgba(13,148,136,0.1); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0D9488" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 1 2 3 6 3s6-2 6-3v-5"/></svg>
              </div>
              <div>
                <h3 style="font-size: 14px; font-weight: 700; color: #111827; margin: 0;">Licenciatura en Psicología Clínica</h3>
                <p style="font-size: 13px; color: #6B7280; margin: 3px 0 0 0; font-weight: 500;">Universidad de Florencia, Italia</p>
                <p style="font-size: 11px; color: #9CA3AF; margin: 4px 0 0 0;">1999 – 2003</p>
              </div>
            </div>
            <div style="display: flex; gap: 14px; padding: 16px; border-radius: 14px; background: rgba(13,148,136,0.04); border: 1px solid rgba(13,148,136,0.12);">
              <div style="width: 46px; height: 46px; border-radius: 12px; background: rgba(13,148,136,0.1); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0D9488" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 1 2 3 6 3s6-2 6-3v-5"/></svg>
              </div>
              <div>
                <h3 style="font-size: 14px; font-weight: 700; color: #111827; margin: 0;">Máster en Psicología y Psicoterapia Clínica</h3>
                <p style="font-size: 13px; color: #6B7280; margin: 3px 0 0 0; font-weight: 500;">Universidad Autónoma de Barcelona</p>
                <p style="font-size: 11px; color: #9CA3AF; margin: 4px 0 0 0;">2008 – 2010</p>
              </div>
            </div>
            <div style="display: flex; gap: 14px; padding: 16px; border-radius: 14px; background: rgba(13,148,136,0.04); border: 1px solid rgba(13,148,136,0.12);">
              <div style="width: 46px; height: 46px; border-radius: 12px; background: rgba(13,148,136,0.1); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0D9488" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 1 2 3 6 3s6-2 6-3v-5"/></svg>
              </div>
              <div>
                <h3 style="font-size: 14px; font-weight: 700; color: #111827; margin: 0;">Experta Universitaria en Coordinación Parental</h3>
                <p style="font-size: 13px; color: #6B7280; margin: 3px 0 0 0; font-weight: 500;">Universidad Complutense de Madrid</p>
                <p style="font-size: 11px; color: #9CA3AF; margin: 4px 0 0 0;">2023</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <!-- ===== SIDEBAR ===== -->
      <div>
        <!-- SERVICIOS -->
        <div style="border-radius: 18px; padding: 22px; border: 1px solid rgba(13,148,136,0.18); margin-bottom: 20px;">
          <h3 style="font-size: 15px; font-weight: 800; color: #111827; margin: 0 0 16px 0; display: flex; align-items: center; gap: 8px;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0D9488" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
            Servicios
          </h3>
          <div style="padding: 11px 14px; border-radius: 11px; background: rgba(13,148,136,0.05); margin-bottom: 8px;">
            <p style="font-size: 13px; font-weight: 700; color: #111827; margin: 0;">Terapia de Pareja</p>
            <p style="font-size: 11px; color: #9CA3AF; margin: 3px 0 0 0;">Presencial y online</p>
          </div>
          <div style="padding: 11px 14px; border-radius: 11px; background: rgba(13,148,136,0.05); margin-bottom: 8px;">
            <p style="font-size: 13px; font-weight: 700; color: #111827; margin: 0;">Terapia Individual</p>
            <p style="font-size: 11px; color: #9CA3AF; margin: 3px 0 0 0;">Adultos y adolescentes</p>
          </div>
          <div style="padding: 11px 14px; border-radius: 11px; background: rgba(13,148,136,0.05); margin-bottom: 8px;">
            <p style="font-size: 13px; font-weight: 700; color: #111827; margin: 0;">Mediación Familiar</p>
            <p style="font-size: 11px; color: #9CA3AF; margin: 3px 0 0 0;">Conflictos de alta intensidad</p>
          </div>
          <div style="padding: 11px 14px; border-radius: 11px; background: rgba(13,148,136,0.05);">
            <p style="font-size: 13px; font-weight: 700; color: #111827; margin: 0;">Coordinación de Parentalidad</p>
            <p style="font-size: 11px; color: #9CA3AF; margin: 3px 0 0 0;">Post-separación</p>
          </div>
        </div>

        <!-- ESPECIALIDADES -->
        <div style="border-radius: 18px; padding: 22px; border: 1px solid rgba(13,148,136,0.18); margin-bottom: 20px;">
          <h3 style="font-size: 15px; font-weight: 800; color: #111827; margin: 0 0 16px 0; display: flex; align-items: center; gap: 8px;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0D9488" stroke-width="2"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
            Especialidades
          </h3>
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 9px 12px; border-radius: 10px; background: rgba(13,148,136,0.05); margin-bottom: 7px;">
            <span style="font-size: 13px; font-weight: 600; color: #1F2937;">Terapia de Pareja</span>
            <span style="padding: 2px 10px; border-radius: 9999px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; background: #ccfbf1; color: #115e59;">Expert</span>
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 9px 12px; border-radius: 10px; background: rgba(13,148,136,0.05); margin-bottom: 7px;">
            <span style="font-size: 13px; font-weight: 600; color: #1F2937;">Mediación Familiar</span>
            <span style="padding: 2px 10px; border-radius: 9999px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; background: #ccfbf1; color: #115e59;">Expert</span>
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 9px 12px; border-radius: 10px; background: rgba(13,148,136,0.05); margin-bottom: 7px;">
            <span style="font-size: 13px; font-weight: 600; color: #1F2937;">Coord. Parentalidad</span>
            <span style="padding: 2px 10px; border-radius: 9999px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; background: #ccfbf1; color: #115e59;">Expert</span>
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 9px 12px; border-radius: 10px; background: rgba(13,148,136,0.05); margin-bottom: 7px;">
            <span style="font-size: 13px; font-weight: 600; color: #1F2937;">Violencia de Género</span>
            <span style="padding: 2px 10px; border-radius: 9999px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; background: #cffafe; color: #155e75;">Avanzado</span>
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 9px 12px; border-radius: 10px; background: rgba(13,148,136,0.05); margin-bottom: 7px;">
            <span style="font-size: 13px; font-weight: 600; color: #1F2937;">Terapia Cognitivo-Conductual</span>
            <span style="padding: 2px 10px; border-radius: 9999px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; background: #cffafe; color: #155e75;">Avanzado</span>
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 9px 12px; border-radius: 10px; background: rgba(13,148,136,0.05); margin-bottom: 7px;">
            <span style="font-size: 13px; font-weight: 600; color: #1F2937;">Yoga Terapéutico</span>
            <span style="padding: 2px 10px; border-radius: 9999px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; background: #cffafe; color: #155e75;">Avanzado</span>
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 9px 12px; border-radius: 10px; background: rgba(13,148,136,0.05); margin-bottom: 7px;">
            <span style="font-size: 13px; font-weight: 600; color: #1F2937;">Coaching</span>
            <span style="padding: 2px 10px; border-radius: 9999px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; background: #e0f2fe; color: #075985;">Intermedio</span>
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 9px 12px; border-radius: 10px; background: rgba(13,148,136,0.05);">
            <span style="font-size: 13px; font-weight: 600; color: #1F2937;">Psicomotricidad</span>
            <span style="padding: 2px 10px; border-radius: 9999px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; background: #e0f2fe; color: #075985;">Intermedio</span>
          </div>
        </div>

        <!-- IDIOMAS -->
        <div style="border-radius: 18px; padding: 22px; border: 1px solid rgba(13,148,136,0.18); margin-bottom: 20px;">
          <h3 style="font-size: 15px; font-weight: 800; color: #111827; margin: 0 0 16px 0; display: flex; align-items: center; gap: 8px;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0D9488" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>
            Idiomas
          </h3>
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 11px 14px; border-radius: 10px; background: rgba(13,148,136,0.05); margin-bottom: 7px;">
            <span style="font-size: 13px; font-weight: 600; color: #1F2937;">Italiano</span>
            <span style="padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 700; background: #ccfbf1; color: #115e59;">Nativo</span>
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 11px 14px; border-radius: 10px; background: rgba(13,148,136,0.05); margin-bottom: 7px;">
            <span style="font-size: 13px; font-weight: 600; color: #1F2937;">Español</span>
            <span style="padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 700; background: #cffafe; color: #155e75;">C2</span>
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 11px 14px; border-radius: 10px; background: rgba(13,148,136,0.05); margin-bottom: 7px;">
            <span style="font-size: 13px; font-weight: 600; color: #1F2937;">Inglés</span>
            <span style="padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 700; background: #cffafe; color: #155e75;">C1</span>
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 11px 14px; border-radius: 10px; background: rgba(13,148,136,0.05);">
            <span style="font-size: 13px; font-weight: 600; color: #1F2937;">Catalán</span>
            <span style="padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 700; background: #cffafe; color: #155e75;">B2</span>
          </div>
        </div>

        <!-- CERTIFICACIONES -->
        <div style="border-radius: 18px; padding: 22px; border: 1px solid rgba(13,148,136,0.18); margin-bottom: 20px;">
          <h3 style="font-size: 15px; font-weight: 800; color: #111827; margin: 0 0 16px 0; display: flex; align-items: center; gap: 8px;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0D9488" stroke-width="2"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
            Certificaciones
          </h3>
          <div style="padding: 12px 14px; border-radius: 11px; background: rgba(13,148,136,0.05); border-left: 3px solid #0D9488; margin-bottom: 10px;">
            <h4 style="font-size: 13px; font-weight: 700; color: #111827; margin: 0; display: flex; align-items: center; gap: 7px;">
              EMDR — Nivel Avanzado
              <span style="padding: 2px 8px; background: #dcfce7; color: #166534; border-radius: 9999px; font-size: 9px; font-weight: 800; display: inline-flex; align-items: center; gap: 3px;">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 6L9 17l-5-5"/></svg>
                Verificada
              </span>
            </h4>
            <p style="font-size: 11px; color: #6B7280; margin: 4px 0 0 0;">EMDR España • Jun 2019</p>
          </div>
          <div style="padding: 12px 14px; border-radius: 11px; background: rgba(13,148,136,0.05); border-left: 3px solid #0D9488; margin-bottom: 10px;">
            <h4 style="font-size: 13px; font-weight: 700; color: #111827; margin: 0;">Yoga Terapéutico</h4>
            <p style="font-size: 11px; color: #6B7280; margin: 4px 0 0 0;">Yoga Alliance • Mar 2016</p>
          </div>
          <div style="padding: 12px 14px; border-radius: 11px; background: rgba(13,148,136,0.05); border-left: 3px solid #0D9488;">
            <h4 style="font-size: 13px; font-weight: 700; color: #111827; margin: 0;">Certificación en Coaching</h4>
            <p style="font-size: 11px; color: #6B7280; margin: 4px 0 0 0;">ALIMENTA Barcelona • Sep 2014</p>
          </div>
        </div>

        <!-- DOCENCIA -->
        <div style="border-radius: 18px; padding: 22px; border: 1px solid rgba(13,148,136,0.18);">
          <h3 style="font-size: 15px; font-weight: 800; color: #111827; margin: 0 0 16px 0; display: flex; align-items: center; gap: 8px;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0D9488" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 1 2 3 6 3s6-2 6-3v-5"/></svg>
            Docencia
          </h3>
          <div style="padding: 12px 14px; border-radius: 11px; background: rgba(13,148,136,0.05); margin-bottom: 10px;">
            <p style="font-size: 13px; font-weight: 700; color: #1F2937; margin: 0;">Máster en Terapia de Pareja y Vínculos Afectivos</p>
            <p style="font-size: 11px; color: #9CA3AF; margin: 4px 0 0 0;">12 meses, 10 módulos — PsikoAprende</p>
            <div style="display: flex; gap: 5px; flex-wrap: wrap; margin-top: 8px;">
              <span style="padding: 2px 10px; border-radius: 9999px; font-size: 10px; font-weight: 600; background: rgba(13,148,136,0.1); color: #0D9488;">Terapia de Pareja</span>
              <span style="padding: 2px 10px; border-radius: 9999px; font-size: 10px; font-weight: 600; background: rgba(13,148,136,0.1); color: #0D9488;">Vínculos</span>
              <span style="padding: 2px 10px; border-radius: 9999px; font-size: 10px; font-weight: 600; background: rgba(13,148,136,0.1); color: #0D9488;">Online</span>
            </div>
          </div>
          <div style="padding: 12px 14px; border-radius: 11px; background: rgba(13,148,136,0.05);">
            <p style="font-size: 13px; font-weight: 700; color: #1F2937; margin: 0;">Curso de Terapia de Pareja</p>
            <p style="font-size: 11px; color: #9CA3AF; margin: 4px 0 0 0;">2 meses, 8 módulos — PsikoAprende</p>
            <div style="display: flex; gap: 5px; flex-wrap: wrap; margin-top: 8px;">
              <span style="padding: 2px 10px; border-radius: 9999px; font-size: 10px; font-weight: 600; background: rgba(13,148,136,0.1); color: #0D9488;">Terapia de Pareja</span>
              <span style="padding: 2px 10px; border-radius: 9999px; font-size: 10px; font-weight: 600; background: rgba(13,148,136,0.1); color: #0D9488;">Intensivo</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- FOOTER -->
    <footer style="border-top: 1px solid rgba(13,148,136,0.1); padding: 22px 48px; display: flex; align-items: center; justify-content: space-between;">
      <div style="display: flex; align-items: center; gap: 8px; font-size: 12px; color: #9CA3AF;">
        <span style="font-family: Georgia, serif; font-weight: bold; color: #0D9488; font-size: 16px;">&#936;</span>
        Perfil profesional generado en <strong style="color: #6B7280;">YourCVPassport</strong>
      </div>
      <span style="font-size: 11px; color: #D1D5DB;">tatiana.ferrari@psikoaprende.com</span>
    </footer>
  </div>
</body>
</html>"""

    page2 = browser.new_page(viewport={"width": 1440, "height": 900})
    page2.set_content(html_content)
    page2.wait_for_load_state('networkidle')
    page2.wait_for_timeout(2000)

    page2.screenshot(path='/tmp/psychology-template-full.png', full_page=True)
    print("Full template screenshot saved to /tmp/psychology-template-full.png")

    # Also take viewport-sized screenshots for top and bottom sections
    page2.screenshot(path='/tmp/psychology-template-top.png', clip={"x": 0, "y": 0, "width": 1440, "height": 900})
    print("Top section screenshot saved")

    page2.screenshot(path='/tmp/psychology-template-middle.png', clip={"x": 0, "y": 400, "width": 1440, "height": 900})
    print("Middle section screenshot saved")

    browser.close()
