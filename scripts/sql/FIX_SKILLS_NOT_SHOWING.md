# 🔧 FIX: Skills No Aparecen en Búsqueda de Talentos

## Problema Identificado

Las skills no aparecen en la página de búsqueda de talentos (`/companies/search`) aunque existen en la base de datos.

### Causa Raíz

La política RLS (Row Level Security) en la tabla `skills` está configurada incorrectamente:

```sql
-- POLÍTICA ACTUAL (INCORRECTA)
CREATE POLICY "Public can view skills of public profiles"
    ON public.skills FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = skills.profile_id
            AND profiles.slug IS NOT NULL  -- ❌ DEMASIADO RESTRICTIVO
        )
    );
```

**El problema:** La política solo permite ver skills si el perfil tiene `slug IS NOT NULL`. Pero:
1. Muchos perfiles de prueba no tienen slug asignado
2. El slug puede ser NULL incluso si el perfil aparece en búsqueda
3. La búsqueda de talentos muestra perfiles con `full_name` y `headline`, NO basándose en slug
4. **IMPORTANTE:** La tabla `profiles` NO tiene una columna `is_public` - esto fue el error inicial

## Solución

### Paso 1: Ejecutar la migración correcta

Ejecuta este archivo en el SQL Editor de Supabase:

```
supabase/migrations/20260126_fix_skills_rls_correct.sql
```

Esta migración cambia la política para coincidir con la lógica de búsqueda de talentos:

```sql
-- NUEVA POLÍTICA (CORRECTA)
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
```

Esta política coincide exactamente con los filtros usados en `CompanyTalentSearchPage.tsx`.

### Paso 2: Verificar perfiles

Ejecuta este script para verificar qué perfiles tienen skills:

```
scripts/sql/verify-public-profiles-skills.sql
```

Este script ahora usa los campos correctos (full_name, headline) en lugar de is_public.

### Paso 3: Verificar el fix

1. Recarga la página de búsqueda de talentos
2. Abre la consola del navegador (F12)
3. Busca los logs:
   ```
   🔍 Skills Query Result: { ... }
   📊 Skills Map: [ ... ]
   ```
4. Verifica que `skillsCount` sea > 0
5. Verifica que los perfiles muestren todas sus skills con el contador +N

## Scripts de Diagnóstico

### 1. Verificar políticas RLS actuales
```bash
scripts/sql/check-skills-rls.sql
```

### 2. Diagnóstico completo
```bash
scripts/sql/diagnose-skills-rls-complete.sql
```

### 3. Verificar perfiles públicos
```bash
scripts/sql/verify-public-profiles-skills.sql
```

## Resultado Esperado

Después del fix:
- ✅ Las skills se cargan correctamente desde la base de datos
- ✅ Los perfiles muestran las primeras 3 skills
- ✅ Aparece el contador "+N" cuando hay más de 3 skills
- ✅ El tiempo de carga es óptimo (< 1 segundo)

## Notas Técnicas

- La tabla `languages` tiene el mismo problema y se corrige en la misma migración
- La política permite que cualquier usuario (incluyendo anónimos y empresas) vean skills de perfiles públicos
- Los usuarios siguen pudiendo ver solo sus propias skills con la política `"Users can view their own skills"`
