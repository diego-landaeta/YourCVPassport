# Setup de Usuarios Demo con Certificaciones

## Resumen

Este conjunto de scripts agrega certificaciones profesionales y stamps de verificación completos a 3 usuarios demo del sistema.

## Usuarios Demo

### 1. **Marta Ruiz Serrano**
- **Profesión**: Ingeniera de Energías Renovables
- **UUID**: `e379dca2-0b33-45b4-864a-ba9204e0ab4b`
- **Certificaciones agregadas**:
  - ✅ Instalador de Energía Solar Fotovoltaica (IDAE)
  - ✅ Técnico en Instalaciones Térmicas RITE
  - ✅ Certificador de Eficiencia Energética de Edificios
- **Stamps**: EMAIL, IDENTITY, EDUCATION, EMPLOYMENT, LANGUAGE, CERTIFICATION (x3)

### 2. **Javier Torres Gimeno**
- **Profesión**: Ingeniero Industrial | Especialista en HVAC
- **UUID**: `a826c47c-0d50-47da-aab3-4dfb71da709d`
- **Certificaciones agregadas**:
  - ✅ Profesional Certificado en Diseño de Sistemas HVAC (ASHRAE)
  - ✅ Frigorista Oficial - Categoría 1
  - ✅ Especialista en Normativa RITE y CTE
- **Stamps**: EMAIL, IDENTITY, EDUCATION, EMPLOYMENT, LANGUAGE, CERTIFICATION (x3)

### 3. **Laura Martínez Vidal**
- **Profesión**: Arquitecto Técnico | Especialista en obra residencial y comercial
- **UUID**: `bb6fad0f-0973-4e9a-abfc-dbaf7bd6100e`
- **Certificaciones agregadas**:
  - ✅ Lean Construction Practitioner (LCI)
  - ✅ Director de Ejecución de Obras Certificado
  - ✅ BIM Manager Certified Professional (buildingSMART)
- **Stamps**: EMAIL, IDENTITY, EDUCATION, EMPLOYMENT, LANGUAGE, CERTIFICATION (x3)

---

## Archivos Incluidos

### Scripts Individuales por Usuario

1. **`update-marta-complete-stamps.sql`**
   - Agrega stamps básicos para Marta (EMAIL, IDENTITY, EDUCATION, EMPLOYMENT, LANGUAGE)

2. **`update-javier-complete-stamps.sql`**
   - Agrega stamps básicos para Javier (EMAIL, IDENTITY, EDUCATION, EMPLOYMENT, LANGUAGE)

3. **`update-laura-complete-stamps.sql`**
   - Agrega stamps básicos para Laura (EMAIL, IDENTITY, EDUCATION, EMPLOYMENT, LANGUAGE)

### Script de Certificaciones

4. **`add-certifications-demo-users.sql`**
   - Agrega 3 certificaciones profesionales a cada usuario
   - Crea stamps de verificación de tipo CERTIFICATION para cada certificación
   - Incluye información completa: título, emisor, fechas, credencial ID, URLs

### Script Maestro

5. **`EJECUTAR_SETUP_USUARIOS_DEMO.sql`** ⭐
   - **Script principal que ejecuta todo**
   - Ejecuta los 4 scripts anteriores en el orden correcto
   - Muestra resumen final de verificación

---

## ⚠️ IMPORTANTE: Ejecutar Migraciones Primero

**ANTES de ejecutar cualquier script de usuarios demo**, asegúrate de que estas migraciones estén aplicadas:

### Paso 0: Aplicar Migraciones Requeridas

Ejecutar en este orden desde **Supabase Dashboard → SQL Editor**:

```sql
-- 1. Agregar tipo CERTIFICATION al enum
-- Archivo: supabase/migrations/20260122_add_certification_stamp_type.sql

-- 2. Actualizar tabla portfolio_items (INCLUYE FIX DEL CONSTRAINT)
-- Archivo: supabase/migrations/20260122_update_portfolio_items_for_certifications.sql

-- 3. Habilitar verificación de certificaciones
-- Archivo: supabase/migrations/20260122_enable_certification_verification.sql
```

**Verificar que las migraciones se aplicaron correctamente:**

```sql
-- Verificar que existe el tipo CERTIFICATION en stamp_type
SELECT enumlabel FROM pg_enum WHERE enumtypid = 'stamp_type'::regtype;

-- Verificar constraint actualizado en portfolio_items
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'portfolio_items'::regclass
AND conname = 'portfolio_items_type_check';

-- Debería mostrar: CHECK (type IN ('PROJECT', 'DESIGN', 'WRITING', 'VIDEO', 'CODE', 'OTHER', 'CERTIFICATION', 'COLLABORATION'))
```

---

## Cómo Ejecutar (Después de Migraciones)

### Opción 1: Ejecutar Script Maestro (Recomendado)

```bash
# En el directorio scripts/sql/
psql -U postgres -d yourcvpassport -f EJECUTAR_SETUP_USUARIOS_DEMO.sql
```

O desde el **SQL Editor de Supabase**:
1. Abrir Supabase Dashboard
2. Ir a **SQL Editor**
3. Copiar y pegar el contenido de `EJECUTAR_SETUP_USUARIOS_DEMO.sql`
4. Click en **Run**

### Opción 2: Ejecutar Scripts Individuales

Si prefieres ejecutar paso a paso:

```sql
-- Paso 1: Agregar stamps básicos
\i update-marta-complete-stamps.sql
\i update-javier-complete-stamps.sql
\i update-laura-complete-stamps.sql

-- Paso 2: Agregar certificaciones
\i add-certifications-demo-users.sql
```

