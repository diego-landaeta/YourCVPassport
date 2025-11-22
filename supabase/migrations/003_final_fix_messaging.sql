-- =============================================
-- YourCVPassport - Corrección Completa del Sistema de Mensajería
-- =============================================
-- Script definitivo que verifica TODAS las columnas necesarias

-- =============================================
-- PASO 1: Verificar estructura de la tabla leads
-- =============================================

-- Agregar columna sender_id si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'leads' AND column_name = 'sender_id'
    ) THEN
        ALTER TABLE public.leads ADD COLUMN sender_id UUID REFERENCES auth.users(id);
        RAISE NOTICE '✓ Columna sender_id agregada a leads';
    ELSE
        RAISE NOTICE '✓ Columna sender_id ya existe';
    END IF;
END $$;

-- Agregar columna sender_name si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'leads' AND column_name = 'sender_name'
    ) THEN
        ALTER TABLE public.leads ADD COLUMN sender_name TEXT;
        RAISE NOTICE '✓ Columna sender_name agregada a leads';
    ELSE
        RAISE NOTICE '✓ Columna sender_name ya existe';
    END IF;
END $$;

-- Agregar columna recipient_id si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'leads' AND column_name = 'recipient_id'
    ) THEN
        -- Verificar si existe profile_id para renombrar
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'leads' AND column_name = 'profile_id'
        ) THEN
            ALTER TABLE public.leads RENAME COLUMN profile_id TO recipient_id;
            RAISE NOTICE '✓ Columna profile_id renombrada a recipient_id';
        ELSE
            ALTER TABLE public.leads ADD COLUMN recipient_id UUID REFERENCES auth.users(id);
            RAISE NOTICE '✓ Columna recipient_id agregada a leads';
        END IF;
    ELSE
        RAISE NOTICE '✓ Columna recipient_id ya existe';
    END IF;
END $$;

-- Agregar columna lead_type si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'leads' AND column_name = 'lead_type'
    ) THEN
        ALTER TABLE public.leads ADD COLUMN lead_type TEXT DEFAULT 'INQUIRY';
        RAISE NOTICE '✓ Columna lead_type agregada a leads';
    ELSE
        RAISE NOTICE '✓ Columna lead_type ya existe';
    END IF;
END $$;

-- Agregar columna subject si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'leads' AND column_name = 'subject'
    ) THEN
        ALTER TABLE public.leads ADD COLUMN subject TEXT;
        RAISE NOTICE '✓ Columna subject agregada a leads';
    ELSE
        RAISE NOTICE '✓ Columna subject ya existe';
    END IF;
END $$;

-- Agregar columna status si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'leads' AND column_name = 'status'
    ) THEN
        ALTER TABLE public.leads ADD COLUMN status TEXT DEFAULT 'PENDING';
        RAISE NOTICE '✓ Columna status agregada a leads';
    ELSE
        RAISE NOTICE '✓ Columna status ya existe';
    END IF;
END $$;

-- =============================================
-- PASO 2: Crear tabla messages
-- =============================================

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sender_name TEXT NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para rendimiento
CREATE INDEX IF NOT EXISTS idx_messages_lead_id ON public.messages(lead_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON public.messages(is_read) WHERE is_read = FALSE;

-- =============================================
-- PASO 3: Crear vista conversation_summaries
-- =============================================

DROP VIEW IF EXISTS public.conversation_summaries;

CREATE VIEW public.conversation_summaries AS
SELECT
    l.id AS lead_id,
    COALESCE(l.sender_id, (SELECT id FROM auth.users LIMIT 1)) AS sender_id,
    COALESCE(l.sender_name, 'Usuario') AS sender_name,
    COALESCE(l.recipient_id, (SELECT id FROM auth.users LIMIT 1)) AS recipient_id,
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
        AND m.sender_id != COALESCE(l.recipient_id, l.sender_id)
    ) AS unread_count,
    -- Total de mensajes
    (
        SELECT COUNT(*)::INTEGER
        FROM public.messages m
        WHERE m.lead_id = l.id
    ) AS message_count,
    COALESCE(l.created_at, NOW()) AS created_at
FROM public.leads l
LEFT JOIN public.profiles p ON p.id = l.recipient_id
WHERE COALESCE(l.status, 'PENDING') != 'REJECTED'
ORDER BY last_message_at DESC;

-- =============================================
-- PASO 4: Políticas RLS
-- =============================================

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

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
             OR COALESCE(l.recipient_id, auth.uid()) = auth.uid())
    )
);

CREATE POLICY "Users can send messages in their conversations"
ON public.messages FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.leads l
        WHERE l.id = messages.lead_id
        AND (COALESCE(l.sender_id, auth.uid()) = auth.uid()
             OR COALESCE(l.recipient_id, auth.uid()) = auth.uid())
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
             OR COALESCE(l.recipient_id, auth.uid()) = auth.uid())
    )
);

-- =============================================
-- PASO 5: Trigger para updated_at
-- =============================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_messages_updated_at ON public.messages;
CREATE TRIGGER update_messages_updated_at
    BEFORE UPDATE ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- PASO 6: Realtime
-- =============================================

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    RAISE NOTICE '✓ Realtime habilitado para messages';
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE '✓ Realtime ya estaba habilitado';
END $$;

-- =============================================
-- PASO 7: Función auxiliar
-- =============================================

CREATE OR REPLACE FUNCTION public.mark_messages_as_read(p_lead_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.messages
    SET is_read = TRUE, read_at = NOW()
    WHERE lead_id = p_lead_id
    AND sender_id != auth.uid()
    AND is_read = FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- VERIFICACIÓN FINAL
-- =============================================

DO $$
DECLARE
    msgs_table BOOLEAN;
    conv_view BOOLEAN;
    lead_cols TEXT;
BEGIN
    -- Verificar tabla messages
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'messages'
    ) INTO msgs_table;

    -- Verificar vista
    SELECT EXISTS (
        SELECT 1 FROM information_schema.views
        WHERE table_schema = 'public' AND table_name = 'conversation_summaries'
    ) INTO conv_view;

    -- Listar columnas de leads
    SELECT string_agg(column_name, ', ' ORDER BY ordinal_position)
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'leads'
    INTO lead_cols;

    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════';
    RAISE NOTICE '         VERIFICACIÓN COMPLETADA                   ';
    RAISE NOTICE '═══════════════════════════════════════════════════';

    IF msgs_table AND conv_view THEN
        RAISE NOTICE '✅ TODO INSTALADO CORRECTAMENTE';
        RAISE NOTICE '';
        RAISE NOTICE '✓ Tabla messages: OK';
        RAISE NOTICE '✓ Vista conversation_summaries: OK';
        RAISE NOTICE '✓ Políticas RLS: OK';
        RAISE NOTICE '✓ Realtime: OK';
        RAISE NOTICE '';
        RAISE NOTICE '📋 Columnas en tabla leads:';
        RAISE NOTICE '   %', lead_cols;
        RAISE NOTICE '';
        RAISE NOTICE '🎉 ¡Sistema de mensajería listo para usar!';
    ELSE
        IF NOT msgs_table THEN
            RAISE WARNING '❌ Tabla messages NO fue creada';
        END IF;
        IF NOT conv_view THEN
            RAISE WARNING '❌ Vista conversation_summaries NO fue creada';
        END IF;
    END IF;

    RAISE NOTICE '═══════════════════════════════════════════════════';
END $$;
