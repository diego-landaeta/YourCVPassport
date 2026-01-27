# Limpieza de Slugs UUID en Perfiles Incompletos

## Fecha
2026-01-09

## Problema

Usuarios existentes que se registraron ANTES del fix de auto-asignación de URLs todavía tienen slugs UUID asignados automáticamente. Estos usuarios:

1. **Tienen slug = UUID** (ej: `43c35220-278d-49ff-a0a8-6b8564667c64`)
2. **NO completaron el wizard** (`template = NULL`)
3. **Dashboard muestra paso 4 como "completado"** cuando en realidad no lo está

## Solución

Migración SQL `20260109_clean_uuid_slugs.sql` que:

1. **Identifica slugs UUID**: Usa regex para detectar slugs con formato UUID válido
2. **Verifica perfiles incompletos**: Solo afecta perfiles con `template = NULL`
3. **Limpia slugs**: Establece `slug = NULL` para forzar que el usuario cree su URL en el wizard

## Query de Limpieza

```sql
UPDATE public.profiles
SET slug = NULL
WHERE
  -- Solo slugs que son UUIDs (formato: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
  slug ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  -- Y no tienen template (no completaron wizard)
  AND template IS NULL;
```

## Casos Afectados

### ✅ SERÁ LIMPIADO
- Usuario con `slug = "43c35220-278d-49ff-a0a8-6b8564667c64"` y `template = NULL`
- Usuario registrado antes del fix, nunca completó wizard
- **Resultado**: `slug` cambia a `NULL`, debe completar wizard para crear URL

### ❌ NO SERÁ AFECTADO
- Usuario con `slug = "javier-torres-desarrollador"` (slug personalizado)
- Usuario con `slug = UUID` pero `template = "passport"` (completó wizard con UUID por alguna razón)
- Usuario con `slug = NULL` (ya está limpio)

## Impacto en Dashboard

### Antes de la Migración
```
✓ Choose template and URL
  ✓ 43c35220-278d-49ff-a0a8-6b8564667c64
```
Dashboard muestra paso como completado incorrectamente.

### Después de la Migración
```
4 Choose template and URL
  Visual design and web address
```
Dashboard muestra paso como incompleto correctamente.

## Ejecución

### Local (Supabase CLI)
```bash
supabase db reset
```

### Producción (Dashboard de Supabase)
1. Ir a SQL Editor en Supabase Dashboard
2. Copiar contenido de `20260109_clean_uuid_slugs.sql`
3. Ejecutar
4. Verificar output: "Limpiados X slugs UUID de perfiles incompletos"

### Verificación Post-Ejecución

```sql
-- Verificar que no quedan slugs UUID en perfiles incompletos
SELECT id, full_name, slug, template
FROM public.profiles
WHERE slug ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  AND template IS NULL;
-- Debe retornar 0 filas
```

## Usuarios Afectados Deben

1. Iniciar sesión
2. Ver dashboard simplificado (paso 4 incompleto)
3. Completar su perfil si falta algo
4. Usar la vista Profile Wizard o Display Settings para crear su URL personalizada
5. El wizard les pedirá que configuren su URL antes de finalizar

## Seguridad

- ✅ Solo afecta perfiles incompletos
- ✅ No toca slugs personalizados
- ✅ No toca usuarios que completaron wizard
- ✅ Operación reversible si es necesario (se puede restaurar desde backup)

## Relacionado

- [URL_AUTO_ASSIGNMENT_FIX.md](./URL_AUTO_ASSIGNMENT_FIX.md) - Fix original que previene auto-asignación en nuevos usuarios
