# Pagos con Stripe

Cómo están montados los pagos de YourCVPassport, qué hay que crear en Stripe y en
Supabase, en qué orden se despliega, cómo se prueba de punta a punta y cómo se vuelve
atrás. Ninguna clave va en el repo, en el chat ni en variables `VITE_*`.

## 1. Qué se vende

| Clave (`product`) | Qué es | Precio | Cobro | Da | Secreto con el price ID |
|---|---|---|---|---|---|
| `pro_monthly` | Plan Profesional | 15,00 € | mensual | `profiles.plan = 'pro'`, prueba de 14 días | `STRIPE_PRICE_PRO_MONTHLY` |
| `pro_annual` | Plan Profesional | 144,00 € | anual | `profiles.plan = 'pro'`, prueba de 14 días | `STRIPE_PRICE_PRO_ANNUAL` |
| `starter_monthly` | Plan Starter (empresas) | 99,00 € | mensual | `companies.plan = 'starter'` y 100 créditos por factura pagada | `STRIPE_PRICE_STARTER_MONTHLY` |
| `starter_annual` | Plan Starter (empresas) | 950,40 € | anual | `companies.plan = 'starter'` y 1200 créditos por factura anual pagada | `STRIPE_PRICE_STARTER_ANNUAL` |
| `growth_monthly` | Plan Growth (empresas) | 249,00 € | mensual | `companies.plan = 'growth'` y 1000 créditos por factura pagada | `STRIPE_PRICE_GROWTH_MONTHLY` |
| `growth_annual` | Plan Growth (empresas) | 2.390,40 € | anual | `companies.plan = 'growth'` y 12 000 créditos por factura anual pagada | `STRIPE_PRICE_GROWTH_ANNUAL` |
| `credits_50` | Pack de 50 créditos | 49,00 € | pago único | 50 créditos | `STRIPE_PRICE_CREDITS_50` |
| `credits_150` | Pack de 150 créditos | 129,00 € | pago único | 150 créditos | `STRIPE_PRICE_CREDITS_150` |
| `credits_300` | Pack de 300 créditos | 239,00 € | pago único | 300 créditos | `STRIPE_PRICE_CREDITS_300` |
| `credits_1000` | Pack de 1000 créditos | 699,00 € | pago único | 1000 créditos | `STRIPE_PRICE_CREDITS_1000` |

- El anual es el mensual × 12 × 0,8 (lo que dice la web: «ahorra 20 %»). Las tarjetas de
  empresa enseñan ahora el importe exacto (950,40 €), no el redondeado.
- Enterprise sigue siendo «Contactar con ventas»: `companies.plan = 'enterprise'` lo pone un
  admin a mano y los pagos nunca lo tocan (tampoco un `profiles.plan = 'enterprise'`).
- La fuente única del catálogo es `supabase/functions/_shared/stripeProducts.ts`. Si cambia
  un precio: ese fichero, el price en Stripe, su secreto y esta tabla.

### Reglas

- **Prueba del plan Profesional**: 14 días **sin tarjeta**. Si al acabar no hay tarjeta,
  Stripe cancela la suscripción y el perfil vuelve a `free`. Tres días antes llega
  `customer.subscription.trial_will_end` y se manda un correo (español o inglés según
  `profiles.registro_idioma`) con el enlace `/precios?billing=manage` (`/pricing?...` en
  inglés), que abre el portal de Stripe para añadir la tarjeta (si no hay sesión, pide
  entrar y vuelve ahí).
- **Una prueba por perfil**: si el perfil ha tenido alguna suscripción (en la base o en
  Stripe, en cualquier estado) se cobra desde el primer día. El botón pasa entonces a
  «Contratar el plan Profesional».
- **Una suscripción viva por titular**: con una suscripción `active`, `trialing` o
  `past_due` no se abre otro Checkout (409 `already_subscribed`); la web abre el portal.
  Los packs de créditos se pueden comprar siempre.
- **Quién paga**: el plan Profesional, el usuario de la sesión para sí mismo. Los planes y
  packs de empresa, solo un `OWNER` o `ADMIN` de la empresa (`company_users`), con la
  empresa `APPROVED` o `PENDING`.
