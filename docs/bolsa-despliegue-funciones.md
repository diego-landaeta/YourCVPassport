# Bolsa de empleo: despliegue de las Edge Functions y programación

El despliegue de las funciones y la creación de los secretos son pasos manuales de una persona
con acceso al proyecto de Supabase. La **programación** (moderación, correos, caducidad,
alertas, revisión de empresas y resúmenes diarios) ya NO es manual: la dejan hecha las migraciones
`20261034_programacion_cron.sql` y `20261035_cierre_final.sql` con pg_cron + pg_net. Ninguna clave va en el repo ni en el chat.

Funciones implicadas:

| Función | Qué hace | JWT en el gateway | Quién la llama |
| --- | --- | --- | --- |
| `signup` | Alta de usuarios (edad para todo tipo salvo `empresa`, `aceptado_en`); el correo de confirmación sale en el idioma de registro y con texto de empresa si `tipo='empresa'` | **`--no-verify-jwt`** (es pública) | la web |
| `company-review-ai` | Revisión por reglas de una empresa nueva (aprueba solo si todo cuadra, incluido el dominio del correo CONFIRMADO de la cuenta); con `{"sweep":true}` revisa las pendientes sin revisar | **`--no-verify-jwt`** (la función comprueba dentro quién llama) | la web, con la sesión de quien registra, y el cron (`x-cron-secret`) para el barrido |
| `moderate-job-posting` | Revisión de ofertas en `AI_REVIEW`; publica o pasa a revisión manual (salario, texto duplicado, categoría y enlaces incluidos) | **`--no-verify-jwt`** | el cron (`x-cron-secret`) y el botón del panel admin |
| `send-outbox` | Envía los correos de `email_outbox` con tope diario; con `{"alerts":true}` encola antes las alertas y con `{"digests":true}` los resúmenes diarios de candidaturas | **`--no-verify-jwt`** | el cron (`x-cron-secret`) |
| `expire-job-postings` | Avisa 3 días antes y cierra las ofertas vencidas | **`--no-verify-jwt`** | el cron (`x-cron-secret`), una vez al día |
| `sitemap` | Sitemap público (fichas `/<cc>/ofertas/<slug>` y `/<cc>/jobs/<slug>`) | `--no-verify-jwt` (es pública: nginx la llama sin sesión) | buscadores, vía nginx |

**Por qué `--no-verify-jwt` en las del cron (`moderate-job-posting`, `send-outbox`, `expire-job-postings` y,
desde el cierre final, `company-review-ai`).** El cron manda solo la cabecera
`x-cron-secret`, no un JWT. Con la verificación de JWT activa, el gateway de Supabase
contestaría 401 antes de que la función mire el secreto. No se pierde seguridad: cada función
comprueba dentro (`_shared/serviceAuth.ts`), por este orden, (1) `x-cron-secret` contra el
secreto de entorno `CRON_SECRET` en tiempo constante, (2) la clave `service_role` en
`Authorization`, (3) un usuario con `profiles.role = 'admin'`. Cualquier otra cosa recibe 401 o
403. Si `CRON_SECRET` no está definido (o tiene menos de 16 caracteres) la vía del cron queda
**cerrada**: nunca se acepta.

## 0. Orden de despliegue (obligatorio)

1. **Migraciones de datos**: `20261029` → `20261030` → `20261031` → `20261032` → `20261033` → `20261035`
   (SQL, aparte de este documento; la 34 es la programación y va en el paso 5). Las funciones dependen de ellas:
   - `moderate-job-posting` necesita `get_job_moderation_hash` y `moderar_oferta(..., p_expected_hash)`
     (migración 32). Sin ellas **no publica nada**: pasa las ofertas a revisión manual (fallo seguro).
   - `send-outbox` necesita `email_outbox.last_error` (migración 32), y `queue_job_alerts()` (31) para
     `{"alerts":true}`. Sin la columna contesta `503 MIGRATION_MISSING` y no envía nada.
   - `expire-job-postings` necesita `expire_job_postings()` (migración 30).
   - Los avisos de nueva versión legal (`legal_version_notice`, migración 33) los envía `send-outbox`.
   - `send-outbox` con `{"digests":true}` necesita `queue_application_digests()` (migración 35); sin ella
     responde `digests_error: true` y sigue enviando lo demás. `job_alert` lleva `unsubscribe_token` y las
     ofertas con `country_code` desde la migración 35 (sin ellos el correo sale sin enlace de baja).
   - El correo de aviso de candidaturas `application_digest` y el aviso del barrido de empresas
     (`company_unreviewed:<id>`) viajan por `email_outbox`: no necesitan nada más.
