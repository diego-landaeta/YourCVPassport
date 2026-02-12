# 🗄️ Scripts SQL Archivados

**Fecha de archivo**: 2026-02-12
**Total de archivos**: 167
**Motivo**: Consolidación y limpieza - scripts obsoletos, de debugging, y versiones antiguas

---

## 📋 Resumen

Esta carpeta contiene scripts SQL que fueron útiles durante el desarrollo pero ya no son necesarios para operaciones diarias. Se archivan por:

1. **Scripts obsoletos** - Reemplazados por versiones más nuevas
2. **Scripts de debugging** - Usados para diagnosticar problemas ya resueltos
3. **Scripts de migración** - Ya ejecutados en producción
4. **Versiones antiguas** - Múltiples iteraciones del mismo fix

---

## 🗂️ Categorías de Scripts Archivados

### 1. Gestión de Usuarios Demo (Laura, Javier, Marta)
Scripts para crear y actualizar los 3 usuarios demo españoles iniciales:
- ACTUALIZAR_JAVIER_SIMPLE.sql
- ACTUALIZAR_LAURA_SIMPLE.sql
- ACTUALIZAR_MARTA_SIMPLE.sql
- add-stamps-javier-SIMPLE.sql
- add-stamps-laura-SIMPLE.sql
- add-stamps-marta.sql
- update-marta-complete-stamps.sql
- update-javier-complete-stamps.sql
- update-laura-complete-stamps.sql
- add-certifications-demo-users.sql
- fix-ubicaciones-usuarios-demo.sql
- SUPABASE_setup-usuarios-demo.sql
- EJECUTAR_SETUP_USUARIOS_DEMO.sql

**Estado**: Obsoleto - Usuarios ya configurados correctamente

---

### 2. Creación de Tutores ISEIH (Versiones Antiguas)
Scripts anteriores para crear tutores individuales (reemplazados por versiones LIMPIO):
- create-michelle-chang.sql → **Reemplazado por** CREATE-michelle-chang-LIMPIO.sql
- create-nicole-taylor-COMPLETE.sql → **Reemplazado por** CREATE-nicole-taylor-LIMPIO.sql
- create-missing-iseih-tutors.sql (Rebecca, Karen, Paul)
- create-missing-iseih-tutors-part2.sql (Jessica, Alex, Diana)
- create-missing-iseih-tutors-part3.sql (Robert, Catherine, Mark)
- create-rebecca-anderson.sql
- create-karen-white.sql
- create-paul-henderson.sql
- create-jessica-porter.sql
- create-alex-martinez.sql
- create-diana-russell.sql
- create-robert-kim.sql
- create-catherine-adams.sql
- create-mark-davidson.sql

**Estado**: Archivado - Ya ejecutados, tutores creados

---

### 3. Fixes de Slugs (Iteraciones Múltiples)
Múltiples intentos de resolver problemas con slugs duplicados/nulos:
- FIX_DEFINITIVO_SLUGS.sql
- FIX_SLUGS_PASO_A_PASO.sql
- FIX_SLUG_SEO_SIMPLE.sql
- FIX_DEFINITIVO_SLUG.sql
- FIX_SLUG_NULL_DEFINITIVO.sql
- FIX_SYNC_EMAIL_TO_PROFILE.sql
- LIMPIAR_SLUGS_AUTOMATICOS.sql
- LIMPIAR_SLUGS_FINAL.sql
- SOLUCION_DEFINITIVA_SLUGS.sql
- FIX_VALIDATE_PROFILE_SLUG.sql
- FIX_VALIDATE_SLUG_PERMITIR_NULL.sql
- fix-slugs-remove-headline.sql
- fix-usa-users-slugs.sql
- admin-update-slug.sql

**Estado**: Obsoleto - Problema resuelto

---

