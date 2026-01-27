# Limitaciones Conocidas - YourCVPassport

## 1. Input type="month" - Locale del Sistema Operativo ⚠️ LIMITACIÓN ACEPTADA

### Problema
Los inputs nativos `<input type="month">` en los formularios de Experience y Education muestran los nombres de los meses en el idioma del sistema operativo del usuario, no en el idioma seleccionado en la aplicación.

**Ejemplo del problema**:
- Usuario con Windows en español selecciona inglés en la app
- Input mostrará: "enero de 2024" en lugar de "January 2024"

### Causa Raíz
Esta es una **limitación de los navegadores modernos** (Chrome, Edge, Firefox, Safari). Los controles nativos de fecha usan el locale del sistema operativo y no respetan:
- El atributo `lang` del HTML
- El locale de JavaScript
- Las configuraciones de idioma del navegador

**Referencias**:
- [MDN: input type="month"](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/month)
- [Chromium Bug #1058761](https://bugs.chromium.org/p/chromium/issues/detail?id=1058761)
- [Firefox Bug #1283482](https://bugzilla.mozilla.org/show_bug.cgi?id=1283482)

### ⚠️ Estado Actual (2026-01-09)

Se utiliza el input nativo `<input type="month">` envuelto en un `<div lang="...">` en:
- `components/profile-editor/EducationSection.tsx`
- `components/profile-editor/ExperienceSection.tsx`

**Limitación aceptada porque**:
- Los inputs nativos son simples y fáciles de usar
- Funcionan correctamente en dispositivos móviles
- El formato de datos guardado (YYYY-MM) es independiente del idioma mostrado
- Las fechas se muestran correctamente traducidas en los CVs generados

### Intentos Sin Éxito
1. ❌ Atributo `lang` directo en el input
2. ❌ Wrapper div con atributo `lang`
3. ❌ Cambiar `document.documentElement.lang`
4. ❌ Forzar locale con JavaScript

**Ninguna funcionó de manera consistente** en todos los navegadores debido a la limitación del navegador.

---

## Notas para Desarrolladores Futuros

Si decides implementar un date picker personalizado:

1. **Considera el tamaño del bundle**: react-datepicker agrega ~50KB minified
2. **Accesibilidad**: Asegúrate de que sea keyboard-accessible
3. **Mobile**: Los date pickers nativos funcionan mejor en móviles
4. **Validación**: Mantén la validación existente en `dateValidation.ts`

**Ejemplo de implementación con react-datepicker**:
```typescript
import DatePicker from 'react-datepicker';
import { es, enUS } from 'date-fns/locale';

<DatePicker
  selected={date}
  onChange={setDate}
  dateFormat="MM/yyyy"
  showMonthYearPicker
  locale={lang === 'es' ? es : enUS}
/>
```