2. **Generar el secreto del cron** (una vez, en tu terminal; no lo pegues en ningún sitio):
   `openssl rand -hex 32`. Es el valor que irá en dos sitios con el MISMO contenido:
   - la Edge Function: `supabase secrets set CRON_SECRET=<valor>`
   - el vault de la base (SQL editor): `select vault.create_secret('<valor>', 'bolsa_cron_secret');`
3. **Desplegar las funciones** (sección 2) con el secreto ya puesto.
4. **Comprobar a mano** cada función (sección 3).
5. **Aplicar `20261034_programacion_cron.sql` y, después, `20261035_cierre_final.sql`** (activa pg_cron,
   programa los trabajos de la 34 y añade `bolsa-empresas` y `bolsa-resumenes`; la 35 amplía
   `bolsa_llamar_funcion` para que acepte `company-review-ai`). Hacerlo el último: antes de este paso no hay nada programado y el fallo es seguro (las ofertas
   esperan en `AI_REVIEW` y la cola de correos no se vacía).
6. Comprobar que corre (sección 5).

Tener a mano: la clave `service_role` (Panel > Project Settings > API) para las pruebas manuales y
el *project ref* (`djehzlzombqrzzuchcef`). CLI de Supabase iniciada: `supabase login` y, desde la raíz,
`supabase link --project-ref djehzlzombqrzzuchcef`.

## 1. Secretos

Panel de Supabase > Edge Functions > Secrets (o `supabase secrets set NOMBRE=valor`).

| Secreto | Estado | Para qué |
| --- | --- | --- |
| **`CRON_SECRET`** | **nuevo, obligatorio para el cron** | secreto compartido con el cron de la base. Mínimo 16 caracteres (usa `openssl rand -hex 32`). Sin él, las funciones rechazan siempre `x-cron-secret` |
| `BREVO_API_KEY` o `EMAIL_RELAY_URL` + `EMAIL_RELAY_SECRET` | ya existen (ver `supabase/functions/EMAIL.md`) | `send-outbox` envía por `_shared/email.ts`, igual que el resto |
| `SENDER_EMAIL` | ya existe | remitente (por defecto `no-reply@yourcvpassport.com`) |
| `OUTBOX_DAILY_CAP` | opcional | tope diario de `send-outbox`. Sin él: **250**. Brevo da 300/día y también lo gastan el alta, la recuperación de contraseña y los códigos |

Y en la base (no es un secreto de Edge Functions):

| Vault | Para qué |
| --- | --- |
| **`bolsa_cron_secret`** (`vault.create_secret`) | mismo valor que `CRON_SECRET`. Lo lee `public.bolsa_llamar_funcion()` y lo manda en `x-cron-secret`. Sin él (o con menos de 16 caracteres) esa función NO llama a nada y falla con `BOLSA_CRON_SECRET_AUSENTE`: se ve en `cron.job_run_details` |

`SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` los inyecta Supabase; no se configuran. No hay ningún
secreto de IA (la revisión funciona sin IA; revisión manual ante duda).

**Rotar el secreto**: elige un valor nuevo, actualiza el vault
(`select vault.update_secret(id, '<nuevo>') ` sobre la fila de `vault.secrets` con nombre
`bolsa_cron_secret`) y `supabase secrets set CRON_SECRET=<nuevo>` en el mismo momento. Entre un
paso y otro los trabajos fallarán con 401 (se reintentan solos 5 minutos después).

**Interruptor de emergencia del correo**: `supabase secrets set OUTBOX_DAILY_CAP=0` hace que
`send-outbox` deje de enviar (los correos quedan en la cola). Vuelve a poner el valor para reanudar.

## 2. Desplegar

Desde la raíz del repo (rama ya fusionada o la que vayas a desplegar):

```bash
supabase functions deploy send-outbox --no-verify-jwt
supabase functions deploy expire-job-postings --no-verify-jwt
supabase functions deploy moderate-job-posting --no-verify-jwt
supabase functions deploy company-review-ai --no-verify-jwt
supabase functions deploy signup --no-verify-jwt
supabase functions deploy sitemap --no-verify-jwt
```

