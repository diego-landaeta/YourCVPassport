# Sistema de Wizard y Tour - YourCVPassport

## 📋 Flujo Completo de Onboarding

Este documento describe el flujo completo de onboarding para nuevos usuarios, desde el registro hasta el uso completo de la plataforma.

---

## 🔄 Flujo Paso a Paso

### 1. Usuario se Registra e Inicia Sesión
```
Usuario → Sign Up/Login → AuthContext carga profile → DashboardPage
```

**Estado inicial:**
- `wizard_completed` = `false` (por defecto en DB)
- `dashboard_tour_completed` = `false` (por defecto en DB)

---

### 2. Redirección al Wizard
```
DashboardPage → Detecta wizard_completed = false → Muestra "My Profile" (wizard)
```

**Comportamiento:**
- El sidebar muestra **SOLO** "Dashboard" y "My Profile"
- Todas las demás secciones están **bloqueadas** con advertencia
- El usuario ve el ProfileWizard en la sección "My Profile"

---

### 3. Usuario Completa el Wizard

El wizard tiene los siguientes pasos:

#### Pasos Requeridos (obligatorios)
1. **Identity** - Información básica
   - Nombre completo
   - Email
   - Headline (título profesional)
   - Summary (resumen)
   - Avatar (foto de perfil)

2. **Experience** - Al menos 1 experiencia laboral

3. **Skills** - Al menos 3 habilidades

4. **Preferences** - Estado de búsqueda de empleo
   - Debe completarse en la sesión actual

#### Pasos Opcionales
5. **Education** - Educación (opcional pero recomendado)
6. **Languages** - Idiomas (opcional)
7. **Portfolio** - Portafolio (opcional)

#### Paso de Finalización
8. **Finalize** - Selección de template y URL
   - Seleccionar template (Moderno, Clásico, Creativo)
   - Crear slug personalizado (URL del CV)
   - **CRÍTICO**: Al guardar, marca `wizard_completed = true` en DB

```sql
UPDATE profiles
SET
  template = 'passport',
  slug = 'mi-nombre-profesional',
  last_slug_changed_at = NOW(),
  wizard_completed = true  -- ✅ Marca el wizard como completado
WHERE id = user_id;
```

---

### 4. Redirección al Dashboard

Una vez completado el wizard:

```
FinalizationStep → Marca wizard_completed = true → onComplete() → DashboardPage
```

**Cambios automáticos:**
1. **Sidebar se desbloquea** - Todas las secciones ahora son accesibles
2. **Redirección a dashboard principal** - Muestra estadísticas, acciones rápidas, etc.
3. **Tour se prepara para mostrarse** - Si `profileCompleteness === 100%`

---

### 5. Tour del Dashboard (Automático)

**Condiciones para mostrar el tour:**
```typescript
showTour =
  wizard_completed === true &&
  dashboard_tour_completed === false &&
  profileCompleteness === 100
```

**Comportamiento:**
- Se muestra **automáticamente** después de completar el wizard
- Overlay bloqueante (el usuario debe seguir el tour o saltarlo)
- Guía interactiva de 15 pasos:
  - 5 pasos del dashboard principal
  - 10 pasos del sidebar (cada sección)

**Al completar o saltar el tour:**
```sql
UPDATE profiles
SET dashboard_tour_completed = true
WHERE id = user_id;
```

**Archivo:** [`hooks/useDashboardTour.ts`](../hooks/useDashboardTour.ts)

---

### 6. Usuario Listo para Usar la Plataforma

**Estado final:**
- `wizard_completed` = `true` ✅
- `dashboard_tour_completed` = `true` ✅
- Todas las secciones del sidebar desbloqueadas
- **Nunca más se mostrará el tour** en futuros logins

---

## 🗂️ Arquitectura de Base de Datos

### Tabla: `profiles`

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  template TEXT,
  slug TEXT UNIQUE,
  last_slug_changed_at TIMESTAMPTZ,

  -- ✅ Nuevos campos de onboarding
  wizard_completed BOOLEAN DEFAULT FALSE,
  dashboard_tour_completed BOOLEAN DEFAULT FALSE,

  -- ... otros campos
);
```

### Migraciones Ejecutadas

1. **`20260109_add_wizard_completed.sql`**
   - Agrega `wizard_completed BOOLEAN DEFAULT FALSE`
   - Marca usuarios existentes con template/slug como completados

2. **`20260109_add_dashboard_tour_completed.sql`**
   - Agrega `dashboard_tour_completed BOOLEAN DEFAULT FALSE`

---

## 📝 Componentes Clave

### 1. [`components/profile-editor/FinalizationStep.tsx`](../components/profile-editor/FinalizationStep.tsx)

**Responsabilidad:** Marcar `wizard_completed = true` al finalizar

```typescript
const { error } = await supabase
  .from('profiles')
  .update({
    template: selectedTemplate,
    slug: customSlug,
    last_slug_changed_at: new Date().toISOString(),
    wizard_completed: true, // ✅ Marca wizard completado
  })
  .eq('id', session.user.id);
