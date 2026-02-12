# GUÍA COMPLETA: CREAR TUTORES ISEIH

## ⚠️ CAMPOS CRÍTICOS PARA QUE APAREZCAN EN /companies/search

La página `/companies/search` (CompanyTalentSearchPage) filtra perfiles con estos requisitos:

```sql
WHERE
  full_name IS NOT NULL AND full_name != ''
  AND headline IS NOT NULL AND headline != ''
  AND role != 'admin'
  AND wizard_completed = true          -- ✅ CRÍTICO
  AND slug IS NOT NULL                  -- ✅ CRÍTICO
  AND template IS NOT NULL              -- ✅ CRÍTICO
```

**Si falta ANY de estos campos, el perfil NO aparecerá en la búsqueda.**

---

## 📋 SCHEMA DE TABLAS

### Tabla: `profiles`

**Campos obligatorios mínimos:**
- `id` (UUID) - Debe existir en `auth.users` primero
- `full_name` (text) - No NULL, no vacío
- `headline` (text) - Mínimo 30 caracteres, no NULL
- `summary` (text) - 200-800 caracteres recomendado
- `email` (text)
- `role` (text) - Valor: `'professional'` (NO 'company')
- `plan` (text) - Valores válidos: `'free'`, `'pro'`
- `wizard_completed` (boolean) - **DEBE SER `true`**
- `slug` (text) - **DEBE existir** (ej: 'rebecca-anderson')
- `template` (text) - **DEBE existir** (ej: 'ModernProfessional')

**Campos opcionales recomendados:**
- `phone`, `location`, `linkedin_url`, `portfolio_url`
- `profile_hidden` (boolean) - `false` para que sea visible

### Tabla: `experiences`

**Campos obligatorios:**
- `profile_id` (UUID FK)
- `company_name` (text)
- `position` (text) - NO 'title'
- `start_date` (date) - Formato: `'2020-01-01'::date`
- `end_date` (date o NULL) - Si NULL: `NULL::date`
- `is_current` (boolean) - NO 'currently_working'
- `employment_type` (text) - Valores: `'FULL_TIME'`, `'PART_TIME'`, `'FREELANCE'`, `'INTERNSHIP'`
- `description` (text)
- `achievements` (text[]) - Array: `ARRAY['item1', 'item2']`
- `location` (text)
- `sort_order` (integer)
- `verified` (boolean)
- `verified_at` (timestamp)
- `verified_by` (UUID o NULL) - Si NULL: `NULL::uuid`

### Tabla: `skills`

**Campos obligatorios:**
- `profile_id` (UUID FK)
- `name` (text)
- `level` (text) - Valores: `'BEGINNER'`, `'INTERMEDIATE'`, `'ADVANCED'`, `'EXPERT'`
- `years_of_experience` (integer)
- `category` (text)

**Meta:** Mínimo 12-15 skills por perfil

### Tabla: `portfolio_items` (Certificaciones)

**Campos obligatorios:**
- `profile_id` (UUID FK)
- `type` (text) - Valor: `'CERTIFICATION'`
- `title` (text)
- `issuer` (text)
- `issue_date` (date) - Formato: `'2020-01-01'::date`
- `description` (text)

**Meta:** Mínimo 3-4 certificaciones por perfil

---

## 🎯 VALORES VÁLIDOS DE CONSTRAINTS

```sql
-- plan (profiles)
'free', 'pro'

-- role (profiles)
'professional', 'admin', 'archived' (para ocultar)

-- employment_type (experiences)
'FULL_TIME', 'PART_TIME', 'FREELANCE', 'INTERNSHIP'

-- level (skills)
'BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'

-- type (portfolio_items)
'CERTIFICATION', 'PROJECT', 'AWARD', 'PUBLICATION'
```

---

## 📝 PROCESO PASO A PASO

### Paso 1: Verificar que el usuario existe en auth.users

```sql
SELECT id, email FROM auth.users WHERE id = 'UUID-AQUI';
```

Si NO existe, el perfil fallará con error de FK constraint.

### Paso 2: Crear script con DELETE + UPDATE + INSERT

**Estructura recomendada:**

