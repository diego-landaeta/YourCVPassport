-- =============================================================================
-- Pagos con Stripe: clientes, suscripciones, idempotencia del webhook, plan de
-- empresa y abono de créditos pagados
-- =============================================================================
--
-- ORDEN: va DESPUÉS de 20261007_seguridad_empresas.sql (is_company_member,
-- companies_proteger_campos) y de 20261009b_cerrar_columnas_privadas_companies.sql.
-- En producción ya están aplicadas. Es ADITIVA: no cambia nada de lo que usa el
-- frontend actual, así que se puede aplicar antes de desplegar las funciones y el
-- frontend nuevos (ver docs/pagos-stripe.md, «Orden de despliegue»).
-- Reaplicable (IF NOT EXISTS, CREATE OR REPLACE, DROP POLICY IF EXISTS).
--
-- QUÉ HACE
--   1. billing_customers: un cliente de Stripe por titular (owner_type 'profile'
--      = profiles.id / auth.uid(), 'company' = companies.id). UNIQUE
--      (owner_type, owner_id) y UNIQUE stripe_customer_id.
--   2. billing_subscriptions: copia del estado de cada suscripción de Stripe
--      (la escribe SOLO el webhook, con service_role): producto (product_key de
--      supabase/functions/_shared/stripeProducts.ts), price, estado, fin de la
--      prueba, fin del periodo y cancelación programada.
--   3. processed_webhook_events: idempotencia del webhook (PK = event.id de
--      Stripe). El webhook inserta al empezar; si ya existía, descarta el evento.
--   4. companies.plan text NOT NULL DEFAULT 'none', CHECK in ('none', 'starter',
--      'growth', 'enterprise'). Lo fija el webhook (starter / growth) o un admin
--      (enterprise). No hay que tocar la vista companies_full: el frontend lee el
--      plan de la función get-billing-status.
--   5. companies_proteger_campos(): MISMO cuerpo que 20261007 y además protege
--      plan: en un INSERT de anon/authenticated no admin se fuerza 'none' y en un
--      UPDATE cambiarlo da 42501 PROTECTED_FIELD. service_role, admins y las RPC
--      SECURITY DEFINER pasan, como hasta ahora.
--   6. add_company_credits_from_payment(p_company_id, p_amount, p_reference,
--      p_metadata) SECURITY DEFINER, solo service_role: suma créditos pagados
--      (saldo y total_credits_purchased) y registra una fila PURCHASE en
--      company_credits_history con metadata.stripe_reference = p_reference.
--      IDEMPOTENTE por referencia (índice único sobre metadata->>'stripe_reference'):
--      una segunda llamada con la misma referencia no suma nada y devuelve
--      {"applied": false, "reason": "already_processed"}. Referencias que usa el
--      webhook: id de la Checkout Session (packs de créditos) e id de la factura
--      (créditos de cada periodo pagado de Starter / Growth).
--   7. RLS activada en las tres tablas. authenticated solo LEE sus filas
--      (perfil propio, o empresa de la que es miembro vía is_company_member);
--      ningún INSERT / UPDATE / DELETE desde el cliente; anon nada.
--      processed_webhook_events: solo service_role.
--
-- COMPROBACIONES ANTES (la migración aborta con un mensaje claro si falla alguna)
--   select to_regprocedure('public.is_company_member(uuid, text[])');      -- no NULL
--   select to_regprocedure('public.companies_proteger_campos()');          -- no NULL
--   select count(*) from information_schema.columns where table_schema='public'
--      and table_name='companies' and column_name in ('credit_balance','total_credits_purchased'); -- 2
--
-- COMPROBACIONES DESPUÉS
--   select relname, relrowsecurity from pg_class where relname in
--     ('billing_customers','billing_subscriptions','processed_webhook_events');   -- 3 filas, true
--   select count(*) from public.companies where plan <> 'none';                 -- 0
--   select has_function_privilege('authenticated',
--     'public.add_company_credits_from_payment(uuid, integer, text, jsonb)', 'execute');  -- false
--   -- Un usuario normal no puede cambiar el plan de su empresa (42501 PROTECTED_FIELD).
--
-- VUELTA ATRÁS (nada de esto borra datos de usuarios; antes, quitar el webhook
-- en Stripe y borrar las funciones stripe-webhook, create-checkout-session,
-- create-portal-session y get-billing-status)
--   drop function if exists public.add_company_credits_from_payment(uuid, integer, text, jsonb);
--   drop index if exists public.company_credits_history_stripe_reference_key;
--   -- companies_proteger_campos: re-aplicar su definición de 20261007_seguridad_empresas.sql
--   alter table public.companies drop constraint if exists companies_plan_check;
--   alter table public.companies drop column if exists plan;
--   drop table if exists public.processed_webhook_events;
--   drop table if exists public.billing_subscriptions;
--   drop table if exists public.billing_customers;
--   (Las filas PURCHASE ya abonadas en company_credits_history se quedan: son
--    pagos reales. profiles.plan no cambia con esta migración.)
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 0. Comprobación previa
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  v_bad bigint;
BEGIN
  IF to_regprocedure('public.is_company_member(uuid, text[])') IS NULL THEN
    RAISE EXCEPTION 'ABORTADO: falta public.is_company_member(uuid, text[]). Aplicar antes 20261007_seguridad_empresas.sql';
  END IF;
  IF to_regprocedure('public.companies_proteger_campos()') IS NULL THEN
    RAISE EXCEPTION 'ABORTADO: falta public.companies_proteger_campos(). Aplicar antes 20261007_seguridad_empresas.sql';
  END IF;
  IF (SELECT count(*) FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'companies'
         AND column_name IN ('credit_balance', 'total_credits_purchased')) <> 2 THEN
    RAISE EXCEPTION 'ABORTADO: companies no tiene credit_balance / total_credits_purchased';
  END IF;
  -- Si ya hubiera una columna plan (creada a mano), sus valores tienen que caber en el CHECK.
  IF EXISTS (SELECT 1 FROM information_schema.columns
              WHERE table_schema = 'public' AND table_name = 'companies' AND column_name = 'plan') THEN
    EXECUTE $q$SELECT count(*) FROM public.companies
               WHERE plan IS NULL OR plan::text NOT IN ('none', 'starter', 'growth', 'enterprise')$q$ INTO v_bad;
    IF v_bad > 0 THEN
      RAISE EXCEPTION 'ABORTADO: companies.plan ya existe con % valores fuera de none/starter/growth/enterprise', v_bad;
    END IF;
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 1. billing_customers
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.billing_customers (
  owner_type          text        NOT NULL CHECK (owner_type IN ('profile', 'company')),
  owner_id            uuid        NOT NULL,
  stripe_customer_id  text        NOT NULL UNIQUE CHECK (stripe_customer_id ~ '^cus_[A-Za-z0-9]+$'),
  created_at          timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (owner_type, owner_id)
);

