-- Ver qué valores de employment_type usan las experiencias existentes
SELECT DISTINCT employment_type, COUNT(*) as count
FROM public.experiences
WHERE employment_type IS NOT NULL
GROUP BY employment_type
ORDER BY count DESC;

-- Ver la definición de la constraint
SELECT
    conname,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conname = 'experiences_employment_type_check';