```sql
-- ============================================================================
-- CREAR [NOMBRE COMPLETO] - [ESPECIALIDAD]
-- ============================================================================

-- PASO 1: Eliminar datos existentes
DELETE FROM public.portfolio_items WHERE profile_id = 'UUID-AQUI';
DELETE FROM public.skills WHERE profile_id = 'UUID-AQUI';
DELETE FROM public.experiences WHERE profile_id = 'UUID-AQUI';

-- PASO 2: Actualizar perfil base
UPDATE public.profiles
SET
    full_name = 'Nombre Completo',
    headline = 'Headline de 30+ caracteres descriptivo',
    summary = 'Summary de 200-800 caracteres...',
    role = 'professional',              -- ✅ NO 'company'
    plan = 'free',
    email = 'email@iseih.edu',
    phone = '+1-XXX-XXX-XXXX',
    location = 'Ciudad, Estado, País',
    linkedin_url = 'https://linkedin.com/in/...',
    portfolio_url = 'https://...',
    wizard_completed = true,            -- ✅ CRÍTICO
    slug = 'nombre-apellido',           -- ✅ CRÍTICO
    template = 'ModernProfessional',    -- ✅ CRÍTICO
    profile_hidden = false,
    updated_at = NOW()
WHERE id = 'UUID-AQUI';

-- PASO 3: Insertar 4 experiencias (mínimo)
INSERT INTO public.experiences (
    profile_id, company_name, position, start_date, end_date,
    is_current, employment_type, description, achievements,
    location, sort_order, verified, verified_at, verified_by
) VALUES
('UUID-AQUI', 'Company 1', 'Position 1', '2020-01-01'::date, NULL::date, true, 'PART_TIME',
 'Descripción...', ARRAY['Achievement 1', 'Achievement 2'], 'Location', 1, true, NOW(), NULL::uuid),
-- ... más experiencias
;

-- PASO 4: Insertar 12-15 skills
INSERT INTO public.skills (profile_id, name, level, years_of_experience, category) VALUES
('UUID-AQUI', 'Skill Name 1', 'EXPERT', 11, 'Category 1'),
-- ... más skills
;

-- PASO 5: Insertar 3-4 certificaciones
INSERT INTO public.portfolio_items (profile_id, type, title, issuer, issue_date, description) VALUES
('UUID-AQUI', 'CERTIFICATION', 'Cert Title', 'Issuer Name', '2020-01-01'::date, 'Description...'),
-- ... más certificaciones
;

-- PASO 6: VERIFICACIÓN FINAL
SELECT
    'NOMBRE - LISTO' as status,
    p.full_name,
    p.role,
    p.wizard_completed,
    p.slug,
    p.template,
    LENGTH(p.summary) as summary_chars,
    LENGTH(p.headline) as headline_chars,
    (SELECT COUNT(*) FROM experiences WHERE profile_id = p.id) as experiencias,
    (SELECT COUNT(*) FROM skills WHERE profile_id = p.id) as skills,
    (SELECT COUNT(*) FROM portfolio_items WHERE profile_id = p.id AND type = 'CERTIFICATION') as certs
FROM public.profiles p
WHERE p.id = 'UUID-AQUI';
```

### Paso 3: Ejecutar script en Supabase SQL Editor

Copiar todo el script y ejecutar en una sola operación.

### Paso 4: Verificar salida

**Esperado:**
```
status: "NOMBRE - LISTO"
role: "professional"
wizard_completed: true
slug: "nombre-apellido"
template: "ModernProfessional"
summary_chars: 200-800
headline_chars: 30+
experiencias: 4+
skills: 12-15
certs: 3-4
```

### Paso 5: Refrescar página

Ir a `https://yourcvpassport.com/companies/search` y refrescar con **Ctrl+F5**.

---

## ⚠️ ERRORES COMUNES Y SOLUCIONES

### Error: "column 'title' does not exist"
**Causa:** Usar `title` en lugar de `position` en experiences.
**Fix:** Cambiar a `position`.

### Error: "invalid input syntax for type date"
**Causa:** Fecha sin type casting.
**Fix:** Usar `'2020-01-01'::date` en lugar de `'2020-01-01'` o `DATE '2020-01-01'`.

### Error: "column 'verified_by' is of type uuid but expression is of type text"
**Causa:** Usar `NULL` sin casting.
**Fix:** Usar `NULL::uuid` en lugar de `NULL`.

### Error: "violates check constraint 'profiles_plan_check'"
**Causa:** Plan inválido (ej: NULL).
**Fix:** Usar `'free'` o `'pro'`.

### Error: "violates check constraint 'experiences_employment_type_check'"
**Causa:** Tipo inválido (ej: 'SELF_EMPLOYED').
**Fix:** Usar `'FULL_TIME'`, `'PART_TIME'`, `'FREELANCE'`, o `'INTERNSHIP'`.

### Error: "violates foreign key constraint 'profiles_id_fkey'"
**Causa:** El UUID no existe en `auth.users`.
**Fix:** Verificar que el usuario exista primero o usar UUID de usuario existente.

### Error: "duplicate key value violates unique constraint"
**Causa:** Intentar INSERT cuando ya existen datos.
**Fix:** Usar DELETE antes de INSERT, o usar ON CONFLICT.

### Perfil NO aparece en /companies/search
**Causa:** Falta `wizard_completed = true`, `slug`, o `template`.
**Fix:** Ejecutar:
```sql
UPDATE public.profiles
SET wizard_completed = true, slug = 'nombre-slug', template = 'ModernProfessional'
WHERE id = 'UUID-AQUI';
```

---

## 📊 CALIDAD DE CONTENIDO

