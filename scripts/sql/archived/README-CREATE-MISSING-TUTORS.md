# 📚 Crear 10 Perfiles Faltantes de Tutores ISEIH

Esta guía te ayudará a agregar los 10 tutores ISEIH que faltan en la base de datos.

---

## 📋 TUTORES QUE SE CREARÁN

1. **Dr. Rebecca Anderson** - Naturopathy
2. **Karen White** - Holistic Nutrition
3. **Paul Henderson** - Herbal Medicine
4. **Jessica Porter** - Biofeedback & Wellness Technology
5. **Alex Martinez** - AI in Holistic Health
6. **Diana Russell** - Massage Therapy
7. **Michelle Chang** - Reiki & Energy Work
8. **Robert Kim** - Acupressure & Asian Bodywork
9. **Catherine Adams** - Couples Therapy
10. **Mark Davidson** - Nonviolent Communication

---

## ⚙️ ORDEN DE EJECUCIÓN

Los scripts están divididos en 3 partes para facilitar la ejecución. **Debes ejecutarlos en orden**:

### Parte 1: Tutores 1-3
**Archivo**: `create-missing-iseih-tutors.sql`

**Perfiles incluidos**:
- Dr. Rebecca Anderson (Naturopathy)
- Karen White (Holistic Nutrition)
- Paul Henderson (Herbal Medicine)

```sql
-- Copiar y ejecutar TODO el contenido del archivo en Supabase SQL Editor
```

**Resultado esperado**: 3 perfiles creados con 4 experiencias, 14-15 skills, 3-4 certificaciones cada uno.

---

### Parte 2: Tutores 4-6
**Archivo**: `create-missing-iseih-tutors-part2.sql`

**Perfiles incluidos**:
- Jessica Porter (Biofeedback)
- Alex Martinez (AI in Health)
- Diana Russell (Massage Therapy)

```sql
-- Copiar y ejecutar TODO el contenido del archivo en Supabase SQL Editor
```

**Resultado esperado**: 3 perfiles creados con 4 experiencias, 14 skills, 3-4 certificaciones cada uno.

---

### Parte 3: Tutores 7-10 (Final)
**Archivo**: `create-missing-iseih-tutors-part3.sql`

**Perfiles incluidos**:
- Michelle Chang (Reiki)
- Robert Kim (Acupressure)
- Catherine Adams (Couples Therapy)
- Mark Davidson (Nonviolent Communication)

```sql
-- Copiar y ejecutar TODO el contenido del archivo en Supabase SQL Editor
```

**Resultado esperado**: 4 perfiles creados con 4 experiencias, 14 skills, 3-4 certificaciones cada uno.

**Verificación final incluida**: El script muestra un resumen de los 10 perfiles creados.

---

## ✅ VERIFICACIÓN COMPLETA

Después de ejecutar los 3 scripts, verifica que todo está correcto:

```sql
-- Verificar los 10 nuevos tutores ISEIH
SELECT
    full_name,
    LENGTH(headline) as headline_chars,
    LENGTH(summary) as summary_chars,
    (SELECT COUNT(*) FROM experiences WHERE profile_id = p.id) as experiencias,
    (SELECT COUNT(*) FROM skills WHERE profile_id = p.id) as skills,
    (SELECT COUNT(*) FROM portfolio_items WHERE profile_id = p.id AND type = 'CERTIFICATION') as certs,
    CASE
        WHEN LENGTH(summary) > 200 AND LENGTH(summary) <= 800
             AND LENGTH(headline) >= 30
             AND (SELECT COUNT(*) FROM experiences WHERE profile_id = p.id) >= 3
             AND (SELECT COUNT(*) FROM skills WHERE profile_id = p.id) >= 12
             AND (SELECT COUNT(*) FROM portfolio_items WHERE profile_id = p.id AND type = 'CERTIFICATION') >= 3
        THEN '✅ EXCELENTE'
        ELSE '⚠️ REVISAR'
    END as calidad
FROM public.profiles p
WHERE full_name IN (
    'Rebecca Anderson',
    'Karen White',
    'Paul Henderson',
    'Jessica Porter',
    'Alex Martinez',
    'Diana Russell',
    'Michelle Chang',
    'Robert Kim',
    'Catherine Adams',
    'Mark Davidson'
)
ORDER BY full_name;
```

