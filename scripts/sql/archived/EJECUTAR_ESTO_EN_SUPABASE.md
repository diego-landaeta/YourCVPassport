# ⚡ SOLUCIÓN RÁPIDA - Skills No Aparecen

## El Problema
Las skills no se muestran en `/companies/search` porque la política RLS (Row Level Security) está bloqueando el acceso.

## La Solución (2 pasos)

### Paso 1: Ejecutar en Supabase SQL Editor

Abre Supabase → SQL Editor y copia/pega TODO el contenido de este archivo:

**📁 Archivo:** `supabase/migrations/20260126_fix_skills_rls_correct.sql`

O copia esto directamente:

```sql
-- Fix skills RLS policy to match talent search visibility logic
-- Skills should be visible for profiles that appear in talent search:
-- - Have full_name and headline
-- - Are not admin users

-- Drop the old restrictive policies
DROP POLICY IF EXISTS "Public can view skills of public profiles" ON public.skills;

-- Create a policy that matches the talent search logic
-- Skills are viewable if the profile has basic info and isn't an admin
CREATE POLICY "Public can view skills of searchable profiles"
    ON public.skills FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = skills.profile_id
            AND profiles.full_name IS NOT NULL
            AND profiles.full_name != ''
            AND profiles.headline IS NOT NULL
            AND profiles.headline != ''
            AND profiles.role != 'admin'
        )
    );

-- Apply the same fix to languages table
DROP POLICY IF EXISTS "Public can view languages of public profiles" ON public.languages;

CREATE POLICY "Public can view languages of searchable profiles"
    ON public.languages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = languages.profile_id
            AND profiles.full_name IS NOT NULL
            AND profiles.full_name != ''
            AND profiles.headline IS NOT NULL
            AND profiles.headline != ''
            AND profiles.role != 'admin'
        )
    );
```

Click **Run** (Ejecutar) ✅

### Paso 2: Probar

1. Recarga la página `/companies/search`
2. Abre la consola del navegador (F12)
3. Busca estos logs:
   - `🔍 Skills Query Result:` - debería mostrar skillsCount > 0
   - `📊 Skills Map:` - debería mostrar las skills por perfil
4. Los perfiles ahora deberían mostrar:
   - Las primeras 3 skills
   - Un contador "+N" si hay más de 3 skills

## ¿Qué hace esta migración?

Cambia la política RLS de:
- ❌ **ANTES:** Solo mostrar skills si `slug IS NOT NULL` (muy restrictivo)
- ✅ **DESPUÉS:** Mostrar skills si el perfil tiene `full_name` y `headline` (igual que la búsqueda)

Esto hace que las skills sean visibles para los mismos perfiles que aparecen en la búsqueda de talentos.

## Si todavía no funciona

Ejecuta este script de diagnóstico en Supabase para verificar:

```
scripts/sql/diagnose-skills-rls-complete.sql
```

O revisa la documentación completa:

```
scripts/sql/FIX_SKILLS_NOT_SHOWING.md
```
