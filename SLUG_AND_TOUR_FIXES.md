# Correcciones: URL Personalizado y Tour del Dashboard

## Problemas Resueltos

### 1. ❌ URL personalizado no funciona (Error 400 de Supabase)
**Causa:** El campo `updated_at` que se estaba enviando en la actualización podría no existir en la tabla `profiles` o estar causando conflictos.

**Solución:** Se eliminó el campo `updated_at` de las actualizaciones del slug en:
- `components/profile-editor/FinalizationStep.tsx` (línea 251-258)
- `components/dashboard/DashboardContent.tsx` (línea 273-276)

### 2. ❌ El tour no se muestra después de completar el wizard
**Causa:** El modal de bienvenida se mostraba cuando `profileCompleteness < 100%`, bloqueando el tour. La referencia `welcomeShownRef.current` nunca se reseteaba cuando el perfil se completaba.

**Solución:** Se modificó la lógica en `components/dashboard/ModernDashboardView.tsx`:
- Ahora el modal de bienvenida se oculta si `showTour` está activo
- Se resetea `welcomeShownRef.current = false` cuando el perfil está completo o el tour está activo
- Se agregó `showTour` a las dependencias del useEffect

## Migración de Base de Datos Requerida

**IMPORTANTE:** Para que el URL personalizado funcione, necesitas ejecutar la migración que agrega las columnas `slug` y `template` a la tabla `profiles`.

### Opción 1: Ejecutar migración en Supabase Dashboard (Recomendado)

1. Ve a tu proyecto en Supabase: https://supabase.com/dashboard/project/djehzlzombqrzzuchcef
2. Haz clic en "SQL Editor" en el menú lateral
3. Crea una nueva query
4. Copia y pega el contenido del archivo: `supabase/migrations/20251128_add_slug_template_fields.sql`
5. Ejecuta la query

### Opción 2: Usar Supabase CLI

```bash
# Asegúrate de tener Docker Desktop corriendo
npx supabase start

# Enlaza tu proyecto (solo la primera vez)
npx supabase link --project-ref djehzlzombqrzzuchcef

# Aplica las migraciones
npx supabase db push
```

## Archivos Modificados

### 1. `components/profile-editor/FinalizationStep.tsx`
- **Línea 251-258:** Eliminado `updated_at` del update
- **Antes:**
  ```typescript
  .update({
    template: selectedTemplate,
    slug: customSlug,
    updated_at: new Date().toISOString(),
  })
  ```
- **Después:**
  ```typescript
  .update({
    template: selectedTemplate,
    slug: customSlug,
  })
  ```

### 2. `components/dashboard/DashboardContent.tsx`
- **Línea 273-276:** Eliminado `updated_at` del update
- **Antes:**
  ```typescript
  .update({ slug: generatedSlug, updated_at: new Date().toISOString() })
  ```
- **Después:**
  ```typescript
  .update({ slug: generatedSlug })
  ```

### 3. `components/dashboard/ModernDashboardView.tsx`
- **Líneas 84-98:** Modificada lógica del modal de bienvenida
- **Cambios:**
  - Agregado `|| showTour` a la condición que oculta el modal
  - Agregado `welcomeShownRef.current = false` cuando el perfil está completo o tour activo
  - Agregado `showTour` a las dependencias del useEffect

### 4. `supabase/migrations/20251128_add_slug_template_fields.sql` (NUEVO)
- Migración que agrega las columnas `slug` y `template` si no existen
- Agrega índice para `slug` para búsquedas rápidas
- Configura RLS (Row Level Security) para la tabla profiles
- Permite actualizar y ver perfiles propios
- Permite ver perfiles públicos por slug

## Pruebas Requeridas

1. **Prueba del Slug:**
   - Completa el wizard hasta el paso de Finalización
   - Verifica que el slug se genera correctamente
   - Haz clic en "Guardar y Finalizar"
   - Verifica que NO aparezcan errores 400 en la consola
   - Verifica que el URL funciona: `http://localhost:3000/cv/tu-slug-generado`

2. **Prueba del Tour:**
   - Completa todo el wizard
   - Después de finalizar, deberías navegar automáticamente al dashboard
   - Después de 1 segundo, el tour del dashboard debería iniciarse automáticamente
   - El modal de bienvenida NO debe aparecer si el tour está activo

## Logs de Depuración

Los logs de consola te ayudarán a verificar que todo funciona:

```
✅ Logs esperados en consola:
🔵 Guardando slug: angel-molina-desarrollador-web-construccion para usuario: [user-id]
✅ Slug guardado exitosamente: [data]
✅ Profile refetched
[Dashboard Tour] Mostrando tour para usuario: [user-id]
```

## Posibles Problemas

### Si el slug sigue sin guardarse:
1. Verifica que ejecutaste la migración correctamente
2. Revisa los logs de consola para ver el error específico
3. Verifica en Supabase Dashboard → Table Editor → profiles que las columnas `slug` y `template` existen

### Si el tour no aparece:
1. Limpia localStorage: `localStorage.removeItem('dashboardTourCompleted_[tu-user-id]')`
2. Verifica que `profileCompleteness` sea >= 100% en los datos del dashboard
3. Revisa que no haya errores en la consola

## Próximos Pasos

1. ✅ Ejecutar la migración de base de datos
2. ✅ Probar el flujo completo: wizard → finalización → slug guardado → tour
3. ✅ Verificar que el CV sea accesible en la URL personalizada
4. ✅ Eliminar los console.log de depuración en producción
