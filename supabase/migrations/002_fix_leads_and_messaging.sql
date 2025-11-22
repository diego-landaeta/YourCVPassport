-- =============================================
-- YourCVPassport - Fix Leads Table & Messaging System
-- =============================================
-- Este script corrige la tabla leads y crea el sistema de mensajería

-- =============================================
-- PASO 1: Verificar y actualizar la tabla leads
-- =============================================

-- Verificar si la columna recipient_id existe, si no, agregarla
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'leads'
        AND column_name = 'recipient_id'
    ) THEN
        ALTER TABLE public.leads ADD COLUMN recipient_id UUID REFERENCES auth.users(id);
        RAISE NOTICE 'Column recipient_id added to leads table';
    END IF;
END $$;

-- Verificar si la columna profile_id existe (puede ser el equivalente a recipient_id)
DO $$
BEGIN
    -- Si existe profile_id pero no recipient_id, copiar los valores
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'leads'
        AND column_name = 'profile_id'
    ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'leads'
        AND column_name = 'recipient_id'
    ) THEN
        ALTER TABLE public.leads RENAME COLUMN profile_id TO recipient_id;
        RAISE NOTICE 'Column profile_id renamed to recipient_id';
    END IF;
END $$;

-- =============================================
-- PASO 2: Crear tabla messages si no existe
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

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_messages_lead_id ON public.messages(lead_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON public.messages(is_read) WHERE is_read = FALSE;

-- =============================================
-- PASO 3: Crear vista conversation_summaries
-- =============================================

-- Primero eliminar la vista si existe para recrearla
DROP VIEW IF EXISTS public.conversation_summaries;

CREATE OR REPLACE VIEW public.conversation_summaries AS
SELECT
    l.id AS lead_id,
    l.sender_id,
    l.sender_name,
    l.recipient_id,
    COALESCE(p.full_name, 'Usuario') AS recipient_name,
    l.lead_type,
    l.subject,
    COALESCE(l.status, 'PENDING') AS status,
    -- Obtener el último mensaje
    (
        SELECT m.content
        FROM public.messages m
        WHERE m.lead_id = l.id
        ORDER BY m.created_at DESC
        LIMIT 1
    ) AS last_message,
    -- Obtener la fecha del último mensaje
    COALESCE(
        (
            SELECT m.created_at
            FROM public.messages m
            WHERE m.lead_id = l.id
            ORDER BY m.created_at DESC
            LIMIT 1
        ),
        l.created_at
    ) AS last_message_at,
    -- Contar mensajes no leídos para el destinatario
    (
        SELECT COUNT(*)
        FROM public.messages m
        WHERE m.lead_id = l.id
        AND m.is_read = FALSE
        AND m.sender_id != COALESCE(l.recipient_id, l.sender_id)
    )::INTEGER AS unread_count,
    -- Contar total de mensajes
    (
        SELECT COUNT(*)
        FROM public.messages m
        WHERE m.lead_id = l.id
    )::INTEGER AS message_count,
    l.created_at
FROM public.leads l
LEFT JOIN public.profiles p ON p.id = l.recipient_id
WHERE COALESCE(l.status, 'PENDING') != 'REJECTED' -- Excluir conversaciones rechazadas
ORDER BY last_message_at DESC;

-- =============================================
-- PASO 4: Configurar RLS (Row Level Security)
-- =============================================

-- Habilitar RLS en la tabla messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can update messages in their conversations" ON public.messages;

-- Política: Los usuarios pueden ver mensajes de conversaciones en las que participan
CREATE POLICY "Users can view messages in their conversations"
ON public.messages
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.leads l
        WHERE l.id = messages.lead_id
        AND (l.sender_id = auth.uid() OR COALESCE(l.recipient_id, l.sender_id) = auth.uid())
    )
);

-- Política: Los usuarios pueden insertar mensajes en conversaciones en las que participan
CREATE POLICY "Users can send messages in their conversations"
ON public.messages
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.leads l
        WHERE l.id = messages.lead_id
        AND (l.sender_id = auth.uid() OR COALESCE(l.recipient_id, l.sender_id) = auth.uid())
    )
    AND sender_id = auth.uid()
);

-- Política: Los usuarios pueden actualizar mensajes en sus conversaciones
CREATE POLICY "Users can update messages in their conversations"
ON public.messages
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.leads l
        WHERE l.id = messages.lead_id
        AND (l.sender_id = auth.uid() OR COALESCE(l.recipient_id, l.sender_id) = auth.uid())
    )
);

-- =============================================
-- PASO 5: Triggers
-- =============================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para messages
DROP TRIGGER IF EXISTS update_messages_updated_at ON public.messages;
CREATE TRIGGER update_messages_updated_at
    BEFORE UPDATE ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- PASO 6: Habilitar Realtime
-- =============================================

-- Intentar habilitar Realtime (puede fallar si ya está habilitado)
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    RAISE NOTICE 'Realtime enabled for messages table';
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'Realtime already enabled for messages table';
END $$;

-- =============================================
-- PASO 7: Función auxiliar para marcar como leído
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

-- Verificar que las tablas y vistas existen
DO $$
DECLARE
    messages_exists BOOLEAN;
    view_exists BOOLEAN;
BEGIN
    -- Verificar tabla messages
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'messages'
    ) INTO messages_exists;

    -- Verificar vista conversation_summaries
    SELECT EXISTS (
        SELECT 1 FROM information_schema.views
        WHERE table_schema = 'public' AND table_name = 'conversation_summaries'
    ) INTO view_exists;

    IF messages_exists AND view_exists THEN
        RAISE NOTICE '✅ SUCCESS: All tables and views created successfully!';
        RAISE NOTICE '   - messages table: ✓';
        RAISE NOTICE '   - conversation_summaries view: ✓';
    ELSE
        IF NOT messages_exists THEN
            RAISE WARNING '❌ messages table was not created';
        END IF;
        IF NOT view_exists THEN
            RAISE WARNING '❌ conversation_summaries view was not created';
        END IF;
    END IF;
END $$;
