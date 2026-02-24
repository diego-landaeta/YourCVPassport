-- Add cover images and avatars to existing seed groups/channels
-- Using high-quality Unsplash images that match each group's theme

-- ── GROUPS ─────────────────────────────────────────────────────────────────

-- Tutors & Mentors Pro
UPDATE public.groups
SET
  cover_url  = 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80',
  avatar_url = 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=200&q=80'
WHERE slug = 'tutors-mentors-pro' OR name = 'Tutors & Mentors Pro';

-- Devs & Conscious Tech
UPDATE public.groups
SET
  cover_url  = 'https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?w=800&q=80',
  avatar_url = 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=200&q=80'
WHERE slug = 'devs-conscious-tech' OR name = 'Devs & Conscious Tech';

-- Salud & Bienestar Holístico
UPDATE public.groups
SET
  cover_url  = 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80',
  avatar_url = 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=200&q=80'
WHERE slug = 'salud-bienestar-holistico' OR name = 'Salud & Bienestar Holístico';

-- Remote Work & Digital Nomads (if it exists)
UPDATE public.groups
SET
  cover_url  = 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80',
  avatar_url = 'https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=200&q=80'
WHERE slug LIKE '%remote%' OR name LIKE '%Remote%' OR name LIKE '%Digital Nomad%';

-- ── CHANNELS ───────────────────────────────────────────────────────────────

-- Novedades YourCVPassport
UPDATE public.groups
SET
  cover_url  = 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=800&q=80',
  avatar_url = 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=200&q=80'
WHERE slug = 'novedades-yourcvpassport' OR name LIKE '%Novedades%YourCVPassport%' OR name LIKE '%Novedades%CVPassport%';

-- AI at Work 2026
UPDATE public.groups
SET
  cover_url  = 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80',
  avatar_url = 'https://images.unsplash.com/photo-1676299081847-824916de030a?w=200&q=80'
WHERE slug = 'ai-at-work-2026' OR name LIKE '%AI at Work%';

-- Oportunidades & Reconversión Latam
UPDATE public.groups
SET
  cover_url  = 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=80',
  avatar_url = 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=200&q=80'
WHERE slug LIKE '%oportunidades%' OR name LIKE '%Oportunidades%Latam%';