```

---

### 2. [`components/dashboard/Sidebar.tsx`](../components/dashboard/Sidebar.tsx)

**Responsabilidad:** Bloquear secciones si `wizard_completed = false`

```typescript
const wizardCompleted = profile?.wizard_completed === true;
const shouldBlockSections = !wizardCompleted;

const handleMenuClick = (item: any) => {
  // Permitir SOLO "My Profile" siempre
  if (item.id === 'mi-perfil') {
    onSectionChange('mi-perfil:identity');
    return;
  }

  // Bloquear TODO si wizard no completado
  if (shouldBlockSections) {
    setShowProfileAlert(true); // Muestra advertencia
    return;
  }

  // Permitir navegación normal
  onSectionChange(item.id);
};
```

---

### 3. [`hooks/useDashboardTour.ts`](../hooks/useDashboardTour.ts)

**Responsabilidad:** Controlar el tour del dashboard

```typescript
export const useDashboardTour = (userId, profileCompleteness, dashboardTourCompleted) => {
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    // Mostrar tour SOLO si:
    // 1. No completado antes (dashboardTourCompleted = false)
    // 2. Perfil 100% completo
    if (!dashboardTourCompleted && profileCompleteness === 100) {
      setTimeout(() => setShowTour(true), 800);
    }
  }, [userId, profileCompleteness, dashboardTourCompleted]);

  const completeTour = async () => {
    await supabase
      .from('profiles')
      .update({ dashboard_tour_completed: true })
      .eq('id', userId);
    setShowTour(false);
  };

  const skipTour = async () => {
    await supabase
      .from('profiles')
      .update({ dashboard_tour_completed: true })
      .eq('id', userId);
    setShowTour(false);
  };

  return { showTour, completeTour, skipTour };
};
```

---

### 4. [`components/DashboardPage.tsx`](../components/DashboardPage.tsx)

**Responsabilidad:** Redireccionar según estado del wizard

```typescript
const getInitialSection = () => {
  const hasCompletedWizardInDB = profile?.wizard_completed === true;
  return hasCompletedWizardInDB ? 'dashboard' : 'mi-perfil';
};

const [activeSection, setActiveSection] = useState<string>(getInitialSection());
```

---

### 5. [`components/profile-editor/ProfileWizard.tsx`](../components/profile-editor/ProfileWizard.tsx)

**Responsabilidad:** Controlar el flujo del wizard

```typescript
const hasCompletedWizard = profile?.wizard_completed === true;

// Solo agregar paso de Finalización si NO completó el wizard
const steps = hasCompletedWizard
  ? baseSteps
  : [...baseSteps, {
      id: 'finalization',
      component: FinalizationStep
    }];
```

---

## 🔄 Estados y Transiciones

### Estado 1: Usuario Nuevo (No Completado Wizard)
```
wizard_completed = false
dashboard_tour_completed = false

→ Sidebar: Solo "Dashboard" y "My Profile" visibles
→ Vista: ProfileWizard (paso Identity)
→ Tour: No se muestra
```

### Estado 2: Wizard Completado, Tour Pendiente
```
wizard_completed = true
dashboard_tour_completed = false
profileCompleteness = 100%

→ Sidebar: Todas las secciones desbloqueadas
→ Vista: Dashboard principal
→ Tour: Se muestra automáticamente
```

### Estado 3: Usuario Completo (Onboarding Terminado)
```
wizard_completed = true
dashboard_tour_completed = true

