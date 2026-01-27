# Documentación del Proyecto YourCVPassport

> 📖 **[VER ÍNDICE COMPLETO](INDEX.md)** - Navegación detallada de toda la documentación

Esta carpeta contiene toda la documentación organizada del sistema de empresas, vacantes y búsqueda de talento.

## 🚀 Inicio Rápido

- **Nueva en el proyecto?** → Lee [DOCUMENTACION.md](DOCUMENTACION.md)
- **Sistema de vacantes?** → [guides/GUIA_SISTEMA_VACANTES.md](guides/GUIA_SISTEMA_VACANTES.md)
- **Configurar empresa de prueba?** → [guides/SETUP_EMPRESA_TEST.md](guides/SETUP_EMPRESA_TEST.md)
- **Ver API?** → [api/API_DOCUMENTATION.md](api/API_DOCUMENTATION.md) ⚠️ (revisar advertencias)

## 📁 Estructura Organizada

### `/api` - Documentación de API
- **API_DOCUMENTATION.md** - Documentación de API REST ⚠️ (muchas características NO implementadas)

### `/architecture` - Arquitectura y Base de Datos
- **cronologia.md** - Historia del proyecto y esquema de base de datos

### `/planning` - Planificación y Roadmap
- **ROADMAP_TO_10.md** - Hoja de ruta del proyecto ⚠️ (documento histórico)
- **SISTEMA_VACANTES_PROPUESTA.md** - Propuesta original del sistema de vacantes
- **QUE_FALTA.md** - Lista de pendientes ⚠️ (diciembre 2025 - verificar actualidad)

### `/guides` - Guías y Tutoriales
- **GUIA_SISTEMA_VACANTES.md** - Guía completa del sistema de vacantes
- **GUIA_VERIFICACION_PASO_A_PASO.md** - Pasos para verificar el sistema
- **INSTRUCCIONES_RAPIDAS.md** - Instrucciones rápidas de uso
- **SETUP_EMPRESA_TEST.md** - Configuración de empresa para testing
- **blog-template-guide.md** - Guía para crear contenido de blog

### `/implementation` - Implementación y Detalles Técnicos
- **SISTEMA_EMPRESAS_FINAL.md** - Documentación final del sistema de empresas
- **SISTEMA_VACANTES_IMPLEMENTADO.md** - Detalles de implementación de vacantes
- **NUEVAS_FUNCIONALIDADES.md** - Nuevas funcionalidades añadidas

### `/verification` - Verificación y Testing
- **VERIFICACION_COMPLETA.md** - Documento de verificación completa

### `/analysis` - Análisis del Sistema
- **COMPANY_SYSTEM_ANALYSIS.md** - Análisis del sistema de empresas ⚠️ (identifica NO implementados)

### `/changelog` - Archivo Histórico de Cambios
Documentos de correcciones implementadas (archivo histórico):
- COMPLETE_FIX_SUMMARY.md
- WORKFLOW_FIX_SUMMARY.md
- DASHBOARD_FIX_README.md
- Y otros...

## 🔧 Scripts SQL

Los scripts SQL están en `/scripts/sql/`:

### Activos y en Uso
- `/setup/EXECUTE_THESE_MIGRATIONS.sql` - Migración principal del sistema
- `/setup/RPC_FUNCTIONS_TO_EXECUTE.sql` - Funciones RPC críticas
- `/setup/SETUP_TEST_FINAL.sql` - Setup de empresa de prueba (preferido)
- `/verification/diagnose-job-system.sql` - Diagnóstico completo
- `/fix-all-job-tables-rls.sql` - Fix de políticas RLS

### Eliminados (Limpieza Enero 2026)
❌ Scripts obsoletos eliminados:
- SETUP_RAPIDO_TEST.sql (schema mismatch)
- SETUP_RAPIDO_TEST_CORREGIDO.sql (reemplazado)
- test-company-setup.sql (duplicado)
- fix-empty-urls.sql (one-off debug)
- fix-linkedin-url.sql (one-off debug)
- example_blog_update.sql (ejemplo)
- fix-job-postings-rls.sql (superseded)

## ⚠️ Advertencias Importantes

### Documentos con Funcionalidades NO Implementadas
Estos documentos describen características que **NO están implementadas**:
- **api/API_DOCUMENTATION.md** - Webhooks, rate limiting, Redis cache, Stripe/PayPal
- **planning/ROADMAP_TO_10.md** - Auto-consumo de créditos, AI search, PWA features
- **analysis/COMPANY_SYSTEM_ANALYSIS.md** - Stripe integration, 2FA, rate limiting

### Documentos Históricos
Estos documentos pueden estar **desactualizados**:
- **planning/QUE_FALTA.md** (Diciembre 2025)
- **planning/ROADMAP_TO_10.md** (Diciembre 2025)
- Todo en `/changelog/` (archivo histórico)

## 📚 Documentos de Referencia

### Documentación Principal
- **[DOCUMENTACION.md](DOCUMENTACION.md)** - Documentación técnica principal
- **[TALENT_SEARCH_SYSTEM.md](TALENT_SEARCH_SYSTEM.md)** - Sistema de búsqueda de talento ✅ (Actualizado Enero 2026)
- **[INDEX.md](INDEX.md)** - Índice completo de toda la documentación

## 📝 Convenciones

### Al Agregar Documentación
1. Colocar en la carpeta correspondiente según tipo
2. Agregar entrada en [INDEX.md](INDEX.md)
3. Actualizar este README si creas nueva carpeta
4. Si documenta funcionalidad NO implementada, agregar advertencia ⚠️ al inicio

### Leyenda de Estados
- ✅ **Implementado** - Funcionalidad completa y probada
- ⚠️ **NO IMPLEMENTADO** - Descrito pero no desarrollado
- ⚠️ **Documento histórico** - Puede estar desactualizado
- ❌ **Eliminado** - Ya no existe en el proyecto

## 🧹 Última Limpieza

**Fecha:** Enero 2026

**Cambios realizados:**
- ✅ Eliminados 7 scripts SQL obsoletos
- ✅ Movidos 12 documentos de fixes a `/changelog/`
- ✅ Eliminados 3 documentos duplicados
- ✅ Agregadas advertencias a documentos con funcionalidades NO implementadas
- ✅ Creado [INDEX.md](INDEX.md) completo
- ✅ Reorganizada carpeta `public/`

**Resultado:** Documentación más clara, menos confusión sobre qué está implementado.