- **Créditos de los planes de empresa**: se abonan en cada factura pagada de alta
  (`subscription_create`) y de renovación (`subscription_cycle`). El anual abona los 12
  meses de golpe en cada factura anual. Un cambio de plan a mitad de periodo (factura
  `subscription_update`, con prorrateo) **no** abona: el plan nuevo da sus créditos en la
  siguiente renovación. Los créditos no caducan ni se retiran al cancelar.
- **Plan del perfil**: con una suscripción Pro viva, `pro`; sin ninguna, vuelve a `free`
  solo si estaba en `pro` (un admin que haya dado `pro` a mano a alguien sin suscripción
  no se ve afectado mientras esa persona no pague y cancele). `past_due` mantiene el plan
  mientras Stripe reintenta el cobro.
- **Idempotencia**: cada evento se procesa una vez (`processed_webhook_events`) y cada abono
  de créditos una vez por referencia (id de la sesión o de la factura).

### Piezas

| Pieza | Qué hace |
|---|---|
| `supabase/migrations/20261104_pagos_stripe.sql` | Tablas `billing_customers`, `billing_subscriptions`, `processed_webhook_events` (RLS: cada titular lee lo suyo, nadie escribe desde el cliente), `companies.plan` protegido y la RPC `add_company_credits_from_payment` (solo `service_role`, idempotente) |
| `create-checkout-session` | Abre Checkout para una clave del catálogo; comprueba en Stripe que el price del secreto tiene el importe, la moneda y el intervalo del catálogo |
| `stripe-webhook` | Verifica la firma, sincroniza suscripciones y planes, abona créditos y manda el correo de fin de prueba |
| `create-portal-session` | Abre el portal de cliente de Stripe (perfil u `OWNER`/`ADMIN` de la empresa) |
| `get-billing-status` | Plan, suscripción y qué productos están configurados (solo booleanos) |
| `lib/billingApi.ts`, `hooks/useBilling.ts` | Llamadas desde la web, avisos y vuelta de Stripe (`?checkout=ok\|cancel`) |
| Web | `/precios`, sección de precios de la portada, `/empresas/planes`, `/company/credits` y el aviso de suscripción del panel («Uso del plan») |

### Sin configurar (estado durmiente)

Todo se puede desplegar antes de crear nada en Stripe. Sin `STRIPE_SECRET_KEY` o sin el
secreto del price de un producto, `create-checkout-session` responde 503
`billing_not_configured` y la web enseña «Los pagos estarán disponibles muy pronto». Sin
sesión, los botones de pago siguen llevando al alta, como antes. El webhook responde 503 sin
`STRIPE_SECRET_KEY` o `STRIPE_WEBHOOK_SECRET`. Un price que no coincide con el catálogo
(secreto pegado mal) también responde 503 y deja el motivo en el log de la función.

## 2. Qué crear en Stripe

Primero en **modo prueba** (sección 6) y, cuando todo funcione, lo mismo en **modo real**.

### Productos y precios (moneda EUR)

| Producto en Stripe | Precio | Tipo | Intervalo | Secreto |
|---|---|---|---|---|
| YourCVPassport · Plan Profesional | 15,00 EUR | Recurrente | Mensual | `STRIPE_PRICE_PRO_MONTHLY` |
| YourCVPassport · Plan Profesional | 144,00 EUR | Recurrente | Anual | `STRIPE_PRICE_PRO_ANNUAL` |
| YourCVPassport · Plan Starter (empresas) | 99,00 EUR | Recurrente | Mensual | `STRIPE_PRICE_STARTER_MONTHLY` |
| YourCVPassport · Plan Starter (empresas) | 950,40 EUR | Recurrente | Anual | `STRIPE_PRICE_STARTER_ANNUAL` |
| YourCVPassport · Plan Growth (empresas) | 249,00 EUR | Recurrente | Mensual | `STRIPE_PRICE_GROWTH_MONTHLY` |
| YourCVPassport · Plan Growth (empresas) | 2.390,40 EUR | Recurrente | Anual | `STRIPE_PRICE_GROWTH_ANNUAL` |
| YourCVPassport · 50 créditos | 49,00 EUR | Pago único | — | `STRIPE_PRICE_CREDITS_50` |
| YourCVPassport · 150 créditos | 129,00 EUR | Pago único | — | `STRIPE_PRICE_CREDITS_150` |
| YourCVPassport · 300 créditos | 239,00 EUR | Pago único | — | `STRIPE_PRICE_CREDITS_300` |
| YourCVPassport · 1000 créditos | 699,00 EUR | Pago único | — | `STRIPE_PRICE_CREDITS_1000` |

