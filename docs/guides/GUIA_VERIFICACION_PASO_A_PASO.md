# 🔍 Guía de Verificación Paso a Paso

## ⚡ Inicio Rápido (5 minutos)

### Paso 1: Verificar Sistema
**Tiempo:** 1 minuto

1. Abre **Supabase Dashboard** → SQL Editor
2. Copia y pega TODO el contenido de `VERIFICACION_RAPIDA.sql`
3. Click en **RUN**
4. Revisa los resultados:

**Interpretación:**

| Símbolo | Significado | Acción |
|---------|-------------|---------|
| ✅ | Todo bien | Continúa al siguiente paso |
| ⚠️ | Advertencia | Puedes continuar, pero revisa |
| ❌ | Error crítico | Ejecuta el script sugerido |

---

### Paso 2: Setup de Empresa de Prueba
**Tiempo:** 2 minutos

1. Abre `SETUP_RAPIDO_TEST.sql`
2. **IMPORTANTE:** En línea 13, cambia:
   ```sql
   v_test_email TEXT := 'TU_EMAIL@example.com';
   ```
   Por tu email real, ejemplo:
   ```sql
   v_test_email TEXT := 'juan.perez@gmail.com';
   ```

3. **TAMBIÉN** en línea 217, cambia:
   ```sql
   WHERE contact_email = 'TU_EMAIL@example.com'
   ```
   Por:
   ```sql
   WHERE contact_email = 'juan.perez@gmail.com'
   ```

4. Copia TODO el archivo
5. Pega en Supabase SQL Editor
6. Click **RUN**

**Resultado esperado:**
```
✅ Usuario encontrado: [uuid]
✅ Empresa creada: [uuid]
✅ Usuario asignado como OWNER
✅ 3 vacantes de ejemplo creadas en DRAFT

Créditos disponibles: 500 (suficiente para ~16 vacantes)
```

---

### Paso 3: Verificar Frontend - Dashboard Empresa
**Tiempo:** 2 minutos

1. Inicia la aplicación:
   ```bash
   npm run dev
   ```

2. Inicia sesión con tu usuario

3. Ve a la URL: **http://localhost:5173/company/dashboard**

**Verifica:**
- [ ] Ves el dashboard de empresa
- [ ] En "Quick Actions" aparece "Publicar Vacante" como PRIMERA opción con icono de maletín
- [ ] El botón tiene color azul (bg-cv-blue)

**Si no ves el dashboard:**
- Verifica que iniciaste sesión con el email correcto
- Verifica que en Supabase se creó la empresa correctamente

---

## 🧪 Testing Completo (15 minutos)

### Test 1: Gestión de Vacantes
**Tiempo:** 5 minutos

#### 1.1 Ver vacantes existentes

1. Ve a: **http://localhost:5173/company/jobs**
2. Deberías ver 3 vacantes en estado DRAFT

**Verifica:**
- [ ] Se muestran las 3 vacantes
- [ ] Cada una tiene título, departamento, ubicación
- [ ] Botón "Editar" funciona
- [ ] Badges de estado "DRAFT" visible
- [ ] Interfaz en modo oscuro si tu sistema está en oscuro

#### 1.2 Editar una vacante

1. Click en "Editar" en cualquier vacante
2. Deberías ver el wizard de 4 pasos

**Verifica cada paso:**

**Paso 1 - Información Básica:**
- [ ] Título se muestra correctamente
- [ ] Descripción cargada
- [ ] Departamento seleccionado
- [ ] Ubicación (ciudad, estado, país) cargada

**Paso 2 - Detalles del Puesto:**
- [ ] Tipo de empleo seleccionado (Full-time/Part-time/etc)
- [ ] Modalidad de trabajo seleccionada
- [ ] Checkbox "Posición remota":
  - [ ] Si está CHECKED → dropdown "Modalidad" debe estar DESHABILITADO y en REMOTE
  - [ ] Si está UNCHECKED → dropdown "Modalidad" debe estar HABILITADO
- [ ] **TEST CRÍTICO:** Intenta activar checkbox remoto y cambiar dropdown:
  - [ ] No debería dejar seleccionar "Presencial" si checkbox está activado
  - [ ] Al desactivar checkbox, dropdown vuelve a habilitarse
