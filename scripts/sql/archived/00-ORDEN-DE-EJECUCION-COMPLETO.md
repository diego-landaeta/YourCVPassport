# 🔥 ORDEN DE EJECUCIÓN COMPLETO - Corrección de Tutores ISEIH

**CRÍTICO**: Ejecutar en este orden EXACTO para evitar errores.

---

## 📋 Resumen de Problemas Detectados

Según validación ejecutada:

1. ❌ **Michelle Chang DUPLICADO** - 2 perfiles en base de datos
2. ❌ **UUID INCORRECTO** - Michelle Chang tiene UUID que pertenece a Nicole Taylor
3. ⚠️ **13 tutores con HEADLINE CORTO** (< 30 caracteres)
4. ❌ **Nicole Taylor FALTA** - Perfil no existe

---

## ✅ Orden de Ejecución (Paso a Paso)

### **PASO 1: Limpiar duplicados de Michelle Chang**
```bash
\i scripts/sql/01-LIMPIAR-duplicados-michelle-chang.sql
```

**Qué hace:**
- Elimina TODO el contenido del perfil con UUID incorrecto (`f30db5f9...`)
- Corrige el nombre en el perfil con UUID correcto (`b214d6b0...`)
- Resetea slug a NULL para evitar conflictos
- Limpia experiencias/skills/certificaciones del UUID correcto para recargar

**Tiempo**: ~1 min

**Resultado esperado:**
```
✅ Solo 1 perfil con email michelle.chang@iseih.edu
✅ UUID: b214d6b0-d516-4446-9d40-4b4bcd17678c
✅ full_name: Michelle Chang (capitalizado)
✅ slug: NULL (listo para asignar)
✅ UUID f30db5f9... limpio (listo para Nicole Taylor)
```

---

### **PASO 2: Crear perfil de Michelle Chang con UUID correcto**
```bash
\i scripts/sql/FIX-michelle-chang-uuid-CORRECTED.sql
```

**Qué hace:**
- Actualiza perfil con UUID `b214d6b0-d516-4446-9d40-4b4bcd17678c`
- Asigna headline, summary sobre Reiki & Energy Work
- Crea 4 experiencias profesionales
- Crea 15 skills relacionados con Reiki
- Crea 4 certificaciones
- Asigna slug `michelle-chang`

**Tiempo**: ~2 min

**Resultado esperado:**
```
✅ Michelle Chang - UUID CORREGIDO
uuid: b214d6b0-d516-4446-9d40-4b4bcd17678c
headline: Reiki Master Teacher...
exp: 4, skills: 15, certs: 4
slug: michelle-chang
```

---

### **PASO 3: Crear perfil de Nicole Taylor**
```bash
\i scripts/sql/create-nicole-taylor-COMPLETE.sql
```

**Qué hace:**
- Usa UUID `f30db5f9-0807-4d48-aa76-de4b6d7278da` (el que antes tenía Michelle)
- Crea perfil completo de Dance/Movement Therapy
- 4 experiencias, 15 skills, 4 certificaciones

**Tiempo**: ~2 min

**Resultado esperado:**
```
✅ Nicole Taylor - LISTO
uuid: f30db5f9-0807-4d48-aa76-de4b6d7278da
headline: Dance/Movement Therapist...
exp: 4, skills: 15, certs: 4
slug: nicole-taylor
```

---

### **PASO 4: Extender headlines cortos**
```bash
\i scripts/sql/fix-headlines-cortos.sql
```

**Qué hace:**
- Extiende headlines de 13 tutores a 40-60 caracteres
- Mantiene especialidad de cada tutor
- Amanda Rodriguez, Brian Cooper, Christopher Barnes, Daniel Foster, etc.

**Tiempo**: ~1 min

**Resultado esperado:**
```
✅ 13 tutores con headlines >= 30 caracteres
```

---

### **PASO 5: Validación completa final**
```bash
\i scripts/sql/validate-all-tutors-content-consistency.sql
```

