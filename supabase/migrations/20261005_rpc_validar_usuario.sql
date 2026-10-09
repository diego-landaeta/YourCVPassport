-- =============================================================================
-- RPC SECURITY DEFINER que reciben un id de usuario: validar contra auth.uid()
-- =============================================================================
--
-- PROBLEMA (seguridad)
--   Varias funciones SECURITY DEFINER reciben p_user_id (o user_id) y lo usan
--   tal cual, sin comprobar que es el usuario que llama. Como SECURITY DEFINER
--   ignora RLS y Supabase concede EXECUTE por defecto a anon y authenticated en
--   el esquema public, cualquiera con la anon key (sin sesión) podía:
--     - check_feature_limit / get_usage_stats / get_monthly_usage: leer el plan
--       y el consumo de cualquier usuario.
--     - record_usage: gastar la cuota mensual de OTRO usuario (insertar filas
--       en usage_tracking a su nombre hasta bloquearle la IA o las exportaciones).
--     - log_user_activity: falsear el registro de logins de cualquier usuario.
--     - check_enterprise_feature / get_user_enterprise_features: leer plan y
--       funcionalidades concedidas a cualquier usuario.
--     - get_user_unread_messages_count, get_available_templates,
--       can_request_stamp: filtrar datos de otros usuarios (menor gravedad).
--   Y además, GRAVE:
--     - admin_set_user_feature / admin_grant_enterprise_plan comprobaban
--       `IF NOT v_is_admin`. Si quien llama no tiene fila en profiles (anon:
--       auth.uid() = NULL) o su role es NULL, v_is_admin es NULL, `NOT NULL` es
--       NULL y el IF no entra: la comprobación se salta. Cualquiera podía
--       ponerse plan 'enterprise' o concederse funcionalidades.
--
-- QUÉ HACE
--   1. Crea public.assert_caller_matches_user(p_user_id, p_allow_admin,
--      p_allow_manager): helper interno que, según el rol del JWT:
--        - service_role ............ deja pasar (Edge Functions con service key).
--        - authenticated ........... exige p_user_id = auth.uid() (o admin /
--                                    gestor del perfil si la función lo permite).
--        - anon .................... RAISE.
--        - sin JWT (conexión directa a Postgres: SQL editor, cron) ... deja pasar.
--      Error: SQLSTATE 42501 (insufficient_privilege, PostgREST -> 403) con
--      mensaje 'USER_MISMATCH: ...' / 'ANON_NOT_ALLOWED: ...'.
--   2. Recrea (MISMA firma, MISMO cuerpo y MISMO resultado para el caso legítimo)
--      las funciones de arriba añadiendo la llamada al helper al principio y
--      SET search_path = public.
--   3. admin_set_user_feature / admin_grant_enterprise_plan: la comprobación de
--      admin pasa a COALESCE(v_is_admin, false). service_role y conexiones
--      directas siguen pudiendo usarlas (nada en el repo lo hace, pero un
--      webhook externo podría).
--   4. REVOKE EXECUTE ... FROM PUBLIC, anon; GRANT a authenticated y service_role.
--
--   Quién las llama hoy (todas con el id del propio usuario -> siguen funcionando):
--     - supabase/functions/ai-cv-assistant: check_feature_limit y record_usage
--       con el JWT del usuario y user.id (auth.uid() = user.id).
--     - hooks/useUsageLimits.ts: get_usage_stats, check_feature_limit,
--       record_usage con user.id de la sesión.
--     - lib/ai.ts checkAIAccess(session.user.id): check_feature_limit.
--     - components/ats-export/ATSPDFPreview.tsx: record_usage con
--       profile.profile.id, que en el dashboard es el perfil propio
--       (profiles.id = auth.users.id).
--     - contexts/AuthContext.tsx: log_user_activity(data.user.id) tras el login.
--     - hooks/useEnterpriseFeatures.ts: get_user_enterprise_features /
--       check_enterprise_feature con user.id; el panel de admin llama a
--       get_user_enterprise_features con el id de OTRO usuario -> por eso esas
--       dos funciones admiten admin.
--     - can_request_stamp, get_user_unread_messages_count,
--       get_available_templates: sin llamadas en el repo.
--
--   NO se tocan (revisadas): delete_user_by_id (ya exige admin y su comprobación
--   no tiene el fallo del NULL), has_verified_stamp (solo dice si un perfil tiene
--   un sello VERIFIED, dato que ya es público en el perfil), is_group_member
--   (se usa dentro de políticas RLS con otros usuarios), is_managed_profile (ya
--   usa auth.uid()).
--
-- ORDEN DE DESPLIEGUE
--   Independiente del resto. Se puede aplicar en cualquier momento: el frontend
--   y ai-cv-assistant ya pasan el id del usuario autenticado. Si alguna llamada
--   no prevista pasara otro id, ahora recibirá un error 42501 en vez de datos.
--
-- CÓMO REVERTIR (NO recomendado: reabre los agujeros)
--   Volver a ejecutar las definiciones originales:
--     20260116_create_usage_tracking.sql (get_monthly_usage, record_usage,
--       get_usage_stats) + 20260126_improve_check_feature_limit.sql,
--     20260105_create_user_activity_tracking.sql (log_user_activity),
--     20260116_enterprise_features.sql (check_enterprise_feature,
--       get_user_enterprise_features, admin_set_user_feature,
--       admin_grant_enterprise_plan),
--     20260226_create_messages_and_contact_prefs.sql
--       (get_user_unread_messages_count),
--     20260116_create_template_configs.sql (get_available_templates),
--     20260107_update_rate_limit_remove_phone.sql (can_request_stamp),
--   y GRANT EXECUTE ... TO anon en cada una. Después:
--     DROP FUNCTION public.assert_caller_matches_user(uuid, boolean, boolean);
--
-- Idempotente (CREATE OR REPLACE, REVOKE/GRANT repetibles).
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. Helper
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.assert_caller_matches_user(
    p_user_id UUID,
    p_allow_admin BOOLEAN DEFAULT false,
    p_allow_manager BOOLEAN DEFAULT false
)
RETURNS VOID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_role TEXT := auth.role();
    v_uid  UUID := auth.uid();
