# 📚 Índice de Documentación - YourCVPassport

Última actualización: Enero 2026

---

## 🎯 Documentos Principales

### [README.md](README.md)
Introducción general al proyecto y estructura de documentación.

### [DOCUMENTACION.md](DOCUMENTACION.md)
Documentación técnica principal del proyecto.

---

## 📖 Guías de Usuario

### Sistema de Vacantes (Job Postings)
- **[GUIA_SISTEMA_VACANTES.md](guides/GUIA_SISTEMA_VACANTES.md)** - Guía completa del sistema de publicación de empleos
- **[GUIA_VERIFICACION_PASO_A_PASO.md](guides/GUIA_VERIFICACION_PASO_A_PASO.md)** - Verificación paso a paso del sistema
- **[INSTRUCCIONES_RAPIDAS.md](guides/INSTRUCCIONES_RAPIDAS.md)** - Referencia rápida para implementación
- **[SETUP_EMPRESA_TEST.md](guides/SETUP_EMPRESA_TEST.md)** - Configurar empresa de prueba

### Blogs y Contenido
- **[blog-template-guide.md](guides/blog-template-guide.md)** - Guía para crear contenido de blog

---

## 🔧 Implementación

### Sistemas Implementados
- **[SISTEMA_VACANTES_IMPLEMENTADO.md](implementation/SISTEMA_VACANTES_IMPLEMENTADO.md)** - Detalles técnicos del sistema de vacantes
- **[NUEVAS_FUNCIONALIDADES.md](implementation/NUEVAS_FUNCIONALIDADES.md)** - Funcionalidades nuevas implementadas
- **[SISTEMA_EMPRESAS_FINAL.md](implementation/SISTEMA_EMPRESAS_FINAL.md)** - Sistema de empresas completo

---

## 🔍 Análisis y Estado Actual

- **[TALENT_SEARCH_SYSTEM.md](TALENT_SEARCH_SYSTEM.md)** - Sistema de búsqueda de talento (Actualizado Enero 2026)
- **[COMPANY_SYSTEM_ANALYSIS.md](analysis/COMPANY_SYSTEM_ANALYSIS.md)** - Análisis del sistema de empresas
  > ⚠️ Identifica funcionalidades NO implementadas

---

---

## 🔬 Verificación y Testing

### Scripts SQL de Verificación
- **[diagnose-job-system.sql](../scripts/sql/verification/diagnose-job-system.sql)** - Diagnóstico completo del sistema
- **[VERIFICACION_RAPIDA.sql](../scripts/sql/verification/VERIFICACION_RAPIDA.sql)** - Verificación rápida del sistema

### Documentación de Verificación
- **[VERIFICACION_COMPLETA.md](verification/VERIFICACION_COMPLETA.md)** - Guía detallada de verificación

---

## 🏗️ Arquitectura y Base de Datos

- **[cronologia.md](architecture/cronologia.md)** - Historia del proyecto y esquema de base de datos
- **[API_DOCUMENTATION.md](api/API_DOCUMENTATION.md)** - Documentación de API
  > ⚠️ Muchas características descritas NO están implementadas

---


## 🗂️ Scripts SQL Activos

### Setup y Migraciones
- **[EXECUTE_THESE_MIGRATIONS.sql](../scripts/sql/setup/EXECUTE_THESE_MIGRATIONS.sql)** - Migración principal del sistema de vacantes
- **[quick-test-setup.sql](../scripts/sql/setup/quick-test-setup.sql)** - Setup rápido de prueba

### Correcciones
- **[fix-all-job-tables-rls.sql](../scripts/sql/fix-all-job-tables-rls.sql)** - Fix completo de políticas RLS

### Utilidades
- **[insert-blog-post.sql](../scripts/sql/insert-blog-post.sql)** - Template para insertar posts de blog
- **[insert-blog-post-simple.sql](../scripts/sql/insert-blog-post-simple.sql)** - Template simplificado

---

## ⚠️ Leyenda de Advertencias

- **✅ Implementado** - Funcionalidad completamente implementada y probada
- **⚠️ Parcialmente implementado** - Funcionalidad parcial o simulada
- **⚠️ NO IMPLEMENTADO** - Característica descrita pero no desarrollada
- **⚠️ Documento histórico** - Información que puede estar desactualizada

---

## 🔍 Buscar Documentación

### Por Estado de Implementación
- **Funcionalidades activas**: Ver `implementation/`
- **Funcionalidades pendientes**: Ver `planning/` (revisar fechas)
- **Problemas conocidos**: Ver `analysis/COMPANY_SYSTEM_ANALYSIS.md`

### Por Tema
- **Sistema de Empresas**: `implementation/SISTEMA_EMPRESAS_FINAL.md`, `analysis/COMPANY_SYSTEM_ANALYSIS.md`
- **Sistema de Vacantes**: `guides/GUIA_SISTEMA_VACANTES.md`, `implementation/SISTEMA_VACANTES_IMPLEMENTADO.md`
- **Búsqueda de Talento**: `TALENT_SEARCH_SYSTEM.md`
- **API**: `api/API_DOCUMENTATION.md` (revisar advertencias)
- **Base de Datos**: `architecture/cronologia.md`, scripts en `../scripts/sql/`

---

## 📝 Notas Importantes

1. **Documentos con advertencias**: Varios documentos tienen etiquetas de advertencia indicando funcionalidades NO implementadas. Revisar siempre el encabezado.

2. **Documentos históricos**: Los documentos en `planning/` y `changelog/` pueden estar desactualizados. Verificar fechas antes de usar.

3. **Scripts SQL**: Usar preferentemente los scripts en `scripts/sql/setup/` y `scripts/sql/verification/`. Los scripts obsoletos fueron eliminados.

4. **Verificación**: Antes de asumir que una funcionalidad está implementada, ejecutar los scripts de verificación en `scripts/sql/verification/`.

---

**Última limpieza:** Enero 2026
**Archivos eliminados:** ~59 archivos obsoletos (SQL duplicados, changelog histórico, documentación antigua)
**Estado:** Estructura optimizada - solo documentación esencial y funcional
