-- Agregar campo para rastrear si el usuario ha completado su primera sesión
-- Este campo se usa para mostrar onboarding apropiado a usuarios nuevos

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS first_login_completed BOOLEAN DEFAULT FALSE;

-- Crear índice para mejorar el rendimiento de las consultas
CREATE INDEX IF NOT EXISTS idx_profiles_first_login_completed
ON profiles(first_login_completed);

-- Comentario en la columna
COMMENT ON COLUMN profiles.first_login_completed IS 'Indica si el usuario ya ha completado su primera sesión y visto el onboarding inicial';
