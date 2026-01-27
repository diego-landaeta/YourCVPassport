# ✅ Guía de Verificación Completa
## Sistema de Vacantes - YourCVPassport

---

## 📋 Checklist de Verificación

Sigue estos pasos **EN ORDEN** para verificar que todo el sistema funciona correctamente.

---

## PASO 1: Diagnóstico del Sistema 🔍

### 1.1 Ejecutar Script de Diagnóstico

**Ir a:** Supabase Dashboard → SQL Editor → New Query

**Copiar y pegar:** TODO el contenido de `diagnose-job-system.sql`

**Click:** Run

### 1.2 Verificar Resultados

Deberías ver salidas como estas:

```
✅ Tablas existentes:
- job_postings: ✅ Existe
- job_applications: ✅ Existe
- job_posting_views: ✅ Existe
- job_posting_questions: ✅ Existe
- companies: ✅ Existe
- company_users: ✅ Existe

✅ RLS Status:
- job_postings: ✅ RLS Enabled
- job_applications: ✅ RLS Enabled
- job_posting_views: ✅ RLS Enabled
- job_posting_questions: ✅ RLS Enabled

✅ Funciones RPC:
- calculate_job_match_score: ✅ Existe
- publish_job_posting: ✅ Existe
- apply_to_job: ✅ Existe
- update_application_status: ✅ Existe
```

### 1.3 Si algo falla:

#### ❌ "job_postings does not exist"
```sql
-- Ejecutar:
EXECUTE_THESE_MIGRATIONS.sql
```

#### ❌ "function publish_job_posting does not exist"
```sql
-- Ejecutar:
RPC_FUNCTIONS_TO_EXECUTE.sql
```

#### ❌ "companies_i_name does not exist" o errores RLS
```sql
-- Ejecutar:
fix-all-job-tables-rls.sql
```

---

## PASO 2: Verificar RPC Functions 🔧

### 2.1 Test Manual de Funciones

**Ejecutar en SQL Editor:**

```sql
-- Test 1: Verificar que existen
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE '%job%'
ORDER BY routine_name;
```

**Resultado esperado:** Deberías ver al menos estas 4 funciones:
- `apply_to_job`
- `calculate_job_match_score`
- `publish_job_posting`
- `update_application_status`

### 2.2 Si NO aparecen las funciones:

```sql
-- Ejecutar TODO el archivo:
RPC_FUNCTIONS_TO_EXECUTE.sql
```

Luego volver a verificar con el SELECT del paso 2.1

---

## PASO 3: Crear Empresa de Prueba 🏢

### 3.1 Verificar si ya tienes empresa

```sql
SELECT
  c.id,
  c.name,
  c.status,
  c.credits_balance,
  cu.role
FROM companies c
JOIN company_users cu ON cu.company_id = c.id
WHERE cu.user_id = auth.uid()
LIMIT 1;
```

### 3.2 Si NO tienes empresa o quieres crear una nueva:

**Paso A:** Obtén tu email/user_id:
```sql
SELECT id, email FROM auth.users WHERE id = auth.uid();
```

**Paso B:** Edita `quick-test-setup.sql`:
- Cambia `'tu-email@ejemplo.com'` por tu email real (línea 20)

**Paso C:** Ejecuta TODO el archivo `quick-test-setup.sql`

**Resultado esperado:**
```
✅ Setup completado exitosamente!
Company ID: abc-123-xyz
Créditos: 500
Vacantes creadas: 3 (DRAFT)
```

### 3.3 Verificar empresa creada:

```sql
SELECT
  c.name,
  c.status,
  c.credits_balance,
  COUNT(jp.id) as vacantes
FROM companies c
LEFT JOIN company_users cu ON cu.company_id = c.id
LEFT JOIN job_postings jp ON jp.company_id = c.id
WHERE cu.user_id = auth.uid()
GROUP BY c.id, c.name, c.status, c.credits_balance;
```

