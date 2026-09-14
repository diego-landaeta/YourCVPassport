-- ============================================================================
-- SEED: Arantxa Saiz Casas · Logopeda colegiada Nº 461755
-- Date: 2026-09-07
-- Sources: CV en PDF aportado por la interesada (CURRÍCULUM 2026.pdf)
--          + ficha profesional pública en Doctoralia (verificación cruzada)
--          + su perfil de LinkedIn, revisado el 2026-09-07. De ahí salen datos
--            que NO estaban en el CV: el empleador real de la etapa de Cañete
--            (Ayuntamiento de Cañete), el nombre correcto del centro de
--            prácticas (Equip L''Andana, no "Centro L''Andana"), la jornada
--            parcial en Gabaldón y el dominio de SAAC. Su LinkedIn está
--            desactualizado: no recoge ni Hermanas Hospitalarias (may 2026),
--            ni el máster de ISEP, ni el PATI, ni consulta privada.
-- Template: passport (mismo que el resto de perfiles del proyecto)
-- Brand color: #6D5FA8 (lavanda — tomado de la identidad visual de su propio CV;
--              la distingue de ISEIE #1E40AF, PsikoAprende #0D9488, Aleix #0369A1)
-- Safe to re-run: cleanup DELETEs make INSERTs idempotent
--
-- Auth user creado en Supabase Dashboard.
-- UUID: 612f8c1c-4112-489a-b0dd-a913c28b1863
--
-- Primer perfil de logopedia de la plataforma (verificado en BD: no había ninguno).
-- ============================================================================

DO $$
DECLARE
  p CONSTANT UUID := '612f8c1c-4112-489a-b0dd-a913c28b1863';  -- Arantxa Saiz Casas
