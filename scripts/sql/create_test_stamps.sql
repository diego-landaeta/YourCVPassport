-- ============================================
-- CREAR STAMPS DE PRUEBA PARA TESTING
-- ============================================
-- Este script crea stamps de diferentes tipos para probar el panel admin

-- IMPORTANTE: Ejecuta esto solo en desarrollo/testing, NUNCA en producción

-- 1. Obtener algunos usuarios para crear stamps de prueba
-- Primero ejecuta esto para ver los usuarios disponibles:
SELECT 
    id,
    full_name,
    email
FROM profiles
ORDER BY created_at DESC
LIMIT 10;

-- 2. REEMPLAZA 'USER_UUID_AQUI' con un ID de usuario real de la consulta anterior
-- Ejemplo de creación de stamps pendientes:

/*
-- IDENTITY stamp PENDING
INSERT INTO stamps (profile_id, type, status, evidence, provider, created_at)
VALUES (
    'USER_UUID_AQUI',
    'IDENTITY',
    'PENDING',
    jsonb_build_object(
        'document_type', 'DNI',
        'document_number', '12345678Z',
        'document_url', 'test/dni_test.jpg',
        'file_name', 'dni_test.jpg',
        'file_type', 'image/jpeg',
        'uploaded_at', NOW()
    ),
    'manual_upload',
    NOW()
);

-- EDUCATION stamp PENDING
INSERT INTO stamps (profile_id, type, status, evidence, provider, created_at)
VALUES (
    'USER_UUID_AQUI',
    'EDUCATION',
    'PENDING',
    jsonb_build_object(
        'institution', 'Universidad Complutense de Madrid',
        'degree', 'Licenciatura en Ingeniería Informática',
        'graduation_year', '2020',
        'document_url', 'test/diploma_test.pdf',
        'file_name', 'diploma.pdf',
        'file_type', 'application/pdf',
        'uploaded_at', NOW()
    ),
    'manual_upload',
    NOW()
);

-- EMPLOYMENT stamp PENDING
INSERT INTO stamps (profile_id, type, status, evidence, provider, created_at)
VALUES (
    'USER_UUID_AQUI',
    'EMPLOYMENT',
    'PENDING',
    jsonb_build_object(
        'company', 'Google Spain',
        'position', 'Software Engineer',
        'reference_contact', 'manager@google.com',
        'document_url', 'test/reference_letter.pdf',
        'file_name', 'reference_letter.pdf',
        'file_type', 'application/pdf',
        'uploaded_at', NOW()
    ),
    'manual_upload',
    NOW()
);

-- CERTIFICATION stamp VERIFIED (ejemplo)
INSERT INTO stamps (profile_id, type, status, evidence, provider, verified_at, created_at)
VALUES (
    'USER_UUID_AQUI',
    'CERTIFICATION',
    'VERIFIED',
    jsonb_build_object(
        'name', 'AWS Certified Solutions Architect',
        'issuer', 'Amazon Web Services',
        'issue_date', '2023-01-15',
        'credential_id', 'AWS-CSA-123456',
        'document_url', 'test/aws_cert.pdf',
        'file_name', 'aws_certification.pdf',
        'file_type', 'application/pdf',
        'uploaded_at', NOW()
    ),
    'aws',
    NOW(),
    NOW() - INTERVAL '7 days'
);
*/

-- 3. Verificar que se crearon correctamente
SELECT 
    s.id,
    p.full_name,
    s.type,
    s.status,
    s.created_at
FROM stamps s
JOIN profiles p ON p.id = s.profile_id
ORDER BY s.created_at DESC
LIMIT 10;
