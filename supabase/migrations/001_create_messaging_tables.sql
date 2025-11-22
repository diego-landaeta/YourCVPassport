-- =============================================
-- YourCVPassport - Messaging System Database Schema
-- =============================================
-- Este archivo contiene todas las tablas y vistas necesarias
-- para el sistema de mensajería entre usuarios y reclutadores

-- =============================================
-- 1. TABLA: messages
-- =============================================
-- Almacena todos los mensajes enviados en conversaciones

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
-- 2. VISTA: conversation_summaries
-- =============================================
-- Genera un resumen de todas las conversaciones con contadores de mensajes

CREATE OR REPLACE VIEW public.conversation_summaries AS
SELECT
    l.id AS lead_id,
    l.sender_id,
    l.sender_name,
    l.recipient_id,
    p.full_name AS recipient_name,
    l.lead_type,
    l.subject,
    l.status,
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
        AND m.sender_id != l.recipient_id
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
WHERE l.status != 'REJECTED' -- Excluir conversaciones rechazadas
ORDER BY last_message_at DESC;

-- =============================================
-- 3. POLÍTICAS RLS (Row Level Security)
-- =============================================

-- Habilitar RLS en la tabla messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios pueden ver mensajes de conversaciones en las que participan
CREATE POLICY "Users can view messages in their conversations"
ON public.messages
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.leads l
        WHERE l.id = messages.lead_id
        AND (l.sender_id = auth.uid() OR l.recipient_id = auth.uid())
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
        AND (l.sender_id = auth.uid() OR l.recipient_id = auth.uid())
    )
    AND sender_id = auth.uid()
);

-- Política: Los usuarios pueden actualizar sus propios mensajes (marcar como leídos)
CREATE POLICY "Users can update messages in their conversations"
ON public.messages
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.leads l
        WHERE l.id = messages.lead_id
        AND (l.sender_id = auth.uid() OR l.recipient_id = auth.uid())
    )
);

-- =============================================
-- 4. TRIGGER: Actualizar updated_at automáticamente
-- =============================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_messages_updated_at
    BEFORE UPDATE ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- 5. REALTIME: Habilitar publicaciones en tiempo real
-- =============================================

-- Habilitar Realtime para la tabla messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- =============================================
-- 6. FUNCIÓN: Marcar mensajes como leídos
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
-- VERIFICACIÓN
-- =============================================
-- Para verificar que todo se creó correctamente, ejecuta:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('messages');
-- SELECT table_name FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'conversation_summaries';
