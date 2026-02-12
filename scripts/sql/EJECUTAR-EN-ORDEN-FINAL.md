# 🚀 SCRIPTS LIMPIOS - Orden de Ejecución

Ejecutar estos 3 scripts EN ORDEN para limpiar y recrear Michelle Chang y Nicole Taylor.

---

## ✅ PASO 1: Eliminar todo

```bash
\i scripts/sql/DELETE-michelle-chang-y-nicole-taylor.sql
```

**Qué hace:**
- Elimina TODO el contenido de Michelle Chang (todos los perfiles)
- Elimina TODO el contenido de Nicole Taylor (todos los perfiles)
- Resetea perfiles a estado inicial limpio

**Tiempo**: 1 min

**Resultado esperado:**
```
✅ Todos los contadores en 0 (exp: 0, skills: 0, certs: 0)
✅ full_name, headline, summary, slug = NULL
✅ Listos para crear desde cero
```

---

## ✅ PASO 2: Crear Michelle Chang

```bash
\i scripts/sql/CREATE-michelle-chang-LIMPIO.sql
```

**Qué hace:**
- UUID: `7fe0c1a6-39ed-46ad-9388-116a3a0fb429`
- Crea perfil completo de Reiki & Energy Work
- 4 experiencias, 15 skills, 4 certificaciones

**Tiempo**: 2 min

**Resultado esperado:**
```
✅ Michelle Chang - CREADO
uuid: 7fe0c1a6-39ed-46ad-9388-116a3a0fb429
email: michelle.chang@iseih.edu
slug: michelle-chang
headline: Reiki Master Teacher...
exp: 4, skills: 15, certs: 4
```

---

## ✅ PASO 3: Crear Nicole Taylor

```bash
\i scripts/sql/CREATE-nicole-taylor-LIMPIO.sql
```

**Qué hace:**
- UUID: `1b90b431-de09-4b75-af6a-c94975b68746`
- Crea perfil completo de Dance/Movement Therapy
- 4 experiencias, 15 skills, 4 certificaciones

**Tiempo**: 2 min

**Resultado esperado:**
```
✅ Nicole Taylor - CREADO
uuid: 1b90b431-de09-4b75-af6a-c94975b68746
email: nicole.taylor@iseih.edu
slug: nicole-taylor
headline: Dance/Movement Therapist...
exp: 4, skills: 15, certs: 4
```

---

## 🎯 Verificación Final

```sql
-- Verificar ambos perfiles creados correctamente
SELECT
    id as uuid,
    full_name,
    email,
    slug,
    LENGTH(headline) as hl_chars,
    (SELECT COUNT(*) FROM experiences WHERE profile_id = profiles.id) as exp,
    (SELECT COUNT(*) FROM skills WHERE profile_id = profiles.id) as skills,
    (SELECT COUNT(*) FROM portfolio_items WHERE profile_id = profiles.id AND type = 'CERTIFICATION') as certs
FROM profiles
WHERE email IN ('michelle.chang@iseih.edu', 'nicole.taylor@iseih.edu')
ORDER BY email;
```

**Resultado esperado:**
```
michelle.chang@iseih.edu → exp: 4, skills: 15, certs: 4, slug: michelle-chang
nicole.taylor@iseih.edu  → exp: 4, skills: 15, certs: 4, slug: nicole-taylor
```

---

## 📊 Resumen

| Paso | Archivo | Tiempo |
|------|---------|--------|
| 1 | DELETE-michelle-chang-y-nicole-taylor.sql | 1 min |
| 2 | CREATE-michelle-chang-LIMPIO.sql | 2 min |
| 3 | CREATE-nicole-taylor-LIMPIO.sql | 2 min |

**Total**: ~5 minutos

---

✅ **LISTO** - Scripts limpios sin conflictos de UUIDs o slugs duplicados.
