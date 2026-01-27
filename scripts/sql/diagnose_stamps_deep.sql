-- Diagnóstico profundo del sistema de stamps

-- 1. Ver TODOS los stamps que existen
SELECT 
    s.id,
    s.profile_id,
    p.full_name,
    p.email,
    s.type,
    s.status,
    s.created_at,
    s.verified_at,
    s.evidence
FROM stamps s
LEFT JOIN profiles p ON p.id = s.profile_id
ORDER BY s.created_at DESC
LIMIT 20;

-- 2. Contar stamps por estado
SELECT 
    status,
    COUNT(*) as total,
    COUNT(DISTINCT profile_id) as unique_users
FROM stamps
GROUP BY status
ORDER BY status;

-- 3. Contar stamps por tipo
SELECT 
    type,
    status,
    COUNT(*) as count
FROM stamps
GROUP BY type, status
ORDER BY type, status;

-- 4. Ver usuarios SIN ningún stamp
SELECT 
    p.id,
    p.full_name,
    p.email,
    p.created_at,
    COUNT(s.id) as stamp_count
FROM profiles p
LEFT JOIN stamps s ON s.profile_id = p.id
GROUP BY p.id, p.full_name, p.email, p.created_at
HAVING COUNT(s.id) = 0
ORDER BY p.created_at DESC
LIMIT 10;

-- 5. Ver usuarios CON stamps pendientes
SELECT 
    p.id,
    p.full_name,
    p.email,
    COUNT(s.id) FILTER (WHERE s.status = 'PENDING') as pending_count,
    COUNT(s.id) FILTER (WHERE s.status = 'VERIFIED') as verified_count,
    COUNT(s.id) FILTER (WHERE s.status = 'REJECTED') as rejected_count
FROM profiles p
LEFT JOIN stamps s ON s.profile_id = p.id
GROUP BY p.id, p.full_name, p.email
HAVING COUNT(s.id) FILTER (WHERE s.status = 'PENDING') > 0
ORDER BY pending_count DESC;

-- 6. Verificar si existen RPC functions para crear stamps
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
    AND routine_name LIKE '%stamp%'
ORDER BY routine_name;
