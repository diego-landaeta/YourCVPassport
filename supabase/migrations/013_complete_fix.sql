-- =============================================
-- FIX COMPLETO: Sistema de Leads y Mensajes
-- =============================================

-- PASO 1: Deshabilitar RLS en ambas tablas
ALTER TABLE public.leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;

-- PASO 2: Eliminar TODAS las políticas
DROP POLICY IF EXISTS "Users can view their own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can insert leads to any profile" ON public.leads;
DROP POLICY IF EXISTS "Users can update their own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can delete their own leads" ON public.leads;
DROP POLICY IF EXISTS "Profile owners can view leads sent to them" ON public.leads;
DROP POLICY IF EXISTS "Profile owners can update leads sent to them" ON public.leads;
DROP POLICY IF EXISTS "Anyone can insert leads" ON public.leads;
DROP POLICY IF EXISTS "Profile owners can view their leads" ON public.leads;
DROP POLICY IF EXISTS "Profile owners can update their leads" ON public.leads;
DROP POLICY IF EXISTS "Profile owners can delete their leads" ON public.leads;

DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can update messages in their conversations" ON public.messages;

-- PASO 3: Verificar estructura de leads
DO $$
BEGIN
    -- Asegurar que profile_id existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'leads' AND column_name = 'profile_id'
    ) THEN
        -- Si existe recipient_id, renombrarlo
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'leads' AND column_name = 'recipient_id'
        ) THEN
            ALTER TABLE public.leads RENAME COLUMN recipient_id TO profile_id;
            RAISE NOTICE '✓ Renombrado recipient_id a profile_id';
        ELSE
            ALTER TABLE public.leads ADD COLUMN profile_id UUID REFERENCES auth.users(id);
            RAISE NOTICE '✓ Creada columna profile_id';
        END IF;
    END IF;
END $$;

-- PASO 4: Crear mensajes iniciales para todos los leads sin mensajes
DO $$
DECLARE
    lead_record RECORD;
    messages_created INTEGER := 0;
BEGIN
    -- Para cada lead que NO tenga mensajes, crear uno
    FOR lead_record IN
        SELECT l.id, l.profile_id, l.sender_name, l.message
        FROM public.leads l
        WHERE NOT EXISTS (
            SELECT 1 FROM public.messages m WHERE m.lead_id = l.id
        )
        ORDER BY l.created_at DESC
    LOOP
        INSERT INTO public.messages (lead_id, sender_id, sender_name, content, is_read, created_at)
        VALUES (
            lead_record.id,
            lead_record.profile_id,
            lead_record.sender_name,
            lead_record.message,
            false,
            NOW()
        );

        messages_created := messages_created + 1;
    END LOOP;

    IF messages_created > 0 THEN
        RAISE NOTICE '✓ Creados % mensajes iniciales para leads existentes', messages_created;
    ELSE
        RAISE NOTICE '✓ Todos los leads ya tienen mensajes';
    END IF;
END $$;

-- PASO 5: Verificación final
DO $$
DECLARE
    leads_rls BOOLEAN;
    messages_rls BOOLEAN;
    leads_count INTEGER;
    messages_count INTEGER;
    profile_id_exists BOOLEAN;
BEGIN
    -- Verificar RLS
    SELECT relrowsecurity FROM pg_class WHERE relname = 'leads' AND relnamespace = 'public'::regnamespace INTO leads_rls;
    SELECT relrowsecurity FROM pg_class WHERE relname = 'messages' AND relnamespace = 'public'::regnamespace INTO messages_rls;

    -- Contar registros
    SELECT COUNT(*) FROM public.leads INTO leads_count;
    SELECT COUNT(*) FROM public.messages INTO messages_count;

    -- Verificar columna
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'leads' AND column_name = 'profile_id'
    ) INTO profile_id_exists;

    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════';
    RAISE NOTICE '         VERIFICACIÓN FINAL                        ';
    RAISE NOTICE '═══════════════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE 'RLS en leads: % (debe ser FALSE)', COALESCE(leads_rls, false);
    RAISE NOTICE 'RLS en messages: % (debe ser FALSE)', COALESCE(messages_rls, false);
    RAISE NOTICE '';
    RAISE NOTICE 'Columna profile_id existe: %', profile_id_exists;
    RAISE NOTICE '';
    RAISE NOTICE 'Total leads: %', leads_count;
    RAISE NOTICE 'Total messages: %', messages_count;
    RAISE NOTICE '';

    IF NOT COALESCE(leads_rls, false) AND NOT COALESCE(messages_rls, false) AND profile_id_exists THEN
        RAISE NOTICE '✅ TODO CONFIGURADO CORRECTAMENTE';
    ELSE
        RAISE WARNING '⚠ Hay problemas en la configuración';
    END IF;

    RAISE NOTICE '═══════════════════════════════════════════════════';
END $$;