- **Sí** `--no-verify-jwt` en `send-outbox`, `expire-job-postings`, `moderate-job-posting` y
  `company-review-ai` (el cron no envía JWT). `company-review-ai` ANTES se desplegaba con JWT: ahora hay que
  redesplegarla con `--no-verify-jwt` o el barrido recibirá 401 del gateway. No se pierde seguridad: la
  función sigue exigiendo una sesión (admin o miembro de la empresa) para revisar una empresa, y para el
  barrido solo acepta `x-cron-secret`, la clave `service_role` o un admin; sin credenciales contesta 401 antes
  de leer nada. `signup` y `sitemap` son públicas y se despliegan así.
- Si alguna de las tres del cron se desplegó antes con verificación de JWT, vuelve a desplegarla con
  `--no-verify-jwt`: los síntomas de olvidarlo son `status_code = 401` en `net._http_response` mientras el
  trabajo figura como `succeeded` en `cron.job_run_details` (ver sección 5).
- No uses `deploy.sh`: ese script pide `BREVO_API_KEY` y reescribe secretos, y no incluye estas funciones.
- `sitemap` ahora publica las fichas de oferta en su URL canónica `/<cc>/ofertas/<slug>` (español) y
  `/<cc>/jobs/<slug>` (inglés), con el país en minúscula. Solo si una oferta no tiene `country_code`
  sale la alternativa `/empleos/<slug>` y `/jobs/<slug>`. El listado por país `/<cc>/empleos` no cambia.
  El script `scripts/generate-sitemap.mjs` aplica la misma regla.

## 3. Comprobar cada función (antes de programar nada)

Define las variables en tu terminal (no las pegues en un chat) y comprueba sin imprimir las claves:

```bash
export URL="https://djehzlzombqrzzuchcef.supabase.co/functions/v1"
export SRK="<SERVICE_ROLE_KEY>"      # solo en tu terminal
export CRON="<CRON_SECRET>"          # solo en tu terminal

# 1. Sin credenciales debe ser 401, y con un secreto incorrecto también
curl -s -o /dev/null -w "%{http_code}\n" -X POST "$URL/send-outbox"
curl -s -o /dev/null -w "%{http_code}\n" -X POST "$URL/send-outbox" -H "x-cron-secret: incorrecto"

# 2. Con el secreto del cron (lo mismo que mandará pg_cron): estado de la cola sin enviar nada
curl -s -X POST "$URL/send-outbox" -H "x-cron-secret: $CRON" -H "Content-Type: application/json" -d '{"dry_run":true}'
#   -> {"ok":true,"dry_run":true,"cap":250,"sent_today":0,"due_now":N,"pending":N}
#   503 MIGRATION_MISSING = falta aplicar la migración 20261032.
#   401 con el secreto bien puesto = CRON_SECRET no está configurado en la función o es distinto.

# 3. También funcionan la clave service_role y un admin (vías de siempre)
curl -s -X POST "$URL/send-outbox" -H "Authorization: Bearer $SRK" -H "Content-Type: application/json" -d '{"dry_run":true}'

# 4. Envío de prueba: en el SQL editor de Supabase, encola UN correo a tu dirección
#    insert into public.email_outbox (kind, to_email, payload, lang)
#    values ('job_expired', 'tu-correo@ejemplo.com', '{"title":"Prueba de cola","company_name":"Prueba"}', 'es');
curl -s -X POST "$URL/send-outbox" -H "x-cron-secret: $CRON" -H "Content-Type: application/json" -d '{"limit":1}'
#   -> "sent":1 ; select kind, sent_at, attempts, last_error from public.email_outbox order by created_at desc limit 5;

# 5. Alertas: llama antes a queue_job_alerts() y después envía
curl -s -X POST "$URL/send-outbox" -H "x-cron-secret: $CRON" -H "Content-Type: application/json" -d '{"alerts":true,"limit":1}'
#   -> incluye "alerts_queued": N (o "alerts_error": true si la RPC falló; el envío sigue igualmente)

# 6. Moderación y caducidad (sin cuerpo = barrido de todas las pendientes)
curl -s -X POST "$URL/moderate-job-posting" -H "x-cron-secret: $CRON"
curl -s -X POST "$URL/expire-job-postings"  -H "x-cron-secret: $CRON"

# 7. Resumen diario de candidaturas: llama antes a queue_application_digests() y después envía
curl -s -X POST "$URL/send-outbox" -H "x-cron-secret: $CRON" -H "Content-Type: application/json" -d '{"digests":true,"limit":1}'
#   -> incluye "digests_queued": N (o "digests_error": true si la RPC falló; el envío sigue igualmente)

# 8. Barrido de empresas pendientes sin revisar (lo que hará el trabajo bolsa-empresas)
curl -s -X POST "$URL/company-review-ai" -H "x-cron-secret: $CRON" -H "Content-Type: application/json" -d '{"sweep":true}'
#   -> {"success":true,"sweep":true,"candidates":N,"reviewed":N,"approved":N,"flagged":N,"errors":N,"stale_notified":N}
#   Sin credenciales o con un secreto incorrecto debe ser 401; con la sesión de un usuario normal, 403.
```

