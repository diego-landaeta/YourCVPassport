# Sistema de URLs (Slugs) - Actualización 2026-01-26

## 📝 Cambio Implementado

Se ha corregido el sistema de generación de URLs para que **solo use nombre y apellido**, eliminando el headline/profesión que antes se incluía.

### Antes del Fix
```
emily-harper-ecopsychology-tutor
john-smith-software-engineer
maria-garcia-diseñadora-grafica
```

### Después del Fix
```
emily-harper
john-smith
maria-garcia
```

## 🔑 Lógica Actual de URLs

### 1. Generación de Slug Base

**Función**: [`generateProfileSlug(fullName)`](../utils/slugUtils.ts)

```typescript
generateProfileSlug("José García Pérez")
// Resultado: "jose-garcia-perez"
```

**Transformaciones aplicadas**:
1. Convierte a minúsculas
2. Normaliza acentos: `José → jose`, `María → maria`
3. Reemplaza `ñ → n`
4. Reemplaza espacios por guiones
5. Elimina caracteres especiales
6. Limita a 50 caracteres

### 2. Manejo de Duplicados

Cuando dos o más personas tienen el mismo nombre, el sistema agrega un **sufijo numérico** automáticamente.

**Función**: [`generateUniqueSlug(baseSlug, existingSlugs)`](../utils/slugUtils.ts)

#### Ejemplo con John Smith

```
Usuario 1: John Smith
└─ Slug: john-smith ✅

Usuario 2: John Smith
└─ Slug: john-smith-2 ✅

Usuario 3: John Smith
└─ Slug: john-smith-3 ✅
```

#### Ejemplo con María García

```
Usuario 1: María García
└─ Slug: maria-garcia ✅

Usuario 2: María García López
└─ Slug: maria-garcia-lopez ✅ (diferentes por apellido)

Usuario 3: María García
└─ Slug: maria-garcia-2 ✅ (mismo nombre exacto)
```

### 3. Validación en Base de Datos

El sistema valida disponibilidad antes de asignar:

```typescript
// En DashboardContent.tsx y slugValidation.ts
const { data: existingProfile } = await supabase
  .from('profiles')
  .select('id')
  .eq('slug', generatedSlug)
  .maybeSingle();

if (existingProfile && existingProfile.id !== userId) {
  // Slug ya existe → agregar sufijo -2, -3, etc.
}
```

### 4. Contador de Sufijos

El contador comienza en **2** (no en 1), porque:
- El primer usuario NO tiene sufijo: `john-smith`
- El segundo usuario tiene sufijo 2: `john-smith-2`
- El tercer usuario tiene sufijo 3: `john-smith-3`

Esto es más intuitivo para los usuarios.

## 📋 Flujo Completo

### Nuevo Usuario

1. **Registro** → `slug = NULL`
2. **Wizard Pasos 1-3** → `slug = NULL`
3. **Wizard Finalización**:
   - Usuario ingresa: `José García`
   - Sistema sanitiza: `jose-garcia`
   - Verifica disponibilidad:
     - Si disponible → `jose-garcia`
     - Si ocupado → `jose-garcia-2`
   - Guarda con `last_slug_changed_at = now()`
4. **URL activa**: `yourcvpassport.com/cv/jose-garcia`

### Usuario Editando Identidad (Dashboard)

1. Usuario cambia su nombre a: `María López`
2. Sistema detecta que `slug` está vacío o es UUID
3. Regenera automáticamente:
   - Sanitiza: `maria-lopez`
   - Verifica duplicados
   - Asigna: `maria-lopez` o `maria-lopez-2`
4. Usuario no necesita hacer nada manual

## 🎯 Casos de Uso

### Caso 1: Nombres Únicos
```
Input: "Emily Harper"
Slug: emily-harper
URL: /cv/emily-harper
```

### Caso 2: Nombres Comunes (Primera Persona)
```
Input: "John Smith"
Verificación: No existe "john-smith"
Slug: john-smith
URL: /cv/john-smith
```

### Caso 3: Nombres Comunes (Segunda Persona)
```
Input: "John Smith"
Verificación: Ya existe "john-smith"
Slug: john-smith-2
URL: /cv/john-smith-2
```

### Caso 4: Nombres con Acentos y Ñ
```
Input: "José Ñoño Pérez"
Sanitización: jose-nono-perez
Verificación: Disponible
Slug: jose-nono-perez
URL: /cv/jose-nono-perez
```

### Caso 5: Nombres Muy Largos
```
Input: "María José Guadalupe Fernández García López"
Sanitización: maria-jose-guadalupe-fernandez-garcia-lopez
Límite 50 chars: maria-jose-guadalupe-fernandez-garcia-lopez (48 chars, OK)
Slug: maria-jose-guadalupe-fernandez-garcia-lopez
URL: /cv/maria-jose-guadalupe-fernandez-garcia-lopez
```