BEGIN

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 0: CLEANUP (idempotente)
-- ═══════════════════════════════════════════════════════════════════════
DELETE FROM portfolio_items WHERE profile_id = p;
DELETE FROM skills          WHERE profile_id = p;
DELETE FROM languages       WHERE profile_id = p;
DELETE FROM education       WHERE profile_id = p;
DELETE FROM experiences     WHERE profile_id = p;

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 2: PROFILE
-- ═══════════════════════════════════════════════════════════════════════
UPDATE profiles SET
  full_name = 'Arantxa Saiz Casas',
  headline = 'Logopeda colegiada Nº 461755 · Daño neurológico adulto y neurodesarrollo infantil · Ictus, Párkinson, TEA y TDAH',
  summary = 'Logopeda colegiada (Nº 461755) formada en la Universitat de València, con una trayectoria construida deliberadamente sobre dos verticales complementarias: el neurodesarrollo infantil y el daño neurológico en el adulto. No es un perfil disperso: cada etapa clínica ha ido acompañada de la formación específica que la respalda, y el máster que cursa actualmente en ISEP se titula precisamente "Logopedia Clínica: Abordaje en Daño Neurológico Adulto y Neurodesarrollo Infantil", es decir, la formalización académica exacta de las dos líneas que ya venía trabajando en consulta. Su formación de grado se desarrolla entre septiembre de 2018 y julio de 2022 en la Universitat de València, y desde el tramo final de la carrera la compagina con práctica clínica real: entre octubre de 2021 y mayo de 2022 realiza las prácticas curriculares en Equip L''Andana (Valencia), centro especializado en Trastornos del Espectro del Autismo, donde toma contacto directo con la intervención en TEA y con los Sistemas Aumentativos y Alternativos de Comunicación (SAAC). Terminado el grado da un paso poco habitual y se marcha a Italia: entre octubre de 2022 y julio de 2023 completa diez meses de prácticas extracurriculares en el Centro Sprint de Siena, estudio poliespecialístico de rehabilitación infantil terapéutica, una estancia que le aporta exposición a un modelo asistencial distinto y a un equipo multidisciplinar en otro idioma y otro sistema sanitario. A su vuelta inicia su etapa profesional más larga: tres años como logopeda en el Centro Psicopedagógico Gabaldón (septiembre de 2023 a agosto de 2026), atendiendo en Valencia y Ribarroja, dedicados a la evaluación e intervención logopédica en población infantil. Es en ese periodo cuando su práctica se ensancha hacia el conjunto de cuadros que hoy domina en el ámbito infantil: trastornos del espectro autista, TDAH, retraso del lenguaje, dislalia y rotacismo, dislexia y dificultades de lectoescritura, atención temprana y rehabilitación de la voz infantil. En paralelo, entre diciembre de 2023 y marzo de 2024, ejerce como PATI (Persona de Asistencia Terapéutica Infantil) dando apoyo logopédico dentro del aula a una niña de cuatro años con Síndrome de Dravet, una encefalopatía epiléptica rara y de alta complejidad: un trabajo que exige coordinación estrecha con el equipo docente y la familia, y que orienta la intervención no sólo al lenguaje sino a la comunicación funcional y a la participación escolar real de la menor. Desde mayo de 2026 da el salto al adulto neurológico incorporándose a la Fundación Hermanas Hospitalarias en Valencia, donde trabaja en rehabilitación del lenguaje, del habla, de la deglución y de la motricidad orofacial en pacientes con ictus. Esa transición está sostenida por una formación continua constante y bien dirigida: taller práctico en deglución atípica (INFOSAL, septiembre de 2023), taller práctico en intervención logopédica en Párkinson (INFOSAL, enero de 2025), curso sobre tartamudez en adultos y adolescentes (febrero de 2025) y taller práctico en parálisis facial (ISEP, octubre de 2025). El resultado es una logopeda capaz de moverse con solvencia entre los dos extremos del ciclo vital —de la atención temprana y el aula al paciente con ictus, Párkinson o Alzheimer— con dominio tanto del área del lenguaje y el habla como del área de la deglución y la motricidad orofacial.',
  role = 'professional', plan = 'pro',
  template = 'passport', template_color = '#6D5FA8',
  location = 'Mislata, Valencia, España', country_code = 'ES',
  slug = 'arantxa-saiz', is_active = true,
  job_seeking_status = 'OPEN', is_open_to_messages = true,
  wizard_completed = true, first_login_completed = true, dashboard_tour_completed = true,
  meta_title = 'Arantxa Saiz Casas · Logopeda en Valencia · Daño neurológico y neurodesarrollo',
  meta_description = 'Logopeda colegiada Nº 461755 en Valencia. Rehabilitación del lenguaje, habla y deglución en ictus y Párkinson, e intervención infantil en TEA, TDAH y lectoescritura.',
  linkedin_url = 'https://www.linkedin.com/in/arantxa-saiz-casas-768a0528a'
