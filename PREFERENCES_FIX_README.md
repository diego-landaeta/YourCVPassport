# Fix para el Apartado de Preferencias

## Problema Identificado

El apartado de preferencias muestra el mensaje "Preferencias guardadas correctamente" pero en realidad está generando errores 400 (Bad Request) porque **faltan columnas en la base de datos**.

## Solución

### Paso 1: Aplicar la Migración en Supabase

Debes ejecutar el siguiente SQL en tu base de datos de Supabase:

1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Navega a **SQL Editor**
3. Crea una nueva query
4. Copia y pega el siguiente SQL:

```sql
-- Add preferences fields to profiles table if they don't exist

-- Job preferences
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='job_type') THEN
        ALTER TABLE public.profiles ADD COLUMN job_type text[];
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='availability') THEN
        ALTER TABLE public.profiles ADD COLUMN availability text;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='salary_min') THEN
        ALTER TABLE public.profiles ADD COLUMN salary_min integer;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='salary_max') THEN
        ALTER TABLE public.profiles ADD COLUMN salary_max integer;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='salary_currency') THEN
        ALTER TABLE public.profiles ADD COLUMN salary_currency text;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='remote_preference') THEN
        ALTER TABLE public.profiles ADD COLUMN remote_preference text;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='willing_to_relocate') THEN
        ALTER TABLE public.profiles ADD COLUMN willing_to_relocate boolean DEFAULT false;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='preferred_locations') THEN
        ALTER TABLE public.profiles ADD COLUMN preferred_locations text[];
    END IF;
END $$;

-- Add constraints for specific enums (optional but recommended for data integrity)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'profiles_availability_check'
    ) THEN
        ALTER TABLE public.profiles
        ADD CONSTRAINT profiles_availability_check
        CHECK (availability IS NULL OR availability IN ('immediate', '2-weeks', '1-month', '2-months', 'not-looking'));
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'profiles_remote_preference_check'
    ) THEN
        ALTER TABLE public.profiles
        ADD CONSTRAINT profiles_remote_preference_check
        CHECK (remote_preference IS NULL OR remote_preference IN ('remote', 'hybrid', 'on-site', 'flexible'));
    END IF;
END $$;
```

5. Ejecuta la query haciendo clic en "Run"
6. Verifica que se ejecutó correctamente (debe mostrar "Success")

### Paso 2: Verificar los Cambios

Después de aplicar la migración:

1. Recarga tu aplicación en el navegador
2. Ve al apartado de **Preferencias**
3. Completa los campos:
   - **Tipo de Trabajo**: Selecciona las opciones deseadas
   - **Disponibilidad**: Elige una opción del dropdown
   - **Expectativas Salariales**: Ingresa min, max y moneda
   - **Preferencia de Ubicación**: Selecciona una opción (Remoto, Híbrido, etc.)
   - **Dispuesto a reubicarse**: Marca si aplica
   - **Ubicaciones Preferidas**: Ingresa ubicaciones separadas por comas
4. Haz clic en **Guardar Preferencias**
5. Los errores 400 deberían desaparecer y los datos guardarse correctamente

## Campos Agregados

Los siguientes campos fueron agregados a la tabla `profiles`:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `job_type` | text[] | Array de tipos de trabajo (full-time, part-time, etc.) |
| `availability` | text | Disponibilidad (immediate, 2-weeks, 1-month, 2-months, not-looking) |
| `salary_min` | integer | Salario mínimo esperado |
| `salary_max` | integer | Salario máximo esperado |
| `salary_currency` | text | Moneda (USD, EUR, etc.) |
| `remote_preference` | text | Preferencia de trabajo (remote, hybrid, on-site, flexible) |
| `willing_to_relocate` | boolean | Dispuesto a reubicarse |
| `preferred_locations` | text[] | Array de ubicaciones preferidas |

## Cambios Adicionales Realizados

### 1. Corrección de Props en ProfileWizard
- **Portfolio**: Cambiado de `items` a `initialData`
- **Preferences**: Cambiado de `preferences` a `initialData`

### 2. Corrección de Persistencia de Portfolio
- El portfolio ahora recarga los datos desde la base de datos después de guardar
- Esto asegura que los IDs reales sean usados en lugar de IDs temporales
- Los items del portfolio ya no desaparecen al cambiar de sección

### 3. Mejora en el Cálculo del Score de Perfil
- El score ahora puede llegar a 100% sin necesidad de completar portfolio
- Portfolio es completamente opcional
- La lógica ahora coincide con `calculateProfileScore` de lib/ai.ts

## Notas Importantes

- Esta migración usa `IF NOT EXISTS` por lo que es seguro ejecutarla múltiples veces
- No eliminará ni modificará datos existentes
- Es recomendable hacer un respaldo de tu base de datos antes de aplicar cambios

## Troubleshooting

Si después de aplicar la migración sigues viendo errores:

1. **Verifica que la migración se aplicó**:
   ```sql
   SELECT column_name, data_type
   FROM information_schema.columns
   WHERE table_name = 'profiles'
   AND column_name IN ('job_type', 'availability', 'salary_min', 'salary_max', 'salary_currency', 'remote_preference', 'willing_to_relocate', 'preferred_locations');
   ```

2. **Revisa los permisos RLS**: Asegúrate de que las políticas RLS permitan UPDATE en la tabla profiles

3. **Limpia el caché**: Recarga la página con Ctrl+F5 (o Cmd+Shift+R en Mac)

4. **Revisa la consola**: Busca mensajes de error más específicos en la consola del navegador
