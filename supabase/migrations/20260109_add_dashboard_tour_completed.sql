-- Agregar campo para rastrear si el usuario completó el tour del dashboard
-- Este campo se guarda en la base de datos para que persista entre navegadores y dispositivos

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS dashboard_tour_completed BOOLEAN DEFAULT FALSE;

-- Crear índice para mejorar el rendimiento de las consultas
CREATE INDEX IF NOT EXISTS idx_profiles_dashboard_tour_completed
ON profiles(dashboard_tour_completed);

-- Comentario en la columna
COMMENT ON COLUMN profiles.dashboard_tour_completed IS 'Indica si el usuario ha completado o saltado el tour del dashboard';