**Debe mostrar:**
- Nombre: Tech Innovators SA
- Status: APPROVED
- Créditos: 500
- Vacantes: 3

---

## PASO 4: Verificar Frontend 🖥️

### 4.1 Servidor de Desarrollo Corriendo

```bash
# Verificar que el servidor está corriendo
# Deberías poder acceder a:
http://localhost:3000
```

Si no está corriendo:
```bash
cd c:\Users\molin\Downloads\yourcvpassport1\yourcvpassport
npm run dev
```

### 4.2 Verificar Rutas Principales

**Abrir en el navegador:**

✅ Ruta pública de búsqueda:
```
http://localhost:3000/jobs
```
**Debe mostrar:** Página de búsqueda con hero section azul

✅ Dashboard de empresa:
```
http://localhost:3000/company/dashboard
```
**Debe mostrar:** Dashboard con botón azul "Publicar Vacante"

✅ Gestión de vacantes:
```
http://localhost:3000/company/jobs
```
**Debe mostrar:** Lista de 3 vacantes DRAFT

✅ Aplicaciones:
```
http://localhost:3000/company/jobs/applications
```
**Debe mostrar:** Página vacía (aún no hay aplicaciones)

---

## PASO 5: Test del Flujo Completo 🔄

### Test 1: Crear Nueva Vacante ✏️

**Paso 1:** Ve a:
```
http://localhost:3000/company/jobs/new
```

**Paso 2:** Completa el Wizard - Step 1:
- Título: "Test Developer Position"
- Departamento: "Engineering"
- Tipo: Tiempo Completo
- Modalidad: Remoto
- Nivel: Mid
- ✅ Marcar "Posición remota"
  - Verificar que dropdown "Modalidad" se deshabilita
  - Verificar que muestra "Remoto"

**Paso 3:** Step 2:
- Descripción: "Este es un puesto de prueba..."
- Responsabilidades: Agregar 2-3 items
- Beneficios: Agregar 2-3 items

**Paso 4:** Step 3:
- Requisitos: Agregar 2-3 items
- Habilidades requeridas: JavaScript, React, TypeScript
- Habilidades opcionales: Node.js, Docker

**Paso 5:** Step 4:
- Salario mínimo: 50000
- Salario máximo: 70000
- Moneda: EUR
- Período: Anual
- ✅ Marcar "Mostrar salario públicamente"

**Paso 6:** Click "Guardar Borrador"

**Resultado esperado:**
- ✅ Toast verde: "Vacante creada exitosamente"
- ✅ Redirección a `/company/jobs`
- ✅ Nueva vacante aparece en la lista con estado DRAFT

---

### Test 2: Publicar Vacante 💰

**Paso 1:** En `/company/jobs`, encontrar la vacante creada

**Paso 2:** Click en botón "Publicar"

**Paso 3:** Verificar modal de confirmación:
```
"Esto consumirá 30 créditos. ¿Deseas publicar esta vacante?"
```

**Paso 4:** Click "Aceptar"

**Resultado esperado:**
- ✅ Toast verde: "Vacante publicada exitosamente"
- ✅ Estado cambia de DRAFT → PUBLISHED
- ✅ Aparece fecha de publicación
- ✅ Créditos reducen de 500 → 470

**Verificar créditos en BD:**
```sql
SELECT credits_balance FROM companies
WHERE id IN (
  SELECT company_id FROM company_users WHERE user_id = auth.uid()
);
```
Debe mostrar: **470**

---

### Test 3: Ver Vacante Públicamente 👀

**Paso 1:** Ir a:
```
http://localhost:3000/jobs
```

**Paso 2:** Verificar que aparece la vacante publicada

**Paso 3:** Verificar elementos:
- ✅ Título visible
- ✅ Tags: Tiempo Completo, Remoto, Mid
- ✅ Habilidades (primeras 5)
- ✅ Salario visible (50,000 - 70,000 EUR/año)
- ✅ Fecha: "Publicado hoy"