→ Sidebar: Todas las secciones desbloqueadas
→ Vista: Dashboard principal
→ Tour: Nunca más se muestra
```

---

## ⚠️ Consideraciones Importantes

### 1. LocalStorage vs Database
❌ **ANTES:** Se usaba `localStorage.getItem('wizard_just_completed')`
- Problema: No persiste entre dispositivos/navegadores
- Problema: Se borra al limpiar caché

✅ **AHORA:** Se usa `profile.wizard_completed` de la base de datos
- Ventaja: Persiste entre dispositivos
- Ventaja: Consistente y confiable

### 2. Template y Slug vs wizard_completed
❌ **ANTES:** `const wizardCompleted = !!profile.template && !!profile.slug`
- Problema: Puede existir template/slug sin haber completado wizard

✅ **AHORA:** `const wizardCompleted = profile.wizard_completed === true`
- Ventaja: Solo se marca cuando se completa el paso de Finalización
- Ventaja: Más explícito y confiable

### 3. Tour Automático
⚠️ El tour se muestra **automáticamente** después de completar el wizard si:
- `profileCompleteness === 100%`
- `dashboard_tour_completed === false`

Si el perfil no está 100% completo, el tour NO se mostrará hasta que se complete.

### 4. Bloqueo del Sidebar
El sidebar bloquea TODAS las secciones excepto:
- "Dashboard" (muestra mensaje de bienvenida)
- "My Profile" (acceso al wizard)

Al hacer clic en una sección bloqueada, muestra:
```
"Completa el wizard primero"
"Debes completar el wizard de perfil (incluyendo el paso de Finalización)
para acceder a todas las funcionalidades."
```

---

## 🧪 Testing Manual

### Probar Flujo Completo

1. **Crear usuario nuevo:**
   ```sql
   -- El trigger ya crea el profile con wizard_completed = false
   ```

2. **Verificar wizard bloqueado:**
   - Iniciar sesión
   - Verificar que solo "Dashboard" y "My Profile" sean accesibles
   - Intentar acceder a otras secciones → Debe mostrar advertencia

3. **Completar wizard:**
   - Ir a "My Profile"
   - Completar todos los pasos requeridos
   - Llegar a "Finalize"
   - Seleccionar template y slug
   - Hacer clic en "Ir al Dashboard"

4. **Verificar en base de datos:**
   ```sql
   SELECT wizard_completed, dashboard_tour_completed, template, slug
   FROM profiles
   WHERE id = 'user-id';

   -- Debe mostrar:
   -- wizard_completed = true
   -- dashboard_tour_completed = false (aún no hace el tour)
   -- template = 'passport' (o el seleccionado)
   -- slug = 'mi-slug'
   ```

5. **Verificar tour automático:**
   - Debe mostrarse automáticamente el tour
   - Completar o saltar el tour

6. **Verificar en base de datos:**
   ```sql
   SELECT dashboard_tour_completed FROM profiles WHERE id = 'user-id';

   -- Debe mostrar:
   -- dashboard_tour_completed = true
   ```

7. **Cerrar sesión y volver a iniciar:**
   - No debe mostrarse el wizard
   - No debe mostrarse el tour
   - Todas las secciones desbloqueadas

---

## 📌 Archivos Modificados

### Migraciones
- ✅ `supabase/migrations/20260109_add_wizard_completed.sql`
- ✅ `supabase/migrations/20260109_add_dashboard_tour_completed.sql`

### Componentes
- ✅ `components/profile-editor/FinalizationStep.tsx`
- ✅ `components/profile-editor/ProfileWizard.tsx`
- ✅ `components/dashboard/Sidebar.tsx`
- ✅ `components/DashboardPage.tsx`

### Hooks
- ✅ `hooks/useDashboardTour.ts` (ya existía, funciona correctamente)

### Contextos
- ✅ `contexts/AuthContext.tsx` (ya usa `SELECT *`, trae los nuevos campos automáticamente)

---

## 🚀 Próximos Pasos

Para aplicar estos cambios en producción:

1. **Ejecutar migraciones en Supabase:**
   ```sql
   -- Ejecutar en el SQL Editor de Supabase:
   -- 1. 20260109_add_wizard_completed.sql
   -- 2. 20260109_add_dashboard_tour_completed.sql
   ```

2. **Deploy del código actualizado**

3. **Verificar con usuario de prueba:**
   - Crear nuevo usuario
   - Completar wizard
   - Verificar tour
   - Confirmar que todo funciona

4. **Monitorear logs:**
   - Verificar que no haya errores de base de datos
   - Confirmar que los campos se están guardando correctamente

---

## 📞 Soporte

Si encuentras problemas:
1. Verificar que las migraciones se ejecutaron correctamente
2. Verificar que los campos existen en la tabla `profiles`
3. Verificar logs del navegador y consola de Supabase
4. Revisar este documento para confirmar el flujo esperado
