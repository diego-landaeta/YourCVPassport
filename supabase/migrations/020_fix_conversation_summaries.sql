-- =============================================
-- Actualizar vista conversation_summaries para usar profile_id
-- =============================================

-- PASO 1: Eliminar vista existente
DROP VIEW IF EXISTS public.conversation_summaries CASCADE;

-- PASO 2: Recrear vista con profile_id y mostrar leads SIN mensajes
CREATE VIEW public.conversation_summaries AS
SELECT
    l.id AS lead_id,
    COALESCE(
        (SELECT u.id FROM auth.users u WHERE u.email = l.sender_email LIMIT 1),
        (SELECT id FROM auth.users LIMIT 1)
    ) AS sender_id,
    COALESCE(l.sender_name, 'Usuario') AS sender_name,
    l.profile_id AS recipient_id,  -- Usar profile_id en lugar de recipient_id
    COALESCE(p.full_name, p.email, 'Usuario') AS recipient_name,
    'INQUIRY' AS lead_type,
    COALESCE(l.subject, 'Sin asunto') AS subject,
    COALESCE(l.status, 'new') AS status,
    -- Último mensaje (puede ser NULL si no hay mensajes)
    (
        SELECT m.content
        FROM public.messages m
        WHERE m.lead_id = l.id
        ORDER BY m.created_at DESC
        LIMIT 1
    ) AS last_message,
    -- Fecha del último mensaje o fecha de creación del lead
    COALESCE(
        (
            SELECT m.created_at
            FROM public.messages m
            WHERE m.lead_id = l.id
            ORDER BY m.created_at DESC
            LIMIT 1
        ),
        l.created_at  -- Si no hay mensajes, usar fecha de creación del lead
    ) AS last_message_at,
    -- Contar mensajes no leídos
    (
        SELECT COUNT(*)
        FROM public.messages m
        WHERE m.lead_id = l.id
        AND m.is_read = FALSE
        AND m.sender_id != l.profile_id  -- Mensajes del otro usuario
    ) AS unread_count,
    -- Total de mensajes
    (
        SELECT COUNT(*)
        FROM public.messages m
        WHERE m.lead_id = l.id
    ) AS message_count
FROM public.leads l
LEFT JOIN public.profiles p ON p.id = l.profile_id;

-- PASO 3: Verificar que la vista funciona
SELECT
    '✅ VISTA ACTUALIZADA' as status,
    COUNT(*) as total_conversaciones
FROM public.conversation_summaries;

-- PASO 4: Mostrar ejemplo
SELECT
    lead_id,
    sender_name,
    recipient_name,
    subject,
    last_message,
    message_count,
    unread_count
FROM public.conversation_summaries
ORDER BY last_message_at DESC
LIMIT 5;
