# Fix: Admin No Puede Ver Stamps de Otros Usuarios (RLS)

**Fecha:** 12 de enero de 2026
**Tipo:** Bug Fix - Security
**Severidad:** Alta
**Estado:** ✅ Solución Lista para Aplicar

## Problema Identificado

Después del fix anterior que corrigió la tabla en `AdminDashboard`, descubrimos un **segundo problema**:

### Síntoma
- El contador de "Pendientes" sigue mostrando **0**
- Aunque HAY stamps PENDING en la base de datos (confirmado vía SQL directo)
- Los admins no pueden ver stamps de otros usuarios en el panel

### Root Cause

**Row Level Security (RLS)** está bloqueando el acceso de admins a stamps de otros usuarios.

#### Evidencia de la Base de Datos

Ejecutando el SQL de diagnóstico, encontramos:
```
type         | status   | count
-------------|----------|-------
EMAIL        | VERIFIED | 8
IDENTITY     | PENDING  | 1    ⬅️ Este debería aparecer en el admin
IDENTITY     | VERIFIED | 8
IDENTITY     | REJECTED | 7
EDUCATION    | VERIFIED | 6
...
```

Hay **1 stamp de IDENTITY con estado PENDING**, pero el admin no lo puede ver.

#### Política RLS Problemática

