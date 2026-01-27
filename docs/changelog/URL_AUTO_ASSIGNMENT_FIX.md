# Fix: Prevención de Asignación Automática de URL en Registro

## Fecha
2026-01-09

## Problema Crítico

Los usuarios estaban recibiendo URLs automáticamente asignadas al momento del registro, violando el flujo de trabajo previsto donde los usuarios deben crear su URL personalizada ÚNICAMENTE al finalizar el wizard de perfil.

### Síntomas Observados

1. **Usuario recién registrado recibe slug UUID**: `43c35220-278d-49ff-a0a8-6b8564667c64`
2. **Usuario recién registrado recibe slug genérico**: `user-1a8af2d5`
3. **Dashboard marca paso 4 como completado** cuando el usuario no ha elegido su URL
4. **Usuarios no pueden personalizar su URL** porque ya tienen una asignada

### Comportamiento Incorrecto
- ❌ Usuario se registra → Se le asigna automáticamente `slug = user.id` (UUID)
- ❌ Usuario completa wizard → Ya tiene URL asignada sin haberla personalizado
- ❌ URL en formato UUID en lugar de formato legible

### Comportamiento Correcto
- ✅ Usuario se registra → `slug = NULL`
- ✅ Usuario completa pasos 1-3 del wizard → `slug = NULL`
- ✅ Usuario llega a paso 4 (Finalización) → crea su URL personalizada
- ✅ Usuario puede cambiar su URL cada 3 meses vía Display Settings

## Causas Raíz Identificadas

Se encontraron **TRES fuentes** de asignación automática de slugs:

### Causa 1: AuthContext.tsx - Asignación en Creación de Perfil

