-- =============================================
-- Verificar tabla messages y sus políticas
-- =============================================

-- Verificar si la tabla messages existe
SELECT
    'Tabla messages existe:' as info,
    EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'messages'
    ) as exists;

-- Verificar RLS en messages
SELECT
    'RLS habilitado en messages:' as info,
    relrowsecurity as rls_enabled
FROM pg_class
WHERE relname = 'messages' AND relnamespace = 'public'::regnamespace;

-- Listar políticas de messages
SELECT
    'Políticas en messages:' as info,
    policyname,
    cmd as command
FROM pg_policies
WHERE tablename = 'messages' AND schemaname = 'public'
ORDER BY policyname;

-- Verificar columnas de messages
SELECT
    'Columnas de messages:' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'messages'
ORDER BY ordinal_position;