- [ ] Nivel de experiencia seleccionado

**Paso 3 - Requisitos y Beneficios:**
- [ ] Skills requeridas se muestran como pills
- [ ] Skills deseables se muestran
- [ ] Beneficios listados
- [ ] Campo de salario:
  - [ ] Muestra valores actuales
  - [ ] **TEST:** Intenta poner 99999999999
  - [ ] Debería mostrar toast error: "El salario máximo es 10,000,000"
  - [ ] No debería dejar guardar valor mayor a 10M
- [ ] Moneda MXN disponible en dropdown

**Paso 4 - Revisión:**
- [ ] Muestra resumen de toda la información
- [ ] Botones "Guardar como Borrador" y "Publicar" visibles

#### 1.3 Publicar vacante

1. En el paso 4, click "Publicar Vacante"
2. Debería aparecer modal de confirmación mostrando costo (30 créditos)

**Verifica:**
- [ ] Modal muestra: "Esta acción consumirá 30 créditos"
- [ ] Muestra balance actual: 500 créditos
- [ ] Muestra nuevo balance: 470 créditos
- [ ] Click "Confirmar y Publicar"
- [ ] ✅ Toast success: "Vacante publicada exitosamente"
- [ ] Redirige a /company/jobs
- [ ] La vacante ahora aparece con badge "PUBLISHED" (verde)

**Verificar en base de datos:**
```sql
SELECT id, title, status, published_at, credits_cost
FROM job_postings
WHERE status = 'PUBLISHED'
ORDER BY published_at DESC
LIMIT 1;

-- Verificar descuento de créditos
SELECT credit_balance, total_credits_used
FROM companies
WHERE contact_email = 'TU_EMAIL@gmail.com';
```

**Resultado esperado:**
- Vacante tiene status = 'PUBLISHED'
- published_at = fecha/hora actual
- credit_balance = 470 (si tenías 500)
- total_credits_used = 30

---

### Test 2: Búsqueda Pública de Vacantes
**Tiempo:** 3 minutos

1. **Abre una ventana de incógnito** (para simular usuario no autenticado)
2. Ve a: **http://localhost:5173/jobs**

**Verifica:**
- [ ] Se muestra la vacante que acabas de publicar
- [ ] Muestra título, empresa, ubicación
- [ ] Badge de modalidad (Remoto/Híbrido/Presencial)
- [ ] Badge de tipo de empleo (Full-time/Part-time)
- [ ] Match score NO se muestra (porque no estás autenticado)

**Búsqueda:**
- [ ] Barra de búsqueda funciona
- [ ] Filtros (remoto, modalidad, experiencia) funcionan
- [ ] Resultados se filtran correctamente

**Click en una vacante:**
- [ ] Abre modal con detalles completos
- [ ] Muestra descripción completa
- [ ] Muestra requisitos
- [ ] Muestra responsabilidades
- [ ] Muestra beneficios
- [ ] Muestra rango salarial
- [ ] Skills mostradas como pills
- [ ] Botón "Aplicar ahora" visible

---

### Test 3: Aplicar a Vacante (Como Candidato)
**Tiempo:** 4 minutos

#### 3.1 Crear perfil de candidato

**Opción A: Si ya tienes otro usuario**
1. Inicia sesión con otro usuario
2. Asegúrate de tener perfil completo

**Opción B: Crear nuevo usuario de prueba**
1. Cierra sesión
2. Regístrate con nuevo email: `candidato.test@gmail.com`
3. Completa perfil básico:
   - Nombre completo
   - Email
   - Ubicación
   - Agrega al menos 2 skills que coincidan con la vacante

#### 3.2 Aplicar a la vacante

1. Ve a: **http://localhost:5173/jobs**
2. Click en la vacante publicada
3. Modal se abre
4. Click "Aplicar ahora"

**Verifica:**
- [ ] Modal de aplicación se abre
- [ ] Campo de carta de presentación visible
- [ ] Botón "Enviar Aplicación" habilitado

5. Escribe carta de presentación (opcional)
6. Click "Enviar Aplicación"

