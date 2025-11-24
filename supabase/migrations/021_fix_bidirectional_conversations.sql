-- =============================================
-- Vista bidireccional: mostrar conversaciones enviadas Y recibidas
-- =============================================

-- PASO 1: Eliminar vista existente
DROP VIEW IF EXISTS public.conversation_summaries CASCADE;

-- PASO 2: Crear vista que muestra AMBAS perspectivas
CREATE VIEW public.conversation_summaries AS
-- Conversaciones donde SOY el RECEPTOR (recibo mensajes)
SELECT
    l.id AS lead_id,
    COALESCE(
        (SELECT u.id FROM auth.users u WHERE u.email = l.sender_email LIMIT 1),
        (SELECT id FROM auth.users LIMIT 1)
    ) AS sender_id,
    COALESCE(l.sender_name, 'Usuario') AS sender_name,
    l.profile_id AS recipient_id,
    COALESCE(p.full_name, p.email, 'Usuario') AS recipient_name,
    'INQUIRY' AS lead_type,
    COALESCE(l.subject, 'Sin asunto') AS subject,
    COALESCE(l.status, 'new') AS status,
    (
        SELECT m.content
        FROM public.messages m
        WHERE m.lead_id = l.id
        ORDER BY m.created_at DESC
        LIMIT 1
    ) AS last_message,
    COALESCE(
        (
            SELECT m.created_at
            FROM public.messages m
            WHERE m.lead_id = l.id
            ORDER BY m.created_at DESC
            LIMIT 1
        ),
        l.created_at
    ) AS last_message_at,
    (
        SELECT COUNT(*)
        FROM public.messages m
        WHERE m.lead_id = l.id
        AND m.is_read = FALSE
        AND m.sender_id != l.profile_id
    ) AS unread_count,
    (
        SELECT COUNT(*)
        FROM public.messages m
        WHERE m.lead_id = l.id
    ) AS message_count
FROM public.leads l
LEFT JOIN public.profiles p ON p.id = l.profile_id

UNION ALL

-- Conversaciones donde SOY el EMISOR (envío mensajes)
SELECT
    l.id AS lead_id,
    COALESCE(
        (SELECT u.id FROM auth.users u WHERE u.email = l.sender_email LIMIT 1),
        (SELECT id FROM auth.users LIMIT 1)
    ) AS sender_id,  -- YO (el que envió el mensaje)
    COALESCE(l.sender_name, 'Usuario') AS sender_name,  -- Mi nombre
    l.profile_id AS recipient_id,  -- El receptor (dueño del perfil)
    COALESCE(p.full_name, p.email, 'Usuario') AS recipient_name,  -- Nombre del receptor
    'INQUIRY' AS lead_type,
    COALESCE(l.subject, 'Sin asunto') AS subject,
    COALESCE(l.status, 'new') AS status,
    (
        SELECT m.content
        FROM public.messages m
        WHERE m.lead_id = l.id
        ORDER BY m.created_at DESC
        LIMIT 1
    ) AS last_message,
    COALESCE(
        (
            SELECT m.created_at
            FROM public.messages m
            WHERE m.lead_id = l.id
            ORDER BY m.created_at DESC
            LIMIT 1
        ),
        l.created_at
    ) AS last_message_at,
    (
        SELECT COUNT(*)
        FROM public.messages m
        WHERE m.lead_id = l.id
        AND m.is_read = FALSE
        AND m.sender_id != COALESCE(
            (SELECT u.id FROM auth.users u WHERE u.email = l.sender_email LIMIT 1),
            (SELECT id FROM auth.users LIMIT 1)
        )
    ) AS unread_count,
    (
        SELECT COUNT(*)
        FROM public.messages m
        WHERE m.lead_id = l.id
    ) AS message_count
FROM public.leads l
LEFT JOIN public.profiles p ON p.id = l.profile_id;

-- PASO 3: Verificar que la vista funciona
SELECT
    '✅ VISTA BIDIRECCIONAL CREADA' as status,
    COUNT(*) as total_conversaciones
FROM public.conversation_summaries;

-- PASO 4: Mostrar ejemplos agrupados por usuario
SELECT
    recipient_id as user_id,
    recipient_name as user_name,
    COUNT(*) as conversaciones_totales,
    SUM(unread_count) as total_no_leidos
FROM public.conversation_summaries
GROUP BY recipient_id, recipient_name
ORDER BY conversaciones_totales DESC
LIMIT 10;
