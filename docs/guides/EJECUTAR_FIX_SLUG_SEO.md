# Cómo Ejecutar el Fix de Slugs (SEO)

## Problema

**Los usuarios reciben URLs automáticamente al registrarse** → Esto afecta el SEO porque se indexan URLs vacías.

### Ejemplo del Problema

```
Usuario se registra → Automáticamente recibe: "user-3bce51c1"
Dashboard muestra: ✅ Choose template and URL → ✓ user-3bce51c1

❌ Pero el usuario NUNCA eligió esa URL!
❌ La URL no tiene contenido (perfil incompleto)
❌ Google indexa URLs vacías → Afecta ranking del sitio
```

## Solución

El slug/URL debe asignarse **SOLO cuando el usuario completa el wizard** de finalización.

---

## 🚀 PASOS PARA EJECUTAR EL FIX

### Paso 1: Abrir Supabase SQL Editor

1. Ve a **Supabase Dashboard**
2. Click en **SQL Editor** (menú izquierdo)
3. Click en **New Query**

### Paso 2: Ejecutar el Script

1. Copia **TODO** el contenido del archivo:
   ```
   scripts/sql/FIX_SLUG_SEO_SIMPLE.sql
   ```

2. Pégalo en el SQL Editor

3. Click en **Run** (Ctrl + Enter)

4. Verifica que aparezcan mensajes de éxito (sin errores)

### Paso 3: Verificar la Corrección

Ejecuta esta query para verificar:

```sql
-- Ver triggers activos
SELECT
    t.tgname AS trigger_name,
    p.proname AS function_name,
    CASE t.tgenabled WHEN 'O' THEN 'ENABLED ✅' ELSE 'DISABLED ❌' END AS status
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE t.tgrelid = 'public.profiles'::regclass
  AND NOT t.tgisinternal
  AND t.tgname = 'prevent_auto_slug_trigger';
```

**Resultado esperado:**
```
trigger_name: prevent_auto_slug_trigger
function_name: prevent_auto_slug
status: ENABLED ✅
```

---

## 🧪 TEST: Verificar que Funciona

### Test 1: Crear Usuario Nuevo (Recomendado)

1. Abre una ventana de **incógnito**
2. Registra un usuario nuevo: `test-seo-fix@example.com`
3. Inicia sesión
4. Ve al dashboard
5. **Verifica que el paso 4 NO muestra ningún slug asignado**

### Test 2: Verificar en Base de Datos

```sql
-- Buscar el usuario de prueba
SELECT id, email, slug, template
FROM public.profiles
WHERE email = 'test-seo-fix@example.com';
```

**Resultado esperado:**
```
slug: NULL ✅
template: NULL ✅
```

### Test 3: Completar el Wizard

1. Con el usuario de prueba, completa el wizard:
   - Paso 1: Identidad
   - Paso 2: Experiencia (mínimo 1)
   - Paso 3: Habilidades (mínimo 3)
   - Paso 4: Finalización
     - Selecciona un template
     - **Crea tu URL**: `mi-cv-test-2026`
     - Finaliza

2. Verifica en la base de datos:

```sql
SELECT id, email, slug, template
FROM public.profiles
WHERE email = 'test-seo-fix@example.com';
```

**Resultado esperado:**
```
slug: mi-cv-test-2026 ✅
template: modern-professional ✅
```

3. Accede a la URL pública:
   ```
   https://yourcvpassport.com/cv/mi-cv-test-2026
   ```

---

## ✅ Qué Hace Este Fix

### 1. Corrige la función `on_profiles_created_sync_email`

**Antes (❌):**
```sql
UPDATE profiles
SET email = ...,
    slug = 'user-' || ...  -- ❌ Auto-asigna slug
```

**Después (✅):**
```sql
UPDATE profiles
SET email = ...
-- ✅ NO toca el slug
```

### 2. Crea un trigger de protección

Intercepta **ANTES** de INSERT/UPDATE y bloquea slugs automáticos:

```sql
IF slug es UUID o "user-xxxxxxxx" THEN
  slug := NULL  -- ✅ Bloquea
END IF
```

### 3. Limpia slugs existentes

Solo para usuarios que **NO completaron el wizard**:

```sql
UPDATE profiles
SET slug = NULL
WHERE slug ~ 'user-[0-9a-f]{8,}$'  -- Formato auto-generado
  AND template IS NULL;            -- Sin completar wizard
```

---

## 📊 Impacto

### Usuarios Nuevos
✅ **No afectados** - Experiencia correcta desde el inicio

### Usuarios con Slug Auto-generado y Sin Template
⚠️ **Su slug se limpia a NULL**
- Deberán completar el wizard para crear su URL
- Dashboard mostrará paso 4 como incompleto

### Usuarios con Slug Personalizado
✅ **No afectados** - Su URL se mantiene

---

## 🔍 Diagnóstico (Opcional)

Si quieres diagnosticar antes de aplicar el fix:

```sql
-- Ver funciones que contienen 'user-'
SELECT p.proname AS funcion
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND pg_get_functiondef(p.oid) ILIKE '%user-%'
ORDER BY p.proname;
```

Si aparece `on_profiles_created_sync_email` → Necesitas aplicar el fix.

---

## ❓ Preguntas Frecuentes

### ¿Puedo revertir este cambio?

Sí, pero **NO es recomendado**. Si absolutamente necesitas revertirlo:

```sql
DROP TRIGGER IF EXISTS prevent_auto_slug_trigger ON public.profiles;
```

### ¿Qué pasa con los usuarios que ya se registraron con slug auto-generado?

- Si **completaron el wizard**: Su URL personalizada se mantiene
- Si **NO completaron el wizard**: Su slug se limpia y deben completar el wizard

### ¿Los usuarios pueden cambiar su URL después?

Sí, desde **Display Settings**, pero solo cada 3 meses.

### ¿Por qué es importante para SEO?

Las URLs vacías (sin contenido) se indexan en Google y afectan negativamente el ranking del dominio. Con este fix, solo se indexan URLs con CVs completos.

---

## 📝 Resumen

**Archivo a ejecutar:**
```
scripts/sql/FIX_SLUG_SEO_SIMPLE.sql
```

**Dónde ejecutarlo:**
```
Supabase Dashboard → SQL Editor → New Query → Pegar script → Run
```

**Verificación:**
```
Registrar usuario nuevo → Verificar que slug = NULL → Completar wizard → Verificar que slug = URL personalizada
```

**Prioridad:** 🔴 ALTA (afecta SEO)

**Tiempo estimado:** ⏱️ 2 minutos

---

**Fecha:** 2026-01-09
**Estado:** ✅ LISTO PARA EJECUTAR
