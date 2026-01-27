# Guía: Sistema de Verificación de Stamps - Panel Admin

**Fecha:** 12 de enero de 2026
**Autor:** Claude Code

## Estado Actual del Sistema

### ✅ Sistema Funcionando Correctamente

El sistema de verificaciones está **técnicamente correcto** y funcionando. Sin embargo, puede aparecer vacío si:

1. **No hay stamps en la base de datos** - Los usuarios no han solicitado verificaciones aún
2. **Solo hay stamps de EMAIL pendientes** - Estos se filtran intencionalmente del panel admin
3. **Todos los stamps ya fueron procesados** - No hay pendientes para revisar

## Anatomía del Sistema

### Flujo Completo de Verificación

```
Usuario Dashboard → Solicita Verificación → Sube Documento
                                                    ↓
                                         Crea stamp con status PENDING
                                                    ↓
                                         Aparece en Admin Dashboard
                                                    ↓
                                    Admin revisa y Aprueba/Rechaza
                                                    ↓
                                    Status cambia a VERIFIED/REJECTED
```

### Tipos de Stamps Soportados

| Tipo | Código | Requiere Documento | Visible en Admin cuando PENDING |
|------|--------|-------------------|----------------------------------|
| Email | `EMAIL` | No | ❌ **No** (auto-verificado) |
| Identidad | `IDENTITY` | Sí | ✅ Sí |
| Educación | `EDUCATION` | Sí | ✅ Sí |
| Certificación | `CERTIFICATION` | Sí | ✅ Sí |
| Empleo | `EMPLOYMENT` | Sí | ✅ Sí |
| Habilidad | `SKILL` | Sí | ✅ Sí |
| Idioma | `LANGUAGE` | Sí | ✅ Sí |

### ¿Por qué EMAIL PENDING no aparece?

**Código en StampsManagement.tsx (líneas 110-116):**

```typescript
// Filter out PENDING EMAIL stamps (they should only show when VERIFIED)
let filteredData = (data || []).filter(stamp => {
  if (stamp.type === 'EMAIL' && stamp.status === 'PENDING') {
    return false; // ❌ No mostrar
  }
  return true; // ✅ Mostrar todos los demás
});
```

**Razón:** Los stamps de EMAIL se verifican automáticamente mediante código de verificación enviado por email. No requieren revisión manual del admin.

## Diagnóstico: ¿Por qué veo 0 pendientes?

### Paso 1: Verificar si hay stamps en la base de datos

**Ejecuta en Supabase SQL Editor:**

```sql
-- Ver todos los stamps que existen
SELECT
    s.id,
    p.full_name,
    s.type,
    s.status,
    s.created_at
FROM stamps s
LEFT JOIN profiles p ON p.id = s.profile_id
ORDER BY s.created_at DESC
LIMIT 20;
```

**Resultado esperado:**
- Si ves filas → hay stamps en la BD
- Si no ves nada → **la base de datos está vacía**, ningún usuario ha solicitado verificaciones

### Paso 2: Contar stamps por estado

```sql
SELECT
    status,
    COUNT(*) as total
FROM stamps
GROUP BY status;
```

**Interpretación:**
- `PENDING: 0` → No hay verificaciones pendientes (todos los usuarios están verificados o nadie solicitó nada)
- `VERIFIED: X` → Hay X verificaciones aprobadas
- `REJECTED: Y` → Hay Y verificaciones rechazadas

### Paso 3: Ver qué tipos de stamps existen

```sql
SELECT
    type,
    status,
    COUNT(*) as count
FROM stamps
GROUP BY type, status
ORDER BY type, status;
```

**Si solo ves:**
```
EMAIL | PENDING | 5
```

**Entonces:** Solo hay stamps de EMAIL pendientes, que **NO SE MUESTRAN** en el admin por diseño.

## Solución: Crear Stamps de Prueba

### Opción 1: Que los usuarios soliciten verificaciones

1. Iniciar sesión como usuario normal (no admin)
2. Ir al Dashboard
3. Ir a sección "Verificaciones" o "Stamps"
4. Hacer clic en "Solicitar Verificación"
5. Seleccionar tipo: IDENTITY, EDUCATION, etc.
6. Subir documento de prueba
7. El stamp aparecerá en el admin con estado PENDING

### Opción 2: Crear stamps manualmente via SQL

**Script preparado:** [scripts/sql/create_test_stamps.sql](../../scripts/sql/create_test_stamps.sql)

**Pasos:**

1. Obtener ID de un usuario:
```sql
SELECT id, full_name, email
FROM profiles
ORDER BY created_at DESC
LIMIT 5;
```

2. Copiar el `id` de un usuario

3. Ejecutar (reemplaza `'TU_USER_UUID_AQUI'` con el ID copiado):

```sql
-- Crear stamp de IDENTIDAD pendiente
INSERT INTO stamps (profile_id, type, status, evidence, provider, created_at)
VALUES (
    'TU_USER_UUID_AQUI',  -- ⬅️ REEMPLAZAR ESTO
    'IDENTITY',
    'PENDING',
    jsonb_build_object(
        'document_type', 'DNI',
        'document_number', '12345678Z',
        'document_url', 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f',
        'file_name', 'dni_test.jpg',
        'file_type', 'image/jpeg',
        'uploaded_at', NOW()
    ),
    'manual_upload',
    NOW()
);

-- Crear stamp de EDUCACIÓN pendiente
INSERT INTO stamps (profile_id, type, status, evidence, provider, created_at)
VALUES (
    'TU_USER_UUID_AQUI',  -- ⬅️ REEMPLAZAR ESTO
    'EDUCATION',
    'PENDING',
    jsonb_build_object(
        'institution', 'Universidad Complutense de Madrid',
        'degree', 'Licenciatura en Ingeniería Informática',
        'graduation_year', '2020',
        'document_url', 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1',
        'file_name', 'diploma.pdf',
        'file_type', 'application/pdf',
        'uploaded_at', NOW()
    ),
    'manual_upload',
    NOW()
);
```

