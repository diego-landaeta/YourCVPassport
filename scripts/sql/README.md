# 📁 Scripts SQL - YourCVPassport

**Última actualización**: 2026-02-12
**Total de scripts activos**: 12
**Total de scripts archivados**: 168

---

## 🎯 Inicio Rápido

### Scripts Más Usados

```bash
# Ver tutores sin foto de perfil
\i scripts/sql/check-tutors-missing-photos.sql

# Validar calidad de todos los tutores
\i scripts/sql/validate-all-tutors-content-consistency.sql

# Crear Michelle Chang desde cero
\i scripts/sql/CREATE-michelle-chang-LIMPIO.sql

# Crear Nicole Taylor desde cero
\i scripts/sql/CREATE-nicole-taylor-LIMPIO.sql
```

---

## 📂 Estructura de Carpetas

```
scripts/sql/
├── README.md                                    ← Estás aquí
├── SCRIPTS-UTILES.md                            ← Índice completo de scripts activos
│
├── 🎯 Scripts de Creación de Tutores
│   ├── CREATE-michelle-chang-LIMPIO.sql         ← Crear Michelle Chang (Reiki)
│   ├── CREATE-nicole-taylor-LIMPIO.sql          ← Crear Nicole Taylor (Dance Therapy)
│   └── DELETE-michelle-chang-y-nicole-taylor.sql ← Limpiar ambos perfiles
│
├── 🔍 Scripts de Validación
│   ├── validate-all-tutors-content-consistency.sql ← Validar coherencia completa
│   └── fix-headlines-cortos.sql                    ← Extender headlines cortos
│
├── 📸 Scripts de Gestión de Fotos
│   ├── check-tutors-missing-photos.sql          ← Ver tutores sin foto
│   └── update-tutor-photo.sql                   ← Template para actualizar fotos
│
├── 📚 Documentación
│   ├── TUTORS-UUID-EMAIL-MAPPING.md             ← Mapeo UUID-Email-Especialidad
│   ├── EJECUTAR-EN-ORDEN-FINAL.md               ← Guía de ejecución paso a paso
│   └── COMO-ACTUALIZAR-FOTOS-TUTORES.md         ← Guía completa de fotos
│
├── 🧹 Utilidades
│   └── delete-test-job-postings.sql             ← Eliminar job postings de prueba
│
└── 🗄️ archived/
    ├── INDEX.md                                  ← Índice de 168 scripts archivados
    └── [168 archivos archivados]                 ← Scripts obsoletos, debugging, etc.
```

---

## 🚀 Casos de Uso Comunes

### 1. Crear un Tutor Nuevo desde Cero

```bash
# Paso 1: Limpiar datos previos (si existen)
\i scripts/sql/DELETE-michelle-chang-y-nicole-taylor.sql

# Paso 2: Crear el tutor
\i scripts/sql/CREATE-michelle-chang-LIMPIO.sql

# Paso 3: Validar creación
\i scripts/sql/validate-all-tutors-content-consistency.sql
```

Ver guía completa: [EJECUTAR-EN-ORDEN-FINAL.md](EJECUTAR-EN-ORDEN-FINAL.md)

---

### 2. Validar Calidad de Perfiles

```bash
# Verificar coherencia de contenido
\i scripts/sql/validate-all-tutors-content-consistency.sql

# Extender headlines que son muy cortos
\i scripts/sql/fix-headlines-cortos.sql
```

---

### 3. Gestionar Fotos de Perfil

```bash
# Ver qué tutores no tienen foto
\i scripts/sql/check-tutors-missing-photos.sql

# Actualizar foto de un tutor (editar el script primero)
\i scripts/sql/update-tutor-photo.sql
```

Ver guía completa: [COMO-ACTUALIZAR-FOTOS-TUTORES.md](COMO-ACTUALIZAR-FOTOS-TUTORES.md)

---

## 📋 Referencia de UUIDs

### Tutores Críticos

| Nombre | Email | UUID |
|--------|-------|------|
| Michelle Chang | michelle.chang@iseih.edu | `7fe0c1a6-39ed-46ad-9388-116a3a0fb429` |
| Nicole Taylor | nicole.taylor@iseih.edu | `1b90b431-de09-4b75-af6a-c94975b68746` |

Ver mapeo completo: [TUTORS-UUID-EMAIL-MAPPING.md](TUTORS-UUID-EMAIL-MAPPING.md)

---

## 📖 Documentación Completa

| Documento | Descripción |
|-----------|-------------|
| [SCRIPTS-UTILES.md](SCRIPTS-UTILES.md) | Índice completo de scripts activos con ejemplos |
| [TUTORS-UUID-EMAIL-MAPPING.md](TUTORS-UUID-EMAIL-MAPPING.md) | Mapeo UUID-Email-Especialidad de todos los tutores |
| [EJECUTAR-EN-ORDEN-FINAL.md](EJECUTAR-EN-ORDEN-FINAL.md) | Guía paso a paso para crear Michelle y Nicole |
| [COMO-ACTUALIZAR-FOTOS-TUTORES.md](COMO-ACTUALIZAR-FOTOS-TUTORES.md) | Guía completa para gestionar fotos de perfil |
| [archived/INDEX.md](archived/INDEX.md) | Índice de 168 scripts archivados |

---

## 🗄️ Scripts Archivados

168 scripts han sido movidos a la carpeta `archived/` para mantener limpia la carpeta principal. Estos incluyen:

- Scripts obsoletos (reemplazados por versiones nuevas)
- Scripts de debugging (problemas ya resueltos)
- Scripts de migración (ya ejecutados)
- Múltiples versiones del mismo fix

Ver índice completo: [archived/INDEX.md](archived/INDEX.md)

---

## ⚠️ Buenas Prácticas

### Antes de Ejecutar Scripts

1. **Backup**: Siempre hacer backup de la base de datos antes de ejecutar UPDATE/DELETE
2. **Leer primero**: Revisar el contenido del script antes de ejecutar
3. **Verificar UUIDs**: Confirmar que los UUIDs son correctos (ver TUTORS-UUID-EMAIL-MAPPING.md)
4. **Entorno**: Verificar que estás en el entorno correcto (dev/staging/prod)

### Después de Ejecutar Scripts

1. **Validar**: Ejecutar script de validación correspondiente
2. **Verificar**: Revisar que los datos se crearon/actualizaron correctamente
3. **Documentar**: Anotar qué script se ejecutó y cuándo

---

## 🆘 Soporte

### Problemas Comunes

**Error: "Este slug ya está en uso"**
- Solución: Ver [EJECUTAR-EN-ORDEN-FINAL.md](EJECUTAR-EN-ORDEN-FINAL.md) paso 1

**Error: "UUID no existe"**
- Solución: Verificar UUID correcto en [TUTORS-UUID-EMAIL-MAPPING.md](TUTORS-UUID-EMAIL-MAPPING.md)

**Error: "employment_type inválido"**
- Solución: Usar solo: FULL_TIME, PART_TIME, CONTRACT, FREELANCE, INTERNSHIP

---

## 📊 Estadísticas

- **Scripts activos**: 12 (7%)
- **Scripts archivados**: 168 (93%)
- **Reducción de complejidad**: 93%
- **Tiempo ahorrado**: ~90% menos archivos para buscar

---

**Mantenido por**: Claude Code
**Última limpieza**: 2026-02-12
**Próxima revisión**: 2026-05-12
