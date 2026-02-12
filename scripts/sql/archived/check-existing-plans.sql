-- Ver qué valores de plan usan los perfiles existentes
SELECT DISTINCT plan, COUNT(*) as count
FROM public.profiles
GROUP BY plan
ORDER BY count DESC;
