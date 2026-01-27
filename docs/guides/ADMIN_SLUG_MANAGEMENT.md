# Gestión de URLs Personalizadas por el Administrador

## Descripción

El administrador puede cambiar la URL personalizada (slug) de cualquier usuario sin las restricciones de tiempo que tienen los usuarios normales (90 días entre cambios).

## Acceso a la Funcionalidad

1. Navega al **Panel de Administración**
2. Selecciona **"Gestión de Perfiles"**
3. En la tabla de perfiles, verás una columna **"URL Personalizada"** que muestra el slug actual de cada usuario
4. Haz clic en el botón **"Editar"** (icono de lápiz) del perfil que deseas modificar

## Cambiar la URL Personalizada

### Desde el Modal de Edición

En el modal de edición del perfil encontrarás un campo especial para la URL personalizada:

1. **Campo de entrada**: Muestra `yourcvpassport.com/cv/` seguido del campo editable del slug
2. **Sanitización automática**: El sistema limpia automáticamente el slug mientras escribes:
   - Convierte a minúsculas
   - Elimina acentos y caracteres especiales
   - Reemplaza espacios con guiones
   - Elimina guiones consecutivos

3. **Validación en tiempo real**:
   - Verifica el formato del slug
   - Comprueba que no esté duplicado
   - Muestra errores instantáneamente

### Reglas de Formato

El slug debe cumplir con las siguientes reglas:

- ✅ Solo letras minúsculas (a-z)
- ✅ Números (0-9)
- ✅ Guiones (-)
- ✅ Mínimo 3 caracteres
- ✅ Máximo 50 caracteres
- ❌ No puede empezar ni terminar con guión
- ❌ No puede contener guiones consecutivos (--)
- ❌ No puede contener caracteres especiales o acentos

### Ejemplos de Slugs Válidos

```
jose-garcia
maria-perez-desarrolladora
juan-lopez-123
senior-developer
```

### Ejemplos de Slugs Inválidos

```
José-García          → jose-garcia (acentos)
María José           → maria-jose (espacios)
-john-doe            → john-doe (empieza con guión)
jane-doe-            → jane-doe (termina con guión)
mike--smith          → mike-smith (guiones consecutivos)
JohnDoe              → johndoe (mayúsculas)
ab                   → (muy corto, mínimo 3 caracteres)
```

## Ventajas del Administrador

### Sin Restricción de 90 Días

- Los usuarios normales solo pueden cambiar su slug cada 90 días
- **El administrador puede cambiar cualquier slug en cualquier momento**
- No hay límite de cambios para el admin

### Actualización del Timestamp

Cuando el admin cambia un slug:
- Se actualiza el campo `last_slug_changed_at` al momento actual
- Esto reinicia el contador de 90 días para ese usuario
- El usuario no podrá cambiar su slug nuevamente hasta que pasen 90 días desde el cambio del admin

## Vista en la Tabla

La columna **"URL Personalizada"** en la tabla de perfiles muestra:

- **Slug activo**: Enlace clickeable que abre el CV en una nueva pestaña
- **Sin URL**: Muestra "Sin URL" en gris si el usuario no tiene slug configurado
- **Font monoespaciada**: Para mejor legibilidad de los slugs

## Desde SQL (Uso Avanzado)

Si necesitas cambiar un slug directamente desde la base de datos, puedes usar el script:

```bash
scripts/sql/admin-update-slug.sql
```

### Pasos:

1. **Verificar slug actual**:
```sql
SELECT id, full_name, email, slug, last_slug_changed_at
FROM profiles
WHERE id = 'USER_ID_AQUI';
```

2. **Verificar disponibilidad del nuevo slug**:
```sql
SELECT id, full_name, slug
FROM profiles
WHERE slug = 'nuevo-slug-aqui';
```

3. **Actualizar el slug**:
```sql
UPDATE profiles
SET
  slug = 'nuevo-slug-aqui',
  last_slug_changed_at = now(),
  updated_at = now()
WHERE id = 'USER_ID_AQUI';
```

## Mensajes de Error Comunes

### "Esta URL ya está en uso"
- **Causa**: Otro usuario ya tiene ese slug
- **Solución**: Elige un slug diferente

### "Formato de URL inválido"
- **Causa**: El slug no cumple con las reglas de formato
- **Solución**: Revisa que solo contenga letras minúsculas, números y guiones

### "Mínimo 3 caracteres requeridos"
- **Causa**: El slug es demasiado corto
- **Solución**: Usa al menos 3 caracteres

### "No puede empezar o terminar con guión"
- **Causa**: El slug tiene un guión al inicio o final
- **Solución**: Elimina los guiones de los extremos

### "No puede contener guiones consecutivos"
- **Causa**: El slug tiene dos o más guiones seguidos
- **Solución**: Usa solo un guión entre palabras

## Mejores Prácticas

1. **Usa el nombre y profesión**: `juan-lopez-desarrollador`
2. **Mantén la brevedad**: Slugs cortos son más fáciles de recordar
3. **Evita números innecesarios**: A menos que sean parte de la marca personal
4. **Consistencia**: Usa el mismo formato para todos los perfiles (ej: nombre-apellido-profesion)
5. **Comunica al usuario**: Si cambias el slug de un usuario, infórmale del cambio

## Notas Importantes

- ⚠️ **Cambiar un slug invalida las URLs antiguas**: Si alguien tenía el link anterior, dejará de funcionar
- 💡 **Considera el SEO**: URLs limpias y descriptivas son mejores para posicionamiento
- 🔒 **Seguridad**: Solo los administradores pueden cambiar slugs de otros usuarios
- 📧 **Notificación**: Considera notificar al usuario cuando se cambie su slug

## Integración con el Sistema

La funcionalidad de cambio de slug del admin se integra con:

- ✅ Sistema de validación de slugs (`utils/slugUtils.ts`)
- ✅ Verificación de duplicados en tiempo real
- ✅ Sanitización automática del input
- ✅ Actualización del timestamp de último cambio
- ✅ RLS (Row Level Security) de Supabase
- ✅ Historial de cambios en la base de datos

## Archivos Relacionados

- `components/admin/ProfilesManagement.tsx` - Interfaz de gestión
- `utils/slugUtils.ts` - Utilidades de sanitización y validación
- `utils/slugValidation.ts` - Validación con restricción de 90 días (solo para usuarios)
- `scripts/sql/admin-update-slug.sql` - Script SQL para cambios directos
- `supabase/migrations/20251219_add_slug_change_tracking.sql` - Migración del campo
