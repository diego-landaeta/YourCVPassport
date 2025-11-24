-- =============================================
-- Verificar y deshabilitar RLS en conversation_summaries
-- =============================================

-- Ver si la vista tiene RLS activado (las vistas no deberían tener RLS, pero verificamos)
SELECT
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename = 'conversation_summaries';

-- Verificar políticas RLS en las tablas base
SELECT
    '🔒 POLÍTICAS RLS EN LEADS' as info,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'leads';

SELECT
    '🔒 POLÍTICAS RLS EN MESSAGES' as info,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'messages';

-- Verificar si RLS está activado en las tablas
SELECT
    '📊 ESTADO RLS' as info,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('leads', 'messages', 'profiles');

-- Desactivar RLS si está activado
ALTER TABLE IF EXISTS public.leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profiles DISABLE ROW LEVEL SECURITY;

SELECT '✅ RLS DESACTIVADO EN TODAS LAS TABLAS' as status;
