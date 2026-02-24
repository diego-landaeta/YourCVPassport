-- ============================================================
-- Fix: Canal "Novedades YourCVPassport"
-- 1. Reasigna owner y posts al usuario admin (equipo de la app)
-- 2. Añade variedad de tipos: MILESTONE, EVENT, ACHIEVEMENT, TEXT, POLL
-- Safe to re-run: usa DELETE/INSERT con seed_novedades_v2 tag
-- ============================================================

DO $$
DECLARE
  v_admin     UUID;
  v_ch_id     UUID;

  -- new post IDs
  np1 UUID; np2 UUID; np3 UUID; np4 UUID; np5 UUID;
BEGIN

  -- 1. Obtener el usuario admin (equipo de la app)
  SELECT id INTO v_admin FROM profiles WHERE role = 'admin' ORDER BY created_at LIMIT 1;
  IF v_admin IS NULL THEN
    RAISE NOTICE 'No admin user found — aborting Novedades fix';
    RETURN;
  END IF;

  -- 2. Obtener el canal de Novedades
  SELECT id INTO v_ch_id
    FROM public.groups
   WHERE name = 'Novedades YourCVPassport'
     AND metadata->>'type' = 'channel'
   LIMIT 1;

  IF v_ch_id IS NULL THEN
    RAISE NOTICE 'Canal Novedades YourCVPassport not found';
    RETURN;
  END IF;

  -- 3. Reasignar owner del canal al admin
  UPDATE public.groups
     SET owner_id = v_admin
   WHERE id = v_ch_id;

  -- 4. Reasignar author_id de todos los posts existentes del canal al admin
  UPDATE public.feed_posts
     SET author_id = v_admin
   WHERE group_id = v_ch_id;

  -- 5. Limpiar posts extra del seed anterior (si existen)
  DELETE FROM public.feed_posts
   WHERE metadata->>'seed_novedades_v2' = 'true';

  -- ══════════════════════════════════════════════════════
  -- 6. Nuevos posts con VARIEDAD de tipos
  -- ══════════════════════════════════════════════════════

  -- np1 [ES] MILESTONE — 10.000 perfiles
  INSERT INTO public.feed_posts
    (author_id, content, content_type, visibility, group_id, metadata, created_at)
  VALUES (
    v_admin,
    E'🎉 10.000 perfiles verificados en YourCVPassport\n\nHemos alcanzado un hito que hace seis meses parecía lejano: 10.000 profesionales con perfil verificado en la plataforma.\n\nAlgunos números que nos dicen algo real:\n→ 78% completaron su perfil en los primeros 7 días\n→ Profesionales de 23 países\n→ Más de 400 conexiones con empresas registradas este mes\n→ Promedio de perfil completado: 87% (la media en LinkedIn es ~40%)\n\nEsto es de los usuarios, no nuestro. Gracias por confiar en la plataforma para contar vuestra historia profesional.\n\nSeguimos construyendo. 🚀',
    'MILESTONE', 'PUBLIC', v_ch_id,
    '{"seed_novedades_v2": "true"}',
    NOW() - INTERVAL '14 days'
  ) RETURNING id INTO np1;

  -- np2 [ES] ACHIEVEMENT — historia de éxito real
  INSERT INTO public.feed_posts
    (author_id, content, content_type, achievement_type, achievement_data, visibility, group_id, metadata, created_at)
  VALUES (
    v_admin,
    E'Historia de la semana 🏆\n\nNos escribió Valentina, diseñadora UX de Buenos Aires. Llevaba 9 meses en búsqueda activa con su CV en PDF clásico. Actualizó su perfil YourCVPassport con el nuevo constructor: añadió su portfolio visual, los proyectos con métricas de impacto y habilitó el enlace público.\n\nResultado: 3 entrevistas en 2 semanas. Oferta firmada de una startup fintech con sede en Barcelona.\n\nSu reflexión: "Por primera vez mi CV mostraba quién soy realmente, no solo dónde había trabajado."\n\nSi tienes una historia así, cuéntanosla — nos la envías al canal y puede que la compartamos aquí. 👇',
    'ACHIEVEMENT', 'got_hired',
    '{"position": "Senior UX Designer", "company_name": "Fintech startup — Barcelona"}',
    'PUBLIC', v_ch_id,
    '{"seed_novedades_v2": "true"}',
    NOW() - INTERVAL '10 days'
  ) RETURNING id INTO np2;

  -- np3 [ES] EVENT — webinar en vivo con el equipo
  INSERT INTO public.feed_posts
    (author_id, content, content_type, visibility, group_id, metadata, created_at)
  VALUES (
    v_admin,
    E'📅 Webinar en vivo: "Cómo construir un perfil que consiga entrevistas en 2026"\n\nEl equipo de YourCVPassport responde en directo las preguntas más frecuentes:\n\n→ ¿Cómo pasar el filtro ATS con tu perfil online?\n→ ¿Qué secciones miran primero los reclutadores?\n→ Cómo presentar una transición de carrera sin que parezca una disculpa\n→ Demo en vivo del constructor de perfil — paso a paso\n\nGratuito para todos los miembros. Plazas limitadas.\nPregunta en directo al final — trae tu situación real.',
    'EVENT', 'PUBLIC', v_ch_id,
    jsonb_build_object(
      'seed_novedades_v2', 'true',
      'event', jsonb_build_object(
        'title', 'Cómo construir un perfil que consiga entrevistas en 2026',
        'date', TO_CHAR(NOW() + INTERVAL '8 days', 'YYYY-MM-DD'),
        'time', '18:00',
        'location', 'Online — Zoom',
        'link', 'https://yourcvpassport.com/eventos/perfil-entrevistas-2026'
      )
    ),
    NOW() - INTERVAL '3 days'
  ) RETURNING id INTO np3;

  -- np4 [ES] TEXT — nueva función: verificación de habilidades
  INSERT INTO public.feed_posts
    (author_id, content, content_type, visibility, group_id, metadata, created_at)
  VALUES (
    v_admin,
    E'⚡ Nueva función: Verificación de habilidades con IA\n\nA partir de hoy puedes verificar tus habilidades técnicas directamente desde tu perfil.\n\nCómo funciona:\n→ Selecciona una habilidad en tu perfil (ej: "SQL", "Diseño UX", "Gestión de proyectos")\n→ Elige una micro-evaluación de 5 preguntas (menos de 3 minutos)\n→ Si superas el umbral, aparece un badge verificado visible en tu perfil\n\nNo es un examen. Es una señal para reclutadores de que la habilidad no es solo una palabra en un listado.\n\nDisponible para 40+ habilidades en la primera versión. Iremos añadiendo más según la demanda. ¿Cuál quieres ver primero?',
    'TEXT', 'PUBLIC', v_ch_id,
    '{"seed_novedades_v2": "true"}',
    NOW() - INTERVAL '5 days'
  ) RETURNING id INTO np4;

  -- np5 [ES] POLL — qué canal prefieren
  INSERT INTO public.feed_posts
    (author_id, content, content_type, visibility, group_id, metadata, created_at)
  VALUES (
    v_admin,
    E'Queremos entender mejor cómo usas YourCVPassport 👇',
    'POLL', 'PUBLIC', v_ch_id,
    jsonb_build_object(
      'seed_novedades_v2', 'true',
      'poll', jsonb_build_object(
        'question', '¿Para qué usas más YourCVPassport actualmente?',
        'options', jsonb_build_array(
          'Búsqueda activa de empleo',
          'Mantener mi perfil profesional actualizado',
          'Networking con otros profesionales',
          'Seguir comunidades y canales del sector'
        ),
        'duration', '1w',
        'expires_at', (NOW() + INTERVAL '7 days')::TEXT
      )
    ),
    NOW() - INTERVAL '1 day'
  ) RETURNING id INTO np5;

  -- 7. Actualizar post_count del canal
  UPDATE public.groups
     SET post_count = (
       SELECT COUNT(*) FROM public.feed_posts
        WHERE group_id = v_ch_id AND is_hidden = false
     )
   WHERE id = v_ch_id;

  -- 8. Asegurarse de que el admin es miembro del canal (role = owner)
  INSERT INTO public.group_members (group_id, user_id, role)
  VALUES (v_ch_id, v_admin, 'owner')
  ON CONFLICT (group_id, user_id) DO UPDATE SET role = 'owner';

  RAISE NOTICE 'Fix completado: canal Novedades reasignado al admin (%), 5 posts nuevos añadidos', v_admin;

END $$;
