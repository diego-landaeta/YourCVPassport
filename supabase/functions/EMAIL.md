# Correo transaccional (Brevo)

Todos los correos de las Edge Functions salen por **Brevo** (API v3,
`POST https://api.brevo.com/v3/smtp/email`) a través de un único helper:
`supabase/functions/_shared/email.ts` → `sendEmail({ to, subject, html, text?, replyTo?, tags? })`.

Antes se usaba Resend, pero el dominio nunca llegó a verificarse allí y todos los
envíos fallaban (errores #1 y #12 del informe de testeo). Ya no queda ninguna
referencia a Resend ni a `RESEND_API_KEY` en las funciones.

## Correos (plantillas)

Seis correos, todos sobre la misma plantilla base (`_shared/emailLayout.ts`:
tablas y estilos en línea para Gmail/Outlook/Apple Mail, versión en texto plano,
datos escapados y URLs solo http(s)/mailto). El contenido de cada uno está en
`_shared/emailTemplates.ts`:

| Correo | Plantilla | Lo envía |
| --- | --- | --- |
| Confirmación de alta (y "Reenviar") | `confirmSignupEmail` | `signup`, `send-email-confirmation` |
| Recuperar contraseña | `passwordResetEmail` | `send-password-reset` |
| Enlace de acceso sin contraseña | `magicLinkEmail` | `send-magic-link` |
| Código del sello de correo | `verificationCodeEmail` | `send-verification-email` |
| Empresa aprobada / rechazada | `companyApprovedEmail` / `companyRejectedEmail` | `company-registration-email` |
| Consulta de prensa (interno) | `pressContactEmail` | `newsletter-contact` |

Retiradas (2026-10-08): `send-email` (8 plantillas que disparaban triggers de
Postgres vía `send_email_notification()`, que necesita `app.settings.*` y no
llegaba a enviar nada; además duplicaba "empresa aprobada/rechazada") y
`send-lead-notification` (no la llamaba nadie). Si se reactivan las
notificaciones de empresa o empleo, añadir su plantilla en `emailTemplates.ts`.
Siguen desplegadas con el código antiguo hasta borrarlas:
`supabase functions delete send-email` y `supabase functions delete send-lead-notification`.

## Funciones que envían correo

| Función | Tag en Brevo | Si el envío falla |
| --- | --- | --- |
| `signup` | `signup` | 200 con `emailSent: false`: la cuenta queda creada y pendiente (antes se borraba); la UI ofrece "Reenviar" |
| `send-password-reset` | `password-reset` | 502 `EMAIL_SEND_FAILED` |
| `send-magic-link` | `magic-link` | 500 `INTERNAL_ERROR` |
| `send-email-confirmation` ("Reenviar correo de confirmación") | `email-confirmation` | 502 `EMAIL_SEND_FAILED` (200 neutro si no hay cuenta pendiente) |
| `send-verification-email` | `verification-code` | 500 `INTERNAL_ERROR` (sin key: falla antes de crear el sello) |
| `company-registration-email` | `company-approved` / `company-rejected` | 400 (sin key: falla antes de leer la empresa) |

Los contratos HTTP de cada función no cambian con la migración; el campo
`emailId`/`email_id`/`id` de las respuestas ahora es el `messageId` de Brevo.

## Comportamiento de `sendEmail`

- Devuelve `{ ok: true, messageId }` o
  `{ ok: false, status, code: 'EMAIL_SEND_FAILED' | 'EMAIL_NOT_CONFIGURED', detail }`.
  `status` es el código HTTP de Brevo, o `0` si no hubo respuesta.
- `EMAIL_NOT_CONFIGURED`: falta `BREVO_API_KEY` (o `SENDER_EMAIL` no es una dirección
  válida). No se hace ninguna petición.
- `EMAIL_SEND_FAILED`: Brevo responde 4xx/5xx, timeout (10 s, `AbortSignal.timeout`),
  error de red, o la entrada no es válida (destinatario que no sea **una única**
  dirección, `replyTo` inválido, asunto o HTML vacíos).
- Remitente: `SENDER_EMAIL` o, por defecto, `no-reply@yourcvpassport.com`, con
  nombre `YourCVPassport`.
- `detail` solo lleva el status y el `code` de error de Brevo (p. ej.
  `brevo HTTP 401 unauthorized`). Nunca incluye la API key, el destinatario ni el
  contenido del correo, así que se puede registrar con `console.error`.

## Secretos

Solo en el servidor (secretos de Supabase). **Nunca** en `.env*` con prefijo
`VITE_`, ni en el repo.

```bash
supabase secrets set BREVO_API_KEY=... SENDER_EMAIL=no-reply@yourcvpassport.com
```

Para que la key no quede en el historial del shell, mejor usar los scripts
(`deploy-signup.sh`, `deploy.sh`), que la leen de la variable de entorno
`BREVO_API_KEY` y la pasan por un fichero temporal con permisos 600. Fallan si
falta `BREVO_API_KEY`; `SENDER_EMAIL` es opcional (si no se
exporta, no se toca el secreto que ya hubiera en Supabase).

La API key se crea en Brevo → *SMTP & API* → *API keys* (tipo v3, no la clave SMTP).

## Autenticar el dominio yourcvpassport.com en Brevo

Sin esto Brevo rechaza el remitente (`400 invalid_parameter`) o los correos acaban
en spam.

1. Brevo → *Senders, Domains & Dedicated IPs* → *Domains* → *Add a domain* →
   `yourcvpassport.com`. Elegir la configuración manual de DNS.
2. En Hostinger (hPanel → *Dominios* → `yourcvpassport.com` → *DNS / Nameservers* →
   *Gestionar registros DNS*), crear **exactamente** los registros que muestre Brevo.
   Suelen ser:
   - **Código de verificación**: `TXT` en `@` con `brevo-code:...`.
   - **DKIM**: dos `CNAME` (`brevo1._domainkey` y `brevo2._domainkey`) que apuntan a
     `...dkim.brevo.com` (en cuentas antiguas, un `TXT` en `mail._domainkey`).
   - **DMARC**: `TXT` en `_dmarc`, por ejemplo
     `v=DMARC1; p=none; rua=mailto:rua@dmarc.brevo.com`. Si ya existe un registro
     `_dmarc`, no crear otro: editar el existente.
   - **SPF** (solo si Brevo lo pide): añadir su `include:` al registro SPF que ya
     tenga el dominio (por ejemplo el de Hostinger). Un dominio solo puede tener un
     registro `v=spf1`.
3. Esperar la propagación (minutos u horas) y pulsar *Authenticate this email domain*
   en Brevo hasta que el dominio salga como **Authenticated**.
4. Recomendado: pasar DMARC a `p=quarantine` cuando los informes muestren que todo el
   correo legítimo pasa DKIM.

## Orden de despliegue

1. Autenticar el dominio en Brevo (sección anterior) y crear la API key.
2. Configurar los secretos (`BREVO_API_KEY`, `SENDER_EMAIL`), con los scripts o con
   `supabase secrets set`.
3. Desplegar las funciones que envían correo (`_shared/email.ts` se empaqueta con
   cada una, hay que redesplegarlas todas):
   - `signup` con `./deploy-signup.sh` (desde la rama que incluya también los cambios
     de autenticación de signup / send-password-reset).
   - `./deploy.sh` para `send-password-reset`, `send-email-confirmation`,
     `send-magic-link`, `send-verification-email` y `company-registration-email`.
   - `supabase functions deploy newsletter-contact --no-verify-jwt` (prensa y boletín).
4. Probar en producción: alta con un email propio y "olvidé mi contraseña". Los
   envíos aparecen en Brevo → *Transactional* → *Logs* con su tag.
5. Cuando todo funcione: `supabase secrets unset RESEND_API_KEY` y revocar la key en
   el panel de Resend.
