# Fix: Translation Errors in Profile Wizard

**Fecha:** 2026-01-09
**Archivos modificados:**
- `translations/es.ts`
- `translations/en.ts`
- `utils/dateValidation.ts`
- `components/profile-editor/EducationSection.tsx`
- `components/profile-editor/ExperienceSection.tsx`
- `components/profile-editor/PortfolioSection.tsx`
- `components/profile-editor/FinalizationStep.tsx`

## Problema

Cuando la aplicación estaba configurada en inglés, varios mensajes de error, contadores de caracteres y placeholders aparecían en español en lugar de inglés. Esto afectaba la experiencia del usuario en modo multiidioma.

### Ejemplos de Errores Encontrados

1. **Validación de Fechas (Educación/Experiencia)**:
   - ❌ "La fecha de fin no puede ser anterior a la fecha de inicio" (hardcodeado en español)
   - ✅ Ahora traducido: "End date cannot be before start date" (inglés)

2. **Escalas de GPA (Educación)**:
   - ❌ "Escala 4.0", "GPA en escala de 0.0 a 4.0 (ej: 3.85)" (hardcodeado en español)
   - ✅ Ahora traducido: "4.0 Scale", "GPA on a 0.0 to 4.0 scale (eg: 3.85)" (inglés)

3. **Contadores de Caracteres**:
   - ❌ "60/80 caracteres" (hardcodeado en español)
   - ✅ Ahora traducido: "60/80 characters" (inglés)

4. **Formato de Fechas - Visualización (Experience/Education)**:
   - ❌ "marzo de 2024", "febrero de 2024" (locale hardcodeado a 'es-ES')
   - ✅ Ahora traducido: "Mar 2024", "Feb 2024" (usa locale dinámico)
   - ⚠️ **LIMITACIÓN CONOCIDA**: Los inputs `type="month"` nativos del navegador (ej: "enero de 2024") usan el locale del sistema operativo y NO pueden ser controlados vía HTML/JavaScript. Esta es una limitación de los navegadores modernos (Chrome, Edge, Firefox). Para control total del idioma, se requeriría implementar un date picker personalizado con una librería externa.

5. **Indicadores de Estado**:
   - ❌ "(Actual)", "Presente" (hardcodeado en español)
   - ✅ Ahora traducido: "(Current)", "Present" (inglés)

## Solución Implementada

### 1. Agregadas Traducciones de Validación de Fechas

**`translations/es.ts`**:
```typescript
education: {
    // ... campos existentes
    endDateRequired: 'La fecha de fin es obligatoria. Si aún estudias aquí, marca "Actualmente estudio aquí"',
    endDateBeforeStart: 'La fecha de fin no puede ser anterior a la fecha de inicio',
    dateRangeTooLong: 'El rango de fechas no puede ser mayor a 50 años',
    yearInvalid: 'El año debe tener 4 dígitos válidos (YYYY)',
    yearTooOld: 'La fecha no puede ser anterior a 1950',
    yearFuture: 'La fecha no puede ser posterior al año actual',
    monthInvalid: 'El mes debe estar entre 01 y 12',
    dateFormatInvalid: 'Formato inválido. Use YYYY-MM (ej: 2024-03)',
    gpaPlaceholder: 'GPA en escala de 0.0 a 4.0 (ej: 3.85)',
    gpaScale4: 'Escala 4.0',
    gpaScale5: 'Escala 5.0',
    gpaScale10: 'Escala 10.0',
    gpaScale100: 'Escala 100.0',
    gpaMaxError: 'El valor máximo para esta escala es'
}
```

**`translations/en.ts`**:
```typescript
education: {
    // ... existing fields
    endDateRequired: 'End date is required. If you\'re currently studying here, check "Currently studying here"',
    endDateBeforeStart: 'End date cannot be before start date',
    dateRangeTooLong: 'Date range cannot be longer than 50 years',
    yearInvalid: 'Year must have 4 valid digits (YYYY)',
    yearTooOld: 'Date cannot be before 1950',
    yearFuture: 'Date cannot be in the future',
    monthInvalid: 'Month must be between 01 and 12',
    dateFormatInvalid: 'Invalid format. Use YYYY-MM (eg: 2024-03)',
    gpaPlaceholder: 'GPA on a 0.0 to 4.0 scale (eg: 3.85)',
    gpaScale4: '4.0 Scale',
    gpaScale5: '5.0 Scale',
    gpaScale10: '10.0 Scale',
    gpaScale100: '100.0 Scale',
    gpaMaxError: 'Maximum value for this scale is'
}
```

### 2. Agregada Traducción para Contadores de Caracteres

**`translations/en.ts`**:
```typescript
common: {
    characters: 'characters',
    current: 'Current',
    optional: 'Optional',
    required: 'Required',
    from: 'from',
    to: 'to',
    // ... otros campos
}
```

