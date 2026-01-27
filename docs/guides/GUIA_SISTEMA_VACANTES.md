# 📋 Guía del Sistema de Vacantes - YourCVPassport

## 🎯 Resumen Ejecutivo

El sistema de vacantes permite que:
- **Empresas** publiquen ofertas de trabajo (costo: 30 créditos)
- **Candidatos** busquen y apliquen a vacantes
- **Algoritmo automático** calcule compatibilidad (0-100%)
- **Gestión completa** de aplicaciones recibidas

---

## 🏢 Para Empresas - ¿Cómo Publicar Vacantes?

### 1️⃣ Acceso al Sistema

**Opción A: Desde el Dashboard de Empresa**
1. Inicia sesión como usuario de empresa
2. Ve a `/company/dashboard`
3. Busca la tarjeta "Job Postings" o "Vacantes"
4. Click en el botón que te lleva a `/company/jobs`

**Opción B: Directamente**
- Navega a: **`/company/jobs`**

### 2️⃣ Crear una Nueva Vacante

1. Click en botón **"Crear Nueva Vacante"**
2. Te redirige a `/company/jobs/new`
3. Completa el **Wizard de 4 Pasos**:

#### 📝 Paso 1: Información Básica
- Título del puesto **(requerido)**
- Departamento
- Tipo de empleo (Tiempo completo, Medio tiempo, etc.)
- Modalidad (Remoto, Presencial, Híbrido)
- Nivel de experiencia (Junior, Mid, Senior, etc.)
- Ubicación (ciudad, estado, país)
- Descripción detallada **(requerido)**

#### 📋 Paso 2: Requisitos y Responsabilidades
- **Responsabilidades** (lista dinámica con botón +)
- **Requisitos obligatorios** (lista dinámica)
- **Nice to have** (requisitos deseables)
- **Beneficios** (lista dinámica)
- **Habilidades requeridas** (tags)
- **Habilidades opcionales** (tags)

#### 💰 Paso 3: Salario y Aplicación
- Rango salarial (mínimo - máximo)
- Moneda (USD, EUR, MXN, etc.)
- Período (Por hora, Mensual, Anual)
- **Mostrar/Ocultar salario públicamente**
- Fecha límite de aplicación
- Email de contacto
- URL de aplicación externa (opcional)
- Instrucciones especiales para aplicar

#### 🚀 Paso 4: SEO y Publicación
- **Slug** (URL amigable, auto-genera desde título)
- Meta título (para SEO)
- Meta descripción (para SEO)
- **Vista previa** del slug final
- Opciones:
  - **Guardar como Borrador** (gratis)
  - **Publicar Directamente** (consume 30 créditos)

### 3️⃣ Gestionar Vacantes Existentes

Ruta: **`/company/jobs`**

**Vista de Tabla con:**
- Todas las vacantes creadas
- Estados: DRAFT, PUBLISHED, PAUSED, CLOSED, FILLED
- Filtro por estado
- Acciones disponibles:
  - ✏️ **Editar** → `/company/jobs/edit/:id`
  - 🚀 **Publicar** (si está en DRAFT) - Consume 30 créditos
  - ⏸️ **Pausar** (si está PUBLISHED)
  - ▶️ **Reanudar** (si está PAUSED)
  - 🔒 **Cerrar** o **Marcar como Llena**
  - 👁️ **Ver Aplicaciones**
  - 🔗 **Vista Previa Pública**

**Dashboard de Estadísticas:**
- Total de vacantes
- Publicadas actualmente
- Total de aplicaciones recibidas
- Total de vistas
- **Balance de créditos** (destacado)

### 4️⃣ Ver Aplicaciones Recibidas

Ruta: **`/company/jobs/applications`**

**Dashboard con 6 Estadísticas:**
- Total de aplicaciones
- Nuevas (sin revisar)
- En revisión
- Preseleccionadas
- En entrevista
- **Match Score Promedio**

**Tabla de Aplicaciones:**
- Foto y nombre del candidato
- Vacante a la que aplicó
- **Match score** (0-100) con colores:
  - 🟢 Verde: 80-100 (excelente match)
  - 🟡 Amarillo: 60-79 (buen match)
  - 🔴 Rojo: 0-59 (match bajo)
- Estado actual
- Fecha de aplicación
- Rating (1-5 estrellas)
- Indicador **"Nueva"** para aplicaciones sin ver

