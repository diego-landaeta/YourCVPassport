# Sistema de Moderación de Usuarios

## Resumen

Sistema completo de moderación de usuarios con suspensiones temporales y opciones avanzadas de baneo implementado en el panel de administración.

## Características Implementadas

### 1. Suspensión de Usuarios

#### Suspensión Temporal
- **1 hora**: Suspensión breve para infracciones menores
- **1 día**: Suspensión corta
- **1 semana**: Suspensión media
- **1 mes**: Suspensión larga
- **Permanente**: Sin fecha de expiración

#### Funcionalidad
- Campo `suspended_until` almacena la fecha de expiración
- Función automática `auto_reactivate_expired_suspensions()` para reactivar usuarios
- Cuando es permanente, `suspended_until` es NULL

### 2. Opciones Avanzadas de Baneo

#### Ocultar Perfil (`profile_hidden`)
- El perfil no se muestra en vista pública
- No aparece en `/username`
- Solo visible para el usuario y administradores

#### Bloquear Búsquedas (`search_blocked`)
- El perfil no aparece en resultados de búsqueda de talento
- No indexable por el sistema de búsqueda
- Oculto para empresas y reclutadores

#### Bloquear Mensajes (`messages_blocked`)
- Usuario no puede enviar mensajes
- Usuario no puede recibir mensajes
- Ideal para casos de spam o acoso

### 3. Interfaz de Usuario

#### Modal de Suspensión
```
┌─────────────────────────────────────┐
│ Suspender [Nombre Usuario]         │
├─────────────────────────────────────┤
│ Razón: [textarea]                   │
│                                     │
│ Duración: [dropdown]                │
│   • 1 hora                          │
│   • 1 día                           │
│   • 1 semana                        │
│   • 1 mes                           │
│   • Permanente                      │
│                                     │
│ Opciones de Baneo:                  │
│   ☐ Ocultar perfil de vista pública│
│   ☐ Bloquear en búsquedas          │
│   ☐ Bloquear mensajes              │
│                                     │
│ [Suspender] [Cancelar]             │
└─────────────────────────────────────┘
```

#### Modal de Detalles
- Muestra restricciones activas con puntos naranjas
- Sección "Restricciones Activas" cuando hay baneos
- Razón de suspensión si está suspendido
- Botón de activar que limpia todas las restricciones

### 4. Base de Datos

#### Nuevas Columnas en `profiles`
```sql
is_active BOOLEAN DEFAULT true NOT NULL
suspension_reason TEXT
suspended_until TIMESTAMPTZ
profile_hidden BOOLEAN DEFAULT false NOT NULL
search_blocked BOOLEAN DEFAULT false NOT NULL
messages_blocked BOOLEAN DEFAULT false NOT NULL
```

#### Índices de Rendimiento
```sql
idx_profiles_is_active
idx_profiles_suspended_until
idx_profiles_profile_hidden
idx_profiles_search_blocked
```

#### Función de Auto-Reactivación
```sql
auto_reactivate_expired_suspensions()
```
Debe ejecutarse periódicamente vía cron job para reactivar suspensiones expiradas.

## Flujo de Trabajo

### Suspender Usuario

1. Admin abre modal de detalles (ojo) o suspensión directa (candado)
2. Ingresa razón de suspensión
3. Selecciona duración (1h, 1d, 1w, 1m, permanente)
4. Marca opciones de baneo adicionales:
   - Ocultar perfil
   - Bloquear búsquedas
   - Bloquear mensajes
5. Confirma suspensión
6. Toast verde: "Usuario suspendido correctamente"

### Activar Usuario

1. Admin hace clic en candado abierto (verde) o botón de activar
2. Confirma activación
3. Sistema limpia:
   - `is_active = true`
   - `suspension_reason = null`
   - `suspended_until = null`
   - `profile_hidden = false`
   - `search_blocked = false`
   - `messages_blocked = false`