### 4. Diagnósticos y Debugging
Scripts para diagnosticar problemas en base de datos:
- DIAGNOSTICO_SLUG_ACTUAL.sql
- EJECUTAR_ESTE_DIAGNOSTICO.sql
- DIAGNOSTICO_URGENTE.sql
- DIAGNOSTICO_TABLA_PROFILES.sql
- DIAGNOSTICO_CONSTRAINTS.sql
- DIAGNOSTICO_TRIGGERS.sql
- DEBUG_TRIGGERS.sql
- debug-skills-count.sql
- diagnose-stamps-structure.sql
- diagnose_stamps_deep.sql
- diagnose_admin_role.sql
- diagnose-full-name-spaces.sql
- diagnose-skills-rls-complete.sql

**Estado**: Archivado - Debugging completado

---

### 5. Fixes de Triggers y Constraints
Scripts para arreglar triggers, constraints y funciones:
- ARREGLAR_TRIGGER_DEFINITIVO.sql
- VER_Y_ARREGLAR_TRIGGER.sql
- VER_CONSTRAINT_LANGUAGES.sql
- VER_ESTRUCTURA_PROFILES.sql
- VER_FUNCION_SYNC_EMAIL.sql
- VER_TODAS_LAS_FUNCIONES.sql
- DESHABILITAR_TRIGGERS_TEMPORALMENTE.sql
- REACTIVAR_TRIGGERS.sql

**Estado**: Obsoleto - Triggers ya configurados correctamente

---

### 6. RLS (Row Level Security) Policies
Scripts para configurar políticas de seguridad:
- check-skills-rls.sql
- diagnose-skills-rls-complete.sql
- fix_stamps_admin_rls.sql
- fix-all-job-tables-rls.sql
- SOLUCION_COMPLETA_AHORA.sql
- VERIFICAR_POLITICAS_ACTUALES.sql
- EJECUTAR_PASO_A_PASO.sql

**Estado**: Archivado - RLS políticas configuradas

---

### 7. Validación de Contenido (Versiones Antiguas)
Scripts de validación reemplazados por versiones más completas:
- verify-profile-content-quality.sql
- content-quality-report.sql
- export-for-translation-review.sql
- quick-quality-check.sql
- validate-schema-limits.sql
- validate-schema-limits-v2.sql
- validate-schema-limits-simple.sql
- validate-profiles-detailed.sql
- review-profile-quality.sql
- analizar-calidad-tutores-completo.sql

**Estado**: Reemplazado por validate-all-tutors-content-consistency.sql

---

### 8. Fixes de Summaries y Headlines
Scripts para corregir summaries que excedían 800 caracteres:
- fix-summaries-over-800.sql
- fix-summaries-CORRECTED.sql
- fix-summaries-FINAL.sql
- get-full-summaries.sql
- get-all-profile-data.sql
- fix-short-headlines.sql

**Estado**: Obsoleto - Ya ejecutados

---

### 9. Gestión de Job Postings
Scripts relacionados con ofertas de trabajo:
- setup-test-company-data.sql
- fix-notify-job-application-trigger.sql
- setup-company-credit-functions.sql
- fix-job-search-400-error.sql
- fix-job-detail-page.sql
- fix-job-detail-page-v2.sql
- fix-apply-to-job-function.sql

**Estado**: Archivado - Sistema de jobs ya configurado

---

### 10. Gestión de Stamps y Badges
Scripts para configurar stamps/badges:
- verify-stamps-for-user.sql
- verify_stamps_tables.sql
- create_test_stamps.sql

**Estado**: Archivado - Stamps ya configurados

---

### 11. Templates y Configuración
Scripts de configuración de templates:
- cambiar-todos-a-passport.sql
- cambiar-todos-a-passport-template.sql
- update-template-configs-free-premium.sql

**Estado**: Obsoleto - Templates ya configurados con 'passport'

---

### 12. Limpieza y Mantenimiento
Scripts de limpieza de datos:
- LIMPIAR_USUARIO_TEST.sql
- CLEAN_EMAIL_AS_NAME.sql
- hide-carlos-saiz.sql
- delete-rebecca-anderson.sql
- clear-analytics-data.sql
- clean-and-create-rebecca.sql

**Estado**: Archivado - Limpieza ya realizada

---

