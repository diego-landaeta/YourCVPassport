# Guía de Ejecución: Fix Slugs - Eliminar Headline

## ⚠️ Importante
Este proceso corregirá las URLs de usuarios que actualmente incluyen su headline/profesión en el slug. Después de esta corrección, las URLs serán más limpias y solo contendrán nombre y apellido.

**Ejemplo de cambio:**
- ❌ Antes: `yourcvpassport.com/cv/emily-harper-ecopsychology-tutor`
- ✅ Después: `yourcvpassport.com/cv/emily-harper`

## 📋 Pasos de Ejecución

### 1. Instalar Extensión unaccent (si no existe)

```sql
CREATE EXTENSION IF NOT EXISTS unaccent;
```

**Ejecutar primero en Supabase Dashboard → SQL Editor**

### 2. Identificar Usuarios Afectados

Ejecuta el **PASO 1** del script `fix-slugs-remove-headline.sql`:

```sql
SELECT
    id,
    full_name,
    headline,
    slug,
    CHAR_LENGTH(slug) as slug_length,
    ARRAY_LENGTH(string_to_array(slug, '-'), 1) as slug_parts
FROM profiles
WHERE slug IS NOT NULL
  AND template IS NOT NULL
  AND (
    CHAR_LENGTH(slug) > 30
    OR ARRAY_LENGTH(string_to_array(slug, '-'), 1) > 3
  )
ORDER BY slug_length DESC;
```

**Esto te mostrará:**
- Cuántos usuarios están afectados (~13 usuarios esperados)
- Sus nombres y slugs actuales
- La longitud de sus slugs

### 3. Crear Funciones de Sanitización

Ejecuta los **PASOS 2 y 4** del script completo para crear las funciones:

```sql
-- PASO 2: Función sanitize_slug
-- PASO 4: Función generate_unique_slug
```

Estas funciones te permitirán:
- `sanitize_slug()`: Limpiar texto y convertirlo a slug
- `generate_unique_slug()`: Manejar duplicados automáticamente

### 4. Preview de Cambios (DRY RUN)

**MUY IMPORTANTE: Ejecuta esto ANTES de aplicar cambios**

Ejecuta el **PASO 5** completo:

```sql
WITH affected_users AS (
    SELECT
        id,
        full_name,
        headline,
        slug as old_slug,
        sanitize_slug(full_name) as base_new_slug
    FROM profiles
    WHERE slug IS NOT NULL
      AND template IS NOT NULL
      AND full_name IS NOT NULL
      AND (
        CHAR_LENGTH(slug) > 30
        OR ARRAY_LENGTH(string_to_array(slug, '-'), 1) > 3
      )
),
new_slugs AS (
    SELECT
        id,
        full_name,
        headline,
        old_slug,
        base_new_slug,
        generate_unique_slug(base_new_slug, id) as new_slug
    FROM affected_users
)
SELECT
    full_name,
    old_slug,
    new_slug,
    CASE
        WHEN new_slug = old_slug THEN '❌ No cambio'
        WHEN new_slug LIKE base_new_slug || '-%' THEN '⚠️  Con sufijo (duplicado)'
        ELSE '✅ Limpio'
    END as status
FROM new_slugs
ORDER BY full_name;
```

**Resultado esperado:**
```
| full_name        | old_slug                           | new_slug       | status       |
|------------------|------------------------------------|----------------|--------------|
| Emily Harper     | emily-harper-ecopsychology-tutor   | emily-harper   | ✅ Limpio    |
| John Smith       | john-smith-software-engineer       | john-smith     | ✅ Limpio    |
| John Smith       | john-smith-data-analyst            | john-smith-2   | ⚠️ Duplicado |
```

### 5. Aplicar Corrección (PRODUCCIÓN)

**⚠️ ADVERTENCIA: Esto modificará las URLs en la base de datos**

Si el preview se ve correcto, descomentar y ejecutar el **PASO 6**:

```sql
DO $$
DECLARE
    affected_record RECORD;
    new_slug TEXT;
    rows_updated INT := 0;
BEGIN
    FOR affected_record IN (
        SELECT
            id,
            full_name,
            slug as old_slug
        FROM profiles
        WHERE slug IS NOT NULL
          AND template IS NOT NULL
          AND full_name IS NOT NULL
          AND (
            CHAR_LENGTH(slug) > 30
            OR ARRAY_LENGTH(string_to_array(slug, '-'), 1) > 3
          )
    ) LOOP
        new_slug := generate_unique_slug(
            sanitize_slug(affected_record.full_name),
            affected_record.id
        );

        IF new_slug != affected_record.old_slug THEN
            UPDATE profiles
            SET slug = new_slug
            WHERE id = affected_record.id;

            rows_updated := rows_updated + 1;

            RAISE NOTICE 'Updated: % → %',
                affected_record.old_slug,
                new_slug;
        END IF;
    END LOOP;

    RAISE NOTICE '✅ Total usuarios actualizados: %', rows_updated;
END $$;
```

