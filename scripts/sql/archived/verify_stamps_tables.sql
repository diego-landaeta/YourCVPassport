-- Verificar qué tablas existen relacionadas con stamps
SELECT 
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
    AND table_name LIKE '%stamp%'
ORDER BY table_name;

-- Verificar estructura de la tabla stamps
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'stamps'
ORDER BY ordinal_position;

-- Contar stamps por estado
SELECT 
    status,
    COUNT(*) as count
FROM stamps
GROUP BY status;

-- Verificar si existe la tabla stamp_verification_requests
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
        AND table_name = 'stamp_verification_requests'
) as table_exists;
