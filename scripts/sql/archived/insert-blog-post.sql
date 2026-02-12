-- Insert sample blog post
-- PASO 1: Primero obtén tu user_id ejecutando esta query:
SELECT id, email FROM auth.users LIMIT 5;

-- PASO 2: Copia tu user_id de arriba y reemplázalo en 'YOUR_USER_ID_AQUI' abajo
-- Luego ejecuta el INSERT:

INSERT INTO blog_posts (
  user_id,
  title,
  slug,
  summary,
  content,
  image_url,
  author_name,
  author_image_url,
  author_username,
  category,
  is_featured,
  published_at,
  meta_title,
  meta_description,
  created_at,
  updated_at
) VALUES (
  'YOUR_USER_ID_AQUI'::uuid, -- REEMPLAZA 'YOUR_USER_ID_AQUI' con tu ID de usuario
  'Cómo Crear un CV Profesional que Destaque en 2025',
  'como-crear-cv-profesional-2025',
  'Descubre las mejores prácticas y estrategias para crear un currículum vitae que capture la atención de los reclutadores y te ayude a conseguir tu trabajo soñado en 2025.',
  '<h2>Introducción</h2>
<p>En el competitivo mercado laboral actual, tener un CV bien diseñado y optimizado es más importante que nunca. En este artículo, exploraremos las claves para crear un currículum que destaque entre cientos de candidatos.</p>

<h2>1. El Formato Correcto</h2>
<p>El formato de tu CV debe ser limpio, profesional y fácil de leer. Considera estos elementos:</p>
<ul>
  <li><strong>Diseño minimalista:</strong> Evita diseños recargados que distraigan del contenido</li>
  <li><strong>Tipografía legible:</strong> Usa fuentes profesionales como Arial, Helvetica o Calibri</li>
  <li><strong>Espaciado adecuado:</strong> Deja suficiente espacio en blanco para facilitar la lectura</li>
  <li><strong>Secciones claras:</strong> Organiza tu información en bloques bien definidos</li>
</ul>

<h2>2. Contenido que Impacta</h2>
<p>El contenido es el corazón de tu CV. Asegúrate de incluir:</p>
<ul>
  <li><strong>Experiencia relevante:</strong> Enfócate en logros cuantificables</li>
  <li><strong>Habilidades técnicas:</strong> Lista las tecnologías y herramientas que dominas</li>
  <li><strong>Educación:</strong> Incluye títulos, certificaciones y cursos relevantes</li>
  <li><strong>Proyectos destacados:</strong> Muestra tu trabajo con ejemplos concretos</li>
</ul>

<h2>3. Optimización para ATS</h2>
<p>Los sistemas de seguimiento de candidatos (ATS) son utilizados por el 90% de las empresas. Para pasar estos filtros:</p>
<ul>
  <li>Usa palabras clave del anuncio de trabajo</li>
  <li>Evita tablas y gráficos complejos</li>
  <li>Usa un formato estándar (.pdf o .docx)</li>
  <li>Incluye secciones con títulos claros</li>
</ul>

<h2>4. Personalización es Clave</h2>
<p>No envíes el mismo CV a todas las ofertas. Personaliza tu currículum para cada posición:</p>
<ul>
  <li>Adapta tu resumen profesional al puesto</li>
  <li>Destaca la experiencia más relevante</li>
  <li>Usa el lenguaje de la empresa</li>
  <li>Alinea tus habilidades con los requisitos</li>
</ul>

<h2>Conclusión</h2>
<p>Crear un CV profesional requiere tiempo y dedicación, pero la inversión vale la pena. Con YourCVPassport, puedes crear currículums optimizados que te ayudarán a destacar y conseguir más entrevistas.</p>

<p><strong>¿Listo para crear tu CV profesional?</strong> <a href="/signup">Regístrate gratis</a> y comienza a construir tu futuro profesional hoy mismo.</p>',
  'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=1200&h=630&fit=crop',
  'Equipo YourCVPassport',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
  'yourcvpassport',
  'Guías y Tutoriales',
  true,
  NOW(),
  'Cómo Crear un CV Profesional que Destaque en 2025 | YourCVPassport',
  'Descubre las mejores prácticas para crear un currículum vitae profesional que capture la atención de reclutadores. Guía completa con tips y estrategias probadas.',
  NOW(),
  NOW()
);

-- PASO 3: Verifica que se insertó correctamente
SELECT id, title, slug, category, is_featured, published_at, user_id
FROM blog_posts
WHERE slug = 'como-crear-cv-profesional-2025';