### Opción 3: Solo Certificaciones

Si los usuarios ya tienen sus stamps básicos y solo quieres agregar certificaciones:

```sql
\i add-certifications-demo-users.sql
```

---

## Resultado Esperado

Después de ejecutar los scripts, cada usuario tendrá:

### Stamps de Verificación:
- ✅ **EMAIL** - Email verificado
- ✅ **IDENTITY** - Identidad verificada (DNI)
- ✅ **EDUCATION** - Educación verificada
- ✅ **EMPLOYMENT** - Experiencia laboral verificada
- ✅ **LANGUAGE** - Idiomas verificados
- ✅ **CERTIFICATION** (x3) - 3 certificaciones profesionales verificadas

### Certificaciones en Portfolio:
Cada usuario tendrá 3 items de tipo `CERTIFICATION` en la tabla `portfolio_items` con:
- Título de la certificación
- Emisor oficial
- Fechas de emisión (y expiración si aplica)
- ID de credencial
- URL de verificación externa (si aplica)
- Descripción detallada
- Campo `verified = true`

### Badges Visibles:
En los CVs públicos, cada certificación mostrará:
- 🏆 Icono de certificación
- ✅ Badge verde "Verificado"
- Toda la información de la certificación
- Link para verificar externamente

---

## Verificación

Para verificar que todo se instaló correctamente:

```sql
-- Ver resumen por usuario
SELECT
  p.full_name,
  COUNT(DISTINCT s.id) as total_stamps,
  COUNT(DISTINCT s.id) FILTER (WHERE s.type = 'CERTIFICATION') as certification_stamps,
  COUNT(DISTINCT pi.id) as total_certifications
FROM profiles p
LEFT JOIN stamps s ON s.profile_id = p.id
LEFT JOIN portfolio_items pi ON pi.profile_id = p.id AND pi.type = 'CERTIFICATION'
WHERE p.id IN (
  'e379dca2-0b33-45b4-864a-ba9204e0ab4b',
  'a826c47c-0d50-47da-aab3-4dfb71da709d',
  'bb6fad0f-0973-4e9a-abfc-dbaf7bd6100e'
)
GROUP BY p.id, p.full_name;

-- Ver certificaciones detalladas
SELECT
  p.full_name,
  pi.title as certification,
  pi.issuer,
  pi.verified,
  s.status as stamp_status
FROM portfolio_items pi
JOIN profiles p ON pi.profile_id = p.id
LEFT JOIN stamps s ON s.entity_id = pi.id::text AND s.type = 'CERTIFICATION'
WHERE pi.type = 'CERTIFICATION'
AND p.id IN (
  'e379dca2-0b33-45b4-864a-ba9204e0ab4b',
  'a826c47c-0d50-47da-aab3-4dfb71da709d',
  'bb6fad0f-0973-4e9a-abfc-dbaf7bd6100e'
)
ORDER BY p.full_name, pi.sort_order;
```

---

## Notas Importantes

1. **Idempotencia**: Los scripts usan `ON CONFLICT DO NOTHING`, por lo que pueden ejecutarse múltiples veces sin duplicar datos.

2. **Limpieza**: Si necesitas limpiar los datos antes de volver a ejecutar, descomenta las líneas `DELETE FROM stamps WHERE profile_id = ...` en cada script.

3. **Orden de Ejecución**: Es importante ejecutar primero los stamps básicos antes de las certificaciones, ya que el sistema puede tener validaciones que requieran ciertos stamps.

4. **Migraciones Previas**: Asegúrate de que las siguientes migraciones ya estén aplicadas:
   - `20260122_add_certification_stamp_type.sql`
   - `20260122_update_portfolio_items_for_certifications.sql`
   - `20260122_enable_certification_verification.sql`

5. **Permisos**: Estos scripts deben ejecutarse con permisos de administrador en la base de datos.

---

## Troubleshooting

### Error: "type certification does not exist"
- **Causa**: La migración que agrega el tipo CERTIFICATION al enum no se ha ejecutado
- **Solución**: Ejecutar primero `20260122_add_certification_stamp_type.sql`

### Error: "column verified does not exist"
- **Causa**: La migración que actualiza portfolio_items no se ha ejecutado
- **Solución**: Ejecutar primero `20260122_update_portfolio_items_for_certifications.sql`

### Error: "column entity_id does not exist"
- **Causa**: La migración que agrega entity_id a stamps no se ha ejecutado
- **Solución**: Ejecutar primero `20260122_enable_certification_verification.sql`

---

## Próximos Pasos

Después de ejecutar estos scripts, puedes:

1. **Ver los perfiles públicos**:
   - `https://tudominio.com/profile/marta-ruiz-serrano`
   - `https://tudominio.com/profile/javier-torres-gimeno`
   - `https://tudominio.com/profile/laura-martinez-vidal`

2. **Verificar badges**:
   - Los badges de verificación deberían aparecer en los CVs públicos
   - Las certificaciones deberían aparecer en su sección dedicada

3. **Probar búsqueda**:
   - Buscar por certificaciones específicas
   - Filtrar por profesionales verificados

4. **Crear más usuarios demo**:
   - Usar estos scripts como plantilla
   - Agregar certificaciones relevantes a otros perfiles

---

**Creado**: 2026-01-22
**Versión**: 1.0
**Sistema**: YourCVPassport - Sistema de Certificaciones Profesionales
