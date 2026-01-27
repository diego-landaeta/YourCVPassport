# Reglas de Bloqueo de Secciones - Profile Wizard

## 📋 Problema Actual

Actualmente, un usuario **nuevo** puede acceder a TODAS las secciones del wizard desde el inicio, lo que rompe el flujo lógico de completar el perfil paso a paso.

**Comportamiento actual**:
```
Usuario nuevo → Puede hacer clic en cualquier paso → Accede sin restricciones ❌
```

**Comportamiento esperado**:
```
Usuario nuevo → Solo puede acceder a pasos completados + próximo paso disponible ✅
```

---

## 🎯 Reglas de Bloqueo por Sección

### Lógica General
Un paso está **desbloqueado** si:
1. Ya está completado (tiene contenido guardado), O
2. Es el **siguiente paso disponible** (el anterior está completado)
3. **Excepción**: Identity siempre está desbloqueado (es el primer paso)

### Estados de Cada Paso

#### 1. Identity (Siempre desbloqueado)
- ✅ **SIEMPRE ACCESIBLE**
- Es el punto de entrada obligatorio
- **Completado cuando**:
  - `full_name` existe
  - `email` existe
  - `headline` existe
  - `summary` existe
  - `avatar_url` existe

#### 2. Experience
- 🔒 **Bloqueado si**: Identity NO está completado
- ✅ **Desbloqueado si**: Identity está completado
- **Completado cuando**: Al menos 1 experiencia existe

#### 3. Education
- 🔒 **Bloqueado si**: Experience NO está completado
- ✅ **Desbloqueado si**: Experience está completado
- **Completado cuando**: Al menos 1 educación existe
- **NOTA**: Education es opcional, pero debe desbloquearse para que el usuario pueda saltarlo

#### 4. Skills
- 🔒 **Bloqueado si**: Identity NO está completado (mínimo requerido)
- ✅ **Desbloqueado si**: Identity está completado
- **Completado cuando**: Al menos 3 skills existen
- **NOTA**: Skills puede accederse una vez Identity esté completo (no necesita Experience/Education)

#### 5. Languages
- 🔒 **Bloqueado si**: Identity NO está completado
- ✅ **Desbloqueado si**: Identity está completado
- **Completado cuando**: Al menos 1 idioma existe
- **NOTA**: Languages es opcional

#### 6. Portfolio
- 🔒 **Bloqueado si**: Identity NO está completado
- ✅ **Desbloqueado si**: Identity está completado
- **Completado cuando**: Al menos 1 item de portfolio existe
- **NOTA**: Portfolio es opcional

#### 7. Preferences
- 🔒 **Bloqueado si**: Pasos requeridos NO están completados
- ✅ **Desbloqueado si**: Identity + Experience + Skills están completados
- **Completado cuando**:
  - `job_seeking_status` está definido
  - Se completó en esta sesión (`preferencesCompletedInSession = true`)

#### 8. Finalize
- 🔒 **Bloqueado si**: Algún paso requerido falta
- ✅ **Desbloqueado si**: TODOS los pasos requeridos están completados
- **Pasos requeridos**:
  1. Identity (completo)
  2. Experience (al menos 1)
  3. Skills (al menos 3)
  4. Preferences (completado)
- **Completado cuando**:
  - Template seleccionado
  - Slug asignado

---

## 🔐 Implementación Sugerida

### Función: `isStepUnlocked(stepIndex: number)`

```typescript
const isStepUnlocked = (stepIndex: number): boolean => {
  // Step 0 (Identity) always unlocked
  if (stepIndex === 0) return true;

  const step = steps[stepIndex];
  if (!step) return false;

  // Check if step is already completed
  if (completedSteps.includes(stepIndex)) return true;

  // Check prerequisites based on step ID
  switch (step.id) {
    case 'identity':
      return true; // Always unlocked

    case 'experience':
      // Unlocked if Identity is completed
      return completedSteps.includes(0);

    case 'education':
      // Unlocked if Identity is completed
      return completedSteps.includes(0);

    case 'skills':
      // Unlocked if Identity is completed
      return completedSteps.includes(0);

    case 'languages':
      // Unlocked if Identity is completed
      return completedSteps.includes(0);

    case 'portfolio':
      // Unlocked if Identity is completed
      return completedSteps.includes(0);

    case 'preferences':
      // Unlocked if Identity + Experience + Skills completed
      const identityIndex = 0;
      const experienceIndex = steps.findIndex(s => s.id === 'experience');
      const skillsIndex = steps.findIndex(s => s.id === 'skills');

      return completedSteps.includes(identityIndex) &&
             completedSteps.includes(experienceIndex) &&
             completedSteps.includes(skillsIndex);

    case 'finalization':
      // Use existing canAccessFinalization() logic
      return canAccessFinalization();

    default:
      return false;
  }
};
```

