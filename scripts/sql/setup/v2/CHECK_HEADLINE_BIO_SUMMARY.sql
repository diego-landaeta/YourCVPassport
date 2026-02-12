-- Verificar contenido de headline, bio y summary para detectar duplicaciones
SELECT
  full_name,
  email,
  LEFT(headline, 50) as headline_preview,
  LEFT(bio, 50) as bio_preview,
  LEFT(summary, 50) as summary_preview,
  LENGTH(headline) as headline_len,
  LENGTH(bio) as bio_len,
  LENGTH(summary) as summary_len,
  CASE
    WHEN headline = bio THEN '❌ HEADLINE = BIO (DUPLICADO)'
    WHEN bio IS NOT NULL AND bio != '' THEN '⚠️ Bio existe'
    ELSE '✅ Bio vacío/null'
  END as status
FROM profiles
WHERE email LIKE '%@iseih.edu'
ORDER BY full_name
LIMIT 50;
