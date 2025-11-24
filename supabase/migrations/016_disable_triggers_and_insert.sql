-- =============================================
-- Deshabilitar triggers y luego insertar mensajes
-- =============================================

-- PASO 1: Buscar y eliminar el trigger problemático
DO $$
DECLARE
    trigger_name TEXT;
BEGIN
    -- Buscar todos los triggers en la tabla leads
    FOR trigger_name IN
        SELECT tgname
        FROM pg_trigger
        WHERE tgrelid = 'public.leads'::regclass
        AND tgname LIKE '%message%'
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.leads', trigger_name);
        RAISE NOTICE 'Trigger eliminado: %', trigger_name;
    END LOOP;

    -- Buscar triggers en messages relacionados con leads
    FOR trigger_name IN
        SELECT tgname
        FROM pg_trigger
        WHERE tgrelid = 'public.messages'::regclass
        AND tgname LIKE '%lead%'
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.messages', trigger_name);
        RAISE NOTICE 'Trigger eliminado: %', trigger_name;
    END LOOP;
END $$;

-- PASO 2: Buscar y eliminar la función del trigger
DROP FUNCTION IF EXISTS update_lead_last_message() CASCADE;
DROP FUNCTION IF EXISTS update_lead_last_message_at() CASCADE;

-- PASO 3: Ahora sí insertar los mensajes
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
);

-- PASO 4: Verificación final
SELECT
    '✅ OPERACIÓN COMPLETADA' as status,
    (SELECT COUNT(*) FROM public.leads) as total_leads,
    (SELECT COUNT(*) FROM public.messages) as total_messages,
    (SELECT COUNT(*) FROM public.leads l WHERE NOT EXISTS (
        SELECT 1 FROM public.messages m WHERE m.lead_id = l.id
    )) as leads_sin_mensajes;
