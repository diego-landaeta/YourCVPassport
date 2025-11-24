-- =============================================
-- Insertar mensajes para los leads sin mensajes
-- =============================================

-- Insertar un mensaje para cada lead que no tenga mensajes
INSERT INTO public.messages (lead_id, sender_id, sender_name, content, is_read, created_at)
SELECT
    l.id as lead_id,
    l.profile_id as sender_id,
    l.sender_name,
    l.message as content,
    false as is_read,
    l.created_at
FROM public.leads l
WHERE NOT EXISTS (
    SELECT 1 FROM public.messages m WHERE m.lead_id = l.id
)
ORDER BY l.created_at DESC;

-- Verificar que se crearon los mensajes
SELECT
    '✅ MENSAJES CREADOS' as status,
    COUNT(*) as mensajes_insertados
FROM public.messages
WHERE created_at >= NOW() - INTERVAL '1 minute';

-- Mostrar el estado final
SELECT
    '📊 RESUMEN FINAL' as status,
    (SELECT COUNT(*) FROM public.leads) as total_leads,
    (SELECT COUNT(*) FROM public.messages) as total_messages,
    (SELECT COUNT(*) FROM public.leads l WHERE NOT EXISTS (SELECT 1 FROM public.messages m WHERE m.lead_id = l.id)) as leads_sin_mensajes;
