# 🚀 Cómo Ejecutar la Validación de Límites

## ⚡ Script Recomendado (MÁS SIMPLE)

**Ejecuta este primero para ver el resumen general:**

```sql
-- Archivo: validate-schema-limits-simple.sql
```

**Resultado esperado:**
```
metrica                      | valor
----------------------------|-------
Total Perfiles              | 12
Summaries > 800 chars       | 0
Achievements > 200 chars    | 0
Experience Desc > 800       | 0
Education Desc > 600        | 0
Certification Desc > 500    | 0
```

✅ Si todos los valores (excepto Total Perfiles) son **0**, ¡TODO ESTÁ BIEN!

---

## 📊 Script Detallado (PARA REVISAR EN DETALLE)

**Si quieres ver cada campo individualmente:**

```sql
-- Archivo: validate-profiles-detailed.sql
```

Este script tiene 6 secciones que puedes ejecutar **una por una**:

1. **Summaries** - Ver longitud de cada summary
2. **Achievements** - Ver achievements más largos
3. **Experience Descriptions** - Ver descriptions de experiencias
4. **Education Descriptions** - Ver descriptions de educación
5. **Certification Descriptions** - Ver descriptions de certificaciones
6. **Validación Completa** - Resumen por perfil

---

## 🎯 Cómo Ejecutar en Supabase

### Opción A: Todo el Script
1. Ir a Supabase Dashboard
2. **SQL Editor** → **New Query**
3. Copiar todo el contenido de `validate-schema-limits-simple.sql`
4. **Run** (Ctrl + Enter)

### Opción B: Sección por Sección
1. Ir a Supabase Dashboard
2. **SQL Editor** → **New Query**
3. Copiar **solo una sección** de `validate-profiles-detailed.sql`
4. **Run** (Ctrl + Enter)
5. Revisar resultados
6. Repetir con la siguiente sección

---

## 📋 Interpretación de Resultados

### ✅ TODO BIEN
```
metrica                      | valor
----------------------------|-------
Total Perfiles              | 12
Summaries > 800 chars       | 0     ← ✅ PERFECTO
Achievements > 200 chars    | 0     ← ✅ PERFECTO
Experience Desc > 800       | 0     ← ✅ PERFECTO
Education Desc > 600        | 0     ← ✅ PERFECTO
Certification Desc > 500    | 0     ← ✅ PERFECTO
```

### ⚠️ HAY PROBLEMAS
```
metrica                      | valor
----------------------------|-------
Total Perfiles              | 12
Summaries > 800 chars       | 3     ← ❌ 3 perfiles exceden límite
Achievements > 200 chars    | 15    ← ❌ 15 achievements exceden límite
```

**Acción:** Ejecutar `validate-profiles-detailed.sql` para ver **cuáles** perfiles tienen problemas.

---

## 🔧 Si Hay Violaciones de Límites

### Paso 1: Identificar el problema
```sql
-- Ejecutar sección específica de validate-profiles-detailed.sql
-- Por ejemplo, sección 1 para ver summaries
```

### Paso 2: Ver el contenido exacto
```sql
SELECT full_name, summary, LENGTH(summary) as chars
FROM profiles
WHERE role = 'professional'
  AND LENGTH(summary) > 800
ORDER BY LENGTH(summary) DESC;
```

### Paso 3: Acortar manualmente
```sql
UPDATE profiles
SET summary = 'NUEVO SUMMARY ACORTADO (MAX 800 CHARS)'
WHERE id = 'UUID_DEL_PERFIL';
```

---

## 📁 Archivos Disponibles

| Archivo | Propósito | Cuándo Usar |
|---------|-----------|-------------|
| `validate-schema-limits-simple.sql` | Resumen rápido | ✅ **EMPEZAR AQUÍ** |
| `validate-profiles-detailed.sql` | Análisis detallado | Si hay problemas |
| `validate-schema-limits-v2.sql` | ⚠️ Tiene errores sintaxis | NO USAR en Supabase |

---

## ⚡ Quick Start (3 pasos)

```bash
# 1. Abrir Supabase SQL Editor
# 2. Copiar contenido de validate-schema-limits-simple.sql
# 3. Ejecutar (Run)
```

**Tiempo estimado:** 10 segundos ⚡

---

## 🎯 Límites Actuales del Schema

| Campo | Límite |
|-------|--------|
| Summary | 800 chars |
| Headline | 150 chars |
| Full Name | 50 chars |
| Achievements | 200 chars (cada uno) |
| Experience Description | 800 chars |
| Education Description | 600 chars |
| Certification Description | 500 chars |
| Position/Degree/Institution | 100 chars |
| Categories | 50 chars |

---

## ✅ Resultado Esperado

**Con los nuevos límites aumentados (800 para summary, 200 para achievements), es MUY probable que TODOS los perfiles pasen la validación.**

Si hay violaciones, serán mínimas y fáciles de corregir.

---

**¿Dudas?** Consulta `schemas/SCHEMA_LIMITS_UPDATE.md` para más detalles.
