-- Enterprise Features System
-- Allows customizable features for Enterprise plan users

-- 1. Create enterprise_features table for defining available features
CREATE TABLE IF NOT EXISTS public.enterprise_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key TEXT UNIQUE NOT NULL,
  name_en TEXT NOT NULL,
  name_es TEXT NOT NULL,
  description_en TEXT,
  description_es TEXT,
  icon TEXT DEFAULT 'star', -- icon name for UI
  category TEXT DEFAULT 'general', -- category: general, support, integration, customization, analytics
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create user_enterprise_features table to assign features to users
CREATE TABLE IF NOT EXISTS public.user_enterprise_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  feature_key TEXT NOT NULL REFERENCES public.enterprise_features(feature_key) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT true,
  custom_value JSONB DEFAULT '{}', -- for features that need custom configuration
  granted_by UUID REFERENCES public.profiles(id), -- admin who granted the feature
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- null means never expires
  notes TEXT, -- admin notes
  UNIQUE(user_id, feature_key)
);

-- 3. Insert default enterprise features
INSERT INTO public.enterprise_features (feature_key, name_en, name_es, description_en, description_es, icon, category, sort_order) VALUES
  -- Support features
  ('priority_support', 'Priority Support', 'Soporte Prioritario', 'Get faster response times and dedicated support channels', 'Obtén tiempos de respuesta más rápidos y canales de soporte dedicados', 'headset', 'support', 10),
  ('dedicated_account_manager', 'Dedicated Account Manager', 'Gerente de Cuenta Dedicado', 'Personal account manager for your needs', 'Gerente de cuenta personal para tus necesidades', 'user-tie', 'support', 20),
  ('24_7_support', '24/7 Support', 'Soporte 24/7', 'Round-the-clock support availability', 'Disponibilidad de soporte las 24 horas', 'clock', 'support', 30),

  -- Integration features
  ('api_access', 'API Access', 'Acceso a API', 'Full access to our REST API for integrations', 'Acceso completo a nuestra API REST para integraciones', 'code', 'integration', 40),
  ('webhook_notifications', 'Webhook Notifications', 'Notificaciones Webhook', 'Real-time notifications via webhooks', 'Notificaciones en tiempo real via webhooks', 'bell', 'integration', 50),
  ('ats_integration', 'ATS Integration', 'Integración ATS', 'Direct integration with popular ATS systems (Workday, Greenhouse, etc.)', 'Integración directa con sistemas ATS populares (Workday, Greenhouse, etc.)', 'link', 'integration', 60),
  ('sso_saml', 'SSO/SAML', 'SSO/SAML', 'Single Sign-On with SAML 2.0 support', 'Inicio de sesión único con soporte SAML 2.0', 'key', 'integration', 70),

  -- Customization features
  ('white_label', 'White Label', 'Marca Blanca', 'Remove YourCVPassport branding completely', 'Elimina completamente el branding de YourCVPassport', 'palette', 'customization', 80),
  ('custom_domain', 'Custom Domain', 'Dominio Personalizado', 'Use your own domain for CV profiles', 'Usa tu propio dominio para perfiles de CV', 'globe', 'customization', 90),
  ('custom_branding', 'Custom Branding', 'Branding Personalizado', 'Custom colors, logo and styling', 'Colores personalizados, logo y estilos', 'brush', 'customization', 100),
  ('custom_email_templates', 'Custom Email Templates', 'Plantillas de Email Personalizadas', 'Customize all email communications', 'Personaliza todas las comunicaciones por email', 'mail', 'customization', 110),

  -- Analytics features
  ('advanced_analytics', 'Advanced Analytics', 'Analytics Avanzados', 'Detailed analytics and insights dashboard', 'Panel de análisis detallado e insights', 'chart-bar', 'analytics', 120),
  ('export_analytics', 'Export Analytics', 'Exportar Analytics', 'Export analytics data to CSV/Excel', 'Exporta datos de analytics a CSV/Excel', 'download', 'analytics', 130),
  ('team_analytics', 'Team Analytics', 'Analytics de Equipo', 'Analytics across your entire team', 'Analytics de todo tu equipo', 'users', 'analytics', 140),

  -- Team features
  ('team_management', 'Team Management', 'Gestión de Equipo', 'Manage multiple users under one account', 'Gestiona múltiples usuarios bajo una cuenta', 'users-cog', 'team', 150),
  ('role_permissions', 'Role & Permissions', 'Roles y Permisos', 'Custom roles and permission settings', 'Roles personalizados y configuración de permisos', 'shield', 'team', 160),
  ('bulk_operations', 'Bulk Operations', 'Operaciones Masivas', 'Perform bulk exports and operations', 'Realiza exportaciones y operaciones masivas', 'layers', 'team', 170),

  -- Premium content
  ('premium_templates', 'Premium Templates', 'Plantillas Premium', 'Access to exclusive premium CV templates', 'Acceso a plantillas de CV premium exclusivas', 'star', 'content', 180),
  ('ai_unlimited', 'Unlimited AI', 'IA Ilimitada', 'Unlimited AI-powered suggestions and optimizations', 'Sugerencias y optimizaciones ilimitadas con IA', 'cpu', 'content', 190),
  ('video_cv', 'Video CV', 'CV en Video', 'Create and embed video CVs', 'Crea e incrusta CVs en video', 'video', 'content', 200)
