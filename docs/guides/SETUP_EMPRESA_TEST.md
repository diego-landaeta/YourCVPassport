# 🚀 Setup Rápido - Empresa de Prueba

## Opción 1: Setup Automático (Recomendado) ⚡

### Paso 1: Edita el script
Abre `quick-test-setup.sql` y cambia esta línea:
```sql
WHERE email = 'tu-email@ejemplo.com'  -- ← Pon tu email aquí
```

### Paso 2: Ejecuta en Supabase
1. Ve a tu proyecto Supabase
2. SQL Editor → New Query
3. Copia y pega todo `quick-test-setup.sql`
4. Click en "Run"

### Paso 3: Listo!
Verás un mensaje como:
```
✅ Setup completado exitosamente!
Company ID: abc-123-def-456
Créditos: 500
Vacantes creadas: 3 (DRAFT)
```

---

## Opción 2: Setup Manual (Más control) 🛠️

### Paso 1: Obtén tu User ID
```sql
SELECT id, email FROM auth.users WHERE email = 'tu-email@ejemplo.com';
```
Copia el `id` que retorna.

### Paso 2: Ejecuta la creación
Abre `test-company-setup.sql` y:
1. Ejecuta la sección "PASO 1" (crear empresa)
2. Copia el UUID que retorna
3. Reemplaza `TU_COMPANY_ID` en todo el archivo
4. Reemplaza `TU_USER_ID` con tu user_id
5. Ejecuta el resto del script

---

## 📋 Qué se crea

### Empresa: Tech Innovators SA
- ✅ Estado: APPROVED (puede publicar)
- 💰 Créditos: 500 (16+ vacantes)
- 🏢 Industria: Tecnología
- 👥 Tamaño: 51-200 empleados
- 🔑 Tu usuario: OWNER (permisos completos)

### 3 Vacantes de Ejemplo (DRAFT):

#### 1. Senior React Developer
- 🌍 Remoto 100%
- 💶 €45,000 - €65,000/año (salario visible)
- 📊 Experiencia: Senior
- 🛠️ Skills: React, TypeScript, JavaScript

#### 2. DevOps Engineer
- 🏢 Híbrido (Madrid)
- 💶 A convenir (salario no especificado)
- 📊 Experiencia: Mid-level
- 🛠️ Skills: Docker, Kubernetes, AWS

#### 3. UX/UI Designer
- 🌍 Remoto 100%
- 💶 A convenir
- 📊 Experiencia: Junior
- 🛠️ Skills: Figma, UI/UX Design

---

## 🧪 Plan de Testeo Completo

### Test 1: Crear Nueva Vacante
1. Ve a `http://localhost:3000/company/dashboard`
2. Click en **"Publicar Vacante"** (botón azul destacado)
3. Completa el wizard de 4 pasos:
   - **Paso 1:** Info básica
     - ✅ Prueba marcar "Posición remota" → verás que Modalidad se bloquea en "Remoto"
     - ✅ Prueba desmarcar → Modalidad se habilita
     - ✅ Cambia Modalidad a "Remoto" → checkbox se marca automáticamente
   - **Paso 2:** Descripción y responsabilidades
   - **Paso 3:** Requisitos y habilidades
   - **Paso 4:** Compensación
     - ✅ Intenta poner 999999999999 → verás toast de error de límite
     - ✅ Deja campos vacíos → muestra "A convenir" a candidatos
4. Click "Guardar Borrador"
5. Verifica que aparece en `/company/jobs`

### Test 2: Editar Vacante Existente
1. Ve a `http://localhost:3000/company/jobs`
2. Click en "Editar" en cualquier vacante
3. Modifica datos
4. Guarda cambios

### Test 3: Publicar Vacante (Consume 30 créditos)
1. En `/company/jobs`
2. Click en "Publicar" en una vacante DRAFT
3. Confirma el modal (consume 30 créditos)
4. Verifica:
   - Estado cambia a PUBLISHED
   - Créditos bajan de 500 → 470
   - Aparece fecha de publicación

### Test 4: Ver como Candidato
1. **Cerrar sesión** o abre ventana incógnito
2. Ve a `http://localhost:3000/jobs`
3. Deberías ver la vacante publicada
4. Click en la vacante
5. Verifica:
   - Toda la información se muestra correctamente
   - Modo oscuro funciona
   - Salario muestra "A convenir" si está vacío
   - Skills y requisitos visibles

### Test 5: Aplicar a Vacante (Como Candidato)
1. Inicia sesión con cuenta de candidato (no empresa)
2. Ve a la vacante en `/jobs/:slug`
3. Click "Aplicar Ahora"
4. Completa:
   - Carta de presentación
   - Responde preguntas (si hay)
5. Envía aplicación
6. Verifica toast de éxito

### Test 6: Ver Aplicaciones (Como Empresa)
1. Vuelve a tu cuenta de empresa
2. Ve a `http://localhost:3000/company/jobs/applications`
3. Deberías ver:
   - Dashboard con estadísticas
   - Lista de aplicaciones
   - Match score (0-100)
   - Estado de cada aplicación
4. Click en una aplicación para ver detalles
5. Prueba:
   - Calificar con estrellas
   - Añadir notas internas
   - Cambiar estado (NEW → REVIEWING → INTERVIEW, etc.)
   - Ver perfil completo del candidato

