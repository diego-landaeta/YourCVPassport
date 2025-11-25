# 📧 Configuración de Emails de Autenticación con Resend

## Descripción General

Este documento describe cómo configurar las edge functions de Supabase para enviar todos los emails de autenticación (recuperación de contraseña, confirmación de email, magic links) usando **Resend** como proveedor de email.

## Edge Functions Implementadas

### 1. `send-password-reset`

Envía emails de recuperación de contraseña cuando un usuario solicita restablecer su contraseña.

**Características:**

- Genera un token de recuperación seguro usando Supabase Auth Admin API
- Email con diseño profesional y branding de YourCVPassport
- Enlace de recuperación válido por 1 hora
- Consejos de seguridad incluidos en el email

### 2. `send-email-confirmation`

Envía emails de bienvenida con enlace de confirmación cuando un usuario se registra.

**Características:**

- Genera un token de confirmación usando Supabase Auth Admin API
- Email de bienvenida con información sobre las características de la plataforma
- Enlace de confirmación válido por 24 horas
- Diseño atractivo y profesional

### 3. `send-magic-link`

Envía magic links para autenticación sin contraseña.

**Características:**

- Genera un magic link de un solo uso
- Email con instrucciones claras de uso
- Enlace válido por 1 hora
- Información de seguridad sobre el uso de magic links

## Configuración en Supabase Dashboard

### Paso 1: Configurar Variables de Entorno

1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Navega a **Project Settings** → **Edge Functions**
3. En la sección **Secrets**, agrega las siguientes variables:

```
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
```

