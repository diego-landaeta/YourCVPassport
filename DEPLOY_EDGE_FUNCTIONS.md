# Guía para Desplegar Edge Functions y Habilitar Envío de Emails

## Problema Actual

Las edge functions no están desplegadas, por lo que:

- ❌ Los emails NO se envían realmente
- ⚠️ El sistema funciona en "modo fallback" (códigos en consola)
- ❌ Los usuarios no pueden verificar sus emails en producción

## Solución: Desplegar Edge Functions

### Opción 1: Desplegar desde Supabase Dashboard (Recomendado)

#### Paso 1: Acceder al Dashboard

1. Ve a https://supabase.com/dashboard
2. Inicia sesión con tu cuenta
3. Selecciona tu proyecto: `djehzlzombqrzzuchcef`

#### Paso 2: Crear las Edge Functions

**Para `send-verification-email`:**

1. Ve a **Edge Functions** en el menú lateral
2. Click en **Create a new function**
3. Nombre: `send-verification-email`
4. Copia y pega el contenido de:
   ```
   supabase/functions/send-verification-email/index.ts
   ```
5. Click en **Deploy function**

**Para `verify-email-code`:**

1. Click en **Create a new function**
2. Nombre: `verify-email-code`
3. Copia y pega el contenido de:
   ```
   supabase/functions/verify-email-code/index.ts
   ```
4. Click en **Deploy function**

#### Paso 3: Configurar Variables de Entorno

1. Ve a **Project Settings** → **Edge Functions**
2. Click en **Add new secret**
3. Agrega:
   - **Name:** `RESEND_API_KEY`
   - **Value:** Tu API key de Resend (obtén una en https://resend.com)
4. Click en **Save**

### Opción 2: Desplegar desde CLI (Avanzado)

#### Paso 1: Vincular el Proyecto

```powershell
# Iniciar sesión en Supabase
npx supabase login

# Vincular el proyecto
npx supabase link --project-ref djehzlzombqrzzuchcef
```

#### Paso 2: Configurar Secretos

```powershell
# Configurar RESEND_API_KEY
npx supabase secrets set RESEND_API_KEY=tu_api_key_aqui
```

#### Paso 3: Desplegar las Funciones

```powershell
# Desplegar send-verification-email
npx supabase functions deploy send-verification-email --no-verify-jwt

# Desplegar verify-email-code
npx supabase functions deploy verify-email-code --no-verify-jwt

# Desplegar send-verification-sms (opcional)
npx supabase functions deploy send-verification-sms --no-verify-jwt

# Desplegar verify-phone-code (opcional)
npx supabase functions deploy verify-phone-code --no-verify-jwt
```

## Obtener API Key de Resend

1. Ve a https://resend.com
2. Crea una cuenta o inicia sesión
3. Ve a **API Keys**
4. Click en **Create API Key**
5. Dale un nombre (ej: "YourCVPassport Production")
6. Copia la API key (empieza con `re_`)
7. Úsala en el paso de configuración de variables

## Verificar que Funciona

### Paso 1: Probar en el Navegador

1. Refresca la aplicación (F5)
2. Ve a **Dashboard** → **Verifications**
3. Click en **Solicitar Verificación** para Email
4. Ingresa tu email
5. Click en **Enviar Código**

### Paso 2: Verificar el Email

1. Revisa tu bandeja de entrada
2. Deberías recibir un email de "YourCVPassport"
3. El email contiene un código de 6 dígitos
4. Ingresa el código en el modal
5. Click en **Verificar**

### Paso 3: Verificar en Logs

En el Dashboard de Supabase:

1. Ve a **Edge Functions** → **send-verification-email**
2. Click en **Logs**
3. Deberías ver logs de ejecución exitosa

## Troubleshooting

### Error: "Rate limit exceeded"

- Resend tiene límites en el plan gratuito
- Espera 1 hora o actualiza a plan de pago

### Error: "Invalid API key"

- Verifica que copiaste la API key completa
- Asegúrate de que no tiene espacios al inicio/final
- Regenera la API key si es necesario

### No recibo el email

1. Revisa la carpeta de spam
2. Verifica que el email es válido
3. Revisa los logs de la edge function
4. Verifica que RESEND_API_KEY está configurado

### Error 404 en edge functions

- Las funciones no están desplegadas
- Sigue los pasos de despliegue arriba

## Estado Actual del Código

El código del frontend ya está actualizado para:

- ✅ Llamar a las edge functions cuando estén disponibles
- ✅ Usar modo fallback si no están desplegadas
- ✅ Manejar errores correctamente
- ✅ Mostrar mensajes claros al usuario

**Solo falta desplegar las edge functions para que todo funcione en producción.**

## Próximos Pasos

1. [ ] Obtener API key de Resend
2. [ ] Desplegar `send-verification-email`
3. [ ] Desplegar `verify-email-code`
4. [ ] Configurar `RESEND_API_KEY`
5. [ ] Probar el flujo completo
6. [ ] Verificar que los emails llegan

---

**Nota:** Una vez desplegadas las edge functions, el sistema dejará de usar el modo fallback automáticamente y comenzará a enviar emails reales.
