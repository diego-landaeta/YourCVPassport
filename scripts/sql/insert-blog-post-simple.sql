-- Script simplificado para insertar artículo de blog
-- Solo título, imagen, fecha y contenido (sin autor)
-- Ejecutar en Supabase SQL Editor mientras estés logueado como admin

-- PASO 1: Primero obtén tu user_id
SELECT id, email FROM auth.users LIMIT 5;

-- PASO 2: Copia tu user_id y reemplázalo abajo en 'TU_USER_ID_AQUI'

INSERT INTO blog_posts (
  user_id,
  title,
  slug,
  summary,
  content,
  image_url,
  category,
  is_featured,
  published_at,
  meta_title,
  meta_description,
  created_at,
  updated_at
) VALUES (
  'TU_USER_ID_AQUI'::uuid,
  'Cómo Crear un CV Profesional que Destaque en 2025',
  'como-crear-cv-profesional-2025',
  'Descubre las mejores prácticas y estrategias para crear un currículum vitae que capture la atención de los reclutadores.',
  '<h2>Introducción</h2>
<p>En el competitivo mercado laboral actual, tener un CV bien diseñado y optimizado es más importante que nunca.</p>

<h2>1. El Formato Correcto</h2>
<p>El formato de tu CV debe ser limpio, profesional y fácil de leer:</p>
<ul>
  <li><strong>Diseño minimalista:</strong> Evita diseños recargados</li>
  <li><strong>Tipografía legible:</strong> Usa fuentes profesionales</li>
  <li><strong>Espaciado adecuado:</strong> Deja espacio en blanco</li>
  <li><strong>Secciones claras:</strong> Organiza la información</li>
</ul>

<h2>2. Contenido que Impacta</h2>
<p>El contenido es el corazón de tu CV:</p>
<ul>
  <li><strong>Experiencia relevante:</strong> Enfócate en logros cuantificables</li>
  <li><strong>Habilidades técnicas:</strong> Lista las tecnologías que dominas</li>
  <li><strong>Educación:</strong> Incluye títulos y certificaciones</li>
  <li><strong>Proyectos destacados:</strong> Muestra tu trabajo</li>
</ul>

<h2>3. Optimización para ATS</h2>
<p>El 90% de las empresas usan sistemas ATS:</p>
<ul>
  <li>Usa palabras clave del anuncio</li>
  <li>Evita tablas y gráficos complejos</li>
  <li>Usa formato estándar (.pdf o .docx)</li>
  <li>Incluye secciones con títulos claros</li>
</ul>

<h2>Conclusión</h2>
<p>Con YourCVPassport, puedes crear currículums optimizados que te ayudarán a destacar y conseguir más entrevistas.</p>',
  'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=1200&h=630&fit=crop',
  'Guías y Tutoriales',
  true,
  NOW(),
  'Cómo Crear un CV Profesional que Destaque en 2025 | YourCVPassport',
  'Guía completa para crear un currículum vitae profesional que capture la atención de reclutadores.',
  NOW(),
  NOW()
);

-- PASO 3: Verifica la inserción
SELECT id, title, slug, image_url, published_at
FROM blog_posts
WHERE slug = 'como-crear-cv-profesional-2025';
