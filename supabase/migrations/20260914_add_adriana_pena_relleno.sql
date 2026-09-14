-- ============================================================================
-- SEED: Adriana Peña · Tarotista y guía espiritual · PERFIL DE RELLENO
-- Date: 2026-09-14
-- Template: passport
-- Brand color: #6B21A8 (morado profundo). Se aparta del #0052FF del resto de
--              perfiles de relleno a propósito: el encargo pedía una estética
--              mística/holística y el color es la parte del perfil que más lo
--              transmite. Contrasta 8.6:1 sobre blanco.
-- Safe to re-run: cleanup DELETEs make INSERTs idempotent
--
-- ⚠️  ESTE PERFIL NO CORRESPONDE A UNA PERSONA REAL. Contenido de relleno.
--     En consecuencia, y por la naturaleza del ámbito:
--       · NO se le atribuye ninguna titulación oficial, colegiación ni registro
--         sanitario. El tarot y el acompañamiento espiritual no son profesiones
--         reguladas y no existe un título oficial que las respalde.
--       · NO se presenta su trabajo como diagnóstico, tratamiento ni sustituto
--         de atención médica o psicológica, ni se le atribuyen resultados
--         terapéuticos o curativos. Esto no es cautela editorial: presentar
--         servicios espirituales como si fueran atención sanitaria puede
--         inducir a alguien a no acudir a un profesional cuando lo necesita.
--       · Los centros y escuelas son genéricos, nunca entidades reales.
--     Si se sustituye por una profesional real, rehacer desde su documentación.
--
-- auth.user creado el 14/09/2026 con el UUID indicado abajo.
--     Email: adriana.pena@yourcvpassport.com
-- ============================================================================

DO $$
DECLARE
  p CONSTANT UUID := '43637a64-ee87-4f41-abe4-96a3ccf02d5e';  -- Adriana Peña
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
  full_name = 'Adriana Peña',
  headline = 'Tarotista y guía espiritual · Lectura de tarot, astrología y acompañamiento holístico · Círculos de luna y rituales de ciclo',
  summary = 'Tarotista y guía espiritual con una práctica construida alrededor de una idea sencilla: las cartas no predicen un destino cerrado, sino que devuelven a la persona una imagen de su propio momento para que pueda mirarlo de frente y decidir. Su trabajo es el de una lectora que escucha primero y tira después. Acompaña procesos de duelo, cambios de ciclo, decisiones vitales y épocas de confusión, siempre desde el respeto al ritmo de cada persona y sin prometer certezas. Trabaja fundamentalmente con el Tarot de Marsella y el Rider-Waite-Smith, dos barajas de lenguaje distinto que combina según lo que la consulta pida: la primera para la lectura simbólica y estructural, la segunda para la narrativa y el detalle emocional. A la lectura de cartas suma la carta astral como mapa de temperamento y de tiempos, la numerología como lectura de patrones que se repiten, y el péndulo como herramienta de afinado en preguntas cerradas. Su práctica holística se completa con la creación de rituales de ciclo —lunaciones, equinoccios, solsticios, cierres de etapa— y con los círculos de luna que facilita desde hace años: encuentros grupales de palabra, silencio y escritura donde lo que se trabaja no es la adivinación sino el acompañamiento colectivo. Complementa las sesiones con trabajo de respiración, meditación guiada, herboristería tradicional e inciensos y aguas rituales que ella misma prepara. Su formación es enteramente no reglada, como corresponde a este campo: años de estudio autodidacta, aprendizaje directo con lectoras mayores que ella y formaciones libres en tarot terapéutico, astrología y facilitación de grupos. Es explícita sobre los límites de lo que hace: su trabajo es acompañamiento espiritual y simbólico, no diagnóstico ni tratamiento, y cuando detecta que una consulta requiere atención médica o psicológica lo dice y deriva. Esa frontera clara es, para ella, parte de la ética del oficio.',
  role = 'professional', plan = 'pro',
  template = 'passport', template_color = '#6B21A8',
  location = 'Granada, España', country_code = 'ES',
  slug = 'adriana-pena', is_active = true,
  job_seeking_status = 'NOT_LOOKING', is_open_to_messages = false,
  wizard_completed = true, first_login_completed = true, dashboard_tour_completed = true,
  meta_title = 'Adriana Peña · Tarotista y guía espiritual · Tarot, astrología y rituales',
  meta_description = 'Tarotista y guía espiritual. Lectura de Tarot de Marsella y Rider-Waite, carta astral, numerología, rituales de ciclo y círculos de luna. Acompañamiento holístico, no sustituye atención médica ni psicológica.'
