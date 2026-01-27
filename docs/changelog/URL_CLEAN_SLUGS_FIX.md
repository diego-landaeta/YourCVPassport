# Fix: URLs Limpias sin Caracteres Codificados

**Fecha**: 2026-01-08
**Tipo**: Bug Fix / Mejora
**Prioridad**: Alta
**Impacto**: Todos los usuarios

## Problema Identificado

Cuando los usuarios personalizaban sus URLs con caracteres acentuados o especiales (como `josé-garcía`, `maría-josé`, `ñoño`), estos caracteres se codificaban en la URL del navegador resultando en URLs "sucias" como:
- `yourcvpassport.com/cv/jos%C3%A9-garc%C3%ADa`
- `yourcvpassport.com/cv/mar%C3%ADa-jos%C3%A9`
- `yourcvpassport.com/cv/%C3%B1o%C3%B1o`

Esto afectaba negativamente:
- **Experiencia de usuario**: URLs difíciles de leer y poco profesionales
- **SEO**: Los motores de búsqueda prefieren URLs limpias
- **Compartir**: URLs con `%` se ven poco confiables en redes sociales

## Solución Implementada

### 1. Nueva Utilidad Centralizada: `slugUtils.ts`

Creamos un nuevo archivo de utilidades en `utils/slugUtils.ts` con funciones reutilizables:

```typescript
// Función principal
export const sanitizeSlug = (text: string, maxLength: number = 50): string
```

**Transformaciones aplicadas:**
1. Convierte a minúsculas
2. **Normaliza caracteres acentuados** usando `normalize("NFD")`
3. **Elimina marcas diacríticas** (acentos, tildes, diéresis)
4. **Reemplaza ñ por n** explícitamente
5. Reemplaza espacios por guiones
6. Elimina caracteres especiales
7. Elimina guiones consecutivos
8. Limita longitud

**Ejemplos de transformación:**
- `José García` → `jose-garcia` ✅
- `María José Pérez` → `maria-jose-perez` ✅
- `Ángel López` → `angel-lopez` ✅
- `Ñoño` → `nono` ✅
- `Full Stack Developer @ Company` → `full-stack-developer-company` ✅

### 2. Archivos Actualizados

#### ✅ `components/profile-editor/FinalizationStep.tsx`
- **Línea 18**: Importa `sanitizeSlug`
- **Líneas 223-227**: Usa `sanitizeSlug()` en lugar de lógica inline
- **Impacto**: Cuando usuarios personalizan su URL en el wizard final

#### ✅ `components/URLSimulator.tsx`
- **Línea 3**: Importa `sanitizeSlug`
- **Líneas 71-76**: Usa `sanitizeSlug()` en lugar de lógica inline
- **Impacto**: Simulador de URLs en landing page

#### ✅ `components/dashboard/DashboardContent.tsx`
- **Línea 11**: Importa `sanitizeSlug`
- **Líneas 784-795**: Usa `sanitizeSlug()` para generar slugs automáticamente
- **Impacto**: Generación automática de slugs al crear/editar perfil

### 3. Consistencia en Toda la Aplicación

Ahora **todos** los puntos donde se generan o validan slugs usan la misma lógica centralizada:

```typescript
// Antes (código duplicado en 3+ lugares):
value
  .toLowerCase()
  .replace(/[^a-z0-9-]/g, '')  // ❌ Elimina directamente, perdiendo vocales acentuadas

// Después (código centralizado):
sanitizeSlug(value, maxLength)  // ✅ Normaliza primero, luego elimina
```

## Beneficios

### 1. URLs Profesionales
- ✅ `yourcvpassport.com/cv/jose-garcia`
- ✅ `yourcvpassport.com/cv/maria-jose-perez`
- ✅ `yourcvpassport.com/cv/angel-lopez`

### 2. Mejor SEO
- URLs limpias son mejor indexadas por Google
- Fáciles de leer en resultados de búsqueda
- Mejoran el CTR (Click-Through Rate)

### 3. Fácil de Compartir
- Sin caracteres `%` que parecen spam
- URLs cortas y memorables
- Mejor presentación en redes sociales

### 4. Mantenibilidad
- Lógica centralizada en un solo lugar
- Fácil de testear y mantener
- Consistencia garantizada

## Testing

### Casos de Prueba

```typescript
// Casos incluidos en slugUtils.ts
SLUG_EXAMPLES = {
  'José García': 'jose-garcia',
  'María José Pérez': 'maria-jose-perez',
  'Ángel López': 'angel-lopez',
  'Full Stack Developer @ Company': 'full-stack-developer-company',
  'UI/UX Designer': 'ui-ux-designer',
  'Ñoño': 'nono',
  'François': 'francois',
  'São Paulo': 'sao-paulo',
}
```

### Cómo Probar

1. **Wizard de Perfil**:
   - Completa el wizard hasta el paso final
   - En "Personaliza tu URL" escribe: `josé-garcía`
   - Verifica que automáticamente se convierta a: `jose-garcia`

2. **Dashboard - Editar Identidad**:
   - Cambia tu nombre a: `María José Pérez`
   - El sistema auto-genera el slug como: `maria-jose-perez`

3. **Landing Page - Simulador URL**:
   - En la página principal, usa el simulador
   - Escribe: `ángel-lópez`
   - Verifica conversión a: `angel-lopez`

## Compatibilidad

### ✅ Retrocompatibilidad Total
- Los slugs existentes en la base de datos NO se modifican
- Solo se aplica a nuevos slugs o cuando el usuario los edita
- Los usuarios pueden mantener sus URLs actuales

### ⚠️ Usuarios Afectados
- **Nuevos usuarios**: Todos los slugs serán limpios automáticamente
- **Usuarios existentes**: Solo cuando editen su URL (cada 90 días permitido)

## Próximos Pasos

### Opcional: Migración de Slugs Existentes
Si se desea limpiar slugs existentes en la base de datos:

```sql
-- Script SQL para normalizar slugs existentes (EJECUTAR CON CUIDADO)
UPDATE profiles
SET slug = lower(
  regexp_replace(
    regexp_replace(
      regexp_replace(
        regexp_replace(
          regexp_replace(
            regexp_replace(slug, '[áàäâ]', 'a', 'g'),
            '[éèëê]', 'e', 'g'
          ),
          '[íìïî]', 'i', 'g'
        ),
        '[óòöô]', 'o', 'g'
      ),
      '[úùüû]', 'u', 'g'
    ),
    '[ñ]', 'n', 'g'
  )
)
WHERE slug ~ '[áàäâéèëêíìïîóòöôúùüûñ]';
```

**⚠️ Advertencia**: Esto cambiaría las URLs de los usuarios existentes. Considerar:
- Notificar a usuarios afectados
- Mantener redirects de URLs antiguas
- O simplemente esperar a que usuarios editen naturalmente

## Documentación Adicional

- **Archivo principal**: `utils/slugUtils.ts`
- **Validación de slugs**: `utils/slugValidation.ts` (validación de 90 días)
- **Tests**: Ver `SLUG_EXAMPLES` en `slugUtils.ts`

## Resumen

Este fix garantiza que todas las URLs generadas por la aplicación sean:
- ✅ Limpias (sin `%20`, `%C3%B1`, etc.)
- ✅ Profesionales y fáciles de leer
- ✅ SEO-friendly
- ✅ Fáciles de compartir
- ✅ Consistentes en toda la aplicación

Los usuarios ahora pueden usar nombres con acentos y la aplicación automáticamente los convierte a URLs limpias y profesionales.
