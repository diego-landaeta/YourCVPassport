# Fix: Country Validation Console Errors

**Fecha:** 2026-01-09
**Archivos modificados:**
- `schemas/profileSchemas.ts`
- `schemas/getProfileSchemas.ts`

## Problema

Cuando un usuario accedía al formulario de identidad (Identity Section) sin un país seleccionado, aparecían errores en la consola del navegador:

```
Invalid input: expected string, received null
```

Estos errores no eran fatales pero generaban ruido en la consola y podían confundir a los desarrolladores o usuarios técnicos.

### Causa Raíz

El schema de validación Zod para `country_code` estaba definido como:

```typescript
country_code: z.string().min(1, 'Debes seleccionar un país')
```

Este schema **rechazaba inmediatamente** cualquier valor `null` o `undefined`, lanzando un error de tipo en la consola antes de que el usuario siquiera interactuara con el campo.

## Solución

Se modificó el schema para aceptar valores `null`/`undefined` sin generar errores de consola, pero manteniendo la validación de campo requerido cuando el usuario intenta enviar el formulario.

### Nuevo Schema

```typescript
country_code: z.union([
  z.string().min(1, 'Debes seleccionar un país'),
  z.null(),
  z.undefined()
]).refine((val) => val != null && val !== '', {
  message: 'Debes seleccionar un país'
})
```

### Cómo Funciona

1. **`z.union([...])`**: Permite que el campo acepte string, null o undefined
2. **`.refine(...)`**: Aplica una validación personalizada que solo falla cuando el usuario intenta enviar el formulario
3. **Resultado**: No hay errores en consola, pero el mensaje de error aparece en la UI cuando se requiere

## Impacto

✅ **Eliminados**: Errores de consola molestos
✅ **Mantenido**: Validación de campo requerido
✅ **Mejorado**: Experiencia del usuario (UX limpia)

## Testing

Para verificar el fix:

1. Crea un usuario nuevo o edita un perfil sin país
2. Abre la consola del navegador
3. Navega a "My Profile" → Identity
4. **Antes del fix**: Verías "Invalid input: expected string, received null"
5. **Después del fix**: No hay errores en consola
6. **Validación**: Al intentar guardar sin seleccionar país, aparece el mensaje de error en la UI

## Archivos Afectados

### `schemas/profileSchemas.ts`
- Modificado el schema base `identitySchema`
- Usado solo para tipos TypeScript (importar `IdentityFormData`)
- Mensaje hardcodeado en español (no se usa para validación en producción)

### `schemas/getProfileSchemas.ts`
- Modificado el schema traducido `identitySchema`
- **ESTE es el schema usado en producción** por IdentitySection y otros componentes
- Soporte multiidioma completo:
  - 🇪🇸 Español: "Debes seleccionar un país"
  - 🇬🇧 Inglés: "You must select a country"

## Traducción

El mensaje de error está completamente traducido en ambos idiomas a través del sistema de traducciones:

**Español (`translations/es.ts`)**:
```typescript
countryRequired: 'Debes seleccionar un país'
```

**Inglés (`translations/en.ts`)**:
```typescript
countryRequired: 'You must select a country'
```

El schema usa `t.validationErrors.identity.countryRequired` que se resuelve dinámicamente según el idioma activo del usuario.