**Modal de Detalle al Hacer Click:**
- Información completa del candidato
- Carta de presentación
- Respuestas a preguntas personalizadas
- **Sistema de calificación** (1-5 estrellas)
- **Notas internas** (privadas, no las ve el candidato)
- **Cambio rápido de estado:**
  - NEW → REVIEWING → SHORTLISTED → INTERVIEW → OFFER → HIRED
  - REJECTED (en cualquier momento)
- Botones:
  - **Ver Perfil Completo** → `/company/profile/:profileId`
  - **Descargar CV** (si disponible)

---

## 👥 Para Candidatos - ¿Cómo Buscar y Aplicar?

### 1️⃣ Buscar Vacantes

**Acceso:**
- Menú principal → **Profesionales** → **Buscar Empleos**
- O directamente: **`/jobs`** (español) o **`/empleos`** (español también)

**Hero Section con Búsqueda:**
- Campo de texto: "Título, palabra clave o empresa..."
- Campo de ubicación: "Ciudad, país o 'remoto'..."
- Botón de **Filtros Avanzados**

**Filtros Disponibles:**
- **Tipo de empleo:** Tiempo Completo, Medio Tiempo, Contrato, etc.
- **Modalidad:** Remoto, Presencial, Híbrido
- **Nivel de experiencia:** Entry, Junior, Mid, Senior, Lead, Executive

**Resultados:**
- **Cards visuales** con:
  - Logo de empresa
  - Título y empresa
  - Tags de tipo, modalidad, ubicación
  - Primeras 5 habilidades requeridas
  - Salario (si la empresa lo marcó como visible)
  - Fecha de publicación ("Hoy", "Ayer", "Hace X días")
  - Preview de descripción

### 2️⃣ Ver Detalle de Vacante

Click en cualquier vacante → **`/jobs/:slug`**

**Información Completa:**

**Header:**
- Logo y nombre de empresa
- Título del puesto
- Tags (tipo, modalidad, ubicación, experiencia)
- **Salario** (si visible)
- Departamento
- Fecha de publicación
- **Días restantes para aplicar** (si hay deadline)
- Botón grande **"Aplicar Ahora"** o **"Ya aplicaste"**

**Contenido Principal:**
- Descripción del puesto
- Responsabilidades (con checkmarks ✓)
- Requisitos obligatorios
- Requisitos deseables
- Beneficios

**Sidebar:**
- Habilidades requeridas (tags azules)
- Habilidades opcionales (tags grises)
- **Sobre la Empresa** (descripción + link a web)
- Instrucciones especiales (si hay)

### 3️⃣ Aplicar a una Vacante

**Requisitos:**
1. ✅ Estar autenticado (login)
2. ✅ Tener un perfil completo en YourCVPassport
3. ✅ No haber aplicado previamente

**Proceso:**
1. Click en **"Aplicar Ahora"**
2. Se abre **modal de aplicación** con:
   - **Carta de presentación** (textarea opcional)
   - **Preguntas personalizadas** de la empresa (si configuró):
     - Texto corto
     - Texto largo
     - Sí/No
     - Opción múltiple
   - Indicador de preguntas **requeridas** (*)

3. **Validaciones:**
   - Verifica autenticación
   - Verifica perfil completo
   - Verifica respuestas a preguntas requeridas
   - Verifica que no haya aplicado antes

4. **Al enviar:**
   - Llama a función RPC `apply_to_job()`
   - **Calcula automáticamente match score**
   - Registra aplicación en BD
   - Incrementa contador de aplicaciones
   - Muestra confirmación

5. **Estados de la aplicación:**
   - Puedes ir a tu dashboard personal para ver tus aplicaciones
   - Estado inicial: **NEW**
   - La empresa puede cambiar a: REVIEWING, SHORTLISTED, INTERVIEW, OFFER, HIRED, REJECTED

---

## 🎯 Sistema de Match Score (0-100)

Se calcula automáticamente al aplicar usando 4 criterios:

### 1. Habilidades (40 puntos)
- Compara `required_skills` de la vacante con `skills` del perfil
- Puntuación proporcional según coincidencias
- Si no hay skills requeridas: 20 puntos por defecto