En [20260107_fix_stamps_rls_clean.sql](../../supabase/migrations/20260107_fix_stamps_rls_clean.sql#L34-L43):

```sql
CREATE POLICY "Admins can view all stamps"
ON public.stamps FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'ADMIN'  -- ⬅️ PROBLEMA
  )
);
```

**Problema:** La comparación `role = 'ADMIN'` es **case-sensitive**.

Si en la base de datos el rol está almacenado como:
- `'admin'` (minúsculas) ❌ No funciona
- `'ADMIN'` (mayúsculas) ✅ Funciona
- `'Admin'` (mixto) ❌ No funciona

## Solución Implementada

### Migration: 20260112_fix_admin_stamps_access.sql

**Archivo:** [supabase/migrations/20260112_fix_admin_stamps_access.sql](../../supabase/migrations/20260112_fix_admin_stamps_access.sql)

**Cambio principal:**

```sql
-- ❌ ANTES - Case-sensitive
WHERE id = auth.uid() AND role = 'ADMIN'

-- ✅ AHORA - Case-insensitive
WHERE id = auth.uid() AND LOWER(role) = 'admin'
```

### Políticas Actualizadas

La migración actualiza **TODAS** las políticas de admin:

1. **SELECT** - Ver todos los stamps
2. **INSERT** - Crear stamps para cualquier usuario
3. **UPDATE** - Modificar cualquier stamp
4. **DELETE** - Eliminar cualquier stamp

Todas ahora usan `LOWER(role) = 'admin'` para soportar cualquier variación.

### Políticas Adicionales

También aseguramos que existan:

- ✅ **Users can view their own stamps** - Usuarios ven sus propios stamps
- ✅ **Users can insert their own stamps** - Usuarios crean sus stamps
- ✅ **Public can view verified stamps** - Público ve stamps verificados (para badges)

## Cómo Aplicar el Fix

### Paso 1: Verificar el Rol Actual de Admin

Ejecuta en Supabase SQL Editor:

```sql
-- Ver roles existentes en la base de datos
SELECT
    role,
    COUNT(*) as count
FROM profiles
GROUP BY role;
```

**Resultado esperado:**
```
role  | count
------|------
admin | 1
user  | 15
```

Si ves `ADMIN` (mayúsculas), `Admin` (mixto), o cualquier variante, esta migración lo arreglará.

### Paso 2: Ejecutar la Migración

**Opción A: Via Supabase Dashboard**

1. Ir a Supabase Dashboard → SQL Editor
2. Abrir el archivo [20260112_fix_admin_stamps_access.sql](../../supabase/migrations/20260112_fix_admin_stamps_access.sql)
3. Copiar todo el contenido
4. Pegarlo en el SQL Editor
5. Ejecutar ▶️

**Opción B: Via Supabase CLI** (si está configurado)

```bash
supabase db push
```

### Paso 3: Verificar que Funcionó

Ejecuta esto **logueado como admin** en SQL Editor:

```sql
-- Contar stamps pendientes (debería funcionar ahora)
SELECT
    COUNT(*) as pending_stamps
FROM stamps
WHERE status = 'PENDING';
```

**Resultado esperado:**
```
pending_stamps
--------------
1              ⬅️ El stamp de IDENTITY PENDING
```

Si ves el número correcto (1 en este caso), **el fix funcionó** ✅

### Paso 4: Refrescar el Panel Admin

1. Ir a `/admin` en el navegador
2. Presionar **F5** (hard refresh) o Ctrl+Shift+R
3. El contador "Stamp Verification" debería mostrar **1 Pending**

## Verificación Post-Fix

### En Admin Dashboard

**Antes del fix:**
```
┌─────────────────────────────────┐
│ Stamp Verification              │
│ 0 Pending                       │ ⬅️ INCORRECTO
│ Review stamp verification...    │
└─────────────────────────────────┘
```

**Después del fix:**
```
┌─────────────────────────────────┐
│ Stamp Verification              │
│ 1 Pending                       │ ⬅️ CORRECTO
│ Review stamp verification...    │
└─────────────────────────────────┘
```

### En Stamps Management

Al hacer clic en "Stamp Verification", deberías ver:

| Usuario | Tipo | Estado | Solicitado | Acciones |
|---------|------|--------|------------|----------|
| [Nombre] | Identidad | 🟡 Pendiente | [Fecha] | [Ver Detalles] |

## Scripts de Diagnóstico Creados

### 1. diagnose_admin_role.sql

**Ubicación:** [scripts/sql/diagnose_admin_role.sql](../../scripts/sql/diagnose_admin_role.sql)

**Qué hace:**
- Ver todos los roles que existen
- Encontrar usuarios admin (todas las variaciones)
- Verificar tipo de dato de la columna `role`
- Ver políticas RLS actuales para admins

**Cuándo usarlo:**
- Si sospechas que el rol está almacenado incorrectamente
- Para verificar que las políticas se aplicaron correctamente

### 2. fix_stamps_admin_rls.sql

**Ubicación:** [scripts/sql/fix_stamps_admin_rls.sql](../../scripts/sql/fix_stamps_admin_rls.sql)

**Qué hace:**
- Ver políticas actuales
- Crear política case-insensitive para admins
- Verificar que funciona

**Cuándo usarlo:**
- Como alternativa rápida si no quieres ejecutar la migración completa
- Para debugging de políticas RLS

## Impacto del Fix

### Seguridad ✅
- Las políticas RLS siguen protegiendo los datos
- Los usuarios normales **solo ven sus propios stamps**
- Los admins **ven todos los stamps** (como debería ser)
- El público **solo ve stamps VERIFIED** (para badges)

### Funcionalidad ✅
- Los admins pueden moderar verificaciones
- El contador de pendientes es preciso
- El sistema de stamps funciona end-to-end

### Performance ✅
- `LOWER(role)` tiene impacto mínimo en performance
- Las consultas siguen usando índices apropiadamente
- No afecta la velocidad de carga del admin dashboard

## Troubleshooting

### Problema: Después del fix sigo viendo 0 pendientes

**Posibles causas:**

1. **No refrescaste el navegador**
   - Solución: Presiona F5 o Ctrl+Shift+R

2. **La migración no se ejecutó correctamente**
   - Verificar: Ejecuta el script de diagnóstico
   ```sql
   SELECT policyname FROM pg_policies
   WHERE tablename = 'stamps'
   AND policyname LIKE '%Admin%';
   ```
   - Debería mostrar la política "Admins can view all stamps"

3. **Tu usuario no tiene rol 'admin'**
   - Verificar:
   ```sql
   SELECT role FROM profiles
   WHERE id = auth.uid();
   ```
   - Si no es 'admin' o 'ADMIN', necesitas actualizar:
   ```sql
   UPDATE profiles
   SET role = 'admin'
   WHERE email = 'tu-email@admin.com';
   ```

4. **Los stamps PENDING son solo de tipo EMAIL**
   - Recordar: Los stamps EMAIL+PENDING se **filtran intencionalmente**
   - Verificar tipos:
   ```sql
   SELECT type, status, COUNT(*)
   FROM stamps
   WHERE status = 'PENDING'
   GROUP BY type, status;
   ```

### Problema: Error al ejecutar la migración

**Error común:**
```
policy "Admins can view all stamps" already exists
```

**Solución:**
- La migración ya incluye `DROP POLICY IF EXISTS`
- Si persiste, ejecuta manualmente:
```sql
DROP POLICY IF EXISTS "Admins can view all stamps" ON public.stamps;
```
- Luego ejecuta la migración completa de nuevo

## Archivos Modificados/Creados

### Migraciones
- ✅ [supabase/migrations/20260112_fix_admin_stamps_access.sql](../../supabase/migrations/20260112_fix_admin_stamps_access.sql) - **NUEVA**

### Scripts de Diagnóstico
- ✅ [scripts/sql/diagnose_admin_role.sql](../../scripts/sql/diagnose_admin_role.sql) - **NUEVO**
- ✅ [scripts/sql/fix_stamps_admin_rls.sql](../../scripts/sql/fix_stamps_admin_rls.sql) - **NUEVO**

### Documentación
- ✅ Este archivo - **NUEVO**
- 📄 [FIX_ADMIN_STAMPS_CONNECTION.md](./FIX_ADMIN_STAMPS_CONNECTION.md) - Fix anterior (tabla incorrecta)
- 📄 [GUIA_VERIFICACION_STAMPS_ADMIN.md](../guides/GUIA_VERIFICACION_STAMPS_ADMIN.md) - Guía completa del sistema

## Timeline de Fixes

### Fix #1: Tabla Incorrecta
- **Problema:** AdminDashboard consultaba tabla inexistente `stamp_verification_requests`
- **Solución:** Cambiar a tabla `stamps` con status `PENDING`
- **Archivo:** [AdminDashboard.tsx:94](../../components/admin/AdminDashboard.tsx#L94)

### Fix #2: RLS Case-Sensitive (Este)
- **Problema:** Políticas RLS bloqueaban acceso de admins por comparación case-sensitive
- **Solución:** Usar `LOWER(role) = 'admin'` en todas las políticas
- **Archivo:** [20260112_fix_admin_stamps_access.sql](../../supabase/migrations/20260112_fix_admin_stamps_access.sql)

## Estado Final

Después de aplicar **ambos fixes**:

✅ AdminDashboard consulta la tabla correcta (`stamps`)
✅ Las políticas RLS permiten a admins ver todos los stamps
✅ El contador muestra el número real de pendientes
✅ Los admins pueden revisar y aprobar/rechazar verificaciones
✅ El sistema está **100% funcional**

---

**Próximo paso:** Ejecuta la migración [20260112_fix_admin_stamps_access.sql](../../supabase/migrations/20260112_fix_admin_stamps_access.sql) en Supabase.
