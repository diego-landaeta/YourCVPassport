# Flujo Correcto de Asignación de Slug

## Problema

Los usuarios estaban recibiendo slugs automáticos (UUID o `user-xxxxxxxx`) al momento del registro, cuando deberían tener `slug = NULL` hasta completar el wizard.

## Flujo CORRECTO

### 1. Registro de Usuario Nuevo

```
Usuario se registra → Perfil creado con slug = NULL
```

**Base de datos después del registro:**
```sql
{
  id: "43c35220-278d-49ff-a0a8-6b8564667c64",
  full_name: "Juan Pérez",
  email: "juan@example.com",
  slug: NULL,  ✅ CORRECTO
  template: NULL
}
```

### 2. Wizard de Perfil (Pasos 1-3)

El usuario completa:
- **Paso 1**: Identidad (nombre, headline, foto)
- **Paso 2**: Experiencia (mínimo 1)
- **Paso 3**: Habilidades (mínimo 3)

**Durante estos pasos, el slug permanece NULL**

### 3. Finalización del Wizard (Paso 4)

**SOLO aquí** el usuario crea su URL personalizada:

```typescript
// components/profile-editor/FinalizationStep.tsx

// Usuario ingresa su slug deseado
const customSlug = "juan-perez-desarrollador";

// Se valida disponibilidad
const isValid = await validateSlug(customSlug);

// Se guarda junto con el template
await supabase
  .from('profiles')
  .update({
    template: selectedTemplate,
    slug: customSlug,  ✅ Primera vez que se asigna
    last_slug_changed_at: new Date().toISOString()
  })
  .eq('id', session.user.id);
```

**Base de datos después de completar wizard:**
```sql
{
  id: "43c35220-278d-49ff-a0a8-6b8564667c64",
  full_name: "Juan Pérez",
  email: "juan@example.com",
  slug: "juan-perez-desarrollador",  ✅ Asignado por el usuario
  template: "modern-professional",
  last_slug_changed_at: "2026-01-09T10:30:00Z"
}
```

### 4. Dashboard Completo

Usuario puede acceder a:
- Su CV público en: `yourcvpassport.com/cv/juan-perez-desarrollador`
- Dashboard completo con todas las funcionalidades
- Puede cambiar su slug cada 3 meses desde Display Settings

## Lugares Donde el Usuario Puede Modificar su Slug

### 1. Wizard de Finalización (Primera vez - OBLIGATORIO)
- **Ubicación**: `components/profile-editor/FinalizationStep.tsx`
- **Cuándo**: Al completar el wizard por primera vez
- **Restricciones**: Debe elegir un slug único de mínimo 3 caracteres

### 2. Display Settings (Cambios posteriores - OPCIONAL)
- **Ubicación**: `components/profile-editor/DisplaySettingsSection.tsx`
- **Cuándo**: Cada 3 meses después de la última modificación
- **Restricciones**:
  - Debe esperar 3 meses desde `last_slug_changed_at`
  - Slug único y válido

## Causas que Estaban Generando Slugs Automáticos

### ❌ CAUSA 1: AuthContext.tsx (CORREGIDO)
```typescript
// ❌ ANTES (INCORRECTO):
.insert({
  id: user.id,
  full_name: user.user_metadata?.full_name || user.email,
  slug: user.id, // Auto-asignaba UUID
})

// ✅ AHORA (CORRECTO):
.insert({
  id: user.id,
  full_name: user.user_metadata?.full_name || user.email,
  // slug no se asigna - queda NULL
})
```

### ❌ CAUSA 2: DashboardContent.tsx (CORREGIDO)
```typescript
// ❌ ANTES: Auto-generaba slugs cuando detectaba slug = NULL
const checkAndUpdateSlug = async () => {
  if (!profile.slug) {
    // Auto-generaba: "juan-perez-desarrollador-123456"
  }
};

// ✅ AHORA: Función deshabilitada
const checkAndUpdateSlug = async () => {
  return; // No hace nada
};
```

### ❌ CAUSA 3: Trigger on_profiles_created_sync_email (DEBE ELIMINARSE)
```sql
-- ❌ TRIGGER PROBLEMÁTICO (debe eliminarse):
CREATE OR REPLACE FUNCTION public.on_profiles_created_sync_email()
RETURNS trigger AS $$
BEGIN
  UPDATE profiles
  SET email = (SELECT email FROM auth.users WHERE id = NEW.id),
      slug = COALESCE(NEW.slug, 'user-' || substring(NEW.id::text from 1 for 8)) -- ❌ Asignación automática
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Este trigger debe ELIMINARSE completamente.**

## Solución Implementada

### 1. Código de Aplicación
- ✅ AuthContext.tsx: No asigna slug en registro
- ✅ DashboardContent.tsx: No regenera slugs automáticamente
- ✅ FinalizationStep.tsx: Usuario crea su slug manualmente

### 2. Base de Datos

**Script a ejecutar:** `scripts/sql/FIX_SLUG_NULL_DEFINITIVO.sql`

Este script:
1. ❌ **ELIMINA** el trigger `on_profiles_created_sync_email` (causa raíz)
2. ✅ **CREA** el trigger `prevent_auto_slug_trigger` (prevención)
3. 🧹 **LIMPIA** slugs automáticos existentes (UUID y `user-xxxxxx`)
4. ✅ **VERIFICA** que todo esté correcto

## Cómo Ejecutar el Fix

### En Supabase Dashboard

1. Ve a **SQL Editor** en Supabase Dashboard
2. Copia y pega el contenido de `scripts/sql/FIX_SLUG_NULL_DEFINITIVO.sql`
3. Click en **Run**
4. Verifica los mensajes de confirmación:
   ```
   ✓ Trigger on_profiles_created_sync_email ELIMINADO
   ✓ Trigger prevent_auto_slug_trigger CREADO y ACTIVO
   ✓ Perfiles limpiados (slug = NULL): X
   ```

### Verificación Post-Fix

```sql
-- Verificar que NO hay slugs automáticos en perfiles incompletos
SELECT id, full_name, slug, template
FROM public.profiles
WHERE (
  slug ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  OR slug ~ '^user-[0-9a-f]{8,}$'
)
AND template IS NULL;