BEGIN
    -- Edge Functions con service key
    IF v_role = 'service_role' THEN
        RETURN;
    END IF;

    -- Visitante sin sesión
    IF v_role = 'anon' THEN
        RAISE EXCEPTION 'ANON_NOT_ALLOWED: esta función requiere un usuario autenticado'
            USING ERRCODE = '42501';
    END IF;

    IF v_role = 'authenticated' THEN
        IF v_uid IS NOT NULL AND p_user_id IS NOT DISTINCT FROM v_uid THEN
            RETURN;
        END IF;

        IF p_allow_admin AND v_uid IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = v_uid AND role = 'admin'
        ) THEN
            RETURN;
        END IF;

        IF p_allow_manager AND v_uid IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = p_user_id AND managed_by = v_uid
        ) THEN
            RETURN;
        END IF;

        RAISE EXCEPTION 'USER_MISMATCH: p_user_id no corresponde al usuario autenticado'
            USING ERRCODE = '42501';
    END IF;

    -- Sin JWT (conexión directa: SQL editor, cron, migraciones): contexto de confianza
    RETURN;
END;
$$;

-- Solo se usa desde otras funciones SECURITY DEFINER (que se ejecutan como su
-- propietario), así que nadie más necesita EXECUTE.
REVOKE ALL ON FUNCTION public.assert_caller_matches_user(UUID, BOOLEAN, BOOLEAN) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.assert_caller_matches_user(UUID, BOOLEAN, BOOLEAN) TO service_role;