4. Toast verde: "Usuario activado correctamente"

### Auto-Reactivación

1. Cron job ejecuta `auto_reactivate_expired_suspensions()` cada hora
2. Función busca usuarios con `suspended_until <= NOW()`
3. Reactiva automáticamente limpiando todos los campos
4. Usuario puede volver a acceder

## Implementación en Código

### Archivos Modificados

1. **`components/admin/UserModeration.tsx`**
   - Interfaz `UserProfile` extendida
   - Estado `banOptions` para opciones de baneo
   - Funciones `handleSuspendUser` y `handleActivateUser` actualizadas
   - UI con checkboxes para opciones de baneo
   - Sección de restricciones activas en modal de detalles

2. **`supabase/migrations/20260113_add_user_moderation_fields.sql`**
   - Columnas de moderación agregadas
   - Índices de rendimiento
   - Función de auto-reactivación

## Casos de Uso

### Caso 1: Spam
```
Razón: "Usuario enviando spam en mensajes"
Duración: 1 semana
Opciones: ☑ Bloquear mensajes
```

### Caso 2: Contenido Inapropiado
```
Razón: "Perfil con contenido ofensivo"
Duración: Permanente
Opciones: ☑ Ocultar perfil
          ☑ Bloquear búsquedas
```

### Caso 3: Comportamiento Sospechoso
```
Razón: "Actividad sospechosa - revisión pendiente"
Duración: 1 día
Opciones: ☑ Ocultar perfil
          ☑ Bloquear búsquedas
          ☑ Bloquear mensajes
```

### Caso 4: Advertencia
```
Razón: "Primera advertencia por lenguaje inapropiado"
Duración: 1 hora
Opciones: (ninguna)
```

## Próximos Pasos Recomendados

1. **Configurar Cron Job**
   - Setup en Supabase para ejecutar `auto_reactivate_expired_suspensions()`
   - Recomendado: cada hora

2. **Validación en Frontend**
   - Bloquear acceso de usuarios suspendidos en AuthContext
   - Mostrar mensaje de suspensión al intentar login
   - Ocultar perfiles con `profile_hidden = true`
   - Excluir usuarios con `search_blocked = true` de búsquedas

3. **Sistema de Apelaciones**
   - Permitir usuarios apelar suspensiones
   - Formulario de contacto para suspendidos

4. **Historial de Moderación**
   - Tabla de logs de acciones de moderación
   - Registro de quien suspendió/activó y cuándo

5. **Notificaciones**
   - Email al usuario cuando es suspendido
   - Email cuando es reactivado (auto o manual)

## Testing

### Para Probar

1. Ejecutar migración en Supabase
2. Suspender usuario de prueba con diferentes duraciones
3. Verificar que opciones de baneo se guardan
4. Activar usuario y verificar que se limpian todos los campos
5. Probar auto-reactivación manualmente:
   ```sql
   SELECT auto_reactivate_expired_suspensions();
   ```

### Verificación

```sql
-- Ver usuarios suspendidos
SELECT id, full_name, email, is_active,
       suspended_until, profile_hidden,
       search_blocked, messages_blocked
FROM profiles
WHERE is_active = false;

-- Ver suspensiones que expiran pronto
SELECT id, full_name, email, suspended_until
FROM profiles
WHERE is_active = false
  AND suspended_until IS NOT NULL
ORDER BY suspended_until ASC;
```

## Notas de Seguridad

- Solo administradores pueden suspender/activar usuarios
- Logs de auditoría recomendados para acciones de moderación
- Razón de suspensión es obligatoria
- Al activar, se limpian TODAS las restricciones automáticamente
- Función de auto-reactivación usa SECURITY DEFINER para permisos elevados

## Mantenimiento

- Revisar usuarios permanentemente suspendidos periódicamente
- Auditar razones de suspensión para patrones
- Monitorear efectividad de suspensiones temporales
- Ajustar duraciones según necesidad