ON CONFLICT (feature_key) DO NOTHING;

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_enterprise_features_user ON public.user_enterprise_features(user_id);
CREATE INDEX IF NOT EXISTS idx_user_enterprise_features_feature ON public.user_enterprise_features(feature_key);
CREATE INDEX IF NOT EXISTS idx_enterprise_features_category ON public.enterprise_features(category);
CREATE INDEX IF NOT EXISTS idx_enterprise_features_active ON public.enterprise_features(is_active);

-- 5. RLS Policies
ALTER TABLE public.enterprise_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_enterprise_features ENABLE ROW LEVEL SECURITY;

-- Enterprise features are readable by everyone (for pricing page display)
CREATE POLICY "Enterprise features are publicly readable"
  ON public.enterprise_features FOR SELECT
  USING (true);

-- Only admins can modify enterprise features
CREATE POLICY "Admins can manage enterprise features"
  ON public.enterprise_features FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Users can read their own enterprise features
CREATE POLICY "Users can read own enterprise features"
  ON public.user_enterprise_features FOR SELECT
  USING (user_id = auth.uid());

-- Admins can manage all user enterprise features
CREATE POLICY "Admins can manage user enterprise features"
  ON public.user_enterprise_features FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 6. RPC function to check if user has a specific enterprise feature
CREATE OR REPLACE FUNCTION check_enterprise_feature(
  p_user_id UUID,
  p_feature_key TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_profile RECORD;
  v_feature RECORD;
  v_user_feature RECORD;
BEGIN
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

-- 7. RPC function to get all enterprise features for a user
CREATE OR REPLACE FUNCTION get_user_enterprise_features(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_profile RECORD;
  v_result JSONB := '[]'::JSONB;
  v_feature RECORD;
  v_check JSONB;
BEGIN
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

-- 8. RPC function for admins to grant/revoke features
CREATE OR REPLACE FUNCTION admin_set_user_feature(
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
AS $$
DECLARE
  v_admin_id UUID;
  v_is_admin BOOLEAN;
BEGIN
  -- Check if caller is admin
  v_admin_id := auth.uid();
  SELECT (role = 'admin') INTO v_is_admin FROM public.profiles WHERE id = v_admin_id;

  IF NOT v_is_admin THEN
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

-- 9. RPC function for admins to bulk grant features (for plan upgrade)
CREATE OR REPLACE FUNCTION admin_grant_enterprise_plan(
  p_user_id UUID,
  p_notes TEXT DEFAULT 'Upgraded to Enterprise plan'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin_id UUID;
  v_is_admin BOOLEAN;
  v_feature RECORD;
  v_count INTEGER := 0;
BEGIN
  -- Check if caller is admin
  v_admin_id := auth.uid();
  SELECT (role = 'admin') INTO v_is_admin FROM public.profiles WHERE id = v_admin_id;

  IF NOT v_is_admin THEN
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

-- 10. Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_enterprise_features_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_enterprise_features_timestamp
  BEFORE UPDATE ON public.enterprise_features
  FOR EACH ROW
  EXECUTE FUNCTION update_enterprise_features_timestamp();