**Paso 4:** Click en la vacante

**Resultado esperado:**
- ✅ Redirección a `/jobs/test-developer-position-[timestamp]`
- ✅ Toda la información se muestra correctamente
- ✅ Sidebar con habilidades
- ✅ Botón "Aplicar Ahora" visible

---

### Test 4: Aplicar a Vacante (Como Candidato) 📝

**IMPORTANTE:** Necesitas tener un perfil de candidato. Si no tienes:

```sql
-- Crear perfil temporal de prueba
-- (O usa tu perfil real si ya tienes uno)
```

**Paso 1:** En la página de detalle de vacante, click "Aplicar Ahora"

**Paso 2:** Verificar que se abre el modal de aplicación

**Paso 3:** Completar:
- Carta de presentación: "Me interesa mucho esta posición..."

**Paso 4:** Click "Enviar Aplicación"

**Resultado esperado:**
- ✅ Toast verde: "¡Aplicación enviada con éxito!"
- ✅ Modal se cierra
- ✅ Botón cambia a "Ya aplicaste"
- ✅ No puedes aplicar de nuevo

**Verificar en BD:**
```sql
SELECT
  ja.id,
  ja.status,
  ja.match_score,
  ja.created_at,
  jp.title,
  p.full_name
FROM job_applications ja
JOIN job_postings jp ON jp.id = ja.job_posting_id
JOIN profiles p ON p.id = ja.profile_id
WHERE ja.company_id IN (
  SELECT company_id FROM company_users WHERE user_id = auth.uid()
)
ORDER BY ja.created_at DESC
LIMIT 1;
```

Debe mostrar:
- Estado: NEW
- Match score: 0-100 (calculado automáticamente)
- Tu nombre y título de vacante

---

### Test 5: Ver Aplicación (Como Empresa) 📊

**Paso 1:** Ir a:
```
http://localhost:3000/company/jobs/applications
```

**Paso 2:** Verificar estadísticas:
- Total: 1
- Nuevas: 1
- Match Score Promedio: X%

**Paso 3:** Verificar tabla de aplicaciones:
- ✅ Aparece 1 fila
- ✅ Foto del candidato
- ✅ Nombre visible
- ✅ Vacante: "Test Developer Position"
- ✅ Match Score con color (verde/amarillo/rojo)
- ✅ Estado: NEW
- ✅ Badge "Nueva" visible

**Paso 4:** Click en la aplicación

**Resultado esperado:**
- ✅ Modal de detalle se abre
- ✅ Información completa del candidato
- ✅ Carta de presentación visible
- ✅ Match score destacado
- ✅ Opciones de calificación (estrellas)
- ✅ Campo de notas internas
- ✅ Dropdown para cambiar estado

---

### Test 6: Cambiar Estado de Aplicación 🔄

**Paso 1:** En el modal de detalle, cambiar estado:
```
NEW → REVIEWING
```

**Paso 2:** Agregar nota interna:
```
"Candidato interesante, revisar experiencia en React"
```

**Paso 3:** Calificar con 4 estrellas

**Paso 4:** Click "Guardar Cambios"

**Resultado esperado:**
- ✅ Toast verde: "Estado actualizado correctamente"
- ✅ Modal se cierra
- ✅ En la tabla, estado cambia a "REVIEWING"
- ✅ Badge "Nueva" desaparece
- ✅ Aparecen 4 estrellas

**Verificar en BD:**
```sql
SELECT
  status,
  internal_notes,
  rating,
  viewed_by_company,
  viewed_at
FROM job_applications
WHERE company_id IN (
  SELECT company_id FROM company_users WHERE user_id = auth.uid()
)
ORDER BY created_at DESC
LIMIT 1;
```

Debe mostrar:
- status: REVIEWING
- internal_notes: "Candidato interesante..."
- rating: 4
- viewed_by_company: true
- viewed_at: (timestamp actual)

