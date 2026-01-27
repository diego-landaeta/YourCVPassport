# Solución: Error de Constraint en portfolio_items

## El Error

```
ERROR: 23514: new row for relation "portfolio_items" violates check constraint "portfolio_items_type_check"
DETAIL: Failing row contains (..., CERTIFICATION, ...)
```

## Causa

La tabla `portfolio_items` tiene un **check constraint** que restringe los valores permitidos en la columna `type`, pero no incluye los nuevos valores `'CERTIFICATION'` ni `'COLLABORATION'`.

El constraint antiguo probablemente solo permite:
```sql
CHECK (type IN ('PROJECT', 'DESIGN', 'WRITING', 'VIDEO', 'CODE', 'OTHER'))
```

## Solución

### ✅ Opción 1: Ejecutar Migración Actualizada (Recomendado)

La migración `20260122_update_portfolio_items_for_certifications.sql` ha sido **actualizada** para eliminar el constraint antiguo y crear uno nuevo.

**Ejecutar desde Supabase Dashboard → SQL Editor:**

```sql
-- Ejecutar la migración completa actualizada
-- Archivo: supabase/migrations/20260122_update_portfolio_items_for_certifications.sql
```

La migración ahora incluye esta sección que soluciona el problema:

```sql
-- Drop old type check constraint if it exists and create a new one
DO $$
BEGIN
    -- Drop the old constraint
    ALTER TABLE portfolio_items DROP CONSTRAINT IF EXISTS portfolio_items_type_check;

    -- Add new constraint that includes CERTIFICATION and COLLABORATION
    ALTER TABLE portfolio_items ADD CONSTRAINT portfolio_items_type_check
        CHECK (type IN ('PROJECT', 'DESIGN', 'WRITING', 'VIDEO', 'CODE', 'OTHER', 'CERTIFICATION', 'COLLABORATION'));

    RAISE NOTICE 'Updated portfolio_items type constraint to include CERTIFICATION and COLLABORATION';
END $$;
```

### ✅ Opción 2: Fix Rápido Manual

Si solo quieres solucionar el constraint sin ejecutar toda la migración:

```sql
-- 1. Eliminar constraint antiguo
ALTER TABLE portfolio_items DROP CONSTRAINT IF EXISTS portfolio_items_type_check;

-- 2. Crear constraint nuevo que incluye CERTIFICATION y COLLABORATION
ALTER TABLE portfolio_items ADD CONSTRAINT portfolio_items_type_check
    CHECK (type IN ('PROJECT', 'DESIGN', 'WRITING', 'VIDEO', 'CODE', 'OTHER', 'CERTIFICATION', 'COLLABORATION'));
```

## Verificación

Después de aplicar el fix, verifica que el constraint se actualizó correctamente:

```sql
-- Ver definición del constraint
SELECT
    conname as constraint_name,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'portfolio_items'::regclass
AND conname = 'portfolio_items_type_check';
```

**Resultado esperado:**
```
constraint_name              | definition
-----------------------------+-------------------------------------------------------------------------
portfolio_items_type_check   | CHECK (type IN ('PROJECT', 'DESIGN', 'WRITING', 'VIDEO', 'CODE',
                            |   'OTHER', 'CERTIFICATION', 'COLLABORATION'))
```

## Orden Correcto de Ejecución

Para evitar este error, seguir este orden:

### 1. Migraciones (en orden):
```bash
✅ 1. supabase/migrations/20260122_add_certification_stamp_type.sql
✅ 2. supabase/migrations/20260122_update_portfolio_items_for_certifications.sql  # <- INCLUYE EL FIX
✅ 3. supabase/migrations/20260122_enable_certification_verification.sql
```

### 2. Verificar que todo está OK:
```bash
✅ scripts/sql/00_VERIFICAR_MIGRACIONES.sql
```

### 3. Ejecutar setup de usuarios demo:
```bash
✅ scripts/sql/EJECUTAR_SETUP_USUARIOS_DEMO.sql
```

## Script de Verificación Automática

Hemos creado un script que verifica automáticamente si todas las migraciones están aplicadas:

```bash
psql -f scripts/sql/00_VERIFICAR_MIGRACIONES.sql
```

Este script:
- ✅ Verifica que el tipo `CERTIFICATION` existe en el enum
- ✅ Verifica que todas las columnas necesarias existen
- ✅ Verifica que el constraint incluye `CERTIFICATION` y `COLLABORATION`
- ✅ Verifica las políticas RLS
- ⚠️ Te avisa si algo falta ANTES de intentar insertar datos

## Prevención

El script maestro `EJECUTAR_SETUP_USUARIOS_DEMO.sql` ahora **ejecuta automáticamente** la verificación antes de proceder, evitando este error.

---

**Actualizado**: 2026-01-22
**Estado**: ✅ Solucionado en la migración actualizada
