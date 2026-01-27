# Ejecutar Setup en Supabase SQL Editor

## Paso 1: Aplicar Migraciones

Ir a **Supabase Dashboard → SQL Editor** y ejecutar en orden:

### 1.1 Tipo CERTIFICATION en enum
```sql
-- Copiar y ejecutar todo el contenido de:
supabase/migrations/20260122_add_certification_stamp_type.sql
```

### 1.2 Actualizar tabla portfolio_items
```sql
-- Copiar y ejecutar todo el contenido de:
supabase/migrations/20260122_update_portfolio_items_for_certifications.sql
```

### 1.3 Habilitar verificación de certificaciones
```sql
-- Copiar y ejecutar todo el contenido de:
supabase/migrations/20260122_enable_certification_verification.sql
```

---

## Paso 2: Verificar Migraciones (Opcional)

```sql
-- Ver constraint actualizado
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'portfolio_items'::regclass
AND conname = 'portfolio_items_type_check';

-- Debe mostrar: CHECK (type = ANY (ARRAY['PROJECT'::text, 'DESIGN'::text, ..., 'CERTIFICATION'::text, 'COLLABORATION'::text]))
```

---

## Paso 3: Ejecutar Setup de Usuarios Demo

```sql
-- Copiar y ejecutar todo el contenido de:
scripts/sql/SUPABASE_setup-usuarios-demo.sql
```

Este script:
- ⚙️ Deshabilita temporalmente el rate limit de stamps
- ✅ Agrega stamps básicos a los 3 usuarios
- ✅ Agrega 9 certificaciones profesionales (3 por usuario)
- ✅ Crea stamps de verificación de certificaciones
- ⚙️ Rehabilita el rate limit de stamps
- ✅ Muestra resumen final

**Nota**: El rate limit se deshabilita temporalmente solo durante este setup para permitir insertar múltiples stamps del mismo tipo. Se rehabilita automáticamente al final del script.

---

## Resultado Esperado

Al final verás una tabla como esta:

| seccion | nombre | profesion | total_stamps | stamps_verificados | certificaciones |
|---------|--------|-----------|--------------|-------------------|-----------------|
| RESUMEN POR USUARIO | Javier Torres Gimeno | Ingeniero Industrial | 8 | 8 | 3 |
| RESUMEN POR USUARIO | Laura Martínez Vidal | Arquitecto Técnico | 8 | 8 | 3 |
| RESUMEN POR USUARIO | Marta Ruiz Serrano | Ingeniera de Energías Renovables | 8 | 8 | 3 |

---

## Usuarios Demo Configurados

### 👩‍🔧 Marta Ruiz Serrano
- Instalador de Energía Solar Fotovoltaica (IDAE)
- Técnico en Instalaciones Térmicas (RITE)
- Certificador de Eficiencia Energética

### 👨‍💼 Javier Torres Gimeno
- Profesional en Sistemas HVAC (ASHRAE)
- Frigorista Oficial Categoría 1
- Especialista en Normativa RITE y CTE

### 👩‍💼 Laura Martínez Vidal
- Lean Construction Practitioner (LCI)
- Director de Ejecución de Obras
- BIM Manager Certified (buildingSMART)

---

## Verificar en la Aplicación

Ir a los perfiles públicos:
- `/profile/marta-ruiz-serrano`
- `/profile/javier-torres-gimeno`
- `/profile/laura-martinez-vidal`

Deberías ver:
- ✅ Badges de verificación en el header
- 🏆 Sección "Certificaciones Profesionales"
- ✅ Badge verde "Verificado" en cada certificación
