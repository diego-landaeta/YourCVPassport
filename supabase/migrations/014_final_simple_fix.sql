-- =============================================
-- FIX SIMPLE Y DIRECTO
-- =============================================

-- PASO 1: Deshabilitar RLS completamente
ALTER TABLE public.leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;

-- PASO 2: Eliminar TODAS las políticas
DO $$
BEGIN
    -- Eliminar políticas de leads
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

    -- Eliminar políticas de messages
    DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
    DROP POLICY IF EXISTS "Users can send messages in their conversations" ON public.messages;
    DROP POLICY IF EXISTS "Users can update messages in their conversations" ON public.messages;
END $$;

-- PASO 3: Verificar y corregir profile_id
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'leads' AND column_name = 'recipient_id'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'leads' AND column_name = 'profile_id'
    ) THEN
        ALTER TABLE public.leads RENAME COLUMN recipient_id TO profile_id;
        RAISE NOTICE '✓ Columna renombrada: recipient_id → profile_id';
    END IF;
END $$;

-- PASO 4: Verificación simple
SELECT
    '✅ CONFIGURACIÓN COMPLETADA' as status,
    COUNT(*) as total_leads
FROM public.leads;

SELECT
    '📊 MENSAJES EXISTENTES' as status,
    COUNT(*) as total_messages
FROM public.messages;

-- Mostrar leads sin mensajes
SELECT
    '⚠️ LEADS SIN MENSAJES' as status,
    l.id,
    l.sender_name,
    l.created_at
FROM public.leads l
LEFT JOIN public.messages m ON m.lead_id = l.id
WHERE m.id IS NULL
ORDER BY l.created_at DESC
LIMIT 5;
