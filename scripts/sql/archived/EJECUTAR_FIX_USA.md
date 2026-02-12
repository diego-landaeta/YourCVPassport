# Guía Rápida: Actualizar URLs de Usuarios USA

## 🎯 Objetivo
Actualizar los slugs de los usuarios de USA para que solo incluyan **nombre y apellido** (sin headline).

## 📋 Usuarios Afectados (Estimado)

Según la captura, estos usuarios de USA probablemente tienen slugs con headline:

- **Emily Harper** (Portland, OR) - `emily-harper-ecopsychology-...`
- **David Chen** (San Francisco, CA) - `david-chen-mindful-eating-...`
- **Rachel Stevens** (Chicago, IL) - `rachel-stevens-holistic-...`
- **Jennifer Martinez** (Austin, TX) - `jennifer-martinez-systemic-...`
- **Michael Thompson** (Phoenix, AZ) - `michael-thompson-certified-...`
- **Lisa Morrison** (Washington, DC) - `lisa-morrison-registered-...`
- **Marcus Williams** (Brooklyn, NY) - `marcus-williams-therapeutic-...`
- **Robert Green** (Seattle, WA) - `robert-green-sustainable-...`
- **Sarah Bennett** (Madison, WI) - `sarah-bennett-alternative-...`
- **James Wilson** (Miami, FL) - `james-wilson-social-emotional-...`

## 🚀 Ejecución Rápida

### Opción 1: Ejecutar Script Completo (Recomendado)

1. Ve a **Supabase Dashboard** → **SQL Editor**
2. Abre el archivo: `scripts/sql/fix-usa-users-slugs.sql`
3. Copia TODO el contenido
4. Pega en SQL Editor
5. Haz clic en **RUN**

El script hará:
- ✅ Instalar extensión unaccent (si no existe)
- ✅ Identificar usuarios de USA con slugs largos
- ✅ Mostrar preview de cambios
- ✅ Aplicar corrección automáticamente
- ✅ Verificar resultados

### Opción 2: Paso a Paso (Si quieres ver cada paso)

#### Paso 1: Instalar extensión
```sql
CREATE EXTENSION IF NOT EXISTS unaccent;
```

#### Paso 2: Ver usuarios afectados
```sql
SELECT
    full_name,
    slug,
    location,
    CHAR_LENGTH(slug) as slug_length
FROM profiles
WHERE slug IS NOT NULL
  AND template IS NOT NULL
  AND (country_code = 'US' OR location LIKE '%,%')
  AND (
    CHAR_LENGTH(slug) > 30
    OR ARRAY_LENGTH(string_to_array(slug, '-'), 1) > 3
  )
ORDER BY full_name;
```

#### Paso 3: Ejecutar corrección
Ejecuta el **PASO 5** del script `fix-usa-users-slugs.sql` (el bloque DO completo)

#### Paso 4: Verificar
```sql
-- Debe retornar 0
SELECT COUNT(*) as slugs_largos_restantes
FROM profiles
WHERE (country_code = 'US' OR location LIKE '%,%')
  AND CHAR_LENGTH(slug) > 30;

-- Ver todos los usuarios USA con sus nuevos slugs
SELECT full_name, slug, location
FROM profiles
WHERE (country_code = 'US' OR location LIKE '%,%')
  AND slug IS NOT NULL
ORDER BY full_name;
```

## 📊 Resultados Esperados

### Antes (Ejemplo)
```
emily-harper-ecopsychology-and-nature-connection (45 chars)
david-chen-mindful-eating-and-habit-change-tutor (48 chars)
rachel-stevens-holistic-nutrition-tutor (39 chars)
```

### Después
```
emily-harper (12 chars) ✅
david-chen (10 chars) ✅
rachel-stevens (15 chars) ✅
```

## ⚠️ Importante

1. **Las URLs antiguas dejarán de funcionar**
   - Los usuarios tendrán URLs más cortas
   - Deberán actualizar links compartidos

2. **Manejo de duplicados**
   - Si hay dos "John Smith", uno será `john-smith` y otro `john-smith-2`
   - El sistema lo maneja automáticamente

3. **Notificación opcional**
   - Considera enviar email a usuarios afectados
   - Informarles de su nueva URL más corta

## ✅ Verificación Final

Después de ejecutar, verifica que:
- [ ] No quedan slugs > 30 caracteres en usuarios de USA
- [ ] No hay slugs duplicados
- [ ] Todos los slugs siguen formato: `nombre-apellido`

```sql
-- Verificación completa
SELECT
    full_name,
    slug,
    location,
    CHAR_LENGTH(slug) as length,
    CASE
        WHEN CHAR_LENGTH(slug) <= 30 THEN '✅ Correcto'
        ELSE '❌ Muy largo'
    END as status
FROM profiles
WHERE (country_code = 'US' OR location LIKE '%,%')
  AND slug IS NOT NULL
  AND template IS NOT NULL
ORDER BY CHAR_LENGTH(slug) DESC;
```

## 🎉 Beneficios

- ✅ URLs más profesionales y cortas
- ✅ Mejor SEO
- ✅ Más fáciles de recordar
- ✅ Consistencia con nuevos usuarios

## 📝 Logs Esperados

Al ejecutar el script verás:
```
NOTICE: ========================================
NOTICE: Iniciando actualización de slugs para usuarios de USA
NOTICE: ========================================
NOTICE: ✅ Emily Harper, Portland, OR: emily-harper-ecopsychology-and-nature → emily-harper
NOTICE: ✅ David Chen, San Francisco, CA: david-chen-mindful-eating-tutor → david-chen
NOTICE: ✅ Rachel Stevens, Chicago, IL: rachel-stevens-holistic-nutrition → rachel-stevens
...
NOTICE: ========================================
NOTICE: ✅ Total usuarios USA actualizados: 10
NOTICE: ========================================
```

---

**Tiempo estimado:** 2-3 minutos
**Dificultad:** Fácil (solo copiar/pegar y ejecutar)