- Los recurrentes, «cada 1 mes» / «cada 1 año» (no «cada 3 meses»): la función lo comprueba.
- Sin prueba gratuita en el price: la prueba la pone la función solo cuando toca.
- Copiar el **ID del price** (empieza por `price_`), no el del producto.
- **IVA (pendiente de decidir con contabilidad)**: el código no activa Stripe Tax. Si los
  importes de la web son con IVA incluido, crear los prices con «incluye impuestos»; si no,
  hay que decidirlo antes de vender (la función solo compara el importe del price).

### Webhook

Developers → Webhooks → Add endpoint:

- URL: `https://djehzlzombqrzzuchcef.supabase.co/functions/v1/stripe-webhook`
- Versión de la API: si se puede elegir, `2024-06-20` (la que usan las funciones); la
  función lee también el formato de las versiones de 2025.
- Eventos (exactamente estos):
  - `checkout.session.completed`
  - `checkout.session.async_payment_succeeded`
  - `checkout.session.async_payment_failed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `customer.subscription.paused`
  - `customer.subscription.resumed`
  - `customer.subscription.trial_will_end`
  - `invoice.paid`
  - `invoice.payment_failed`
- Copiar el **signing secret** del endpoint → secreto `STRIPE_WEBHOOK_SECRET`.

### Portal de cliente

Settings → Billing → Customer portal → activar, y:

- Métodos de pago: **permitir actualizar** (es como se añade la tarjeta al final de la prueba).
- Facturas: mostrar el historial.
- Cancelaciones: permitir, **al final del periodo**.
- Cambio de plan: **desactivado**. La configuración del portal es la misma para todos los
  clientes y dejaría que un perfil cambiara su Pro por un plan de empresa (pagaría sin
  recibir nada) o al revés. Los cambios Starter ↔ Growth o mensual ↔ anual los hace soporte
  desde el Dashboard (Subscriptions → Update subscription): el webhook actualiza el plan.
- Enlaces de política de privacidad y términos: `https://yourcvpassport.com/privacidad` y
  `https://yourcvpassport.com/terminos`.

### Correos de Stripe

Settings → Emails: activar los recibos de pago y los avisos de pago fallido de Stripe. El
correo de fin de prueba lo manda YourCVPassport (Brevo); el «trial ending» de Stripe puede
quedarse desactivado para no duplicar.

## 3. Secretos de Supabase

Project Settings → Edge Functions → Secrets (o `supabase secrets set --env-file <fichero>`,
como hace `supabase/functions/deploy.sh`; nunca con el valor en la línea de comandos).

| Secreto | Qué es |
|---|---|
| `STRIPE_SECRET_KEY` | Clave secreta de Stripe (Developers → API keys → Secret key, o una restricted key con permisos de escritura en Customers, Checkout Sessions, Customer portal y lectura de Prices y Subscriptions) |
| `STRIPE_WEBHOOK_SECRET` | Signing secret del endpoint del webhook |
| `STRIPE_PRICE_PRO_MONTHLY`, `STRIPE_PRICE_PRO_ANNUAL` | Price IDs del plan Profesional |
| `STRIPE_PRICE_STARTER_MONTHLY`, `STRIPE_PRICE_STARTER_ANNUAL` | Price IDs de Starter |
| `STRIPE_PRICE_GROWTH_MONTHLY`, `STRIPE_PRICE_GROWTH_ANNUAL` | Price IDs de Growth |
| `STRIPE_PRICE_CREDITS_50`, `STRIPE_PRICE_CREDITS_150`, `STRIPE_PRICE_CREDITS_300`, `STRIPE_PRICE_CREDITS_1000` | Price IDs de los packs |

