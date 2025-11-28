# Aplicar Migración de Idiomas

## Problema
La tabla `languages` no tiene los campos `percentage` e `is_native`, lo que causa el error:
```
Error saving languages: new row for relation "languages" violates check constraint "languages_percentage_check"
```

## Solución

Debes aplicar la migración `20251127_add_language_fields.sql` a tu base de datos de Supabase.

## Opción 1: Aplicar mediante Supabase Dashboard (Recomendado)

1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Navega a **SQL Editor** en el menú lateral
3. Haz clic en **New Query**
4. Copia y pega el contenido del archivo `20251127_add_language_fields.sql`:

```sql
-- Drop the old level check constraint if it exists
ALTER TABLE languages
DROP CONSTRAINT IF EXISTS languages_level_check;

-- Add percentage and is_native fields to languages table
ALTER TABLE languages
ADD COLUMN IF NOT EXISTS percentage INTEGER;

ALTER TABLE languages
ADD COLUMN IF NOT EXISTS is_native BOOLEAN DEFAULT false;

-- Add NEW check constraint for level that includes 'Native'
ALTER TABLE languages
ADD CONSTRAINT languages_level_check
CHECK (level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'Native'));

-- Add check constraint for percentage
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'languages_percentage_check'
  ) THEN
    ALTER TABLE languages
    ADD CONSTRAINT languages_percentage_check
    CHECK (percentage IS NULL OR (percentage >= 0 AND percentage <= 100));
  END IF;
END $$;

-- Create index for native languages for faster queries
CREATE INDEX IF NOT EXISTS idx_languages_is_native
ON languages(profile_id, is_native)
WHERE is_native = true;

-- Update existing records to set is_native based on level
UPDATE languages
SET is_native = true
WHERE level = 'Native' AND is_native IS NULL;

-- Set default percentage for native languages
UPDATE languages
SET percentage = 100
WHERE is_native = true AND percentage IS NULL;
```

5. Haz clic en **Run** o presiona `Ctrl + Enter`
6. Verifica que se ejecutó correctamente (debería mostrar "Success")

## Opción 2: Aplicar mediante Supabase CLI

Si tienes la CLI de Supabase configurada:

```bash
# Aplicar la migración
npx supabase db push

# O si prefieres aplicarla manualmente
npx supabase db execute --file supabase/migrations/20251127_add_language_fields.sql
```

## Verificación

Después de aplicar la migración, verifica que los campos se crearon correctamente:

```sql
-- En el SQL Editor de Supabase, ejecuta:
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'languages'
ORDER BY ordinal_position;
```

Deberías ver las columnas:
- `percentage` (INTEGER, nullable)
- `is_native` (BOOLEAN, no nullable, default false)

## Probar la aplicación

Una vez aplicada la migración:
1. Recarga la aplicación
2. Intenta agregar un idioma nativo
3. El error debería desaparecer y el idioma se guardará correctamente

## Notas

- Esta migración es **segura** y no afectará los datos existentes
- Los idiomas existentes con `level = 'Native'` se marcarán automáticamente como `is_native = true`
- Los idiomas nativos recibirán automáticamente `percentage = 100`
