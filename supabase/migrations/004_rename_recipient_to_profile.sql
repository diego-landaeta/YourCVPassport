-- =============================================
-- YourCVPassport - Renombrar recipient_id a profile_id
-- =============================================
-- Este script corrige el nombre de la columna para que sea consistente
-- con el resto del código que usa 'profile_id'

-- =============================================
-- PASO 1: Renombrar recipient_id a profile_id si existe
-- =============================================

DO $$
BEGIN
    -- Si existe recipient_id, renombrarlo a profile_id
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'leads'
        AND column_name = 'recipient_id'
    ) THEN
        -- Verificar que profile_id no exista ya
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'leads'
            AND column_name = 'profile_id'
        ) THEN
            ALTER TABLE public.leads RENAME COLUMN recipient_id TO profile_id;
            RAISE NOTICE '✓ Columna recipient_id renombrada a profile_id';
        ELSE
            RAISE NOTICE '⚠ Columna profile_id ya existe, no se puede renombrar';
        END IF;
    ELSE
        -- Si no existe recipient_id, verificar que profile_id exista
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'leads'
            AND column_name = 'profile_id'
        ) THEN
            -- Si tampoco existe profile_id, crearla
            ALTER TABLE public.leads ADD COLUMN profile_id UUID REFERENCES auth.users(id);
            RAISE NOTICE '✓ Columna profile_id creada';
        ELSE
            RAISE NOTICE '✓ Columna profile_id ya existe';
        END IF;
    END IF;
END $$;

-- =============================================
-- PASO 2: Actualizar la vista conversation_summaries
-- =============================================

DROP VIEW IF EXISTS public.conversation_summaries;

CREATE VIEW public.conversation_summaries AS
SELECT
    l.id AS lead_id,
    COALESCE(l.sender_id, (SELECT id FROM auth.users LIMIT 1)) AS sender_id,
    COALESCE(l.sender_name, 'Usuario') AS sender_name,
    COALESCE(l.profile_id, (SELECT id FROM auth.users LIMIT 1)) AS recipient_id,
    COALESCE(p.full_name, 'Usuario') AS recipient_name,
    COALESCE(l.lead_type, 'INQUIRY') AS lead_type,
    COALESCE(l.subject, 'Sin asunto') AS subject,
    COALESCE(l.status, 'PENDING') AS status,
    -- Último mensaje
    (
        SELECT m.content
        FROM public.messages m
        WHERE m.lead_id = l.id
        ORDER BY m.created_at DESC
        LIMIT 1
    ) AS last_message,
    -- Fecha del último mensaje
    COALESCE(
        (
            SELECT m.created_at
            FROM public.messages m
            WHERE m.lead_id = l.id
            ORDER BY m.created_at DESC
            LIMIT 1
        ),
        l.created_at,
        NOW()
    ) AS last_message_at,
    -- Mensajes no leídos
    (
        SELECT COUNT(*)::INTEGER
        FROM public.messages m
        WHERE m.lead_id = l.id
        AND m.is_read = FALSE
        AND m.sender_id != COALESCE(l.profile_id, l.sender_id)
    ) AS unread_count,
    -- Total de mensajes
    (
        SELECT COUNT(*)::INTEGER
        FROM public.messages m
        WHERE m.lead_id = l.id
    ) AS message_count,
    COALESCE(l.created_at, NOW()) AS created_at
FROM public.leads l
LEFT JOIN public.profiles p ON p.id = l.profile_id
WHERE COALESCE(l.status, 'PENDING') != 'REJECTED'
ORDER BY last_message_at DESC;

-- =============================================
-- PASO 3: Actualizar políticas RLS para messages
-- =============================================

DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can update messages in their conversations" ON public.messages;

CREATE POLICY "Users can view messages in their conversations"
ON public.messages FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.leads l
        WHERE l.id = messages.lead_id
        AND (COALESCE(l.sender_id, auth.uid()) = auth.uid()
             OR COALESCE(l.profile_id, auth.uid()) = auth.uid())
    )
);

CREATE POLICY "Users can send messages in their conversations"
ON public.messages FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.leads l
        WHERE l.id = messages.lead_id
        AND (COALESCE(l.sender_id, auth.uid()) = auth.uid()
             OR COALESCE(l.profile_id, auth.uid()) = auth.uid())
    )
    AND sender_id = auth.uid()
);

CREATE POLICY "Users can update messages in their conversations"
ON public.messages FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.leads l
        WHERE l.id = messages.lead_id
        AND (COALESCE(l.sender_id, auth.uid()) = auth.uid()
             OR COALESCE(l.profile_id, auth.uid()) = auth.uid())
    )
);

-- =============================================
-- VERIFICACIÓN FINAL
-- =============================================

DO $$
DECLARE
    profile_id_exists BOOLEAN;
    lead_cols TEXT;
BEGIN
    -- Verificar columna profile_id
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'leads'
        AND column_name = 'profile_id'
    ) INTO profile_id_exists;

    -- Listar columnas de leads
    SELECT string_agg(column_name, ', ' ORDER BY ordinal_position)
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'leads'
    INTO lead_cols;

    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════';
    RAISE NOTICE '         VERIFICACIÓN COMPLETADA                   ';
    RAISE NOTICE '═══════════════════════════════════════════════════';

    IF profile_id_exists THEN
        RAISE NOTICE '✅ Columna profile_id configurada correctamente';
        RAISE NOTICE '';
        RAISE NOTICE '📋 Columnas en tabla leads:';
        RAISE NOTICE '   %', lead_cols;
        RAISE NOTICE '';
        RAISE NOTICE '🎉 ¡Migración completada exitosamente!';
    ELSE
        RAISE WARNING '❌ Columna profile_id NO existe en la tabla leads';
    END IF;

    RAISE NOTICE '═══════════════════════════════════════════════════';
END $$;