**Resultado esperado**: 10 filas con calidad "✅ EXCELENTE"

---

## 📊 DATOS INCLUIDOS POR PERFIL

Cada perfil incluye:

✅ **Información básica**:
- Full name
- Headline (30-65 chars)
- Summary (343-446 chars)
- Email (@iseih.edu)
- Phone, Location
- LinkedIn, Portfolio URL
- Role = 'professional'
- **SIN avatar_url** (se agregará manualmente después)

✅ **Experiencias** (4 por perfil):
- Posición actual en ISEIH (Instructor)
- Práctica/consultoría privada actual
- 1-2 posiciones previas relevantes

✅ **Skills** (14-15 por perfil):
- Nivel: EXPERT, ADVANCED
- Años de experiencia: 5-14 años
- Categorías relevantes a su especialidad

✅ **Certificaciones** (3-4 por perfil):
- Certificaciones profesionales principales
- Especializaciones relevantes
- Fechas de emisión

---

## ⚠️ NOTAS IMPORTANTES

1. **user_id = NULL**: Los perfiles se crean sin usuario asociado. Necesitarás crear usuarios en Supabase Auth y vincularlos después si es necesario.

2. **ON CONFLICT (email) DO NOTHING**: Si un perfil con ese email ya existe, no se duplicará. Seguro para re-ejecutar.

3. **Avatar/Fotos**: Los perfiles NO incluyen `avatar_url`. Deberás agregar las fotos manualmente después.

4. **Orden de ejecución**: Debes ejecutar Parte 1 → Parte 2 → Parte 3 en ese orden.

5. **Verificación**: Cada script incluye queries de verificación al final. Revisa los resultados.

---

## 🎯 DESPUÉS DE CREAR LOS PERFILES

### 1. Agregar fotos de perfil

```sql
-- Ejemplo: Actualizar avatar_url para cada tutor
UPDATE public.profiles
SET avatar_url = 'URL_DE_LA_FOTO'
WHERE full_name = 'Rebecca Anderson';
```

### 2. Vincular con usuarios Auth (si es necesario)

Si necesitas que estos perfiles tengan acceso a la plataforma:
1. Crear usuarios en Supabase Auth
2. Obtener sus UUIDs
3. Actualizar `user_id` en profiles

```sql
UPDATE public.profiles
SET user_id = 'UUID_DEL_USUARIO_AUTH'
WHERE full_name = 'Rebecca Anderson';
```

### 3. Verificar lista completa de tutores

```sql
-- Ver todos los tutores ISEIH activos (debería ser ~40 ahora)
SELECT COUNT(*) as total_tutores_iseih
FROM public.profiles
WHERE role = 'professional';

-- Ver los nuevos junto con los existentes
SELECT full_name, headline
FROM public.profiles
WHERE role = 'professional'
ORDER BY full_name;
```

---

## 📈 IMPACTO ESPERADO

### Antes:
- 30 tutores ISEIH en la BD
- 10 tutores faltantes del documento

### Después:
- 40 tutores ISEIH en la BD
- ✅ 100% de tutores del documento representados
- ✅ Todos con calidad EXCELENTE
- ✅ Listo para agregar fotos

---

## 🔍 SOLUCIÓN DE PROBLEMAS

### Error: "column user_id cannot be null"
**Solución**: La tabla requiere user_id. Necesitas:
1. Crear usuarios en Supabase Auth primero
2. O modificar los scripts para usar UUIDs temporales

### Error: "duplicate key value violates unique constraint"
**Causa**: El perfil ya existe con ese email.
**Solución**: Normal, el script usa `ON CONFLICT DO NOTHING`. El perfil existente no se modificará.

### Skills no se insertan
**Causa**: Puede que el perfil no se haya creado correctamente.
**Solución**: Verifica primero que el perfil existe:
```sql
SELECT id, full_name FROM profiles WHERE full_name = 'Rebecca Anderson';
```

---

**Última actualización**: 2026-02-12
**Versión**: 1.0
**Scripts relacionados**: `create-missing-iseih-tutors.sql`, `create-missing-iseih-tutors-part2.sql`, `create-missing-iseih-tutors-part3.sql`