COMMENT ON TABLE public.billing_customers IS
'Cliente de Stripe de cada titular de pagos (perfil o empresa). La escriben las Edge Functions con service_role; el titular solo lee su fila.';

-- -----------------------------------------------------------------------------
-- 2. billing_subscriptions
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.billing_subscriptions (
  stripe_subscription_id  text        PRIMARY KEY CHECK (stripe_subscription_id ~ '^sub_[A-Za-z0-9]+$'),
  owner_type              text        NOT NULL CHECK (owner_type IN ('profile', 'company')),
  owner_id                uuid        NOT NULL,
  stripe_customer_id      text,
  product_key             text,
  price_id                text,
  status                  text        NOT NULL,
  trial_end               timestamptz,
  current_period_end      timestamptz,
  cancel_at_period_end    boolean     NOT NULL DEFAULT false,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS billing_subscriptions_owner_idx
  ON public.billing_subscriptions (owner_type, owner_id);

COMMENT ON TABLE public.billing_subscriptions IS
'Estado de las suscripciones de Stripe (lo escribe stripe-webhook con service_role). product_key = clave de _shared/stripeProducts.ts. El titular solo lee sus filas.';

-- -----------------------------------------------------------------------------
-- 3. processed_webhook_events
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.processed_webhook_events (
  event_id      text        PRIMARY KEY,
  type          text        NOT NULL,
  processed_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.processed_webhook_events IS
'Idempotencia de stripe-webhook: event_id = event.id de Stripe. Insert al empezar; 23505 = ya procesado. Si el proceso falla se borra la fila para que Stripe reintente.';

-- -----------------------------------------------------------------------------
-- 4. companies.plan
-- -----------------------------------------------------------------------------
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'none';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint
                  WHERE conrelid = 'public.companies'::regclass AND conname = 'companies_plan_check') THEN
    ALTER TABLE public.companies
      ADD CONSTRAINT companies_plan_check CHECK (plan IN ('none', 'starter', 'growth', 'enterprise'));
  END IF;
END $$;

COMMENT ON COLUMN public.companies.plan IS
'Plan de pago de la empresa: none | starter | growth (los fija stripe-webhook) | enterprise (a medida, lo fija un admin). Protegido por trg_companies_proteger_campos.';

-- -----------------------------------------------------------------------------
-- 5. companies_proteger_campos(): cuerpo de 20261007 + plan
-- -----------------------------------------------------------------------------
-- SECURITY INVOKER a propósito (igual que en 20261007): current_user es
-- 'authenticated'/'anon' en una escritura directa por PostgREST y el propietario
-- dentro de una RPC SECURITY DEFINER (que ya valida a quien llama).
CREATE OR REPLACE FUNCTION public.companies_proteger_campos()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF current_user NOT IN ('anon', 'authenticated') THEN
    RETURN NEW;
  END IF;
  IF current_user = 'authenticated' AND public.current_user_is_admin() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.status := 'PENDING';
    NEW.credit_balance := 0;
    NEW.total_credits_purchased := 0;
    NEW.total_credits_used := 0;
    NEW.verified_at := NULL;
    NEW.verified_by := NULL;
    NEW.rejection_reason := NULL;
    NEW.admin_notes := NULL;
    NEW.created_by := auth.uid();
    NEW.plan := 'none';
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status
     OR NEW.verified_at IS DISTINCT FROM OLD.verified_at
     OR NEW.verified_by IS DISTINCT FROM OLD.verified_by
     OR NEW.rejection_reason IS DISTINCT FROM OLD.rejection_reason
     OR NEW.admin_notes IS DISTINCT FROM OLD.admin_notes THEN
    RAISE EXCEPTION 'PROTECTED_FIELD: el estado y la verificación de la empresa solo los cambia un admin'
      USING ERRCODE = '42501';
  END IF;
  IF NEW.credit_balance IS DISTINCT FROM OLD.credit_balance
     OR NEW.total_credits_purchased IS DISTINCT FROM OLD.total_credits_purchased
     OR NEW.total_credits_used IS DISTINCT FROM OLD.total_credits_used THEN
    RAISE EXCEPTION 'PROTECTED_FIELD: los créditos solo cambian por compra verificada, consumo o ajuste de un admin'
      USING ERRCODE = '42501';
  END IF;
  IF NEW.created_by IS DISTINCT FROM OLD.created_by THEN
    RAISE EXCEPTION 'PROTECTED_FIELD: created_by no se puede cambiar' USING ERRCODE = '42501';
  END IF;
  IF NEW.plan IS DISTINCT FROM OLD.plan THEN
    RAISE EXCEPTION 'PROTECTED_FIELD: el plan de la empresa solo lo cambia el sistema de pagos o un admin'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.companies_proteger_campos() FROM PUBLIC, anon, authenticated;

-- El trigger ya existe (20261007); se recrea por si se aplica sobre una base sin él.
DROP TRIGGER IF EXISTS trg_companies_proteger_campos ON public.companies;
CREATE TRIGGER trg_companies_proteger_campos
  BEFORE INSERT OR UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.companies_proteger_campos();

-- -----------------------------------------------------------------------------
-- 6. add_company_credits_from_payment
-- -----------------------------------------------------------------------------
-- Índice único: la misma referencia de Stripe no se puede abonar dos veces ni con
-- dos webhooks a la vez (el segundo choca con 23505 y la RPC lo trata como ya hecho).
CREATE UNIQUE INDEX IF NOT EXISTS company_credits_history_stripe_reference_key
  ON public.company_credits_history ((metadata->>'stripe_reference'))
  WHERE (metadata->>'stripe_reference') IS NOT NULL;

CREATE OR REPLACE FUNCTION public.add_company_credits_from_payment(
  p_company_id uuid,
  p_amount     integer,
  p_reference  text,
  p_metadata   jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance integer;
  v_meta    jsonb := COALESCE(p_metadata, '{}'::jsonb);
  v_desc    text;
BEGIN
  IF p_company_id IS NULL OR p_amount IS NULL OR p_amount <= 0 OR p_amount > 1000000 THEN
    RAISE EXCEPTION 'INVALID_INPUT: empresa y cantidad positiva obligatorias' USING ERRCODE = '22023';
  END IF;
  IF p_reference IS NULL OR btrim(p_reference) = '' OR length(p_reference) > 255 THEN
    RAISE EXCEPTION 'INVALID_INPUT: falta la referencia del pago' USING ERRCODE = '22023';
  END IF;
  IF jsonb_typeof(v_meta) <> 'object' THEN
    v_meta := '{}'::jsonb;
  END IF;

  -- Bloquea la fila: dos abonos simultáneos de la misma empresa se ejecutan en serie.
  PERFORM 1 FROM public.companies WHERE id = p_company_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'COMPANY_NOT_FOUND' USING ERRCODE = 'P0002';
  END IF;

  IF EXISTS (SELECT 1 FROM public.company_credits_history h
              WHERE h.metadata->>'stripe_reference' = p_reference) THEN
    RETURN jsonb_build_object(
      'applied', false,
      'reason', 'already_processed',
      'balance', (SELECT c.credit_balance FROM public.companies c WHERE c.id = p_company_id)
    );
  END IF;

  -- notify_credit_purchase (si existe en la base) hace (metadata->>'price')::numeric:
  -- un valor no numérico abortaría el abono. Se descarta.
  IF v_meta ? 'price' AND (v_meta->>'price') !~ '^[0-9]+(\.[0-9]+)?$' THEN
    v_meta := v_meta - 'price';
  END IF;
  v_desc := left(COALESCE(NULLIF(btrim(v_meta->>'description'), ''), 'Compra de créditos'), 500);
  v_meta := (v_meta - 'description') || jsonb_build_object('stripe_reference', p_reference, 'source', 'stripe');

  UPDATE public.companies
     SET credit_balance = credit_balance + p_amount,
         total_credits_purchased = COALESCE(total_credits_purchased, 0) + p_amount,
         updated_at = now()
   WHERE id = p_company_id
  RETURNING credit_balance INTO v_balance;

  INSERT INTO public.company_credits_history (
    company_id, amount, balance_after, transaction_type, description, metadata
  ) VALUES (
    p_company_id, p_amount, v_balance, 'PURCHASE', v_desc, v_meta
  );

  RETURN jsonb_build_object('applied', true, 'balance', v_balance, 'amount', p_amount);
EXCEPTION
  WHEN unique_violation THEN
    -- Otro webhook abonó la misma referencia a la vez: se deshace este intento.
    RETURN jsonb_build_object('applied', false, 'reason', 'already_processed');
END;
$$;

REVOKE ALL ON FUNCTION public.add_company_credits_from_payment(uuid, integer, text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.add_company_credits_from_payment(uuid, integer, text, jsonb) TO service_role;

COMMENT ON FUNCTION public.add_company_credits_from_payment(uuid, integer, text, jsonb) IS
'Solo service_role (stripe-webhook). Abona créditos pagados a una empresa y registra PURCHASE en company_credits_history. Idempotente por p_reference (metadata.stripe_reference).';

-- -----------------------------------------------------------------------------
-- 7. RLS y privilegios
-- -----------------------------------------------------------------------------
ALTER TABLE public.billing_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processed_webhook_events ENABLE ROW LEVEL SECURITY;

-- En Supabase todo lo nuevo de public se concede a anon y authenticated por defecto.
REVOKE ALL ON public.billing_customers, public.billing_subscriptions, public.processed_webhook_events
  FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.billing_customers, public.billing_subscriptions TO authenticated;
GRANT ALL ON public.billing_customers, public.billing_subscriptions, public.processed_webhook_events TO service_role;

DROP POLICY IF EXISTS "Titular lee su cliente de pago" ON public.billing_customers;
CREATE POLICY "Titular lee su cliente de pago"
  ON public.billing_customers FOR SELECT
  TO authenticated
  USING (
    (owner_type = 'profile' AND owner_id = auth.uid())
    OR (owner_type = 'company' AND public.is_company_member(owner_id))
  );

DROP POLICY IF EXISTS "Titular lee sus suscripciones" ON public.billing_subscriptions;
CREATE POLICY "Titular lee sus suscripciones"
  ON public.billing_subscriptions FOR SELECT
  TO authenticated
  USING (
    (owner_type = 'profile' AND owner_id = auth.uid())
    OR (owner_type = 'company' AND public.is_company_member(owner_id))
  );

-- processed_webhook_events: sin políticas para anon/authenticated (solo service_role,
-- que tiene BYPASSRLS).

COMMIT;