### Test 7: Filtros y Búsqueda
1. Como candidato en `/jobs`
2. Prueba filtros:
   - Búsqueda por texto
   - Filtro por ubicación
   - Filtro por tipo de empleo
   - Filtro por modalidad
3. Click "Limpiar filtros"

### Test 8: Responsive y Dark Mode
1. Cambia a modo oscuro
2. Verifica todas las páginas se ven bien
3. Reduce tamaño de ventana (móvil)
4. Navega por el wizard de creación
5. Verifica que todo es legible y funcional

---

## 🔍 Queries Útiles para Verificar

### Ver tu empresa
```sql
SELECT * FROM companies WHERE name = 'Tech Innovators SA';
```

### Ver balance de créditos
```sql
SELECT
  c.name,
  c.credits_balance,
  COUNT(jp.id) FILTER (WHERE jp.status = 'PUBLISHED') as vacantes_publicadas,
  COUNT(jp.id) FILTER (WHERE jp.status = 'DRAFT') as borradores
FROM companies c
LEFT JOIN job_postings jp ON jp.company_id = c.id
WHERE c.name = 'Tech Innovators SA'
GROUP BY c.id, c.name, c.credits_balance;
```

### Ver historial de créditos
```sql
SELECT
  created_at,
  amount,
  transaction_type,
  description
FROM company_credits_history
WHERE company_id = (SELECT id FROM companies WHERE name = 'Tech Innovators SA')
ORDER BY created_at DESC;
```

### Ver aplicaciones recibidas
```sql
SELECT
  jp.title as vacante,
  p.full_name as candidato,
  ja.status as estado,
  ja.match_score,
  ja.created_at as aplicado_el
FROM job_applications ja
JOIN job_postings jp ON jp.id = ja.job_posting_id
JOIN profiles p ON p.id = ja.profile_id
WHERE ja.company_id = (SELECT id FROM companies WHERE name = 'Tech Innovators SA')
ORDER BY ja.created_at DESC;
```

---

## 🧹 Resetear Todo (Empezar de Nuevo)

⚠️ **CUIDADO:** Esto borra TODOS los datos de test

```sql
DO $$
DECLARE
  v_company_id UUID;
BEGIN
  SELECT id INTO v_company_id
  FROM companies
  WHERE name = 'Tech Innovators SA';

  IF v_company_id IS NOT NULL THEN
    DELETE FROM job_applications WHERE company_id = v_company_id;
    DELETE FROM job_posting_views WHERE job_posting_id IN (
      SELECT id FROM job_postings WHERE company_id = v_company_id
    );
    DELETE FROM job_posting_questions WHERE job_posting_id IN (
      SELECT id FROM job_postings WHERE company_id = v_company_id
    );
    DELETE FROM job_postings WHERE company_id = v_company_id;
    DELETE FROM company_credits_history WHERE company_id = v_company_id;
    DELETE FROM company_users WHERE company_id = v_company_id;
    DELETE FROM companies WHERE id = v_company_id;

    RAISE NOTICE '✅ Empresa de test eliminada completamente';
  END IF;
END $$;
```

---

## ✅ Checklist de Testing

- [ ] Setup automático ejecutado correctamente
- [ ] Empresa aparece en dashboard
- [ ] Balance de 500 créditos visible
- [ ] Crear nueva vacante desde wizard
- [ ] Validación de salario máximo funciona
- [ ] Sincronización remoto/modalidad funciona
- [ ] Guardar borrador funciona
- [ ] Editar vacante existente
- [ ] Publicar vacante (consume créditos)
- [ ] Vacante visible en /jobs (público)
- [ ] Aplicar como candidato
- [ ] Ver aplicaciones en dashboard de empresa
- [ ] Cambiar estado de aplicación
- [ ] Match score se calcula
- [ ] Filtros de búsqueda funcionan
- [ ] Dark mode funciona correctamente
- [ ] Responsive en móvil
- [ ] Toast notifications (no console.error)
- [ ] Salario "A convenir" cuando está vacío

---

## 🐛 Troubleshooting

### "Usuario no encontrado"
→ Verifica que pusiste tu email correcto en el script

### "Empresa no aparece en dashboard"
→ Verifica que tu user_id está en `company_users`:
```sql
SELECT * FROM company_users WHERE user_id = 'TU_USER_ID';
```

### "No puedo publicar vacante"
→ Verifica que:
1. RPC functions están ejecutadas (`RPC_FUNCTIONS_TO_EXECUTE.sql`)
2. Empresa tiene status APPROVED
3. Hay créditos suficientes (mínimo 30)

### "Error al cargar vacantes"
→ Verifica que las migraciones están ejecutadas:
```sql
SELECT * FROM job_postings LIMIT 1;
```

---

## 📞 Siguiente Nivel

Una vez que todo funcione:

1. **Agregar más vacantes** con diferentes configuraciones
2. **Crear perfiles de candidatos** para testear aplicaciones
3. **Testear match score** con diferentes skills
4. **Probar preguntas personalizadas** (job_posting_questions)
5. **Verificar emails** (si tienes configurado)
6. **Analytics y reportes**

¡Feliz testing! 🎉
