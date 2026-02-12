-- Verificar la constraint profiles_plan_check
SELECT
    conname,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conname = 'profiles_plan_check';
