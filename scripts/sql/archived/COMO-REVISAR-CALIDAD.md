# 📋 Cómo Revisar la Calidad de los Perfiles para CV

## 🎯 Objetivo
Verificar que todos los perfiles profesionales tienen información completa y de calidad suficiente para generar CVs profesionales.

---

## ⚡ Instrucciones Rápidas

### PASO 1: Resumen General
Ejecuta esta consulta primero para ver el panorama completo:

```sql
SELECT
    p.full_name as "Nombre",
    CASE WHEN p.photo_url IS NOT NULL THEN '✅' ELSE '❌' END as "Foto",
    CASE WHEN p.summary IS NOT NULL AND LENGTH(p.summary) > 100 THEN '✅ ' || LENGTH(p.summary) ELSE '❌' END as "Summary",
    CASE WHEN p.headline IS NOT NULL AND LENGTH(p.headline) > 20 THEN '✅ ' || LENGTH(p.headline) ELSE '⚠️ ' || COALESCE(LENGTH(p.headline)::text, '0') END as "Headline",
    (SELECT COUNT(*) FROM experiences WHERE profile_id = p.id) as "Exp",
    (SELECT SUM(array_length(achievements, 1)) FROM experiences WHERE profile_id = p.id) as "Achiev",
    (SELECT COUNT(*) FROM education WHERE profile_id = p.id) as "Edu",
    (SELECT COUNT(*) FROM skills WHERE profile_id = p.id) as "Skills",
    (SELECT COUNT(*) FROM languages WHERE profile_id = p.id) as "Lang",
    (SELECT COUNT(*) FROM portfolio_items WHERE profile_id = p.id AND type = 'CERTIFICATION') as "Certs",
    (SELECT COUNT(*) FROM profile_stamps WHERE profile_id = p.id) as "Stamps"
FROM public.profiles p
WHERE p.role = 'professional'
ORDER BY p.full_name;
```

**Copia y pega el resultado completo.**

---

### PASO 2: Verificación de Problemas
Ejecuta esta consulta para ver si hay problemas de calidad:

```sql
SELECT
    p.full_name as "Nombre",
    CASE
        WHEN p.summary IS NULL OR LENGTH(p.summary) < 200 THEN '⚠️ Summary muy corto'
        WHEN LENGTH(p.summary) > 800 THEN '❌ Summary excede límite'
        ELSE '✅ Summary OK'
    END as "Summary",
    CASE
        WHEN p.headline IS NULL OR LENGTH(p.headline) < 30 THEN '⚠️ Headline muy corto'
        WHEN LENGTH(p.headline) > 150 THEN '❌ Headline excede límite'
        ELSE '✅ Headline OK'
    END as "Headline",
    CASE
        WHEN (SELECT COUNT(*) FROM experiences WHERE profile_id = p.id) < 3 THEN '⚠️ Pocas experiencias'
        WHEN (SELECT COUNT(*) FROM experiences WHERE profile_id = p.id) >= 4 THEN '✅ Buena cantidad'
        ELSE '✓ Aceptable'
    END as "Experiencias",
    CASE
        WHEN (SELECT COUNT(*) FROM skills WHERE profile_id = p.id) < 8 THEN '⚠️ Pocos skills'
        WHEN (SELECT COUNT(*) FROM skills WHERE profile_id = p.id) >= 12 THEN '✅ Buena cantidad'
        ELSE '✓ Aceptable'
    END as "Skills",
    CASE
        WHEN (SELECT COUNT(*) FROM portfolio_items WHERE profile_id = p.id AND type = 'CERTIFICATION') < 3 THEN '⚠️ Pocas certificaciones'
        WHEN (SELECT COUNT(*) FROM portfolio_items WHERE profile_id = p.id AND type = 'CERTIFICATION') >= 5 THEN '✅ Buena cantidad'
        ELSE '✓ Aceptable'
    END as "Certificaciones",
    CASE
        WHEN p.photo_url IS NULL THEN '❌ Sin foto'
        ELSE '✅ Con foto'
    END as "Foto"
FROM public.profiles p
WHERE p.role = 'professional'
ORDER BY p.full_name;
```

**Copia y pega el resultado completo.**

---

## 📊 Criterios de Calidad para CV

### ✅ EXCELENTE (Listo para CV profesional)
- Summary: 400-800 caracteres, bien escrito, específico
- Headline: 50-150 caracteres, claro y profesional
- Experiencias: 4+ con achievements detallados
- Skills: 12-20 skills con niveles apropiados
- Educación: 3-4 títulos relevantes
- Certificaciones: 5-8 certificaciones profesionales
- Idiomas: 2+ idiomas
- Foto: Profesional y de calidad

### ✓ BUENO (Aceptable para CV)
- Summary: 200-400 caracteres
- Headline: 30-50 caracteres
- Experiencias: 3-4
- Skills: 8-12 skills
- Educación: 2-3 títulos
- Certificaciones: 3-5
- Idiomas: 2
- Foto: Presente

### ⚠️ MEJORABLE (Necesita trabajo)
- Summary: < 200 caracteres o muy genérico
- Headline: < 30 caracteres
- Experiencias: < 3
- Skills: < 8
- Certificaciones: < 3
- Sin foto

### ❌ INSUFICIENTE (No apto para CV)
- Summary: Vacío o < 100 caracteres
- Experiencias: < 2
- Skills: < 5
- Sin educación
- Sin certificaciones

---

## 📁 Scripts Disponibles

| Archivo | Uso |
|---------|-----|
| `review-profile-quality.sql` | Script completo con 10 pasos de análisis |
| `get-all-profile-data.sql` | Extracción detallada de toda la información |

---

## 🔍 Qué Revisar Específicamente

### 1. **SUMMARIES**
- ¿Están bien escritos y son profesionales?
- ¿Son específicos o muy genéricos?
- ¿Mencionan experiencia concreta y valores únicos?
- ¿Tienen buena estructura (qué hace, cómo lo hace, para quién)?

### 2. **EXPERIENCIAS**
- ¿Cada experiencia tiene descripción clara?
- ¿Los achievements son específicos y cuantificables?
- ¿Las fechas son coherentes?
- ¿Los cargos y empresas son apropiados?

### 3. **SKILLS**
- ¿Son relevantes para el área profesional?
- ¿Los niveles (Expert/Advanced/Intermediate) son apropiados?
- ¿Hay suficiente variedad?

### 4. **EDUCACIÓN**
- ¿Títulos completos y correctos?
- ¿Instituciones reconocidas?
- ¿Fechas coherentes?

### 5. **CERTIFICACIONES**
- ¿Son relevantes y profesionales?
- ¿Tienen emisores válidos?
- ¿Las descripciones explican el valor?

---

## 📤 Qué Compartir

Después de ejecutar los PASO 1 y PASO 2, comparte:

1. **Screenshot o texto** del PASO 1 (tabla resumen)
2. **Screenshot o texto** del PASO 2 (verificación de problemas)
3. **Cualquier observación** que notes sobre la calidad

Con esa información podré:
- Identificar qué perfiles necesitan mejoras
- Sugerir correcciones específicas
- Priorizar los cambios necesarios

---

## ⚡ Quick Start

```bash
# 1. Abrir Supabase SQL Editor
# 2. Copiar y ejecutar PASO 1
# 3. Copiar y ejecutar PASO 2
# 4. Compartir resultados
```

**Tiempo:** ~2 minutos ⚡
