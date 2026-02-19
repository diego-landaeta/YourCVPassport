-- =============================================
-- SEED DATA: Feed Social
-- Inserta publicaciones, comentarios, reposts y likes
-- usando usuarios reales de la tabla profiles.
-- Seguro de re-ejecutar: elimina seed previo antes de insertar.
-- =============================================

DO $$
DECLARE
    -- Tomamos hasta 6 usuarios existentes
    u1 UUID; u2 UUID; u3 UUID; u4 UUID; u5 UUID; u6 UUID;

    -- Posts (22 total)
    p1  UUID; p2  UUID; p3  UUID; p4  UUID; p5  UUID;
    p6  UUID; p7  UUID; p8  UUID; p9  UUID; p10 UUID;
    p11 UUID; p12 UUID; p13 UUID; p14 UUID; p15 UUID;
    p16 UUID; p17 UUID; p18 UUID; p19 UUID; p20 UUID;
    p21 UUID; p22 UUID;

    -- Comments
    c1 UUID; c2 UUID; c3 UUID; c4 UUID; c5 UUID;
    c6 UUID; c7 UUID; c8 UUID; c9 UUID; c10 UUID;
    c11 UUID; c12 UUID; c13 UUID;
BEGIN

    -- =========================================================
    -- 0. Obtener usuarios reales (solo los que existen)
    -- =========================================================
    SELECT id INTO u1 FROM public.profiles WHERE is_active = true ORDER BY created_at ASC  LIMIT 1 OFFSET 0;
    SELECT id INTO u2 FROM public.profiles WHERE is_active = true ORDER BY created_at ASC  LIMIT 1 OFFSET 1;
    SELECT id INTO u3 FROM public.profiles WHERE is_active = true ORDER BY created_at ASC  LIMIT 1 OFFSET 2;
    SELECT id INTO u4 FROM public.profiles WHERE is_active = true ORDER BY created_at ASC  LIMIT 1 OFFSET 3;
    SELECT id INTO u5 FROM public.profiles WHERE is_active = true ORDER BY created_at ASC  LIMIT 1 OFFSET 4;
    SELECT id INTO u6 FROM public.profiles WHERE is_active = true ORDER BY created_at ASC  LIMIT 1 OFFSET 5;

    -- Si no hay suficientes usuarios, reutilizamos los que haya
    u2 := COALESCE(u2, u1);
    u3 := COALESCE(u3, u2);
    u4 := COALESCE(u4, u3);
    u5 := COALESCE(u5, u4);
    u6 := COALESCE(u6, u5);

    IF u1 IS NULL THEN
        RAISE NOTICE 'No se encontraron usuarios en profiles. Abortando seed.';
        RETURN;
    END IF;

    -- =========================================================
    -- 1. Limpiar seed previo (identifiable por metadata)
    -- =========================================================
    DELETE FROM public.feed_posts WHERE metadata->>'seed' = 'true';
    -- Los likes, comments y shares se eliminan en cascada gracias a ON DELETE CASCADE

    -- =========================================================
    -- 2. Insertar PUBLICACIONES (20 posts)
    -- =========================================================

    -- ── TEXT ──────────────────────────────────────────────────

    -- Post 1: Texto motivacional (u1)
    INSERT INTO public.feed_posts (
        author_id, content, content_type, visibility, metadata
    ) VALUES (
        u1,
        '¡Buenos días comunidad! 🌟 Acabo de actualizar mi perfil con mis últimas experiencias. Si estáis buscando perfiles en tecnología, estaré encantado de conectar. #OpenToWork #Tecnología',
        'TEXT', 'PUBLIC',
        '{"seed": "true"}'
    ) RETURNING id INTO p1;

    -- Post 3: Reflexión sobre mercado laboral (u3)
    INSERT INTO public.feed_posts (
        author_id, content, content_type, visibility, metadata
    ) VALUES (
        u3,
        'El mercado laboral está cambiando rápidamente. 📊 Las habilidades más demandadas en 2026:

1. Inteligencia Artificial y ML
2. Cloud Computing (AWS/GCP/Azure)
3. Ciberseguridad
4. Data Engineering
5. Soft skills: comunicación y adaptabilidad

¿Qué añadiríais vosotros a esta lista? 👇',
        'TEXT', 'PUBLIC',
        '{"seed": "true"}'
    ) RETURNING id INTO p3;

    -- Post 5: Consejo de carrera (u4)
    INSERT INTO public.feed_posts (
        author_id, content, content_type, visibility, metadata
    ) VALUES (
        u4,
        'Consejo de carrera que nadie te da: tu CV es tu primera entrevista. 📄

Después de revisar más de 200 perfiles como recruiter, lo que más diferencia a los candidatos no es la experiencia sino cómo la presentan.

Usad verbos de acción, cuantificad logros y adaptad el CV a cada oferta. YourCVPassport hace esto muy fácil. ¡Probadlo!',
        'TEXT', 'PUBLIC',
        '{"seed": "true"}'
    ) RETURNING id INTO p5;

    -- Post 7: Pregunta a la comunidad (u6)
    INSERT INTO public.feed_posts (
        author_id, content, content_type, visibility, metadata
    ) VALUES (
        u6,
        '❓ Encuesta rápida para la comunidad:

¿Cuántas entrevistas de trabajo habéis tenido en el último mes?

Contexto: estoy analizando cómo está el mercado actualmente. Respuestas anónimas bienvenidas en comentarios 👇',
        'TEXT', 'PUBLIC',
        '{"seed": "true"}'
    ) RETURNING id INTO p7;

    -- Post 14: Reflexión sobre trabajo remoto (u3)
    INSERT INTO public.feed_posts (
        author_id, content, content_type, visibility, metadata
    ) VALUES (
        u3,
        '🏠 Después de 3 años trabajando en remoto, aquí van mis lecciones más importantes:

• Establece una rutina matutina → cambia todo
• Separar espacio de trabajo del de descanso (aunque sea un rincón)
• Overcommunicate: mejor un mensaje de más que uno de menos
• Pausas activas cada 90 min → tu espalda te lo agradecerá
• Networking intencional: no esperes a que te inviten, propón tú las calls

¿Qué añadiríais? El trabajo remoto llegó para quedarse y debemos hacerlo bien 💪',
        'TEXT', 'PUBLIC',
        '{"seed": "true"}'
    ) RETURNING id INTO p14;

    -- Post 17: Tip de entrevistas (u4)
    INSERT INTO public.feed_posts (
        author_id, content, content_type, visibility, metadata
    ) VALUES (
        u4,
        '💡 La pregunta que cambió mis entrevistas:

"¿Cómo se mide el éxito en este puesto durante los primeros 90 días?"

Demuestra pensamiento estratégico, orientación a resultados y que estás pensando en cómo aportar desde el día 1.

Los entrevistadores SIEMPRE reaccionan bien a esta pregunta. ¡Probadla en vuestra siguiente entrevista!

#TipsEntrevista #BúsquedaDeEmpleo',
        'TEXT', 'PUBLIC',
        '{"seed": "true"}'
    ) RETURNING id INTO p17;

    -- ── ACHIEVEMENT ──────────────────────────────────────────

    -- Post 2: Logro profesional - got_hired (u2)
    INSERT INTO public.feed_posts (
        author_id, content, content_type, achievement_type, achievement_data, visibility, metadata
    ) VALUES (
        u2,
        '🎉 ¡Emocionante noticia! Acabo de unirme a una empresa increíble como Senior Developer. Gracias a todos los que me apoyaron en este proceso. ¡El trabajo en red funciona!',
        'ACHIEVEMENT', 'got_hired',
        '{"company_name": "TechCorp", "position": "Senior Developer"}',
        'PUBLIC',
        '{"seed": "true"}'
    ) RETURNING id INTO p2;

    -- Post 4: Certificación nueva (u1)
    INSERT INTO public.feed_posts (
        author_id, content, content_type, achievement_type, achievement_data, visibility, metadata
    ) VALUES (
        u1,
        '✅ Acabo de obtener mi certificación en AWS Solutions Architect. ¡Meses de preparación que por fin dan sus frutos! Muy recomendable para cualquiera que quiera dar el salto al cloud.',
        'ACHIEVEMENT', 'new_certification',
        '{"certification_name": "AWS Solutions Architect", "issuer": "Amazon Web Services"}',
        'PUBLIC',
        '{"seed": "true"}'
    ) RETURNING id INTO p4;

    -- Post 8: Post de bienvenida (u2)
    INSERT INTO public.feed_posts (
        author_id, content, content_type, achievement_type, achievement_data, visibility, metadata
    ) VALUES (
        u2,
        '👋 ¡Hola comunidad! Esta es mi primera publicación en YourCVPassport. Estoy emocionado de formar parte de esta red profesional. ¡Conéctate conmigo!',
        'ACHIEVEMENT', 'first_post',
        '{}',
        'PUBLIC',
        '{"seed": "true"}'
    ) RETURNING id INTO p8;

    -- Post 15: Logro - certificación Google (u5)
    INSERT INTO public.feed_posts (
        author_id, content, content_type, achievement_type, achievement_data, visibility, metadata
    ) VALUES (
        u5,
        '🏅 ¡Lo logré! Después de 4 meses de estudio intensivo, obtuve la certificación Google Professional Cloud Architect.

Recursos que me ayudaron:
📚 Coursera - Google Cloud fundamentals
🎮 Qwiklabs para práctica hands-on
📝 Documentación oficial (sí, leerla funciona)
👥 Study groups semanales

Si alguien está preparándose, feliz de compartir mis apuntes y estrategias. ¡No dudéis en escribirme!',
        'ACHIEVEMENT', 'new_certification',
        '{"certification_name": "Google Professional Cloud Architect", "issuer": "Google Cloud"}',
        'PUBLIC',
        '{"seed": "true"}'
    ) RETURNING id INTO p15;

    -- ── MILESTONE ────────────────────────────────────────────

    -- Post 6: Milestone de experiencia (u5)
    INSERT INTO public.feed_posts (
        author_id, content, content_type, achievement_type, achievement_data, visibility, metadata
    ) VALUES (
        u5,
        '🎯 ¡Hito alcanzado! 10 años de experiencia profesional documentada. Ha sido un camino lleno de aprendizajes, retos y personas increíbles. Gracias a todos los que han formado parte de este recorrido.',
        'MILESTONE', 'milestone_experience',
        '{"years": 10}',
        'PUBLIC',
        '{"seed": "true"}'
    ) RETURNING id INTO p6;

    -- Post 16: Milestone - 500 conexiones (u6)
    INSERT INTO public.feed_posts (
        author_id, content, content_type, achievement_type, achievement_data, visibility, metadata
    ) VALUES (
        u6,
        '🌐 ¡500 conexiones profesionales! Hace un año tenía menos de 50.

Lo que cambió:
✅ Publicar contenido de valor regularmente
✅ Comentar de forma genuina en publicaciones de otros
✅ Enviar mensajes personalizados al conectar
✅ Participar en eventos y compartir lo aprendido

La red profesional se construye dando primero. ¡Gracias a todos por estar aquí! 🙏',
        'MILESTONE', 'network_milestone',
        '{"connections": 500}',
        'PUBLIC',
        '{"seed": "true"}'
    ) RETURNING id INTO p16;

    -- ── JOB_UPDATE ───────────────────────────────────────────

    -- Post 11: Actualización laboral (u2)
    INSERT INTO public.feed_posts (
        author_id, content, content_type, visibility, metadata
    ) VALUES (
        u2,
        '🚀 ¡Primer mes en TechCorp completado!

Ha sido intenso pero increíble. Algunos highlights:
• Onboarding super bien organizado (2 semanas dedicadas)
• Equipo multicultural: compañeros de 8 países distintos
• Ya contribuí mi primer PR a producción
• Stack: React + TypeScript + Go + AWS

Agradecido de haber dado el paso. A quien esté dudando: lanzaos. El cambio siempre asusta pero rara vez decepciona 🔥',
        'JOB_UPDATE', 'PUBLIC',
        '{"seed": "true"}'
    ) RETURNING id INTO p11;

    -- Post 18: Buscando empleo (u1)
    INSERT INTO public.feed_posts (
        author_id, content, content_type, visibility, metadata
    ) VALUES (
        u1,
        '📢 #OpenToWork

Después de 4 años como Full Stack Developer, busco nuevos retos.

Especialidades:
🔹 React / Next.js / TypeScript
🔹 Node.js / Python
🔹 AWS (certificado Solutions Architect)
🔹 PostgreSQL / MongoDB

Busco: Roles Senior/Lead en empresas con cultura tech fuerte, preferiblemente remoto o híbrido en Madrid.

Si sabéis de algo o queréis hacer introductions, os lo agradezco mucho 🙏

Mi perfil completo: yourcvpassport.com/cv/...',
        'JOB_UPDATE', 'PUBLIC',
        '{"seed": "true"}'
    ) RETURNING id INTO p18;

    -- ── PROFILE_COMPLETE ─────────────────────────────────────

    -- Post 19: Perfil completado (u4)
    INSERT INTO public.feed_posts (
        author_id, content, content_type, achievement_type, achievement_data, visibility, metadata
    ) VALUES (
        u4,
        '🎊 ¡Perfil al 100%! Por fin me tomé el tiempo de completar todas las secciones de mi perfil en YourCVPassport.

Experiencia, educación, certificaciones, idiomas, proyectos destacados... todo actualizado.

Pro tip: el módulo de IA de YourCVPassport me sugirió mejoras que no había considerado. ¡La diferencia en la calidad del perfil es notable!',
        'PROFILE_COMPLETE', 'profile_completed',
        '{"completion_percentage": 100}',
        'PUBLIC',
        '{"seed": "true"}'
    ) RETURNING id INTO p19;

    -- ── IMAGE ────────────────────────────────────────────────

    -- Post 9: Foto de espacio de trabajo (u3) - 1 imagen
    INSERT INTO public.feed_posts (
        author_id, content, content_type, image_urls, visibility, metadata
    ) VALUES (
        u3,
        '🖥️ Mi setup de home office 2026. Después de mucho iterar, creo que he encontrado el equilibrio perfecto entre productividad y comodidad.

Monitor ultrawide + standing desk + buena iluminación = game changer.

¿Cuál es vuestro elemento imprescindible para trabajar desde casa?',
        'IMAGE',
        ARRAY['https://images.unsplash.com/photo-1593062096033-9a26b09da705?w=800&q=80'],
        'PUBLIC',
        '{"seed": "true"}'
    ) RETURNING id INTO p9;

    -- Post 10: Foto de evento tech (u1) - 2 imágenes
    INSERT INTO public.feed_posts (
        author_id, content, content_type, image_urls, visibility, metadata
    ) VALUES (
        u1,
        '📸 Increíble experiencia en la JSConf España 2026! 🇪🇸

Dos días intensos de charlas, workshops y sobre todo networking de calidad. Highlights:

🎤 Keynote sobre el futuro de Web Components
⚡ Workshop de performance en React Server Components
🤝 Conocí en persona a gente que solo seguía en redes

Si no habéis ido nunca a una conferencia tech, os lo recomiendo al 100%. El ROI en aprendizaje y contactos es brutal.',
        'IMAGE',
        ARRAY[
            'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80',
            'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&q=80'
        ],
        'PUBLIC',
        '{"seed": "true"}'
    ) RETURNING id INTO p10;

    -- Post 12: Foto de equipo de trabajo (u2) - 1 imagen
    INSERT INTO public.feed_posts (
        author_id, content, content_type, image_urls, visibility, metadata
    ) VALUES (
        u2,
        '👥 Primer team offsite con el equipo de TechCorp! 3 días en Barcelona para planificación de Q2.

Nada sustituye el cara a cara. Después de trabajar juntos en remoto durante semanas, poner caras a los nombres cambia completamente la dinámica.

PD: la comida no estuvo nada mal 😄🍕',
        'IMAGE',
        ARRAY['https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80'],
        'PUBLIC',
        '{"seed": "true"}'
    ) RETURNING id INTO p12;

    -- Post 13: Infografía de carrera (u4) - 3 imágenes
    INSERT INTO public.feed_posts (
        author_id, content, content_type, image_urls, visibility, metadata
    ) VALUES (
        u4,
        '📊 He creado una mini guía visual sobre cómo estructurar la sección de experiencia en vuestro CV. 3 slides con lo esencial:

1️⃣ Formato STAR para describir logros
2️⃣ Verbos de acción que llaman la atención de los ATS
3️⃣ Cómo cuantificar resultados cuando "no tienes números"

Guardadlo y compartidlo con quien esté buscando empleo. ¡Espero que os sea útil!

#CV #BúsquedaDeEmpleo #TipsDeCarrera',
        'IMAGE',
        ARRAY[
            'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&q=80',
            'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80',
            'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80'
        ],
        'PUBLIC',
        '{"seed": "true"}'
    ) RETURNING id INTO p13;

    -- Post 20: Foto de workspace nocturno (u5) - 4 imágenes
    INSERT INTO public.feed_posts (
        author_id, content, content_type, image_urls, visibility, metadata
    ) VALUES (
        u5,
        '🌙 Sesión nocturna de coding terminada. A veces la inspiración llega tarde y hay que aprovecharla.

Estoy construyendo un side project con Next.js 15 + Supabase + Tailwind. Una app para gestionar tu aprendizaje profesional (cursos, libros, certificaciones) y trackear progreso.

¿Os interesaría una beta? Si hay suficiente interés, abro el waitlist este finde 🚀

Fotos del proceso: desde el primer commit hasta el estado actual del dashboard.',
        'IMAGE',
        ARRAY[
            'https://images.unsplash.com/photo-1607799279861-4dd421887fb3?w=800&q=80',
            'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80',
            'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&q=80',
            'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=80'
        ],
        'PUBLIC',
        '{"seed": "true"}'
    ) RETURNING id INTO p20;

    -- ── POLL ────────────────────────────────────────────────

    -- Post 21: Encuesta sobre herramientas (u3)
    INSERT INTO public.feed_posts (
        author_id, content, content_type, visibility, metadata
    ) VALUES (
        u3,
        '📊 Encuesta: ¿Cuál es vuestra herramienta de IA favorita para programar?

1. GitHub Copilot
2. Claude / Cursor
3. ChatGPT
4. Ninguna, prefiero sin IA',
        'POLL', 'PUBLIC',
        jsonb_build_object(
            'seed', 'true',
            'poll', jsonb_build_object(
                'question', '¿Cuál es vuestra herramienta de IA favorita para programar?',
                'options', jsonb_build_array('GitHub Copilot', 'Claude / Cursor', 'ChatGPT', 'Ninguna, prefiero sin IA'),
                'duration', '1w',
                'expires_at', (NOW() + INTERVAL '7 days')::TEXT
            )
        )
    ) RETURNING id INTO p21;

    -- ── EVENT ───────────────────────────────────────────────

    -- Post 22: Evento tech meetup (u4)
    INSERT INTO public.feed_posts (
        author_id, content, content_type, visibility, metadata
    ) VALUES (
        u4,
        '📅 React Madrid Meetup - Marzo 2026
🗓️ 2026-03-15 · 19:00
📍 Google Campus Madrid',
        'EVENT', 'PUBLIC',
        jsonb_build_object(
            'seed', 'true',
            'event', jsonb_build_object(
                'title', 'React Madrid Meetup - Marzo 2026',
                'date', '2026-03-15',
                'time', '19:00',
                'location', 'Google Campus Madrid',
                'link', 'https://meetup.com/reactmadrid'
            )
        )
    ) RETURNING id INTO p22;

    -- Likes for POLL post (p21)
    INSERT INTO public.feed_likes (post_id, user_id, reaction_type)
    VALUES
        (p21, u1, 'LIKE'),
        (p21, u2, 'INSIGHTFUL'),
        (p21, u5, 'LIKE')
    ON CONFLICT (post_id, user_id) DO NOTHING;

    -- Likes/Interested for EVENT post (p22)
    INSERT INTO public.feed_likes (post_id, user_id, reaction_type)
    VALUES
        (p22, u1, 'LIKE'),
        (p22, u2, 'LIKE'),
        (p22, u3, 'CELEBRATE'),
        (p22, u5, 'LIKE'),
        (p22, u6, 'LIKE')
    ON CONFLICT (post_id, user_id) DO NOTHING;

    -- Sample poll votes for p21
    INSERT INTO public.feed_poll_votes (post_id, user_id, option_index)
    VALUES
        (p21, u1, 0),
        (p21, u2, 1),
        (p21, u4, 1),
        (p21, u5, 2),
        (p21, u6, 0)
    ON CONFLICT (post_id, user_id) DO NOTHING;

    -- Comments on POLL post (p21)
    INSERT INTO public.feed_comments (post_id, author_id, content)
    VALUES (p21, u1, 'GitHub Copilot ha cambiado totalmente mi flujo de trabajo. Pero Claude también está increíble para refactoring.');

    INSERT INTO public.feed_comments (post_id, author_id, content)
    VALUES (p21, u5, 'Yo uso ChatGPT para brainstorming y Copilot para autocompletar. Combo ganador 🤖');

    -- Comments on EVENT post (p22)
    INSERT INTO public.feed_comments (post_id, author_id, content)
    VALUES (p22, u1, '¡Me apunto! ¿Alguien quiere ir en grupo?');

    INSERT INTO public.feed_comments (post_id, author_id, content)
    VALUES (p22, u3, 'El campus de Google es genial para estos eventos. Nos vemos ahí 🙌');

    INSERT INTO public.feed_comments (post_id, author_id, content)
    VALUES (p22, u6, '¿Habrá streaming para los que no estamos en Madrid?');

    -- =========================================================
    -- 3. Insertar LIKES (cruzados entre usuarios)
    -- =========================================================

    -- p1 (TEXT motivacional, u1): 4 likes
    INSERT INTO public.feed_likes (post_id, user_id, reaction_type)
    VALUES
        (p1, u2, 'LIKE'),
        (p1, u3, 'CELEBRATE'),
        (p1, u4, 'LIKE'),
        (p1, u5, 'SUPPORT')
    ON CONFLICT (post_id, user_id) DO NOTHING;

    -- p2 (ACHIEVEMENT got_hired, u2): 4 likes
    INSERT INTO public.feed_likes (post_id, user_id, reaction_type)
    VALUES
        (p2, u1, 'CELEBRATE'),
        (p2, u3, 'CELEBRATE'),
        (p2, u5, 'LOVE'),
        (p2, u6, 'CELEBRATE')
    ON CONFLICT (post_id, user_id) DO NOTHING;

    -- p3 (TEXT mercado laboral, u3): 3 likes
    INSERT INTO public.feed_likes (post_id, user_id, reaction_type)
    VALUES
        (p3, u1, 'INSIGHTFUL'),
        (p3, u2, 'INSIGHTFUL'),
        (p3, u4, 'LIKE')
    ON CONFLICT (post_id, user_id) DO NOTHING;

    -- p4 (ACHIEVEMENT certificación, u1): 3 likes
    INSERT INTO public.feed_likes (post_id, user_id, reaction_type)
    VALUES
        (p4, u2, 'CELEBRATE'),
        (p4, u3, 'CELEBRATE'),
        (p4, u6, 'LIKE')
    ON CONFLICT (post_id, user_id) DO NOTHING;

    -- p5 (TEXT consejo CV, u4): 5 likes
    INSERT INTO public.feed_likes (post_id, user_id, reaction_type)
    VALUES
        (p5, u1, 'INSIGHTFUL'),
        (p5, u2, 'INSIGHTFUL'),
        (p5, u3, 'LIKE'),
        (p5, u5, 'INSIGHTFUL'),
        (p5, u6, 'SUPPORT')
    ON CONFLICT (post_id, user_id) DO NOTHING;

    -- p6 (MILESTONE 10 años, u5): 3 likes
    INSERT INTO public.feed_likes (post_id, user_id, reaction_type)
    VALUES
        (p6, u1, 'CELEBRATE'),
        (p6, u2, 'LOVE'),
        (p6, u4, 'CELEBRATE')
    ON CONFLICT (post_id, user_id) DO NOTHING;

    -- p7 (TEXT encuesta, u6): 2 likes
    INSERT INTO public.feed_likes (post_id, user_id, reaction_type)
    VALUES
        (p7, u3, 'LIKE'),
        (p7, u4, 'LIKE')
    ON CONFLICT (post_id, user_id) DO NOTHING;

    -- p8 (ACHIEVEMENT first_post, u2): 2 likes
    INSERT INTO public.feed_likes (post_id, user_id, reaction_type)
    VALUES
        (p8, u1, 'CELEBRATE'),
        (p8, u5, 'LIKE')
    ON CONFLICT (post_id, user_id) DO NOTHING;

    -- p9 (IMAGE home office, u3): 5 likes
    INSERT INTO public.feed_likes (post_id, user_id, reaction_type)
    VALUES
        (p9, u1, 'LOVE'),
        (p9, u2, 'LIKE'),
        (p9, u4, 'LOVE'),
        (p9, u5, 'LIKE'),
        (p9, u6, 'LIKE')
    ON CONFLICT (post_id, user_id) DO NOTHING;

    -- p10 (IMAGE conferencia, u1): 5 likes
    INSERT INTO public.feed_likes (post_id, user_id, reaction_type)
    VALUES
        (p10, u2, 'CELEBRATE'),
        (p10, u3, 'LIKE'),
        (p10, u4, 'CELEBRATE'),
        (p10, u5, 'CELEBRATE'),
        (p10, u6, 'LIKE')
    ON CONFLICT (post_id, user_id) DO NOTHING;

    -- p11 (JOB_UPDATE primer mes, u2): 4 likes
    INSERT INTO public.feed_likes (post_id, user_id, reaction_type)
    VALUES
        (p11, u1, 'CELEBRATE'),
        (p11, u3, 'SUPPORT'),
        (p11, u4, 'CELEBRATE'),
        (p11, u6, 'LIKE')
    ON CONFLICT (post_id, user_id) DO NOTHING;

    -- p12 (IMAGE team offsite, u2): 5 likes
    INSERT INTO public.feed_likes (post_id, user_id, reaction_type)
    VALUES
        (p12, u1, 'LOVE'),
        (p12, u3, 'LOVE'),
        (p12, u4, 'LIKE'),
        (p12, u5, 'CELEBRATE'),
        (p12, u6, 'LIKE')
    ON CONFLICT (post_id, user_id) DO NOTHING;

    -- p13 (IMAGE infografía CV, u4): 5 likes
    INSERT INTO public.feed_likes (post_id, user_id, reaction_type)
    VALUES
        (p13, u1, 'INSIGHTFUL'),
        (p13, u2, 'INSIGHTFUL'),
        (p13, u3, 'INSIGHTFUL'),
        (p13, u5, 'LIKE'),
        (p13, u6, 'INSIGHTFUL')
    ON CONFLICT (post_id, user_id) DO NOTHING;

    -- p14 (TEXT remoto, u3): 4 likes
    INSERT INTO public.feed_likes (post_id, user_id, reaction_type)
    VALUES
        (p14, u1, 'INSIGHTFUL'),
        (p14, u2, 'LIKE'),
        (p14, u5, 'INSIGHTFUL'),
        (p14, u6, 'SUPPORT')
    ON CONFLICT (post_id, user_id) DO NOTHING;

    -- p15 (ACHIEVEMENT certificación Google, u5): 4 likes
    INSERT INTO public.feed_likes (post_id, user_id, reaction_type)
    VALUES
        (p15, u1, 'CELEBRATE'),
        (p15, u2, 'CELEBRATE'),
        (p15, u3, 'CELEBRATE'),
        (p15, u6, 'LIKE')
    ON CONFLICT (post_id, user_id) DO NOTHING;

    -- p16 (MILESTONE 500 conexiones, u6): 3 likes
    INSERT INTO public.feed_likes (post_id, user_id, reaction_type)
    VALUES
        (p16, u1, 'CELEBRATE'),
        (p16, u2, 'CELEBRATE'),
        (p16, u4, 'SUPPORT')
    ON CONFLICT (post_id, user_id) DO NOTHING;

    -- p17 (TEXT tip entrevistas, u4): 5 likes
    INSERT INTO public.feed_likes (post_id, user_id, reaction_type)
    VALUES
        (p17, u1, 'INSIGHTFUL'),
        (p17, u2, 'INSIGHTFUL'),
        (p17, u3, 'LIKE'),
        (p17, u5, 'INSIGHTFUL'),
        (p17, u6, 'LIKE')
    ON CONFLICT (post_id, user_id) DO NOTHING;

    -- p18 (JOB_UPDATE OpenToWork, u1): 4 likes
    INSERT INTO public.feed_likes (post_id, user_id, reaction_type)
    VALUES
        (p18, u2, 'SUPPORT'),
        (p18, u3, 'SUPPORT'),
        (p18, u4, 'LIKE'),
        (p18, u5, 'SUPPORT')
    ON CONFLICT (post_id, user_id) DO NOTHING;

    -- p19 (PROFILE_COMPLETE, u4): 3 likes
    INSERT INTO public.feed_likes (post_id, user_id, reaction_type)
    VALUES
        (p19, u1, 'CELEBRATE'),
        (p19, u3, 'LIKE'),
        (p19, u5, 'CELEBRATE')
    ON CONFLICT (post_id, user_id) DO NOTHING;

    -- p20 (IMAGE side project nocturno, u5): 5 likes
    INSERT INTO public.feed_likes (post_id, user_id, reaction_type)
    VALUES
        (p20, u1, 'LOVE'),
        (p20, u2, 'CELEBRATE'),
        (p20, u3, 'LIKE'),
        (p20, u4, 'LIKE'),
        (p20, u6, 'INSIGHTFUL')
    ON CONFLICT (post_id, user_id) DO NOTHING;

    -- =========================================================
    -- 4. Insertar COMENTARIOS
    -- =========================================================

    -- ── Comentarios en p1 (TEXT motivacional, u1) ────────────
    INSERT INTO public.feed_comments (post_id, author_id, content)
    VALUES (p1, u2, '¡Mucho éxito! Tu perfil se ve muy sólido. Enviándote solicitud de conexión ahora mismo 🤝')
    RETURNING id INTO c1;

    INSERT INTO public.feed_comments (post_id, author_id, content)
    VALUES (p1, u3, 'El networking es clave. ¡Conectamos!');

    -- Reply a c1
    INSERT INTO public.feed_comments (post_id, author_id, content, parent_id)
    VALUES (p1, u1, '¡Gracias! Ya acepté tu solicitud. Es un placer conectar contigo 😊', c1);

    -- ── Comentarios en p2 (ACHIEVEMENT got_hired, u2) ────────
    INSERT INTO public.feed_comments (post_id, author_id, content)
    VALUES (p2, u1, '¡Felicidades! TechCorp tiene muy buena reputación. ¡Lo mereces!')
    RETURNING id INTO c2;

    INSERT INTO public.feed_comments (post_id, author_id, content)
    VALUES (p2, u4, '¡Enhorabuena! ¿Cuánto tiempo llevabas buscando? Siempre es inspirador ver estos anuncios 💪')
    RETURNING id INTO c3;

    INSERT INTO public.feed_comments (post_id, author_id, content)
    VALUES (p2, u6, '¡Grande! Eso motiva a los que estamos en búsqueda activa. ¡Mucho éxito en la nueva etapa!');

    -- Reply a c3
    INSERT INTO public.feed_comments (post_id, author_id, content, parent_id)
    VALUES (p2, u2, 'Unos 3 meses. Mucha perseverancia y preparar bien las entrevistas técnicas. ¡Gracias a todos!', c3);

    -- ── Comentarios en p3 (TEXT mercado laboral, u3) ─────────
    INSERT INTO public.feed_comments (post_id, author_id, content)
    VALUES (p3, u5, 'Añadiría gestión de productos y metodologías ágiles. Cada vez más empresas buscan perfiles híbridos.')
    RETURNING id INTO c4;

    INSERT INTO public.feed_comments (post_id, author_id, content)
    VALUES (p3, u6, 'Totalmente de acuerdo con los soft skills. Al final la IA se puede aprender, pero comunicarte bien es otra cosa.');

    INSERT INTO public.feed_comments (post_id, author_id, content)
    VALUES (p3, u1, 'DevOps / Platform Engineering también debería estar ahí. La demanda es enorme.');

    -- Reply a c4
    INSERT INTO public.feed_comments (post_id, author_id, content, parent_id)
    VALUES (p3, u3, '¡Buena aportación! Product Management está disparado. Lo incluyo en la próxima versión del post.', c4);

    -- ── Comentarios en p5 (TEXT consejo CV, u4) ──────────────
    INSERT INTO public.feed_comments (post_id, author_id, content)
    VALUES (p5, u1, 'Completamente de acuerdo. La cuantificación de logros es lo que más hace brillar un CV.')
    RETURNING id INTO c5;

    INSERT INTO public.feed_comments (post_id, author_id, content)
    VALUES (p5, u2, 'Como candidato confirmo esto. Cuando empecé a cuantificar mis logros las entrevistas se multiplicaron.');

    INSERT INTO public.feed_comments (post_id, author_id, content)
    VALUES (p5, u6, '¿Alguna plantilla recomendada para empezar desde cero? Estoy reescribiendo todo mi CV.');

    -- Reply a c5
    INSERT INTO public.feed_comments (post_id, author_id, content, parent_id)
    VALUES (p5, u4, 'Exacto. "Aumenté ventas un 30%" siempre gana a "Gestioné ventas". Los números son imanes para el ojo.', c5);

    -- ── Comentarios en p7 (TEXT encuesta, u6) ────────────────
    INSERT INTO public.feed_comments (post_id, author_id, content)
    VALUES (p7, u1, 'Yo llevo 0 este mes, acabo de empezar la búsqueda. ¿Cuánto suele tardar en promedio la gente?');

    INSERT INTO public.feed_comments (post_id, author_id, content)
    VALUES (p7, u3, 'En mi sector (tech) unas 3-4 por mes cuando el perfil está bien optimizado.');

    INSERT INTO public.feed_comments (post_id, author_id, content)
    VALUES (p7, u5, '2 entrevistas, una final y una primera ronda. El mercado en data está movido.');

    -- ── Comentarios en p9 (IMAGE home office, u3) ────────────
    INSERT INTO public.feed_comments (post_id, author_id, content)
    VALUES (p9, u1, '¡Qué setup! 🔥 ¿Qué modelo de standing desk usas? Estoy buscando uno.')
    RETURNING id INTO c6;

    INSERT INTO public.feed_comments (post_id, author_id, content)
    VALUES (p9, u4, 'Mi elemento imprescindible: buenos auriculares con cancelación de ruido. No puedo vivir sin ellos.');

    INSERT INTO public.feed_comments (post_id, author_id, content)
    VALUES (p9, u5, 'La iluminación marca la diferencia. Yo me compré un ring light y se nota hasta en las videollamadas.');

    -- Reply a c6
    INSERT INTO public.feed_comments (post_id, author_id, content, parent_id)
    VALUES (p9, u3, 'Es la FlexiSpot E7. Muy recomendable por relación calidad-precio. Llevo 1 año y cero problemas 👌', c6);

    -- ── Comentarios en p10 (IMAGE conferencia, u1) ───────────
    INSERT INTO public.feed_comments (post_id, author_id, content)
    VALUES (p10, u2, '¡Qué envidia sana! Me apunto para la próxima. ¿Sabes si graban las charlas?')
    RETURNING id INTO c7;

    INSERT INTO public.feed_comments (post_id, author_id, content)
    VALUES (p10, u6, 'Las conferencias son lo mejor para salir de la burbuja del día a día. Súper necesario.');

    -- Reply a c7
    INSERT INTO public.feed_comments (post_id, author_id, content, parent_id)
    VALUES (p10, u1, 'Sí, suelen subir las grabaciones a YouTube en unas semanas. Comparto el link cuando salgan 🎬', c7);

    -- ── Comentarios en p11 (JOB_UPDATE primer mes, u2) ───────
    INSERT INTO public.feed_comments (post_id, author_id, content)
    VALUES (p11, u1, 'Me alegro mucho de que la experiencia esté siendo positiva. Un buen onboarding marca la diferencia.')
    RETURNING id INTO c8;

    INSERT INTO public.feed_comments (post_id, author_id, content)
    VALUES (p11, u5, 'React + TypeScript + Go es un stack brutal. ¿Qué tal Go viniendo de JS?');

    -- Reply a c8
    INSERT INTO public.feed_comments (post_id, author_id, content, parent_id)
    VALUES (p11, u2, '100%. Tener un buddy asignado desde el primer día también ayuda mucho a integrarte rápido.', c8);

    -- ── Comentarios en p12 (IMAGE team offsite, u2) ──────────
    INSERT INTO public.feed_comments (post_id, author_id, content)
    VALUES (p12, u3, '¡Barcelona! Gran elección. Los offsites son el pegamento de los equipos remotos 🙌');

    INSERT INTO public.feed_comments (post_id, author_id, content)
    VALUES (p12, u4, 'Totalmente de acuerdo con lo del cara a cara. Las relaciones cambian completamente después de un offsite.');

    -- ── Comentarios en p13 (IMAGE infografía CV, u4) ─────────
    INSERT INTO public.feed_comments (post_id, author_id, content)
    VALUES (p13, u1, 'El slide de verbos de acción es oro puro. Lo guardo y lo comparto YA. Gracias por esto 🙏')
    RETURNING id INTO c9;

    INSERT INTO public.feed_comments (post_id, author_id, content)
    VALUES (p13, u3, '¿Podrías hacer una versión en inglés? Tengo colegas que lo necesitan.');

    INSERT INTO public.feed_comments (post_id, author_id, content)
    VALUES (p13, u6, 'Lo de cuantificar sin números es el truco más útil. "Reduje tiempo de respuesta de días a horas" ya suena mejor.');

    INSERT INTO public.feed_comments (post_id, author_id, content)
    VALUES (p13, u5, 'Guardado. Estos recursos prácticos valen más que mil artículos teóricos.');

    -- Reply a c9
    INSERT INTO public.feed_comments (post_id, author_id, content, parent_id)
    VALUES (p13, u4, '¡Me alegra que sea útil! El formato STAR es lo que uso con todos mis candidatos en coaching. Funciona siempre.', c9);

    -- ── Comentarios en p14 (TEXT remoto, u3) ─────────────────
    INSERT INTO public.feed_comments (post_id, author_id, content)
    VALUES (p14, u2, 'Lo de overcommunicate es clavísimo. Mejor pecar de comunicar de más que quedarse corto.')
    RETURNING id INTO c10;

    INSERT INTO public.feed_comments (post_id, author_id, content)
    VALUES (p14, u4, 'Añadiría: invertir en una buena silla. Tu espalda en 10 años te lo agradecerá.');

    INSERT INTO public.feed_comments (post_id, author_id, content)
    VALUES (p14, u6, 'Las pausas activas me costaron mucho al principio pero ahora no las cambio por nada. Pomodoro + estiramiento = ✨');

    -- Reply a c10
    INSERT INTO public.feed_comments (post_id, author_id, content, parent_id)
    VALUES (p14, u3, 'Totalmente. Mi regla: si dudas si deberías comunicar algo, comunícalo. En remoto no existe la sobre-comunicación.', c10);

    -- ── Comentarios en p15 (ACHIEVEMENT certificación Google, u5) ──
    INSERT INTO public.feed_comments (post_id, author_id, content)
    VALUES (p15, u1, '¡Felicidades! ¿Me pasarías esos apuntes? Estoy considerando sacarme esa certificación también.')
    RETURNING id INTO c11;

    INSERT INTO public.feed_comments (post_id, author_id, content)
    VALUES (p15, u3, 'Gran logro. Google Cloud Architect está muy cotizado ahora mismo en el mercado.');

    -- Reply a c11
    INSERT INTO public.feed_comments (post_id, author_id, content, parent_id)
    VALUES (p15, u5, '¡Claro! Te envío MD. Los Qwiklabs son lo mejor para la parte práctica, no los saltes 🧪', c11);

    -- ── Comentarios en p17 (TEXT tip entrevistas, u4) ────────
    INSERT INTO public.feed_comments (post_id, author_id, content)
    VALUES (p17, u1, 'Probé esta pregunta en mi última entrevista y el entrevistador literalmente dijo "gran pregunta". Funciona.')
    RETURNING id INTO c12;

    INSERT INTO public.feed_comments (post_id, author_id, content)
    VALUES (p17, u5, 'Otra que funciona: "¿Cuáles son los mayores desafíos del equipo ahora mismo?" Muestra interés genuino.');

    INSERT INTO public.feed_comments (post_id, author_id, content)
    VALUES (p17, u3, '📌 Guardado. Estas preguntas son las que separan candidatos buenos de candidatos excelentes.');

    -- Reply a c12
    INSERT INTO public.feed_comments (post_id, author_id, content, parent_id)
    VALUES (p17, u4, '¡Genial! Me encanta cuando las recomendaciones se ponen en práctica. Sigue así 💪', c12);

    -- ── Comentarios en p18 (JOB_UPDATE OpenToWork, u1) ───────
    INSERT INTO public.feed_comments (post_id, author_id, content)
    VALUES (p18, u2, 'Voy a preguntar en mi empresa. Creo que buscan un perfil similar para el equipo de platform.')
    RETURNING id INTO c13;

    INSERT INTO public.feed_comments (post_id, author_id, content)
    VALUES (p18, u4, 'Tu perfil es muy sólido. Con AWS certificado y ese stack, no deberías tardar mucho. ¡Ánimo!');

    INSERT INTO public.feed_comments (post_id, author_id, content)
    VALUES (p18, u3, 'Conozco un par de startups en Madrid buscando exactamente este perfil. Te envío DM 📩');

    INSERT INTO public.feed_comments (post_id, author_id, content)
    VALUES (p18, u5, 'Compartido con mi red. Ojalá encuentres algo pronto 🤞');

    -- Reply a c13
    INSERT INTO public.feed_comments (post_id, author_id, content, parent_id)
    VALUES (p18, u1, '¡Eso sería increíble! Te envío mi CV actualizado por DM. Gracias por pensar en mí 🙏', c13);

    -- ── Comentarios en p20 (IMAGE side project, u5) ──────────
    INSERT INTO public.feed_comments (post_id, author_id, content)
    VALUES (p20, u1, '¡Me apunto a la beta! Next.js + Supabase es mi stack favorito. Se ve prometedor por las capturas.');

    INSERT INTO public.feed_comments (post_id, author_id, content)
    VALUES (p20, u2, '¡Supabase es adictivo! Desde que lo descubrí no uso otra cosa para side projects. Quiero beta 🙋‍♂️');

    INSERT INTO public.feed_comments (post_id, author_id, content)
    VALUES (p20, u3, 'Necesitamos algo así. Yo uso Notion para trackear pero es muy manual. ¿Tendrá integración con plataformas de cursos?');

    INSERT INTO public.feed_comments (post_id, author_id, content)
    VALUES (p20, u6, 'Las sesiones nocturnas de coding son las más productivas. No hay Slack, no hay distracciones. ¡Mucho éxito con el proyecto! 🌙');

    -- =========================================================
    -- 5. Insertar REPOSTS / SHARES
    -- =========================================================

    -- u1 hace repost del post de u3 (reflexión sobre mercado laboral)
    INSERT INTO public.feed_shares (
        original_post_id, shared_by, share_type, share_comment
    ) VALUES (
        p3, u1, 'REPOST', NULL
    ) ON CONFLICT DO NOTHING;

    -- u5 hace quote del consejo de u4
    INSERT INTO public.feed_shares (
        original_post_id, shared_by, share_type, share_comment
    ) VALUES (
        p5, u5, 'QUOTE', 'Totalmente válido. Lo mismo que me dijeron a mí cuando me costaba conseguir entrevistas. ¡El CV importa más de lo que creemos!'
    ) ON CONFLICT DO NOTHING;

    -- u6 hace repost del logro de u2
    INSERT INTO public.feed_shares (
        original_post_id, shared_by, share_type, share_comment
    ) VALUES (
        p2, u6, 'REPOST', NULL
    ) ON CONFLICT DO NOTHING;

    -- u3 hace quote del post de certificación de u1
    INSERT INTO public.feed_shares (
        original_post_id, shared_by, share_type, share_comment
    ) VALUES (
        p4, u3, 'QUOTE', 'Los que estáis pensando en certificaros en cloud, esta es vuestra señal. ¡Adelante!'
    ) ON CONFLICT DO NOTHING;

    -- u2 hace repost de la infografía de CV de u4
    INSERT INTO public.feed_shares (
        original_post_id, shared_by, share_type, share_comment
    ) VALUES (
        p13, u2, 'REPOST', NULL
    ) ON CONFLICT DO NOTHING;

    -- u1 hace quote del setup de u3
    INSERT INTO public.feed_shares (
        original_post_id, shared_by, share_type, share_comment
    ) VALUES (
        p9, u1, 'QUOTE', 'Inspiración para mi próximo upgrade de setup. El standing desk es el siguiente paso 🖥️'
    ) ON CONFLICT DO NOTHING;

    -- u4 hace repost del tip de entrevistas de sí mismo pero u6 lo comparte
    INSERT INTO public.feed_shares (
        original_post_id, shared_by, share_type, share_comment
    ) VALUES (
        p17, u6, 'QUOTE', 'Apuntadla. Esta pregunta os va a servir más que cualquier curso de preparación de entrevistas.'
    ) ON CONFLICT DO NOTHING;

    -- u3 hace repost del side project de u5
    INSERT INTO public.feed_shares (
        original_post_id, shared_by, share_type, share_comment
    ) VALUES (
        p20, u3, 'REPOST', NULL
    ) ON CONFLICT DO NOTHING;

    -- u5 comparte el OpenToWork de u1
    INSERT INTO public.feed_shares (
        original_post_id, shared_by, share_type, share_comment
    ) VALUES (
        p18, u5, 'QUOTE', 'Si alguien busca un dev con este perfil, aquí tenéis al candidato ideal. Contrastado y certificado.'
    ) ON CONFLICT DO NOTHING;

    -- u4 comparte el post de trabajo remoto de u3
    INSERT INTO public.feed_shares (
        original_post_id, shared_by, share_type, share_comment
    ) VALUES (
        p14, u4, 'QUOTE', 'Todo esto aplica x10 si gestionas equipos remotos. La comunicación es EL skill del siglo XXI.'
    ) ON CONFLICT DO NOTHING;

    RAISE NOTICE '✅ Seed completado: 22 posts (6 TEXT, 5 IMAGE, 3 ACHIEVEMENT, 2 MILESTONE, 2 JOB_UPDATE, 1 PROFILE_COMPLETE, 1 first_post, 1 POLL, 1 EVENT), ~90 likes, ~60 comentarios con replies, 10 shares/reposts, 5 poll votes.';
    RAISE NOTICE '   Usuarios utilizados: u1=%, u2=%, u3=%, u4=%, u5=%, u6=%', u1, u2, u3, u4, u5, u6;

END $$;
