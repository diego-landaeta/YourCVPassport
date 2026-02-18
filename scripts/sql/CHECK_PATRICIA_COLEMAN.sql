-- Verificar contenido de Patricia Coleman
SELECT
  full_name,
  email,
  LEFT(headline, 100) as headline_preview,
  LEFT(summary, 200) as summary_preview,
  LENGTH(headline) as headline_length,
  LENGTH(summary) as summary_length,
  CASE
    WHEN headline = summary THEN '❌ SON IGUALES'
    WHEN headline IS DISTINCT FROM summary THEN '✅ SON DISTINTOS'
    ELSE 'NULL values'
  END as comparison
FROM profiles
WHERE email = 'patricia.coleman@iseih.edu';
