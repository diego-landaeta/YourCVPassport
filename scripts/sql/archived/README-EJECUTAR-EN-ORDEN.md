# 🚨 ORDEN DE EJECUCIÓN - Scripts de Corrección

**IMPORTANTE**: Ejecutar estos scripts EN ORDEN para evitar errores.

---

## ✅ Orden Correcto de Ejecución

### 1. PREPARACIÓN (Soluciona conflicto de slug)
```sql
\i scripts/sql/00-PREPARAR-michelle-chang-PRIMERO.sql
```
**Qué hace:**
- Libera el slug 'michelle-chang' que está duplicado
- Resetea slugs de Michelle Chang a NULL
- Prepara para asignación correcta

**Resultado esperado:**
```
✅ SLUG LIBERADO para todos los perfiles de Michelle Chang
```

---

### 2. CORRECCIÓN MICHELLE CHANG
```sql
\i scripts/sql/FIX-michelle-chang-uuid-CORRECTED.sql
```
**Qué hace:**
- Actualiza perfil con UUID correcto: `b214d6b0-d516-4446-9d40-4b4bcd17678c`
- Asigna slug `michelle-chang` al UUID correcto
- Crea 4 experiencias, 15 skills, 4 certificaciones

**Resultado esperado:**
```
✅ Michelle Chang - UUID CORREGIDO
uuid: b214d6b0-d516-4446-9d40-4b4bcd17678c
exp: 4, skills: 15, certs: 4
```

---

### 3. CREACIÓN NICOLE TAYLOR
```sql
\i scripts/sql/create-nicole-taylor-COMPLETE.sql
```
**Qué hace:**
- Crea perfil completo con UUID: `f30db5f9-0807-4d48-aa76-de4b6d7278da`
- Especialidad: Dance/Movement Therapy
- 4 experiencias, 15 skills, 4 certificaciones

**Resultado esperado:**
```
✅ Nicole Taylor - LISTO
uuid: f30db5f9-0807-4d48-aa76-de4b6d7278da
headline: Dance/Movement Therapist...
exp: 4, skills: 15, certs: 4
```

---

### 4. VALIDACIÓN COMPLETA
```sql
\i scripts/sql/validate-all-tutors-content-consistency.sql
```
**Qué hace:**
- Verifica UUID → Email → Nombre coherencia
- Detecta slugs duplicados
- Verifica Headline → Especialidad
- Identifica perfiles con problemas

**Resultado esperado:**
```
✅ Todos los perfiles validados
❌ Lista de perfiles con problemas (si los hay)
```

---

## 🔧 Si Algo Sale Mal

### Error: "Este slug ya está en uso"
**Solución**: Ejecutaste el paso 2 antes del paso 1
```sql
-- Volver al paso 1
\i scripts/sql/00-PREPARAR-michelle-chang-PRIMERO.sql
```

### Error: "UUID no existe" o "Profile not found"
**Posibles causas**:
1. El UUID no existe en auth.users (necesitas crear usuario en Supabase Auth primero)
2. El UUID es diferente al esperado

**Solución**: Verificar UUIDs en base de datos
```sql
SELECT id, email, raw_user_meta_data->>'full_name' as name
FROM auth.users
WHERE email IN ('michelle.chang@iseih.edu', 'nicole.taylor@iseih.edu');
```

### Perfiles duplicados detectados
**Solución**: Ejecutar validación y decidir cuál eliminar
```sql
-- Ver duplicados
SELECT email, COUNT(*), string_agg(id::text, ', ')
FROM profiles
WHERE role = 'professional'
GROUP BY email
HAVING COUNT(*) > 1;

-- Eliminar perfil incorrecto (ejemplo)
DELETE FROM profiles WHERE id = 'uuid-del-perfil-incorrecto';
```

---

## 📊 Verificación Final

Después de ejecutar todos los scripts, verificar:

```sql
-- Verificar Michelle Chang
SELECT id, full_name, email, slug, headline
FROM profiles
WHERE email = 'michelle.chang@iseih.edu';
-- Esperado: id = 'b214d6b0...', slug = 'michelle-chang'

-- Verificar Nicole Taylor
SELECT id, full_name, email, slug, headline
FROM profiles
WHERE email = 'nicole.taylor@iseih.edu';
-- Esperado: id = 'f30db5f9...', slug = 'nicole-taylor'

-- Verificar NO hay duplicados
SELECT slug, COUNT(*)
FROM profiles
WHERE role = 'professional' AND slug IS NOT NULL
GROUP BY slug
HAVING COUNT(*) > 1;
-- Esperado: 0 filas (no duplicados)
```

---

## 🎯 Resumen

| Paso | Script | Tiempo | Crítico |
|------|--------|--------|---------|
| 1 | 00-PREPARAR-michelle-chang-PRIMERO.sql | 1 min | ✅ SÍ |
| 2 | FIX-michelle-chang-uuid-CORRECTED.sql | 2 min | ✅ SÍ |
| 3 | create-nicole-taylor-COMPLETE.sql | 2 min | ✅ SÍ |
| 4 | validate-all-tutors-content-consistency.sql | 1 min | ⚠️ Recomendado |

**Total**: ~6 minutos

---

**Creado**: 2026-02-12
**Documentación**: Ver [TUTORS-UUID-EMAIL-MAPPING.md](./TUTORS-UUID-EMAIL-MAPPING.md)
