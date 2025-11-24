-- =============================================
-- DIAGNÓSTICO COMPLETO DEL PROBLEMA
-- =============================================

-- PASO 1: Ver TODOS los leads
SELECT '========== LEADS ==========' as section;
SELECT
    id,
    profile_id,
    sender_email,
    sender_name,
    subject,
    created_at
FROM public.leads
ORDER BY created_at DESC;

-- PASO 2: Ver TODOS los usuarios
SELECT '========== USUARIOS ==========' as section;
SELECT
    id,
    email,
    created_at
FROM auth.users
ORDER BY created_at DESC;

-- PASO 3: Ver TODAS las conversaciones de la vista (SIN FILTRO)
SELECT '========== CONVERSATION_SUMMARIES (TODAS) ==========' as section;
SELECT
    lead_id,
    sender_id,
    sender_name,
    recipient_id,
    recipient_name,
    subject,
    last_message,
    message_count
FROM public.conversation_summaries
ORDER BY last_message_at DESC;

-- PASO 4: Ver los profiles
SELECT '========== PROFILES ==========' as section;
SELECT
    id,
    full_name,
    email
FROM public.profiles
ORDER BY created_at DESC;

-- PASO 5: Simulación para usuario tester@dev.com
DO $$
DECLARE
    tester_id UUID;
    admin_id UUID;
BEGIN
    -- Obtener IDs
    SELECT id INTO tester_id FROM auth.users WHERE email = 'tester@dev.com';
    SELECT id INTO admin_id FROM auth.users WHERE email = 'admin@example.com' LIMIT 1;

    IF tester_id IS NULL THEN
        SELECT id INTO tester_id FROM auth.users WHERE email LIKE '%test%' LIMIT 1;
    END IF;

    IF admin_id IS NULL THEN
        SELECT id INTO admin_id FROM auth.users WHERE email != COALESCE((SELECT email FROM auth.users WHERE id = tester_id), '') LIMIT 1;
    END IF;

    RAISE NOTICE '========== IDS ==========';
    RAISE NOTICE 'TESTER ID: %', tester_id;
    RAISE NOTICE 'ADMIN ID: %', admin_id;

    RAISE NOTICE '========== CONVERSACIONES PARA TESTER (por sender_id) ==========';
    FOR rec IN (
        SELECT lead_id, sender_id, sender_name, recipient_id, recipient_name, subject
        FROM public.conversation_summaries
        WHERE sender_id = tester_id
    ) LOOP
        RAISE NOTICE 'Lead: % | De: % (%) | Para: % (%)',
            rec.lead_id, rec.sender_name, rec.sender_id, rec.recipient_name, rec.recipient_id;
    END LOOP;

    RAISE NOTICE '========== CONVERSACIONES PARA TESTER (por recipient_id) ==========';
    FOR rec IN (
        SELECT lead_id, sender_id, sender_name, recipient_id, recipient_name, subject
        FROM public.conversation_summaries
        WHERE recipient_id = tester_id
    ) LOOP
        RAISE NOTICE 'Lead: % | De: % (%) | Para: % (%)',
            rec.lead_id, rec.sender_name, rec.sender_id, rec.recipient_name, rec.recipient_id;
    END LOOP;

    RAISE NOTICE '========== CONVERSACIONES PARA TESTER (sender_id OR recipient_id) ==========';
    FOR rec IN (
        SELECT lead_id, sender_id, sender_name, recipient_id, recipient_name, subject
        FROM public.conversation_summaries
        WHERE sender_id = tester_id OR recipient_id = tester_id
    ) LOOP
        RAISE NOTICE 'Lead: % | De: % (%) | Para: % (%)',
            rec.lead_id, rec.sender_name, rec.sender_id, rec.recipient_name, rec.recipient_id;
    END LOOP;
END $$;
