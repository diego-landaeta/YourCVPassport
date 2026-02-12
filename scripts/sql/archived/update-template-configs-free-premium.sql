-- ========================================
-- ACTUALIZAR CONFIGURACIÓN DE PLANTILLAS
-- ========================================
-- Solo 3 plantillas son gratuitas, el resto son premium
-- Ejecutar este script en Supabase SQL Editor
-- ========================================

-- PASO 1: Establecer las 3 plantillas GRATUITAS
-- ========================================
INSERT INTO public.template_configs (template_id, is_free, is_premium, is_hidden, updated_at)
VALUES
    ('passport', true, false, false, NOW()),
    ('classic', true, false, false, NOW()),
    ('modern-professional', true, false, false, NOW())
ON CONFLICT (template_id)
DO UPDATE SET
    is_free = true,
    is_premium = false,
    is_hidden = EXCLUDED.is_hidden,
    updated_at = NOW();

-- PASO 2: Establecer las plantillas PREMIUM
-- ========================================
INSERT INTO public.template_configs (template_id, is_free, is_premium, is_hidden, updated_at)
VALUES
    ('corporate-classic', false, true, false, NOW()),
    ('creative-minimalist', false, true, false, NOW()),
    ('academic-standard', false, true, false, NOW()),
    ('modern-minimalist', false, true, false, NOW()),
    ('creative-bold', false, true, false, NOW()),
    ('professional-classic', false, true, false, NOW()),
    ('healthcare-professional', false, true, false, NOW()),
    ('minimalist-yellow', false, true, false, NOW()),
    ('gradient-blue', false, true, false, NOW()),
    ('coral-pink', false, true, false, NOW()),
    ('green-minimal', false, true, false, NOW()),
    ('creative-orange', false, true, false, NOW()),
    ('classic-sidebar', false, true, false, NOW()),
    ('modern-clean', false, true, false, NOW()),
    ('elegant-minimal', false, true, false, NOW()),
    ('professional-blue', false, true, false, NOW()),
    ('creative-modern', false, true, false, NOW()),
    ('urban', false, true, false, NOW())
ON CONFLICT (template_id)
DO UPDATE SET
    is_free = false,
    is_premium = true,
    is_hidden = EXCLUDED.is_hidden,
    updated_at = NOW();

-- ========================================
-- VERIFICACIÓN: Ver el estado de todas las plantillas
-- ========================================
SELECT
    template_id AS "ID Plantilla",
    CASE
        WHEN is_free THEN '✓ FREE'
        ELSE ''
    END AS "Gratuita",
    CASE
        WHEN is_premium THEN '✓ PREMIUM'
        ELSE ''
    END AS "Premium",
    CASE
        WHEN is_hidden THEN '✓ OCULTA'
        ELSE 'Visible'
    END AS "Visibilidad",
    CASE
        WHEN is_hidden THEN 'Oculta'
        WHEN is_free THEN 'Gratuita'
        WHEN is_premium THEN 'Premium'
        ELSE 'Sin configurar'
    END AS "Estado"
FROM public.template_configs
ORDER BY
    CASE
        WHEN is_free THEN 1
        WHEN is_premium THEN 2
        ELSE 3
    END,
    template_id;

-- ========================================
-- RESUMEN DE CAMBIOS
-- ========================================
SELECT
    COUNT(*) FILTER (WHERE is_free = true) AS "Plantillas Gratuitas",
    COUNT(*) FILTER (WHERE is_premium = true) AS "Plantillas Premium",
    COUNT(*) FILTER (WHERE is_hidden = true) AS "Plantillas Ocultas",
    COUNT(*) AS "Total de Plantillas"
FROM public.template_configs;

-- ========================================
-- NOTAS IMPORTANTES
-- ========================================
/*
✅ PLANTILLAS GRATUITAS (3):
1. passport - Pasaporte (Nuevo)
2. classic - Clásico
3. modern-professional - Profesional Moderno

🔒 PLANTILLAS PREMIUM (18):
4. corporate-classic - Corporativo Clásico
5. creative-minimalist - Creativo Minimalista
6. academic-standard - Estándar Académico
7. modern-minimalist - Moderno Minimalista
8. creative-bold - Creativo Audaz
9. professional-classic - Profesional Clásico
10. healthcare-professional - Profesional de la Salud
11. minimalist-yellow - Minimalista Amarillo
12. gradient-blue - Gradiente Azul
13. coral-pink - Rosa Coral
14. green-minimal - Verde Minimalista
15. creative-orange - Naranja Creativo
16. classic-sidebar - Barra Lateral Oscura
17. modern-clean - Encabezado Gradiente
18. elegant-minimal - Línea de Tiempo Elegante
19. professional-blue - Azul Profesional
20. creative-modern - Banner Creativo
21. urban - Urbano

📋 IMPACTO:
- Los usuarios FREE solo podrán usar las 3 plantillas gratuitas
- Los usuarios PREMIUM podrán usar todas las 21 plantillas
- Las plantillas se sincronizan automáticamente con el frontend
*/