**Qué hace:**
- Verifica UUID → Email → Nombre
- Detecta slugs duplicados
- Verifica Headline → Especialidad
- Lista perfiles con problemas

**Tiempo**: ~1 min

**Resultado esperado:**
```
✅ Todos los perfiles validados correctamente
✅ Sin UUIDs incorrectos
✅ Sin slugs duplicados
✅ Sin headlines cortos
```

---

## 🎯 Checklist de Verificación

Después de ejecutar todos los scripts, verificar:

```sql
-- ✅ Michelle Chang tiene UUID correcto
SELECT id, full_name, email, slug, LENGTH(headline) as hl_chars
FROM profiles
WHERE email = 'michelle.chang@iseih.edu';
-- Esperado: id = b214d6b0..., slug = michelle-chang, hl_chars >= 30

-- ✅ Nicole Taylor creado correctamente
SELECT id, full_name, email, slug, LENGTH(headline) as hl_chars
FROM profiles
WHERE email = 'nicole.taylor@iseih.edu';
-- Esperado: id = f30db5f9..., slug = nicole-taylor, hl_chars >= 30

-- ✅ NO hay emails duplicados
SELECT email, COUNT(*)
FROM profiles
WHERE role = 'professional'
GROUP BY email
HAVING COUNT(*) > 1;
-- Esperado: 0 filas

-- ✅ NO hay slugs duplicados
SELECT slug, COUNT(*)
FROM profiles
WHERE role = 'professional' AND slug IS NOT NULL
GROUP BY slug
HAVING COUNT(*) > 1;
-- Esperado: 0 filas

-- ✅ Todos tienen headlines >= 30 chars
SELECT full_name, LENGTH(headline) as chars
FROM profiles
WHERE role = 'professional' AND LENGTH(headline) < 30;
-- Esperado: 0 filas
```

---

## 🚨 Errores Comunes y Soluciones

### Error: "Este slug ya está en uso"
**Causa**: No ejecutaste el PASO 1 primero
**Solución**: Volver al PASO 1

### Error: "Profile not found" o "UUID no existe"
**Causa**: El UUID no existe en auth.users
**Solución**: Verificar UUIDs reales en tu base de datos:
```sql
SELECT id, email FROM auth.users
WHERE email IN ('michelle.chang@iseih.edu', 'nicole.taylor@iseih.edu');
```

### Aún aparecen perfiles duplicados
**Solución**: Ejecutar limpieza manual
```sql
-- Ver duplicados
SELECT email, COUNT(*), string_agg(id::text, ', ')
FROM profiles
GROUP BY email
HAVING COUNT(*) > 1;

-- Eliminar perfil específico (usa el UUID incorrecto)
DELETE FROM portfolio_items WHERE profile_id = 'uuid-incorrecto';
DELETE FROM skills WHERE profile_id = 'uuid-incorrecto';
DELETE FROM experiences WHERE profile_id = 'uuid-incorrecto';
DELETE FROM profiles WHERE id = 'uuid-incorrecto';
```

---

## 📊 Resumen

| Paso | Script | Objetivo | Tiempo |
|------|--------|----------|--------|
| 1 | 01-LIMPIAR-duplicados-michelle-chang.sql | Limpiar duplicados | 1 min |
| 2 | FIX-michelle-chang-uuid-CORRECTED.sql | Crear Michelle Chang correcto | 2 min |
| 3 | create-nicole-taylor-COMPLETE.sql | Crear Nicole Taylor | 2 min |
| 4 | fix-headlines-cortos.sql | Extender 13 headlines | 1 min |
| 5 | validate-all-tutors-content-consistency.sql | Validar todo | 1 min |

**Total**: ~7 minutos

---

**Creado**: 2026-02-12
**Documentación**: [TUTORS-UUID-EMAIL-MAPPING.md](./TUTORS-UUID-EMAIL-MAPPING.md)
