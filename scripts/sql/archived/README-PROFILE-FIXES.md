# 🔧 Guía de Corrección de Perfiles ISEIH

Esta guía te ayudará a aplicar todas las correcciones para mejorar la calidad de los perfiles de tutores ISEIH.

---

## 📋 ORDEN DE EJECUCIÓN

Ejecuta los scripts en este orden en Supabase SQL Editor:

### 1. ✅ Ocultar Carlos Saiz
**Archivo**: `hide-carlos-saiz.sql`
**Qué hace**: Cambia el `role` de Carlos Saiz a 'archived' para que no aparezca en listas públicas.

```sql
-- Copiar y ejecutar el contenido de: hide-carlos-saiz.sql
```

**Verificación esperada**: 1 fila actualizada, role = 'archived'

---

### 2. ✅ Extender Headlines Cortos
**Archivo**: `fix-short-headlines.sql`
**Qué hace**: Extiende los headlines de 4 tutores de 14-19 chars a 54-66 chars.

**Perfiles afectados**:
- Priya Sharma: 14 → 66 chars
- Janet Lee: 16 → 57 chars
- Lisa Morrison: 17 → 58 chars
- Emily Harper: 19 → 54 chars

```sql
-- Copiar y ejecutar el contenido de: fix-short-headlines.sql
```

**Verificación esperada**: 4 filas actualizadas, todos con > 30 chars

---

### 3. ✅ Agregar Skills Faltantes
**Archivo**: `add-missing-skills.sql`
**Qué hace**: Agrega 2-4 skills a perfiles con < 12 skills.

**Perfiles afectados**:
- Christopher Barnes: +2 skills (Physical Therapy, Movement Assessment)
- Linda Zhang: +2 skills (Herbal Medicine, Pulse Diagnosis)
- Priya Sharma: +2 skills (Dosha Assessment, Panchakarma)
- Marta Ruiz Serrano: +4 skills (HVAC, Energy Efficiency, etc.)

```sql
-- Copiar y ejecutar el contenido de: add-missing-skills.sql
```

**Verificación esperada**: 10 skills insertados

---

### 4. ✅ Agregar Certificaciones Faltantes
**Archivo**: `add-missing-certifications.sql`
**Qué hace**: Agrega 1 certificación a perfiles con solo 2 certs.

**Perfiles afectados**:
- Daniel Foster: +1 cert (Advanced Statistical Methods)
- Lisa Morrison: +1 cert (Trauma-Informed Expressive Arts)
- Marcus Williams: +1 cert (Theatre of the Oppressed)
- Patricia Coleman: +1 cert (Qualitative Research Methods)
- Thomas Rivera: +1 cert (Philosophy for Life Facilitator)

```sql
-- Copiar y ejecutar el contenido de: add-missing-certifications.sql
```

**Verificación esperada**: 5 certificaciones insertadas

---

### 5. ✅ Corregir Skills Restantes
**Archivo**: `fix-remaining-skills.sql`
**Qué hace**: Agrega 1 skill adicional a 3 perfiles que quedaron con 11 skills.

**Perfiles afectados**:
- Christopher Barnes: +1 skill (Biomechanics Assessment)
- Linda Zhang: +1 skill (Qi Gong Therapy)
- Priya Sharma: +1 skill (Marma Therapy)

```sql
-- Copiar y ejecutar el contenido de: fix-remaining-skills.sql
```

**Verificación esperada**: 3 skills insertados, todos los perfiles con >= 12 skills

---

### 6. ✅ Verificación Final
**Archivo**: `verify-all-fixes.sql`
**Qué hace**: Ejecuta 6 verificaciones completas para confirmar que todo está correcto.

```sql
-- Copiar y ejecutar el contenido de: verify-all-fixes.sql
```

**Resultado esperado**:
```
1. Carlos Saiz: ✅ CORRECTO - Oculto
2. Headlines: ✅ CORRECTO - Todos >= 30 chars
3. Skills: ✅ CORRECTO - Todos >= 12 skills
4. Certificaciones: ✅ CORRECTO - Todos >= 3 certs
5. Resumen: ~30 perfiles profesionales activos
6. Perfiles: Mayoría con calidad "✅ EXCELENTE"
```

---

## 📊 IMPACTO ESPERADO

### Antes de las correcciones:
- ❌ 1 perfil basura (Carlos Saiz)
- ⚠️ 4 headlines muy cortos (< 20 chars)
- ⚠️ 4 perfiles con pocos skills (< 12)
- ⚠️ 5 perfiles con pocas certs (< 3)

### Después de las correcciones:
- ✅ Carlos Saiz oculto
- ✅ 100% headlines >= 30 chars
- ✅ 100% perfiles con >= 12 skills
- ✅ 100% perfiles con >= 3 certs
- ✅ **~90% perfiles con calidad EXCELENTE**

---

## 🎯 CRITERIOS DE CALIDAD

Un perfil de **calidad EXCELENTE** cumple:
- ✅ Summary: 200-800 caracteres
- ✅ Headline: >= 30 caracteres
- ✅ Experiencias: >= 3
- ✅ Skills: >= 12
- ✅ Certificaciones: >= 3
- ✅ Idiomas: >= 2
- ✅ Achievements: >= 15

---

## 📁 ARCHIVOS INCLUIDOS

1. **hide-carlos-saiz.sql** - Oculta Carlos Saiz
2. **fix-short-headlines.sql** - Extiende headlines cortos
3. **add-missing-skills.sql** - Agrega skills faltantes (primera ronda)
4. **add-missing-certifications.sql** - Agrega certificaciones faltantes
5. **fix-remaining-skills.sql** - Completa skills restantes (corrección adicional)
6. **verify-all-fixes.sql** - Verificación completa
7. **PROFILE-QUALITY-REPORT.md** - Reporte detallado del análisis

---

## ⚠️ NOTAS IMPORTANTES

1. **Backup**: No es necesario hacer backup ya que estos scripts NO eliminan datos, solo agregan y actualizan.

2. **Orden**: Ejecuta los scripts en el orden indicado. El script de verificación debe ser el último.

3. **Errores**: Si algún INSERT falla con "duplicate key", significa que ese skill o certificación ya existe. Esto es normal y seguro.

4. **Carlos Saiz**: El perfil NO se elimina, solo se oculta cambiando `role = 'archived'`. Puede restaurarse cambiando de vuelta a `role = 'professional'`.

5. **Marta Ruiz Serrano**: Si NO es tutor ISEIH, considera ejecutar:
   ```sql
   UPDATE profiles SET role = 'archived' WHERE full_name = 'Marta Ruiz Serrano';
   ```

---

## 🔍 VALIDACIÓN ADICIONAL

Después de ejecutar todos los scripts, puedes ejecutar la validación completa:

```sql
-- Script completo de validación de calidad
-- Ver: review-profile-quality.sql (PASO 1 y PASO 9)
```

---

## 📞 SOPORTE

Si encuentras algún problema:
1. Lee el mensaje de error completo
2. Verifica que ejecutaste los scripts en orden
3. Consulta el archivo `PROFILE-QUALITY-REPORT.md` para contexto adicional

---

**Última actualización**: 2026-02-12
**Versión**: 1.0