WHERE id = p;

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 3: EXPERIENCES
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO experiences (profile_id, company_name, position, start_date, end_date, is_current, description, sort_order) VALUES
  (p, 'Consulta propia de tarot y acompañamiento espiritual', 'Tarotista y guía espiritual', '2016-03-15', NULL, true, 'Consulta individual de lectura de tarot y acompañamiento espiritual, presencial y en remoto. Sesiones de lectura con Tarot de Marsella y Rider-Waite-Smith adaptadas a lo que trae la persona: cambios de ciclo, duelos, decisiones vitales o etapas de confusión. Elaboración de carta astral como mapa de temperamento y tiempos, y lectura numerológica de patrones recurrentes. Diseño de rituales personales de cierre y apertura de etapa. Trabaja con un encuadre explícito sobre el alcance de las sesiones: acompañamiento simbólico, nunca diagnóstico ni tratamiento, con derivación a profesional sanitario cuando la consulta lo requiere.', 1),
  (p, 'Círculos de luna y encuentros de ciclo', 'Facilitadora de círculos', '2019-09-15', NULL, true, 'Facilitación de círculos de luna y encuentros grupales de ciclo: lunaciones, equinoccios y solsticios. Encuentros de palabra, silencio compartido y escritura, con cuidado del encuadre grupal, los turnos de palabra y la confidencialidad de lo que se comparte. El trabajo es de acompañamiento colectivo, no de adivinación.', 2),
  (p, 'Espacio holístico y de bienestar', 'Tarotista colaboradora - Consulta y talleres de iniciación', '2013-06-15', '2016-02-15', false, 'Primeros años de práctica como lectora de tarot dentro de un espacio holístico, compaginando consulta con talleres de iniciación a la baraja. Etapa de aprendizaje del oficio en atención directa y de contacto con otras disciplinas del ámbito del bienestar.', 3);

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 4: EDUCATION
-- Formación NO REGLADA, sin equivalencia oficial: se nombra como tal.
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO education (profile_id, institution_name, degree, field_of_study, start_date, end_date, sort_order) VALUES
  (p, 'Formación libre con facilitadoras independientes', 'Formación en facilitación de círculos y trabajo grupal (no reglada)', 'Facilitación de Grupos y Trabajo Ritual', '2018-09-15', '2019-06-15', 1),
  (p, 'Escuela independiente de astrología', 'Formación en astrología y carta astral (no reglada)', 'Astrología Natal', '2015-09-15', '2017-06-15', 2),
  (p, 'Formación libre en tarot simbólico', 'Formación en tarot terapéutico y simbólico (no reglada)', 'Tarot de Marsella y Rider-Waite-Smith', '2012-09-15', '2014-06-15', 3);

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 5: SKILLS
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO skills (profile_id, name, level, sort_order) VALUES
  (p, 'Lectura de Tarot de Marsella', 'EXPERT', 1),
  (p, 'Lectura de Tarot Rider-Waite-Smith', 'EXPERT', 2),
  (p, 'Tarot terapéutico y simbólico', 'EXPERT', 3),
  (p, 'Interpretación de carta astral', 'ADVANCED', 4),
  (p, 'Astrología de tránsitos y ciclos', 'ADVANCED', 5),
  (p, 'Numerología', 'ADVANCED', 6),
  (p, 'Péndulo y radiestesia', 'INTERMEDIATE', 7),
  (p, 'Diseño de rituales de ciclo', 'EXPERT', 8),
  (p, 'Facilitación de círculos de luna', 'EXPERT', 9),
  (p, 'Acompañamiento en duelo y cambios de ciclo', 'ADVANCED', 10),
  (p, 'Meditación guiada y trabajo de respiración', 'ADVANCED', 11),
  (p, 'Herboristería tradicional e inciensos rituales', 'INTERMEDIATE', 12),
  (p, 'Escucha activa y sostén del encuadre', 'EXPERT', 13),
  (p, 'Consulta presencial y en remoto', 'ADVANCED', 14);

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 6: LANGUAGES
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO languages (profile_id, name, level, is_native, sort_order) VALUES
  (p, 'Castellano', 'Native', true, 1),
  (p, 'Inglés', 'B1', false, 2);

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 7: PORTFOLIO (PROJECT)
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO portfolio_items (profile_id, title, description, type, tags, sort_order) VALUES
  (p, 'Círculo de Luna Nueva', 'Encuentro grupal mensual de intención y escritura en cada luna nueva: apertura del espacio, ronda de palabra, silencio compartido y cierre. Grupos reducidos para sostener la confidencialidad.', 'PROJECT', ARRAY['Círculos','Luna','Facilitación'], 1),
  (p, 'Lectura de Año Personal', 'Sesión larga que combina tirada de tarot, año personal numerológico y tránsitos astrológicos del periodo, orientada a ubicar temas y tiempos, no a predecir sucesos.', 'PROJECT', ARRAY['Tarot','Astrología','Numerología'], 2),
  (p, 'Rituales de Cierre de Etapa', 'Diseño de rituales personales para duelos, mudanzas, separaciones o finales de proyecto: estructura simbólica, elementos y palabras para marcar el cierre.', 'PROJECT', ARRAY['Ritual','Duelo','Acompañamiento'], 3),
  (p, 'Taller de Iniciación al Tarot', 'Taller introductorio a la baraja: arcanos mayores, estructura de la tirada y lectura simbólica, dirigido a quien empieza y quiere leer para sí misma.', 'PROJECT', ARRAY['Formación','Tarot','Taller'], 4);

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 8: CERTIFICATIONS
-- Sin emisores reales y sin números de credencial: no existe titulación
-- oficial en este ámbito y no se va a simular una.
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO portfolio_items (profile_id, title, issuer, type, sort_order) VALUES
  (p, 'Formación en Tarot Terapéutico y Simbólico', 'Formación libre, no reglada', 'CERTIFICATION', 100),
  (p, 'Formación en Astrología Natal', 'Escuela independiente de astrología · formación no reglada', 'CERTIFICATION', 101),
  (p, 'Facilitación de Círculos y Trabajo Grupal', 'Formación libre con facilitadoras independientes', 'CERTIFICATION', 102);