Qué esperar de `moderate-job-posting`: `{"ok":true,"results":[...]}`. Una oferta limpia pasa de
`AI_REVIEW` a `PUBLISHED`; con hallazgos o ante cualquier error, a `MANUAL_REVIEW` (y avisa a
`support@yourcvpassport.com` por la cola). Si la empresa edita mientras se evalúa, vuelve a evaluar
(hasta 3 evaluaciones) y si el texto sigue cambiando la deja en `MANUAL_REVIEW`.

Qué esperar de `company-review-ai` con `{"sweep":true}`: revisa las empresas `PENDING` sin ninguna revisión
registrada y con más de 2 minutos (máximo 20 por llamada, las más antiguas primero). Una empresa solo se
aprueba sola si TODO cuadra (formato fiscal propio del país, dominio del correo de la empresa = dominio de la
web, correo no gratuito, sin duplicados de NIF/correo/dominio y **el correo confirmado de la cuenta que la
registró pertenece al dominio de la web o a un subdominio**); si no, queda `PENDING`, se guarda la revisión en
`company_ai_reviews` y se avisa a `support@yourcvpassport.com` (en ese aviso interno salen las referencias de
las dos empresas cuando hay un NIF o correo duplicado; nunca en la respuesta ni en los motivos guardados).
Las que siguen `PENDING` sin revisión pasados 30 minutos generan además un aviso (`company_unreviewed:<id>`,
una sola vez).

Qué esperar de `moderate-job-posting` (reglas del cierre final): además de las anteriores marca (nunca rechaza)
salario incoherente (mínimo > máximo, mensual < 100 o > 100.000 en moneda común, importe sin periodo), texto
idéntico al de otra oferta PUBLISHED / AI_REVIEW de OTRA empresa, título de una categoría muy distinta de la
elegida y enlaces sospechosos en el cuerpo (IP numérica, `xn--`, `.zip`, `.top`). Cualquier hallazgo o error va a
`MANUAL_REVIEW`. La interfaz de IA (`ai.ts`) está lista y probada con un proveedor simulado; hoy no hay
proveedor real (decisión pendiente).

Qué esperar de `send-outbox`: respeta `send_after` y la prioridad (3 avisos internos, 4-5 estado y
seguridad, 6 avisos de nueva versión legal, 7 cierres, 8 resumen diario de candidaturas, 9 alertas). Cuando se gasta
el 80 % del tope solo salen los de prioridad < 8. Si Brevo contesta cupo agotado (402/429) para la
ejecución y no gasta intentos. Un aviso masivo de versión legal (`legal_encolar_aviso`, hasta 5000 por
llamada) sale al ritmo del tope diario (por defecto 250 al día, el resto espera al día siguiente).

## 4. Programación (migraciones `20261034_programacion_cron.sql` y `20261035_cierre_final.sql`)

La migración 34 habilita `pg_net` y `pg_cron` (pg_cron no estaba instalado; se activa con
`create extension`), crea `public.bolsa_llamar_funcion(nombre, cuerpo)` y programa los cuatro primeros
trabajos; la migración 35 añade `bolsa-empresas` y `bolsa-resumenes` y hace que la función admita también
`company-review-ai`. La función es `SECURITY DEFINER`, solo admite las funciones de la bolsa, lee el
secreto de `vault.decrypted_secrets` y tiene `EXECUTE` revocado a `anon`, `authenticated` y
`service_role`; el secreto no está en la migración ni en el repo.