### 13. Fixes de Duplicados de Tutores
Scripts para manejar duplicados de Michelle Chang y Nicole Taylor:
- 00-PREPARAR-michelle-chang-PRIMERO.sql
- 01-LIMPIAR-duplicados-michelle-chang.sql
- DELETE-michelle-chang-TODOS-LOS-PERFILES.sql
- FIX-michelle-chang-nicole-taylor-FINAL.sql
- FIX-michelle-chang-uuid-CORRECTED.sql
- PROFILE-QUALITY-REPORT.md

**Estado**: Reemplazado por DELETE-michelle-chang-y-nicole-taylor.sql

---

### 14. Verificaciones y Reportes
Scripts de verificación y reporte:
- VERIFICAR_FIX_APLICADO.sql
- VERIFICACION_RAPIDA.sql
- VERIFICAR_SKILLS_POR_PERFIL.sql
- verify-public-profiles-skills.sql
- check-analytics-data.sql
- check-employment-type-values.sql
- check-existing-plans.sql
- check-plan-constraint.sql
- check-profiles-schema.sql
- check-rebecca-role.sql
- check-user-exists.sql

**Estado**: Archivado - Verificaciones completadas

---

### 15. Migraciones
Scripts de migración de datos:
- 00_VERIFICAR_MIGRACIONES.sql

**Estado**: Obsoleto - Migraciones ya ejecutadas

---

### 16. Documentación Antigua
Documentos de procedimiento obsoletos:
- 00-ORDEN-DE-EJECUCION-COMPLETO.md
- COMO-REVISAR-CALIDAD.md

**Estado**: Reemplazado por documentación nueva

---

### 17. Otros Scripts Misceláneos
- insert-blog-post.sql
- insert-blog-post-simple.sql
- create-user-via-sql.sql
- add-missing-skills.sql
- add-missing-certifications.sql

**Estado**: Archivado - Scripts de utilidad única ya ejecutados

---

## 🔄 Scripts Activos (NO archivados)

Los siguientes scripts permanecen en `scripts/sql/` porque siguen siendo útiles:

1. **CREATE-michelle-chang-LIMPIO.sql** - Versión limpia para recrear Michelle Chang
2. **CREATE-nicole-taylor-LIMPIO.sql** - Versión limpia para recrear Nicole Taylor
3. **DELETE-michelle-chang-y-nicole-taylor.sql** - Limpieza de ambos perfiles
4. **check-tutors-missing-photos.sql** - Verificar tutores sin foto
5. **update-tutor-photo.sql** - Template para actualizar fotos
6. **validate-all-tutors-content-consistency.sql** - Validación completa
7. **fix-headlines-cortos.sql** - Extender headlines cortos
8. **delete-test-job-postings.sql** - Limpieza de jobs de prueba
9. **TUTORS-UUID-EMAIL-MAPPING.md** - Referencia de UUIDs
10. **EJECUTAR-EN-ORDEN-FINAL.md** - Guía de ejecución
11. **COMO-ACTUALIZAR-FOTOS-TUTORES.md** - Guía de fotos
12. **SCRIPTS-UTILES.md** - Este índice

---

## ⚠️ Notas Importantes

### ¿Puedo eliminar estos archivos?
**No se recomienda** por ahora. Estos scripts contienen:
- Historial de fixes aplicados
- Ejemplos de cómo resolver problemas similares
- Referencias de estructuras de datos

### ¿Cuándo se pueden eliminar?
Después de 3-6 meses sin incidencias, se puede considerar eliminar permanentemente.

### ¿Necesito alguno de estos scripts?
Probablemente no. Los scripts activos en `scripts/sql/` cubren todas las necesidades actuales.

---

## 📊 Estadísticas

- **Total de archivos archivados**: 167
- **Total de archivos activos**: 12
- **Reducción**: 93% de scripts removidos de uso diario
- **Espacio en disco ahorrado**: ~850 KB de archivos organizados

---

**Última actualización**: 2026-02-12
**Ver scripts activos**: `../SCRIPTS-UTILES.md`