Ya existentes que se usan: `BREVO_API_KEY` (correo de fin de prueba), `UPSTASH_REDIS_REST_*`
(rate limit: 10 intentos de pago cada 10 minutos por usuario; sin ellos no se limita) y
`APP_URL` (opcional, origen de los enlaces de los correos).

Se puede activar producto a producto: un producto sin su secreto sigue «muy pronto» y los
demás funcionan.

## 4. Orden de despliegue

1. **Migración** `20261104_pagos_stripe.sql` en el SQL editor (aditiva; ver su cabecera:
   comprobaciones antes y después y vuelta atrás).
2. **Secretos** (sección 3). Se pueden dejar para el final: sin ellos todo queda durmiente.
3. **Funciones**:
   ```bash
   supabase functions deploy create-checkout-session
   supabase functions deploy create-portal-session
   supabase functions deploy get-billing-status
   supabase functions deploy stripe-webhook --no-verify-jwt
   ```
   `stripe-webhook` va con `--no-verify-jwt` porque Stripe no manda JWT; la única barrera es
   la firma, que la función comprueba siempre. Las otras tres exigen sesión en el gateway y
   además sacan la identidad del JWT dentro.
4. **Frontend** (`npm run build`, subir `dist/`). Si se sube antes que las funciones, los
   botones de pago enseñan «muy pronto» y el panel no cambia.
5. **Stripe**: productos, webhook y portal (sección 2) y, al final, los secretos.

## 5. Comprobaciones tras desplegar

```sql
-- Tablas y RLS
select relname, relrowsecurity from pg_class
 where relname in ('billing_customers','billing_subscriptions','processed_webhook_events');
-- La RPC no la puede ejecutar un usuario
select has_function_privilege('authenticated',
  'public.add_company_credits_from_payment(uuid, integer, text, jsonb)', 'execute');   -- false
-- Últimos eventos procesados y suscripciones
select event_id, type, processed_at from public.processed_webhook_events order by processed_at desc limit 20;
select owner_type, owner_id, product_key, status, trial_end, current_period_end, cancel_at_period_end
  from public.billing_subscriptions order by updated_at desc limit 20;
-- Abonos de créditos pagados
select company_id, amount, balance_after, description, metadata->>'stripe_reference' ref, created_at
  from public.company_credits_history where metadata->>'source' = 'stripe' order by created_at desc limit 20;
```

En Stripe → Webhooks → el endpoint: las entregas deben salir en 200. Un 400 es firma mala
(secreto de otro endpoint o de otro modo); un 503, secretos sin poner; un 500, mirar el log
de la función (Supabase → Edge Functions → stripe-webhook → Logs): el evento se libera y
Stripe lo reintenta solo.

## 6. Probar de punta a punta (modo prueba)

**No probar con claves de prueba en el proyecto de producción con la web abierta**: mientras
estén puestas, cualquiera podría «pagar» con una tarjeta de prueba y obtener el plan. Opciones:

- Recomendada: Supabase local (`supabase start`, migraciones aplicadas,
  `supabase functions serve --env-file supabase/functions/.env`) con las claves de prueba en
  ese `.env` (ignorado por git) y la Stripe CLI reenviando los eventos:
  `stripe listen --forward-to http://127.0.0.1:54321/functions/v1/stripe-webhook`
  (el signing secret que imprime va en `STRIPE_WEBHOOK_SECRET` del `.env`).
- Si hay que probar en producción: en una ventana corta y anunciada, y después cambiar los
  secretos a los de modo real y revisar `billing_subscriptions` por si quedó alguna de prueba.

Casos:

1. **Plan Profesional con prueba sin tarjeta**: con una cuenta nueva, `/precios` → «Inicia
   prueba gratuita de 14 días». Checkout no pide tarjeta. Al volver: aviso «¡Listo!…», el
   perfil pasa a `pro` y el panel enseña «Prueba gratuita del plan Profesional · Te quedan
   14 días». En la base: `billing_subscriptions.status = 'trialing'`.
