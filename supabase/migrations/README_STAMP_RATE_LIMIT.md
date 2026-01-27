# Limitación de Solicitudes de Verificación (Rate Limiting)

## Descripción

Esta migración implementa restricciones para las solicitudes de verificación (stamps):

1. **Todas las verificaciones**: Los usuarios solo pueden solicitar **una verificación de cada tipo cada 3 días**
2. **Verificaciones externas (EMAIL, PHONE)**: Máximo **4 intentos totales** por tipo de verificación

## Archivos Modificados

### Base de Datos
- `20251222_add_stamp_rate_limit.sql` - Migración que agrega:
  - Función `can_request_stamp()` - Verifica si un usuario puede solicitar un tipo de verificación (incluye límite de 4 intentos para EMAIL/PHONE)
  - Vista `stamp_request_availability` - Muestra cuándo estará disponible la próxima solicitud y los intentos restantes
  - Trigger `enforce_stamp_rate_limit` - Previene solicitudes dentro del período de espera y aplica límite de intentos

### Frontend
- `components/dashboard/StampsSection.tsx` - Actualizado para:
  - Mostrar el tiempo restante antes de poder solicitar nuevamente
  - Deshabilitar botones cuando aún no se puede solicitar
  - Mostrar notificación toast con días restantes
  - Mostrar intentos restantes para verificaciones externas (EMAIL/PHONE)
  - Indicador visual diferente cuando se alcanza el límite de 4 intentos
- `components/dashboard/StampsVerificationCodeModal.tsx` - Actualizado para:
  - Mostrar contador de intentos restantes (X/4)
  - Alertas visuales cuando quedan pocos intentos
  - Mensaje de advertencia cuando se alcanza el último intento

## Cómo Funciona

### Flujo General
1. **Validación en Base de Datos**: Un trigger valida cada INSERT en la tabla `stamps`
2. **Vista de Disponibilidad**: Consulta `stamp_request_availability` para saber cuándo puede volver a solicitar y cuántos intentos le quedan
3. **UI Feedback**: Las tarjetas muestran:
   - ✅ Verde: Ya verificado
   - 🔴 Rojo: Límite de intentos alcanzado (solo EMAIL/PHONE)
   - ⏰ Naranja: En período de espera (muestra días restantes + intentos restantes si aplica)
   - ➕ Azul: Disponible para solicitar (muestra intentos restantes si aplica)

### Límite de 3 Días
- Aplica a **todos los tipos** de verificación (IDENTITY, EDUCATION, CERTIFICATION, EMPLOYMENT, EMAIL, PHONE)
- Se cuenta desde la fecha de creación (`created_at`) de la última solicitud
- Después de 3 días, el usuario puede volver a solicitar ese tipo de verificación

### Límite de 4 Intentos (Solo EMAIL y PHONE)
- Cada usuario tiene un máximo de **4 intentos totales** para verificar su email
- Cada usuario tiene un máximo de **4 intentos totales** para verificar su teléfono
- Una vez alcanzado el límite, **no puede solicitar más verificaciones de ese tipo**
- Este límite es **permanente** y no se reinicia
- Los intentos se cuentan independientemente del estado (PENDING, VERIFIED, REJECTED, EXPIRED)

## Aplicar la Migración

```bash
# En Supabase Studio > SQL Editor, ejecuta:
# Copia y pega el contenido de 20251222_add_stamp_rate_limit.sql

# O usando CLI de Supabase:
supabase db push
```

## Ejemplos de Uso

### Ejemplo 1: Consultar disponibilidad
```typescript
const { data } = await supabase
  .from('stamp_request_availability')
  .select('*')
  .eq('profile_id', userId)
  .eq('type', 'EMAIL')
  .single();

// Campos disponibles:
// data.can_request_now: true/false - ¿Puede solicitar ahora?
// data.days_until_available: número - Días hasta que pueda solicitar de nuevo
// data.total_attempts: número - Total de intentos realizados
// data.remaining_attempts: número - Intentos restantes (solo EMAIL/PHONE)
```

### Ejemplo 2: Error de límite de 3 días
```typescript
// El usuario solicita verificación de identidad
// Si ya solicitó hace menos de 3 días:
// ❌ Error (P0001): "Solo puedes solicitar una verificación de IDENTITY cada 3 días..."
```

### Ejemplo 3: Error de límite de intentos
```typescript
// El usuario intenta solicitar verificación de EMAIL por 5ta vez
// ❌ Error (P0002): "Has alcanzado el límite máximo de 4 intentos de verificación de EMAIL..."
```

## Beneficios

1. **Previene Spam**: Usuarios no pueden enviar múltiples solicitudes rápidamente
2. **Reduce Carga del Sistema**: Menos solicitudes de verificación para revisar
3. **Mejor UX**: Usuarios saben exactamente cuándo pueden volver a solicitar y cuántos intentos les quedan
4. **Protección a Nivel de DB**: La restricción se aplica incluso si el frontend se bypasea
5. **Previene Abuso de Verificaciones Externas**: Límite de 4 intentos evita uso excesivo de servicios de email/SMS
6. **Costos Controlados**: Limitar intentos de verificación externa ayuda a controlar costos de proveedores externos

## Notas Importantes

### Límite de 3 Días
- La restricción es **por tipo de verificación** (IDENTITY, EMAIL, EDUCATION, etc.)
- El período de espera es de **3 días (72 horas)**
- El período se cuenta desde `created_at` de la última solicitud
- Se aplica a **todos los tipos** de verificación

### Límite de 4 Intentos (EMAIL/PHONE)
- Solo se aplica a verificaciones externas: **EMAIL** y **PHONE**
- Es un límite **permanente** (no se reinicia después de 3 días)
- Se cuenta el total de stamps creados, independientemente del estado
- Una vez alcanzado el límite, el usuario **no puede solicitar más** verificaciones de ese tipo
- El UI muestra claramente cuántos intentos quedan

### Consideraciones
- Las verificaciones ya completadas (VERIFIED) pueden volverse a solicitar después de 3 días si no se ha alcanzado el límite de intentos
- Los administradores pueden eliminar stamps pendientes/rechazados para liberar intentos si es necesario
- La vista `stamp_request_availability` muestra `remaining_attempts: null` para verificaciones que no tienen límite de intentos (IDENTITY, EDUCATION, etc.)
