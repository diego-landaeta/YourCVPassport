# 🎓 EJECUTAR 9 TUTORES ISEIH FALTANTES

Scripts listos para crear los 9 tutores ISEIH que faltaban en la base de datos.

---

## 📋 LISTA DE TUTORES

| # | Nombre | Especialidad | UUID | Email |
|---|--------|-------------|------|-------|
| 1 | Karen White | Holistic Nutrition | `0bfd1ef4-c6b0-451c-8637-77b534e6e9a1` | karen.white@iseih.edu |
| 2 | Paul Henderson | Herbal Medicine | `36c177f5-19f4-47c7-85c7-05507347e702` | paul.henderson@iseih.edu |
| 3 | Jessica Porter | Biofeedback | `55333d11-13c8-43b8-942b-cb1e75d0b812` | jessica.porter@iseih.edu |
| 4 | Alex Martinez | AI in Health | `099840cc-a99c-480d-8fd9-fba5ecd5a4a6` | alex.martinez@iseih.edu |
| 5 | Diana Russell | Massage Therapy | `636e9e4d-4873-4114-8949-376a8d0f24bc` | diana.russell@iseih.edu |
| 6 | Michelle Chang | Reiki | `f30db5f9-0807-4d48-aa76-de4b6d7278da` | michelle.chang@iseih.edu |
| 7 | Robert Kim | Acupressure | `9fdf9c06-9f69-47de-bd73-7f2a2fb4d5da` | robert.kim@iseih.edu |
| 8 | Catherine Adams | Couples Therapy | `ce98b4d3-9e58-4f38-98be-8e4fd94d6b15` | catherine.adams@iseih.edu |
| 9 | Mark Davidson | Nonviolent Communication | `707aa7e3-b891-485c-b4e6-618625713565` | mark.davidson@iseih.edu |

---

## ⚡ OPCIÓN 1: EJECUTAR TODOS DE UNA VEZ (RECOMENDADO)

### Paso 1: Abrir Supabase SQL Editor

1. Ve a tu proyecto en Supabase Dashboard
2. Click en **SQL Editor** (menú izquierdo)
3. Click en **New query**

### Paso 2: Ejecutar scripts individualmente

**IMPORTANTE:** Supabase SQL Editor NO soporta `\i` commands. Debes ejecutar cada script individualmente.

#### Ejecuta en este orden:

1. **Karen White**: Copia y pega todo el contenido de [create-karen-white.sql](create-karen-white.sql)
2. **Paul Henderson**: Copia y pega todo el contenido de [create-paul-henderson.sql](create-paul-henderson.sql)
3. **Jessica Porter**: Copia y pega todo el contenido de [create-jessica-porter.sql](create-jessica-porter.sql)
4. **Alex Martinez**: Copia y pega todo el contenido de [create-alex-martinez.sql](create-alex-martinez.sql)
5. **Diana Russell**: Copia y pega todo el contenido de [create-diana-russell.sql](create-diana-russell.sql)
6. **Michelle Chang**: Copia y pega todo el contenido de [create-michelle-chang.sql](create-michelle-chang.sql)
7. **Robert Kim**: Copia y pega todo el contenido de [create-robert-kim.sql](create-robert-kim.sql)
8. **Catherine Adams**: Copia y pega todo el contenido de [create-catherine-adams.sql](create-catherine-adams.sql)
9. **Mark Davidson**: Copia y pega todo el contenido de [create-mark-davidson.sql](create-mark-davidson.sql)

### Paso 3: Verificar todos los tutores

Ejecuta este query para verificar que todos fueron creados correctamente:

```sql
SELECT
    full_name,
    email,
    role,
    wizard_completed,
    slug,
    template,
    LENGTH(headline) as headline_len,
    (SELECT COUNT(*) FROM experiences WHERE profile_id = profiles.id) as exp,
    (SELECT COUNT(*) FROM skills WHERE profile_id = profiles.id) as skills,
    (SELECT COUNT(*) FROM portfolio_items WHERE profile_id = profiles.id) as certs
FROM public.profiles
WHERE id IN (
    '0bfd1ef4-c6b0-451c-8637-77b534e6e9a1',  -- Karen White
    '36c177f5-19f4-47c7-85c7-05507347e702',  -- Paul Henderson
    '55333d11-13c8-43b8-942b-cb1e75d0b812',  -- Jessica Porter
    '099840cc-a99c-480d-8fd9-fba5ecd5a4a6',  -- Alex Martinez
    '636e9e4d-4873-4114-8949-376a8d0f24bc',  -- Diana Russell
    'f30db5f9-0807-4d48-aa76-de4b6d7278da',  -- Michelle Chang
    '9fdf9c06-9f69-47de-bd73-7f2a2fb4d5da',  -- Robert Kim
    'ce98b4d3-9e58-4f38-98be-8e4fd94d6b15',  -- Catherine Adams
    '707aa7e3-b891-485c-b4e6-618625713565'   -- Mark Davidson
)
ORDER BY full_name;
```

**Resultado esperado:** 9 filas, todas con:
- `role = 'professional'`
- `wizard_completed = true`
- `slug` existe
- `template = 'ModernProfessional'`
- `headline_len >= 30`
- `exp = 4`
- `skills = 15`
- `certs = 4`

---

## 🔍 OPCIÓN 2: EJECUTAR DE UNO EN UNO

Si prefieres ir de uno en uno para verificar cada tutor:

### 1. Karen White - Holistic Nutrition
```bash
Archivo: create-karen-white.sql
UUID: 0bfd1ef4-c6b0-451c-8637-77b534e6e9a1
```

### 2. Paul Henderson - Herbal Medicine
```bash
Archivo: create-paul-henderson.sql
UUID: 36c177f5-19f4-47c7-85c7-05507347e702
```