---

### Test 7: Exportar a CSV 📥

**Paso 1:** En `/company/jobs/applications`

**Paso 2:** Click en botón verde "Exportar a CSV"

**Resultado esperado:**
- ✅ Se descarga archivo `aplicaciones_2025-12-30.csv`
- ✅ Toast verde: "Aplicaciones exportadas exitosamente"

**Paso 3:** Abrir el CSV en Excel

**Verificar columnas:**
- Candidato
- Email
- Teléfono
- Vacante
- Departamento
- Match Score
- Estado
- Calificación
- Fecha Aplicación
- Ubicación

**Verificar datos:**
- ✅ 1 fila con los datos correctos
- ✅ Caracteres especiales (ñ, á, etc.) se ven bien
- ✅ Match score es número
- ✅ Estado: REVIEWING

---

### Test 8: Filtros y Búsqueda 🔍

**Paso 1:** En `/company/jobs/applications`

**Paso 2:** Cambiar filtro de estado a "Nuevas"

**Resultado esperado:**
- ✅ Tabla se vacía (porque cambiamos el estado a REVIEWING)
- ✅ Mensaje: "No hay aplicaciones con este filtro"

**Paso 3:** Cambiar filtro a "Revisando"

**Resultado esperado:**
- ✅ Aparece la aplicación de nuevo

**Paso 4:** Cambiar filtro a "Todos los estados"

**Resultado esperado:**
- ✅ Aparece la aplicación

---

### Test 9: Modo Oscuro 🌙

**Paso 1:** Activar modo oscuro en tu navegador/OS

**Paso 2:** Visitar todas las páginas:
- `/jobs`
- `/jobs/test-developer-position-...`
- `/company/jobs`
- `/company/jobs/new`
- `/company/jobs/applications`

**Verificar:**
- ✅ Todos los textos son legibles
- ✅ Fondos oscuros
- ✅ Inputs tienen borde visible
- ✅ Dropdowns funcionan
- ✅ Modals tienen fondo oscuro
- ✅ No hay texto blanco sobre fondo blanco

---

### Test 10: Responsive / Móvil 📱

**Paso 1:** Abrir DevTools (F12)

**Paso 2:** Toggle device toolbar (Ctrl+Shift+M)

**Paso 3:** Seleccionar dispositivo móvil (iPhone 12, etc.)

**Paso 4:** Navegar por todas las páginas

**Verificar:**
- ✅ Wizard de creación es usable
- ✅ Tabla de aplicaciones tiene scroll horizontal
- ✅ Modals ocupan toda la pantalla
- ✅ Botones son accesibles
- ✅ Texto legible (no muy pequeño)
- ✅ Stats cards se apilan en columna

---

## PASO 6: Verificar Consola del Navegador 🐛

### 6.1 Abrir DevTools Console

**Paso 1:** F12 → Console

**Paso 2:** Filtrar por "Error"

**Resultado esperado:**
- ✅ NO debería haber `console.error()` en producción
- ✅ Solo logs informativos si acaso
- ⚠️ Warnings de React están OK (son normales en desarrollo)

### 6.2 Si ves errores tipo:

```
❌ "column companies_i_name does not exist"
→ Ejecutar: fix-all-job-tables-rls.sql
```

```
❌ "function publish_job_posting does not exist"
→ Ejecutar: RPC_FUNCTIONS_TO_EXECUTE.sql
```

```
❌ "permission denied for table job_postings"
→ Ejecutar: fix-all-job-tables-rls.sql
```

---

## PASO 7: Verificar Network Requests 🌐

### 7.1 Abrir DevTools → Network

**Paso 1:** Recargar `/jobs`

**Verificar:**
- ✅ Request a Supabase: `/rest/v1/job_postings?status=eq.PUBLISHED`
- ✅ Status: 200 OK
- ✅ Response tiene datos

**Paso 2:** Aplicar a vacante

