# ⚡ Instrucciones Rápidas - Setup y Verificación

## 🚨 ERRORES CORREGIDOS

Los scripts originales tenían problemas de compatibilidad con Supabase. **Usa estos nuevos archivos:**

### ✅ Archivos Correctos (USA ESTOS)

| Archivo Original ❌ | Archivo Corregido ✅ | Cambios |
|---------------------|----------------------|---------|
| `VERIFICACION_RAPIDA.sql` | **`VERIFICACION_RAPIDA_SUPABASE.sql`** | Sin comandos `\echo` |
| `SETUP_RAPIDO_TEST.sql` | **`SETUP_TEST_FINAL.sql`** | Columnas correctas de `companies` |

---

## 🚀 Proceso Correcto (3 Pasos)

### Paso 1: Verificar Sistema (1 min)

1. Abre **Supabase Dashboard** → SQL Editor
2. Abre el archivo: **`VERIFICACION_RAPIDA_SUPABASE.sql`**
3. Copia **TODO** el contenido
4. Pega en SQL Editor
5. Click **RUN**

**Resultado esperado:**
- ✅ Las 4 funciones RPC existen
- ✅ Políticas RLS OK
- ⚠️ Empresas con créditos: 0 (normal en primera vez)

**Si ves errores:**
- ❌ "function publish_job_posting does not exist" → Ejecuta `RPC_FUNCTIONS_TO_EXECUTE.sql`
- ❌ "companies_i_name does not exist" → Ejecuta `fix-all-job-tables-rls.sql`

---

### Paso 2: Setup Empresa de Prueba (2 min)

1. Abre el archivo: **`SETUP_TEST_FINAL.sql`**
2. **IMPORTANTE:** En línea 13, cambia:
   ```sql
   v_test_email TEXT := 'tu.email@example.com';
   ```
   Por tu email REAL, ejemplo:
   ```sql
   v_test_email TEXT := 'juan.perez@gmail.com';
   ```

3. Copia **TODO** el contenido (después de editar)
4. Pega en Supabase SQL Editor
5. Click **RUN**

**Resultado esperado:**
```
✅ Usuario encontrado
   Email: tu.email@gmail.com
   User ID: [uuid]

✅ Empresa creada
   Nombre: Empresa Test YourCVPassport
   Company ID: [uuid]
   Créditos: 500
   Estado: APPROVED

✅ Usuario asignado como OWNER de la empresa

✅ 3 vacantes de ejemplo creadas en estado DRAFT
   ✅ Vacante 1 creada: Desarrollador Full Stack Senior (REMOTE)
   ✅ Vacante 2 creada: Product Manager (HYBRID)
   ✅ Vacante 3 creada: Diseñador UX/UI (ONSITE)

==========================================
✅ SETUP COMPLETADO EXITOSAMENTE
==========================================
```

**Al final verás una tabla con el resumen:**

| status | empresa | estado | creditos | vacantes_creadas | email |
|--------|---------|--------|----------|------------------|-------|
| ✅ RESUMEN | Empresa Test YourCVPassport | APPROVED | 500 | 3 | empresa.test@... |

---

### Paso 3: Verificar Frontend (5 min)

#### 3.1 Iniciar aplicación
```bash
npm run dev
```

#### 3.2 Ver dashboard
1. Abre: http://localhost:5173
2. Inicia sesión con tu email
3. Ve a: http://localhost:5173/company/dashboard

**Verifica:**
- [ ] Ves el dashboard de empresa
- [ ] En "Quick Actions" aparece **"Publicar Vacante"** como PRIMERA opción
- [ ] Botón azul con icono de maletín 💼

#### 3.3 Ver vacantes
1. Ve a: http://localhost:5173/company/jobs
2. Deberías ver **3 vacantes en DRAFT**

**Verifica:**
- [ ] 3 vacantes listadas
- [ ] Cada una tiene badge "DRAFT" (gris)
- [ ] Botones "Editar" visibles

#### 3.4 Publicar una vacante
1. Click **"Editar"** en la primera vacante (Desarrollador Full Stack)
2. Navega los 4 pasos del wizard:
   - **Paso 1:** Información Básica ✅
   - **Paso 2:** Detalles del Puesto ✅
   - **Paso 3:** Requisitos y Beneficios ✅
   - **Paso 4:** Revisión ✅

3. En Paso 4, click **"Publicar Vacante"**
4. Confirma (consumirá 30 créditos)

**Resultado esperado:**
- ✅ Toast verde: "Vacante publicada exitosamente"
- ✅ Redirige a `/company/jobs`
- ✅ Badge cambia a "PUBLISHED" (verde)
- ✅ Créditos: 500 → 470

#### 3.5 Ver vacante como público
1. Abre **ventana de incógnito** (Ctrl+Shift+N)
2. Ve a: http://localhost:5173/jobs
3. Deberías ver la vacante publicada

**Verifica:**
- [ ] Vacante "Desarrollador Full Stack Senior" visible
- [ ] Muestra empresa, ubicación, modalidad
- [ ] Badge "Remoto" visible
- [ ] Click en la vacante abre modal con detalles

---

## ✅ Checklist Rápido

### Base de Datos
- [ ] Ejecuté `VERIFICACION_RAPIDA_SUPABASE.sql`
- [ ] Todas las funciones RPC existen (4/4)
- [ ] Edité mi email en `SETUP_TEST_FINAL.sql`
- [ ] Ejecuté `SETUP_TEST_FINAL.sql`
- [ ] Tengo empresa con 500 créditos
- [ ] Tengo 3 vacantes en DRAFT