El bug estaba en [contexts/AuthContext.tsx:124](../contexts/AuthContext.tsx#L124), en la función `fetchProfile`:

```typescript
// ❌ CÓDIGO ANTERIOR (INCORRECTO):
if (error && error.code === 'PGRST116') {
  const { data: newProfile, error: insertError } = await supabase
    .from('profiles')
    .insert({
      id: user.id,
      full_name: user.user_metadata?.full_name || user.email,
      slug: user.id, // ❌ Auto-asigna UUID como slug
    })
    .select()
    .single();
}
```

**Impacto**: TODOS los usuarios nuevos recibían su UUID como slug al registrarse.

### Causa 2: DashboardContent.tsx - Regeneración Automática

**Ubicación**: [components/dashboard/DashboardContent.tsx:442-534](../components/dashboard/DashboardContent.tsx#L442-L534)

**Código Problemático**:
```typescript
const checkAndUpdateSlug = async () => {
  // Verificaba si el slug era NULL, UUID, o con sufijo timestamp
  const shouldRegenerateSlug = !profile.slug ||
                               profile.slug.match(/-\d{6}$/) ||
                               profile.slug === profile.id ||
                               profile.slug.startsWith('user-');

  if (shouldRegenerateSlug && profile.full_name && profile.headline) {
    // ❌ AUTO-GENERABA slug con formato: nombre-apellido-profesion-timestamp
    const newSlug = generateSlugFromProfile(profile);
    // Guardaba en la base de datos sin consentimiento del usuario
  }
};
```

**Impacto**: Incluso después de corregir AuthContext, el dashboard regeneraba slugs automáticamente al detectar `slug = NULL`.

### Causa 3: Database Trigger - on_profiles_created_sync_email (LA CAUSA RAÍZ PRINCIPAL)

**Ubicación**: Trigger creado directamente en Supabase (no en archivos de migración)

**Código Problemático**:
```sql
CREATE OR REPLACE FUNCTION public.on_profiles_created_sync_email()
RETURNS trigger AS $$
BEGIN
  IF NEW.id IS NOT NULL THEN
    UPDATE profiles
    SET email = (SELECT email FROM auth.users WHERE id = NEW.id LIMIT 1),
        -- ❌ ESTA ERA LA CAUSA PRINCIPAL
        slug = COALESCE(NEW.slug, 'user-' || substring(NEW.id::text from 1 for 8))
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- El trigger se ejecuta AFTER INSERT
CREATE TRIGGER on_profiles_created_sync_email
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION on_profiles_created_sync_email();
```

**Por Qué Era Tan Difícil de Detectar**:
- Este trigger se ejecuta DESPUÉS del INSERT (AFTER INSERT)
- Realiza un UPDATE adicional que establece el slug
- Como es AFTER INSERT, nuestro trigger BEFORE INSERT no podía interceptarlo
- El UPDATE también activaba nuestro BEFORE UPDATE trigger, pero el patrón no lo detectaba correctamente
- No estaba en los archivos de migración, fue creado directamente en Supabase

**Impacto**: TODOS los usuarios nuevos recibían slugs con formato `user-[8 caracteres hex]` sin importar las correcciones en AuthContext o DashboardContent.

## Soluciones Implementadas

### Fix 1: AuthContext.tsx - Remover Asignación Inicial

**Archivo**: [contexts/AuthContext.tsx:118-128](../contexts/AuthContext.tsx#L118-L128)

```typescript
// ✅ CÓDIGO NUEVO (CORRECTO):
if (error && error.code === 'PGRST116') {
  const { data: newProfile, error: insertError } = await supabase
    .from('profiles')
    .insert({
      id: user.id,
      full_name: user.user_metadata?.full_name || user.email,
      // ❌ REMOVED: slug assignment - users must create their URL in finalization step
      // Previously: slug: user.id, which auto-assigned a UUID
    })
    .select()
    .single();
}
```

### Fix 2: DashboardContent.tsx - Deshabilitar Regeneración

**Archivo**: [components/dashboard/DashboardContent.tsx:442-471](../components/dashboard/DashboardContent.tsx#L442-L471)

**Cambio**:
```typescript
const checkAndUpdateSlug = async () => {
  // ✅ DESHABILITADO: Auto-generación de slugs removida
  // Los usuarios deben crear su URL explícitamente en el wizard de finalización
  // Se mantiene esta función por compatibilidad hacia atrás pero no hace nada
  return;

  /* CÓDIGO ORIGINAL COMENTADO - NO AUTO-GENERAR SLUGS
  [Todo el código de auto-generación comentado]
  */
};
```

### Fix 3: Database Trigger - on_profiles_created_sync_email

**Causa Raíz CRÍTICA**: El trigger `on_profiles_created_sync_email` (AFTER INSERT) ejecutaba un UPDATE que asignaba:
```sql
slug = COALESCE(NEW.slug, 'user-' || substring(NEW.id::text from 1 for 8))
```

Este UPDATE ocurría DESPUÉS del INSERT, por lo que nuestro trigger BEFORE INSERT no lo podía interceptar.

**Solución**: Modificar la función del trigger para que SOLO sincronice el email, sin tocar el slug:

```sql
CREATE OR REPLACE FUNCTION public.on_profiles_created_sync_email()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Solo sincronizar el email, NO tocar el slug
  IF NEW.id IS NOT NULL THEN
    UPDATE profiles
    SET email = (SELECT email FROM auth.users WHERE id = NEW.id LIMIT 1)
    -- ❌ REMOVIDO: slug = COALESCE(NEW.slug, 'user-' || substring(NEW.id::text from 1 for 8))
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$function$;
```

### Fix 4: FinalizationStep.tsx - URL Customization Intacta

**Archivo**: [components/profile-editor/FinalizationStep.tsx](../components/profile-editor/FinalizationStep.tsx#L243-L268)

**Verificación**: La funcionalidad de creación de URL personalizada en el paso de finalización está CORRECTAMENTE implementada y NO fue modificada.

```typescript
// ✅ Validate slug before saving
if (!customSlug || customSlug.length < 3) {
  toast.error('La URL debe tener al menos 3 caracteres');
  return;
}

const isValid = await validateSlug(customSlug);
if (!isValid) {
  toast.error('Esta URL ya está en uso. Por favor elige otra.');
  return;
}

// ✅ Save template AND slug - this is where users create their URL for the first time
const { error } = await supabase
  .from('profiles')
  .update({
    template: selectedTemplate,
    slug: customSlug,
    last_slug_changed_at: new Date().toISOString(),
  })
  .eq('id', session.user.id);
```

### Fix 5: Protección a Nivel de Base de Datos

**Archivos de Migración**:

#### a) Limpieza de Datos Existentes

**Archivo**: [supabase/migrations/20260109_clean_uuid_slugs.sql](../supabase/migrations/20260109_clean_uuid_slugs.sql)

```sql
-- Limpia slugs UUID de perfiles incompletos
UPDATE public.profiles
SET slug = NULL
WHERE
  -- Solo slugs que son UUIDs (formato: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
  slug ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  -- Y no tienen template (no completaron wizard)
  AND template IS NULL;
```

**Propósito**: Limpia datos incorrectos de usuarios que ya fueron afectados por el bug.

#### b) Prevención de Futuros Auto-Assignments

**Archivo**: [supabase/migrations/20260109_prevent_auto_slug_assignment.sql](../supabase/migrations/20260109_prevent_auto_slug_assignment.sql)

```sql
-- Función que intercepta INSERTs y previene slugs UUID
CREATE OR REPLACE FUNCTION public.prevent_auto_slug()
RETURNS TRIGGER AS $$
BEGIN
  -- Si el slug es un UUID o es igual al user ID, establecerlo a NULL
  IF NEW.slug IS NOT NULL AND (
    NEW.slug ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    OR NEW.slug = NEW.id::text
  ) THEN
    NEW.slug := NULL;
    RAISE NOTICE 'Auto-slug prevented for user %. Slug set to NULL.', NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger que se ejecuta ANTES de cada INSERT
CREATE TRIGGER prevent_auto_slug_trigger
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_auto_slug();
```

**Propósito**: Intercepta cualquier intento de crear perfiles con slugs UUID, incluso si el código de aplicación intenta hacerlo.

## Flujo Correcto Después del Fix

### Nuevo Usuario - Flujo Completo

1. **Registro**:
   - Usuario se registra en `/signup`
   - Se crea perfil con `slug = NULL`
   - Usuario confirma email

2. **Login y Dashboard Simplificado**:
   - Usuario inicia sesión
   - Ve dashboard simplificado (sin URL asignada)
   - Ve guía de pasos para completar perfil

3. **Wizard de Perfil**:
   - Completa Identidad (nombre, email, foto, etc.)
   - Completa Experiencia (mínimo 1)
   - Completa Habilidades (mínimo 3)
   - Completa Preferencias (estado de búsqueda)

4. **Finalización - Creación de URL**:
   - Selecciona template (Moderno/Clásico/Creativo)
   - **Crea su URL personalizada** (ej: `javier-torres-desarrollador`)
   - Sistema valida disponibilidad en tiempo real
   - Guarda template + slug + `last_slug_changed_at`

5. **Dashboard Completo**:
   - Accede al dashboard completo
   - Puede compartir CV en: `yourcvpassport.com/cv/javier-torres-desarrollador`
   - Puede cambiar URL cada 3 meses desde Display Settings

## Verificación

### Tests de Regresión

#### Test 1: Usuario Nuevo - No Debe Recibir Slug
1. Crear cuenta nueva
2. Verificar en base de datos: `slug = NULL`
3. Verificar dashboard muestra paso 4 como incompleto

**Resultado Esperado**: ✅ `slug = NULL`
**Antes del Fix**: ❌ `slug = UUID` o `"user-xxxxx"`

#### Test 2: Completar Wizard - Usuario Crea URL
1. Usuario nuevo completa pasos 1-3
2. En paso 4, ingresa URL personalizada: "juan-perez-desarrollador"
3. Finaliza wizard
4. Verificar en base de datos: `slug = "juan-perez-desarrollador"`

**Resultado Esperado**: ✅ URL personalizada guardada

#### Test 3: Usuario Existente Afectado - Limpieza
1. Usuario con `slug = UUID` y `template = NULL`
2. Ejecutar migración de limpieza
3. Verificar `slug = NULL`
4. Usuario debe completar wizard para crear URL

**Resultado Esperado**: ✅ Slug limpiado, wizard incompleto

#### Test 4: Protección de Trigger
1. Intentar INSERT manual con slug UUID
2. Verificar que el trigger establece `slug = NULL`

**Resultado Esperado**: ✅ Trigger intercepta y establece NULL

### Queries de Verificación

```sql
-- Verificar que no hay slugs UUID en perfiles incompletos
SELECT id, full_name, slug, template
FROM public.profiles
WHERE slug ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  AND template IS NULL;
-- Debe retornar 0 filas

-- Verificar que el trigger existe
SELECT tgname, tgtype, tgenabled
FROM pg_trigger
WHERE tgname = 'prevent_auto_slug_trigger';
-- Debe retornar 1 fila con tgenabled = 'O' (enabled)

-- Verificar perfiles nuevos sin slug
SELECT COUNT(*)
FROM public.profiles
WHERE slug IS NULL AND template IS NULL;
-- Usuarios incompletos deben tener slug = NULL
```

## Instrucciones de Despliegue

### Local (Development)

```bash
# 1. Reiniciar el servidor de desarrollo (CRÍTICO)
# Presiona Ctrl+C para detener
npm run dev

# 2. Aplicar migraciones (si usas Supabase CLI)
supabase db reset
```

### Producción (Supabase Dashboard)

**IMPORTANTE**: Ejecutar la migración final completa que corrige TODAS las fuentes:

```bash
# 1. Ir a Supabase Dashboard > SQL Editor

# 2. Ejecutar la migración FINAL COMPLETA
# Copiar y pegar COMPLETO: supabase/migrations/20260109_fix_all_slug_sources_final.sql
# O usar el script de verificación: scripts/sql/EJECUTAR_ESTE_FIX_FINAL.sql
# Click "Run"

# 3. Verificar resultados:
#    ✅ Función on_profiles_created_sync_email actualizada (sin asignación de slug)
#    ✅ Trigger prevent_auto_slug_trigger creado y habilitado
#    ✅ Slugs auto-generados limpiados de perfiles incompletos
#    ✅ Listado de todos los triggers en la tabla profiles

# 4. Crear usuario de prueba para verificar
#    - Registrar nuevo usuario
#    - Verificar en base de datos que slug = NULL

# 5. Desplegar código de aplicación (si aún no se hizo)
git add .
git commit -m "fix: prevent automatic slug assignment - all sources fixed"
git push origin main
```

### Checklist Post-Deployment

- [ ] Migraciones ejecutadas en producción
- [ ] Trigger de prevención verificado
- [ ] Código de aplicación desplegado
- [ ] Servidor de desarrollo reiniciado (local)
- [ ] Test de usuario nuevo realizado
- [ ] Test de completar wizard realizado
- [ ] Verificar console.log no muestra errores
- [ ] Usuarios existentes afectados notificados (si aplica)

## Impacto en Usuarios

### Usuarios Nuevos (Post-Fix)
✅ **No Afectados** - Recibirán la experiencia correcta:
1. Registro → sin URL
2. Completan wizard → crean su URL personalizada
3. Pueden cambiar URL cada 3 meses

### Usuarios Existentes con Slug UUID
⚠️ **Requieren Acción** - Después de ejecutar migración de limpieza:
1. Su slug será establecido a NULL
2. Dashboard mostrará paso 4 como incompleto
3. Deben completar wizard para crear URL personalizada
4. **Comunicación recomendada**: Email notificando que deben completar su perfil

### Usuarios Existentes con Slug Personalizado
✅ **No Afectados** - Su URL personalizada se mantiene intacta

## Archivos Modificados

### Código de Aplicación
- `contexts/AuthContext.tsx` - Removida asignación de slug en registro
- `components/dashboard/DashboardContent.tsx` - Deshabilitada regeneración automática
- `components/profile-editor/FinalizationStep.tsx` - Verificada (sin cambios, funciona correctamente)

### Migraciones de Base de Datos
- `supabase/migrations/20260109_clean_uuid_slugs.sql` - Limpieza de datos existentes
- `supabase/migrations/20260109_prevent_auto_slug_assignment.sql` - Trigger de prevención inicial
- `supabase/migrations/20260109_fix_prevent_auto_slug_final.sql` - Versión mejorada del trigger
- `supabase/migrations/20260109_fix_all_slug_sources_final.sql` - **MIGRACIÓN FINAL COMPLETA** que corrige todas las fuentes

### Documentación
- `docs/changelog/URL_AUTO_ASSIGNMENT_FIX.md` - Este documento
- `docs/changelog/UUID_SLUG_CLEANUP.md` - Documentación de limpieza de slugs

## Notas Técnicas

### Por Qué Múltiples Fuentes de Auto-Generación

El código original tenía una lógica de "regeneración inteligente" que intentaba:
1. Crear slugs iniciales si no existían
2. "Mejorar" slugs que parecían genéricos
3. Actualizar slugs cuando el perfil estaba "más completo"

Esta lógica era problemática porque:
- Violaba el principio de consentimiento del usuario
- No respetaba el flujo de wizard
- Causaba confusión sobre el estado de completitud del perfil

### Decisión de Diseño

Se decidió que **SOLO** el usuario puede crear/modificar su URL en dos lugares:
1. **Wizard de Finalización** (primera vez)
2. **Display Settings** (cambios posteriores, limitados a cada 3 meses)

Cualquier otra fuente de modificación de slug es considerada un bug.

### Compatibilidad Hacia Atrás

La función `checkAndUpdateSlug` se mantiene pero está deshabilitada (return early) en lugar de eliminarla completamente para:
- Evitar errores de referencia si hay código que la llama
- Facilitar rollback si es necesario
- Documentar qué código era problemático

## Fecha de Implementación

2026-01-09

## Relacionado

- [UUID_SLUG_CLEANUP.md](./UUID_SLUG_CLEANUP.md) - Detalles sobre la limpieza de slugs UUID
- [Display Settings](../../components/profile-editor/DisplaySettingsSection.tsx) - Donde usuarios pueden cambiar su URL
- [Profile Wizard](../../components/profile-editor/ProfileWizard.tsx) - Flujo completo del wizard