WHERE id = p;

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 3: EXPERIENCES
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO experiences (profile_id, company_name, position, start_date, end_date, is_current, description, sort_order) VALUES
  (p, 'Fundación Hermanas Hospitalarias', 'Logopeda - Rehabilitación neurológica de adultos', '2026-05-15', NULL, true, 'Logopeda en la Fundación Hermanas Hospitalarias (Valencia), institución de referencia en atención sanitaria especializada. Rehabilitación del lenguaje, del habla, de la deglución y de la motricidad orofacial en pacientes con ictus. Intervención en daño cerebral adquirido dentro de un equipo de rehabilitación multidisciplinar, con evaluación funcional, diseño del plan de tratamiento y seguimiento de la evolución del paciente. Esta incorporación marca el salto de su carrera desde la población infantil hacia la rehabilitación neurológica del adulto.', 1),
  (p, 'Centro Psicopedagógico Gabaldón', 'Logopeda - Población infantil', '2023-09-15', '2026-08-15', false, 'Tres años como logopeda en jornada parcial en el Centro Psicopedagógico Gabaldón, atendiendo en las sedes de Valencia y Ribarroja. Evaluación e intervención logopédica en población infantil: exploración y diagnóstico logopédico, diseño de programas de intervención individualizados, tratamiento directo y coordinación continuada con familias y centros educativos. Etapa en la que consolida su práctica en trastornos del espectro autista, TDAH, retraso del lenguaje, dislalia y rotacismo, dislexia y dificultades de lectoescritura, atención temprana y rehabilitación de la voz infantil.', 2),
  (p, 'PATI - Persona de Asistencia Terapéutica Infantil', 'Logopeda de apoyo en aula', '2023-12-15', '2024-03-15', false, 'Figura de PATI (Persona de Asistencia Terapéutica Infantil) en Valencia, prestando apoyo logopédico dentro del aula a una niña de cuatro años con Síndrome de Dravet, una encefalopatía epiléptica rara de alta complejidad. Intervención orientada a favorecer la comunicación, el lenguaje y la participación escolar efectiva de la menor, trabajando en el entorno natural del aula y en coordinación estrecha con el equipo docente y la familia. Caso de elevada exigencia clínica por la afectación neurológica asociada al síndrome.', 3),
  (p, 'Centro Sprint - Studio Polispecialistico di Riabilitazione Infantile Terapeutica (Siena, Italia)', 'Logopeda - Prácticas extracurriculares', '2022-10-15', '2023-07-15', false, 'Diez meses de prácticas extracurriculares en el Centro Sprint de Siena (Italia), estudio poliespecialístico de rehabilitación infantil terapéutica. Intervención logopédica en población infantil dentro de un equipo multidisciplinar y en un sistema sanitario distinto al español, con exposición a otros modelos de evaluación y tratamiento. Estancia internacional posterior a la finalización del grado.', 4),
  (p, 'Equip L''Andana - Centro Especializado en Trastornos del Espectro del Autismo', 'Logopeda - Prácticas curriculares', '2021-10-15', '2022-05-15', false, 'Ocho meses de prácticas curriculares del Grado en Logopedia en Equip L''Andana (Valencia), centro especializado en Trastornos del Espectro del Autismo, en modalidad presencial. Intervención con menores con TEA empleando Sistemas Aumentativos y Alternativos de Comunicación (SAAC): apoyo a la comunicación funcional y al desarrollo del lenguaje, y trabajo en equipo interdisciplinar. Primer contacto clínico estructurado con la intervención en autismo.', 5),
  (p, 'Ayuntamiento de Cañete (Cuenca)', 'Ayudante de cuidados del hogar - Servicio de ayuda a domicilio', '2020-08-15', '2020-09-15', false, 'Contrato temporal en el servicio municipal de ayuda a domicilio del Ayuntamiento de Cañete (Cuenca). Atención y acompañamiento a personas mayores y en situación de dependencia en sus tareas cotidianas. Primera experiencia de trato asistencial directo, compaginada con los estudios de grado.', 6);

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 4: EDUCATION
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO education (profile_id, institution_name, degree, field_of_study, start_date, end_date, sort_order) VALUES
  (p, 'ISEP - Instituto Superior de Estudios Psicológicos', 'Máster en Logopedia Clínica: Abordaje en Daño Neurológico Adulto y Neurodesarrollo Infantil (en curso)', 'Logopedia Clínica: Abordaje en Daño Neurológico Adulto y Neurodesarrollo Infantil', '2025-10-15', NULL, 1),
  (p, 'Universitat de València', 'Grado en Logopedia', 'Logopedia', '2018-09-15', '2022-07-15', 2);

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 5: SKILLS
-- Fuente CV salvo las de sort_order 15-22, que provienen de su ficha pública
-- de Doctoralia y están pendientes de confirmación (ver notas).
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO skills (profile_id, name, level, sort_order) VALUES
  (p, 'Evaluación e intervención logopédica infantil', 'EXPERT', 1),
  (p, 'Rehabilitación del lenguaje y del habla', 'EXPERT', 2),
  (p, 'Trastorno del Espectro Autista (TEA)', 'ADVANCED', 3),
  (p, 'Sistemas Aumentativos y Alternativos de Comunicación (SAAC)', 'ADVANCED', 4),
  (p, 'Trastornos del neurodesarrollo y TDAH', 'ADVANCED', 5),
  (p, 'Daño cerebral adquirido y rehabilitación post-ictus (ACV)', 'ADVANCED', 6),
  (p, 'Disfagia y rehabilitación de la deglución', 'ADVANCED', 7),
  (p, 'Motricidad orofacial', 'ADVANCED', 8),
  (p, 'Deglución atípica', 'ADVANCED', 9),
  (p, 'Intervención logopédica en Párkinson', 'ADVANCED', 10),
  (p, 'Enfermedades neurodegenerativas (Párkinson y Alzheimer)', 'ADVANCED', 11),
  (p, 'Tartamudez y disfemia en adultos y adolescentes', 'ADVANCED', 12),
  (p, 'Parálisis facial', 'INTERMEDIATE', 13),
  (p, 'Síndromes y enfermedades raras (Síndrome de Dravet)', 'ADVANCED', 14),
  (p, 'Apoyo logopédico en aula e inclusión escolar', 'ADVANCED', 15),
  (p, 'Atención temprana', 'ADVANCED', 16),
  (p, 'Retraso del lenguaje', 'ADVANCED', 17),
  (p, 'Dislalia y rotacismo', 'ADVANCED', 18),
  (p, 'Dislexia y dificultades de lectoescritura', 'ADVANCED', 19),
  (p, 'Rehabilitación de la voz infantil', 'ADVANCED', 20),
  (p, 'Logopedia neonatal', 'INTERMEDIATE', 21),
  (p, 'Estimulación cognitiva', 'ADVANCED', 22),
  (p, 'Patología vocal (nódulos en cuerdas vocales)', 'INTERMEDIATE', 23),
  (p, 'Coordinación con familias y entorno educativo', 'ADVANCED', 24),
  (p, 'Trabajo en equipo interdisciplinar', 'ADVANCED', 25);

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 6: LANGUAGES
-- ⚠️  Ni el CV ni Doctoralia declaran idiomas. Sólo se carga castellano
--     (evidente por ejercicio profesional en España). Valenciano e italiano
--     quedan FUERA a propósito hasta confirmación (ver notas).
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO languages (profile_id, name, level, is_native, sort_order) VALUES
  (p, 'Castellano', 'Native', true, 1);

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 8: CERTIFICATIONS (as portfolio_items type=CERTIFICATION)
-- El Máster y el Grado NO se repiten aquí: ya salen en la sección Educación
-- y PassportTemplate pinta ambas secciones en la misma página. Se aparta del
-- patrón de los seeds de ISEIE y Juan Pablo, que sí duplican la titulación.
-- Aquí quedan sólo colegiación, formación complementaria y permiso B.
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO portfolio_items (profile_id, title, issuer, type, sort_order) VALUES
  (p, 'Logopeda colegiada - Nº Col. 461755', 'Colegio Oficial de Logopedas', 'CERTIFICATION', 100),
  (p, 'Taller práctico en Parálisis Facial', 'ISEP · octubre 2025', 'CERTIFICATION', 103),
  (p, 'Curso sobre Tartamudez en Adultos y Adolescentes', 'Raquel Escobar Díaz · febrero 2025', 'CERTIFICATION', 104),
  (p, 'Taller práctico en Intervención Logopédica en Párkinson', 'INFOSAL · enero 2025', 'CERTIFICATION', 105),
  (p, 'Taller práctico en Deglución Atípica', 'INFOSAL · septiembre 2023', 'CERTIFICATION', 106),
  (p, 'Permiso de conducción tipo B', 'DGT - Dirección General de Tráfico', 'CERTIFICATION', 107);