### 2. Nivel de Experiencia (20 puntos)
- Match exacto: **20 puntos**
- SENIOR → MID: **15 puntos**
- MID → JUNIOR: **15 puntos**
- Otros casos: **10 puntos**

### 3. Ubicación (20 puntos)
- Remoto: **20 puntos** (siempre compatible)
- Híbrido: **15 puntos**
- Ciudad coincide exacta: **20 puntos**
- Solo país coincide: **10 puntos**
- Sin match: **5 puntos**

### 4. Calidad del Perfil (20 puntos)
- Basado en `profile_quality_score` (0-100)
- Fórmula: score / 5
- Sin score: **10 puntos** por defecto

**Ejemplo:**
- Skills: 8/10 coinciden → 32 puntos
- Experiencia: Mid para vacante Mid → 20 puntos
- Ubicación: Remoto → 20 puntos
- Perfil: 85/100 quality → 17 puntos
- **Total: 89% Match** 🟢

---

## 💰 Sistema de Créditos

### Costos
- **Publicar vacante:** 30 créditos (configurable en `credits_cost`)
- **Duración:** 30 días por defecto
- **Ver aplicaciones:** GRATIS (ya recibiste la aplicación)

### Flujo de Publicación
1. Empresa crea vacante en modo DRAFT (gratis)
2. Al publicar:
   - Verifica saldo de créditos ≥ 30
   - Verifica status de empresa = APPROVED
   - Deduce 30 créditos
   - Registra transacción en `company_credits_history`:
     - Tipo: **JOB_POSTING**
     - Monto: **-30**
     - Descripción: "Published: [Título de la vacante]"
   - Cambia status a PUBLISHED
   - Registra `published_at`
   - Calcula `application_deadline` (30 días adelante si no se especificó)

### Comprar Créditos
- Dashboard de empresa → **"Comprar Créditos"**
- O directamente: `/company/credits`

---

## 📊 Analytics y Tracking

### Para la Vacante
- **Vistas totales** (contador `views_count`)
- **Aplicaciones totales** (contador `applications_count`)
- Registro detallado en `job_posting_views`:
  - Profile ID del visitante
  - IP address
  - User agent
  - Timestamp

### Para la Empresa
- Total de aplicaciones por vacante
- Match score promedio
- Distribución por estados
- Tendencias temporales

---

## 🔐 Seguridad (RLS Policies)

### job_postings
- ✅ **Empresa**: Puede ver/editar/eliminar sus propias vacantes
- ✅ **Público**: Solo ve vacantes con status=PUBLISHED
- ✅ **Solo OWNER/ADMIN**: Pueden eliminar vacantes

### job_applications
- ✅ **Candidato**: Ve solo sus propias aplicaciones
- ✅ **Empresa**: Ve aplicaciones a sus vacantes
- ✅ **Candidato**: Puede actualizar su propia aplicación
- ✅ **Empresa**: Puede actualizar estado, notas, rating

---

## 📧 Notificaciones por Email

Ya hay templates preparados en `supabase/functions/send-email/index.ts`:

### 1. new-job-application
**Para:** Empresa
**Cuando:** Nuevo candidato aplica
**Contiene:**
- Nombre del candidato
- Vacante
- Match score
- Link para ver aplicación

### 2. application-status-update
**Para:** Candidato
**Cuando:** Empresa cambia estado de aplicación
**Contiene:**
- Nuevo estado
- Nombre de vacante
- Nombre de empresa
- Link a la aplicación

---

## 🚀 Flujo Completo de Ejemplo

### Paso a Paso Real:

**Día 1 - Empresa:**
1. Empresa ABC inicia sesión
2. Va a `/company/jobs`
3. Click "Crear Nueva Vacante"
4. Completa wizard:
   - Título: "Desarrollador React Senior"
   - Modalidad: Remoto
   - Skills requeridas: React, TypeScript, Node.js
   - Salario: €50,000 - €70,000/año (oculto públicamente)
5. Guarda como DRAFT (gratis, revisa después)

**Día 2 - Empresa:**
1. Revisa el borrador
2. Click "Publicar"
3. Sistema:
   - Verifica 30 créditos disponibles ✓
   - Deduce 30 créditos
   - Status → PUBLISHED
   - Vacante ahora visible en `/jobs`

