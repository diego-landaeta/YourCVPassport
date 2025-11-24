-- =============================================
-- Debug: Simular la consulta que hace LeadsPage.tsx
-- =============================================

-- Mostrar el ID del usuario Administrator
SELECT
    'Usuario Administrator:' as info,
    id,
    full_name,
    email
FROM public.profiles
WHERE email = 'admin@yourcvpassport.com';

-- Simular la consulta exacta que hace el código en LeadsPage.tsx línea 50-55
-- SELECT * FROM leads WHERE profile_id = <admin_id> AND status != 'deleted'
SELECT
    'Leads para Administrator:' as info,
    l.id,
    l.profile_id,
    l.sender_name,
    l.sender_email,
    l.subject,
    l.status,
    l.created_at
FROM public.leads l
WHERE l.profile_id = '93856aad-e6cb-49c8-b912-123389d3e2ad'
AND l.status != 'deleted'
ORDER BY l.created_at DESC;

-- Ver TODOS los leads sin filtro para comparar
SELECT
    'TODOS los leads (sin filtro):' as info,
    id,
    profile_id,
    sender_name,
    sender_email,
    status,
    created_at
FROM public.leads
ORDER BY created_at DESC
LIMIT 5;