**Resultado esperado:**
- [ ] ✅ Toast success: "Aplicación enviada exitosamente. Match score: XX%"
- [ ] Modal se cierra
- [ ] Ya no puedes volver a aplicar (botón cambia a "Ya aplicaste")

**Verificar en base de datos:**
```sql
SELECT
  ja.id,
  ja.match_score,
  ja.status,
  ja.viewed_by_company,
  p.full_name as candidato,
  jp.title as vacante
FROM job_applications ja
JOIN profiles p ON p.id = ja.profile_id
JOIN job_postings jp ON jp.id = ja.job_posting_id
ORDER BY ja.created_at DESC
LIMIT 1;
```

**Resultado esperado:**
- status = 'NEW'
- viewed_by_company = false
- match_score = un número entre 0-100

---

### Test 4: Ver Aplicaciones (Como Empresa)
**Tiempo:** 3 minutos

1. Cierra sesión del candidato
2. Inicia sesión con tu usuario de empresa
3. Ve a: **http://localhost:5173/company/jobs/applications**

**Verifica página principal:**
- [ ] Lista de aplicaciones recibidas
- [ ] Muestra nombre del candidato
- [ ] Muestra vacante aplicada
- [ ] Match score visible (XX%)
- [ ] Estado "Nueva" (badge azul)
- [ ] Fecha de aplicación
- [ ] Botón "Ver Detalles"

**Filtros:**
- [ ] Dropdown de filtro por estado funciona
- [ ] Filtro por vacante funciona
- [ ] Búsqueda por nombre funciona

**Click "Ver Detalles":**
- [ ] Modal se abre con información completa
- [ ] Muestra información del candidato
- [ ] Muestra carta de presentación
- [ ] Muestra skills del candidato
- [ ] Dropdown para cambiar estado
- [ ] Campo de notas internas
- [ ] Sistema de calificación (estrellas)

**Cambiar estado:**
1. Selecciona "En revisión" del dropdown
2. Agrega nota: "Candidato interesante"
3. Califica con 4 estrellas
4. Click "Guardar Cambios"

**Resultado esperado:**
- [ ] ✅ Toast success
- [ ] Modal se cierra
- [ ] En la lista, el estado cambió a "En revisión" (badge amarillo)
- [ ] La aplicación ya no aparece como "no leída"

---

### Test 5: Exportación a CSV
**Tiempo:** 2 minutos

1. En la página de aplicaciones (/company/jobs/applications)
2. Busca el botón verde "Exportar a CSV" (arriba a la derecha)

**Verifica:**
- [ ] Botón visible con icono de descarga
- [ ] Si hay aplicaciones → botón HABILITADO
- [ ] Si NO hay aplicaciones → botón DESHABILITADO (opacity 50%)

3. Click "Exportar a CSV"

**Resultado esperado:**
- [ ] ✅ Toast: "Aplicaciones exportadas exitosamente"
- [ ] Se descarga archivo: `aplicaciones_YYYY-MM-DD.csv`
- [ ] Abre el CSV en Excel

**Verifica contenido del CSV:**
- [ ] Headers: Candidato, Email, Teléfono, Vacante, Departamento, Match Score, Estado, Calificación, Fecha Aplicación, Ubicación
- [ ] Datos correctos en cada columna
- [ ] Acentos se ven bien (UTF-8 con BOM)
- [ ] Match score es número
- [ ] Fechas en formato correcto

---

## 🌙 Test de Modo Oscuro

**Tiempo:** 2 minutos

1. Activa modo oscuro en tu sistema operativo
2. Recarga la aplicación

**Páginas a verificar:**

### /company/jobs/new (Wizard)
- [ ] Fondo oscuro
- [ ] Inputs con fondo oscuro
- [ ] Texto blanco/claro
- [ ] Bordes visibles pero sutiles
- [ ] Dropdowns en oscuro
- [ ] Pills/badges legibles

### /company/jobs/applications
- [ ] Tabla legible
- [ ] Cards en oscuro
- [ ] Modales en oscuro
- [ ] Botones con buen contraste

### /jobs (Búsqueda pública)
- [ ] Cards de vacantes en oscuro
- [ ] Filtros en oscuro
- [ ] Modal de detalles en oscuro

