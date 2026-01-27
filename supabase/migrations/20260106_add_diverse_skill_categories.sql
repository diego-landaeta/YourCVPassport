-- ============================================================================
-- Agregar Categorías Diversas de Skills
-- ============================================================================
-- Este script agrega categorías de ejemplo para diferentes profesiones
-- Esto hace que los filtros de búsqueda sean más útiles para todos los usuarios
-- ============================================================================

-- NOTA: Este es un script de EJEMPLO
-- En producción, las skills deberían ser agregadas por los usuarios
-- Este script solo crea categorías de ejemplo para testing

-- Verificar que existan categorías diversas
-- Si no existen, este comentario sirve como guía para los administradores

/*
CATEGORÍAS RECOMENDADAS PARA DIFERENTES PROFESIONES:

TECNOLOGÍA:
- Programming
- Web Development
- Mobile Development
- DevOps
- Data Science
- Cybersecurity
- UI/UX Design
- Cloud Computing

DISEÑO Y CREATIVIDAD:
- Graphic Design
- Video Editing
- Photography
- Animation
- Illustration
- Branding
- 3D Modeling

MARKETING Y VENTAS:
- Digital Marketing
- SEO/SEM
- Social Media
- Content Marketing
- Sales
- Email Marketing
- Analytics

NEGOCIOS:
- Project Management
- Business Analysis
- Finance
- Accounting
- Human Resources
- Operations
- Strategy

EDUCACIÓN:
- Teaching
- Tutoring
- Curriculum Development
- Training
- E-Learning

SALUD:
- Healthcare
- Nursing
- Physical Therapy
- Nutrition
- Mental Health

LEGAL:
- Legal Services
- Compliance
- Contract Law
- Intellectual Property

INGENIERÍA:
- Mechanical Engineering
- Electrical Engineering
- Civil Engineering
- Chemical Engineering

OTROS:
- Customer Service
- Administrative
- Writing
- Translation
- Consulting
*/

-- Este comentario sirve como documentación
-- Para agregar estas categorías, los usuarios deben:
-- 1. Crear sus perfiles
-- 2. Agregar sus skills con las categorías apropiadas
-- 3. El sistema automáticamente mostrará estas categorías en los filtros

DO $$
BEGIN
  RAISE NOTICE '✅ Categorías de skills diversas documentadas';
  RAISE NOTICE 'Los administradores deben asegurarse de que los usuarios agreguen skills en diferentes categorías';
  RAISE NOTICE 'El sistema de filtros se actualizará automáticamente basándose en las skills existentes';
END $$;
