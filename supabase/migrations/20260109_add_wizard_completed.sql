-- Agregar campo para rastrear si el usuario completó el wizard de perfil
-- Este campo se guarda en la base de datos para que persista entre navegadores y dispositivos
-- CRÍTICO: Este campo SOLO debe marcarse como TRUE cuando el usuario completa
-- el paso de Finalización (selecciona template y slug)

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS wizard_completed BOOLEAN DEFAULT FALSE;

-- Crear índice para mejorar el rendimiento de las consultas
CREATE INDEX IF NOT EXISTS idx_profiles_wizard_completed
ON profiles(wizard_completed);

-- Comentario en la columna
COMMENT ON COLUMN profiles.wizard_completed IS 'Indica si el usuario ha completado el wizard de perfil (incluyendo el paso de Finalización)';

-- Marcar como completado para usuarios EXISTENTES que ya tienen template y slug
-- Esto evita que usuarios actuales tengan que pasar por el wizard nuevamente
UPDATE profiles
SET wizard_completed = TRUE
WHERE template IS NOT NULL
  AND slug IS NOT NULL;