**Verifica que NO haya:**
- [ ] ❌ Fondos blancos donde no deben
- [ ] ❌ Texto negro sobre fondo oscuro (ilegible)
- [ ] ❌ Inputs en blanco

---

## 📱 Test Responsive / Mobile

**Tiempo:** 3 minutos

1. Abre Chrome DevTools (F12)
2. Click en "Toggle Device Toolbar" (Ctrl+Shift+M)
3. Selecciona "iPhone 12 Pro" o "iPad"

**Páginas a verificar:**

### /company/jobs
- [ ] Lista se adapta (1 columna en móvil)
- [ ] Botones se ven completos
- [ ] No hay overflow horizontal

### /company/jobs/new
- [ ] Wizard se ve bien en móvil
- [ ] Inputs ocupan todo el ancho
- [ ] Botones accesibles
- [ ] Steps navigation visible

### /jobs
- [ ] Cards en 1 columna
- [ ] Filtros colapsados o apilados
- [ ] Modal no se sale de pantalla

---

## 🚨 Test de Errores y Edge Cases

**Tiempo:** 5 minutos

### 1. Sin créditos suficientes

```sql
-- Reducir créditos a 10
UPDATE companies
SET credit_balance = 10
WHERE contact_email = 'TU_EMAIL@gmail.com';
```

1. Intenta publicar una vacante
2. **Esperado:**
   - [ ] ❌ Toast error: "Créditos insuficientes"
   - [ ] No se publica
   - [ ] Vacante permanece en DRAFT

```sql
-- Restaurar créditos
UPDATE companies
SET credit_balance = 500
WHERE contact_email = 'TU_EMAIL@gmail.com';
```

### 2. Aplicar dos veces a la misma vacante

1. Como candidato, aplica a una vacante
2. ✅ Primera aplicación exitosa
3. Recarga la página
4. Intenta aplicar de nuevo
5. **Esperado:**
   - [ ] Botón muestra "Ya aplicaste" (deshabilitado)
   - [ ] O toast error: "Ya aplicaste a esta vacante"

### 3. Validación de salario extremo

1. Ve a crear/editar vacante
2. En salario mínimo, escribe: `99999999999`
3. Presiona Tab o click fuera del input
4. **Esperado:**
   - [ ] 🚫 Toast error: "El salario máximo es 10,000,000"
   - [ ] Valor no se guarda

### 4. Remote + Presencial contradicción

1. Ve a crear/editar vacante
2. Activa checkbox "Posición remota"
3. **Verifica:**
   - [ ] Dropdown "Modalidad" se DESHABILITA
   - [ ] Dropdown muestra "Remoto" automáticamente
   - [ ] Dropdown tiene opacity reducida
   - [ ] Cursor muestra "not-allowed"

4. Desactiva checkbox "Posición remota"
5. **Verifica:**
   - [ ] Dropdown se HABILITA
   - [ ] Puedes seleccionar "Presencial", "Híbrido", etc.

### 5. Console limpia (sin errors)

1. Abre Chrome DevTools → Console
2. Navega por todas las páginas:
   - /company/dashboard
   - /company/jobs
   - /company/jobs/new
   - /company/jobs/applications
   - /jobs
3. Aplica a una vacante
4. Cambia estado de aplicación
5. Exporta CSV

**Verifica:**
- [ ] ❌ NO debe haber `console.error` en NINGUNA parte
- [ ] Todos los errores deben mostrarse como **toast notifications**
- [ ] Pueden haber warnings normales de React/Vite

---

## 🔔 Test de Notificaciones (Opcional)

**Tiempo:** 3 minutos

### Setup hook de notificaciones

El hook `useJobNotifications` ya está creado pero NO está integrado en el dashboard.

**Para probarlo manualmente:**

1. Abre `components/company/CompanyDashboardPage.tsx`
2. Temporalmente agrega al inicio del componente:

```typescript
import { useJobNotifications } from '../hooks/useJobNotifications';

// Dentro del componente:
const { notifications, unreadCount } = useJobNotifications(companyId);

console.log('Notificaciones:', notifications);
console.log('No leídas:', unreadCount);
```

3. Guarda y recarga
4. Abre Console de Chrome
5. Como candidato (en otra ventana), aplica a una vacante
6. Vuelve a ventana de empresa