### Frontend
- [ ] `npm run dev` funciona
- [ ] Puedo ver /company/dashboard
- [ ] "Publicar Vacante" aparece primero en quick actions
- [ ] Puedo ver /company/jobs
- [ ] Publiqué una vacante (30 créditos consumidos)
- [ ] La vacante aparece en /jobs (público)

### Validaciones Críticas
- [ ] Checkbox "Remoto" sincroniza con dropdown "Modalidad" ✅
- [ ] No puedo poner salario > 10,000,000 ✅
- [ ] No hay console.error en navegador ✅
- [ ] Modo oscuro funciona ✅

---

## 🚨 Troubleshooting

### Error: "No se encontró usuario con email: tu.email@example.com"

**Causa:** No editaste el email en `SETUP_TEST_FINAL.sql`

**Solución:**
1. Abre `SETUP_TEST_FINAL.sql`
2. Línea 13: Cambia `'tu.email@example.com'` por tu email real
3. Guarda y ejecuta de nuevo

---

### Error: "function publish_job_posting does not exist"

**Causa:** No se han instalado las RPC functions

**Solución:**
1. Abre `RPC_FUNCTIONS_TO_EXECUTE.sql`
2. Copia TODO el contenido
3. Pega en Supabase SQL Editor
4. RUN
5. Ejecuta `VERIFICACION_RAPIDA_SUPABASE.sql` de nuevo

---

### Error: "companies_i_name does not exist"

**Causa:** Políticas RLS con errores

**Solución:**
1. Abre `fix-all-job-tables-rls.sql`
2. Copia TODO el contenido
3. Pega en Supabase SQL Editor
4. RUN

---

### "No veo el dashboard de empresa"

**Posibles causas:**

1. **No estás autenticado:**
   - Inicia sesión con tu usuario

2. **Tu usuario no está asignado a la empresa:**
   ```sql
   -- Verifica en Supabase:
   SELECT * FROM company_users WHERE user_id = 'TU_USER_ID';
   ```

3. **La empresa no fue creada:**
   ```sql
   -- Verifica en Supabase:
   SELECT * FROM companies ORDER BY created_at DESC LIMIT 1;
   ```

---

### "Las vacantes no aparecen en /jobs (público)"

**Causa:** La vacante no está en estado PUBLISHED

**Solución:**
1. Ve a `/company/jobs`
2. Edita la vacante
3. En paso 4, click "Publicar Vacante"
4. Confirma

O manualmente en Supabase:
```sql
UPDATE job_postings
SET status = 'PUBLISHED',
    published_at = NOW()
WHERE id = 'ID_DE_TU_VACANTE';
```

---

## 📊 Verificación Completa (Opcional)

Si quieres hacer testing exhaustivo (40 min), sigue:

**[GUIA_VERIFICACION_PASO_A_PASO.md](./GUIA_VERIFICACION_PASO_A_PASO.md)**

Incluye:
- 🧪 5 tests principales
- 🌙 Test modo oscuro
- 📱 Test responsive
- 🚨 Test edge cases
- ✅ Checklist de 30+ items

---

## 🎯 Próximos Pasos

### Ahora que el sistema funciona:

1. **Testea el flow completo** (5 min)
   - Crea y publica otra vacante
   - Aplica como candidato (con otro usuario)
   - Ve la aplicación como empresa
   - Exporta CSV

2. **Revisa funcionalidades avanzadas** (10 min)
   - Match score automático
   - Filtros de búsqueda
   - Cambio de estados de aplicaciones
   - Calificación de candidatos

3. **Implementa features opcionales** (cuando quieras)
   - Integrar notificaciones en UI (hook ya creado)
   - Configurar emails automáticos
   - Agregar preguntas personalizadas

---

## 📚 Documentación Completa

| Documento | Cuándo Usar |
|-----------|-------------|
| [RESUMEN_VERIFICACION.md](./RESUMEN_VERIFICACION.md) | Resumen ejecutivo del sistema |
| [GUIA_VERIFICACION_PASO_A_PASO.md](./GUIA_VERIFICACION_PASO_A_PASO.md) | Testing exhaustivo (40 min) |
| [INDICE_DOCUMENTACION_VACANTES.md](./INDICE_DOCUMENTACION_VACANTES.md) | Índice de toda la documentación |
| [SISTEMA_VACANTES_IMPLEMENTADO.md](./SISTEMA_VACANTES_IMPLEMENTADO.md) | Documentación técnica completa |
| [NUEVAS_FUNCIONALIDADES.md](./NUEVAS_FUNCIONALIDADES.md) | Changelog de features |

---

## ✅ Resumen

### Archivos a Usar:

1. **`VERIFICACION_RAPIDA_SUPABASE.sql`** ← Usa este (no el original)
2. **`SETUP_TEST_FINAL.sql`** ← Usa este (no el original)
3. `RPC_FUNCTIONS_TO_EXECUTE.sql` (si hace falta)
4. `fix-all-job-tables-rls.sql` (si hace falta)

### Tiempo Estimado:

- ⚡ Verificación + Setup: **3 minutos**
- 🧪 Testing básico: **5 minutos**
- 📖 Testing completo: **40 minutos** (opcional)

### Estado Esperado:

- ✅ 4/4 RPC functions
- ✅ Empresa con 500 créditos
- ✅ 3 vacantes en DRAFT
- ✅ 1 vacante PUBLICADA (después de testear)
- ✅ Sistema 100% funcional

---

**¡Listo para usar!** 🚀

Si tienes algún error que no está en troubleshooting, ejecuta `VERIFICACION_RAPIDA_SUPABASE.sql` y revisa los mensajes.