### 3. Modificado `dateValidation.ts` para Soporte Multiidioma

```typescript
export interface DateValidationTranslations {
  dateFormatInvalid: string;
  yearInvalid: string;
  yearTooOld: string;
  yearFuture: string;
  monthInvalid: string;
  endDateBeforeStart: string;
  dateRangeTooLong: string;
}

export function validateDate(
  dateStr: string | null | undefined,
  fieldName: string = 'Date',
  t?: DateValidationTranslations
): DateValidationResult {
  // Usa traducciones o mensajes en inglés por defecto
  error: t?.dateFormatInvalid || `${fieldName} has invalid format. Use YYYY-MM (eg: 2024-03)`
}

export function validateDateRange(
  startDate: string | null | undefined,
  endDate: string | null | undefined,
  isCurrent: boolean = false,
  t?: DateValidationTranslations
): DateValidationResult {
  // Recibe traducciones como parámetro
}
```

### 4. Actualizados Componentes para Usar Traducciones

**EducationSection.tsx**:
```typescript
// Antes
toast.error('La fecha de fin es obligatoria. Si aún estudias aquí, marca "Actualmente estudio aquí"');

// Después
toast.error(translations.validationErrors.education.endDateRequired);

// Antes
const dateValidation = validateDateRange(data.start_date, data.end_date, data.is_current || false);

// Después
const dateValidation = validateDateRange(
  data.start_date,
  data.end_date,
  data.is_current || false,
  translations.validationErrors.education
);

// Antes
<option value="4.0">Escala 4.0</option>
{watch('institution_name')?.length || 0}/80 caracteres

// Después
<option value="4.0">{translations.validationErrors.education.gpaScale4}</option>
{watch('institution_name')?.length || 0}/80 {translations.common.characters}
```

**ExperienceSection.tsx**:
```typescript
// Antes
{watch('position')?.length || 0}/60 caracteres

// Después
{watch('position')?.length || 0}/60 {translations.common.characters}
```

**PortfolioSection.tsx**:
```typescript
// Antes
{watch('title')?.length || 0}/80 caracteres

// Después
{watch('title')?.length || 0}/80 {translations.common.characters}
```

**FinalizationStep.tsx**:
```typescript
// Antes
toast.error('La URL debe tener al menos 3 caracteres');

// Después
toast.error(`${t.validationErrors.slug.urlTooShort} 3 ${t.common.characters}`);
```

## Impacto

✅ **Eliminados**: Todos los textos hardcodeados en español
✅ **Mejorado**: Soporte completo de multiidioma (ES/EN)
✅ **Consistencia**: Mensajes de error, contadores y validaciones ahora respetan el idioma seleccionado

## Archivos Afectados

| Archivo | Cambios |
|---------|---------|
| `translations/es.ts` | Agregadas 13 nuevas claves de traducción para validación de fechas y GPA |
| `translations/en.ts` | Agregadas 13 nuevas claves de traducción + `common.characters` y otros |
| `utils/dateValidation.ts` | Modificado para aceptar traducciones como parámetro |
| `EducationSection.tsx` | Reemplazados 15+ textos hardcodeados con traducciones |
| `ExperienceSection.tsx` | Reemplazados 4 contadores hardcodeados |
| `PortfolioSection.tsx` | Reemplazados 3 contadores hardcodeados |
| `FinalizationStep.tsx` | Reemplazados 2 textos hardcodeados |

## Testing

Para verificar que las traducciones funcionan correctamente:

### Prueba en Español
1. Cambiar idioma a Español (ES) en la configuración
2. Ir a "My Profile" → Education
3. Intentar guardar un registro sin fecha de fin → Debe mostrar: "La fecha de fin es obligatoria..."
4. Verificar contadores de caracteres → Deben mostrar: "60/80 caracteres"
5. Verificar selector de GPA → Debe mostrar: "Escala 4.0", "Escala 5.0", etc.

### Prueba en Inglés
1. Cambiar idioma a Inglés (EN) en la configuración
2. Ir a "My Profile" → Education
3. Intentar guardar un registro sin fecha de fin → Debe mostrar: "End date is required..."
4. Verificar contadores de caracteres → Deben mostrar: "60/80 characters"
5. Verificar selector de GPA → Debe mostrar: "4.0 Scale", "5.0 Scale", etc.

## Notas Técnicas

- Se mantiene retrocompatibilidad: si no se pasan traducciones, se usan mensajes en inglés por defecto
- Los mensajes de validación de fechas ahora son consistentes entre EducationSection y ExperienceSection
- Se siguió el patrón existente de `translations.common.*` para palabras compartidas
- Todos los cambios son compatibles con el sistema de traducciones existente
