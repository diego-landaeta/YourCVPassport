-- =============================================
-- Permitir sender_id NULL para mensajes externos
-- =============================================

-- PASO 1: Modificar la columna sender_id para permitir NULL
ALTER TABLE public.messages
ALTER COLUMN sender_id DROP NOT NULL;

-- PASO 2: Actualizar mensajes existentes que tienen sender_id incorrecto
-- Marcar como NULL los mensajes donde el sender_name no coincide con el usuario autenticado
UPDATE public.messages m
SET sender_id = NULL
FROM public.leads l
WHERE m.lead_id = l.id
AND m.sender_id IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM auth.users u
    WHERE u.id = m.sender_id
    AND u.email = (SELECT sender_email FROM public.leads WHERE id = m.lead_id)
);

-- PASO 3: Verificar cambios
SELECT
    '📊 MENSAJES ACTUALIZADOS' as status,
    COUNT(*) FILTER (WHERE sender_id IS NULL) as mensajes_externos,
    COUNT(*) FILTER (WHERE sender_id IS NOT NULL) as mensajes_internos,
    COUNT(*) as total
FROM public.messages;
