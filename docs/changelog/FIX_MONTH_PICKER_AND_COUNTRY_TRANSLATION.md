# Fix: Country Selector Translation + Revert Month Picker

**Fecha:** 2026-01-09
**Archivos modificados:**
- `components/profile-editor/EducationSection.tsx` (revertido a native inputs)
- `components/profile-editor/ExperienceSection.tsx` (revertido a native inputs)
- `components/profile-editor/IdentitySection.tsx`
- `translations/es.ts`
- `translations/en.ts`
- `docs/KNOWN_LIMITATIONS.md` (actualizado - limitación aceptada)

## Problema

Cuando la aplicación estaba en inglés, el selector de países seguía mostrando texto en español:

1. **Selector de países**: El placeholder "Buscar país..." estaba hardcodeado en español
2. **Inconsistencia de idioma**: La experiencia multiidioma estaba incompleta

## Solución Implementada

### 1. Actualizado CountrySelector en IdentitySection

**Cambios**:
```typescript
// Antes
<CountrySelector
  placeholder="Selecciona tu país"
  lang="es"
/>

// Después
<CountrySelector
  placeholder={t.countryPlaceholder}
  lang={lang}
/>
```

**Traducciones agregadas**:
- `translations/es.ts`: `countryPlaceholder: 'Selecciona tu país'`
- `translations/en.ts`: `countryPlaceholder: 'Select your country'`

### 2. Revertido Month Picker a Inputs Nativos

**Decisión**: Después de probar un componente personalizado MonthYearPicker, se decidió revertir a los inputs nativos `type="month"` y aceptar la limitación del navegador.

**Implementación actual**:
```typescript
<div lang={lang === 'es' ? 'es-ES' : 'en-US'}>
  <input
    {...register('start_date')}
    type="month"
    className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-cv-blue dark:bg-dark-bg-tertiary dark:text-white"
  />
</div>
```

**Razón**:
- Simplicidad y facilidad de uso
- Mejor experiencia en dispositivos móviles
- Los CVs generados muestran las fechas correctamente traducidas
- La limitación del idioma del picker es menor comparada con la complejidad de un componente personalizado

## Decisión: Inputs Nativos vs. Componente Personalizado

### Ventajas de Inputs Nativos (decisión final)
- ✅ Simplicidad del código
- ✅ Mejor experiencia en dispositivos móviles
- ✅ Sin dependencias adicionales
- ✅ Funcionamiento confiable y estándar
- ✅ Las fechas se guardan correctamente en formato YYYY-MM
- ✅ Los CVs generados muestran las fechas correctamente traducidas

### Limitación Aceptada
- ⚠️ El picker muestra meses en el idioma del sistema operativo, no del idioma de la app
- ⚠️ Esto solo afecta el formulario de edición, NO afecta los CVs generados

## Funcionamiento en el CV

Los inputs nativos guardan las fechas en formato `YYYY-MM` (ej: `2024-03`).

✅ **Visualización en CVs**: Los templates usan `toLocaleDateString()` con locale dinámico, por lo que las fechas se muestran correctamente traducidas:
- Español: "Mar 2024", "Feb 2024"
- Inglés: "Mar 2024", "Feb 2024"

✅ **Compatibilidad total**: No se requieren cambios en:
- Base de datos
- Funciones de validación (`dateValidation.ts`)
- Templates de CV

## Impacto

✅ **Traducido**: Placeholder del selector de países
✅ **Simplicidad**: Uso de inputs nativos para fechas
⚠️ **Limitación aceptada**: Los month pickers muestran meses en idioma del SO
✅ **CVs correctos**: Las fechas en CVs se muestran correctamente traducidas

## Testing

### Prueba de Inputs de Fecha
1. Ir a "My Profile" → Education/Experience
2. Hacer clic en selector de fecha de inicio (input nativo)
3. **Nota**: Los meses se mostrarán en el idioma del sistema operativo
4. Seleccionar una fecha (ej: "March 2024" o "Marzo 2024")
5. **Verificar**: Se guarda como "2024-03"

### Prueba en CV
1. Crear una educación/experiencia con fechas usando el nuevo picker
2. Ir a "My CV"
3. **Verificar en español**: Fechas aparecen como "Mar 2024"
4. Cambiar a inglés
5. **Verificar en inglés**: Fechas aparecen como "Mar 2024"

## Notas Técnicas

- Se usa el input nativo `type="month"` envuelto en `<div lang="...">`
- El atributo `lang` no afecta el idioma del picker nativo (limitación del navegador)
- El formato de datos es YYYY-MM independientemente del idioma mostrado
- Compatible con react-hook-form usando `{...register('field_name')}`

## Archivos Afectados

| Archivo | Cambios |
|---------|---------|
| `EducationSection.tsx` | Revertido a inputs nativos type="month" |
| `ExperienceSection.tsx` | Revertido a inputs nativos type="month" |
| `IdentitySection.tsx` | Agregado useLanguage + placeholder traducido |
| `translations/es.ts` | Agregado countryPlaceholder |
| `translations/en.ts` | Agregado countryPlaceholder |
| `KNOWN_LIMITATIONS.md` | Actualizado - limitación aceptada |

## Documentación Relacionada

- [KNOWN_LIMITATIONS.md](../KNOWN_LIMITATIONS.md) - Limitación original documentada
- [FIX_TRANSLATION_ERRORS.md](FIX_TRANSLATION_ERRORS.md) - Fixes anteriores de traducción