### 3. Jessica Porter - Biofeedback
```bash
Archivo: create-jessica-porter.sql
UUID: 55333d11-13c8-43b8-942b-cb1e75d0b812
```

### 4. Alex Martinez - AI in Health
```bash
Archivo: create-alex-martinez.sql
UUID: 099840cc-a99c-480d-8fd9-fba5ecd5a4a6
```

### 5. Diana Russell - Massage Therapy
```bash
Archivo: create-diana-russell.sql
UUID: 636e9e4d-4873-4114-8949-376a8d0f24bc
```

### 6. Michelle Chang - Reiki
```bash
Archivo: create-michelle-chang.sql
UUID: f30db5f9-0807-4d48-aa76-de4b6d7278da
```

### 7. Robert Kim - Acupressure
```bash
Archivo: create-robert-kim.sql
UUID: 9fdf9c06-9f69-47de-bd73-7f2a2fb4d5da
```

### 8. Catherine Adams - Couples Therapy
```bash
Archivo: create-catherine-adams.sql
UUID: ce98b4d3-9e58-4f38-98be-8e4fd94d6b15
```

### 9. Mark Davidson - Nonviolent Communication
```bash
Archivo: create-mark-davidson.sql
UUID: 707aa7e3-b891-485c-b4e6-618625713565
```

**Cada script incluye:**
- DELETE de datos existentes
- UPDATE del perfil con todos los campos críticos
- INSERT de 4 experiencias
- INSERT de 15 skills
- INSERT de 4 certificaciones
- Query de verificación al final

---

## ✅ VERIFICACIÓN POST-EJECUCIÓN

### 1. Verificar en base de datos

Ejecuta el query de verificación (ver arriba) y confirma que retorna 9 tutores.

### 2. Verificar en página web

1. Ve a: **https://yourcvpassport.com/companies/search**
2. Refresca con **Ctrl+F5** (hard refresh)
3. Busca cada uno de los 9 tutores en la lista
4. Verifica que todos aparecen

### 3. Verificar perfiles individuales

Click en cada tutor y verifica:
- ✅ Nombre completo correcto
- ✅ Headline descriptivo (30+ caracteres)
- ✅ Summary completo (200-800 caracteres)
- ✅ 4 experiencias laborales
- ✅ 15 skills listados
- ✅ 4 certificaciones

---

## 🚨 TROUBLESHOOTING

### "Perfil no aparece en /companies/search"

**Causa:** Falta alguno de los campos críticos.

**Solución:** Ejecuta este query para el UUID específico:

```sql
SELECT
    full_name, wizard_completed, slug, template, role
FROM public.profiles
WHERE id = '[UUID-AQUI]';
```

Debe retornar:
- `wizard_completed = true`
- `slug` existe (no null)
- `template = 'ModernProfessional'`
- `role = 'professional'`

Si falta alguno, ejecuta [fix-wizard-slug-template.sql](fix-wizard-slug-template.sql) adaptado para ese UUID.

### "Error: violates foreign key constraint"

**Causa:** El UUID no existe en `auth.users`.

**Solución:** Verifica que el usuario existe:

```sql
SELECT id, email FROM auth.users WHERE id = '[UUID-AQUI]';
```

Si no existe, debes crear el usuario primero en auth.users.

### "Error: duplicate key"

**Causa:** Ya existen datos para ese perfil.

**Solución:** Los scripts incluyen DELETE al inicio. Re-ejecuta el script completo.

---

## 📊 RESUMEN FINAL

Después de ejecutar todos los scripts, deberías tener:

- ✅ **10 tutores ISEIH totales** (1 ya creado + 9 nuevos)
- ✅ **Rebecca Anderson** (Naturopathy) - ya existente
- ✅ **Karen White** (Holistic Nutrition) - nuevo
- ✅ **Paul Henderson** (Herbal Medicine) - nuevo
- ✅ **Jessica Porter** (Biofeedback) - nuevo
- ✅ **Alex Martinez** (AI in Health) - nuevo
- ✅ **Diana Russell** (Massage Therapy) - nuevo
- ✅ **Michelle Chang** (Reiki) - nuevo
- ✅ **Robert Kim** (Acupressure) - nuevo
- ✅ **Catherine Adams** (Couples Therapy) - nuevo
- ✅ **Mark Davidson** (Nonviolent Communication) - nuevo

**Todos visibles en:** https://yourcvpassport.com/companies/search

---

## 📁 ARCHIVOS INCLUIDOS

```
scripts/sql/
├── create-karen-white.sql              # Karen White - Holistic Nutrition
├── create-paul-henderson.sql           # Paul Henderson - Herbal Medicine
├── create-jessica-porter.sql           # Jessica Porter - Biofeedback
├── create-alex-martinez.sql            # Alex Martinez - AI in Health
├── create-diana-russell.sql            # Diana Russell - Massage Therapy
├── create-michelle-chang.sql           # Michelle Chang - Reiki
├── create-robert-kim.sql               # Robert Kim - Acupressure
├── create-catherine-adams.sql          # Catherine Adams - Couples Therapy
├── create-mark-davidson.sql            # Mark Davidson - Nonviolent Communication
├── EJECUTAR_9_TUTORES_ISEIH.sql        # Script maestro (no funciona en Supabase)
├── README_EJECUTAR_9_TUTORES.md        # Este archivo
└── GUIA_CREAR_TUTORES_ISEIH.md         # Guía completa (referencia)
```

---

**📅 Creado:** 2026-02-12
**👤 Autor:** Claude Code Assistant
**📧 Basado en:** Documento "PERFILES DE TUTORES ISEIH"
