-- Tabla para configuración de plantillas
CREATE TABLE IF NOT EXISTS template_configs (
  template_id TEXT PRIMARY KEY,
  is_free BOOLEAN DEFAULT false,
  is_premium BOOLEAN DEFAULT false,
  is_hidden BOOLEAN DEFAULT false,
  preview_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para mejorar consultas
CREATE INDEX IF NOT EXISTS idx_template_configs_free ON template_configs(is_free);
CREATE INDEX IF NOT EXISTS idx_template_configs_premium ON template_configs(is_premium);
CREATE INDEX IF NOT EXISTS idx_template_configs_hidden ON template_configs(is_hidden);

-- RLS: Solo admin puede leer y modificar
ALTER TABLE template_configs ENABLE ROW LEVEL SECURITY;

-- Policy: Admin puede hacer todo
CREATE POLICY "Admin can manage template configs"
  ON template_configs
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Usuarios autenticados pueden leer plantillas visibles
CREATE POLICY "Users can view visible templates"
  ON template_configs
  FOR SELECT
  TO authenticated
  USING (is_hidden = false);

-- Función para obtener plantillas disponibles según el plan del usuario
CREATE OR REPLACE FUNCTION get_available_templates(user_id UUID)
RETURNS TABLE (
  template_id TEXT,
  is_free BOOLEAN,
  is_premium BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    tc.template_id,
    tc.is_free,
    tc.is_premium
  FROM template_configs tc
  LEFT JOIN profiles p ON p.id = user_id
  WHERE tc.is_hidden = false
    AND (
      tc.is_free = true
      OR (tc.is_premium = true AND p.is_premium = true)
      OR p.role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentarios
COMMENT ON TABLE template_configs IS 'Configuración de plantillas: disponibilidad y visibilidad';
COMMENT ON COLUMN template_configs.is_free IS 'Plantilla disponible para usuarios gratuitos';
COMMENT ON COLUMN template_configs.is_premium IS 'Plantilla disponible solo para usuarios premium';
COMMENT ON COLUMN template_configs.is_hidden IS 'Plantilla oculta para todos los usuarios (excepto admin)';