-- Debe retornar 0 filas
```

## Test del Flujo Correcto

### Test 1: Registro Nuevo Usuario

1. Registrar usuario nuevo en `/signup`
2. Verificar en base de datos:
   ```sql
   SELECT slug FROM profiles WHERE id = '<user_id>';
   -- Debe retornar: NULL
   ```
3. ✅ **PASS**: slug = NULL

### Test 2: Completar Wizard

1. Iniciar sesión con usuario nuevo
2. Completar pasos 1-3 del wizard
3. En paso 4:
   - Seleccionar template
   - Ingresar slug: `mi-cv-profesional`
   - Finalizar
4. Verificar en base de datos:
   ```sql
   SELECT slug, template FROM profiles WHERE id = '<user_id>';
   -- Debe retornar: slug = 'mi-cv-profesional', template = 'modern-professional'
   ```
5. ✅ **PASS**: slug personalizado asignado

### Test 3: Protección de Trigger

1. Intentar INSERT manual con slug UUID:
   ```sql
   INSERT INTO profiles (id, full_name, slug)
   VALUES (
     '00000000-0000-0000-0000-000000000001',
     'Test User',
     '00000000-0000-0000-0000-000000000001' -- UUID como slug
   );
   ```
2. Verificar que el trigger establece `slug = NULL`:
   ```sql
   SELECT slug FROM profiles WHERE id = '00000000-0000-0000-0000-000000000001';
   -- Debe retornar: NULL
   ```
3. ✅ **PASS**: Trigger bloqueó el slug automático

## Resumen Visual

```
┌─────────────────────────────────────────────────────────────┐
│                    FLUJO CORRECTO                            │
└─────────────────────────────────────────────────────────────┘

1. REGISTRO
   Usuario → /signup → Perfil creado
   ┌─────────────────┐
   │ slug: NULL      │ ✅ Sin slug al registrarse
   │ template: NULL  │
   └─────────────────┘

2. WIZARD (Pasos 1-3)
   Identidad → Experiencia → Habilidades
   ┌─────────────────┐
   │ slug: NULL      │ ✅ Slug sigue siendo NULL
   │ template: NULL  │
   └─────────────────┘

3. FINALIZACIÓN (Paso 4)
   Usuario ingresa: "juan-perez-desarrollador"
   ┌──────────────────────────────┐
   │ slug: "juan-perez-..."       │ ✅ Primera asignación
   │ template: "modern-pro..."    │
   └──────────────────────────────┘

4. DASHBOARD COMPLETO
   URL pública: /cv/juan-perez-desarrollador
   ┌──────────────────────────────┐
   │ ✓ CV público accesible       │
   │ ✓ Dashboard completo         │
   │ ✓ Puede cambiar URL (3m)     │
   └──────────────────────────────┘
```

## Preguntas Frecuentes

### ¿Por qué los usuarios tienen slugs UUID en la imagen?

Porque el trigger `on_profiles_created_sync_email` todavía existe en tu base de datos y está asignando slugs automáticamente. Debes ejecutar el script `FIX_SLUG_NULL_DEFINITIVO.sql` para eliminarlo.

### ¿Qué pasa con los usuarios que ya tienen slug UUID?

El script de limpieza establecerá su `slug = NULL` si no completaron el wizard (`template = NULL`). Deberán completar el wizard para crear su slug personalizado.

### ¿Qué pasa si un usuario quiere un slug que empiece con "user-"?

El trigger permite slugs como `user-juan-perez` pero bloquea `user-8b75703f` (solo caracteres hexadecimales). El patrón detecta slugs auto-generados, no slugs personalizados.

### ¿Cuándo se asigna el slug por primera vez?

SOLO cuando el usuario completa el **Paso 4: Finalización** del wizard. Nunca antes.

### ¿Puedo cambiar mi slug después?

Sí, desde **Display Settings**, pero solo cada 3 meses. El sistema verifica `last_slug_changed_at` para aplicar esta restricción.

## Archivos Relacionados

- **Script de Fix**: `scripts/sql/FIX_SLUG_NULL_DEFINITIVO.sql`
- **Finalización del Wizard**: `components/profile-editor/FinalizationStep.tsx`
- **Display Settings**: `components/profile-editor/DisplaySettingsSection.tsx`
- **AuthContext**: `contexts/AuthContext.tsx`
- **DashboardContent**: `components/dashboard/DashboardContent.tsx`
- **Documentación del Fix**: `docs/changelog/URL_AUTO_ASSIGNMENT_FIX.md`