**Esperado:**
- [ ] 📩 Toast aparece: "Nueva aplicación de [Nombre] para [Vacante]"
- [ ] Console muestra notificaciones actualizadas
- [ ] unreadCount incrementa

---

## ✅ Checklist Final de Verificación

### Base de Datos
- [ ] 4 RPC functions instaladas
- [ ] Políticas RLS sin errores
- [ ] Empresa de prueba creada
- [ ] Empresa con status APPROVED
- [ ] Créditos >= 30
- [ ] Al menos 1 vacante publicada
- [ ] Al menos 1 aplicación recibida

### Frontend - Empresa
- [ ] Dashboard muestra "Publicar Vacante" como primera acción
- [ ] Lista de vacantes funciona
- [ ] Wizard de creación completo (4 pasos)
- [ ] Validaciones de salario funcionan
- [ ] Sincronización remoto/modalidad funciona
- [ ] Publicación consume créditos correctamente
- [ ] Lista de aplicaciones funciona
- [ ] Modal de detalle de aplicación completo
- [ ] Cambio de estado funciona
- [ ] Exportación CSV funciona
- [ ] Sin console.error

### Frontend - Público
- [ ] Búsqueda de vacantes funciona
- [ ] Filtros funcionan
- [ ] Modal de detalles se abre
- [ ] Aplicación funciona
- [ ] No se puede aplicar dos veces
- [ ] Sin console.error

### UI/UX
- [ ] Modo oscuro funciona en todas las páginas
- [ ] Responsive en móvil
- [ ] Toast notifications en lugar de console.error
- [ ] Traducciones correctas (no aparecen keys)

### Funcionalidades Avanzadas
- [ ] Match score se calcula (número entre 0-100)
- [ ] Hook de notificaciones funciona (si lo probaste)
- [ ] Triggers de email configurados (opcional)

---

## 🎯 Próximos Pasos Después de Verificación

### Si TODO funciona (todos ✅):
1. **Integrar notificaciones en UI** (badge con contador)
2. **Configurar edge function de emails** (opcional)
3. **Implementar preguntas personalizadas** (tabla existe, falta UI)
4. **Agregar analytics** (vistas, aplicaciones por día)
5. **Mejorar búsqueda** (full-text search con PostgreSQL)

### Si hay errores (algunos ❌):
1. Ejecuta `VERIFICACION_RAPIDA.sql` de nuevo
2. Lee el mensaje de error específico
3. Ejecuta el script sugerido
4. Vuelve a verificar

---

## 📞 Troubleshooting Común

### "No veo el dashboard de empresa"
- Verifica que iniciaste sesión
- Verifica que tu usuario esté en `company_users`
- Ejecuta: `SELECT * FROM company_users WHERE user_id = 'TU_USER_ID';`

### "No puedo publicar vacante (créditos insuficientes)"
- Ejecuta: `UPDATE companies SET credit_balance = 500 WHERE id = 'TU_COMPANY_ID';`

### "Error: companies_i_name does not exist"
- Ejecuta: `fix-all-job-tables-rls.sql`

### "Error: function publish_job_posting does not exist"
- Ejecuta: `RPC_FUNCTIONS_TO_EXECUTE.sql`

### "Modo oscuro no funciona"
- Verifica que tu sistema operativo esté en modo oscuro
- Recarga la página (Ctrl+Shift+R)
- Verifica que los estilos tienen clases `dark:`

### "CSV tiene caracteres raros (acentos)"
- Abre con Excel → Datos → Desde texto → UTF-8
- O usa Google Sheets (detecta UTF-8 automáticamente)

---

## 📊 Métricas de Éxito

Al completar esta verificación, deberías tener:

- ✅ **Sistema 100% funcional**
- ✅ **0 errores en consola**
- ✅ **Modo oscuro completo**
- ✅ **Responsive 100%**
- ✅ **Todas las validaciones funcionando**
- ✅ **CSV exportando correctamente**
- ✅ **Flow completo: Crear → Publicar → Aplicar → Gestionar**

**Tiempo total estimado:** ~30-40 minutos

¡Listo para producción! 🚀
