# Revertido MonthYearPicker a Inputs Nativos

**Fecha:** 2026-01-09
**Tipo:** Revert - Simplificación

## Resumen

Se revirtió el componente personalizado MonthYearPicker de vuelta a los inputs nativos `<input type="month">` con la limitación del navegador documentada y aceptada.

## Cambios Realizados

### 1. EducationSection.tsx
- ❌ Eliminado: Uso de MonthYearPicker personalizado
- ✅ Restaurado: Inputs nativos `type="month"` con wrapper `<div lang="...">`
- ✅ Eliminado: Import de MonthYearPicker

### 2. ExperienceSection.tsx
- ❌ Eliminado: Uso de MonthYearPicker personalizado
- ✅ Restaurado: Inputs nativos `type="month"` con wrapper `<div lang="...">`
- ✅ Eliminado: Import de MonthYearPicker

### 3. KNOWN_LIMITATIONS.md
- Actualizado el estado de "✅ RESUELTO" a "⚠️ LIMITACIÓN ACEPTADA"
- Documentada la razón de aceptar la limitación
- Aclarado que solo afecta el formulario, no los CVs

### 4. FIX_MONTH_PICKER_AND_COUNTRY_TRANSLATION.md
- Actualizado para reflejar la reversión
- Eliminadas las secciones sobre el componente personalizado
- Documentadas las ventajas de usar inputs nativos

## Implementación Actual

```typescript
<div lang={lang === 'es' ? 'es-ES' : 'en-US'}>
  <input
    {...register('start_date')}
    type="month"
    className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-cv-blue dark:bg-dark-bg-tertiary dark:text-white"
  />
</div>
```

## Razón de la Reversión

### Ventajas de los Inputs Nativos
1. **Simplicidad**: Código más simple y mantenible
2. **UX Móvil**: Los pickers nativos funcionan mejor en dispositivos móviles
3. **Sin Dependencias**: No requiere componentes personalizados
4. **Confiabilidad**: Comportamiento estándar del navegador
5. **CVs Correctos**: Las fechas en los CVs se muestran correctamente traducidas

### Limitación Aceptada
- ⚠️ El picker muestra meses en el idioma del sistema operativo
- ⚠️ Solo afecta el formulario de edición
- ✅ NO afecta los CVs generados (se muestran correctamente traducidos)

## Comparación

| Aspecto | Componente Personalizado | Input Nativo (Actual) |
|---------|--------------------------|----------------------|
| Idioma del picker | ✅ Controlable | ⚠️ Idioma del SO |
| Complejidad | ❌ Alta (código custom) | ✅ Baja (nativo) |
| Bundle size | ⚠️ ~5KB extra | ✅ 0KB (nativo) |
| UX Móvil | ⚠️ Requiere testing | ✅ Optimizado |
| Mantenimiento | ❌ Requiere mantenimiento | ✅ Mantenido por navegador |
| CVs generados | ✅ Correcto | ✅ Correcto |
| Formato de datos | ✅ YYYY-MM | ✅ YYYY-MM |

## Impacto

### Sin Impacto En:
- ✅ Base de datos (formato YYYY-MM se mantiene)
- ✅ CVs generados (fechas se muestran traducidas correctamente)
- ✅ Validaciones (dateValidation.ts sigue funcionando)
- ✅ Templates de CV (formateo con toLocaleDateString)

### Cambios Visibles:
- ⚠️ En el formulario de edición, los meses se muestran en el idioma del SO
- Ejemplo: Usuario con Windows en español verá "enero 2024" aunque la app esté en inglés

## Archivos Modificados

```
components/profile-editor/EducationSection.tsx   - Revertido a inputs nativos
components/profile-editor/ExperienceSection.tsx  - Revertido a inputs nativos
docs/KNOWN_LIMITATIONS.md                        - Actualizado estado
docs/changelog/FIX_MONTH_PICKER_AND_COUNTRY_TRANSLATION.md - Actualizado
docs/changelog/REVERT_MONTH_PICKER_TO_NATIVE.md  - Este archivo
```

## Componente MonthYearPicker.tsx

El componente `MonthYearPicker.tsx` sigue existiendo en el proyecto pero ya no se usa. Se puede:
1. Mantenerlo como referencia para futuras necesidades
2. Eliminarlo si se desea reducir el tamaño del código

## Documentación Relacionada

- [KNOWN_LIMITATIONS.md](../KNOWN_LIMITATIONS.md) - Limitación documentada
- [FIX_MONTH_PICKER_AND_COUNTRY_TRANSLATION.md](FIX_MONTH_PICKER_AND_COUNTRY_TRANSLATION.md) - Historial de cambios
