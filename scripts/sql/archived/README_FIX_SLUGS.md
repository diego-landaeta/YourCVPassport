# Fix de Asignación Automática de Slugs - Guía Rápida

## Problema
Los usuarios reciben URLs automáticamente al registrarse en lugar de crearlas en el wizard de finalización.

## Solución

### Paso 1: Ejecutar en Supabase Dashboard

1. Ir a **Supabase Dashboard** > **SQL Editor**
2. Copiar y pegar el contenido COMPLETO de uno de estos archivos:
   - `supabase/migrations/20260109_fix_all_slug_sources_final.sql` (migración completa)
   - `scripts/sql/EJECUTAR_ESTE_FIX_FINAL.sql` (con más verificaciones)
3. Click en **Run**

### Paso 2: Verificar Resultados

Después de ejecutar el SQL, deberías ver:
- ✅ Función `on_profiles_created_sync_email` actualizada
- ✅ Trigger `prevent_auto_slug_trigger` creado y habilitado
- ✅ Slugs auto-generados limpiados
- ✅ Listado de triggers activos en la tabla profiles

### Paso 3: Crear Usuario de Prueba

1. Registrar un nuevo usuario en la aplicación
2. Ir a Supabase Dashboard > Table Editor > profiles
3. Buscar el usuario recién creado
4. **Verificar que `slug = NULL`** ✅

Si el slug es NULL, el fix funcionó correctamente.

### Paso 4: Verificar Flujo Completo

1. Como el usuario de prueba, completar el wizard de perfil:
   - Paso 1: Identidad (nombre, email, etc.)
   - Paso 2: Experiencia (mínimo 1 experiencia)
   - Paso 3: Habilidades (mínimo 3 habilidades)
   - Paso 4: Finalización - Aquí el usuario CREA su URL personalizada
2. En el paso 4, ingresar URL personalizada: `mi-nombre-profesion`
3. Finalizar wizard
4. Verificar en base de datos que `slug = "mi-nombre-profesion"`

## Causas que se Corrigieron

1. **AuthContext.tsx** - Asignaba `slug = user.id` en registro
2. **DashboardContent.tsx** - Auto-generaba slugs cuando detectaba NULL
3. **Trigger on_profiles_created_sync_email** - Asignaba `slug = 'user-' + UUID` en AFTER INSERT

## Archivos Modificados

### Código de Aplicación
- [contexts/AuthContext.tsx](../../contexts/AuthContext.tsx)
- [components/dashboard/DashboardContent.tsx](../../components/dashboard/DashboardContent.tsx)

### Base de Datos
- [supabase/migrations/20260109_fix_all_slug_sources_final.sql](../../supabase/migrations/20260109_fix_all_slug_sources_final.sql)

### Documentación
- [docs/changelog/URL_AUTO_ASSIGNMENT_FIX.md](../../docs/changelog/URL_AUTO_ASSIGNMENT_FIX.md)

## Soporte

Si después de ejecutar el SQL los usuarios siguen recibiendo slugs automáticos:

1. Verificar que el trigger `prevent_auto_slug_trigger` está habilitado:
```sql
SELECT tgname, tgenabled
FROM pg_trigger
WHERE tgname = 'prevent_auto_slug_trigger';
-- Debe mostrar: tgenabled = 'O' (enabled)
```

2. Verificar que la función `on_profiles_created_sync_email` NO asigna slug:
```sql
SELECT pg_get_functiondef(p.oid)
FROM pg_proc p
WHERE p.proname = 'on_profiles_created_sync_email';
-- NO debe contener: slug = COALESCE(...)
```

3. Revisar el log de Supabase Dashboard > Logs para ver si hay errores en los triggers
