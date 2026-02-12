-- Script para limpiar datos de analytics y empezar desde cero
-- Esto eliminará todas las visitas, clics y leads registrados

-- IMPORTANTE: Ejecutar esto solo si quieres borrar todos los datos analíticos

-- Limpiar visitas
DELETE FROM analytics_views;

-- Limpiar clics en CTAs
DELETE FROM analytics_clicks;

-- Limpiar leads (opcional - descomenta si también quieres borrar leads)
-- DELETE FROM analytics_leads;

-- Verificar que las tablas están vacías
SELECT 'analytics_views' as tabla, COUNT(*) as registros FROM analytics_views
UNION ALL
SELECT 'analytics_clicks' as tabla, COUNT(*) as registros FROM analytics_clicks
UNION ALL
SELECT 'analytics_leads' as tabla, COUNT(*) as registros FROM analytics_leads;
