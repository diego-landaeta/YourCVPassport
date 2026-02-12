-- 1. OCULTAR CARLOS SAIZ DEFINITIVAMENTE
UPDATE public.profiles
SET role = 'archived', profile_hidden = true
WHERE full_name LIKE '%Carlos%Saiz%';

-- 2. VERIFICAR REBECCA ANDERSON
SELECT id, full_name, email, role, LENGTH(summary) as summary_chars
FROM public.profiles
WHERE full_name = 'Rebecca Anderson' OR email = 'rebecca.anderson@iseih.edu';

-- 3. VER TODOS LOS PERFILES ACTIVOS (debería mostrar Rebecca y NO Carlos)
SELECT full_name, email, role, profile_hidden
FROM public.profiles
WHERE role = 'professional' AND profile_hidden = false
ORDER BY full_name;