> **Nota:** El `RESEND_API_KEY` debe obtenerse desde [Resend Dashboard](https://resend.com/api-keys)

### Paso 2: Configurar Auth Hooks

Para que Supabase use nuestras edge functions personalizadas en lugar de su sistema de email por defecto, necesitas configurar **Auth Hooks**.

#### Opción A: Usando el Dashboard (Recomendado)

1. Ve a **Authentication** → **Hooks** en tu proyecto de Supabase
2. Configura los siguientes hooks:

**Send Email Hook:**

- **Hook Type:** Send Email
- **Function:** Selecciona la función correspondiente según el tipo de email:
  - Para confirmación de signup: `send-email-confirmation`
  - Para recuperación de contraseña: `send-password-reset`
  - Para magic link: `send-magic-link`

#### Opción B: Usando SQL (Avanzado)

Ejecuta el siguiente SQL en el **SQL Editor** de Supabase:

```sql
-- Configurar hook para confirmación de email
CREATE OR REPLACE FUNCTION public.custom_email_confirmation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://tu-proyecto.supabase.co/functions/v1/send-email-confirmation',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := jsonb_build_object(
      'email', NEW.email,
      'userId', NEW.id
    )
  );
  RETURN NEW;
END;
$$;

-- Similar para password reset y magic link...
```

### Paso 3: Verificar Dominio en Resend

1. Ve a [Resend Dashboard](https://resend.com/domains)
2. Agrega tu dominio (ej: `yourcvpassport.com`)
3. Configura los registros DNS según las instrucciones de Resend
4. Espera a que el dominio sea verificado

## Deployment de las Edge Functions

### Usando PowerShell (Windows)

```powershell
cd c:\Users\molin\Downloads\yourcvpassport\supabase\functions
.\deploy.ps1
```

### Usando Bash (Linux/Mac)

```bash
cd /path/to/yourcvpassport/supabase/functions
chmod +x deploy.sh
./deploy.sh
```

### Deployment Individual

Si solo quieres deployar una función específica:

```bash
supabase functions deploy send-password-reset --no-verify-jwt
supabase functions deploy send-email-confirmation --no-verify-jwt
supabase functions deploy send-magic-link --no-verify-jwt
```

## Testing

### Probar Recuperación de Contraseña

1. Ve a la página de login de tu aplicación
2. Click en "¿Olvidaste tu contraseña?"
3. Ingresa un email registrado
4. Verifica que recibes el email
5. Click en el enlace y cambia tu contraseña

### Probar Confirmación de Email

1. Crea una nueva cuenta
2. Verifica que recibes el email de bienvenida
3. Click en el enlace de confirmación
4. Verifica que puedes iniciar sesión

### Probar Magic Link

1. En la página de login, selecciona "Magic Link"
2. Ingresa tu email
3. Verifica que recibes el email
4. Click en el enlace para iniciar sesión

## Troubleshooting

### Los emails no llegan

**Posibles causas:**

1. El dominio no está verificado en Resend
2. La API key de Resend es incorrecta
3. Las edge functions no están deployadas correctamente

**Solución:**

1. Verifica el dominio en Resend Dashboard
2. Verifica que `RESEND_API_KEY` esté configurada correctamente en Supabase
3. Revisa los logs de las edge functions en Supabase Dashboard → Edge Functions → Logs

### Error: "Resend error: ..."

**Causa:** Problema con la API de Resend

**Solución:**

1. Verifica que tu API key sea válida
2. Verifica que no hayas excedido los límites de Resend
3. Revisa el [status de Resend](https://resend.com/status)

### Los enlaces de recuperación no funcionan

**Causa:** Configuración incorrecta de `redirectTo`

**Solución:**

1. Verifica que las URLs de redirect en `AuthContext.tsx` sean correctas
2. Asegúrate de que las URLs estén en la whitelist de Supabase:
   - Ve a **Authentication** → **URL Configuration**
   - Agrega tus URLs de redirect (ej: `http://localhost:52656/recovery`)

### Rate Limiting

Las edge functions incluyen protección contra spam. Si un usuario solicita demasiados emails en poco tiempo, recibirá un error de rate limit.

**Límites actuales:**

- Recuperación de contraseña: 3 intentos por hora
- Confirmación de email: Sin límite (manejado por Supabase Auth)
- Magic link: Sin límite (manejado por Supabase Auth)

## Personalización de Templates

Los templates HTML están directamente en el código de cada edge function. Para personalizarlos:

1. Edita el archivo `index.ts` de la función correspondiente
2. Modifica el HTML en la sección `html:` del body de Resend
3. Redeploya la función

**Ejemplo de personalización:**

```typescript
html: `
  <!DOCTYPE html>
  <html>
    <body>
      <!-- Tu HTML personalizado aquí -->
    </body>
  </html>
`;
```

## Monitoreo

### Logs de Edge Functions

1. Ve a **Edge Functions** → **Logs** en Supabase Dashboard
2. Selecciona la función que quieres monitorear
3. Revisa los logs en tiempo real

### Estadísticas de Resend

1. Ve a [Resend Dashboard](https://resend.com/emails)
2. Revisa las estadísticas de emails enviados
3. Verifica tasas de entrega y bounces

## Seguridad

### Mejores Prácticas

1. **Nunca expongas tu Service Role Key:** Solo debe estar en las variables de entorno de Supabase
2. **Usa HTTPS:** Asegúrate de que todas las URLs de redirect usen HTTPS en producción
3. **Valida emails:** Las funciones ya incluyen validación básica
4. **Rate limiting:** Implementa rate limiting adicional si es necesario
5. **Monitorea logs:** Revisa regularmente los logs para detectar actividad sospechosa

### Información Sensible

Las edge functions **NO** revelan si un email existe o no en la base de datos (para password reset), esto previene ataques de enumeración de usuarios.

## Costos

### Resend Pricing

- **Free Tier:** 3,000 emails/mes
- **Pro:** $20/mes por 50,000 emails
- Ver más en: https://resend.com/pricing

### Supabase Edge Functions

- **Free Tier:** 500,000 invocaciones/mes
- **Pro:** $25/mes por 2,000,000 invocaciones
- Ver más en: https://supabase.com/pricing

## Soporte

Si tienes problemas:

1. Revisa los logs de las edge functions
2. Verifica la configuración de Resend
3. Consulta la [documentación de Supabase Auth](https://supabase.com/docs/guides/auth)
4. Consulta la [documentación de Resend](https://resend.com/docs)

---

**Última actualización:** 2025-11-24  
**Versión:** 1.0
