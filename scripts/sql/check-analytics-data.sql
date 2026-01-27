-- Script para verificar los datos de analytics actuales

-- Ver todas las visitas registradas
SELECT
  'VISITAS' as tipo,
  profile_id,
  visitor_id,
  viewed_at,
  country,
  city,
  referrer
FROM analytics_views
ORDER BY viewed_at DESC
LIMIT 20;

-- Contar visitas por perfil (últimos 30 días)
SELECT
  'RESUMEN VISITAS POR PERFIL' as tipo,
  profile_id,
  COUNT(*) as total_visitas,
  COUNT(DISTINCT visitor_id) as visitantes_unicos
FROM analytics_views
WHERE viewed_at >= NOW() - INTERVAL '30 days'
GROUP BY profile_id;

-- Ver clics en CTAs
SELECT
  'CLICS EN CTAS' as tipo,
  profile_id,
  cta_type,
  cta_label,
  clicked_at
FROM analytics_clicks
ORDER BY clicked_at DESC
LIMIT 20;

-- Contar clics por perfil
SELECT
  'RESUMEN CLICS POR PERFIL' as tipo,
  profile_id,
  COUNT(*) as total_clics
FROM analytics_clicks
WHERE clicked_at >= NOW() - INTERVAL '30 days'
GROUP BY profile_id;
