# Despliegue de la rama de correcciones (informe de testeo + seguridad)

El orden importa: el frontend nuevo lee la vista `profiles_full`, la vista
`public_stamps` y la columna `is_premium`, que crean las migraciones de la fase 1.
Si se sube el frontend antes, los CV públicos muestran "Perfil no encontrado" y el
dashboard falla (`42703 column is_premium does not exist`).

Cada migración explica en su cabecera su orden, qué revisar antes y cómo revertir.

## 0. Antes de empezar

- [ ] Copia de seguridad de la base de datos (Supabase → Database → Backups).
- [ ] Rotar las claves que estuvieron expuestas: `service_role` de Supabase, la API
      key de Gemini y la de Resend (Resend deja de usarse; revocarla).
- [ ] Revocar ya en producción la RPC `increment` (abierta a `anon`):
      ```sql
      select oid::regprocedure from pg_proc where proname = 'increment';
      revoke execute on function public.increment(<firma>) from public, anon, authenticated;
      ```

## 1. Secretos de las Edge Functions

`supabase secrets set ...` o Project Settings → Edge Functions. Nunca en el repo ni
en variables `VITE_*`.

| Secreto | Obligatorio | Uso |
|---|---|---|
| `BREVO_API_KEY` | sí | Todos los correos (`_shared/email.ts`) y el boletín |
| `SENDER_EMAIL` | recomendado | Remitente, p. ej. `no-reply@yourcvpassport.com` |
| `BREVO_SENDER_NAME`, `BREVO_SENDER_EMAIL` | opcional | Nombre y remitente del boletín |
| `BREVO_NEWSLETTER_LIST_ID` | sí (boletín) | Lista de Brevo del boletín |
| `BREVO_DOI_TEMPLATE_ID`, `BREVO_DOI_TEMPLATE_ID_EN` | sí (boletín) | Plantillas de doble opt-in ES/EN |
| `PRESS_INBOX_EMAIL` | sí (prensa) | Buzón que recibe el formulario de prensa |
| `GEMINI_API_KEY` | sí | IA (ya no está en el frontend); usar la clave **rotada** |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | recomendado | Rate limit (sin ellos no limita) |
| `VERIFICATION_CODE_SECRET` | recomendado | Firma de códigos de verificación (si falta, usa la service role) |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` | si hay SMS | Verificación por SMS |
| `CORS_EXTRA_ORIGINS` | opcional | Orígenes extra separados por comas (p. ej. staging) |
| `APP_URL` | opcional | Por defecto `https://yourcvpassport.com` |

- [ ] Brevo: autenticar el dominio `yourcvpassport.com` (registros SPF, DKIM y DMARC
      que da Brevo en Senders & IP → Domains). Sin esto los correos van a spam.
- [ ] Brevo: crear la lista del boletín y las plantillas de doble opt-in.

## 2. Migraciones de la fase 1 (aditivas, compatibles con el frontend actual)

En el SQL editor, en este orden:

- [ ] `20261005_rpc_validar_usuario.sql`
- [ ] `20261005_proteger_datos_profiles.sql`
- [ ] `20261005_proteger_evidencia_stamps.sql`
- [ ] `20261005_cerrar_politicas_abiertas.sql`
- [ ] `20261005_revocar_send_email_notification.sql`
- [ ] `20261005_recalcular_contadores_feed.sql`
- [ ] `20261007_seguridad_empresas.sql` (aborta si falta la primera)
- [ ] `20261008_stamps_insert_solo_pendiente.sql` (un usuario ya no puede crearse sellos VERIFIED)

## 3. Edge Functions

- [ ] `translate-texts` y `translate-profile` (`--no-verify-jwt`), y **después**
      `20261005_cerrar_escritura_text_translations.sql` y
      `20261005_cerrar_escritura_profile_translations.sql`.
- [ ] `./supabase/functions/deploy-signup.sh` (signup).
- [ ] `./supabase/functions/deploy.sh` (verificación, contraseña, magic link,
      `send-email`, registro de empresa). Exige `BREVO_API_KEY` en el entorno.
- [ ] `supabase functions deploy send-lead-notification`
- [ ] `supabase functions deploy newsletter-contact --no-verify-jwt`
- [ ] `./supabase/functions/deploy-export-pdf.sh` y `export-docx`
- [ ] El resto de funciones modificadas: `admin-create-managed-profile`,
      `ai-cv-assistant`, `ai-optimize-description`, `get-public-profile`,
      `track-analytics`, `sitemap`.

## 4. Frontend

- [ ] `npm run build`. Comprobar que en `dist/` no hay claves (`GEMINI`, `service_role`,
      `re_`, `xkeysib-`).
- [ ] Subir `dist/` (FileZilla).
- [ ] nginx: aplicar `nginx/*.conf` (cabeceras de seguridad, CSP en `Report-Only`,
      redirección www → apex, `no-cache` en `index.html`) y `nginx -t && systemctl reload nginx`.
- [ ] Reiniciar `server.mjs` (SSR de `/cv/:slug`).

## 5. Migraciones de la fase 2 (después del frontend y las funciones)

- [ ] `20261005_privatizar_company_documents.sql`
- [ ] `20261006_cerrar_columnas_privadas_profiles_stamps.sql`. Quita a `anon` las
      columnas privadas de `profiles` y las políticas públicas de `stamps`. Revisar
      antes los avisos (WARNING) que imprime.

## 6. Google y comprobaciones finales

- [ ] Pantalla de consentimiento OAuth (Google Cloud → APIs & Services → OAuth consent
      screen → Branding): nombre "YourCVPassport", logo, dominio autorizado
      `yourcvpassport.com` (verificado en Search Console), enlaces a `/privacy` y
      `/terms`. Publicar y enviar a verificación. Hasta que Google la apruebe, el
      consentimiento sigue mostrando `*.supabase.co`. Para quitarlo del todo hace
      falta un dominio propio para Supabase Auth (Custom Domain, plan de pago).
- [ ] Abrir sin sesión un CV público (`/cv/<slug>`), el feed `/comunidad` y una oferta.
- [ ] Registro, login, recuperación de contraseña y boletín: el correo llega por Brevo.
- [ ] Un admin entra y va directo a `/admin`.
- [ ] Descargar el PDF de un CV largo: sin cortes de texto entre páginas.
- [ ] Search Console: reenviar `sitemap.xml`.
