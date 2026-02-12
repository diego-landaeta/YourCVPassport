# 📁 Scripts SQL Útiles - YourCVPassport

**Fecha**: 2026-02-12
**Propósito**: Referencia de scripts SQL activos y funcionales

---

## ✅ Scripts Activos (en uso)

### 🎯 Gestión de Tutores ISEIH

| Script | Descripción | Uso |
|--------|-------------|-----|
| **CREATE-michelle-chang-LIMPIO.sql** | Crear perfil completo Michelle Chang (Reiki) | `\i scripts/sql/CREATE-michelle-chang-LIMPIO.sql` |
| **CREATE-nicole-taylor-LIMPIO.sql** | Crear perfil completo Nicole Taylor (Dance Therapy) | `\i scripts/sql/CREATE-nicole-taylor-LIMPIO.sql` |
| **DELETE-michelle-chang-y-nicole-taylor.sql** | Limpiar perfiles de Michelle y Nicole | `\i scripts/sql/DELETE-michelle-chang-y-nicole-taylor.sql` |
| **EJECUTAR-EN-ORDEN-FINAL.md** | Guía de ejecución paso a paso | Referencia |

### 🔍 Validación y Calidad

| Script | Descripción | Uso |
|--------|-------------|-----|
| **validate-all-tutors-content-consistency.sql** | Validar coherencia de contenido de todos los tutores | `\i scripts/sql/validate-all-tutors-content-consistency.sql` |
| **fix-headlines-cortos.sql** | Extender headlines que son demasiado cortos | `\i scripts/sql/fix-headlines-cortos.sql` |

### 📸 Gestión de Fotos de Perfil

| Script | Descripción | Uso |
|--------|-------------|-----|
| **check-tutors-missing-photos.sql** | Ver qué tutores no tienen foto de perfil | `\i scripts/sql/check-tutors-missing-photos.sql` |
| **update-tutor-photo.sql** | Template para actualizar avatar_url de tutores | Editar y ejecutar |
| **COMO-ACTUALIZAR-FOTOS-TUTORES.md** | Guía completa para subir y actualizar fotos | Referencia |

### 🗂️ Referencia y Documentación

| Script | Descripción | Uso |
|--------|-------------|-----|
| **TUTORS-UUID-EMAIL-MAPPING.md** | Mapeo UUID-Email-Especialidad de tutores | Referencia |
| **delete-test-job-postings.sql** | Eliminar job postings de prueba | `\i scripts/sql/delete-test-job-postings.sql` |

---

## 🗄️ Scripts Archivados

Todos los demás scripts (183 archivos) han sido movidos a:
```
scripts/sql/archived/
```

Ver el índice completo en:
```
scripts/sql/archived/INDEX.md
```

---

## 📋 Orden de Ejecución Recomendado

### Crear Tutores Nuevos
```bash
# 1. Eliminar datos previos (si existe)
\i scripts/sql/DELETE-michelle-chang-y-nicole-taylor.sql

# 2. Crear Michelle Chang
\i scripts/sql/CREATE-michelle-chang-LIMPIO.sql

# 3. Crear Nicole Taylor
\i scripts/sql/CREATE-nicole-taylor-LIMPIO.sql

# 4. Validar creación
\i scripts/sql/validate-all-tutors-content-consistency.sql
```

### Validar Calidad de Perfiles
```bash
# 1. Verificar headlines cortos
\i scripts/sql/fix-headlines-cortos.sql

# 2. Validar coherencia completa
\i scripts/sql/validate-all-tutors-content-consistency.sql

# 3. Ver tutores sin foto
\i scripts/sql/check-tutors-missing-photos.sql
```

---

## ⚠️ Notas Importantes

1. **Backups**: Siempre hacer backup antes de ejecutar scripts UPDATE/DELETE
2. **UUIDs Correctos**:
   - Michelle Chang: `7fe0c1a6-39ed-46ad-9388-116a3a0fb429`
   - Nicole Taylor: `1b90b431-de09-4b75-af6a-c94975b68746`
3. **Template**: Todos los tutores ISEIH usan `template = 'passport'` (lowercase)
4. **Calidad Mínima**:
   - Headline ≥ 30 caracteres
   - Summary ≥ 200 caracteres
   - 4+ experiencias
   - 15+ skills
   - 4+ certificaciones

---

**Última actualización**: 2026-02-12
**Total scripts activos**: 10
**Total scripts archivados**: ~173