**Día 3 - Candidato:**
1. Juan Pérez navega a `/jobs`
2. Busca "React Senior"
3. Encuentra vacante de ABC
4. Click para ver detalle → `/jobs/desarrollador-react-senior-remoto`
5. Lee toda la información
6. Click "Aplicar Ahora"
7. Completa:
   - Carta de presentación
   - Pregunta: "¿Años de experiencia con React?" → "5 años"
8. Envía aplicación
9. Sistema calcula match score: **87%** 🟢

**Día 4 - Empresa:**
1. Ve notificación de nueva aplicación
2. Va a `/company/jobs/applications`
3. Ve card de Juan Pérez:
   - Match: 87% (verde)
   - Estado: NEW
4. Click para abrir modal
5. Lee carta y respuestas
6. Califica con 5 estrellas ⭐⭐⭐⭐⭐
7. Agrega nota interna: "Perfil muy interesante, contactar pronto"
8. Cambia estado a: SHORTLISTED

**Día 5 - Candidato:**
1. Juan recibe email: "Tu aplicación fue movida a SHORTLISTED"
2. Ve en su dashboard el nuevo estado

**Día 10 - Empresa:**
1. Cambia estado a: INTERVIEW
2. Juan recibe email con el cambio

**Día 20 - Final:**
1. Empresa cambia estado a: HIRED
2. Juan recibe email de felicitaciones
3. Empresa marca vacante como: FILLED
4. Vacante desaparece de búsqueda pública

---

## 🔧 Troubleshooting Común

### "No puedo ver el botón para crear vacantes"
- ✅ Verifica que seas usuario de empresa
- ✅ Verifica que la empresa esté APPROVED
- ✅ Ve directamente a `/company/jobs`

### "Error al publicar: Insufficient credits"
- ❌ No tienes suficientes créditos
- ✅ Compra créditos en `/company/credits`
- Necesitas mínimo 30 créditos

### "No puedo aplicar a la vacante"
- ✅ Verifica que estés autenticado
- ✅ Verifica que tengas perfil completo
- ✅ Verifica que no hayas aplicado antes

### "Mi vacante no aparece en búsqueda pública"
- ✅ Verifica que status sea PUBLISHED
- ✅ Verifica que `application_deadline` no haya pasado
- ✅ Refresca la página de búsqueda

---

## 📱 Accesos Rápidos

### Para Empresas:
- Dashboard: `/company/dashboard`
- Gestionar vacantes: `/company/jobs`
- Crear vacante: `/company/jobs/new`
- Ver aplicaciones: `/company/jobs/applications`
- Comprar créditos: `/company/credits`

### Para Candidatos:
- Buscar empleos: `/jobs` o `/empleos`
- Ver detalle: `/jobs/:slug`
- Mis aplicaciones: `/dashboard` (sección de aplicaciones)

---

## ✅ Checklist Final

### Para Empresas que Publican por Primera Vez:
- [ ] Tener cuenta de empresa registrada
- [ ] Empresa con status APPROVED
- [ ] Tener al menos 30 créditos
- [ ] Completar wizard de 4 pasos
- [ ] Revisar vista previa
- [ ] Publicar (consume créditos)
- [ ] Verificar que aparezca en `/jobs`

### Para Candidatos que Aplican por Primera Vez:
- [ ] Crear cuenta en YourCVPassport
- [ ] Completar perfil (experiencia, skills, etc.)
- [ ] Buscar vacantes en `/jobs`
- [ ] Leer detalles completos
- [ ] Preparar carta de presentación
- [ ] Responder preguntas (si hay)
- [ ] Enviar aplicación
- [ ] Recibir confirmación

---

## 🎉 Beneficios del Sistema

### Para Empresas:
- ✅ Un solo lugar para gestionar todas las vacantes
- ✅ Match score automático (ahorra tiempo)
- ✅ Candidatos pre-verificados de YourCVPassport
- ✅ Sistema de calificación y notas internas
- ✅ Analytics de vistas y aplicaciones
- ✅ No necesita ATS externo para empezar

### Para Candidatos:
- ✅ Búsqueda simple y rápida
- ✅ Filtros avanzados
- ✅ Aplicación en 1 click (perfil ya existe)
- ✅ Tracking del estado de aplicaciones
- ✅ Notificaciones de cambios
- ✅ Transparencia en el proceso

---

**Fecha:** 30 de Diciembre, 2025
**Versión:** 1.0
**Sistema:** 100% Funcional ✅
