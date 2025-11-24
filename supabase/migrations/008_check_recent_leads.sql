-- =============================================
-- Verificar leads recientes
-- =============================================
-- Este script muestra los últimos leads insertados

SELECT
    id,
    profile_id,
    sender_name,
    sender_email,
    subject,
    LEFT(message, 50) || '...' as message_preview,
    status,
    created_at
FROM public.leads
ORDER BY created_at DESC
LIMIT 10;