**Verás en los logs:**
```
NOTICE: Updated: emily-harper-ecopsychology-tutor → emily-harper
NOTICE: Updated: john-smith-software-engineer → john-smith
NOTICE: Updated: john-smith-data-analyst → john-smith-2
...
NOTICE: ✅ Total usuarios actualizados: 13
```

### 6. Verificación Post-Ejecución

Ejecuta el **PASO 7** para verificar:

```sql
-- Verificar que no quedan slugs largos
SELECT
    COUNT(*) as slugs_largos_restantes
FROM profiles
WHERE slug IS NOT NULL
  AND template IS NOT NULL
  AND (
    CHAR_LENGTH(slug) > 30
    OR ARRAY_LENGTH(string_to_array(slug, '-'), 1) > 3
  );

-- Verificar que no hay duplicados
SELECT
    slug,
    COUNT(*) as count
FROM profiles
WHERE slug IS NOT NULL
GROUP BY slug
HAVING COUNT(*) > 1;
```

**Resultado esperado:**
```
slugs_largos_restantes: 0

(Sin resultados en la segunda query = no hay duplicados)
```

## 🎯 Resultados Esperados

### Antes del Fix
```
emily-harper-ecopsychology-tutor
john-smith-software-engineer
maria-garcia-diseñadora-grafica-freelance
```

### Después del Fix
```
emily-harper
john-smith
john-smith-2  (si hay duplicado)
maria-garcia
```

## 📊 Impacto

### URLs Afectadas
- Aproximadamente 13 usuarios (~5% del total)
- Solo usuarios con perfiles completos (template != NULL)
- Solo slugs que incluyen headline (>30 chars o >3 partes)

### Beneficios
- ✅ URLs más cortas y profesionales
- ✅ Mejor SEO (URLs concisas)
- ✅ Más fáciles de recordar y compartir
- ✅ Consistencia con nuevos usuarios

### Consideraciones
- ⚠️ Las URLs antiguas dejarán de funcionar
- ⚠️ Los usuarios deberán actualizar links en redes sociales
- ⚠️ Considerar notificar a usuarios afectados

## 🔄 Manejo de Duplicados

Si dos personas tienen el mismo nombre, el sistema agrega un sufijo:

```
John Smith (primero)     → john-smith
John Smith (segundo)     → john-smith-2
John Smith (tercero)     → john-smith-3
María García (primera)   → maria-garcia
María García (segunda)   → maria-garcia-2
```

## 🧪 Testing Local

Antes de ejecutar en producción, puedes probar la función de sanitización:

```sql
SELECT
    'José García Pérez' as input,
    sanitize_slug('José García Pérez') as output;
-- Output: jose-garcia-perez

SELECT
    'Emily Harper - Ecopsychology Tutor' as input,
    sanitize_slug('Emily Harper') as output;
-- Output: emily-harper

SELECT
    'María José Full Stack Developer @ Company' as input,
    sanitize_slug('María José') as output;
-- Output: maria-jose
```

## 📞 Siguientes Pasos

Después de ejecutar este fix:

1. **Notificar a usuarios afectados** (opcional)
   - Enviar email explicando el cambio
   - Proporcionar su nueva URL

2. **Actualizar marketing materials**
   - Si hay ejemplos de URLs en documentación

3. **Monitorear analytics**
   - Ver si hay 404s en URLs antiguas
   - Considerar implementar redirects si es necesario

## 🔧 Limpieza (Opcional)

Si quieres eliminar las funciones temporales después de usarlas:

```sql
DROP FUNCTION IF EXISTS sanitize_slug(TEXT);
DROP FUNCTION IF EXISTS generate_unique_slug(TEXT, UUID);
```

**Nota:** Puedes mantener estas funciones para futuros usos administrativos.

## ✅ Checklist de Ejecución

- [ ] 1. Instalar extensión unaccent
- [ ] 2. Identificar usuarios afectados (PASO 1)
- [ ] 3. Crear funciones de sanitización (PASOS 2 y 4)
- [ ] 4. Ejecutar preview de cambios (PASO 5)
- [ ] 5. Revisar preview y confirmar que se ve correcto
- [ ] 6. Aplicar corrección (PASO 6)
- [ ] 7. Verificar resultados (PASO 7)
- [ ] 8. (Opcional) Notificar a usuarios afectados
- [ ] 9. (Opcional) Limpiar funciones temporales

## 🆘 Rollback

Si algo sale mal, puedes restaurar los slugs desde un backup:

```sql
-- Hacer backup antes de ejecutar
CREATE TABLE profiles_slugs_backup AS
SELECT id, slug, full_name, headline
FROM profiles
WHERE slug IS NOT NULL;

-- Para restaurar (si es necesario)
UPDATE profiles p
SET slug = b.slug
FROM profiles_slugs_backup b
WHERE p.id = b.id;
```

---

**Última actualización:** 2026-01-26
**Versión:** 1.0