END $$;

-- ============================================================================
-- POST-DEPLOYMENT NOTES
-- ============================================================================
-- 1. URL pública: https://yourcvpassport.com/cv/arantxa-saiz
-- 2. avatar_url NO se toca aquí: la foto se sube con
--    scripts/upload-arantxa-avatar.sh, que hace el UPDATE del campo.
--    La imagen se extrajo del propio PDF del CV (stream FlateDecode,
--    423x444 px RGB) porque no se aportó archivo aparte.
-- 3. ⚠️  IDIOMAS INCOMPLETOS. Ni el CV ni Doctoralia los declaran. Se carga
--    sólo castellano. Faltan por confirmar con la interesada:
--      · Valenciano — probable y relevante en su mercado (Valencia).
--      · Italiano   — 10 meses de prácticas en Siena lo hacen probable.
--    No se inventan. Añadir con un INSERT puntual cuando confirme.
-- 4. ⚠️  CONSULTA PRIVADA OMITIDA A PROPÓSITO. Su ficha pública de Doctoralia
--    recoge consulta propia en Mislata (c/ Doctor Marañón), tarifas y visitas
--    a domicilio. El CV que ella entregó NO la menciona, y la omisión puede
--    ser deliberada (empleador actual, o actividad ya cesada). NO se publica
--    sin su visto bueno explícito. Si lo da, añadir como experiencia
--    'Consulta privada de logopedia (Mislata)' con is_current según proceda.
-- 5. Skills de origen Doctoralia (sort_order 15-22: atención temprana, retraso
--    del lenguaje, dislalia/rotacismo, dislexia/lectoescritura, voz infantil,
--    logopedia neonatal, estimulación cognitiva, patología vocal). Son
--    competencias que ella publica en un directorio profesional, pero NO
--    figuran en su CV: conviene que las revise antes de darlas por buenas.
-- 6. Doctoralia está desactualizada: da Gabaldón como actual y no recoge
--    Hermanas Hospitalarias (mayo 2026). Para el histórico laboral manda el CV.
-- 7. PATI: el CV no indica el centro o entidad contratante. Se describe la
--    figura profesional sin nombrar empleador. Completar si lo facilita.
-- 8. job_seeking_status = 'OPEN' porque el CV declara "Disponibilidad
--    inmediata" en Otros datos de interés. Contrasta con estar en activo en
--    Hermanas Hospitalarias desde mayo 2026: si el dato viene arrastrado de
--    una versión anterior del CV, cambiar a 'PASSIVE' o 'NOT_LOOKING'.
-- 9. Privacidad: teléfono (633 25 72 76), dirección de consulta y tarifas NO
--    se publican. location a nivel de municipio. El Nº de colegiada SÍ se
--    publica: es dato profesional público y aporta credibilidad verificable.
-- 10. Fechas en DÍA 15 por el bug conocido de formatDate() en las plantillas
--     (new Date('YYYY-MM-01') se parsea como UTC y retrocede un mes al
--     renderizar en zonas UTC+X). Ver notas de la migración de Aleix Mabres.
-- 11. No se cargan portfolio_items de tipo PROJECT: no hay proyectos como tal
--     en su trayectoria y PassportTemplate no los renderiza. Su peso está en
--     experiencia y certificaciones, que sí se muestran.
-- 12. ⚠️  degree y position llevan A PROPÓSITO texto descriptivo largo en vez
--     del término suelto ('Grado en Logopedia' y no 'Grado';
--     'Logopeda - Población infantil' y no 'Logopeda'). Dos motivos:
--       a) PassportTemplate sólo pinta degree + institution_name + fechas:
--          NO renderiza field_of_study, así que el campo de estudio quedaba
--          invisible. Se fusiona en degree para que se vea.
--       b) La caché de profile_translations degrada los términos de UNA sola
--          palabra que ya están en español ('Grado' -> 'grados',
--          'Logopeda' -> 'logopeda', 'Docente' -> 'docente'). Las frases
--          largas sobreviven intactas. Medido el 2026-09-07: 132 de 305
--          education.degree y 172 de 399 experiences.position alterados,
--          sobre 53 y 47 perfiles respectivamente.
--     NO revertir a términos sueltos mientras ese bug siga vivo.
-- ============================================================================