**Verificar:**
- ✅ Request POST: `/rest/v1/rpc/apply_to_job`
- ✅ Status: 200 OK
- ✅ No errores 401 (unauthorized) o 403 (forbidden)

---

## PASO 8: Tests de Edge Cases ⚠️

### Test A: Aplicación Duplicada

**Intenta aplicar 2 veces a la misma vacante**

**Resultado esperado:**
- ✅ Toast rojo: "Ya has aplicado a esta vacante"
- ✅ No se crea aplicación duplicada

### Test B: Validación de Salario

**Al crear vacante, intenta poner:**
- Salario mínimo: 999999999999

**Resultado esperado:**
- ✅ Toast rojo: "El salario máximo es 10,000,000"
- ✅ Input no acepta el valor

### Test C: Modalidad Remota

**Al crear vacante:**
1. Marca "Posición remota"
2. Verifica que dropdown "Modalidad" se deshabilita
3. Desmarca "Posición remota"
4. Verifica que dropdown se habilita de nuevo
5. Cambia dropdown a "Remoto"
6. Verifica que checkbox se marca automáticamente

**Resultado esperado:**
- ✅ Sincronización perfecta
- ✅ No puedes tener "Presencial" + "Remoto" al mismo tiempo

### Test D: Salario "A Convenir"

**Crear vacante sin poner salario (dejar campos vacíos)**

**Publicar y ver en `/jobs`**

**Resultado esperado:**
- ✅ No muestra rango de salario
- ✅ O muestra texto "A convenir"

---

## ✅ Checklist Final

Marca cada item cuando lo hayas verificado:

### Base de Datos:
- [ ] Todas las tablas existen
- [ ] RLS habilitado en todas las tablas
- [ ] 4 RPC functions instaladas
- [ ] Triggers creados (slug, updated_at)
- [ ] Empresa de prueba creada
- [ ] 500 créditos en cuenta

### Frontend - Empresa:
- [ ] `/company/jobs` muestra vacantes
- [ ] Wizard de creación funciona (4 pasos)
- [ ] Guardar borrador funciona
- [ ] Publicar consume 30 créditos
- [ ] `/company/jobs/applications` funciona
- [ ] Ver detalle de aplicación
- [ ] Cambiar estado funciona
- [ ] Calificación y notas funcionan
- [ ] Export CSV funciona

### Frontend - Candidato:
- [ ] `/jobs` muestra vacantes publicadas
- [ ] Filtros de búsqueda funcionan
- [ ] Detalle de vacante funciona
- [ ] Aplicar a vacante funciona
- [ ] Prevención de duplicados funciona
- [ ] Match score se calcula

### Validaciones:
- [ ] Salario máximo 10M
- [ ] Sincronización remoto/modalidad
- [ ] No console.error en producción
- [ ] Toast notifications funcionan

### UX:
- [ ] Dark mode funciona
- [ ] Responsive en móvil
- [ ] Todos los textos legibles
- [ ] Botones accesibles
- [ ] Loading states visibles

---

## 🎉 Si TODO está ✅

**¡FELICIDADES! El sistema de vacantes está 100% funcional.**

### Próximos pasos opcionales:

1. **Configurar emails** (setup-email-notifications.sql)
2. **Integrar notificaciones** en dashboard (useJobNotifications)
3. **Agregar preguntas personalizadas**
4. **Mejorar analytics**

---

## 🐛 Si algo falla

**Consulta:**
- `QUE_FALTA.md` - Lista de pendientes
- `NUEVAS_FUNCIONALIDADES.md` - Funcionalidades implementadas
- `SETUP_EMPRESA_TEST.md` - Guía de setup

**O ejecuta:**
```sql
diagnose-job-system.sql
```

Para ver exactamente qué está mal.

---

**Fecha de verificación:** _________
**Verificado por:** _________
**Resultado:** ✅ APROBADO / ⚠️ CON ISSUES / ❌ FALLA
