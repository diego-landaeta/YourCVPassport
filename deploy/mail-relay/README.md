# Relé de correo (Brevo)

Brevo tiene activada la lista de **IPs autorizadas** y las Edge Functions de
Supabase salen por IPs de AWS que cambian: Brevo las rechaza con
`401 unrecognised IP address`. El servidor web (`72.60.90.135`) sí está
autorizado, así que los correos de las funciones pasan por este relé.

```
Edge Function ──HTTPS──> nginx yourcvpassport.com/api/mail-relay ──> 127.0.0.1:3917 (pm2: ycp-mail-relay) ──> api.brevo.com
              Bearer EMAIL_RELAY_SECRET                                                       api-key BREVO_API_KEY
```

## En el servidor

- Código: `/opt/ycp-mail-relay/server.mjs` (copia de este directorio).
- Configuración: `/etc/ycp-mail-relay.env`, permisos `600`:
  ```
  BREVO_API_KEY=xkeysib-...
  RELAY_SECRET=<64 caracteres aleatorios>
  PORT=3917
  ```
- Proceso: `pm2 start /opt/ycp-mail-relay/server.mjs --name ycp-mail-relay && pm2 save`.
- nginx (`/etc/nginx/sites-available/yourcvpassport.com`, bloque 443), antes de `location /`:
  ```nginx
  location = /api/mail-relay {
      proxy_pass http://127.0.0.1:3917/;
      proxy_set_header Host $host;
      client_max_body_size 512k;
  }
  ```
  `nginx -t && systemctl reload nginx`.

## En Supabase (secretos de las Edge Functions)

- `EMAIL_RELAY_URL=https://yourcvpassport.com/api/mail-relay`
- `EMAIL_RELAY_SECRET=<el mismo RELAY_SECRET>`

Con los dos definidos, `_shared/brevoRequest.ts` envía por el relé; si se
borran, vuelve a llamar a Brevo directamente (útil si algún día se desactiva la
lista de IPs en Brevo, y entonces el relé se puede retirar).

## Límites del relé

Solo `/smtp/email` (remitente `@yourcvpassport.com`) y
`/contacts/doubleOptinConfirmation`; cuerpo máximo 512 KB; 120 peticiones por
minuto; 10 s de timeout. Logs (`pm2 logs ycp-mail-relay`): ruta, status y
duración, sin destinatarios ni contenido.

## Rotar la clave

Generar un `RELAY_SECRET` nuevo, ponerlo en `/etc/ycp-mail-relay.env`
(`pm2 restart ycp-mail-relay`) y en el secreto `EMAIL_RELAY_SECRET` de Supabase.