COMMENT ON FUNCTION public.assert_caller_matches_user(UUID, BOOLEAN, BOOLEAN) IS
'Interna. Lanza 42501 si el JWT es anon, o authenticated con p_user_id distinto de auth.uid() (salvo admin/gestor si se permite). service_role y conexiones directas pasan.';

-- -----------------------------------------------------------------------------
-- 2. Uso y límites del plan
-- -----------------------------------------------------------------------------

-- get_monthly_usage (cuerpo de 20260116_create_usage_tracking.sql)
CREATE OR REPLACE FUNCTION public.get_monthly_usage(
    p_user_id UUID,
    p_feature_type TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    usage_count INTEGER;
BEGIN
    PERFORM public.assert_caller_matches_user(p_user_id);

    SELECT COUNT(*)::INTEGER INTO usage_count
    FROM public.usage_tracking
    WHERE user_id = p_user_id
      AND feature_type = p_feature_type
      AND created_at >= date_trunc('month', NOW())
      AND created_at < date_trunc('month', NOW()) + INTERVAL '1 month';

    RETURN COALESCE(usage_count, 0);
END;
$$;

-- check_feature_limit (cuerpo vigente: 20260126_improve_check_feature_limit.sql)
CREATE OR REPLACE FUNCTION public.check_feature_limit(
    p_user_id UUID,
    p_feature_type TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_plan TEXT;
    v_limit INTEGER;
    v_current_usage INTEGER;
    v_can_use BOOLEAN;
    v_can_use_ai BOOLEAN;
BEGIN
    PERFORM public.assert_caller_matches_user(p_user_id);

    -- Get user's plan
    SELECT COALESCE(plan, 'free') INTO v_plan
    FROM public.profiles
    WHERE id = p_user_id;

    -- Get plan limits
    SELECT
        CASE p_feature_type
            WHEN 'ats_export' THEN ats_exports_per_month
            WHEN 'ai_request' THEN ai_requests_per_month
            WHEN 'stamp_request' THEN stamps_per_month
            ELSE 0
        END,
        can_use_ai
    INTO v_limit, v_can_use_ai
    FROM public.plan_limits
    WHERE plan_name = v_plan;

    -- Special check for AI - must have can_use_ai = true
    -- This check MUST come BEFORE the unlimited check
    IF p_feature_type = 'ai_request' AND NOT v_can_use_ai THEN
        RETURN jsonb_build_object(
            'allowed', false,
            'plan', v_plan,
            'limit', 0,
            'used', 0,
            'remaining', 0,
            'reason', 'AI features are not available on your plan'
        );
    END IF;

    -- If limit is -1, feature is explicitly not available (different from 0 = unlimited)
    IF v_limit = -1 THEN
        RETURN jsonb_build_object(
            'allowed', false,
            'plan', v_plan,
            'limit', 0,
            'used', 0,
            'remaining', 0,
            'reason', 'Feature not available on your plan'
        );
    END IF;

    -- If limit is 0, it's unlimited
    IF v_limit = 0 THEN
        RETURN jsonb_build_object(
            'allowed', true,
            'plan', v_plan,
            'limit', 'unlimited',
            'used', get_monthly_usage(p_user_id, p_feature_type),
            'remaining', 'unlimited'
        );
    END IF;

    -- Get current usage
    v_current_usage := get_monthly_usage(p_user_id, p_feature_type);

    -- Check if under limit
    v_can_use := v_current_usage < v_limit;

    RETURN jsonb_build_object(
        'allowed', v_can_use,
        'plan', v_plan,
        'limit', v_limit,
        'used', v_current_usage,
        'remaining', GREATEST(0, v_limit - v_current_usage),
        'reason', CASE WHEN NOT v_can_use THEN 'Monthly limit reached' ELSE NULL END
    );
END;
$$;

-- record_usage (cuerpo de 20260116_create_usage_tracking.sql)
CREATE OR REPLACE FUNCTION public.record_usage(
    p_user_id UUID,
    p_feature_type TEXT,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_check_result JSONB;
BEGIN
    PERFORM public.assert_caller_matches_user(p_user_id);

    -- First check if allowed
    v_check_result := check_feature_limit(p_user_id, p_feature_type);

    -- If not allowed, return error
    IF NOT (v_check_result->>'allowed')::boolean THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', COALESCE(v_check_result->>'reason', 'Usage limit exceeded'),
            'details', v_check_result
        );
    END IF;

    -- Record the usage
    INSERT INTO public.usage_tracking (user_id, feature_type, metadata)
    VALUES (p_user_id, p_feature_type, p_metadata);

    -- Return updated status
    RETURN jsonb_build_object(
        'success', true,
        'details', check_feature_limit(p_user_id, p_feature_type)
    );
END;
$$;

-- get_usage_stats (cuerpo de 20260116_create_usage_tracking.sql)
CREATE OR REPLACE FUNCTION public.get_usage_stats(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_plan TEXT;
    v_limits RECORD;
BEGIN
    PERFORM public.assert_caller_matches_user(p_user_id);

    -- Get user's plan
    SELECT COALESCE(plan, 'free') INTO v_plan
    FROM public.profiles
    WHERE id = p_user_id;

    -- Get plan limits
    SELECT * INTO v_limits
    FROM public.plan_limits
    WHERE plan_name = v_plan;

    RETURN jsonb_build_object(
        'plan', v_plan,
        'ats_export', check_feature_limit(p_user_id, 'ats_export'),
        'ai_request', check_feature_limit(p_user_id, 'ai_request'),
        'stamp_request', check_feature_limit(p_user_id, 'stamp_request'),
        'features', jsonb_build_object(
            'can_use_ai', v_limits.can_use_ai,
            'can_use_premium_templates', v_limits.can_use_premium_templates,
            'can_remove_branding', v_limits.can_remove_branding
        ),
        'period_start', date_trunc('month', NOW()),
        'period_end', date_trunc('month', NOW()) + INTERVAL '1 month'
    );
END;
$$;

-- -----------------------------------------------------------------------------
-- 3. Registro de actividad (cuerpo de 20260105_create_user_activity_tracking.sql)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.log_user_activity(
    p_user_id UUID,
    p_activity_type VARCHAR(50),
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_log_id UUID;
BEGIN
    PERFORM public.assert_caller_matches_user(p_user_id);

    INSERT INTO public.user_activity_logs (
        user_id,
        activity_type,
        metadata
    ) VALUES (
        p_user_id,
        p_activity_type,
        p_metadata
    )
    RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$;

-- -----------------------------------------------------------------------------
-- 4. Funcionalidades enterprise (cuerpos de 20260116_enterprise_features.sql)
-- -----------------------------------------------------------------------------

-- check_enterprise_feature: el propio usuario o un admin
CREATE OR REPLACE FUNCTION public.check_enterprise_feature(
  p_user_id UUID,
  p_feature_key TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile RECORD;
  v_feature RECORD;
  v_user_feature RECORD;
BEGIN
  PERFORM public.assert_caller_matches_user(p_user_id, true);

  -- Get user's plan
  SELECT plan INTO v_profile FROM public.profiles WHERE id = p_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('has_feature', false, 'reason', 'User not found');
  END IF;

  -- Pro users get some basic enterprise features
  IF v_profile.plan = 'pro' THEN
    -- Pro gets: premium_templates, ai_unlimited, advanced_analytics
    IF p_feature_key IN ('premium_templates', 'ai_unlimited', 'advanced_analytics') THEN
      RETURN jsonb_build_object(
        'has_feature', true,
        'plan', v_profile.plan,
        'source', 'plan_default'
      );
    END IF;
  END IF;

  -- Enterprise users get ALL features by default
  IF v_profile.plan = 'enterprise' THEN
    -- Check if feature exists
    SELECT * INTO v_feature FROM public.enterprise_features
    WHERE feature_key = p_feature_key AND is_active = true;

    IF FOUND THEN
      -- Check if there's a specific assignment that might override (e.g., disabled)
      SELECT * INTO v_user_feature FROM public.user_enterprise_features
      WHERE user_id = p_user_id AND feature_key = p_feature_key;

      IF FOUND THEN
        -- Check expiration
        IF v_user_feature.expires_at IS NOT NULL AND v_user_feature.expires_at < NOW() THEN
          RETURN jsonb_build_object(
            'has_feature', false,
            'reason', 'Feature expired',
            'expired_at', v_user_feature.expires_at
          );
        END IF;

        RETURN jsonb_build_object(
          'has_feature', v_user_feature.enabled,
          'plan', v_profile.plan,
          'source', 'custom_assignment',
          'custom_value', v_user_feature.custom_value
        );
      END IF;

      -- No specific assignment, enterprise gets it by default
      RETURN jsonb_build_object(
        'has_feature', true,
        'plan', v_profile.plan,
        'source', 'enterprise_default'
      );
    END IF;
  END IF;

  -- Check for specific feature assignment (for non-enterprise users who got a feature granted)
  SELECT * INTO v_user_feature FROM public.user_enterprise_features
  WHERE user_id = p_user_id AND feature_key = p_feature_key AND enabled = true;

  IF FOUND THEN
    -- Check expiration
    IF v_user_feature.expires_at IS NOT NULL AND v_user_feature.expires_at < NOW() THEN
      RETURN jsonb_build_object(
        'has_feature', false,
        'reason', 'Feature expired',
        'expired_at', v_user_feature.expires_at
      );
    END IF;

    RETURN jsonb_build_object(
      'has_feature', true,
      'plan', v_profile.plan,
      'source', 'custom_grant',
      'custom_value', v_user_feature.custom_value
    );
  END IF;

  -- User doesn't have the feature
  RETURN jsonb_build_object(
    'has_feature', false,
    'plan', v_profile.plan,
    'reason', 'Feature not included in plan'
  );
END;
$$;

-- get_user_enterprise_features: el propio usuario o un admin (panel de admin)
CREATE OR REPLACE FUNCTION public.get_user_enterprise_features(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile RECORD;
  v_result JSONB := '[]'::JSONB;
  v_feature RECORD;
  v_check JSONB;
BEGIN
  PERFORM public.assert_caller_matches_user(p_user_id, true);

  -- Get user's plan
  SELECT plan INTO v_profile FROM public.profiles WHERE id = p_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'User not found');
  END IF;

  -- Loop through all active features and check each one
  FOR v_feature IN
    SELECT * FROM public.enterprise_features
    WHERE is_active = true
    ORDER BY sort_order
  LOOP
    v_check := check_enterprise_feature(p_user_id, v_feature.feature_key);

    v_result := v_result || jsonb_build_object(
      'feature_key', v_feature.feature_key,
      'name_en', v_feature.name_en,
      'name_es', v_feature.name_es,
      'description_en', v_feature.description_en,
      'description_es', v_feature.description_es,
      'icon', v_feature.icon,
      'category', v_feature.category,
      'has_feature', (v_check->>'has_feature')::boolean,
      'source', v_check->>'source',
      'custom_value', v_check->'custom_value'
    );
  END LOOP;

  RETURN jsonb_build_object(
    'plan', v_profile.plan,
    'features', v_result
  );
END;
$$;

-- admin_set_user_feature: arreglo del NULL en la comprobación de admin
CREATE OR REPLACE FUNCTION public.admin_set_user_feature(
  p_user_id UUID,
  p_feature_key TEXT,
  p_enabled BOOLEAN DEFAULT true,
  p_custom_value JSONB DEFAULT '{}',
  p_expires_at TIMESTAMPTZ DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID;
  v_is_admin BOOLEAN;
BEGIN
  -- Check if caller is admin.
  -- Antes: IF NOT v_is_admin -> con v_is_admin NULL (anon, o role NULL) no
  -- entraba y dejaba pasar. service_role / conexión directa: confianza.
  v_admin_id := auth.uid();
  SELECT (role = 'admin') INTO v_is_admin FROM public.profiles WHERE id = v_admin_id;

  IF COALESCE(auth.role(), '') IN ('anon', 'authenticated') AND NOT COALESCE(v_is_admin, false) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only admins can manage user features');
  END IF;

  -- Check if feature exists
  IF NOT EXISTS (SELECT 1 FROM public.enterprise_features WHERE feature_key = p_feature_key) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Feature not found');
  END IF;

  -- Check if user exists
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;

  -- Upsert the feature assignment
  INSERT INTO public.user_enterprise_features (
    user_id, feature_key, enabled, custom_value, granted_by, granted_at, expires_at, notes
  ) VALUES (
    p_user_id, p_feature_key, p_enabled, p_custom_value, v_admin_id, NOW(), p_expires_at, p_notes
  )
  ON CONFLICT (user_id, feature_key) DO UPDATE SET
    enabled = EXCLUDED.enabled,
    custom_value = EXCLUDED.custom_value,
    granted_by = EXCLUDED.granted_by,
    granted_at = NOW(),
    expires_at = EXCLUDED.expires_at,
    notes = EXCLUDED.notes;

  RETURN jsonb_build_object(
    'success', true,
    'user_id', p_user_id,
    'feature_key', p_feature_key,
    'enabled', p_enabled
  );
END;
$$;

-- admin_grant_enterprise_plan: mismo arreglo
CREATE OR REPLACE FUNCTION public.admin_grant_enterprise_plan(
  p_user_id UUID,
  p_notes TEXT DEFAULT 'Upgraded to Enterprise plan'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID;
  v_is_admin BOOLEAN;
  v_feature RECORD;
  v_count INTEGER := 0;
BEGIN
  -- Check if caller is admin (ver nota en admin_set_user_feature)
  v_admin_id := auth.uid();
  SELECT (role = 'admin') INTO v_is_admin FROM public.profiles WHERE id = v_admin_id;

  IF COALESCE(auth.role(), '') IN ('anon', 'authenticated') AND NOT COALESCE(v_is_admin, false) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only admins can manage user features');
  END IF;

  -- Update user's plan to enterprise
  UPDATE public.profiles SET plan = 'enterprise', updated_at = NOW() WHERE id = p_user_id;

  -- Grant all active enterprise features
  FOR v_feature IN SELECT feature_key FROM public.enterprise_features WHERE is_active = true
  LOOP
    INSERT INTO public.user_enterprise_features (
      user_id, feature_key, enabled, granted_by, granted_at, notes
    ) VALUES (
      p_user_id, v_feature.feature_key, true, v_admin_id, NOW(), p_notes
    )
    ON CONFLICT (user_id, feature_key) DO UPDATE SET
      enabled = true,
      granted_by = v_admin_id,
      granted_at = NOW(),
      notes = p_notes;

    v_count := v_count + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'user_id', p_user_id,
    'features_granted', v_count
  );
END;
$$;

-- -----------------------------------------------------------------------------
-- 5. Otras con id de usuario (sin llamadas en el repo; se cierran igual)
-- -----------------------------------------------------------------------------

-- get_user_unread_messages_count (20260226_create_messages_and_contact_prefs.sql)
-- Pasa de LANGUAGE sql a plpgsql para poder validar; mismo resultado.
CREATE OR REPLACE FUNCTION public.get_user_unread_messages_count(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  PERFORM public.assert_caller_matches_user(p_user_id);

  SELECT COALESCE(COUNT(*)::INTEGER, 0) INTO v_count
  FROM messages m
  JOIN leads l ON l.id = m.lead_id
  WHERE l.recipient_id = p_user_id
    AND m.sender_id != p_user_id
    AND m.is_read = false;

  RETURN v_count;
END;
$$;

-- get_available_templates (20260116_create_template_configs.sql). El nombre del
-- parámetro (user_id) no puede cambiar con CREATE OR REPLACE.
CREATE OR REPLACE FUNCTION public.get_available_templates(user_id UUID)
RETURNS TABLE (
  template_id TEXT,
  is_free BOOLEAN,
  is_premium BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.assert_caller_matches_user(get_available_templates.user_id, true);

  RETURN QUERY
  SELECT
    tc.template_id,
    tc.is_free,
    tc.is_premium
  FROM template_configs tc
  LEFT JOIN profiles p ON p.id = get_available_templates.user_id
  WHERE tc.is_hidden = false
    AND (
      tc.is_free = true
      OR (tc.is_premium = true AND p.is_premium = true)
      OR p.role = 'admin'
    );
END;
$$;

-- can_request_stamp (vigente: 20260107_update_rate_limit_remove_phone.sql).
-- p_profile_id = id del usuario; se admite también al gestor del perfil
-- (gestiona los sellos de sus perfiles gestionados) y al admin.
CREATE OR REPLACE FUNCTION public.can_request_stamp(
  p_profile_id uuid,
  p_stamp_type text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  last_request_date timestamp with time zone;
  days_since_last_request interval;
  total_attempts integer;
  max_external_attempts constant integer := 4;
BEGIN
  PERFORM public.assert_caller_matches_user(p_profile_id, true, true);

  -- For external provider verifications (EMAIL only), check total attempts limit
  IF p_stamp_type IN ('EMAIL') THEN
    SELECT COUNT(*) INTO total_attempts
    FROM public.stamps
    WHERE profile_id = p_profile_id
      AND type = p_stamp_type;

    -- If user has reached maximum attempts, deny request
    IF total_attempts >= max_external_attempts THEN
      RETURN false;
    END IF;
  END IF;

  -- Get the most recent stamp request of this type for this user
  SELECT created_at INTO last_request_date
  FROM public.stamps
  WHERE profile_id = p_profile_id
    AND type = p_stamp_type
  ORDER BY created_at DESC
  LIMIT 1;

  -- If no previous request exists, allow the request
  IF last_request_date IS NULL THEN
    RETURN true;
  END IF;

  -- Calculate time since last request
  days_since_last_request := now() - last_request_date;

  -- Allow request if more than 3 days have passed
  RETURN days_since_last_request >= interval '3 days';
END;
$$;

-- -----------------------------------------------------------------------------
-- 6. Permisos: fuera anon/PUBLIC; authenticated y service_role sí
-- -----------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.get_monthly_usage(UUID, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.check_feature_limit(UUID, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.record_usage(UUID, TEXT, JSONB) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_usage_stats(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.log_user_activity(UUID, VARCHAR, JSONB) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.check_enterprise_feature(UUID, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_user_enterprise_features(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_set_user_feature(UUID, TEXT, BOOLEAN, JSONB, TIMESTAMPTZ, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_grant_enterprise_plan(UUID, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_user_unread_messages_count(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_available_templates(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.can_request_stamp(UUID, TEXT) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.get_monthly_usage(UUID, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.check_feature_limit(UUID, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.record_usage(UUID, TEXT, JSONB) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_usage_stats(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.log_user_activity(UUID, VARCHAR, JSONB) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.check_enterprise_feature(UUID, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_enterprise_features(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_set_user_feature(UUID, TEXT, BOOLEAN, JSONB, TIMESTAMPTZ, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_grant_enterprise_plan(UUID, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_unread_messages_count(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_available_templates(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_request_stamp(UUID, TEXT) TO authenticated, service_role;

COMMIT;
