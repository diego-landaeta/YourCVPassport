-- ============================================================================
-- PERFILES QUE FALTAN FOTO
-- ============================================================================
-- Muestra todos los perfiles profesionales EXCEPTO los 12 que ya tienen foto
-- ============================================================================

SELECT
    full_name,
    email,
    slug,
    CASE WHEN avatar_url IS NOT NULL AND avatar_url != '' THEN '✅ Ya tiene' ELSE '❌ Falta' END as estado_foto
FROM public.profiles
WHERE role = 'professional'
  AND full_name NOT IN (
    'Linda Zhang',
    'Daniel Foster',
    'Priya Sharma',
    'Christopher Barnes',
    'Nicole Taylor',
    'Elizabeth Morgan',
    'Richard Hamilton',
    'Maria Gonzalez',
    'Janet Lee',
    'Steven Mitchell',
    'Angela Roberts',
    'Brian Cooper'
  )
ORDER BY full_name;

-- Contar cuántos faltan
SELECT
    COUNT(*) as total_que_faltan
FROM public.profiles
WHERE role = 'professional'
  AND full_name NOT IN (
    'Linda Zhang',
    'Daniel Foster',
    'Priya Sharma',
    'Christopher Barnes',
    'Nicole Taylor',
    'Elizabeth Morgan',
    'Richard Hamilton',
    'Maria Gonzalez',
    'Janet Lee',
    'Steven Mitchell',
    'Angela Roberts',
    'Brian Cooper'
  );
