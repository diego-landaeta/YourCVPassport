# newsletter-contact

Edge Function de los dos formularios públicos que van a Brevo:

| Acción      | Formulario                          | Llamada a Brevo                                   |
|-------------|-------------------------------------|---------------------------------------------------|
| `subscribe` | Boletín del blog (`BlogPage`)       | `POST /v3/contacts/doubleOptinConfirmation`       |
| `press`     | Contacto de prensa (`PressKitPage`) | `POST /v3/smtp/email` a la bandeja de prensa      |

## Contrato

`POST /functions/v1/newsletter-contact` (sin JWT: formularios anónimos)

```jsonc
{ "action": "subscribe", "email": "ana@example.com", "lang": "es", "website": "" }
{ "action": "press", "name": "Ana", "email": "ana@example.com", "outlet": "Medio",
  "message": "Hola…", "lang": "en", "website": "" }
```

- `lang`: `es` | `en` (opcional, `es` por defecto).
- `website`: honeypot. El formulario lo oculta; si llega relleno se responde
  `200 { success: true }` sin enviar nada.
- Límites: email 254, nombre 120, medio 160, mensaje 5000 caracteres; cuerpo
  32 KB. Campos desconocidos → `INVALID_INPUT`.

Respuestas: `200 { success: true }` o `{ error, code }`:

| Status | code                 | Cuándo                                                        |
|--------|----------------------|---------------------------------------------------------------|
| 400    | `INVALID_INPUT`      | JSON, acción o campos no válidos (también 405 para no-POST)    |
| 403    | `ORIGIN_NOT_ALLOWED` | `Origin` ausente o fuera de `_shared/cors.ts`                  |
| 429    | `RATE_LIMITED`       | 5/min por IP o 3 cada 15 min por email (con `Retry-After`)     |
| 503    | `NOT_CONFIGURED`     | Faltan secretos de Brevo (la web ofrece el mailto de respaldo) |
| 502    | `SEND_FAILED`        | Brevo rechaza la petición, timeout (10 s) o red caída          |
| 500    | `INTERNAL_ERROR`     | Cualquier otro fallo                                           |

El alta es neutra: si el contacto ya existe o ya está en la lista se responde
igual que un alta nueva. Tras confirmar, Brevo redirige a
`https://www.yourcvpassport.com/recursos/blog?suscrito=1` (o
`/resources/blog?suscrito=1` en inglés) y el blog muestra el aviso de
suscripción confirmada.

## Secretos

Se configuran en Supabase (nunca en `VITE_*` ni en el repo):

| Secreto                     | Obligatorio | Uso                                                                   |
|-----------------------------|-------------|-----------------------------------------------------------------------|
| `BREVO_API_KEY`             | sí          | API key v3 de Brevo (Settings → SMTP & API → API Keys)                |
| `BREVO_NEWSLETTER_LIST_ID`  | boletín     | ID numérico de la lista del boletín                                   |
| `BREVO_DOI_TEMPLATE_ID`     | boletín     | ID de la plantilla de doble opt-in (con la etiqueta `{{ doubleoptin }}`) |
| `BREVO_DOI_TEMPLATE_ID_EN`  | no          | Plantilla de doble opt-in en inglés; si falta se usa la anterior      |
| `PRESS_INBOX_EMAIL`         | no          | Destino de prensa; por defecto `press@yourcvpassport.com`             |
| `BREVO_SENDER_EMAIL`        | no          | Remitente verificado en Brevo; por defecto `no-reply@yourcvpassport.com` |
| `BREVO_SENDER_NAME`         | no          | Nombre del remitente; por defecto `YourCVPassport`                    |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | no | Rate limit (ya usados por otras funciones). Sin ellos falla en abierto |
| `CORS_EXTRA_ORIGINS`        | no          | Orígenes extra permitidos (staging), separados por comas              |

El remitente (`BREVO_SENDER_EMAIL`) debe estar verificado en Brevo, o el
dominio autenticado; si no, Brevo rechaza el envío y la función responde
`SEND_FAILED`.

```bash
supabase secrets set BREVO_API_KEY=... BREVO_NEWSLETTER_LIST_ID=12 BREVO_DOI_TEMPLATE_ID=34
# opcionales
supabase secrets set PRESS_INBOX_EMAIL=press@yourcvpassport.com BREVO_SENDER_EMAIL=no-reply@yourcvpassport.com
```

## Despliegue

```bash
supabase functions deploy newsletter-contact --no-verify-jwt
```

`--no-verify-jwt` es necesario porque los formularios son públicos (sin sesión).
La protección es el `Origin` en lista blanca, el rate limit por IP y por email
(hash SHA-256, el email no se guarda en claro en Upstash) y el honeypot.

## Logs

Solo se registran el status y el `code` de error de Brevo. Nunca la API key, el
email, el nombre ni el mensaje.