### Headlines
- **Mínimo:** 30 caracteres
- **Formato:** "[Título Profesional] + Especialización/Enfoque"
- **Ejemplo:** "Naturopathic Doctor Specializing in Evidence-Based Natural Medicine" (67 chars)

### Summaries
- **Mínimo:** 200 caracteres
- **Óptimo:** 300-800 caracteres
- **Contenido:** Experiencia + especialización + enfoque + pasión

### Experiencias
- **Cantidad:** 4 mínimo
- **Achievements:** 3-8 por experiencia
- **Orden:** sort_order de 1 a N (más reciente = 1)

### Skills
- **Cantidad:** 12-15 mínimo
- **Distribución:** Mix de EXPERT (4-6), ADVANCED (4-6), otros (2-3)
- **Categorías:** Variar entre Clinical Practice, Specialization, Education, etc.

### Certificaciones
- **Cantidad:** 3-4 mínimo
- **Deben incluir:** Fecha, institución, descripción clara

---

## 🔧 SCRIPTS DE UTILIDAD

### Verificar perfil completo
```sql
SELECT
    p.full_name,
    p.role,
    p.wizard_completed,
    p.slug,
    p.template,
    LENGTH(p.headline) as headline_len,
    LENGTH(p.summary) as summary_len,
    (SELECT COUNT(*) FROM experiences WHERE profile_id = p.id) as exp,
    (SELECT COUNT(*) FROM skills WHERE profile_id = p.id) as skills,
    (SELECT COUNT(*) FROM portfolio_items WHERE profile_id = p.id) as items
FROM profiles p
WHERE p.id = 'UUID-AQUI';
```

### Ocultar perfil (sin eliminar)
```sql
UPDATE public.profiles
SET wizard_completed = false, profile_hidden = true
WHERE id = 'UUID-AQUI';
```

### Ver todos los perfiles visibles en /companies/search
```sql
SELECT full_name, email, slug, wizard_completed, template
FROM public.profiles
WHERE wizard_completed = true
  AND slug IS NOT NULL
  AND template IS NOT NULL
  AND role != 'admin'
ORDER BY full_name;
```

---

## 📌 CHECKLIST FINAL

Antes de dar un perfil por completo, verificar:

- [ ] UUID existe en auth.users
- [ ] `full_name` no NULL, no vacío
- [ ] `headline` >= 30 caracteres
- [ ] `summary` 200-800 caracteres
- [ ] `role = 'professional'`
- [ ] `plan = 'free'` o `'pro'`
- [ ] ✅ **`wizard_completed = true`**
- [ ] ✅ **`slug` existe** (ej: 'nombre-apellido')
- [ ] ✅ **`template` existe** (ej: 'ModernProfessional')
- [ ] `profile_hidden = false`
- [ ] Mínimo 4 experiencias
- [ ] Mínimo 12-15 skills
- [ ] Mínimo 3-4 certificaciones
- [ ] Todos los dates con `::date` casting
- [ ] Todos los NULL uuid con `::uuid` casting
- [ ] employment_type válido
- [ ] Script ejecuta sin errores
- [ ] Verificación final retorna datos completos
- [ ] Perfil aparece en /companies/search

---

## 🎓 TUTORES ISEIH PENDIENTES

Basado en el documento proporcionado:

1. ✅ Dr. Rebecca Anderson (Naturopathy) - COMPLETADO
2. ⬜ Karen White (Holistic Nutrition)
3. ⬜ Paul Henderson (Herbal Medicine)
4. ⬜ Jessica Porter (Biofeedback)
5. ⬜ Alex Martinez (AI in Health)
6. ⬜ Diana Russell (Massage Therapy)
7. ⬜ Michelle Chang (Reiki)
8. ⬜ Robert Kim (Acupressure)
9. ⬜ Catherine Adams (Couples Therapy)
10. ⬜ Mark Davidson (Nonviolent Communication)

---

## 🚀 TEMPLATES DISPONIBLES

Valores válidos para el campo `template`:

- `'ModernProfessional'` ✅ Recomendado para tutores
- `'ClassicTemplate'`
- `'ModernCleanTemplate'`
- `'ElegantMinimalTemplate'`
- `'PassportTemplate'`
- `'CreativeMinimalistTemplate'`
- Y más (ver carpeta components/templates/)

---

## 📞 CONTACTO DE EMERGENCIA

Si un perfil NO aparece después de ejecutar todo:

1. Verificar con: `scripts/sql/check-rebecca-role.sql`
2. Verificar filtros de página: `wizard_completed`, `slug`, `template`
3. Verificar constraints: `plan`, `employment_type`
4. Hacer hard refresh: **Ctrl+F5** (no solo F5)
5. Verificar en Supabase Table Editor que los datos están guardados

---

**Última actualización:** 2026-02-12
**Autor:** Claude Code Assistant
**Basado en:** Experiencia creando Rebecca Anderson profile
