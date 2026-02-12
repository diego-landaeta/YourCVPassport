-- Ver summaries completos para acortar manualmente
SELECT
    '==== ' || full_name || ' (' || LENGTH(summary) || ' chars) ====' as header,
    summary
FROM public.profiles
WHERE email IN (
    'richard.hamilton@iseih.edu',
    'janet.lee@iseih.edu',
    'angela.roberts@iseih.edu',
    'maria.gonzalez@iseih.edu',
    'brian.cooper@iseih.edu',
    'steven.mitchell@iseih.edu'
)
ORDER BY LENGTH(summary) DESC;