| Trabajo (`jobname`) | Cuándo | Qué llama |
| --- | --- | --- |
| `bolsa-moderacion` | cada 5 minutos (`*/5 * * * *`) | `moderate-job-posting`, sin cuerpo (barrido) |
| `bolsa-correos` | cada 5 minutos (`*/5 * * * *`) | `send-outbox`, sin cuerpo |
| `bolsa-caducidad` | cada día 03:10 UTC (`10 3 * * *`) | `expire-job-postings`, sin cuerpo |
| `bolsa-alertas` | cada día 07:00 UTC (`0 7 * * *`) | `send-outbox` con `{"alerts":true}` |
| `bolsa-empresas` (migración 35) | cada 10 minutos (`*/10 * * * *`) | `company-review-ai` con `{"sweep":true}` |
| `bolsa-resumenes` (migración 35) | cada día 08:00 UTC (`0 8 * * *`) | `send-outbox` con `{"digests":true}` |

Es reaplicable: desprograma cada trabajo por su nombre antes de crearlo. La migración 30 puede
haber programado además `expire_job_postings()` directamente si pg_cron YA existía al aplicarla;
no estorba (es idempotente), pero no es necesario.

Fallback sin pg_cron (no recomendado): un cron del servidor web que haga `curl -X POST -H "x-cron-secret: $CRON"`
a las mismas URLs, guardando el secreto en un fichero que solo lea root (nunca en el crontab).

## 5. Cómo comprobar que funciona

**Trabajos programados** (SQL editor de Supabase):

```sql
-- 6 filas: bolsa-alertas, bolsa-caducidad, bolsa-correos, bolsa-empresas, bolsa-moderacion, bolsa-resumenes (active = true)
select jobid, jobname, schedule, command, active from cron.job order by jobname;

-- última ejecución de cada trabajo (status 'succeeded'; si es 'failed', return_message dice por qué:
-- BOLSA_CRON_SECRET_AUSENTE = falta o es corto el secreto del vault)
select j.jobname, d.status, d.return_message, d.start_time
  from cron.job_run_details d join cron.job j using (jobid)
 where j.jobname like 'bolsa-%' order by d.start_time desc limit 12;

-- respuesta HTTP real de las Edge Functions (200 esperado; 401 = CRON_SECRET distinto o sin configurar,
-- o la función sigue desplegada CON verificación de JWT)
select id, status_code, left(content, 120) as respuesta, created
  from net._http_response order by created desc limit 10;

-- el secreto existe en el vault (no se lee su valor)
select name, created_at from vault.secrets where name = 'bolsa_cron_secret';
```

`cron.job_run_details` solo dice que la base lanzó la petición; la respuesta de la función está en
`net._http_response`. Mira siempre las dos. Logs de cada función: Panel > Edge Functions > Logs
(busca `[send-outbox]`, `[moderate-job-posting]`).

**Cola y ofertas** (los días siguientes):

```sql
-- cola: pendientes, enviados hoy (UTC) y fallidos para siempre
select count(*) filter (where sent_at is null and attempts < 5)  as pendientes,
       count(*) filter (where sent_at >= date_trunc('day', now() at time zone 'utc')) as enviados_hoy,
       count(*) filter (where sent_at is null and attempts >= 5)  as agotados
  from public.email_outbox;
select kind, attempts, last_error, send_after from public.email_outbox
 where sent_at is null and last_error is not null order by send_after limit 20;

-- ofertas atascadas en AI_REVIEW (no debería haber ninguna de más de 10 minutos)
select id, title, updated_at from public.job_postings where status = 'AI_REVIEW' order by updated_at limit 20;
```

Un `last_error` que empieza por `QUOTA` es Brevo sin cupo (se reintenta solo, sin gastar intentos);
`CONFIG`, falta clave de Brevo o del relé; `RENDER`, una fila con datos que la plantilla no admite
(queda sin enviar; avisa a quien mantiene el código); `PROVIDER_DOWN`, Brevo o el relé caídos.

## 6. Volver atrás

De menor a mayor:

1. **Pausar el envío sin borrar nada**: `supabase secrets set OUTBOX_DAILY_CAP=0`. Los correos
   siguen en la cola y salen cuando se restaure el valor.