END $$;

-- ============================================================================
-- POST-DEPLOYMENT NOTES
-- ============================================================================
-- 1. URL pública prevista: https://yourcvpassport.com/cv/adriana-pena
-- 2. SIN AVATAR. Al ser perfil ficticio se le puede generar un retrato: no hay
--    ninguna persona real a la que suplantar. Prompt entregado al usuario.
-- 3. Color #6B21A8 en lugar del #0052FF del resto de relleno, por el encargo
--    estético. Si se prefiere agrupar con los demás de relleno, cambiar.
-- 4. Toda la formación va marcada como "no reglada" a propósito. En este ámbito
--    no existe titulación oficial y presentarla como tal induciría a error.
-- 5. El summary y la primera experiencia declaran de forma explícita que el
--    trabajo NO es diagnóstico ni tratamiento y que deriva a profesional
--    sanitario cuando procede. No quitar esas frases: es lo que separa un
--    perfil de acompañamiento espiritual de uno que aparenta ser sanitario.
-- 6. Fechas en día 15 por el bug de formatDate() (ver migración de Aleix).
-- 7. degree y position con texto descriptivo largo a propósito: la plantilla no
--    renderiza field_of_study y la caché de traducción degrada los términos de
--    una sola palabra (ver notas de la migración de Arantxa Saiz).
-- ============================================================================