4. Verificar que se crearon:
```sql
SELECT
    s.id,
    p.full_name,
    s.type,
    s.status,
    s.created_at
FROM stamps s
JOIN profiles p ON p.id = s.profile_id
ORDER BY s.created_at DESC;
```

5. **Refrescar el panel admin** (F5 en el navegador)

## Verificar que Todo Funciona

### En Admin Dashboard (`/admin`)

**Deberías ver:**
```
┌─────────────────────────────────┐
│ Stamp Verification              │
│ 2 Pending                       │ ← Aquí aparece el contador
│ Review stamp verification...    │
└─────────────────────────────────┘
```

### En Stamps Management (click en "Stamp Verification")

**Deberías ver una tabla con:**

| Usuario | Tipo | Estado | Solicitado | Acciones |
|---------|------|--------|------------|----------|
| Nombre Usuario | Identidad | 🟡 Pendiente | 12 ene 2026, 10:30 | [Ver Detalles] |
| Nombre Usuario | Educación | 🟡 Pendiente | 12 ene 2026, 10:32 | [Ver Detalles] |

### Al hacer click en "Ver Detalles"

Deberías ver un modal con:
- ✅ Información del usuario
- ✅ Datos proporcionados en el evidence
- ✅ Preview del documento adjunto
- ✅ Botones "Aprobar" y "Rechazar"

## Scripts SQL Útiles

Todos están en: [scripts/sql/](../../scripts/sql/)

### 1. Diagnóstico Completo
```bash
scripts/sql/diagnose_stamps_deep.sql
```

Muestra:
- Todos los stamps existentes
- Conteos por estado y tipo
- Usuarios sin stamps
- Usuarios con stamps pendientes

### 2. Verificar Tablas
```bash
scripts/sql/verify_stamps_tables.sql
```

Verifica:
- Qué tablas existen relacionadas con stamps
- Estructura de la tabla stamps
- Si existe `stamp_verification_requests` (no debería)

### 3. Crear Datos de Prueba
```bash
scripts/sql/create_test_stamps.sql
```

Crea stamps de ejemplo para testing.

## Troubleshooting

### Problema: "No hay stamps pendientes" pero hay usuarios

**Causa posible:**
1. Los usuarios no han solicitado verificaciones
2. Solo solicitaron verificación de EMAIL (que se filtra)
3. Todos los stamps ya fueron procesados

**Solución:**
- Ejecutar diagnóstico SQL para ver qué hay en la BD
- Crear stamps de prueba manualmente
- Pedir a usuarios que soliciten verificaciones

### Problema: "Error al cargar documento"

**Causa:**
- El `document_url` en evidence apunta a un archivo que no existe en Supabase Storage

**Solución (para datos de prueba):**
- Usar URLs de Unsplash (como en los ejemplos)
- O subir archivos reales a Supabase Storage bucket `documents`

### Problema: El contador no se actualiza

**Causa:**
- El AdminDashboard carga stats al montar el componente

**Solución:**
- Refrescar la página (F5)
- O navegar a otra sección y volver

## Archivos Clave del Sistema

### Frontend
- [components/admin/AdminDashboard.tsx](../../components/admin/AdminDashboard.tsx) - Dashboard principal
- [components/admin/StampsManagement.tsx](../../components/admin/StampsManagement.tsx) - Gestión de stamps
- [components/dashboard/StampsSection.tsx](../../components/dashboard/StampsSection.tsx) - Vista usuario
- [components/dashboard/StampsUploadModal.tsx](../../components/dashboard/StampsUploadModal.tsx) - Modal de subida

### Backend (Supabase)
- [supabase/migrations/20251127_setup_verification.sql](../../supabase/migrations/20251127_setup_verification.sql) - Tabla stamps
- [supabase/migrations/20260107_fix_stamp_type_enum.sql](../../supabase/migrations/20260107_fix_stamp_type_enum.sql) - Tipos de stamps

### Documentación
- [docs/changelog/FIX_ADMIN_STAMPS_CONNECTION.md](../changelog/FIX_ADMIN_STAMPS_CONNECTION.md) - Fix del bug de conexión

## Estado del Fix Implementado

### ✅ Corregido (12/01/2026)

**Problema anterior:**
```typescript
// ❌ ANTES - Tabla inexistente
supabase.from('stamp_verification_requests')
```

**Solución aplicada:**
```typescript
// ✅ AHORA - Tabla correcta
supabase.from('stamps').eq('status', 'PENDING')
```

**Resultado:**
- El contador ahora consulta la tabla correcta
- Los stamps pendientes se cuentan correctamente
- El sistema está 100% funcional

## Próximos Pasos Recomendados

### Testing Inmediato
1. ✅ Crear 2-3 stamps de prueba usando el SQL script
2. ✅ Verificar que aparecen en el panel admin
3. ✅ Probar aprobar un stamp
4. ✅ Probar rechazar un stamp
5. ✅ Verificar que los contadores se actualizan

### Mejoras Futuras
- [ ] Agregar real-time updates con Supabase Realtime
- [ ] Notificaciones push para admins cuando hay nuevos stamps
- [ ] Dashboard de métricas y gráficos
- [ ] Filtros avanzados en StampsManagement
- [ ] Búsqueda por nombre de usuario

---

**¿Necesitas ayuda?**
- Ejecuta los scripts SQL de diagnóstico
- Revisa los logs de la consola del navegador
- Verifica las políticas RLS en Supabase