### Visual: Indicadores de Bloqueo

```typescript
// En el renderizado de cada step icon
<div
  className={`flex flex-col items-center ${
    isStepUnlocked(index) ? 'cursor-pointer group' : 'cursor-not-allowed opacity-50'
  }`}
  onClick={() => {
    if (!isStepUnlocked(index)) {
      showLockedStepWarning(step.id);
      return;
    }
    // Existing navigation logic...
  }}
>
  {/* Icon con candado si está bloqueado */}
  <div className="relative">
    {!isStepUnlocked(index) && (
      <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 rounded-full">
        <LockClosedIcon className="w-4 h-4 text-white" />
      </div>
    )}
    <Icon className="w-5 h-5" />
  </div>
</div>
```

### Advertencia de Paso Bloqueado

```typescript
const showLockedStepWarning = (stepId: string) => {
  const prerequisiteSteps = getPrerequisiteSteps(stepId);

  setLockedStepMessage({
    title: lang === 'es' ? 'Paso bloqueado' : 'Step locked',
    message: lang === 'es'
      ? `Completa primero: ${prerequisiteSteps.join(', ')}`
      : `Complete first: ${prerequisiteSteps.join(', ')}`
  });

  setShowLockedWarning(true);
  setTimeout(() => setShowLockedWarning(false), 5000);
};
```

---

## ✅ Flujo Esperado para Usuario Nuevo

```
1. Usuario nuevo llega → Ve solo Identity desbloqueado
   ↓
2. Completa Identity → Experience, Education, Skills, Languages, Portfolio se desbloquean
   ↓
3. Completa Experience (al menos 1) → Marca completado
   ↓
4. Completa Skills (al menos 3) → Marca completado
   ↓
5. Preferences se desbloquea (porque Identity + Experience + Skills completados)
   ↓
6. Completa Preferences → Marca completado
   ↓
7. Finalize se desbloquea (todos los requeridos completados)
   ↓
8. Selecciona Template + Slug → Wizard completado ✅
```

---

## 🎨 UX Considerations

### Visual Feedback
1. **Pasos bloqueados**:
   - Opacity 50%
   - Icon de candado superpuesto
   - Cursor not-allowed
   - Color gris

2. **Pasos desbloqueados pero no completados**:
   - Color normal
   - Cursor pointer
   - Hover effects activos

3. **Pasos completados**:
   - Color verde
   - Checkmark
   - Borde verde

### Tooltips
- **Paso bloqueado**: "Completa primero: Identity"
- **Paso desbloqueado**: Nombre del paso
- **Paso completado**: "✓ Completado"

---

## 📝 Notas Importantes

1. **Identity es la puerta de entrada**: Sin Identity completado, solo se puede acceder a Identity y nada más.

2. **Flexibilidad después de Identity**: Una vez Identity completado, el usuario puede moverse libremente entre Experience, Education, Skills, Languages, Portfolio.

3. **Preferences requiere mínimos**: Solo se desbloquea cuando Identity + Experience + Skills estén completados.

4. **Finalize es el checkpoint final**: Solo accesible cuando TODOS los requeridos están completos.

5. **Usuarios existentes**: Si `hasCompletedWizard = true`, no aplicar restricciones (pueden editar libremente).

---

## 🔄 Casos Especiales

### Usuario que ya completó el wizard
```typescript
// Si hasCompletedWizard = true, no aplicar bloqueos
const isStepUnlocked = (stepIndex: number): boolean => {
  if (hasCompletedWizard) return true; // Libre acceso
  // ... resto de la lógica
};
```

### Usuario que cierra sesión y vuelve
```typescript
// Los completedSteps se recalculan desde la base de datos
// El bloqueo se mantiene consistente basado en datos guardados
```

### Usuario que borra contenido
```typescript
// Si un usuario borra experiencia, el step ya no está "completed"
// Los pasos dependientes se bloquean automáticamente
```

---

## 📌 Siguiente Paso

Implementar la función `isStepUnlocked()` en [ProfileWizard.tsx](../components/profile-editor/ProfileWizard.tsx) y actualizar el renderizado de los step icons para reflejar el estado bloqueado/desbloqueado.