2. **Pago con tarjeta**: un pack de créditos en `/company/credits` (como `OWNER`) con la
   tarjeta `4242 4242 4242 4242`, cualquier fecha futura y cualquier CVC. El saldo sube en
   unos segundos y aparece una fila «Pack de … créditos (Stripe)» en el historial.
   Tarjeta que pide 3D Secure: `4000 0025 0000 3155`. Tarjeta rechazada: `4000 0000 0000 0002`.
3. **Plan de empresa**: `/empresas/planes` → Starter mensual → al volver, `companies.plan =
   'starter'` y +100 créditos. Un `MEMBER` o `VIEWER` recibe «Solo el propietario o un
   administrador…».
4. **Una sola suscripción**: con la del caso 1 viva, el botón dice «Gestionar suscripción» y
   abre el portal; no se puede abrir un segundo Checkout.
5. **Fin de prueba (`trial_will_end`) y cancelación sin tarjeta**, con un *test clock*:
   - Stripe Dashboard (modo prueba) → Billing → Test clocks → crear uno (hora actual) y
     dentro un cliente con el correo de una cuenta de prueba.
   - Asociarlo al perfil (en la base de PRUEBAS):
     `insert into billing_customers(owner_type, owner_id, stripe_customer_id) values ('profile', '<uuid del perfil>', '<id del cliente>');`
   - Hacer el caso 1 con esa cuenta (Checkout reutiliza ese cliente).
   - Avanzar el reloj 11 días: llega `customer.subscription.trial_will_end` y el correo
     «Tu prueba del plan Profesional termina pronto» con el botón «Añadir mi tarjeta».
   - Avanzar hasta pasar el día 14 sin tarjeta: la suscripción pasa a `canceled` y el perfil
     a `free`. Repetir añadiendo la tarjeta desde el enlace del correo: se cobra y sigue `pro`.
   - `stripe trigger customer.subscription.trial_will_end` NO sirve: crea un cliente sin
     titular y el webhook lo ignora (queda en el log como «sin titular conocido»).
6. **Renovación con créditos**: con un test clock y Starter mensual, avanzar un mes: llega
   `invoice.paid` con `subscription_cycle` y se abonan otros 100 créditos.
7. **Idempotencia**: en Stripe → Webhooks → un evento ya entregado → «Resend». Responde 200
   `duplicate` y no suma créditos.
8. **Durmiente**: quitar `STRIPE_SECRET_KEY` → cualquier botón de pago enseña «Los pagos
   estarán disponibles muy pronto».

Pruebas automáticas (sin red ni claves): `npm run test:functions` (catálogo, Checkout,
portal, estado y webhook con dobles de Stripe y de Supabase), `node supabase/tests/fase7.test.mjs`
(la migración sobre PGlite con el estado real de producción) y
`npx playwright test -c tests/qa/playwright.qa.config.ts tests/qa/pagos.local.spec.ts --project=chromium`
(la web con Supabase y Stripe simulados).

## 7. Volver atrás

- **Parar los cobros nuevos** (inmediato, sin desplegar nada): borrar o vaciar
  `STRIPE_SECRET_KEY` en Supabase. La web vuelve a «muy pronto»; el webhook responde 503 y
  Stripe reintenta durante 3 días (volver a poner la clave y los eventos se procesan).
- **Desactivar el webhook** en Stripe (Developers → Webhooks → Disable).
- Las suscripciones vivas siguen cobrándose en Stripe hasta que se cancelen allí (Dashboard →
  Subscriptions → Cancel). Con el webhook activo, la cancelación baja el plan sola.
- **Frontend**: volver a subir el `dist/` anterior (los botones vuelven a llevar al alta).
- **Funciones**: `supabase functions delete stripe-webhook` (y las otras tres) si se quiere
  quitar todo.
- **Base**: la sección «VUELTA ATRÁS» de `20261104_pagos_stripe.sql`. Los créditos ya abonados
  se quedan (son pagos reales).