### Caso 6: Apellidos Compuestos Diferentes
```
Usuario 1: "María García López"
Slug: maria-garcia-lopez

Usuario 2: "María García Pérez"
Slug: maria-garcia-perez

Usuario 3: "María García"
Slug: maria-garcia

✅ No hay conflicto porque los nombres completos son diferentes
```

## 🔒 Restricciones

### Cambio de Slug: 90 días

Una vez asignado, el usuario puede cambiar su URL **solo cada 90 días**.

```typescript
// En slugValidation.ts
const daysRemaining = 90 - daysSinceLast;

if (daysRemaining > 0) {
  return {
    error: `Debes esperar ${daysRemaining} días más para cambiar tu URL`
  };
}
```

### Validaciones de Formato

El slug debe cumplir:
- ✅ Solo letras minúsculas, números y guiones
- ✅ Mínimo 3 caracteres
- ✅ Máximo 50 caracteres
- ✅ No puede empezar ni terminar con guión
- ✅ No puede tener guiones consecutivos

## 🛠️ Archivos Modificados

### Backend/Utils
- [`utils/slugUtils.ts`](../utils/slugUtils.ts) - Funciones de sanitización y generación
  - `sanitizeSlug()` - Limpia texto y convierte a slug
  - `generateProfileSlug()` - Genera slug desde nombre (sin headline)
  - `generateUniqueSlug()` - Maneja duplicados con sufijo numérico
  - `checkSlugAvailability()` - Verifica disponibilidad en DB

- [`utils/slugValidation.ts`](../utils/slugValidation.ts) - Validación y restricciones
  - `canChangeSlug()` - Verifica restricción de 90 días
  - `updateSlugWithValidation()` - Actualiza con todas las validaciones

### Frontend
- [`components/dashboard/DashboardContent.tsx`](../components/dashboard/DashboardContent.tsx)
  - Genera slug automáticamente al editar identidad
  - Solo usa `full_name`, NO incluye `headline`
  - Maneja duplicados con sufijo numérico

- [`components/profile-editor/FinalizationStep.tsx`](../components/profile-editor/FinalizationStep.tsx)
  - Permite personalizar slug al finalizar wizard
  - Usa sanitización centralizada
  - Verifica disponibilidad en tiempo real

### Database
- Trigger: `prevent_auto_slug_trigger` - Previene slugs UUID automáticos
- Campo: `last_slug_changed_at` - Rastrea fecha del último cambio

## 📊 Comparación Antes/Después

| Aspecto | Antes | Después |
|---------|-------|---------|
| **Formato** | `nombre-apellido-profesion` | `nombre-apellido` |
| **Longitud** | 30-60+ caracteres | 10-30 caracteres |
| **Ejemplo** | `emily-harper-ecopsychology-tutor` | `emily-harper` |
| **Duplicados** | No manejados | Sufijo numérico automático |
| **SEO** | URLs largas | URLs concisas ✅ |
| **Legibilidad** | Media | Alta ✅ |

## ✅ Beneficios de la Actualización

1. **URLs más cortas y profesionales**
   - Más fáciles de recordar
   - Mejor aspecto en redes sociales

2. **Mejor SEO**
   - Google prefiere URLs concisas
   - Mayor CTR en resultados de búsqueda

3. **Manejo robusto de duplicados**
   - Sistema automático de sufijos
   - No requiere intervención manual

4. **Consistencia**
   - Misma lógica en wizard y dashboard
   - Todos los slugs siguen el mismo patrón

5. **Menos caracteres especiales**
   - Sin encoding (`%20`, `%C3%B1`)
   - URLs limpias y seguras

## 🔄 Migración de Usuarios Existentes

Para actualizar los ~13 usuarios que tienen headline en su slug:

1. Ejecutar script: [`scripts/sql/fix-slugs-remove-headline.sql`](../scripts/sql/fix-slugs-remove-headline.sql)
2. Seguir guía: [`scripts/sql/EJECUTAR_FIX_SLUGS_HEADLINE.md`](../scripts/sql/EJECUTAR_FIX_SLUGS_HEADLINE.md)

El script:
- Identifica slugs largos (>30 chars)
- Regenera usando solo nombre
- Maneja duplicados automáticamente
- Incluye preview antes de aplicar cambios

## 📈 Estadísticas Esperadas

Post-migración:
- ✅ 0 slugs con headline
- ✅ 0 slugs mayores a 50 caracteres
- ✅ 0 duplicados sin sufijo
- ✅ 100% de URLs limpias y SEO-friendly

## 🔮 Próximas Mejoras

Posibles mejoras futuras:
1. Dashboard para que admins gestionen slugs
2. Sistema de redirects para URLs antiguas
3. Notificaciones automáticas a usuarios cuando cambia su URL
4. Analytics de URLs más populares

---

**Última actualización:** 2026-01-26
**Versión:** 2.0 (Sistema sin headline)
