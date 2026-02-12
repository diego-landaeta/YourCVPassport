-- =====================================================
-- ELIMINAR OFERTAS DE TRABAJO DE PRUEBA
-- =====================================================
-- Este script elimina ofertas de trabajo con datos de prueba
-- como empresas llamadas "asdasdasd"

-- Primero veamos qué vamos a eliminar
SELECT
    jp.id,
    jp.title,
    c.company_name,
    jp.created_at
FROM job_postings jp
JOIN companies c ON c.id = jp.company_id
WHERE
    c.company_name ILIKE '%asdasdasd%'
    OR c.company_name ILIKE '%test%'
    OR jp.title ILIKE '%test%';

-- Eliminar las ofertas de trabajo de empresas de prueba
-- (Las aplicaciones, vistas y preguntas se eliminan automáticamente por CASCADE)
DELETE FROM job_postings
WHERE company_id IN (
    SELECT id FROM companies
    WHERE company_name ILIKE '%asdasdasd%'
);

-- Opcionalmente, eliminar también las empresas de prueba
-- (Descomentar si también quieres eliminar la empresa)
-- DELETE FROM companies WHERE company_name ILIKE '%asdasdasd%';

-- Verificar que se eliminaron
SELECT
    COUNT(*) as remaining_test_jobs
FROM job_postings jp
JOIN companies c ON c.id = jp.company_id
WHERE c.company_name ILIKE '%asdasdasd%';