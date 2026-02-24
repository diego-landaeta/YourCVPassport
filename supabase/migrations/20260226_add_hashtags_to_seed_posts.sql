-- Add real hashtags to existing seed feed posts so the Trends card picks them up
-- Run this in the Supabase SQL Editor

-- Update posts that mention "trabajo" or "empleo" topics
UPDATE feed_posts SET content = content || E'\n\n#OpenToWork #BúsquedaDeEmpleo'
WHERE id IN (
  SELECT id FROM feed_posts
  WHERE content ILIKE '%trabajo%' AND content NOT LIKE '%#OpenToWork%' AND is_hidden = false
  LIMIT 5
);

-- Update posts about technology
UPDATE feed_posts SET content = content || E'\n\n#Tecnología #Innovación'
WHERE id IN (
  SELECT id FROM feed_posts
  WHERE (content ILIKE '%tecnología%' OR content ILIKE '%technology%' OR content ILIKE '%desarrollo%')
  AND content NOT LIKE '%#Tecnología%' AND is_hidden = false
  LIMIT 5
);

-- Update posts about CV or profile
UPDATE feed_posts SET content = content || E'\n\n#ConsejosCV #DesarrolloProfesional'
WHERE id IN (
  SELECT id FROM feed_posts
  WHERE (content ILIKE '%perfil%' OR content ILIKE '%cv%' OR content ILIKE '%currículum%')
  AND content NOT LIKE '%#ConsejosCV%' AND is_hidden = false
  LIMIT 5
);

-- Update posts about networking or community
UPDATE feed_posts SET content = content || E'\n\n#Networking #Comunidad'
WHERE id IN (
  SELECT id FROM feed_posts
  WHERE (content ILIKE '%comunidad%' OR content ILIKE '%conectar%' OR content ILIKE '%networking%')
  AND content NOT LIKE '%#Networking%' AND is_hidden = false
  LIMIT 5
);

-- Update posts about career milestones
UPDATE feed_posts SET content = content || E'\n\n#Logros #CarreraProfesional'
WHERE id IN (
  SELECT id FROM feed_posts
  WHERE content_type IN ('ACHIEVEMENT', 'MILESTONE')
  AND content NOT LIKE '%#Logros%' AND is_hidden = false
  LIMIT 5
);

-- Remaining posts without hashtags: add general ones
UPDATE feed_posts SET content = content || E'\n\n#YourCVPassport #Profesionales'
WHERE id IN (
  SELECT id FROM feed_posts
  WHERE content !~ '#[A-Za-zÀ-ÿ]'
  AND is_hidden = false AND visibility = 'PUBLIC'
  LIMIT 10
);