2. **Quitar la programación**:
   ```sql
   select cron.unschedule('bolsa-moderacion'); select cron.unschedule('bolsa-correos');
   select cron.unschedule('bolsa-caducidad');  select cron.unschedule('bolsa-alertas');
   select cron.unschedule('bolsa-empresas');   select cron.unschedule('bolsa-resumenes');
   drop function public.bolsa_llamar_funcion(text, jsonb);
   ```
   Sin cron, las ofertas se quedan en `AI_REVIEW` hasta que un admin pulse «Revisión automática» o
   las resuelva a mano, y la cola no se vacía: es un fallo seguro, nada se publica ni se envía solo.
   (pg_cron y pg_net se dejan instaladas.)
3. **Cerrar la vía del cron sin tocar la base**: `supabase secrets unset CRON_SECRET`. Las cuatro funciones
   (incluida `company-review-ai` para el barrido) dejan de aceptar `x-cron-secret` (siguen aceptando la clave `service_role` y a un admin). El secreto
   del vault, si quieres borrarlo: `delete from vault.secrets where name = 'bolsa_cron_secret';`.
4. **Retirar una función**: `supabase functions delete send-outbox` (o `moderate-job-posting`,
   `expire-job-postings`). Si se borra `company-review-ai`, el registro de empresa sigue
   funcionando (la web ignora el fallo) y las empresas quedan en `PENDING` para revisión manual.
5. **Volver a una versión anterior de `signup` o `company-review-ai`**:
   `git checkout <commit-anterior> -- supabase/functions/signup` y volver a desplegar (con
   `--no-verify-jwt` en `signup`). Ojo: la `company-review-ai` anterior se desplegaba CON verificación de JWT y aprobaba con menos
   condiciones (sin exigir web propia ni patrón fiscal propio del país); es preferible
   borrarla antes que volver a ella.
6. Las migraciones tienen su propia vuelta atrás en su cabecera; las funciones nuevas no
   escriben nada que obligue a deshacerlas (solo `email_outbox`, `job_postings.status` y
   `companies.status`).

## 7. Pruebas del código (Node, sin dependencias salvo esbuild, que ya está en el repo)

Todas se lanzan con `node <fichero>` desde la raíz del repo (Node 22.18+ carga los `.ts` directamente).
Para ejecutarlas todas: `for f in $(find supabase/functions -name "*.test.mjs"); do node $f || exit 1; done`.
Los ficheros `digests.test.mjs` y `sweep.test.mjs` empaquetan el `index.ts` REAL con esbuild y lo ejecutan
contra una base en memoria y un Brevo falso (`supabase/functions/_shared/testHarness.mjs`): no usan red ni claves.

```bash
node supabase/functions/_shared/serviceAuth.test.mjs         # x-cron-secret, service_role y admin
node supabase/functions/_shared/signupConfirmEmail.test.mjs  # correo de confirmación del alta: candidato / empresa, es / en
node supabase/functions/send-outbox/templates.test.mjs       # plantillas es/en (todos los kinds de las migraciones 29-35)
node supabase/functions/send-outbox/queue.test.mjs           # cola, tope diario, reintentos
node supabase/functions/send-outbox/digests.test.mjs         # { digests: true } / { alerts: true } sobre el index.ts real
node supabase/functions/sitemap/jobPaths.test.mjs            # URL canónica de ficha en sitemap y correos
node supabase/functions/moderate-job-posting/rules.test.mjs
node supabase/functions/moderate-job-posting/extras.test.mjs # salario, duplicado, categoría, enlaces
node supabase/functions/moderate-job-posting/ai.test.mjs     # interfaz de IA con proveedor simulado
node supabase/functions/moderate-job-posting/orquestacion.test.mjs
node supabase/functions/company-review-ai/rules.test.mjs
node supabase/functions/company-review-ai/sweep.test.mjs     # barrido { sweep: true }, correo de la cuenta, duplicados
node supabase/functions/signup/validation.test.mjs           # tipo, edad, casillas e idioma del alta
```

Además, `tests/qa/signup-pendiente-edge.spec.ts` ejecuta las funciones `signup` y `send-email-confirmation` completas
con dobles de Deno, Supabase y Brevo (sin red): `QA_PORT=5440 npx playwright test -c tests/qa/playwright.qa.config.ts
tests/qa/signup-pendiente-edge.spec.ts --project=chromium`.
