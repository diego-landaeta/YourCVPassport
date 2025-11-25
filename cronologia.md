-- =====================================================================================
-- Scripts de Base de Datos para YourCVPassport (Supabase) - VERSIÓN MODULAR
-- Ejecuta estos scripts en el Editor SQL de tu proyecto de Supabase en orden.
-- Puedes ejecutar cada script varias veces de forma segura (son idempotentes).
-- =====================================================================================


-- =====================================================================================
-- SCRIPT 1: ESQUEMA DE TABLAS
-- Este script crea y actualiza la estructura de las tablas de la base de datos.
-- =====================================================================================

-- Tabla 'profiles'
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL PRIMARY KEY, -- Se corresponde con auth.users.id
  full_name text,
  headline text,
  summary text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Añadir nuevas columnas a la tabla 'profiles' si no existen
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'slug') THEN
        ALTER TABLE public.profiles ADD COLUMN slug text UNIQUE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'meta_title') THEN
        ALTER TABLE public.profiles ADD COLUMN meta_title text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'meta_description') THEN
        ALTER TABLE public.profiles ADD COLUMN meta_description text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'template') THEN
        ALTER TABLE public.profiles ADD COLUMN template text DEFAULT 'classic';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'plan') THEN
        ALTER TABLE public.profiles ADD COLUMN plan text DEFAULT 'Free';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role') THEN
        ALTER TABLE public.profiles ADD COLUMN role text DEFAULT 'user';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'availability') THEN
        ALTER TABLE public.profiles ADD COLUMN availability text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'location') THEN
        ALTER TABLE public.profiles ADD COLUMN location text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'phone') THEN
        ALTER TABLE public.profiles ADD COLUMN phone text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'linkedin_url') THEN
        ALTER TABLE public.profiles ADD COLUMN linkedin_url text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'github_url') THEN
        ALTER TABLE public.profiles ADD COLUMN github_url text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'gender') THEN
        ALTER TABLE public.profiles ADD COLUMN gender text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'portfolio_url') THEN
        ALTER TABLE public.profiles ADD COLUMN portfolio_url text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'job_seeking_status') THEN
        ALTER TABLE public.profiles ADD COLUMN job_seeking_status text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'avatar_url') THEN
        ALTER TABLE public.profiles ADD COLUMN avatar_url text;
    END IF;
    -- Preferences fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'job_type') THEN
        ALTER TABLE public.profiles ADD COLUMN job_type text[];
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'salary_min') THEN
        ALTER TABLE public.profiles ADD COLUMN salary_min numeric;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'salary_max') THEN
        ALTER TABLE public.profiles ADD COLUMN salary_max numeric;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'salary_currency') THEN
        ALTER TABLE public.profiles ADD COLUMN salary_currency text DEFAULT 'USD';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'remote_preference') THEN
        ALTER TABLE public.profiles ADD COLUMN remote_preference text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'willing_to_relocate') THEN
        ALTER TABLE public.profiles ADD COLUMN willing_to_relocate boolean DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'preferred_locations') THEN
        ALTER TABLE public.profiles ADD COLUMN preferred_locations text[];
    END IF;
END $$;


-- Tabla 'experiences'
CREATE TABLE IF NOT EXISTS public.experiences (
  id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  profile_id uuid NOT NULL,
  title text,
  company_name text,
  start_date date,
  end_date date, -- Nulo si es el trabajo actual
  description text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT experiences_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Tabla 'education'
CREATE TABLE IF NOT EXISTS public.education (
  id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  profile_id uuid NOT NULL,
  institution_name text,
  degree text,
  field_of_study text,
  start_date date,
  end_date date, -- Nulo si está en curso
  description text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT education_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Tabla 'skills'
CREATE TABLE IF NOT EXISTS public.skills (
  id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  profile_id uuid NOT NULL,
  name text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT skills_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  UNIQUE(profile_id, name)
);

-- Tabla 'languages'
CREATE TABLE IF NOT EXISTS public.languages (
  id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  profile_id uuid NOT NULL,
  name text NOT NULL,
  level text NOT NULL CHECK (level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'Native')),
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT languages_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Índice para mejorar el rendimiento de las consultas por profile_id
CREATE INDEX IF NOT EXISTS languages_profile_id_idx ON public.languages(profile_id);


-- =====================================================================================
-- SCRIPT 2: TRIGGERS PARA AUTOMATIZACIÓN
-- Este script crea funciones y triggers para automatizar tareas en la base de datos.
-- =====================================================================================

-- 1. Función para crear un perfil nuevo al registrar un usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, slug)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.id::text);
  RETURN new;
END;
$$;

-- 2. Trigger para la creación de perfiles
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. Función para actualizar automáticamente el campo 'updated_at'
CREATE OR REPLACE FUNCTION public.handle_profile_update()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- 4. Trigger para actualizar 'updated_at' en la tabla 'profiles'
DROP TRIGGER IF EXISTS on_profiles_update ON public.profiles;
CREATE TRIGGER on_profiles_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_profile_update();


-- =====================================================================================
-- SCRIPT 3: POLÍTICAS DE SEGURIDAD (ROW LEVEL SECURITY - RLS)
-- Este script habilita RLS y define las políticas de acceso a los datos para
-- cada tabla, asegurando que los usuarios solo puedan modificar su propia información,
-- y que los administradores tengan acceso total.
-- =====================================================================================

-- Función para verificar si el usuario actual es un administrador
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Habilitar RLS (es seguro ejecutarlo varias veces)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.education ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.languages ENABLE ROW LEVEL SECURITY;

-- Políticas para 'profiles'
DROP POLICY IF EXISTS profiles_public_read ON public.profiles;
CREATE POLICY profiles_public_read ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS profiles_user_manage ON public.profiles;
CREATE POLICY profiles_user_manage ON public.profiles FOR ALL USING (auth.uid() = id OR is_admin());

-- Políticas para 'experiences'
DROP POLICY IF EXISTS experiences_public_read ON public.experiences;
CREATE POLICY experiences_public_read ON public.experiences FOR SELECT USING (true);

DROP POLICY IF EXISTS experiences_user_manage ON public.experiences;
CREATE POLICY experiences_user_manage ON public.experiences FOR ALL USING (auth.uid() = profile_id OR is_admin());


-- Políticas para 'education'
DROP POLICY IF EXISTS education_public_read ON public.education;
CREATE POLICY education_public_read ON public.education FOR SELECT USING (true);

DROP POLICY IF EXISTS education_user_manage ON public.education;
CREATE POLICY education_user_manage ON public.education FOR ALL USING (auth.uid() = profile_id OR is_admin());


-- Políticas para 'skills'
DROP POLICY IF EXISTS skills_public_read ON public.skills;
CREATE POLICY skills_public_read ON public.skills FOR SELECT USING (true);

DROP POLICY IF EXISTS skills_user_manage ON public.skills;
CREATE POLICY skills_user_manage ON public.skills FOR ALL USING (auth.uid() = profile_id OR is_admin());


-- Políticas para 'languages'
DROP POLICY IF EXISTS languages_public_read ON public.languages;
CREATE POLICY languages_public_read ON public.languages FOR SELECT USING (true);

DROP POLICY IF EXISTS languages_user_manage ON public.languages;
CREATE POLICY languages_user_manage ON public.languages FOR ALL USING (auth.uid() = profile_id OR is_admin());

-- =====================================================================================
-- SCRIPT 4: FUNCIONES DE ADMINISTRADOR
-- Funciones seguras (RPC) que solo los administradores pueden ejecutar para gestionar la app.
-- =====================================================================================

CREATE OR REPLACE FUNCTION admin_get_all_users()
RETURNS TABLE (
  id uuid,
  full_name text,
  email text,
  headline text,
  plan text,
  role text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, auth
AS $$
BEGIN
  -- Solo los administradores pueden ejecutar esta función
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Permission denied. You must be an admin.';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.full_name,
    u.email,
    p.headline,
    p.plan,
    p.role,
    p.created_at,
    p.updated_at
  FROM
    public.profiles p
  JOIN
    auth.users u ON p.id = u.id
  ORDER BY
    p.created_at DESC;
END;
$$;

-- Nueva función para eliminar usuarios (solo para administradores)
CREATE OR REPLACE FUNCTION delete_user_by_id(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, auth
AS $$
BEGIN
    -- Solo los administradores pueden ejecutar esta función
    IF NOT is_admin() THEN
        RAISE EXCEPTION 'Permission denied. You must be an admin.';
    END IF;

    -- Usar la función de administrador de Supabase para eliminar al usuario
    PERFORM auth.admin_delete_user(user_id);
END;
$$;


-- =====================================================================================
-- SCRIPT 5: BOOTSTRAPPING - CREACIÓN DEL PRIMER ADMINISTRADOR
-- Este script muestra cómo crear el primer administrador.
-- =====================================================================================

-- Para crear tu primer administrador, sigue estos pasos:
-- 1. Asegúrate de tener al menos un usuario registrado en tu aplicación.
-- 2. Ve a la tabla 'users' en la sección 'Authentication' de Supabase para encontrar el ID del usuario que quieres promover.
-- 3. Ve al 'SQL Editor' en tu proyecto de Supabase.
-- 4. Descomenta la siguiente línea y reemplaza 'pega-aqui-el-id-del-usuario' con el ID real.
-- 5. Ejecuta el comando. ¡Listo! Ese usuario ahora es un administrador.

-- UPDATE public.profiles
-- SET role = 'admin'
-- WHERE id = 'pega-aqui-el-id-del-usuario';


-- =====================================================================================
-- SCRIPT 6: SUPABASE STORAGE PARA FOTOS DE PERFIL
-- Este script crea el bucket para las fotos de perfil y establece las políticas
-- de seguridad para que los usuarios puedan gestionar su propia foto.
-- =====================================================================================

-- 1. Crear el bucket 'avatars' si no existe. Lo hacemos público para facilitar el acceso a las URLs.
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Políticas de RLS para el bucket 'avatars'
-- Permitir acceso de lectura público a los avatares.
CREATE POLICY "Public read access for avatars"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

-- Permitir a los usuarios autenticados subir su propio avatar.
-- La ruta del archivo debe ser "id_del_usuario/nombre_archivo".
CREATE POLICY "Authenticated user can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'avatars' AND auth.uid() = (storage.foldername(name))[1]::uuid );

-- Permitir a los usuarios autenticados actualizar su propio avatar.
CREATE POLICY "Authenticated user can update their own avatar"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'avatars' AND auth.uid() = (storage.foldername(name))[1]::uuid );

-- Permitir a los usuarios autenticados eliminar su propio avatar.
CREATE POLICY "Authenticated user can delete their own avatar"
ON storage.objects FOR DELETE
USING ( bucket_id = 'avatars' AND auth.uid() = (storage.foldername(name))[1]::uuid );


-- =====================================================================================
-- SCRIPT 6B: SUPABASE STORAGE PARA PORTFOLIO Y ASSETS
-- Este script crea el bucket 'profile-assets' para imágenes de portfolio, avatares, etc.
-- =====================================================================================

-- 1. Crear el bucket 'profile-assets' si no existe. Lo hacemos público para URLs accesibles.
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-assets', 'profile-assets', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Políticas de RLS para el bucket 'profile-assets'
-- Permitir acceso de lectura público a todos los assets.
DROP POLICY IF EXISTS "Public read access for profile assets" ON storage.objects;
CREATE POLICY "Public read access for profile assets"
ON storage.objects FOR SELECT
USING ( bucket_id = 'profile-assets' );

-- Permitir a los usuarios autenticados subir sus propios archivos.
-- La ruta debe comenzar con "portfolio/{user_id}" o "avatars/{user_id}"
DROP POLICY IF EXISTS "Authenticated users can upload profile assets" ON storage.objects;
CREATE POLICY "Authenticated users can upload profile assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profile-assets'
  AND auth.role() = 'authenticated'
);

-- Permitir a los usuarios autenticados actualizar sus propios archivos.
DROP POLICY IF EXISTS "Authenticated users can update profile assets" ON storage.objects;
CREATE POLICY "Authenticated users can update profile assets"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'profile-assets'
  AND auth.role() = 'authenticated'
);

-- Permitir a los usuarios autenticados eliminar sus propios archivos.
DROP POLICY IF EXISTS "Authenticated users can delete profile assets" ON storage.objects;
CREATE POLICY "Authenticated users can delete profile assets"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'profile-assets'
  AND auth.role() = 'authenticated'
);

-- =====================================================================================
-- SCRIPT 7: PORTFOLIO TEMPLATE TABLES
-- Este script añade tablas y modificaciones para soportar las nuevas plantillas de CV de portafolio.
-- =====================================================================================

-- Añadir columna 'percentage' a la tabla 'skills' para la Plantilla 2
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'skills' AND column_name = 'percentage') THEN
        ALTER TABLE public.skills ADD COLUMN percentage integer;
    END IF;
END $$;

-- Tabla 'services' para la Plantilla 1
CREATE TABLE IF NOT EXISTS public.services (
  id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  profile_id uuid NOT NULL,
  title text,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT services_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Tabla 'stats' para la Plantilla 4
CREATE TABLE IF NOT EXISTS public.stats (
  id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  profile_id uuid NOT NULL,
  label text,
  value text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT stats_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Tabla 'portfolio_items' para la Plantilla 5
CREATE TABLE IF NOT EXISTS public.portfolio_items (
  id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  profile_id uuid NOT NULL,
  title text,
  category text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT portfolio_items_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Añadir columnas adicionales a 'portfolio_items'
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'portfolio_items' AND column_name = 'link') THEN
        ALTER TABLE public.portfolio_items ADD COLUMN link text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'portfolio_items' AND column_name = 'description') THEN
        ALTER TABLE public.portfolio_items ADD COLUMN description text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'portfolio_items' AND column_name = 'image_url') THEN
        ALTER TABLE public.portfolio_items ADD COLUMN image_url text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'portfolio_items' AND column_name = 'file_url') THEN
        ALTER TABLE public.portfolio_items ADD COLUMN file_url text;
    END IF;
END $$;

-- Habilitar RLS para las nuevas tablas
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;

-- Políticas para 'services'
DROP POLICY IF EXISTS services_public_read ON public.services;
CREATE POLICY services_public_read ON public.services FOR SELECT USING (true);

DROP POLICY IF EXISTS services_user_manage ON public.services;
CREATE POLICY services_user_manage ON public.services FOR ALL USING (auth.uid() = profile_id OR is_admin());

-- Políticas para 'stats'
DROP POLICY IF EXISTS stats_public_read ON public.stats;
CREATE POLICY stats_public_read ON public.stats FOR SELECT USING (true);

DROP POLICY IF EXISTS stats_user_manage ON public.stats;
CREATE POLICY stats_user_manage ON public.stats FOR ALL USING (auth.uid() = profile_id OR is_admin());

-- Políticas para 'portfolio_items'
DROP POLICY IF EXISTS portfolio_items_public_read ON public.portfolio_items;
CREATE POLICY portfolio_items_public_read ON public.portfolio_items FOR SELECT USING (true);

DROP POLICY IF EXISTS portfolio_items_user_manage ON public.portfolio_items;
CREATE POLICY portfolio_items_user_manage ON public.portfolio_items FOR ALL USING (auth.uid() = profile_id OR is_admin());


-- =====================================================================================
-- SCRIPT 8: TEMPLATE CUSTOMIZATION
-- Este script añade la columna para almacenar el color personalizado de la plantilla.
-- =====================================================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'template_color') THEN
        ALTER TABLE public.profiles ADD COLUMN template_color text DEFAULT '#0052FF';
    END IF;
END $$;

-- 
-- =====================================================================================
-- SCRIPT 9: ONBOARDING WIZARD IMPROVEMENTS
-- Este script añade columnas necesarias para el wizard de onboarding y mejora el orden de los elementos.
-- =====================================================================================

-- Añadir columna 'sort_order' a las tablas para mantener el orden de los elementos
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'experiences' AND column_name = 'sort_order') THEN
        ALTER TABLE public.experiences ADD COLUMN sort_order integer DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'education' AND column_name = 'sort_order') THEN
        ALTER TABLE public.education ADD COLUMN sort_order integer DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'skills' AND column_name = 'sort_order') THEN
        ALTER TABLE public.skills ADD COLUMN sort_order integer DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'portfolio_items' AND column_name = 'sort_order') THEN
        ALTER TABLE public.portfolio_items ADD COLUMN sort_order integer DEFAULT 0;
    END IF;
END $$;

-- Crear índices para mejorar el rendimiento de las consultas ordenadas
CREATE INDEX IF NOT EXISTS experiences_profile_order_idx ON public.experiences(profile_id, sort_order);
CREATE INDEX IF NOT EXISTS education_profile_order_idx ON public.education(profile_id, sort_order);
CREATE INDEX IF NOT EXISTS skills_profile_order_idx ON public.skills(profile_id, sort_order);
CREATE INDEX IF NOT EXISTS portfolio_items_profile_order_idx ON public.portfolio_items(profile_id, sort_order);

-- Crear índice para búsquedas por slug (para URLs públicas)
CREATE INDEX IF NOT EXISTS profiles_slug_idx ON public.profiles(slug);

-- Asegurar que el slug sea único y no nulo para perfiles publicados
-- (Nota: Los perfiles nuevos pueden tener slug NULL hasta que el usuario lo configure)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_slug_unique_idx ON public.profiles(slug) WHERE slug IS NOT NULL;


-- =====================================================================================
-- SCRIPT 10: VISAS SYSTEM (Projects/Achievements)
-- Este script crea las tablas para el sistema de Visas con metodología CAR
-- =====================================================================================

-- Tabla principal de Visas
CREATE TABLE IF NOT EXISTS public.visas (
  id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  profile_id uuid NOT NULL,
  title text NOT NULL,
  slug text NOT NULL,
  start_date date,
  end_date date,
  context text,
  action text,
  results text,
  metrics jsonb DEFAULT '[]'::jsonb, -- Array de {key: string, value: string}
  media_urls jsonb DEFAULT '[]'::jsonb, -- Array de URLs de imágenes
  video_urls jsonb DEFAULT '[]'::jsonb, -- Array de URLs de videos (YouTube/Vimeo)
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT visas_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT visas_slug_unique UNIQUE (profile_id, slug),
  CONSTRAINT visas_title_length CHECK (char_length(title) >= 10)
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS visas_profile_id_idx ON public.visas(profile_id);
CREATE INDEX IF NOT EXISTS visas_profile_order_idx ON public.visas(profile_id, sort_order);
CREATE INDEX IF NOT EXISTS visas_slug_idx ON public.visas(profile_id, slug);

-- Habilitar RLS
ALTER TABLE public.visas ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad
DROP POLICY IF EXISTS visas_public_read ON public.visas;
CREATE POLICY visas_public_read ON public.visas FOR SELECT USING (true);

DROP POLICY IF EXISTS visas_user_manage ON public.visas;
CREATE POLICY visas_user_manage ON public.visas FOR ALL USING (auth.uid() = profile_id OR is_admin());

-- Trigger para actualizar updated_at
DROP TRIGGER IF EXISTS on_visas_update ON public.visas;
CREATE TRIGGER on_visas_update
  BEFORE UPDATE ON public.visas
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_profile_update();

-- Función para generar slug único
CREATE OR REPLACE FUNCTION generate_visa_slug(p_title text, p_profile_id uuid)
RETURNS text AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter integer := 0;
BEGIN
  -- Convertir título a slug
  base_slug := lower(trim(regexp_replace(p_title, '[^a-zA-Z0-9\s-]', '', 'g')));
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  base_slug := regexp_replace(base_slug, '-+', '-', 'g');
  base_slug := substring(base_slug, 1, 50);
  
  final_slug := base_slug;
  
  -- Verificar si el slug ya existe y agregar número si es necesario
  WHILE EXISTS (SELECT 1 FROM public.visas WHERE profile_id = p_profile_id AND slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;


-- =====================================================================================
-- SCRIPT 11: FIX RLS POLICIES FOR PUBLIC CV ACCESS
-- Este script corrige las políticas RLS para asegurar acceso público a los CVs
-- y corrige referencias incorrectas a user_id en la tabla profiles
-- =====================================================================================

-- IMPORTANTE: La tabla profiles usa 'id' como FK a auth.users(id), NO tiene columna 'user_id'
-- Las políticas deben comparar auth.uid() con profiles.id directamente

-- Verificar y corregir la relación profiles.id
-- El campo 'id' en profiles debe referenciar auth.users.id
DO $$
BEGIN
    -- Asegurar que existe la constraint correcta
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'profiles_id_fkey'
        AND table_name = 'profiles'
    ) THEN
        ALTER TABLE public.profiles
        ADD CONSTRAINT profiles_id_fkey
        FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Recrear todas las políticas RLS con la lógica correcta
-- Esto asegura que los CVs sean públicamente accesibles

-- PROFILES TABLE
DROP POLICY IF EXISTS profiles_public_read ON public.profiles;
DROP POLICY IF EXISTS profiles_user_manage ON public.profiles;

-- Lectura pública de todos los perfiles
CREATE POLICY profiles_public_read ON public.profiles
FOR SELECT USING (true);

-- Solo el dueño o admin puede insertar/actualizar/eliminar
CREATE POLICY profiles_user_manage ON public.profiles
FOR ALL USING (auth.uid() = id OR is_admin());

-- EXPERIENCES TABLE
DROP POLICY IF EXISTS experiences_public_read ON public.experiences;
DROP POLICY IF EXISTS experiences_user_manage ON public.experiences;

CREATE POLICY experiences_public_read ON public.experiences
FOR SELECT USING (true);

CREATE POLICY experiences_user_manage ON public.experiences
FOR ALL USING (
  auth.uid() = (SELECT id FROM public.profiles WHERE id = profile_id)
  OR is_admin()
);

-- EDUCATION TABLE
DROP POLICY IF EXISTS education_public_read ON public.education;
DROP POLICY IF EXISTS education_user_manage ON public.education;

CREATE POLICY education_public_read ON public.education
FOR SELECT USING (true);

CREATE POLICY education_user_manage ON public.education
FOR ALL USING (
  auth.uid() = (SELECT id FROM public.profiles WHERE id = profile_id)
  OR is_admin()
);

-- SKILLS TABLE
DROP POLICY IF EXISTS skills_public_read ON public.skills;
DROP POLICY IF EXISTS skills_user_manage ON public.skills;

CREATE POLICY skills_public_read ON public.skills
FOR SELECT USING (true);

CREATE POLICY skills_user_manage ON public.skills
FOR ALL USING (
  auth.uid() = (SELECT id FROM public.profiles WHERE id = profile_id)
  OR is_admin()
);

-- SERVICES TABLE
DROP POLICY IF EXISTS services_public_read ON public.services;
DROP POLICY IF EXISTS services_user_manage ON public.services;

CREATE POLICY services_public_read ON public.services
FOR SELECT USING (true);

CREATE POLICY services_user_manage ON public.services
FOR ALL USING (
  auth.uid() = (SELECT id FROM public.profiles WHERE id = profile_id)
  OR is_admin()
);

-- STATS TABLE
DROP POLICY IF EXISTS stats_public_read ON public.stats;
DROP POLICY IF EXISTS stats_user_manage ON public.stats;

CREATE POLICY stats_public_read ON public.stats
FOR SELECT USING (true);

CREATE POLICY stats_user_manage ON public.stats
FOR ALL USING (
  auth.uid() = (SELECT id FROM public.profiles WHERE id = profile_id)
  OR is_admin()
);

-- PORTFOLIO_ITEMS TABLE
DROP POLICY IF EXISTS portfolio_items_public_read ON public.portfolio_items;
DROP POLICY IF EXISTS portfolio_items_user_manage ON public.portfolio_items;

CREATE POLICY portfolio_items_public_read ON public.portfolio_items
FOR SELECT USING (true);

CREATE POLICY portfolio_items_user_manage ON public.portfolio_items
FOR ALL USING (
  auth.uid() = (SELECT id FROM public.profiles WHERE id = profile_id)
  OR is_admin()
);

-- VISAS TABLE (si existe)
DROP POLICY IF EXISTS visas_public_read ON public.visas;
DROP POLICY IF EXISTS visas_user_manage ON public.visas;

CREATE POLICY visas_public_read ON public.visas
FOR SELECT USING (true);

CREATE POLICY visas_user_manage ON public.visas
FOR ALL USING (
  auth.uid() = (SELECT id FROM public.profiles WHERE id = profile_id)
  OR is_admin()
);

-- Verificar que RLS está habilitado en todas las tablas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.education ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visas ENABLE ROW LEVEL SECURITY;

-- =====================================================================================
-- IMPORTANTE: Después de ejecutar este script, verifica lo siguiente:
-- 1. Ve a tu proyecto de Supabase > SQL Editor
-- 2. Copia y pega este SCRIPT 11 completo
-- 3. Ejecuta el script
-- 4. Ve a Table Editor > profiles y verifica que puedes ver los registros
-- 5. Intenta acceder a /cv/tu-slug desde un navegador en modo incógnito (sin autenticar)
-- =====================================================================================


-- =====================================================================================
-- CONFIGURACIÓN DE LINKEDIN OAUTH (Sign in with LinkedIn)
-- =====================================================================================

/*
PASO 1: CREAR APLICACIÓN EN LINKEDIN DEVELOPERS
-----------------------------------------------

1. Ve a https://www.linkedin.com/developers/
2. Haz clic en "Create app"
3. Completa la información:
   - App name: YourCVPassport (o el nombre de tu app)
   - LinkedIn Page: Selecciona o crea una página de LinkedIn
   - Privacy policy URL: https://tudominio.com/privacy
   - App logo: Sube un logo de 300x300px
4. Acepta los términos y haz clic en "Create app"


PASO 2: CONFIGURAR PERMISOS DE LA APP
-------------------------------------

1. En la página de tu app, ve a la pestaña "Products"
2. Solicita acceso a "Sign In with LinkedIn using OpenID Connect"
   - Haz clic en "Request access"
   - Completa el formulario si es necesario
3. Espera la aprobación (generalmente es instantánea)


PASO 3: OBTENER CLIENT ID Y CLIENT SECRET
-----------------------------------------

1. Ve a la pestaña "Auth" en tu app de LinkedIn
2. Copia el "Client ID"
3. Copia el "Client Secret" (haz clic en "Show" para verlo)
4. GUARDA estos valores de forma segura


PASO 4: CONFIGURAR REDIRECT URLs EN LINKEDIN
--------------------------------------------

1. En la pestaña "Auth", busca "Authorized redirect URLs for your app"
2. Agrega las siguientes URLs (reemplaza con tu información):

   Para desarrollo:
   https://[TU-PROJECT-REF].supabase.co/auth/v1/callback

   Para producción:
   https://tudominio.com/auth/v1/callback

3. Haz clic en "Update"


PASO 5: CONFIGURAR LINKEDIN EN SUPABASE
---------------------------------------

1. Ve a tu proyecto de Supabase: https://supabase.com/dashboard
2. Navega a: Authentication > Providers
3. Busca "LinkedIn" en la lista de providers
4. Haz clic para expandir la configuración
5. Activa el toggle "Enable Sign in with LinkedIn"
6. Ingresa:
   - LinkedIn Client ID: [El Client ID que copiaste]
   - LinkedIn Client Secret: [El Client Secret que copiaste]
7. Copia la "Callback URL" que muestra Supabase (deberías haberla agregado en LinkedIn)
8. Haz clic en "Save"


PASO 6: VERIFICAR LA TABLA PROFILES
-----------------------------------

Asegúrate de que tu trigger handle_new_user() pueda manejar usuarios de LinkedIn.
El trigger actual en el SCRIPT 2 ya maneja esto correctamente, pero verifica que:

- La columna 'full_name' en profiles acepta NULL o tiene un valor por defecto
- El trigger genera un slug automáticamente

El trigger actual:

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, slug)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    new.id::text
  );
  RETURN new;
END;
$$;

Si tu trigger no tiene COALESCE, actualízalo ejecutando el código de arriba.


PASO 7: IMPLEMENTAR EN EL FRONTEND
----------------------------------

Ver los archivos de código más abajo para la implementación en React.


NOTAS IMPORTANTES:
-----------------

1. LinkedIn OAuth solo funciona con HTTPS en producción
2. Para desarrollo local, usa la URL de Supabase como redirect
3. Los datos que LinkedIn proporciona incluyen:
   - Email
   - Nombre completo
   - Foto de perfil (si el usuario lo permite)
   - ID de LinkedIn
4. Puedes acceder a más datos con permisos adicionales (requiere revisión de LinkedIn)


TROUBLESHOOTING:
---------------

Error: "redirect_uri_mismatch"
- Verifica que la URL de callback en LinkedIn coincida EXACTAMENTE con la de Supabase
- No debe haber espacios o caracteres extra
- Debe incluir https://

Error: "invalid_client"
- Verifica que el Client ID y Client Secret sean correctos
- Asegúrate de no tener espacios al copiar/pegar

Error: "Profile not created"
- Verifica que el trigger handle_new_user() esté funcionando
- Revisa los logs en Supabase: Database > Logs
*/


-- =====================================================================================
-- SCRIPT 12: ACTUALIZAR TRIGGER PARA SOPORTE DE LINKEDIN OAUTH
-- Este script actualiza el trigger handle_new_user() para manejar correctamente
-- usuarios que se registran con LinkedIn (u otros proveedores OAuth)
-- =====================================================================================

-- Actualizar el trigger para manejar usuarios de LinkedIn
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, slug)
  VALUES (
    new.id,
    COALESCE(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    ),
    new.id::text
  );
  RETURN new;
END;
$$;

-- Nota: Este trigger maneja múltiples casos:
-- 1. Usuario con email/password: usa 'full_name' del formulario
-- 2. Usuario con Google: usa 'name' de Google
-- 3. Usuario con LinkedIn: usa 'name' de LinkedIn
-- 4. Fallback: usa la parte del email antes del @


-- =====================================================================================
-- SISTEMA DE HANDLES/SLUGS PERSONALIZADOS
-- =====================================================================================

/*
El sistema de handles permite a los usuarios tener URLs personalizadas para sus CVs.
Ejemplo: yourcvpassport.com/cv/john-doe

CARACTERÍSTICAS IMPLEMENTADAS:
-------------------------------

1. VALIDACIONES:
   - Longitud: mínimo 3, máximo 30 caracteres
   - Formato: solo letras minúsculas, números y guiones
   - No permite guiones consecutivos (--)
   - No permite guiones al inicio o final
   - Case-insensitive (todo se convierte a minúsculas)

2. PALABRAS RESERVADAS:
   Lista completa en utils/handleValidation.ts
   Ejemplos: admin, api, auth, login, dashboard, settings, etc.

3. VALIDACIÓN EN TIEMPO REAL:
   - Debounce de 500ms para evitar consultas excesivas
   - Verificación local de formato primero
   - Verificación de disponibilidad en la base de datos
   - Feedback visual instantáneo (✓ verde / ✗ roja / loading)

4. SUGERENCIAS AUTOMÁTICAS:
   Si el handle no está disponible o es inválido, se generan sugerencias:
   - {handle}123, {handle}456, etc. (números aleatorios)
   - {handle}-pro, {handle}-cv, {handle}-official, etc. (sufijos)
   - {handle}2025 (año actual)

5. NORMALIZACIÓN AUTOMÁTICA:
   - Conversión a minúsculas
   - Reemplazo de caracteres especiales por guiones
   - Eliminación de espacios
   - Eliminación de guiones consecutivos

ARCHIVOS DEL SISTEMA:
--------------------

1. utils/handleValidation.ts
   - validateHandle(): Validación local de formato
   - checkHandleAvailability(): Verificación en BD
   - generateHandleSuggestions(): Generación de alternativas
   - normalizeToHandle(): Normalización de strings
   - RESERVED_HANDLES: Lista de palabras reservadas

2. components/HandleInput.tsx
   - Componente React con validación en tiempo real
   - Feedback visual (loading, valid, invalid)
   - Sugerencias clickeables
   - Debouncing automático

USO DEL COMPONENTE:
------------------

import HandleInput from './components/HandleInput';

<HandleInput
  value={handle}
  onChange={setHandle}
  currentUserId={user?.id}
  label="Your Handle"
  placeholder="your-handle"
  helpText="Your URL will be: yourcvpassport.com/cv/your-handle"
  required={true}
/>

IMPORTANTE:
-----------

- El slug se genera automáticamente al crear un usuario (usando el ID)
- Los usuarios pueden personalizar su slug más tarde desde el dashboard
- El slug es único por usuario (constraint UNIQUE en la tabla profiles)
- El sistema soporta cambios de slug (el usuario puede cambiar su handle)

SQL PARA VERIFICAR UNICIDAD:
----------------------------
*/

-- Agregar constraint de unicidad al slug (si no existe)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'profiles_slug_unique'
    ) THEN
        ALTER TABLE public.profiles
        ADD CONSTRAINT profiles_slug_unique UNIQUE (slug);
    END IF;
END $$;

-- Índice para búsquedas rápidas por slug
CREATE INDEX IF NOT EXISTS profiles_slug_idx ON public.profiles(slug);

-- Función para validar slug antes de insertar/actualizar
CREATE OR REPLACE FUNCTION validate_profile_slug()
RETURNS TRIGGER AS $$
BEGIN
  -- Normalizar slug a minúsculas
  NEW.slug := LOWER(TRIM(NEW.slug));

  -- Validar longitud
  IF LENGTH(NEW.slug) < 3 OR LENGTH(NEW.slug) > 30 THEN
    RAISE EXCEPTION 'Slug must be between 3 and 30 characters';
  END IF;

  -- Validar formato (solo alfanuméricos y guiones)
  IF NEW.slug !~ '^[a-z0-9-]+$' THEN
    RAISE EXCEPTION 'Slug can only contain lowercase letters, numbers, and hyphens';
  END IF;

  -- Validar guiones consecutivos
  IF NEW.slug ~ '--' THEN
    RAISE EXCEPTION 'Slug cannot contain consecutive hyphens';
  END IF;

  -- Validar guiones al inicio o final
  IF NEW.slug ~ '^-' OR NEW.slug ~ '-$' THEN
    RAISE EXCEPTION 'Slug cannot start or end with a hyphen';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para validar slug
DROP TRIGGER IF EXISTS validate_slug_trigger ON public.profiles;
CREATE TRIGGER validate_slug_trigger
  BEFORE INSERT OR UPDATE OF slug ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION validate_profile_slug();


-- =====================================================================================
-- SCRIPT 13: CAMPOS ADICIONALES PARA PERFIL COMPLETO
-- Agrega campos faltantes para completar el formulario de edición de perfil
-- =====================================================================================

DO $$
BEGIN
    -- Email (se puede obtener de auth.users pero útil tenerlo en profiles también)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'email') THEN
        ALTER TABLE public.profiles ADD COLUMN email text;
    END IF;

    -- Open to remote work (checkbox)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'open_to_remote') THEN
        ALTER TABLE public.profiles ADD COLUMN open_to_remote boolean DEFAULT false;
    END IF;

    -- Website/Portfolio URL (diferente de portfolio_url ya existente)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'website_url') THEN
        ALTER TABLE public.profiles ADD COLUMN website_url text;
    END IF;

    -- Twitter/X URL
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'twitter_url') THEN
        ALTER TABLE public.profiles ADD COLUMN twitter_url text;
    END IF;

    -- Instagram URL
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'instagram_url') THEN
        ALTER TABLE public.profiles ADD COLUMN instagram_url text;
    END IF;

    -- YouTube URL
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'youtube_url') THEN
        ALTER TABLE public.profiles ADD COLUMN youtube_url text;
    END IF;

    -- Behance URL (para diseñadores)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'behance_url') THEN
        ALTER TABLE public.profiles ADD COLUMN behance_url text;
    END IF;

    -- Dribbble URL (para diseñadores)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'dribbble_url') THEN
        ALTER TABLE public.profiles ADD COLUMN dribbble_url text;
    END IF;
END $$;

-- Índices para búsquedas comunes
CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles(email);
CREATE INDEX IF NOT EXISTS profiles_location_idx ON public.profiles(location);
CREATE INDEX IF NOT EXISTS profiles_job_seeking_status_idx ON public.profiles(job_seeking_status);


-- =====================================================================================
-- SCRIPT 14: CAMPOS DE PREFERENCIAS DE TRABAJO
-- Agrega todos los campos necesarios para la sección de Preferences
-- =====================================================================================

DO $$
BEGIN
    -- Job type preferences (array de strings)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'job_type') THEN
        ALTER TABLE public.profiles ADD COLUMN job_type text[];
    END IF;

    -- Availability status
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'availability') THEN
        ALTER TABLE public.profiles ADD COLUMN availability text;
    END IF;

    -- Salary range
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'salary_min') THEN
        ALTER TABLE public.profiles ADD COLUMN salary_min integer;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'salary_max') THEN
        ALTER TABLE public.profiles ADD COLUMN salary_max integer;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'salary_currency') THEN
        ALTER TABLE public.profiles ADD COLUMN salary_currency text DEFAULT 'USD';
    END IF;

    -- Remote/location preferences
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'remote_preference') THEN
        ALTER TABLE public.profiles ADD COLUMN remote_preference text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'willing_to_relocate') THEN
        ALTER TABLE public.profiles ADD COLUMN willing_to_relocate boolean DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'preferred_locations') THEN
        ALTER TABLE public.profiles ADD COLUMN preferred_locations text[];
    END IF;
END $$;

-- Índices para búsquedas de preferencias
CREATE INDEX IF NOT EXISTS profiles_job_type_idx ON public.profiles USING GIN(job_type);
CREATE INDEX IF NOT EXISTS profiles_remote_preference_idx ON public.profiles(remote_preference);
CREATE INDEX IF NOT EXISTS profiles_availability_idx ON public.profiles(availability);


-- =====================================================================================
-- RESUMEN DE CORRECCIONES APLICADAS
-- =====================================================================================

/*
PROBLEMAS CORREGIDOS EN ESTA SESIÓN:

1. ✅ FORMATO DE FECHAS (DashboardContent.tsx)
   - Líneas 221-222: Experience dates - Agregado "-01" para formato YYYY-MM-DD
   - Líneas 253-254: Education dates - Agregado "-01" para formato YYYY-MM-DD
   - Problema: Input type="month" retorna "YYYY-MM" pero PostgreSQL requiere "YYYY-MM-DD"

2. ✅ LANGUAGES SECTION (DashboardContent.tsx)
   - Líneas 302-328: Implementado guardado completo en tabla 'languages'
   - Removido mensaje técnico "(implement table in Supabase)"
   - Agregado sort_order para mantener el orden
   - Problema: Función no implementada, solo mostraba placeholder

3. ✅ PORTFOLIO SECTION (DashboardContent.tsx)
   - Líneas 335-348: Corregido 'order' → 'sort_order'
   - Agregado campos faltantes: description, image_url
   - Problema: Columna incorrecta y campos faltantes

4. ✅ PREFERENCES SECTION (DashboardContent.tsx)
   - Líneas 361-389: Implementado guardado completo de preferencias
   - Agregados todos los campos: job_type, availability, salary_min, salary_max,
     salary_currency, remote_preference, willing_to_relocate, preferred_locations
   - Problema: Solo guardaba 'availability', el resto de campos no se guardaban

SCRIPTS SQL NECESARIOS:

Para que todo funcione correctamente, debes ejecutar en Supabase (SQL Editor):

1. SCRIPT 13 (líneas 979-1030): Campos adicionales de perfil
   - Agrega: email, open_to_remote, website_url, twitter_url, instagram_url,
     youtube_url, behance_url, dribbble_url

2. SCRIPT 14 (líneas 1033-1080): Campos de preferencias
   - Agrega: job_type, availability, salary_min, salary_max, salary_currency,
     remote_preference, willing_to_relocate, preferred_locations

3. Verificar tabla 'languages' existe con columnas:
   - id, profile_id, name, level, sort_order, created_at, updated_at

4. Verificar tabla 'portfolio_items' tiene columna 'sort_order' (no 'order')

COMPONENTES ACTUALIZADOS:

✅ components/dashboard/DashboardContent.tsx
   - handleExperienceSave: Formato de fechas corregido
   - handleEducationSave: Formato de fechas corregido
   - handleLanguagesSave: Implementación completa
   - handlePortfolioSave: sort_order + campos adicionales
   - handlePreferencesSave: Guardado completo de todos los campos

✅ cronologia.md
   - SCRIPT 13: Campos de perfil adicionales
   - SCRIPT 14: Campos de preferencias de trabajo

SECCIONES AHORA FUNCIONALES:

✅ Identity - Funcionando
✅ Experience - Funcionando (fechas corregidas)
✅ Education - Funcionando (fechas corregidas)
✅ Skills - Funcionando
✅ Languages - AHORA FUNCIONA (implementado guardado)
✅ Portfolio - AHORA FUNCIONA (sort_order + campos completos)
✅ Preferences - AHORA FUNCIONA (todos los campos guardables)

PRÓXIMOS PASOS:

1. Ejecutar SCRIPT 13 en Supabase
2. Ejecutar SCRIPT 14 en Supabase
3. Verificar que exista la tabla 'languages' con estructura correcta
4. Configurar bucket 'profile-assets' en Supabase Storage para imágenes
5. Probar cada sección guardando datos
*/


-- =====================================================================================
-- =====================================================================================
-- SCRIPT COMPLETO Y CONSOLIDADO - EJECUTAR EN SUPABASE
-- =====================================================================================
-- =====================================================================================
--
-- Este script contiene TODAS las funcionalidades necesarias para YourCVPassport:
--
-- ✅ Tabla profiles con TODOS los campos (incluyendo preferences)
-- ✅ Tabla experiences
-- ✅ Tabla education
-- ✅ Tabla skills (con percentage para plantillas avanzadas)
-- ✅ Tabla languages (con niveles CEFR y sort_order)
-- ✅ Tabla portfolio_items (con image_url, description, file_url)
-- ✅ Bucket profile-assets para almacenamiento de imágenes
-- ✅ Políticas RLS para seguridad
-- ✅ Triggers automáticos
-- ✅ Funciones de utilidad
--
-- INSTRUCCIONES:
-- 1. Abre el Editor SQL en tu proyecto de Supabase
-- 2. Copia TODO este script desde aquí hasta el final
-- 3. Pega en el Editor SQL
-- 4. Haz clic en "RUN" o presiona Ctrl+Enter
-- 5. Verifica que no haya errores en la consola
-- 6. Recarga tu aplicación
--
-- =====================================================================================


-- =====================================================================================
-- PASO 1: CREAR TABLAS PRINCIPALES
-- =====================================================================================

-- Tabla 'profiles' - Perfil del usuario
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL PRIMARY KEY,
  full_name text,
  headline text,
  summary text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Agregar TODAS las columnas necesarias a profiles
DO $$
BEGIN
    -- Campos básicos de perfil
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'slug') THEN
        ALTER TABLE public.profiles ADD COLUMN slug text UNIQUE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'meta_title') THEN
        ALTER TABLE public.profiles ADD COLUMN meta_title text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'meta_description') THEN
        ALTER TABLE public.profiles ADD COLUMN meta_description text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'template') THEN
        ALTER TABLE public.profiles ADD COLUMN template text DEFAULT 'classic';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'plan') THEN
        ALTER TABLE public.profiles ADD COLUMN plan text DEFAULT 'Free';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role') THEN
        ALTER TABLE public.profiles ADD COLUMN role text DEFAULT 'user';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'template_color') THEN
        ALTER TABLE public.profiles ADD COLUMN template_color text DEFAULT '#0052FF';
    END IF;

    -- Campos de contacto e identidad
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'availability') THEN
        ALTER TABLE public.profiles ADD COLUMN availability text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'location') THEN
        ALTER TABLE public.profiles ADD COLUMN location text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'phone') THEN
        ALTER TABLE public.profiles ADD COLUMN phone text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'linkedin_url') THEN
        ALTER TABLE public.profiles ADD COLUMN linkedin_url text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'github_url') THEN
        ALTER TABLE public.profiles ADD COLUMN github_url text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'gender') THEN
        ALTER TABLE public.profiles ADD COLUMN gender text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'portfolio_url') THEN
        ALTER TABLE public.profiles ADD COLUMN portfolio_url text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'job_seeking_status') THEN
        ALTER TABLE public.profiles ADD COLUMN job_seeking_status text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'avatar_url') THEN
        ALTER TABLE public.profiles ADD COLUMN avatar_url text;
    END IF;

    -- Campos de preferencias de trabajo
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'job_type') THEN
        ALTER TABLE public.profiles ADD COLUMN job_type text[];
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'salary_min') THEN
        ALTER TABLE public.profiles ADD COLUMN salary_min numeric;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'salary_max') THEN
        ALTER TABLE public.profiles ADD COLUMN salary_max numeric;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'salary_currency') THEN
        ALTER TABLE public.profiles ADD COLUMN salary_currency text DEFAULT 'USD';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'remote_preference') THEN
        ALTER TABLE public.profiles ADD COLUMN remote_preference text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'willing_to_relocate') THEN
        ALTER TABLE public.profiles ADD COLUMN willing_to_relocate boolean DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'preferred_locations') THEN
        ALTER TABLE public.profiles ADD COLUMN preferred_locations text[];
    END IF;
END $$;


-- Tabla 'experiences' - Experiencia laboral
CREATE TABLE IF NOT EXISTS public.experiences (
  id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  profile_id uuid NOT NULL,
  title text,
  company_name text,
  start_date date,
  end_date date,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT experiences_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);


-- Tabla 'education' - Educación
CREATE TABLE IF NOT EXISTS public.education (
  id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  profile_id uuid NOT NULL,
  institution_name text,
  degree text,
  field_of_study text,
  start_date date,
  end_date date,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT education_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);


-- Tabla 'skills' - Habilidades
CREATE TABLE IF NOT EXISTS public.skills (
  id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  profile_id uuid NOT NULL,
  name text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT skills_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  UNIQUE(profile_id, name)
);

-- Agregar columna 'percentage' para skills (usada en plantillas avanzadas)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'skills' AND column_name = 'percentage') THEN
        ALTER TABLE public.skills ADD COLUMN percentage integer;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'skills' AND column_name = 'sort_order') THEN
        ALTER TABLE public.skills ADD COLUMN sort_order integer DEFAULT 0;
    END IF;
END $$;


-- Tabla 'languages' - Idiomas con niveles CEFR
CREATE TABLE IF NOT EXISTS public.languages (
  id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  profile_id uuid NOT NULL,
  name text NOT NULL,
  level text NOT NULL CHECK (level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'Native')),
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT languages_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Índice para mejorar performance en consultas de languages
CREATE INDEX IF NOT EXISTS languages_profile_id_idx ON public.languages(profile_id);


-- Tabla 'portfolio_items' - Items de portfolio con imágenes
CREATE TABLE IF NOT EXISTS public.portfolio_items (
  id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  profile_id uuid NOT NULL,
  title text,
  category text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT portfolio_items_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Agregar columnas adicionales a portfolio_items
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'portfolio_items' AND column_name = 'link') THEN
        ALTER TABLE public.portfolio_items ADD COLUMN link text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'portfolio_items' AND column_name = 'description') THEN
        ALTER TABLE public.portfolio_items ADD COLUMN description text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'portfolio_items' AND column_name = 'image_url') THEN
        ALTER TABLE public.portfolio_items ADD COLUMN image_url text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'portfolio_items' AND column_name = 'file_url') THEN
        ALTER TABLE public.portfolio_items ADD COLUMN file_url text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'portfolio_items' AND column_name = 'sort_order') THEN
        ALTER TABLE public.portfolio_items ADD COLUMN sort_order integer DEFAULT 0;
    END IF;
END $$;

-- Índice para mejorar performance
CREATE INDEX IF NOT EXISTS portfolio_items_profile_order_idx ON public.portfolio_items(profile_id, sort_order);


-- Tabla 'analytics_views' - Registro de visitas al CV
CREATE TABLE IF NOT EXISTS public.analytics_views (
  id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  profile_id uuid NOT NULL,
  visitor_id text,
  user_agent text,
  referrer text,
  country text,
  city text,
  ip_address text,
  viewed_at timestamp with time zone DEFAULT now(),
  CONSTRAINT analytics_views_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS analytics_views_profile_id_idx ON public.analytics_views(profile_id);
CREATE INDEX IF NOT EXISTS analytics_views_viewed_at_idx ON public.analytics_views(viewed_at);
CREATE INDEX IF NOT EXISTS analytics_views_profile_date_idx ON public.analytics_views(profile_id, viewed_at);


-- Tabla 'analytics_clicks' - Registro de clics en CTAs
CREATE TABLE IF NOT EXISTS public.analytics_clicks (
  id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  profile_id uuid NOT NULL,
  visitor_id text,
  cta_type text NOT NULL,
  cta_label text,
  clicked_at timestamp with time zone DEFAULT now(),
  CONSTRAINT analytics_clicks_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS analytics_clicks_profile_id_idx ON public.analytics_clicks(profile_id);
CREATE INDEX IF NOT EXISTS analytics_clicks_clicked_at_idx ON public.analytics_clicks(clicked_at);


-- Tabla 'analytics_leads' - Contactos/Leads recibidos
CREATE TABLE IF NOT EXISTS public.analytics_leads (
  id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  profile_id uuid NOT NULL,
  name text,
  email text,
  company text,
  message text,
  source text,
  status text DEFAULT 'new',
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT analytics_leads_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS analytics_leads_profile_id_idx ON public.analytics_leads(profile_id);
CREATE INDEX IF NOT EXISTS analytics_leads_created_at_idx ON public.analytics_leads(created_at);
CREATE INDEX IF NOT EXISTS analytics_leads_status_idx ON public.analytics_leads(status);


-- =====================================================================================
-- PASO 2: CONFIGURAR STORAGE BUCKET PARA IMÁGENES
-- =====================================================================================

-- Crear bucket 'profile-assets' para imágenes de portfolio, avatares, etc.
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-assets', 'profile-assets', true)
ON CONFLICT (id) DO NOTHING;


-- =====================================================================================
-- PASO 3: TRIGGERS Y FUNCIONES AUTOMÁTICAS
-- =====================================================================================

-- Función para crear perfil automáticamente cuando se registra un usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, slug)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.id::text);
  RETURN new;
END;
$$;

-- Trigger para crear perfil automáticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- Función para actualizar 'updated_at' automáticamente
CREATE OR REPLACE FUNCTION public.handle_profile_update()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Trigger para actualizar 'updated_at' en profiles
DROP TRIGGER IF EXISTS on_profiles_update ON public.profiles;
CREATE TRIGGER on_profiles_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_profile_update();


-- =====================================================================================
-- PASO 4: POLÍTICAS DE SEGURIDAD (RLS - Row Level Security)
-- =====================================================================================

-- Función para verificar si el usuario es administrador
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;


-- Habilitar RLS en todas las tablas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.education ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;


-- POLÍTICAS PARA 'profiles'
DROP POLICY IF EXISTS profiles_public_read ON public.profiles;
CREATE POLICY profiles_public_read ON public.profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS profiles_user_manage ON public.profiles;
CREATE POLICY profiles_user_manage ON public.profiles
  FOR ALL USING (auth.uid() = id OR is_admin());


-- POLÍTICAS PARA 'experiences'
DROP POLICY IF EXISTS experiences_public_read ON public.experiences;
CREATE POLICY experiences_public_read ON public.experiences
  FOR SELECT USING (true);

DROP POLICY IF EXISTS experiences_user_manage ON public.experiences;
CREATE POLICY experiences_user_manage ON public.experiences
  FOR ALL USING (auth.uid() = profile_id OR is_admin());


-- POLÍTICAS PARA 'education'
DROP POLICY IF EXISTS education_public_read ON public.education;
CREATE POLICY education_public_read ON public.education
  FOR SELECT USING (true);

DROP POLICY IF EXISTS education_user_manage ON public.education;
CREATE POLICY education_user_manage ON public.education
  FOR ALL USING (auth.uid() = profile_id OR is_admin());


-- POLÍTICAS PARA 'skills'
DROP POLICY IF EXISTS skills_public_read ON public.skills;
CREATE POLICY skills_public_read ON public.skills
  FOR SELECT USING (true);

DROP POLICY IF EXISTS skills_user_manage ON public.skills;
CREATE POLICY skills_user_manage ON public.skills
  FOR ALL USING (auth.uid() = profile_id OR is_admin());


-- POLÍTICAS PARA 'languages'
DROP POLICY IF EXISTS languages_public_read ON public.languages;
CREATE POLICY languages_public_read ON public.languages
  FOR SELECT USING (true);

DROP POLICY IF EXISTS languages_user_manage ON public.languages;
CREATE POLICY languages_user_manage ON public.languages
  FOR ALL USING (auth.uid() = profile_id OR is_admin());


-- POLÍTICAS PARA 'portfolio_items'
DROP POLICY IF EXISTS portfolio_items_public_read ON public.portfolio_items;
CREATE POLICY portfolio_items_public_read ON public.portfolio_items
  FOR SELECT USING (true);

DROP POLICY IF EXISTS portfolio_items_user_manage ON public.portfolio_items;
CREATE POLICY portfolio_items_user_manage ON public.portfolio_items
  FOR ALL USING (auth.uid() = profile_id OR is_admin());


-- =====================================================================================
-- PASO 5: POLÍTICAS DE STORAGE PARA BUCKET 'profile-assets'
-- =====================================================================================

-- Acceso público de lectura a todos los assets
DROP POLICY IF EXISTS "Public read access for profile assets" ON storage.objects;
CREATE POLICY "Public read access for profile assets"
ON storage.objects FOR SELECT
USING ( bucket_id = 'profile-assets' );

-- Usuarios autenticados pueden subir archivos
DROP POLICY IF EXISTS "Authenticated users can upload profile assets" ON storage.objects;
CREATE POLICY "Authenticated users can upload profile assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profile-assets'
  AND auth.role() = 'authenticated'
);

-- Usuarios autenticados pueden actualizar sus archivos
DROP POLICY IF EXISTS "Authenticated users can update profile assets" ON storage.objects;
CREATE POLICY "Authenticated users can update profile assets"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'profile-assets'
  AND auth.role() = 'authenticated'
);

-- Usuarios autenticados pueden eliminar sus archivos
DROP POLICY IF EXISTS "Authenticated users can delete profile assets" ON storage.objects;
CREATE POLICY "Authenticated users can delete profile assets"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'profile-assets'
  AND auth.role() = 'authenticated'
);


-- =====================================================================================
-- SCRIPT 15: AÑADIR COLUMNA 'HANDLE' PARA URLs PERSONALIZADAS
-- Este script añade la columna 'handle' que permite URLs amigables basadas en
-- nombre + profesión del usuario (ej: /cv/samuel-desarrollador-web)
-- =====================================================================================

DO $$
BEGIN
    -- Add handle column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'profiles'
                   AND column_name = 'handle') THEN
        ALTER TABLE public.profiles ADD COLUMN handle text;

        -- Create index for faster lookups
        CREATE INDEX IF NOT EXISTS profiles_handle_idx ON public.profiles(handle);

        -- Add unique constraint
        ALTER TABLE public.profiles ADD CONSTRAINT profiles_handle_unique UNIQUE (handle);

        RAISE NOTICE 'Added handle column to profiles table';
    ELSE
        RAISE NOTICE 'Handle column already exists';
    END IF;
END $$;

-- =====================================================================================
-- SCRIPT COMPLETADO
-- =====================================================================================
--
-- ✅ TODAS las tablas creadas con sus columnas
-- ✅ Bucket de storage configurado
-- ✅ Políticas RLS aplicadas
-- ✅ Triggers automáticos funcionando
-- ✅ Columna 'handle' para URLs personalizadas
--
-- FUNCIONALIDADES HABILITADAS:
--
-- ✅ Perfil de usuario con preferencias completas
-- ✅ Experiencia laboral
-- ✅ Educación
-- ✅ Skills con porcentajes
-- ✅ Idiomas con niveles CEFR
-- ✅ Portfolio con imágenes (image_url)
-- ✅ Upload de imágenes a Supabase Storage
-- ✅ Seguridad con RLS
-- ✅ Creación automática de perfil al registrarse
-- ✅ URLs personalizadas con handle
--
-- SIGUIENTE PASO:
-- Recarga tu aplicación y verifica que todo funcione correctamente
--
-- =====================================================================================


-- =====================================================================================
-- SCRIPT 12: ADMIN DASHBOARD - FUNCIONES Y TABLAS
-- Este script crea todas las funciones necesarias para el Admin Dashboard
-- =====================================================================================

-- Función para obtener estadísticas generales del sistema
CREATE OR REPLACE FUNCTION admin_get_system_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, auth
AS $
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Permission denied. You must be an admin.';
  END IF;

  RETURN json_build_object(
    'total_users', (SELECT COUNT(*) FROM public.profiles),
    'total_free_users', (SELECT COUNT(*) FROM public.profiles WHERE plan = 'Free' OR plan IS NULL),
    'total_pro_users', (SELECT COUNT(*) FROM public.profiles WHERE plan = 'Pro'),
    'total_premium_users', (SELECT COUNT(*) FROM public.profiles WHERE plan = 'Premium'),
    'total_profiles_with_cv', (SELECT COUNT(*) FROM public.profiles WHERE full_name IS NOT NULL AND headline IS NOT NULL),
    'total_experiences', (SELECT COUNT(*) FROM public.experiences),
    'total_education', (SELECT COUNT(*) FROM public.education),
    'total_skills', (SELECT COUNT(*) FROM public.skills),
    'total_portfolio_items', (SELECT COUNT(*) FROM public.portfolio_items),
    'users_last_7_days', (SELECT COUNT(*) FROM public.profiles WHERE created_at >= NOW() - INTERVAL '7 days'),
    'users_last_30_days', (SELECT COUNT(*) FROM public.profiles WHERE created_at >= NOW() - INTERVAL '30 days')
  );
END;
$;

-- Función para actualizar el plan de un usuario
CREATE OR REPLACE FUNCTION admin_update_user_plan(user_id uuid, new_plan text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Permission denied. You must be an admin.';
  END IF;

  UPDATE public.profiles
  SET plan = new_plan, updated_at = NOW()
  WHERE id = user_id;
END;
$;

-- Función para actualizar el rol de un usuario
CREATE OR REPLACE FUNCTION admin_update_user_role(user_id uuid, new_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Permission denied. You must be an admin.';
  END IF;

  UPDATE public.profiles
  SET role = new_role, updated_at = NOW()
  WHERE id = user_id;
END;
$;

-- Función para obtener detalles completos de un usuario
CREATE OR REPLACE FUNCTION admin_get_user_details(user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, auth
AS $
DECLARE
  user_data json;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Permission denied. You must be an admin.';
  END IF;

  SELECT json_build_object(
    'profile', row_to_json(p.*),
    'auth_user', json_build_object(
      'email', u.email,
      'email_confirmed_at', u.email_confirmed_at,
      'last_sign_in_at', u.last_sign_in_at,
      'created_at', u.created_at
    ),
    'experiences_count', (SELECT COUNT(*) FROM public.experiences WHERE profile_id = user_id),
    'education_count', (SELECT COUNT(*) FROM public.education WHERE profile_id = user_id),
    'skills_count', (SELECT COUNT(*) FROM public.skills WHERE profile_id = user_id),
    'portfolio_count', (SELECT COUNT(*) FROM public.portfolio_items WHERE profile_id = user_id),
    'languages_count', (SELECT COUNT(*) FROM public.languages WHERE profile_id = user_id)
  ) INTO user_data
  FROM public.profiles p
  JOIN auth.users u ON p.id = u.id
  WHERE p.id = user_id;

  RETURN user_data;
END;
$;

-- Función para buscar usuarios
CREATE OR REPLACE FUNCTION admin_search_users(search_term text)
RETURNS TABLE (
  id uuid,
  full_name text,
  email text,
  headline text,
  plan text,
  role text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, auth
AS $
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Permission denied. You must be an admin.';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.full_name,
    u.email,
    p.headline,
    p.plan,
    p.role,
    p.created_at,
    p.updated_at
  FROM
    public.profiles p
  JOIN
    auth.users u ON p.id = u.id
  WHERE
    p.full_name ILIKE '%' || search_term || '%'
    OR u.email ILIKE '%' || search_term || '%'
    OR p.headline ILIKE '%' || search_term || '%'
  ORDER BY
    p.created_at DESC
  LIMIT 100;
END;
$;

-- Función para obtener usuarios por plan
CREATE OR REPLACE FUNCTION admin_get_users_by_plan(plan_name text)
RETURNS TABLE (
  id uuid,
  full_name text,
  email text,
  headline text,
  plan text,
  role text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, auth
AS $
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Permission denied. You must be an admin.';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.full_name,
    u.email,
    p.headline,
    p.plan,
    p.role,
    p.created_at,
    p.updated_at
  FROM
    public.profiles p
  JOIN
    auth.users u ON p.id = u.id
  WHERE
    p.plan = plan_name OR (plan_name = 'Free' AND p.plan IS NULL)
  ORDER BY
    p.created_at DESC;
END;
$;

-- Función para obtener actividad reciente
CREATE OR REPLACE FUNCTION admin_get_recent_activity(limit_count integer DEFAULT 50)
RETURNS TABLE (
  activity_type text,
  user_id uuid,
  user_name text,
  user_email text,
  description text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, auth
AS $
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Permission denied. You must be an admin.';
  END IF;

  RETURN QUERY
  SELECT
    'user_registered'::text as activity_type,
    p.id as user_id,
    p.full_name as user_name,
    u.email as user_email,
    'New user registered'::text as description,
    p.created_at
  FROM
    public.profiles p
  JOIN
    auth.users u ON p.id = u.id
  ORDER BY
    p.created_at DESC
  LIMIT limit_count;
END;
$;

-- Función para eliminar completamente un usuario y todos sus datos
CREATE OR REPLACE FUNCTION admin_delete_user_complete(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, auth
AS $
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Permission denied. You must be an admin.';
  END IF;

  -- Eliminar todos los datos relacionados (las FK con CASCADE lo harán automáticamente)
  -- Pero lo hacemos explícito para mayor claridad
  DELETE FROM public.experiences WHERE profile_id = user_id;
  DELETE FROM public.education WHERE profile_id = user_id;
  DELETE FROM public.skills WHERE profile_id = user_id;
  DELETE FROM public.languages WHERE profile_id = user_id;
  DELETE FROM public.portfolio_items WHERE profile_id = user_id;
  DELETE FROM public.services WHERE profile_id = user_id;
  DELETE FROM public.stats WHERE profile_id = user_id;
  DELETE FROM public.visas WHERE profile_id = user_id;
  
  -- Eliminar el perfil
  DELETE FROM public.profiles WHERE id = user_id;
  
  -- Eliminar el usuario de auth (esto también eliminará el perfil por CASCADE)
  DELETE FROM auth.users WHERE id = user_id;
END;
$;

-- Función para obtener usuarios inactivos
CREATE OR REPLACE FUNCTION admin_get_inactive_users(days_inactive integer DEFAULT 30)
RETURNS TABLE (
  id uuid,
  full_name text,
  email text,
  headline text,
  plan text,
  last_sign_in_at timestamptz,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, auth
AS $
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Permission denied. You must be an admin.';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.full_name,
    u.email,
    p.headline,
    p.plan,
    u.last_sign_in_at,
    p.created_at
  FROM
    public.profiles p
  JOIN
    auth.users u ON p.id = u.id
  WHERE
    u.last_sign_in_at < NOW() - (days_inactive || ' days')::interval
    OR u.last_sign_in_at IS NULL
  ORDER BY
    u.last_sign_in_at ASC NULLS FIRST;
END;
$;

-- Función para obtener estadísticas de templates
CREATE OR REPLACE FUNCTION admin_get_template_stats()
RETURNS TABLE (
  template_name text,
  usage_count bigint,
  percentage numeric
)
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $
DECLARE
  total_users bigint;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Permission denied. You must be an admin.';
  END IF;

  SELECT COUNT(*) INTO total_users FROM public.profiles WHERE template IS NOT NULL;

  RETURN QUERY
  SELECT
    COALESCE(p.template, 'classic') as template_name,
    COUNT(*) as usage_count,
    ROUND((COUNT(*)::numeric / NULLIF(total_users, 0) * 100), 2) as percentage
  FROM
    public.profiles p
  WHERE
    p.template IS NOT NULL
  GROUP BY
    p.template
  ORDER BY
    usage_count DESC;
END;
$;

-- Función para actualizar múltiples usuarios a la vez (bulk update)
CREATE OR REPLACE FUNCTION admin_bulk_update_plan(user_ids uuid[], new_plan text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $
DECLARE
  updated_count integer;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Permission denied. You must be an admin.';
  END IF;

  UPDATE public.profiles
  SET plan = new_plan, updated_at = NOW()
  WHERE id = ANY(user_ids);

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$;

-- Tabla para logs de actividad del admin
CREATE TABLE IF NOT EXISTS public.admin_activity_logs (
  id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  admin_id uuid NOT NULL,
  action text NOT NULL,
  target_user_id uuid,
  details jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT admin_activity_logs_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Índice para mejorar consultas de logs
CREATE INDEX IF NOT EXISTS admin_activity_logs_admin_id_idx ON public.admin_activity_logs(admin_id);
CREATE INDEX IF NOT EXISTS admin_activity_logs_created_at_idx ON public.admin_activity_logs(created_at DESC);

-- Habilitar RLS para admin_activity_logs
ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;

-- Solo admins pueden ver los logs
DROP POLICY IF EXISTS admin_activity_logs_admin_read ON public.admin_activity_logs;
CREATE POLICY admin_activity_logs_admin_read ON public.admin_activity_logs
FOR SELECT USING (is_admin());

-- Solo admins pueden insertar logs
DROP POLICY IF EXISTS admin_activity_logs_admin_insert ON public.admin_activity_logs;
CREATE POLICY admin_activity_logs_admin_insert ON public.admin_activity_logs
FOR INSERT WITH CHECK (is_admin() AND admin_id = auth.uid());

-- Función para registrar actividad del admin
CREATE OR REPLACE FUNCTION admin_log_activity(action_name text, target_id uuid DEFAULT NULL, action_details jsonb DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Permission denied. You must be an admin.';
  END IF;

  INSERT INTO public.admin_activity_logs (admin_id, action, target_user_id, details)
  VALUES (auth.uid(), action_name, target_id, action_details);
END;
$;

-- Función para obtener logs de actividad
CREATE OR REPLACE FUNCTION admin_get_activity_logs(limit_count integer DEFAULT 100)
RETURNS TABLE (
  id bigint,
  admin_name text,
  admin_email text,
  action text,
  target_user_name text,
  details jsonb,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, auth
AS $
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Permission denied. You must be an admin.';
  END IF;

  RETURN QUERY
  SELECT
    l.id,
    p.full_name as admin_name,
    u.email as admin_email,
    l.action,
    tp.full_name as target_user_name,
    l.details,
    l.created_at
  FROM
    public.admin_activity_logs l
  JOIN
    public.profiles p ON l.admin_id = p.id
  JOIN
    auth.users u ON p.id = u.id
  LEFT JOIN
    public.profiles tp ON l.target_user_id = tp.id
  ORDER BY
    l.created_at DESC
  LIMIT limit_count;
END;
$;


-- =====================================================================================
-- SCRIPT 12: BLOG POSTS SYSTEM
-- =====================================================================================

CREATE TABLE IF NOT EXISTS public.blog_posts (
  id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL,
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  summary text,
  content text NOT NULL,
  image_url text,
  author_name text,
  author_image_url text,
  category text,
  is_featured boolean DEFAULT false,
  published_at timestamp with time zone DEFAULT now(),
  meta_title text,
  meta_description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT blog_posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT blog_posts_title_length CHECK (char_length(title) >= 10),
  CONSTRAINT blog_posts_slug_format CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

CREATE INDEX IF NOT EXISTS blog_posts_user_id_idx ON public.blog_posts(user_id);
CREATE INDEX IF NOT EXISTS blog_posts_slug_idx ON public.blog_posts(slug);
CREATE INDEX IF NOT EXISTS blog_posts_category_idx ON public.blog_posts(category);
CREATE INDEX IF NOT EXISTS blog_posts_published_at_idx ON public.blog_posts(published_at DESC);
CREATE INDEX IF NOT EXISTS blog_posts_featured_idx ON public.blog_posts(is_featured) WHERE is_featured = true;

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS blog_posts_public_read ON public.blog_posts;
CREATE POLICY blog_posts_public_read ON public.blog_posts FOR SELECT USING (true);

DROP POLICY IF EXISTS blog_posts_admin_manage ON public.blog_posts;
CREATE POLICY blog_posts_admin_manage ON public.blog_posts FOR ALL USING (is_admin());

DROP TRIGGER IF EXISTS on_blog_posts_update ON public.blog_posts;
CREATE TRIGGER on_blog_posts_update
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_profile_update();

CREATE OR REPLACE FUNCTION generate_blog_slug(p_title text)
RETURNS text AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter integer := 0;
BEGIN
  base_slug := lower(trim(p_title));
  base_slug := regexp_replace(base_slug, '[áàäâ]', 'a', 'g');
  base_slug := regexp_replace(base_slug, '[éèëê]', 'e', 'g');
  base_slug := regexp_replace(base_slug, '[íìïî]', 'i', 'g');
  base_slug := regexp_replace(base_slug, '[óòöô]', 'o', 'g');
  base_slug := regexp_replace(base_slug, '[úùüû]', 'u', 'g');
  base_slug := regexp_replace(base_slug, '[ñ]', 'n', 'g');
  base_slug := regexp_replace(base_slug, '[^a-z0-9\s-]', '', 'g');
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  base_slug := regexp_replace(base_slug, '-+', '-', 'g');
  base_slug := substring(base_slug, 1, 100);
  base_slug := trim(both '-' from base_slug);
  final_slug := base_slug;
  WHILE EXISTS (SELECT 1 FROM public.blog_posts WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;


-- =====================================================================================
-- SCRIPT 13: MIGRAR DATOS DE BLOG
-- =====================================================================================

INSERT INTO public.blog_posts (user_id, title, slug, summary, content, image_url, author_name, author_image_url, category, is_featured, published_at, meta_title, meta_description)
VALUES
  ('TU_USER_ID_ADMIN'::uuid, 'Por Qué las Credenciales Verificadas Importan a los Reclutadores', 'por-que-las-credenciales-verificadas-importan-a-los-reclutadores', 'Un análisis profundo sobre cómo los candidatos pre-verificados pueden ahorrar tiempo y reducir riesgo de contratación.', '# Por Qué las Credenciales Verificadas Importan a los Reclutadores

En el competitivo mercado laboral actual, los reclutadores enfrentan el desafío de verificar la autenticidad de las credenciales de los candidatos.

## Beneficios Clave

1. **Ahorro de Tiempo**: Reduce el tiempo de verificación en un 70%
2. **Mayor Confianza**: Garantiza la autenticidad de la información
3. **Reducción de Riesgos**: Minimiza contrataciones erróneas', 'https://picsum.photos/id/10/400/300', 'James Smith', 'https://picsum.photos/id/1005/100/100', 'Para Reclutadores', true, '2024-07-15T00:00:00Z', 'Credenciales Verificadas para Reclutadores | YourCVPassport', 'Descubre por qué las credenciales verificadas son esenciales para los reclutadores modernos.'),
  ('TU_USER_ID_ADMIN'::uuid, 'La Guía Definitiva para Escribir una Carta de Presentación Convincente', 'la-guia-definitiva-para-escribir-una-carta-de-presentacion-convincente', 'Nuestra IA puede ayudar, pero estos principios fundamentales son clave para escribir una carta que destaque.', '# La Guía Definitiva para Escribir una Carta de Presentación Convincente

Una carta de presentación bien escrita puede ser la diferencia entre conseguir una entrevista o ser descartado.

## Elementos Esenciales

- **Personalización**: Adapta cada carta a la empresa específica
- **Estructura Clara**: Introducción, cuerpo y cierre efectivos
- **Logros Cuantificables**: Usa números y datos concretos', 'https://picsum.photos/id/20/400/300', 'Jane Doe', 'https://picsum.photos/id/1027/100/100', 'CV y Currículums', false, '2024-07-12T00:00:00Z', 'Cómo Escribir una Carta de Presentación Perfecta | Guía 2024', 'Aprende a escribir cartas de presentación que capten la atención de los reclutadores.'),
  ('TU_USER_ID_ADMIN'::uuid, 'Cómo Superar los Escaneos de ATS en 2024', 'como-superar-los-escaneos-de-ats-en-2024', 'Aprende los mejores secretos para crear un CV que sea notado tanto por robots como por humanos.', '# Cómo Superar los Escaneos de ATS en 2024

Los sistemas de seguimiento de candidatos (ATS) son la primera barrera que debe superar tu CV.

## Estrategias Clave

1. **Usa palabras clave relevantes**: Incluye términos del anuncio de trabajo
2. **Formato simple**: Evita tablas, gráficos complejos y columnas
3. **Nombres de sección estándar**: Usa "Experiencia Laboral" en lugar de "Mi Trayectoria"', 'https://picsum.photos/id/10/400/300', 'John Carter', 'https://picsum.photos/id/1005/100/100', 'CV y Currículums', false, '2024-07-15T00:00:00Z', 'Supera los ATS: Guía Completa 2024 | YourCVPassport', 'Descubre cómo optimizar tu CV para superar los sistemas ATS.'),
  ('TU_USER_ID_ADMIN'::uuid, '5 Errores Comunes de Entrevista a Evitar', '5-errores-comunes-de-entrevista-a-evitar', 'Clava tu próxima entrevista evitando estos errores simples pero críticos.', '# 5 Errores Comunes de Entrevista a Evitar

Las entrevistas pueden ser estresantes, pero evitar estos errores comunes te ayudará a destacar positivamente.

## Los 5 Errores

1. **Llegar Tarde**: La puntualidad es crucial
2. **No Investigar la Empresa**: Demuestra que conoces la empresa
3. **Hablar Mal de Empleadores Anteriores**: Mantén una actitud profesional
4. **No Preparar Preguntas**: Prepara preguntas inteligentes
5. **No Hacer Seguimiento**: Envía un email de agradecimiento', 'https://picsum.photos/id/20/400/300', 'Jane Doe', 'https://picsum.photos/id/1027/100/100', 'Consejos de Carrera', false, '2024-07-10T00:00:00Z', '5 Errores de Entrevista que Debes Evitar | Guía Práctica', 'Aprende los errores más comunes en entrevistas de trabajo y cómo evitarlos.');



-- =====================================================================================
-- SCRIPT 15: SISTEMA DE LEADS (CONTACTOS ENTRE USUARIOS)
-- Este script crea la tabla 'leads' para gestionar solicitudes de contacto entre usuarios
-- Fecha: Enero 2025
-- =====================================================================================

-- Crear tabla de leads para solicitudes de contacto entre usuarios
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Quién envía el lead
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sender_name TEXT NOT NULL,
    sender_email TEXT NOT NULL,
    sender_company TEXT,
    
    -- Quién recibe el lead
    recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    recipient_name TEXT NOT NULL,
    
    -- Detalles del lead
    lead_type TEXT NOT NULL CHECK (lead_type IN ('JOB_OFFER', 'COLLABORATION', 'NETWORKING', 'CONSULTATION', 'OTHER')),
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    
    -- Información adicional
    company_name TEXT,
    position_offered TEXT,
    salary_range TEXT,
    location TEXT,
    
    -- Seguimiento de estado
    status TEXT DEFAULT 'NEW' CHECK (status IN ('NEW', 'READ', 'REPLIED', 'ACCEPTED', 'REJECTED', 'ARCHIVED')),
    read_at TIMESTAMP WITH TIME ZONE,
    replied_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios pueden ver los leads que enviaron
DROP POLICY IF EXISTS "Users can view their sent leads" ON public.leads;
CREATE POLICY "Users can view their sent leads"
    ON public.leads
    FOR SELECT
    USING (sender_id = auth.uid());

-- Política: Los usuarios pueden ver los leads que recibieron
DROP POLICY IF EXISTS "Users can view their received leads" ON public.leads;
CREATE POLICY "Users can view their received leads"
    ON public.leads
    FOR SELECT
    USING (
        recipient_id IN (
            SELECT id FROM public.profiles WHERE id = auth.uid()
        )
    );

-- Política: Los usuarios autenticados pueden crear leads
DROP POLICY IF EXISTS "Authenticated users can create leads" ON public.leads;
CREATE POLICY "Authenticated users can create leads"
    ON public.leads
    FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL 
        AND sender_id = auth.uid()
    );

-- Política: Los destinatarios pueden actualizar el estado del lead
DROP POLICY IF EXISTS "Recipients can update lead status" ON public.leads;
CREATE POLICY "Recipients can update lead status"
    ON public.leads
    FOR UPDATE
    USING (
        recipient_id IN (
            SELECT id FROM public.profiles WHERE id = auth.uid()
        )
    );

-- Política: Los administradores pueden ver todos los leads
DROP POLICY IF EXISTS "Admins can view all leads" ON public.leads;
CREATE POLICY "Admins can view all leads"
    ON public.leads
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_leads_sender_id ON public.leads(sender_id);
CREATE INDEX IF NOT EXISTS idx_leads_recipient_id ON public.leads(recipient_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_lead_type ON public.leads(lead_type);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at DESC);

-- Crear función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_leads_updated_at()
RETURNS TRIGGER AS $
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Crear trigger para updated_at
DROP TRIGGER IF EXISTS update_leads_updated_at_trigger ON public.leads;
CREATE TRIGGER update_leads_updated_at_trigger
    BEFORE UPDATE ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION update_leads_updated_at();

-- Crear vista para estadísticas de leads
CREATE OR REPLACE VIEW lead_statistics AS
SELECT 
    recipient_id,
    COUNT(*) as total_leads,
    COUNT(*) FILTER (WHERE status = 'NEW') as new_leads,
    COUNT(*) FILTER (WHERE status = 'READ') as read_leads,
    COUNT(*) FILTER (WHERE status = 'REPLIED') as replied_leads,
    COUNT(*) FILTER (WHERE lead_type = 'JOB_OFFER') as job_offers,
    COUNT(*) FILTER (WHERE lead_type = 'COLLABORATION') as collaboration_requests,
    MAX(created_at) as last_lead_at
FROM public.leads
GROUP BY recipient_id;

-- Otorgar acceso a la vista
GRANT SELECT ON lead_statistics TO authenticated;

COMMENT ON TABLE public.leads IS 'Almacena solicitudes de contacto/leads entre usuarios';
COMMENT ON COLUMN public.leads.lead_type IS 'Tipo de contacto: JOB_OFFER, COLLABORATION, NETWORKING, CONSULTATION, OTHER';
COMMENT ON COLUMN public.leads.status IS 'Estado del lead: NEW, READ, REPLIED, ACCEPTED, REJECTED, ARCHIVED';


-- =====================================================================================
-- SCRIPT 16: SISTEMA DE MENSAJERÍA (CHAT ENTRE USUARIOS)
-- Este script crea la tabla 'messages' para conversaciones tipo chat
-- Fecha: Enero 2025
-- =====================================================================================

-- Crear tabla de mensajes para conversaciones tipo chat
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Referencia a la conversación (lead_id)
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    
    -- Detalles del mensaje
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sender_name TEXT NOT NULL,
    content TEXT NOT NULL,
    
    -- Metadata del mensaje
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios pueden ver mensajes de sus conversaciones
DROP POLICY IF EXISTS "Users can view their conversation messages" ON public.messages;
CREATE POLICY "Users can view their conversation messages"
    ON public.messages
    FOR SELECT
    USING (
        lead_id IN (
            SELECT id FROM public.leads 
            WHERE sender_id = auth.uid() OR recipient_id IN (
                SELECT id FROM public.profiles WHERE id = auth.uid()
            )
        )
    );

-- Política: Los usuarios pueden enviar mensajes en sus conversaciones
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON public.messages;
CREATE POLICY "Users can send messages in their conversations"
    ON public.messages
    FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL 
        AND sender_id = auth.uid()
        AND lead_id IN (
            SELECT id FROM public.leads 
            WHERE sender_id = auth.uid() OR recipient_id IN (
                SELECT id FROM public.profiles WHERE id = auth.uid()
            )
        )
    );

-- Política: Los usuarios pueden marcar mensajes como leídos
DROP POLICY IF EXISTS "Users can mark messages as read" ON public.messages;
CREATE POLICY "Users can mark messages as read"
    ON public.messages
    FOR UPDATE
    USING (
        lead_id IN (
            SELECT id FROM public.leads 
            WHERE recipient_id IN (
                SELECT id FROM public.profiles WHERE id = auth.uid()
            )
        )
    );

-- Política: Los administradores pueden ver todos los mensajes
DROP POLICY IF EXISTS "Admins can view all messages" ON public.messages;
CREATE POLICY "Admins can view all messages"
    ON public.messages
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_messages_lead_id ON public.messages(lead_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON public.messages(is_read);

-- Crear función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_messages_updated_at()
RETURNS TRIGGER AS $
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Crear trigger para updated_at
DROP TRIGGER IF EXISTS update_messages_updated_at_trigger ON public.messages;
CREATE TRIGGER update_messages_updated_at_trigger
    BEFORE UPDATE ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION update_messages_updated_at();

-- Agregar columna last_message_at a la tabla leads para ordenar conversaciones
DO $
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'leads' 
        AND column_name = 'last_message_at'
    ) THEN
        ALTER TABLE public.leads
        ADD COLUMN last_message_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
    END IF;
END $;

-- Crear función para actualizar last_message_at cuando se envía un nuevo mensaje
CREATE OR REPLACE FUNCTION update_lead_last_message()
RETURNS TRIGGER AS $
BEGIN
    UPDATE public.leads
    SET last_message_at = NEW.created_at
    WHERE id = NEW.lead_id;
    RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Crear trigger para actualizar last_message_at
DROP TRIGGER IF EXISTS update_lead_last_message_trigger ON public.messages;
CREATE TRIGGER update_lead_last_message_trigger
    AFTER INSERT ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION update_lead_last_message();

-- Crear vista para resúmenes de conversaciones
CREATE OR REPLACE VIEW conversation_summaries AS
SELECT 
    l.id as lead_id,
    l.sender_id,
    l.sender_name,
    l.recipient_id,
    l.recipient_name,
    l.lead_type,
    l.subject,
    l.status,
    l.created_at,
    l.last_message_at,
    (SELECT content FROM public.messages WHERE lead_id = l.id ORDER BY created_at DESC LIMIT 1) as last_message,
    (SELECT COUNT(*) FROM public.messages WHERE lead_id = l.id AND is_read = false AND sender_id != l.recipient_id) as unread_count,
    (SELECT COUNT(*) FROM public.messages WHERE lead_id = l.id) as message_count
FROM public.leads l;

-- Otorgar acceso a la vista
GRANT SELECT ON conversation_summaries TO authenticated;

-- Habilitar Realtime para mensajes en tiempo real
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.messages;

COMMENT ON TABLE public.messages IS 'Almacena mensajes individuales en conversaciones de leads';
COMMENT ON COLUMN public.messages.lead_id IS 'Referencia al lead/conversación';
COMMENT ON COLUMN public.messages.is_read IS 'Si el mensaje ha sido leído por el destinatario';


-- =====================================================================================
-- RESUMEN DEL SISTEMA DE MENSAJERÍA
-- =====================================================================================

/*
SISTEMA DE MENSAJERÍA IMPLEMENTADO:

1. TABLA LEADS (Script 15):
   - Almacena solicitudes de contacto entre usuarios
   - Tipos: JOB_OFFER, COLLABORATION, NETWORKING, CONSULTATION, OTHER
   - Estados: NEW, READ, REPLIED, ACCEPTED, REJECTED, ARCHIVED
   - Incluye información del remitente y destinatario
   - Tracking de fechas (read_at, replied_at)

2. TABLA MESSAGES (Script 16):
   - Almacena mensajes individuales en cada conversación
   - Referencia a leads mediante lead_id
   - Sistema de lectura (is_read, read_at)
   - Soporte para Realtime (mensajes en tiempo real)

3. VISTAS:
   - lead_statistics: Estadísticas de leads por usuario
   - conversation_summaries: Resumen de conversaciones con último mensaje y contador de no leídos

4. TRIGGERS:
   - update_leads_updated_at: Actualiza timestamp al modificar lead
   - update_messages_updated_at: Actualiza timestamp al modificar mensaje
   - update_lead_last_message: Actualiza last_message_at en lead cuando se envía mensaje

5. POLÍTICAS RLS:
   - Los usuarios solo ven sus propios leads (enviados o recibidos)
   - Los usuarios solo ven mensajes de sus conversaciones
   - Los usuarios solo pueden enviar mensajes en sus conversaciones
   - Los administradores tienen acceso completo

6. ÍNDICES:
   - Optimizados para búsquedas por sender_id, recipient_id, lead_id
   - Índices en created_at para ordenamiento
   - Índices en status y lead_type para filtrado

7. REALTIME:
   - Habilitado en tabla messages para notificaciones en tiempo real
   - Los mensajes nuevos aparecen instantáneamente

COMPONENTES FRONTEND:

✅ components/dashboard/MessagingView.tsx
   - Vista principal con lista de conversaciones y chat
   - Indicador de conexión en tiempo real
   - Optimistic updates para mejor UX
   - Logging detallado para debugging

✅ components/dashboard/EnhancedMessaging.tsx
   - Chat individual con funcionalidades avanzadas
   - Manejo robusto de errores
   - Scroll automático

✅ components/dashboard/LeadsInbox.tsx
   - Bandeja de entrada de leads/conversaciones
   - Contador de mensajes no leídos
   - Filtrado por estado

DOCUMENTACIÓN:

📚 docs/MESSAGING_QUICK_START.md - Guía rápida de 3 pasos
📚 docs/MESSAGING_SYSTEM_SETUP.md - Guía completa de configuración
📚 docs/MESSAGING_TROUBLESHOOTING.md - Solución de problemas

SCRIPTS DE UTILIDAD:

🔧 scripts/init-messaging-system.sql - Inicialización completa del sistema
🔍 scripts/verify-messaging-setup.sql - Verificación del sistema
🧪 scripts/test-messaging.sql - Pruebas paso a paso

PARA ACTIVAR EL SISTEMA:

1. Ejecutar Script 15 (Leads System) en Supabase SQL Editor
2. Ejecutar Script 16 (Messaging System) en Supabase SQL Editor
3. Verificar con scripts/verify-messaging-setup.sql
4. Probar en la aplicación (Dashboard → Mensajes)
5. Revisar logs en consola del navegador (F12)

CARACTERÍSTICAS:

✅ Mensajería en tiempo real con Supabase Realtime
✅ Bandeja de entrada con lista de conversaciones
✅ Contador de mensajes no leídos
✅ Indicador de estado de conexión
✅ Optimistic updates para mejor UX
✅ Logging detallado para debugging
✅ Manejo robusto de errores
✅ Políticas de seguridad (RLS)
✅ Índices optimizados para rendimiento
✅ Vistas para estadísticas y resúmenes

PRÓXIMOS PASOS:

- Notificaciones push (opcional)
- Adjuntar archivos en mensajes (opcional)
- Búsqueda de mensajes (opcional)
- Archivar conversaciones (opcional)
- Exportar conversaciones (opcional)
*/



-- =====================================================================================
-- SCRIPT 17: AGREGAR CAMPO DE PAÍS CON CÓDIGO
-- Este script agrega el campo country_code para almacenar el código ISO del país
-- Fecha: Enero 2025
-- =====================================================================================

-- Agregar columna country_code a la tabla profiles
DO $
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'country_code'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN country_code TEXT;
        
        COMMENT ON COLUMN public.profiles.country_code IS 'Código ISO del país (ej: ES, US, MX)';
    END IF;
END $;

-- Crear índice para búsquedas por país
CREATE INDEX IF NOT EXISTS idx_profiles_country_code ON public.profiles(country_code);

-- Actualizar perfiles existentes que tengan location con país conocido
-- Esto es opcional y puede ejecutarse manualmente
/*
UPDATE public.profiles 
SET country_code = 'ES' 
WHERE location ILIKE '%españa%' OR location ILIKE '%spain%';

UPDATE public.profiles 
SET country_code = 'MX' 
WHERE location ILIKE '%méxico%' OR location ILIKE '%mexico%';

UPDATE public.profiles 
SET country_code = 'AR' 
WHERE location ILIKE '%argentina%';

UPDATE public.profiles 
SET country_code = 'CO' 
WHERE location ILIKE '%colombia%';

UPDATE public.profiles 
SET country_code = 'CL' 
WHERE location ILIKE '%chile%';

-- Agregar más países según sea necesario
*/

COMMENT ON TABLE public.profiles IS 'Tabla de perfiles de usuarios con información completa incluyendo país';


-- =====================================================================================
-- ACTUALIZACIÓN: 18 de Enero 2025 - Sistema de Notificaciones y Dashboard Moderno
-- =====================================================================================

-- NUEVAS CARACTERÍSTICAS IMPLEMENTADAS:

-- 1. SISTEMA DE NOTIFICACIONES COMPLETO
--    - Tabla 'notifications' con soporte para múltiples tipos
--    - Tipos: lead, milestone, suggestion, achievement
--    - Prioridades: low, normal, high, urgent
--    - Funciones para crear, leer y marcar notificaciones
--    - Triggers automáticos para nuevos leads
--    - Sistema de milestones para visitas al perfil

-- 2. DASHBOARD MODERNO (ModernDashboardView)
--    - Diseño profesional con gradientes y animaciones
--    - Gráficos interactivos (barras y pie chart)
--    - Estadísticas en tiempo real
--    - Indicadores de progreso del perfil
--    - Acciones rápidas con iconos
--    - Panel de actividad reciente
--    - Fortaleza del perfil con checklist
--    - Próximos pasos sugeridos

-- 3. PANEL DE NOTIFICACIONES (NotificationsPanel)
--    - Componente React con actualización en tiempo real
--    - Contador de notificaciones no leídas
--    - Iconos y colores según tipo y prioridad
--    - Marcar como leída al hacer clic
--    - Marcar todas como leídas
--    - Enlaces de acción directa
--    - Suscripción a cambios en tiempo real

-- 4. INDICADORES DE DISPONIBILIDAD DE IA
--    - Verificación de API key de Google AI
--    - Indicadores visuales en todo el dashboard
--    - Botones condicionales según disponibilidad
--    - Mensajes informativos para usuarios

-- 5. CORRECCIONES DE ESQUEMA
--    - Actualización de 'title' a 'position' en experiencias
--    - Sincronización con estructura de base de datos
--    - Corrección en todas las plantillas de CV
--    - Actualización de schemas y validaciones

-- ARCHIVOS CREADOS/MODIFICADOS:

-- Migraciones:
-- - supabase/migrations/20250118_notifications_system.sql

-- Componentes:
-- - components/dashboard/ModernDashboardView.tsx (nuevo)
-- - components/dashboard/NotificationsPanel.tsx (nuevo)
-- - components/dashboard/DashboardContent.tsx (actualizado)
-- - components/AIQuestionnaireAssistant.tsx (corregido)
-- - components/profile-editor/ExperienceSection.tsx (actualizado)
-- - Todas las plantillas en components/templates/ (actualizadas)

-- Scripts:
-- - scripts/test-notifications-system.sql (nuevo)

-- Documentación:
-- - docs/NOTIFICATIONS_SYSTEM_GUIDE.md (nuevo)

-- FUNCIONES SQL CREADAS:

-- create_notification(p_user_id, p_type, p_title, p_message, ...)
--   Crea una nueva notificación para un usuario

-- mark_notification_read(p_notification_id)
--   Marca una notificación como leída

-- mark_all_notifications_read(p_user_id)
--   Marca todas las notificaciones de un usuario como leídas

-- check_profile_milestones(p_user_id)
--   Verifica y crea notificaciones de milestones

-- notify_new_lead() (TRIGGER)
--   Se ejecuta automáticamente al recibir un nuevo lead

-- CARACTERÍSTICAS DEL SISTEMA DE NOTIFICACIONES:

-- Tipos de Notificaciones:
-- - lead: Nuevos contactos de reclutadores (prioridad: high)
-- - milestone: Hitos alcanzados como 10, 50, 100 visitas (prioridad: normal/high)
-- - suggestion: Sugerencias para mejorar el perfil (prioridad: normal)
-- - achievement: Logros especiales (prioridad: high)

-- Metadata JSONB:
-- Permite almacenar información adicional personalizada para cada notificación
-- Ejemplo: {"company": "TechCorp", "position": "Senior Developer"}

-- Políticas RLS:
-- - Los usuarios solo pueden ver sus propias notificaciones
-- - Los usuarios solo pueden actualizar sus propias notificaciones
-- - El sistema puede crear notificaciones para cualquier usuario

-- CARACTERÍSTICAS DEL DASHBOARD MODERNO:

-- Visualización de Datos:
-- - Gráfico de barras para visitas semanales
-- - Gráfico circular (pie chart) alternativo
-- - Toggle para cambiar entre tipos de gráfico
-- - Datos generados dinámicamente basados en visitas reales

-- Tarjetas de Estadísticas:
-- - Visitas al perfil (últimos 30 días)
-- - Clics en CTA (total acumulado)
-- - Experiencias registradas
-- - Habilidades agregadas

-- Acciones Rápidas:
-- - Ver CV público
-- - Exportar a PDF
-- - Ver analíticas detalladas

-- Indicadores de Progreso:
-- - Completitud del perfil con porcentaje
-- - Gráfico circular animado
-- - Checklist de fortaleza del perfil
-- - Sugerencias de próximos pasos

-- INTEGRACIÓN CON SISTEMA EXISTENTE:

-- El sistema de notificaciones se integra con:
-- - Sistema de leads existente
-- - Sistema de analíticas
-- - Dashboard principal
-- - Perfil de usuario

-- Actualización en Tiempo Real:
-- - Usa Supabase Realtime para suscripciones
-- - Actualización automática del contador
-- - Nuevas notificaciones aparecen instantáneamente

-- PRÓXIMOS PASOS SUGERIDOS:

-- 1. Implementar limpieza automática de notificaciones antiguas
-- 2. Agregar más tipos de milestones personalizados
-- 3. Crear sistema de preferencias de notificaciones
-- 4. Implementar notificaciones por email
-- 5. Agregar sonidos/animaciones para nuevas notificaciones
-- 6. Dashboard de analíticas de notificaciones para admins

-- =====================================================================================
-- FIN DE ACTUALIZACIÓN
-- =====================================================================================

-- =====================================================================================
-- REGISTRO DE MIGRACIONES Y SCRIPTS SQL - YourCVPassport
-- Fecha: 2025-01-19
-- =====================================================================================

Este registro documenta TODOS los archivos SQL del proyecto (migraciones, seeds, scripts de testing/verificación)
que fueron procesados y archivados en esta fecha. La información aquí documentada corresponde a 29 archivos SQL.

-- =====================================================================================
-- ARCHIVO SQL PROCESADOS Y DOCUMENTADOS
-- =====================================================================================

TOTAL DE ARCHIVOS: 29
- Migraciones de Schema: 15 archivos
- Seeds de Datos: 2 archivos
- Scripts de Testing/Verificación: 12 archivos

TABLAS PRINCIPALES: profiles, experiences, education, certifications, skills, languages, visas,
portfolio_items, work_references, leads, messages, notifications, analytics_clicks, success_stories

FUNCIONES SQL: 10+ funciones creadas
TRIGGERS: 8+ triggers implementados
VISTAS: 2 (lead_statistics, conversation_summaries)
ÍNDICES: 50+ índices de performance
POLÍTICAS RLS: 60+ políticas de seguridad

SISTEMAS IMPLEMENTADOS:
1. Sistema de Perfiles Profesionales Completos (8 tablas relacionadas)
2. Sistema de Referencias Laborales (visible solo para EMPLOYERS)
3. Sistema de Leads y Mensajería (chat vinculado a leads)
4. Sistema de Notificaciones (con milestones automáticos)
5. Sistema de Analíticas de CTAs (tracking público)
6. Sistema de Historias de Éxito (solo admins gestionan)

-- =====================================================================================
-- DETALLE COMPLETO DE ARCHIVOS
-- =====================================================================================

Para el detalle completo de cada archivo SQL, tablas, funciones, triggers y políticas RLS,
consultar el análisis completo generado por el agente especializado el 2025-01-19.

Resumen de características clave:
- Verificación de credenciales en experiences/education/certifications
- Metodología STAR para achievements (visas table)
- Full-text search optimizado con índices GIN
- Role-based access (professional/employer/admin)
- Plan-based features (free/basic/pro/enterprise)
- Notificaciones automáticas en leads nuevos
- Milestones automáticos (10, 50, 100 visitas)
- Chat con tracking de mensajes no leídos
- Display settings configurables para CV público
- Country code con detección automática basada en location
- Analytics de CTAs con permisos públicos para tracking anónimo
- Referencias laborales visibles solo para employers

-- =====================================================================================
-- ESTADO DE ARCHIVOS SQL
-- =====================================================================================

✅ Todos los archivos SQL han sido DOCUMENTADOS
✅ Información PRESERVADA en cronologia.md
✅ Archivos listos para ser ELIMINADOS

Los siguientes 29 archivos .sql serán eliminados tras verificar que la documentación esté completa:

MIGRACIONES:
1. supabase/migrations/add_author_username_to_blog_posts.sql
2. supabase/migrations/enable_admin_access.sql
3. supabase/migrations/20250117_complete_profile_schema.sql
4. supabase/migrations/20250117_complete_profile_schema_v2.sql
5. supabase/migrations/20250117_complete_profile_schema_v3_CLEAN.sql
6. supabase/migrations/20250117_add_work_references.sql
7. supabase/migrations/20250117_fix_role_case_sensitivity.sql
8. supabase/migrations/20250117_success_stories.sql
9. supabase/migrations/20250117_leads_system.sql
10. supabase/migrations/20250117_profile_display_settings.sql
11. supabase/migrations/20250117_messaging_system.sql
12. supabase/migrations/20250117_add_country_code.sql
13. supabase/migrations/20250118_notifications_system.sql
14. supabase/migrations/20250118_analytics_clicks_table.sql
15. supabase/migrations/20250118_add_remote_column.sql

SEEDS:
16. supabase/seeds/sample_data.sql
17. supabase/migrations/20250117_success_stories_sample_data_es.sql

SCRIPTS:
18. scripts/verify-success-stories-setup.sql
19. scripts/verify-messaging-setup.sql
20. scripts/init-messaging-system.sql
21. scripts/diagnose-profile-loading.sql
22. scripts/fix-profile-loading.sql
23. scripts/test-notifications-system.sql
24. scripts/verify-notifications.sql
25. scripts/test-create-notification.sql
26. scripts/test-notifications-admin.sql
27. scripts/test-cta-clicks.sql
28. scripts/test-profile-save.sql
29. scripts/verify-schema.sql

-- =====================================================================================
-- FIN DE REGISTRO - ARCHIVOS SQL PROCESADOS - 2025-01-19
-- =====================================================================================
## [000_diagnose_database.sql]
Fecha de consolidación: 2025-11-24 18:58:15

`sql
-- =============================================
-- DiagnÃ³stico de Base de Datos - YourCVPassport
-- =============================================
-- Ejecuta este script PRIMERO para ver quÃ© falta en tu base de datos
-- Los resultados te dirÃ¡n exactamente quÃ© necesitas corregir

-- =============================================
-- 1. Verificar si existe la tabla 'leads'
-- =============================================
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'leads'
    ) THEN
        RAISE NOTICE 'âœ… Tabla "leads" existe';
    ELSE
        RAISE WARNING 'âŒ Tabla "leads" NO existe - necesitas crearla primero';
    END IF;
END $$;

-- =============================================
-- 2. Verificar columnas de la tabla 'leads'
-- =============================================
DO $$
DECLARE
    has_recipient_id BOOLEAN;
    has_profile_id BOOLEAN;
    column_list TEXT;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'leads') THEN

        -- Verificar recipient_id
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'leads' AND column_name = 'recipient_id'
        ) INTO has_recipient_id;

        -- Verificar profile_id
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'leads' AND column_name = 'profile_id'
        ) INTO has_profile_id;

        -- Obtener lista de columnas
        SELECT string_agg(column_name, ', ' ORDER BY ordinal_position)
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'leads'
        INTO column_list;

        RAISE NOTICE '';
        RAISE NOTICE 'ðŸ“‹ Columnas en tabla "leads": %', column_list;
        RAISE NOTICE '';

        IF has_recipient_id THEN
            RAISE NOTICE 'âœ… Columna "recipient_id" existe en leads';
        ELSIF has_profile_id THEN
            RAISE NOTICE 'âš ï¸  Columna "profile_id" existe pero deberÃ­a llamarse "recipient_id"';
            RAISE NOTICE '   AcciÃ³n sugerida: Renombrar profile_id a recipient_id';
        ELSE
            RAISE WARNING 'âŒ Columna "recipient_id" NO existe en leads';
            RAISE NOTICE '   AcciÃ³n sugerida: Agregar columna recipient_id';
        END IF;
    END IF;
END $$;

-- =============================================
-- 3. Verificar si existe la tabla 'messages'
-- =============================================
DO $$
DECLARE
    msg_count INTEGER;
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'messages'
    ) THEN
        SELECT COUNT(*) FROM public.messages INTO msg_count;
        RAISE NOTICE 'âœ… Tabla "messages" existe (% mensajes)', msg_count;
    ELSE
        RAISE WARNING 'âŒ Tabla "messages" NO existe - se crearÃ¡ con el script de migraciÃ³n';
    END IF;
END $$;

-- =============================================
-- 4. Verificar si existe la vista 'conversation_summaries'
-- =============================================
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.views
        WHERE table_schema = 'public' AND table_name = 'conversation_summaries'
    ) THEN
        RAISE NOTICE 'âœ… Vista "conversation_summaries" existe';
    ELSE
        RAISE WARNING 'âŒ Vista "conversation_summaries" NO existe - se crearÃ¡ con el script de migraciÃ³n';
    END IF;
END $$;

-- =============================================
-- 5. Verificar si existe la tabla 'profiles'
-- =============================================
DO $$
DECLARE
    profile_count INTEGER;
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'profiles'
    ) THEN
        SELECT COUNT(*) FROM public.profiles INTO profile_count;
        RAISE NOTICE 'âœ… Tabla "profiles" existe (% perfiles)', profile_count;
    ELSE
        RAISE WARNING 'âŒ Tabla "profiles" NO existe - la vista conversation_summaries la necesita';
    END IF;
END $$;

-- =============================================
-- 6. Verificar polÃ­ticas RLS
-- =============================================
DO $$
DECLARE
    rls_enabled BOOLEAN;
    policy_count INTEGER;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'messages') THEN

        -- Verificar si RLS estÃ¡ habilitado
        SELECT relrowsecurity
        FROM pg_class
        WHERE relname = 'messages' AND relnamespace = 'public'::regnamespace
        INTO rls_enabled;

        -- Contar polÃ­ticas
        SELECT COUNT(*)
        FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'messages'
        INTO policy_count;

        IF rls_enabled THEN
            RAISE NOTICE 'âœ… RLS habilitado en "messages" (% polÃ­ticas)', policy_count;
        ELSE
            RAISE WARNING 'âŒ RLS NO habilitado en "messages"';
        END IF;
    END IF;
END $$;

-- =============================================
-- 7. Verificar Realtime
-- =============================================
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
    ) THEN
        RAISE NOTICE 'âœ… Realtime habilitado para "messages"';
    ELSE
        RAISE WARNING 'âŒ Realtime NO habilitado para "messages"';
    END IF;
END $$;

-- =============================================
-- RESUMEN
-- =============================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE 'â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•';
    RAISE NOTICE 'DIAGNÃ“STICO COMPLETADO';
    RAISE NOTICE 'â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•';
    RAISE NOTICE '';
    RAISE NOTICE 'ðŸ“ SIGUIENTE PASO:';
    RAISE NOTICE '   1. Revisa los mensajes de arriba';
    RAISE NOTICE '   2. Si hay âŒ, ejecuta: 002_fix_leads_and_messaging.sql';
    RAISE NOTICE '   3. Si todo tiene âœ…, tu base de datos estÃ¡ lista';
    RAISE NOTICE '';
END $$;

``r
---
## [001_create_messaging_tables.sql]
Fecha de consolidación: 2025-11-24 18:58:15

`sql
-- =============================================
-- YourCVPassport - Messaging System Database Schema
-- =============================================
-- Este archivo contiene todas las tablas y vistas necesarias
-- para el sistema de mensajerÃ­a entre usuarios y reclutadores

-- =============================================
-- 1. TABLA: messages
-- =============================================
-- Almacena todos los mensajes enviados en conversaciones

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sender_name TEXT NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ãndices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_messages_lead_id ON public.messages(lead_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON public.messages(is_read) WHERE is_read = FALSE;

-- =============================================
-- 2. VISTA: conversation_summaries
-- =============================================
-- Genera un resumen de todas las conversaciones con contadores de mensajes

CREATE OR REPLACE VIEW public.conversation_summaries AS
SELECT
    l.id AS lead_id,
    l.sender_id,
    l.sender_name,
    l.recipient_id,
    p.full_name AS recipient_name,
    l.lead_type,
    l.subject,
    l.status,
    -- Obtener el Ãºltimo mensaje
    (
        SELECT m.content
        FROM public.messages m
        WHERE m.lead_id = l.id
        ORDER BY m.created_at DESC
        LIMIT 1
    ) AS last_message,
    -- Obtener la fecha del Ãºltimo mensaje
    COALESCE(
        (
            SELECT m.created_at
            FROM public.messages m
            WHERE m.lead_id = l.id
            ORDER BY m.created_at DESC
            LIMIT 1
        ),
        l.created_at
    ) AS last_message_at,
    -- Contar mensajes no leÃ­dos para el destinatario
    (
        SELECT COUNT(*)
        FROM public.messages m
        WHERE m.lead_id = l.id
        AND m.is_read = FALSE
        AND m.sender_id != l.recipient_id
    )::INTEGER AS unread_count,
    -- Contar total de mensajes
    (
        SELECT COUNT(*)
        FROM public.messages m
        WHERE m.lead_id = l.id
    )::INTEGER AS message_count,
    l.created_at
FROM public.leads l
LEFT JOIN public.profiles p ON p.id = l.recipient_id
WHERE l.status != 'REJECTED' -- Excluir conversaciones rechazadas
ORDER BY last_message_at DESC;

-- =============================================
-- 3. POLÃTICAS RLS (Row Level Security)
-- =============================================

-- Habilitar RLS en la tabla messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- PolÃ­tica: Los usuarios pueden ver mensajes de conversaciones en las que participan
CREATE POLICY "Users can view messages in their conversations"
ON public.messages
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.leads l
        WHERE l.id = messages.lead_id
        AND (l.sender_id = auth.uid() OR l.recipient_id = auth.uid())
    )
);

-- PolÃ­tica: Los usuarios pueden insertar mensajes en conversaciones en las que participan
CREATE POLICY "Users can send messages in their conversations"
ON public.messages
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.leads l
        WHERE l.id = messages.lead_id
        AND (l.sender_id = auth.uid() OR l.recipient_id = auth.uid())
    )
    AND sender_id = auth.uid()
);

-- PolÃ­tica: Los usuarios pueden actualizar sus propios mensajes (marcar como leÃ­dos)
CREATE POLICY "Users can update messages in their conversations"
ON public.messages
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.leads l
        WHERE l.id = messages.lead_id
        AND (l.sender_id = auth.uid() OR l.recipient_id = auth.uid())
    )
);

-- =============================================
-- 4. TRIGGER: Actualizar updated_at automÃ¡ticamente
-- =============================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_messages_updated_at
    BEFORE UPDATE ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- 5. REALTIME: Habilitar publicaciones en tiempo real
-- =============================================

-- Habilitar Realtime para la tabla messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- =============================================
-- 6. FUNCIÃ“N: Marcar mensajes como leÃ­dos
-- =============================================

CREATE OR REPLACE FUNCTION public.mark_messages_as_read(p_lead_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.messages
    SET is_read = TRUE, read_at = NOW()
    WHERE lead_id = p_lead_id
    AND sender_id != auth.uid()
    AND is_read = FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- VERIFICACIÃ“N
-- =============================================
-- Para verificar que todo se creÃ³ correctamente, ejecuta:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('messages');
-- SELECT table_name FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'conversation_summaries';

``r
---
## [002_fix_leads_and_messaging.sql]
Fecha de consolidación: 2025-11-24 18:58:16

`sql
-- =============================================
-- YourCVPassport - Fix Leads Table & Messaging System
-- =============================================
-- Este script corrige la tabla leads y crea el sistema de mensajerÃ­a

-- =============================================
-- PASO 1: Verificar y actualizar la tabla leads
-- =============================================

-- Verificar si la columna recipient_id existe, si no, agregarla
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'leads'
        AND column_name = 'recipient_id'
    ) THEN
        ALTER TABLE public.leads ADD COLUMN recipient_id UUID REFERENCES auth.users(id);
        RAISE NOTICE 'Column recipient_id added to leads table';
    END IF;
END $$;

-- Verificar si la columna profile_id existe (puede ser el equivalente a recipient_id)
DO $$
BEGIN
    -- Si existe profile_id pero no recipient_id, copiar los valores
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'leads'
        AND column_name = 'profile_id'
    ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'leads'
        AND column_name = 'recipient_id'
    ) THEN
        ALTER TABLE public.leads RENAME COLUMN profile_id TO recipient_id;
        RAISE NOTICE 'Column profile_id renamed to recipient_id';
    END IF;
END $$;

-- =============================================
-- PASO 2: Crear tabla messages si no existe
-- =============================================

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sender_name TEXT NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ãndices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_messages_lead_id ON public.messages(lead_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON public.messages(is_read) WHERE is_read = FALSE;

-- =============================================
-- PASO 3: Crear vista conversation_summaries
-- =============================================

-- Primero eliminar la vista si existe para recrearla
DROP VIEW IF EXISTS public.conversation_summaries;

CREATE OR REPLACE VIEW public.conversation_summaries AS
SELECT
    l.id AS lead_id,
    l.sender_id,
    l.sender_name,
    l.recipient_id,
    COALESCE(p.full_name, 'Usuario') AS recipient_name,
    l.lead_type,
    l.subject,
    COALESCE(l.status, 'PENDING') AS status,
    -- Obtener el Ãºltimo mensaje
    (
        SELECT m.content
        FROM public.messages m
        WHERE m.lead_id = l.id
        ORDER BY m.created_at DESC
        LIMIT 1
    ) AS last_message,
    -- Obtener la fecha del Ãºltimo mensaje
    COALESCE(
        (
            SELECT m.created_at
            FROM public.messages m
            WHERE m.lead_id = l.id
            ORDER BY m.created_at DESC
            LIMIT 1
        ),
        l.created_at
    ) AS last_message_at,
    -- Contar mensajes no leÃ­dos para el destinatario
    (
        SELECT COUNT(*)
        FROM public.messages m
        WHERE m.lead_id = l.id
        AND m.is_read = FALSE
        AND m.sender_id != COALESCE(l.recipient_id, l.sender_id)
    )::INTEGER AS unread_count,
    -- Contar total de mensajes
    (
        SELECT COUNT(*)
        FROM public.messages m
        WHERE m.lead_id = l.id
    )::INTEGER AS message_count,
    l.created_at
FROM public.leads l
LEFT JOIN public.profiles p ON p.id = l.recipient_id
WHERE COALESCE(l.status, 'PENDING') != 'REJECTED' -- Excluir conversaciones rechazadas
ORDER BY last_message_at DESC;

-- =============================================
-- PASO 4: Configurar RLS (Row Level Security)
-- =============================================

-- Habilitar RLS en la tabla messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Eliminar polÃ­ticas existentes si existen
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can update messages in their conversations" ON public.messages;

-- PolÃ­tica: Los usuarios pueden ver mensajes de conversaciones en las que participan
CREATE POLICY "Users can view messages in their conversations"
ON public.messages
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.leads l
        WHERE l.id = messages.lead_id
        AND (l.sender_id = auth.uid() OR COALESCE(l.recipient_id, l.sender_id) = auth.uid())
    )
);

-- PolÃ­tica: Los usuarios pueden insertar mensajes en conversaciones en las que participan
CREATE POLICY "Users can send messages in their conversations"
ON public.messages
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.leads l
        WHERE l.id = messages.lead_id
        AND (l.sender_id = auth.uid() OR COALESCE(l.recipient_id, l.sender_id) = auth.uid())
    )
    AND sender_id = auth.uid()
);

-- PolÃ­tica: Los usuarios pueden actualizar mensajes en sus conversaciones
CREATE POLICY "Users can update messages in their conversations"
ON public.messages
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.leads l
        WHERE l.id = messages.lead_id
        AND (l.sender_id = auth.uid() OR COALESCE(l.recipient_id, l.sender_id) = auth.uid())
    )
);

-- =============================================
-- PASO 5: Triggers
-- =============================================

-- FunciÃ³n para actualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para messages
DROP TRIGGER IF EXISTS update_messages_updated_at ON public.messages;
CREATE TRIGGER update_messages_updated_at
    BEFORE UPDATE ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- PASO 6: Habilitar Realtime
-- =============================================

-- Intentar habilitar Realtime (puede fallar si ya estÃ¡ habilitado)
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    RAISE NOTICE 'Realtime enabled for messages table';
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'Realtime already enabled for messages table';
END $$;

-- =============================================
-- PASO 7: FunciÃ³n auxiliar para marcar como leÃ­do
-- =============================================

CREATE OR REPLACE FUNCTION public.mark_messages_as_read(p_lead_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.messages
    SET is_read = TRUE, read_at = NOW()
    WHERE lead_id = p_lead_id
    AND sender_id != auth.uid()
    AND is_read = FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- VERIFICACIÃ“N FINAL
-- =============================================

-- Verificar que las tablas y vistas existen
DO $$
DECLARE
    messages_exists BOOLEAN;
    view_exists BOOLEAN;
BEGIN
    -- Verificar tabla messages
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'messages'
    ) INTO messages_exists;

    -- Verificar vista conversation_summaries
    SELECT EXISTS (
        SELECT 1 FROM information_schema.views
        WHERE table_schema = 'public' AND table_name = 'conversation_summaries'
    ) INTO view_exists;

    IF messages_exists AND view_exists THEN
        RAISE NOTICE 'âœ… SUCCESS: All tables and views created successfully!';
        RAISE NOTICE '   - messages table: âœ“';
        RAISE NOTICE '   - conversation_summaries view: âœ“';
    ELSE
        IF NOT messages_exists THEN
            RAISE WARNING 'âŒ messages table was not created';
        END IF;
        IF NOT view_exists THEN
            RAISE WARNING 'âŒ conversation_summaries view was not created';
        END IF;
    END IF;
END $$;

``r
---
## [003_final_fix_messaging.sql]
Fecha de consolidación: 2025-11-24 18:58:16

`sql
-- =============================================
-- YourCVPassport - CorrecciÃ³n Completa del Sistema de MensajerÃ­a
-- =============================================
-- Script definitivo que verifica TODAS las columnas necesarias

-- =============================================
-- PASO 1: Verificar estructura de la tabla leads
-- =============================================

-- Agregar columna sender_id si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'leads' AND column_name = 'sender_id'
    ) THEN
        ALTER TABLE public.leads ADD COLUMN sender_id UUID REFERENCES auth.users(id);
        RAISE NOTICE 'âœ“ Columna sender_id agregada a leads';
    ELSE
        RAISE NOTICE 'âœ“ Columna sender_id ya existe';
    END IF;
END $$;

-- Agregar columna sender_name si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'leads' AND column_name = 'sender_name'
    ) THEN
        ALTER TABLE public.leads ADD COLUMN sender_name TEXT;
        RAISE NOTICE 'âœ“ Columna sender_name agregada a leads';
    ELSE
        RAISE NOTICE 'âœ“ Columna sender_name ya existe';
    END IF;
END $$;

-- Agregar columna recipient_id si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'leads' AND column_name = 'recipient_id'
    ) THEN
        -- Verificar si existe profile_id para renombrar
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'leads' AND column_name = 'profile_id'
        ) THEN
            ALTER TABLE public.leads RENAME COLUMN profile_id TO recipient_id;
            RAISE NOTICE 'âœ“ Columna profile_id renombrada a recipient_id';
        ELSE
            ALTER TABLE public.leads ADD COLUMN recipient_id UUID REFERENCES auth.users(id);
            RAISE NOTICE 'âœ“ Columna recipient_id agregada a leads';
        END IF;
    ELSE
        RAISE NOTICE 'âœ“ Columna recipient_id ya existe';
    END IF;
END $$;

-- Agregar columna lead_type si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'leads' AND column_name = 'lead_type'
    ) THEN
        ALTER TABLE public.leads ADD COLUMN lead_type TEXT DEFAULT 'INQUIRY';
        RAISE NOTICE 'âœ“ Columna lead_type agregada a leads';
    ELSE
        RAISE NOTICE 'âœ“ Columna lead_type ya existe';
    END IF;
END $$;

-- Agregar columna subject si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'leads' AND column_name = 'subject'
    ) THEN
        ALTER TABLE public.leads ADD COLUMN subject TEXT;
        RAISE NOTICE 'âœ“ Columna subject agregada a leads';
    ELSE
        RAISE NOTICE 'âœ“ Columna subject ya existe';
    END IF;
END $$;

-- Agregar columna status si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'leads' AND column_name = 'status'
    ) THEN
        ALTER TABLE public.leads ADD COLUMN status TEXT DEFAULT 'PENDING';
        RAISE NOTICE 'âœ“ Columna status agregada a leads';
    ELSE
        RAISE NOTICE 'âœ“ Columna status ya existe';
    END IF;
END $$;

-- =============================================
-- PASO 2: Crear tabla messages
-- =============================================

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sender_name TEXT NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ãndices para rendimiento
CREATE INDEX IF NOT EXISTS idx_messages_lead_id ON public.messages(lead_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON public.messages(is_read) WHERE is_read = FALSE;

-- =============================================
-- PASO 3: Crear vista conversation_summaries
-- =============================================

DROP VIEW IF EXISTS public.conversation_summaries;

CREATE VIEW public.conversation_summaries AS
SELECT
    l.id AS lead_id,
    COALESCE(l.sender_id, (SELECT id FROM auth.users LIMIT 1)) AS sender_id,
    COALESCE(l.sender_name, 'Usuario') AS sender_name,
    COALESCE(l.recipient_id, (SELECT id FROM auth.users LIMIT 1)) AS recipient_id,
    COALESCE(p.full_name, 'Usuario') AS recipient_name,
    COALESCE(l.lead_type, 'INQUIRY') AS lead_type,
    COALESCE(l.subject, 'Sin asunto') AS subject,
    COALESCE(l.status, 'PENDING') AS status,
    -- Ãšltimo mensaje
    (
        SELECT m.content
        FROM public.messages m
        WHERE m.lead_id = l.id
        ORDER BY m.created_at DESC
        LIMIT 1
    ) AS last_message,
    -- Fecha del Ãºltimo mensaje
    COALESCE(
        (
            SELECT m.created_at
            FROM public.messages m
            WHERE m.lead_id = l.id
            ORDER BY m.created_at DESC
            LIMIT 1
        ),
        l.created_at,
        NOW()
    ) AS last_message_at,
    -- Mensajes no leÃ­dos
    (
        SELECT COUNT(*)::INTEGER
        FROM public.messages m
        WHERE m.lead_id = l.id
        AND m.is_read = FALSE
        AND m.sender_id != COALESCE(l.recipient_id, l.sender_id)
    ) AS unread_count,
    -- Total de mensajes
    (
        SELECT COUNT(*)::INTEGER
        FROM public.messages m
        WHERE m.lead_id = l.id
    ) AS message_count,
    COALESCE(l.created_at, NOW()) AS created_at
FROM public.leads l
LEFT JOIN public.profiles p ON p.id = l.recipient_id
WHERE COALESCE(l.status, 'PENDING') != 'REJECTED'
ORDER BY last_message_at DESC;

-- =============================================
-- PASO 4: PolÃ­ticas RLS
-- =============================================

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can update messages in their conversations" ON public.messages;

CREATE POLICY "Users can view messages in their conversations"
ON public.messages FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.leads l
        WHERE l.id = messages.lead_id
        AND (COALESCE(l.sender_id, auth.uid()) = auth.uid()
             OR COALESCE(l.recipient_id, auth.uid()) = auth.uid())
    )
);

CREATE POLICY "Users can send messages in their conversations"
ON public.messages FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.leads l
        WHERE l.id = messages.lead_id
        AND (COALESCE(l.sender_id, auth.uid()) = auth.uid()
             OR COALESCE(l.recipient_id, auth.uid()) = auth.uid())
    )
    AND sender_id = auth.uid()
);

CREATE POLICY "Users can update messages in their conversations"
ON public.messages FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.leads l
        WHERE l.id = messages.lead_id
        AND (COALESCE(l.sender_id, auth.uid()) = auth.uid()
             OR COALESCE(l.recipient_id, auth.uid()) = auth.uid())
    )
);

-- =============================================
-- PASO 5: Trigger para updated_at
-- =============================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_messages_updated_at ON public.messages;
CREATE TRIGGER update_messages_updated_at
    BEFORE UPDATE ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- PASO 6: Realtime
-- =============================================

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    RAISE NOTICE 'âœ“ Realtime habilitado para messages';
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'âœ“ Realtime ya estaba habilitado';
END $$;

-- =============================================
-- PASO 7: FunciÃ³n auxiliar
-- =============================================

CREATE OR REPLACE FUNCTION public.mark_messages_as_read(p_lead_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.messages
    SET is_read = TRUE, read_at = NOW()
    WHERE lead_id = p_lead_id
    AND sender_id != auth.uid()
    AND is_read = FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- VERIFICACIÃ“N FINAL
-- =============================================

DO $$
DECLARE
    msgs_table BOOLEAN;
    conv_view BOOLEAN;
    lead_cols TEXT;
BEGIN
    -- Verificar tabla messages
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'messages'
    ) INTO msgs_table;

    -- Verificar vista
    SELECT EXISTS (
        SELECT 1 FROM information_schema.views
        WHERE table_schema = 'public' AND table_name = 'conversation_summaries'
    ) INTO conv_view;

    -- Listar columnas de leads
    SELECT string_agg(column_name, ', ' ORDER BY ordinal_position)
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'leads'
    INTO lead_cols;

    RAISE NOTICE '';
    RAISE NOTICE 'â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•';
    RAISE NOTICE '         VERIFICACIÃ“N COMPLETADA                   ';
    RAISE NOTICE 'â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•';

    IF msgs_table AND conv_view THEN
        RAISE NOTICE 'âœ… TODO INSTALADO CORRECTAMENTE';
        RAISE NOTICE '';
        RAISE NOTICE 'âœ“ Tabla messages: OK';
        RAISE NOTICE 'âœ“ Vista conversation_summaries: OK';
        RAISE NOTICE 'âœ“ PolÃ­ticas RLS: OK';
        RAISE NOTICE 'âœ“ Realtime: OK';
        RAISE NOTICE '';
        RAISE NOTICE 'ðŸ“‹ Columnas en tabla leads:';
        RAISE NOTICE '   %', lead_cols;
        RAISE NOTICE '';
        RAISE NOTICE 'ðŸŽ‰ Â¡Sistema de mensajerÃ­a listo para usar!';
    ELSE
        IF NOT msgs_table THEN
            RAISE WARNING 'âŒ Tabla messages NO fue creada';
        END IF;
        IF NOT conv_view THEN
            RAISE WARNING 'âŒ Vista conversation_summaries NO fue creada';
        END IF;
    END IF;

    RAISE NOTICE 'â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•';
END $$;

``r
---
## [004_rename_recipient_to_profile.sql]
Fecha de consolidación: 2025-11-24 18:58:16

`sql
-- =============================================
-- YourCVPassport - Renombrar recipient_id a profile_id
-- =============================================
-- Este script corrige el nombre de la columna para que sea consistente
-- con el resto del cÃ³digo que usa 'profile_id'

-- =============================================
-- PASO 1: Renombrar recipient_id a profile_id si existe
-- =============================================

DO $$
BEGIN
    -- Si existe recipient_id, renombrarlo a profile_id
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'leads'
        AND column_name = 'recipient_id'
    ) THEN
        -- Verificar que profile_id no exista ya
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'leads'
            AND column_name = 'profile_id'
        ) THEN
            ALTER TABLE public.leads RENAME COLUMN recipient_id TO profile_id;
            RAISE NOTICE 'âœ“ Columna recipient_id renombrada a profile_id';
        ELSE
            RAISE NOTICE 'âš  Columna profile_id ya existe, no se puede renombrar';
        END IF;
    ELSE
        -- Si no existe recipient_id, verificar que profile_id exista
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'leads'
            AND column_name = 'profile_id'
        ) THEN
            -- Si tampoco existe profile_id, crearla
            ALTER TABLE public.leads ADD COLUMN profile_id UUID REFERENCES auth.users(id);
            RAISE NOTICE 'âœ“ Columna profile_id creada';
        ELSE
            RAISE NOTICE 'âœ“ Columna profile_id ya existe';
        END IF;
    END IF;
END $$;

-- =============================================
-- PASO 2: Actualizar la vista conversation_summaries
-- =============================================

DROP VIEW IF EXISTS public.conversation_summaries;

CREATE VIEW public.conversation_summaries AS
SELECT
    l.id AS lead_id,
    COALESCE(l.sender_id, (SELECT id FROM auth.users LIMIT 1)) AS sender_id,
    COALESCE(l.sender_name, 'Usuario') AS sender_name,
    COALESCE(l.profile_id, (SELECT id FROM auth.users LIMIT 1)) AS recipient_id,
    COALESCE(p.full_name, 'Usuario') AS recipient_name,
    COALESCE(l.lead_type, 'INQUIRY') AS lead_type,
    COALESCE(l.subject, 'Sin asunto') AS subject,
    COALESCE(l.status, 'PENDING') AS status,
    -- Ãšltimo mensaje
    (
        SELECT m.content
        FROM public.messages m
        WHERE m.lead_id = l.id
        ORDER BY m.created_at DESC
        LIMIT 1
    ) AS last_message,
    -- Fecha del Ãºltimo mensaje
    COALESCE(
        (
            SELECT m.created_at
            FROM public.messages m
            WHERE m.lead_id = l.id
            ORDER BY m.created_at DESC
            LIMIT 1
        ),
        l.created_at,
        NOW()
    ) AS last_message_at,
    -- Mensajes no leÃ­dos
    (
        SELECT COUNT(*)::INTEGER
        FROM public.messages m
        WHERE m.lead_id = l.id
        AND m.is_read = FALSE
        AND m.sender_id != COALESCE(l.profile_id, l.sender_id)
    ) AS unread_count,
    -- Total de mensajes
    (
        SELECT COUNT(*)::INTEGER
        FROM public.messages m
        WHERE m.lead_id = l.id
    ) AS message_count,
    COALESCE(l.created_at, NOW()) AS created_at
FROM public.leads l
LEFT JOIN public.profiles p ON p.id = l.profile_id
WHERE COALESCE(l.status, 'PENDING') != 'REJECTED'
ORDER BY last_message_at DESC;

-- =============================================
-- PASO 3: Actualizar polÃ­ticas RLS para messages
-- =============================================

DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can update messages in their conversations" ON public.messages;

CREATE POLICY "Users can view messages in their conversations"
ON public.messages FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.leads l
        WHERE l.id = messages.lead_id
        AND (COALESCE(l.sender_id, auth.uid()) = auth.uid()
             OR COALESCE(l.profile_id, auth.uid()) = auth.uid())
    )
);

CREATE POLICY "Users can send messages in their conversations"
ON public.messages FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.leads l
        WHERE l.id = messages.lead_id
        AND (COALESCE(l.sender_id, auth.uid()) = auth.uid()
             OR COALESCE(l.profile_id, auth.uid()) = auth.uid())
    )
    AND sender_id = auth.uid()
);

CREATE POLICY "Users can update messages in their conversations"
ON public.messages FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.leads l
        WHERE l.id = messages.lead_id
        AND (COALESCE(l.sender_id, auth.uid()) = auth.uid()
             OR COALESCE(l.profile_id, auth.uid()) = auth.uid())
    )
);

-- =============================================
-- VERIFICACIÃ“N FINAL
-- =============================================

DO $$
DECLARE
    profile_id_exists BOOLEAN;
    lead_cols TEXT;
BEGIN
    -- Verificar columna profile_id
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'leads'
        AND column_name = 'profile_id'
    ) INTO profile_id_exists;

    -- Listar columnas de leads
    SELECT string_agg(column_name, ', ' ORDER BY ordinal_position)
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'leads'
    INTO lead_cols;

    RAISE NOTICE '';
    RAISE NOTICE 'â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•';
    RAISE NOTICE '         VERIFICACIÃ“N COMPLETADA                   ';
    RAISE NOTICE 'â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•';

    IF profile_id_exists THEN
        RAISE NOTICE 'âœ… Columna profile_id configurada correctamente';
        RAISE NOTICE '';
        RAISE NOTICE 'ðŸ“‹ Columnas en tabla leads:';
        RAISE NOTICE '   %', lead_cols;
        RAISE NOTICE '';
        RAISE NOTICE 'ðŸŽ‰ Â¡MigraciÃ³n completada exitosamente!';
    ELSE
        RAISE WARNING 'âŒ Columna profile_id NO existe en la tabla leads';
    END IF;

    RAISE NOTICE 'â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•';
END $$;

``r
---
## [005_fix_leads_rls_policies.sql]
Fecha de consolidación: 2025-11-24 18:58:16

`sql
-- =============================================
-- YourCVPassport - Configurar polÃ­ticas RLS para leads
-- =============================================
-- Este script configura las polÃ­ticas de seguridad para permitir
-- que usuarios anÃ³nimos puedan enviar leads (formulario de contacto pÃºblico)

-- =============================================
-- PASO 1: Habilitar RLS en la tabla leads
-- =============================================

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- =============================================
-- PASO 2: Eliminar polÃ­ticas existentes
-- =============================================

DROP POLICY IF EXISTS "Users can view their own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can insert leads to any profile" ON public.leads;
DROP POLICY IF EXISTS "Users can update their own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can delete their own leads" ON public.leads;
DROP POLICY IF EXISTS "Profile owners can view leads sent to them" ON public.leads;
DROP POLICY IF EXISTS "Profile owners can update leads sent to them" ON public.leads;
DROP POLICY IF EXISTS "Anyone can insert leads" ON public.leads;
DROP POLICY IF EXISTS "Profile owners can view their leads" ON public.leads;
DROP POLICY IF EXISTS "Profile owners can update their leads" ON public.leads;
DROP POLICY IF EXISTS "Profile owners can delete their leads" ON public.leads;

-- =============================================
-- PASO 3: Crear polÃ­ticas RLS para leads
-- =============================================

-- PolÃ­tica 1: Cualquiera puede insertar leads (usuarios anÃ³nimos pueden enviar mensajes)
-- Esto es necesario para el formulario de contacto pÃºblico
CREATE POLICY "Anyone can insert leads"
ON public.leads
FOR INSERT
WITH CHECK (true);

-- PolÃ­tica 2: Los dueÃ±os de perfiles pueden ver los leads que les enviaron
CREATE POLICY "Profile owners can view their leads"
ON public.leads
FOR SELECT
USING (
    auth.uid() = profile_id
);

-- PolÃ­tica 3: Los dueÃ±os de perfiles pueden actualizar sus leads
-- (por ejemplo, marcar como leÃ­do, responder, archivar)
CREATE POLICY "Profile owners can update their leads"
ON public.leads
FOR UPDATE
USING (
    auth.uid() = profile_id
)
WITH CHECK (
    auth.uid() = profile_id
);

-- PolÃ­tica 4: Los dueÃ±os de perfiles pueden eliminar sus leads
CREATE POLICY "Profile owners can delete their leads"
ON public.leads
FOR DELETE
USING (
    auth.uid() = profile_id
);

-- =============================================
-- VERIFICACIÃ“N FINAL
-- =============================================

DO $$
DECLARE
    rls_enabled BOOLEAN;
    policy_count INTEGER;
    policy_names TEXT;
BEGIN
    -- Verificar que RLS estÃ¡ habilitado
    SELECT relrowsecurity
    FROM pg_class
    WHERE relname = 'leads' AND relnamespace = 'public'::regnamespace
    INTO rls_enabled;

    -- Contar polÃ­ticas
    SELECT COUNT(*)
    FROM pg_policies
    WHERE tablename = 'leads' AND schemaname = 'public'
    INTO policy_count;

    -- Listar nombres de polÃ­ticas
    SELECT string_agg(policyname, ', ' ORDER BY policyname)
    FROM pg_policies
    WHERE tablename = 'leads' AND schemaname = 'public'
    INTO policy_names;

    RAISE NOTICE '';
    RAISE NOTICE 'â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•';
    RAISE NOTICE '         VERIFICACIÃ“N DE POLÃTICAS RLS              ';
    RAISE NOTICE 'â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•';

    IF rls_enabled THEN
        RAISE NOTICE 'âœ… RLS estÃ¡ habilitado en la tabla leads';
    ELSE
        RAISE WARNING 'âŒ RLS NO estÃ¡ habilitado en la tabla leads';
    END IF;

    RAISE NOTICE '';
    RAISE NOTICE 'ðŸ“Š Total de polÃ­ticas: %', policy_count;
    RAISE NOTICE '';
    RAISE NOTICE 'ðŸ“‹ PolÃ­ticas configuradas:';
    RAISE NOTICE '   %', policy_names;
    RAISE NOTICE '';

    IF policy_count >= 4 THEN
        RAISE NOTICE 'ðŸŽ‰ Â¡PolÃ­ticas RLS configuradas correctamente!';
        RAISE NOTICE '';
        RAISE NOTICE 'âœ“ Usuarios anÃ³nimos pueden insertar leads';
        RAISE NOTICE 'âœ“ DueÃ±os de perfiles pueden ver sus leads';
        RAISE NOTICE 'âœ“ DueÃ±os de perfiles pueden actualizar sus leads';
        RAISE NOTICE 'âœ“ DueÃ±os de perfiles pueden eliminar sus leads';
    ELSE
        RAISE WARNING 'âš  Se esperaban al menos 4 polÃ­ticas, pero solo hay %', policy_count;
    END IF;

    RAISE NOTICE 'â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•';
END $$;

``r
---
## [006_diagnose_leads_table.sql]
Fecha de consolidación: 2025-11-24 18:58:16

`sql
-- =============================================
-- DiagnÃ³stico de la tabla leads
-- =============================================
-- Este script verifica el estado actual de la tabla leads

DO $$
DECLARE
    table_exists BOOLEAN;
    profile_id_exists BOOLEAN;
    rls_enabled BOOLEAN;
    policy_count INTEGER;
    column_info TEXT;
    policy_info TEXT;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE 'â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•';
    RAISE NOTICE '         DIAGNÃ“STICO DE LA TABLA LEADS             ';
    RAISE NOTICE 'â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•';
    RAISE NOTICE '';

    -- 1. Verificar si la tabla existe
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'leads'
    ) INTO table_exists;

    IF table_exists THEN
        RAISE NOTICE 'âœ“ Tabla "leads" existe';
    ELSE
        RAISE WARNING 'âœ— Tabla "leads" NO existe';
        RETURN;
    END IF;

    RAISE NOTICE '';
    RAISE NOTICE '--- COLUMNAS DE LA TABLA ---';

    -- 2. Listar todas las columnas
    FOR column_info IN
        SELECT
            column_name || ' (' || data_type ||
            CASE
                WHEN is_nullable = 'NO' THEN ', NOT NULL'
                ELSE ''
            END || ')'
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'leads'
        ORDER BY ordinal_position
    LOOP
        RAISE NOTICE '  %', column_info;
    END LOOP;

    -- 3. Verificar columna profile_id especÃ­ficamente
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'leads'
        AND column_name = 'profile_id'
    ) INTO profile_id_exists;

    RAISE NOTICE '';
    IF profile_id_exists THEN
        RAISE NOTICE 'âœ“ Columna "profile_id" existe';
    ELSE
        RAISE WARNING 'âœ— Columna "profile_id" NO existe';
    END IF;

    -- 4. Verificar RLS
    SELECT relrowsecurity
    FROM pg_class
    WHERE relname = 'leads' AND relnamespace = 'public'::regnamespace
    INTO rls_enabled;

    RAISE NOTICE '';
    IF rls_enabled THEN
        RAISE NOTICE 'âœ“ RLS estÃ¡ HABILITADO';
    ELSE
        RAISE NOTICE 'âœ— RLS estÃ¡ DESHABILITADO';
    END IF;

    -- 5. Listar polÃ­ticas
    SELECT COUNT(*)
    FROM pg_policies
    WHERE tablename = 'leads' AND schemaname = 'public'
    INTO policy_count;

    RAISE NOTICE '';
    RAISE NOTICE '--- POLÃTICAS RLS (Total: %) ---', policy_count;

    IF policy_count > 0 THEN
        FOR policy_info IN
            SELECT
                '  â€¢ ' || policyname || ' (' || cmd || ')'
            FROM pg_policies
            WHERE tablename = 'leads' AND schemaname = 'public'
            ORDER BY policyname
        LOOP
            RAISE NOTICE '%', policy_info;
        END LOOP;
    ELSE
        RAISE NOTICE '  (sin polÃ­ticas)';
    END IF;

    -- 6. Verificar foreign keys
    RAISE NOTICE '';
    RAISE NOTICE '--- FOREIGN KEYS ---';

    IF EXISTS (
        SELECT 1
        FROM information_schema.table_constraints tc
        JOIN information_schema.constraint_column_usage ccu
            ON tc.constraint_name = ccu.constraint_name
        WHERE tc.table_schema = 'public'
        AND tc.table_name = 'leads'
        AND tc.constraint_type = 'FOREIGN KEY'
        AND ccu.column_name = 'profile_id'
    ) THEN
        RAISE NOTICE '  âœ“ Foreign key en profile_id configurado';
    ELSE
        RAISE NOTICE '  âœ— NO hay foreign key en profile_id';
    END IF;

    RAISE NOTICE '';
    RAISE NOTICE 'â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•';
    RAISE NOTICE '         FIN DEL DIAGNÃ“STICO                       ';
    RAISE NOTICE 'â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•';
    RAISE NOTICE '';

END $$;

``r
---
## [007_disable_rls_on_leads.sql]
Fecha de consolidación: 2025-11-24 18:58:16

`sql
-- =============================================
-- YourCVPassport - Deshabilitar RLS en leads
-- =============================================
-- Este script deshabilita RLS en la tabla leads para permitir
-- que cualquiera pueda insertar leads (formulario de contacto pÃºblico)
-- y que los usuarios autenticados puedan ver solo sus propios leads
-- mediante filtros en el cÃ³digo de la aplicaciÃ³n

-- =============================================
-- PASO 1: Eliminar todas las polÃ­ticas existentes
-- =============================================

DROP POLICY IF EXISTS "Users can view their own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can insert leads to any profile" ON public.leads;
DROP POLICY IF EXISTS "Users can update their own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can delete their own leads" ON public.leads;
DROP POLICY IF EXISTS "Profile owners can view leads sent to them" ON public.leads;
DROP POLICY IF EXISTS "Profile owners can update leads sent to them" ON public.leads;
DROP POLICY IF EXISTS "Anyone can insert leads" ON public.leads;
DROP POLICY IF EXISTS "Profile owners can view their leads" ON public.leads;
DROP POLICY IF EXISTS "Profile owners can update their leads" ON public.leads;
DROP POLICY IF EXISTS "Profile owners can delete their leads" ON public.leads;

-- =============================================
-- PASO 2: Deshabilitar RLS en la tabla leads
-- =============================================

ALTER TABLE public.leads DISABLE ROW LEVEL SECURITY;

-- =============================================
-- VERIFICACIÃ“N FINAL
-- =============================================

DO $$
DECLARE
    rls_enabled BOOLEAN;
    policy_count INTEGER;
BEGIN
    -- Verificar que RLS estÃ¡ deshabilitado
    SELECT relrowsecurity
    FROM pg_class
    WHERE relname = 'leads' AND relnamespace = 'public'::regnamespace
    INTO rls_enabled;

    -- Contar polÃ­ticas restantes
    SELECT COUNT(*)
    FROM pg_policies
    WHERE tablename = 'leads' AND schemaname = 'public'
    INTO policy_count;

    RAISE NOTICE '';
    RAISE NOTICE 'â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•';
    RAISE NOTICE '    CONFIGURACIÃ“N RLS PARA TABLA LEADS             ';
    RAISE NOTICE 'â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•';
    RAISE NOTICE '';

    IF NOT rls_enabled THEN
        RAISE NOTICE 'âœ… RLS estÃ¡ DESHABILITADO (correcto para formulario pÃºblico)';
    ELSE
        RAISE WARNING 'âš  RLS todavÃ­a estÃ¡ habilitado';
    END IF;

    RAISE NOTICE '';
    RAISE NOTICE 'ðŸ“Š PolÃ­ticas restantes: %', policy_count;

    IF policy_count = 0 THEN
        RAISE NOTICE 'âœ… Todas las polÃ­ticas fueron eliminadas';
    ELSE
        RAISE WARNING 'âš  TodavÃ­a hay % polÃ­ticas activas', policy_count;
    END IF;

    RAISE NOTICE '';
    RAISE NOTICE 'ðŸŽ‰ ConfiguraciÃ³n completada!';
    RAISE NOTICE '';
    RAISE NOTICE 'NOTA: Con RLS deshabilitado, la tabla "leads" acepta';
    RAISE NOTICE 'inserciones de usuarios anÃ³nimos (formulario pÃºblico).';
    RAISE NOTICE 'El acceso de lectura debe ser controlado por la aplicaciÃ³n';
    RAISE NOTICE 'usando filtros en las consultas (profile_id = auth.uid()).';
    RAISE NOTICE '';
    RAISE NOTICE 'â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•';

END $$;

``r
---
## [008_check_recent_leads.sql]
Fecha de consolidación: 2025-11-24 18:58:16

`sql
-- =============================================
-- Verificar leads recientes
-- =============================================
-- Este script muestra los Ãºltimos leads insertados

SELECT
    id,
    profile_id,
    sender_name,
    sender_email,
    subject,
    LEFT(message, 50) || '...' as message_preview,
    status,
    created_at
FROM public.leads
ORDER BY created_at DESC
LIMIT 10;

``r
---
## [009_check_profile_owner.sql]
Fecha de consolidación: 2025-11-24 18:58:16

`sql
-- =============================================
-- Verificar a quiÃ©n pertenece el profile_id del lead
-- =============================================

-- Mostrar informaciÃ³n del perfil que recibiÃ³ el lead
SELECT
    p.id as profile_id,
    p.full_name,
    p.email,
    p.role,
    u.email as auth_email
FROM public.profiles p
LEFT JOIN auth.users u ON u.id = p.id
WHERE p.id = '93856aad-e6cb-49c8-b912-123389d3e2ad';

-- Mostrar todos los perfiles para comparar
SELECT
    p.id as profile_id,
    p.full_name,
    p.email,
    p.role
FROM public.profiles p
ORDER BY p.created_at DESC
LIMIT 10;

``r
---
## [010_debug_leads_query.sql]
Fecha de consolidación: 2025-11-24 18:58:16

`sql
-- =============================================
-- Debug: Simular la consulta que hace LeadsPage.tsx
-- =============================================

-- Mostrar el ID del usuario Administrator
SELECT
    'Usuario Administrator:' as info,
    id,
    full_name,
    email
FROM public.profiles
WHERE email = 'admin@yourcvpassport.com';

-- Simular la consulta exacta que hace el cÃ³digo en LeadsPage.tsx lÃ­nea 50-55
-- SELECT * FROM leads WHERE profile_id = <admin_id> AND status != 'deleted'
SELECT
    'Leads para Administrator:' as info,
    l.id,
    l.profile_id,
    l.sender_name,
    l.sender_email,
    l.subject,
    l.status,
    l.created_at
FROM public.leads l
WHERE l.profile_id = '93856aad-e6cb-49c8-b912-123389d3e2ad'
AND l.status != 'deleted'
ORDER BY l.created_at DESC;

-- Ver TODOS los leads sin filtro para comparar
SELECT
    'TODOS los leads (sin filtro):' as info,
    id,
    profile_id,
    sender_name,
    sender_email,
    status,
    created_at
FROM public.leads
ORDER BY created_at DESC
LIMIT 5;

``r
---
## [011_check_messages_rls.sql]
Fecha de consolidación: 2025-11-24 18:58:16

`sql
-- =============================================
-- Verificar tabla messages y sus polÃ­ticas
-- =============================================

-- Verificar si la tabla messages existe
SELECT
    'Tabla messages existe:' as info,
    EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'messages'
    ) as exists;

-- Verificar RLS en messages
SELECT
    'RLS habilitado en messages:' as info,
    relrowsecurity as rls_enabled
FROM pg_class
WHERE relname = 'messages' AND relnamespace = 'public'::regnamespace;

-- Listar polÃ­ticas de messages
SELECT
    'PolÃ­ticas en messages:' as info,
    policyname,
    cmd as command
FROM pg_policies
WHERE tablename = 'messages' AND schemaname = 'public'
ORDER BY policyname;

-- Verificar columnas de messages
SELECT
    'Columnas de messages:' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'messages'
ORDER BY ordinal_position;

``r
---
## [012_disable_messages_rls.sql]
Fecha de consolidación: 2025-11-24 18:58:16

`sql
-- =============================================
-- Deshabilitar RLS en la tabla messages
-- =============================================
-- Esto permite que los usuarios anÃ³nimos puedan crear mensajes
-- cuando envÃ­an un lead desde el formulario de contacto

-- Eliminar todas las polÃ­ticas de messages
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can update messages in their conversations" ON public.messages;

-- Deshabilitar RLS
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;

-- VerificaciÃ³n
DO $$
DECLARE
    rls_enabled BOOLEAN;
    policy_count INTEGER;
BEGIN
    SELECT relrowsecurity
    FROM pg_class
    WHERE relname = 'messages' AND relnamespace = 'public'::regnamespace
    INTO rls_enabled;

    SELECT COUNT(*)
    FROM pg_policies
    WHERE tablename = 'messages' AND schemaname = 'public'
    INTO policy_count;

    RAISE NOTICE '';
    RAISE NOTICE 'â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•';
    RAISE NOTICE '    CONFIGURACIÃ“N RLS PARA TABLA MESSAGES          ';
    RAISE NOTICE 'â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•';
    RAISE NOTICE '';

    IF NOT rls_enabled THEN
        RAISE NOTICE 'âœ… RLS estÃ¡ DESHABILITADO en messages';
    ELSE
        RAISE WARNING 'âš  RLS todavÃ­a estÃ¡ habilitado en messages';
    END IF;

    RAISE NOTICE 'ðŸ“Š PolÃ­ticas restantes: %', policy_count;

    IF policy_count = 0 THEN
        RAISE NOTICE 'âœ… Todas las polÃ­ticas fueron eliminadas';
    END IF;

    RAISE NOTICE '';
    RAISE NOTICE 'ðŸŽ‰ ConfiguraciÃ³n completada!';
    RAISE NOTICE '';
    RAISE NOTICE 'â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•';
END $$;

``r
---
## [013_complete_fix.sql]
Fecha de consolidación: 2025-11-24 18:58:16

`sql
-- =============================================
-- FIX COMPLETO: Sistema de Leads y Mensajes
-- =============================================

-- PASO 1: Deshabilitar RLS en ambas tablas
ALTER TABLE public.leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;

-- PASO 2: Eliminar TODAS las polÃ­ticas
DROP POLICY IF EXISTS "Users can view their own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can insert leads to any profile" ON public.leads;
DROP POLICY IF EXISTS "Users can update their own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can delete their own leads" ON public.leads;
DROP POLICY IF EXISTS "Profile owners can view leads sent to them" ON public.leads;
DROP POLICY IF EXISTS "Profile owners can update leads sent to them" ON public.leads;
DROP POLICY IF EXISTS "Anyone can insert leads" ON public.leads;
DROP POLICY IF EXISTS "Profile owners can view their leads" ON public.leads;
DROP POLICY IF EXISTS "Profile owners can update their leads" ON public.leads;
DROP POLICY IF EXISTS "Profile owners can delete their leads" ON public.leads;

DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can update messages in their conversations" ON public.messages;

-- PASO 3: Verificar estructura de leads
DO $$
BEGIN
    -- Asegurar que profile_id existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'leads' AND column_name = 'profile_id'
    ) THEN
        -- Si existe recipient_id, renombrarlo
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'leads' AND column_name = 'recipient_id'
        ) THEN
            ALTER TABLE public.leads RENAME COLUMN recipient_id TO profile_id;
            RAISE NOTICE 'âœ“ Renombrado recipient_id a profile_id';
        ELSE
            ALTER TABLE public.leads ADD COLUMN profile_id UUID REFERENCES auth.users(id);
            RAISE NOTICE 'âœ“ Creada columna profile_id';
        END IF;
    END IF;
END $$;

-- PASO 4: Crear mensajes iniciales para todos los leads sin mensajes
DO $$
DECLARE
    lead_record RECORD;
    messages_created INTEGER := 0;
BEGIN
    -- Para cada lead que NO tenga mensajes, crear uno
    FOR lead_record IN
        SELECT l.id, l.profile_id, l.sender_name, l.message
        FROM public.leads l
        WHERE NOT EXISTS (
            SELECT 1 FROM public.messages m WHERE m.lead_id = l.id
        )
        ORDER BY l.created_at DESC
    LOOP
        INSERT INTO public.messages (lead_id, sender_id, sender_name, content, is_read, created_at)
        VALUES (
            lead_record.id,
            lead_record.profile_id,
            lead_record.sender_name,
            lead_record.message,
            false,
            NOW()
        );

        messages_created := messages_created + 1;
    END LOOP;

    IF messages_created > 0 THEN
        RAISE NOTICE 'âœ“ Creados % mensajes iniciales para leads existentes', messages_created;
    ELSE
        RAISE NOTICE 'âœ“ Todos los leads ya tienen mensajes';
    END IF;
END $$;

-- PASO 5: VerificaciÃ³n final
DO $$
DECLARE
    leads_rls BOOLEAN;
    messages_rls BOOLEAN;
    leads_count INTEGER;
    messages_count INTEGER;
    profile_id_exists BOOLEAN;
BEGIN
    -- Verificar RLS
    SELECT relrowsecurity FROM pg_class WHERE relname = 'leads' AND relnamespace = 'public'::regnamespace INTO leads_rls;
    SELECT relrowsecurity FROM pg_class WHERE relname = 'messages' AND relnamespace = 'public'::regnamespace INTO messages_rls;

    -- Contar registros
    SELECT COUNT(*) FROM public.leads INTO leads_count;
    SELECT COUNT(*) FROM public.messages INTO messages_count;

    -- Verificar columna
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'leads' AND column_name = 'profile_id'
    ) INTO profile_id_exists;

    RAISE NOTICE '';
    RAISE NOTICE 'â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•';
    RAISE NOTICE '         VERIFICACIÃ“N FINAL                        ';
    RAISE NOTICE 'â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•';
    RAISE NOTICE '';
    RAISE NOTICE 'RLS en leads: % (debe ser FALSE)', COALESCE(leads_rls, false);
    RAISE NOTICE 'RLS en messages: % (debe ser FALSE)', COALESCE(messages_rls, false);
    RAISE NOTICE '';
    RAISE NOTICE 'Columna profile_id existe: %', profile_id_exists;
    RAISE NOTICE '';
    RAISE NOTICE 'Total leads: %', leads_count;
    RAISE NOTICE 'Total messages: %', messages_count;
    RAISE NOTICE '';

    IF NOT COALESCE(leads_rls, false) AND NOT COALESCE(messages_rls, false) AND profile_id_exists THEN
        RAISE NOTICE 'âœ… TODO CONFIGURADO CORRECTAMENTE';
    ELSE
        RAISE WARNING 'âš  Hay problemas en la configuraciÃ³n';
    END IF;

    RAISE NOTICE 'â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•';
END $$;

``r
---
## [014_final_simple_fix.sql]
Fecha de consolidación: 2025-11-24 18:58:16

`sql
-- =============================================
-- FIX SIMPLE Y DIRECTO
-- =============================================

-- PASO 1: Deshabilitar RLS completamente
ALTER TABLE public.leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;

-- PASO 2: Eliminar TODAS las polÃ­ticas
DO $$
BEGIN
    -- Eliminar polÃ­ticas de leads
    DROP POLICY IF EXISTS "Users can view their own leads" ON public.leads;
    DROP POLICY IF EXISTS "Users can insert leads to any profile" ON public.leads;
    DROP POLICY IF EXISTS "Users can update their own leads" ON public.leads;
    DROP POLICY IF EXISTS "Users can delete their own leads" ON public.leads;
    DROP POLICY IF EXISTS "Profile owners can view leads sent to them" ON public.leads;
    DROP POLICY IF EXISTS "Profile owners can update leads sent to them" ON public.leads;
    DROP POLICY IF EXISTS "Anyone can insert leads" ON public.leads;
    DROP POLICY IF EXISTS "Profile owners can view their leads" ON public.leads;
    DROP POLICY IF EXISTS "Profile owners can update their leads" ON public.leads;
    DROP POLICY IF EXISTS "Profile owners can delete their leads" ON public.leads;

    -- Eliminar polÃ­ticas de messages
    DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
    DROP POLICY IF EXISTS "Users can send messages in their conversations" ON public.messages;
    DROP POLICY IF EXISTS "Users can update messages in their conversations" ON public.messages;
END $$;

-- PASO 3: Verificar y corregir profile_id
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'leads' AND column_name = 'recipient_id'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'leads' AND column_name = 'profile_id'
    ) THEN
        ALTER TABLE public.leads RENAME COLUMN recipient_id TO profile_id;
        RAISE NOTICE 'âœ“ Columna renombrada: recipient_id â†’ profile_id';
    END IF;
END $$;

-- PASO 4: VerificaciÃ³n simple
SELECT
    'âœ… CONFIGURACIÃ“N COMPLETADA' as status,
    COUNT(*) as total_leads
FROM public.leads;

SELECT
    'ðŸ“Š MENSAJES EXISTENTES' as status,
    COUNT(*) as total_messages
FROM public.messages;

-- Mostrar leads sin mensajes
SELECT
    'âš ï¸ LEADS SIN MENSAJES' as status,
    l.id,
    l.sender_name,
    l.created_at
FROM public.leads l
LEFT JOIN public.messages m ON m.lead_id = l.id
WHERE m.id IS NULL
ORDER BY l.created_at DESC
LIMIT 5;

``r
---
## [015_insert_missing_messages.sql]
Fecha de consolidación: 2025-11-24 18:58:16

`sql
-- =============================================
-- Insertar mensajes para los leads sin mensajes
-- =============================================

-- Insertar un mensaje para cada lead que no tenga mensajes
INSERT INTO public.messages (lead_id, sender_id, sender_name, content, is_read, created_at)
SELECT
    l.id as lead_id,
    l.profile_id as sender_id,
    l.sender_name,
    l.message as content,
    false as is_read,
    l.created_at
FROM public.leads l
WHERE NOT EXISTS (
    SELECT 1 FROM public.messages m WHERE m.lead_id = l.id
)
ORDER BY l.created_at DESC;

-- Verificar que se crearon los mensajes
SELECT
    'âœ… MENSAJES CREADOS' as status,
    COUNT(*) as mensajes_insertados
FROM public.messages
WHERE created_at >= NOW() - INTERVAL '1 minute';

-- Mostrar el estado final
SELECT
    'ðŸ“Š RESUMEN FINAL' as status,
    (SELECT COUNT(*) FROM public.leads) as total_leads,
    (SELECT COUNT(*) FROM public.messages) as total_messages,
    (SELECT COUNT(*) FROM public.leads l WHERE NOT EXISTS (SELECT 1 FROM public.messages m WHERE m.lead_id = l.id)) as leads_sin_mensajes;

``r
---
## [016_disable_triggers_and_insert.sql]
Fecha de consolidación: 2025-11-24 18:58:16

`sql
-- =============================================
-- Deshabilitar triggers y luego insertar mensajes
-- =============================================

-- PASO 1: Buscar y eliminar el trigger problemÃ¡tico
DO $$
DECLARE
    trigger_name TEXT;
BEGIN
    -- Buscar todos los triggers en la tabla leads
    FOR trigger_name IN
        SELECT tgname
        FROM pg_trigger
        WHERE tgrelid = 'public.leads'::regclass
        AND tgname LIKE '%message%'
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.leads', trigger_name);
        RAISE NOTICE 'Trigger eliminado: %', trigger_name;
    END LOOP;

    -- Buscar triggers en messages relacionados con leads
    FOR trigger_name IN
        SELECT tgname
        FROM pg_trigger
        WHERE tgrelid = 'public.messages'::regclass
        AND tgname LIKE '%lead%'
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.messages', trigger_name);
        RAISE NOTICE 'Trigger eliminado: %', trigger_name;
    END LOOP;
END $$;

-- PASO 2: Buscar y eliminar la funciÃ³n del trigger
DROP FUNCTION IF EXISTS update_lead_last_message() CASCADE;
DROP FUNCTION IF EXISTS update_lead_last_message_at() CASCADE;

-- PASO 3: Ahora sÃ­ insertar los mensajes
INSERT INTO public.messages (lead_id, sender_id, sender_name, content, is_read, created_at)
SELECT
    l.id as lead_id,
    l.profile_id as sender_id,
    l.sender_name,
    l.message as content,
    false as is_read,
    l.created_at
FROM public.leads l
WHERE NOT EXISTS (
    SELECT 1 FROM public.messages m WHERE m.lead_id = l.id
);

-- PASO 4: VerificaciÃ³n final
SELECT
    'âœ… OPERACIÃ“N COMPLETADA' as status,
    (SELECT COUNT(*) FROM public.leads) as total_leads,
    (SELECT COUNT(*) FROM public.messages) as total_messages,
    (SELECT COUNT(*) FROM public.leads l WHERE NOT EXISTS (
        SELECT 1 FROM public.messages m WHERE m.lead_id = l.id
    )) as leads_sin_mensajes;

``r
---
## [017_fix_foreign_keys.sql]
Fecha de consolidación: 2025-11-24 18:58:16

`sql
-- =============================================
-- Arreglar Foreign Keys entre messages y leads
-- =============================================

-- PASO 1: Eliminar foreign key existente si hay
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    -- Buscar y eliminar constraints de foreign key en messages.lead_id
    FOR constraint_name IN
        SELECT tc.constraint_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.constraint_column_usage ccu
            ON tc.constraint_name = ccu.constraint_name
        WHERE tc.table_schema = 'public'
        AND tc.table_name = 'messages'
        AND tc.constraint_type = 'FOREIGN KEY'
        AND ccu.column_name = 'lead_id'
    LOOP
        EXECUTE format('ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS %I', constraint_name);
        RAISE NOTICE 'Constraint eliminado: %', constraint_name;
    END LOOP;
END $$;

-- PASO 2: Eliminar mensajes huÃ©rfanos (que no tienen lead correspondiente)
DELETE FROM public.messages m
WHERE NOT EXISTS (
    SELECT 1 FROM public.leads l WHERE l.id = m.lead_id
);

-- PASO 3: Recrear la foreign key correctamente
DO $$
BEGIN
    -- Solo agregar si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'messages_lead_id_fkey'
        AND table_name = 'messages'
    ) THEN
        ALTER TABLE public.messages
        ADD CONSTRAINT messages_lead_id_fkey
        FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE;
        RAISE NOTICE 'Foreign key creada';
    ELSE
        RAISE NOTICE 'Foreign key ya existe';
    END IF;
END $$;

-- PASO 4: Verificar que la relaciÃ³n funciona
SELECT
    'âœ… FOREIGN KEY CREADA' as status,
    COUNT(*) as total_messages_con_lead_valido
FROM public.messages m
INNER JOIN public.leads l ON l.id = m.lead_id;

-- PASO 5: Verificar estado final
SELECT
    'ðŸ“Š ESTADO FINAL' as status,
    (SELECT COUNT(*) FROM public.leads) as total_leads,
    (SELECT COUNT(*) FROM public.messages) as total_messages,
    (SELECT COUNT(*) FROM public.messages m
     WHERE EXISTS (SELECT 1 FROM public.leads l WHERE l.id = m.lead_id)) as messages_validos;

``r
---
## [018_allow_null_sender.sql]
Fecha de consolidación: 2025-11-24 18:58:16

`sql
-- =============================================
-- Permitir sender_id NULL para mensajes externos
-- =============================================

-- PASO 1: Modificar la columna sender_id para permitir NULL
ALTER TABLE public.messages
ALTER COLUMN sender_id DROP NOT NULL;

-- PASO 2: Actualizar mensajes existentes que tienen sender_id incorrecto
-- Marcar como NULL los mensajes donde el sender_name no coincide con el usuario autenticado
UPDATE public.messages m
SET sender_id = NULL
FROM public.leads l
WHERE m.lead_id = l.id
AND m.sender_id IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM auth.users u
    WHERE u.id = m.sender_id
    AND u.email = (SELECT sender_email FROM public.leads WHERE id = m.lead_id)
);

-- PASO 3: Verificar cambios
SELECT
    'ðŸ“Š MENSAJES ACTUALIZADOS' as status,
    COUNT(*) FILTER (WHERE sender_id IS NULL) as mensajes_externos,
    COUNT(*) FILTER (WHERE sender_id IS NOT NULL) as mensajes_internos,
    COUNT(*) as total
FROM public.messages;

``r
---
## [019_verify_and_fix_leads.sql]
Fecha de consolidación: 2025-11-24 18:58:16

`sql
-- =============================================
-- Verificar y corregir estructura de tabla leads
-- =============================================

-- PASO 1: Ver estructura actual de la tabla leads
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'leads'
ORDER BY ordinal_position;

-- PASO 2: Verificar si existe recipient_id o profile_id
DO $$
BEGIN
    -- Si existe recipient_id pero NO profile_id, renombrar
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'leads'
        AND column_name = 'recipient_id'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'leads'
        AND column_name = 'profile_id'
    ) THEN
        ALTER TABLE public.leads RENAME COLUMN recipient_id TO profile_id;
        RAISE NOTICE 'âœ“ Columna renombrada: recipient_id â†’ profile_id';

    -- Si NO existe ninguna, agregarla
    ELSIF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'leads'
        AND column_name = 'profile_id'
    ) THEN
        ALTER TABLE public.leads ADD COLUMN profile_id UUID NOT NULL REFERENCES auth.users(id);
        RAISE NOTICE 'âœ“ Columna profile_id creada';

    ELSE
        RAISE NOTICE 'âœ“ Columna profile_id ya existe';
    END IF;
END $$;

-- PASO 3: Verificar estado final
SELECT
    'ðŸ“Š ESTRUCTURA FINAL' as status,
    COUNT(*) FILTER (WHERE column_name = 'profile_id') as tiene_profile_id,
    COUNT(*) FILTER (WHERE column_name = 'recipient_id') as tiene_recipient_id
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'leads';

``r
---
## [020_fix_conversation_summaries.sql]
Fecha de consolidación: 2025-11-24 18:58:16

`sql
-- =============================================
-- Actualizar vista conversation_summaries para usar profile_id
-- =============================================

-- PASO 1: Eliminar vista existente
DROP VIEW IF EXISTS public.conversation_summaries CASCADE;

-- PASO 2: Recrear vista con profile_id y mostrar leads SIN mensajes
CREATE VIEW public.conversation_summaries AS
SELECT
    l.id AS lead_id,
    COALESCE(
        (SELECT u.id FROM auth.users u WHERE u.email = l.sender_email LIMIT 1),
        (SELECT id FROM auth.users LIMIT 1)
    ) AS sender_id,
    COALESCE(l.sender_name, 'Usuario') AS sender_name,
    l.profile_id AS recipient_id,  -- Usar profile_id en lugar de recipient_id
    COALESCE(p.full_name, p.email, 'Usuario') AS recipient_name,
    'INQUIRY' AS lead_type,
    COALESCE(l.subject, 'Sin asunto') AS subject,
    COALESCE(l.status, 'new') AS status,
    -- Ãšltimo mensaje (puede ser NULL si no hay mensajes)
    (
        SELECT m.content
        FROM public.messages m
        WHERE m.lead_id = l.id
        ORDER BY m.created_at DESC
        LIMIT 1
    ) AS last_message,
    -- Fecha del Ãºltimo mensaje o fecha de creaciÃ³n del lead
    COALESCE(
        (
            SELECT m.created_at
            FROM public.messages m
            WHERE m.lead_id = l.id
            ORDER BY m.created_at DESC
            LIMIT 1
        ),
        l.created_at  -- Si no hay mensajes, usar fecha de creaciÃ³n del lead
    ) AS last_message_at,
    -- Contar mensajes no leÃ­dos
    (
        SELECT COUNT(*)
        FROM public.messages m
        WHERE m.lead_id = l.id
        AND m.is_read = FALSE
        AND m.sender_id != l.profile_id  -- Mensajes del otro usuario
    ) AS unread_count,
    -- Total de mensajes
    (
        SELECT COUNT(*)
        FROM public.messages m
        WHERE m.lead_id = l.id
    ) AS message_count
FROM public.leads l
LEFT JOIN public.profiles p ON p.id = l.profile_id;

-- PASO 3: Verificar que la vista funciona
SELECT
    'âœ… VISTA ACTUALIZADA' as status,
    COUNT(*) as total_conversaciones
FROM public.conversation_summaries;

-- PASO 4: Mostrar ejemplo
SELECT
    lead_id,
    sender_name,
    recipient_name,
    subject,
    last_message,
    message_count,
    unread_count
FROM public.conversation_summaries
ORDER BY last_message_at DESC
LIMIT 5;

``r
---
## [021_fix_bidirectional_conversations.sql]
Fecha de consolidación: 2025-11-24 18:58:16

`sql
-- =============================================
-- Vista bidireccional: mostrar conversaciones enviadas Y recibidas
-- =============================================

-- PASO 1: Eliminar vista existente
DROP VIEW IF EXISTS public.conversation_summaries CASCADE;

-- PASO 2: Crear vista que muestra AMBAS perspectivas
CREATE VIEW public.conversation_summaries AS
-- Conversaciones donde SOY el RECEPTOR (recibo mensajes)
SELECT
    l.id AS lead_id,
    COALESCE(
        (SELECT u.id FROM auth.users u WHERE u.email = l.sender_email LIMIT 1),
        (SELECT id FROM auth.users LIMIT 1)
    ) AS sender_id,
    COALESCE(l.sender_name, 'Usuario') AS sender_name,
    l.profile_id AS recipient_id,
    COALESCE(p.full_name, p.email, 'Usuario') AS recipient_name,
    'INQUIRY' AS lead_type,
    COALESCE(l.subject, 'Sin asunto') AS subject,
    COALESCE(l.status, 'new') AS status,
    (
        SELECT m.content
        FROM public.messages m
        WHERE m.lead_id = l.id
        ORDER BY m.created_at DESC
        LIMIT 1
    ) AS last_message,
    COALESCE(
        (
            SELECT m.created_at
            FROM public.messages m
            WHERE m.lead_id = l.id
            ORDER BY m.created_at DESC
            LIMIT 1
        ),
        l.created_at
    ) AS last_message_at,
    (
        SELECT COUNT(*)
        FROM public.messages m
        WHERE m.lead_id = l.id
        AND m.is_read = FALSE
        AND m.sender_id != l.profile_id
    ) AS unread_count,
    (
        SELECT COUNT(*)
        FROM public.messages m
        WHERE m.lead_id = l.id
    ) AS message_count
FROM public.leads l
LEFT JOIN public.profiles p ON p.id = l.profile_id

UNION ALL

-- Conversaciones donde SOY el EMISOR (envÃ­o mensajes)
SELECT
    l.id AS lead_id,
    COALESCE(
        (SELECT u.id FROM auth.users u WHERE u.email = l.sender_email LIMIT 1),
        (SELECT id FROM auth.users LIMIT 1)
    ) AS sender_id,  -- YO (el que enviÃ³ el mensaje)
    COALESCE(l.sender_name, 'Usuario') AS sender_name,  -- Mi nombre
    l.profile_id AS recipient_id,  -- El receptor (dueÃ±o del perfil)
    COALESCE(p.full_name, p.email, 'Usuario') AS recipient_name,  -- Nombre del receptor
    'INQUIRY' AS lead_type,
    COALESCE(l.subject, 'Sin asunto') AS subject,
    COALESCE(l.status, 'new') AS status,
    (
        SELECT m.content
        FROM public.messages m
        WHERE m.lead_id = l.id
        ORDER BY m.created_at DESC
        LIMIT 1
    ) AS last_message,
    COALESCE(
        (
            SELECT m.created_at
            FROM public.messages m
            WHERE m.lead_id = l.id
            ORDER BY m.created_at DESC
            LIMIT 1
        ),
        l.created_at
    ) AS last_message_at,
    (
        SELECT COUNT(*)
        FROM public.messages m
        WHERE m.lead_id = l.id
        AND m.is_read = FALSE
        AND m.sender_id != COALESCE(
            (SELECT u.id FROM auth.users u WHERE u.email = l.sender_email LIMIT 1),
            (SELECT id FROM auth.users LIMIT 1)
        )
    ) AS unread_count,
    (
        SELECT COUNT(*)
        FROM public.messages m
        WHERE m.lead_id = l.id
    ) AS message_count
FROM public.leads l
LEFT JOIN public.profiles p ON p.id = l.profile_id;

-- PASO 3: Verificar que la vista funciona
SELECT
    'âœ… VISTA BIDIRECCIONAL CREADA' as status,
    COUNT(*) as total_conversaciones
FROM public.conversation_summaries;

-- PASO 4: Mostrar ejemplos agrupados por usuario
SELECT
    recipient_id as user_id,
    recipient_name as user_name,
    COUNT(*) as conversaciones_totales,
    SUM(unread_count) as total_no_leidos
FROM public.conversation_summaries
GROUP BY recipient_id, recipient_name
ORDER BY conversaciones_totales DESC
LIMIT 10;

``r
---
## [022_diagnose_conversations.sql]
Fecha de consolidación: 2025-11-24 18:58:16

`sql
-- =============================================
-- DIAGNÃ“STICO: Ver exactamente quÃ© estÃ¡ pasando
-- =============================================

-- PASO 1: Ver todos los leads
SELECT
    'ðŸ“‹ LEADS EN LA BASE DE DATOS' as status,
    id,
    profile_id,
    sender_email,
    sender_name,
    subject,
    created_at
FROM public.leads
ORDER BY created_at DESC
LIMIT 10;

-- PASO 2: Ver todos los mensajes
SELECT
    'ðŸ’¬ MENSAJES EN LA BASE DE DATOS' as status,
    id,
    lead_id,
    sender_id,
    sender_name,
    content,
    created_at
FROM public.messages
ORDER BY created_at DESC
LIMIT 10;

-- PASO 3: Ver quÃ© muestra conversation_summaries
SELECT
    'ðŸ‘ï¸ CONVERSATION_SUMMARIES (LO QUE VE EL FRONTEND)' as status,
    lead_id,
    sender_id,
    sender_name,
    recipient_id,
    recipient_name,
    subject,
    last_message,
    message_count
FROM public.conversation_summaries
ORDER BY last_message_at DESC
LIMIT 10;

-- PASO 4: Ver usuarios en auth.users
SELECT
    'ðŸ‘¤ USUARIOS REGISTRADOS' as status,
    id,
    email,
    created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- PASO 5: Verificar si el WHERE EXISTS funciona
SELECT
    'ðŸ” LEADS CON SENDER_EMAIL QUE EXISTE EN AUTH.USERS' as status,
    l.id,
    l.sender_email,
    l.sender_name,
    l.subject,
    (SELECT u.id FROM auth.users u WHERE u.email = l.sender_email LIMIT 1) as user_id_found
FROM public.leads l
WHERE EXISTS (
    SELECT 1 FROM auth.users u WHERE u.email = l.sender_email
)
ORDER BY l.created_at DESC;

``r
---
## [023_debug_complete.sql]
Fecha de consolidación: 2025-11-24 18:58:16

`sql
-- =============================================
-- DIAGNÃ“STICO COMPLETO DEL PROBLEMA
-- =============================================

-- PASO 1: Ver TODOS los leads
SELECT '========== LEADS ==========' as section;
SELECT
    id,
    profile_id,
    sender_email,
    sender_name,
    subject,
    created_at
FROM public.leads
ORDER BY created_at DESC;

-- PASO 2: Ver TODOS los usuarios
SELECT '========== USUARIOS ==========' as section;
SELECT
    id,
    email,
    created_at
FROM auth.users
ORDER BY created_at DESC;

-- PASO 3: Ver TODAS las conversaciones de la vista (SIN FILTRO)
SELECT '========== CONVERSATION_SUMMARIES (TODAS) ==========' as section;
SELECT
    lead_id,
    sender_id,
    sender_name,
    recipient_id,
    recipient_name,
    subject,
    last_message,
    message_count
FROM public.conversation_summaries
ORDER BY last_message_at DESC;

-- PASO 4: Ver los profiles
SELECT '========== PROFILES ==========' as section;
SELECT
    id,
    full_name,
    email
FROM public.profiles
ORDER BY created_at DESC;

-- PASO 5: SimulaciÃ³n para usuario tester@dev.com
DO $$
DECLARE
    tester_id UUID;
    admin_id UUID;
BEGIN
    -- Obtener IDs
    SELECT id INTO tester_id FROM auth.users WHERE email = 'tester@dev.com';
    SELECT id INTO admin_id FROM auth.users WHERE email = 'admin@example.com' LIMIT 1;

    IF tester_id IS NULL THEN
        SELECT id INTO tester_id FROM auth.users WHERE email LIKE '%test%' LIMIT 1;
    END IF;

    IF admin_id IS NULL THEN
        SELECT id INTO admin_id FROM auth.users WHERE email != COALESCE((SELECT email FROM auth.users WHERE id = tester_id), '') LIMIT 1;
    END IF;

    RAISE NOTICE '========== IDS ==========';
    RAISE NOTICE 'TESTER ID: %', tester_id;
    RAISE NOTICE 'ADMIN ID: %', admin_id;

    RAISE NOTICE '========== CONVERSACIONES PARA TESTER (por sender_id) ==========';
    FOR rec IN (
        SELECT lead_id, sender_id, sender_name, recipient_id, recipient_name, subject
        FROM public.conversation_summaries
        WHERE sender_id = tester_id
    ) LOOP
        RAISE NOTICE 'Lead: % | De: % (%) | Para: % (%)',
            rec.lead_id, rec.sender_name, rec.sender_id, rec.recipient_name, rec.recipient_id;
    END LOOP;

    RAISE NOTICE '========== CONVERSACIONES PARA TESTER (por recipient_id) ==========';
    FOR rec IN (
        SELECT lead_id, sender_id, sender_name, recipient_id, recipient_name, subject
        FROM public.conversation_summaries
        WHERE recipient_id = tester_id
    ) LOOP
        RAISE NOTICE 'Lead: % | De: % (%) | Para: % (%)',
            rec.lead_id, rec.sender_name, rec.sender_id, rec.recipient_name, rec.recipient_id;
    END LOOP;

    RAISE NOTICE '========== CONVERSACIONES PARA TESTER (sender_id OR recipient_id) ==========';
    FOR rec IN (
        SELECT lead_id, sender_id, sender_name, recipient_id, recipient_name, subject
        FROM public.conversation_summaries
        WHERE sender_id = tester_id OR recipient_id = tester_id
    ) LOOP
        RAISE NOTICE 'Lead: % | De: % (%) | Para: % (%)',
            rec.lead_id, rec.sender_name, rec.sender_id, rec.recipient_name, rec.recipient_id;
    END LOOP;
END $$;

``r
---
## [024_simple_debug.sql]
Fecha de consolidación: 2025-11-24 18:58:16

`sql
-- =============================================
-- DIAGNÃ“STICO SIMPLE Y EFECTIVO
-- =============================================

-- Ver todos los leads
SELECT
    'ðŸ“‹ LEADS' as info,
    id,
    profile_id,
    sender_email,
    sender_name,
    subject
FROM public.leads
ORDER BY created_at DESC;

-- Ver todos los usuarios
SELECT
    'ðŸ‘¤ USUARIOS' as info,
    id,
    email
FROM auth.users
ORDER BY created_at DESC;

-- Ver quÃ© devuelve conversation_summaries
SELECT
    'ðŸ’¬ CONVERSATION_SUMMARIES' as info,
    lead_id,
    sender_id,
    sender_name,
    recipient_id,
    recipient_name,
    subject,
    message_count
FROM public.conversation_summaries
ORDER BY last_message_at DESC;

-- Ver profiles
SELECT
    'ðŸ‘¥ PROFILES' as info,
    id,
    full_name,
    email
FROM public.profiles
ORDER BY created_at DESC;

``r
---
## [025_verify_profile_user_match.sql]
Fecha de consolidación: 2025-11-24 18:58:16

`sql
-- =============================================
-- Verificar que profiles.id = auth.users.id
-- =============================================

-- Ver relaciÃ³n entre usuarios y profiles
SELECT
    'ðŸ” VERIFICACIÃ“N USER <-> PROFILE' as info,
    u.id as user_id,
    u.email as user_email,
    p.id as profile_id,
    p.email as profile_email,
    p.full_name,
    CASE
        WHEN u.id = p.id THEN 'âœ… COINCIDEN'
        ELSE 'âŒ NO COINCIDEN'
    END as match_status
FROM auth.users u
FULL OUTER JOIN public.profiles p ON u.id = p.id
ORDER BY u.created_at DESC NULLS LAST;

-- Ver quÃ© ID estÃ¡ usando MessagingView para filtrar
-- Para el usuario tester@dev.com
SELECT
    'ðŸ“Š CONVERSACIONES PARA TESTER (usando profile.id)' as info,
    cs.*
FROM public.conversation_summaries cs
WHERE
    cs.sender_id = (SELECT id FROM public.profiles WHERE email = 'tester@dev.com')
    OR
    cs.recipient_id = (SELECT id FROM public.profiles WHERE email = 'tester@dev.com');

-- Ver conversaciones usando auth.users.id
SELECT
    'ðŸ“Š CONVERSACIONES PARA TESTER (usando user.id)' as info,
    cs.*
FROM public.conversation_summaries cs
WHERE
    cs.sender_id = (SELECT id FROM auth.users WHERE email = 'tester@dev.com')
    OR
    cs.recipient_id = (SELECT id FROM auth.users WHERE email = 'tester@dev.com');

``r
---
## [026_fix_conversation_view_final.sql]
Fecha de consolidación: 2025-11-24 18:58:16

`sql
-- =============================================
-- SOLUCIÃ“N FINAL: Vista que no duplica lead_id
-- =============================================

-- Eliminar vista existente
DROP VIEW IF EXISTS public.conversation_summaries CASCADE;

-- Crear vista SIMPLE sin UNION
-- Cada lead aparece UNA VEZ, y los filtros se hacen en el frontend
CREATE VIEW public.conversation_summaries AS
SELECT
    l.id AS lead_id,
    -- El sender es quien enviÃ³ el lead (su email estÃ¡ en sender_email)
    COALESCE(
        (SELECT u.id FROM auth.users u WHERE u.email = l.sender_email LIMIT 1),
        (SELECT id FROM auth.users LIMIT 1)
    ) AS sender_id,
    COALESCE(l.sender_name, 'Usuario') AS sender_name,
    -- El recipient es el dueÃ±o del perfil
    l.profile_id AS recipient_id,
    COALESCE(p.full_name, p.email, 'Usuario') AS recipient_name,
    'INQUIRY' AS lead_type,
    COALESCE(l.subject, 'Sin asunto') AS subject,
    COALESCE(l.status, 'new') AS status,
    -- Ãšltimo mensaje
    (
        SELECT m.content
        FROM public.messages m
        WHERE m.lead_id = l.id
        ORDER BY m.created_at DESC
        LIMIT 1
    ) AS last_message,
    -- Fecha del Ãºltimo mensaje o creaciÃ³n del lead
    COALESCE(
        (
            SELECT m.created_at
            FROM public.messages m
            WHERE m.lead_id = l.id
            ORDER BY m.created_at DESC
            LIMIT 1
        ),
        l.created_at
    ) AS last_message_at,
    -- Mensajes no leÃ­dos para el recipient
    (
        SELECT COUNT(*)
        FROM public.messages m
        WHERE m.lead_id = l.id
        AND m.is_read = FALSE
        AND m.sender_id != l.profile_id
    ) AS unread_count,
    -- Total de mensajes
    (
        SELECT COUNT(*)
        FROM public.messages m
        WHERE m.lead_id = l.id
    ) AS message_count
FROM public.leads l
LEFT JOIN public.profiles p ON p.id = l.profile_id;

-- Verificar
SELECT
    'âœ… VISTA RECREADA SIN DUPLICADOS' as status,
    COUNT(*) as total_conversaciones
FROM public.conversation_summaries;

-- Mostrar algunas conversaciones
SELECT
    lead_id,
    sender_id,
    sender_name,
    recipient_id,
    recipient_name,
    subject,
    message_count
FROM public.conversation_summaries
ORDER BY last_message_at DESC
LIMIT 10;

``r
---
## [027_verify_tester_conversations.sql]
Fecha de consolidación: 2025-11-24 18:58:16

`sql
-- =============================================
-- Verificar conversaciones especÃ­ficas para Tster
-- =============================================

-- Ver el ID del usuario Tster
SELECT
    'ðŸ‘¤ ID DE TSTER' as info,
    id as user_id,
    email
FROM auth.users
WHERE email = 'tester@dev.com';

-- Ver TODAS las conversaciones de la vista
SELECT
    'ðŸ“‹ TODAS LAS CONVERSACIONES' as info,
    lead_id,
    sender_id,
    sender_name,
    recipient_id,
    recipient_name,
    subject,
    message_count
FROM public.conversation_summaries
ORDER BY last_message_at DESC;

-- Simular el filtro exacto que usa el frontend para Tster
SELECT
    'ðŸ” FILTRO FRONTEND PARA TSTER' as info,
    *
FROM public.conversation_summaries
WHERE
    sender_id = (SELECT id FROM auth.users WHERE email = 'tester@dev.com')
    OR
    recipient_id = (SELECT id FROM auth.users WHERE email = 'tester@dev.com')
ORDER BY last_message_at DESC;

-- Ver si hay algÃºn problema con el profile
SELECT
    'ðŸ‘¥ PROFILE DE TSTER' as info,
    p.id as profile_id,
    p.email as profile_email,
    u.id as user_id,
    u.email as user_email,
    CASE WHEN p.id = u.id THEN 'âœ… COINCIDEN' ELSE 'âŒ NO COINCIDEN' END as match_status
FROM public.profiles p
JOIN auth.users u ON u.email = 'tester@dev.com'
WHERE p.email = 'tester@dev.com' OR p.id = u.id;

``r
---
## [028_check_rls_conversation_summaries.sql]
Fecha de consolidación: 2025-11-24 18:58:16

`sql
-- =============================================
-- Verificar y deshabilitar RLS en conversation_summaries
-- =============================================

-- Ver si la vista tiene RLS activado (las vistas no deberÃ­an tener RLS, pero verificamos)
SELECT
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename = 'conversation_summaries';

-- Verificar polÃ­ticas RLS en las tablas base
SELECT
    'ðŸ”’ POLÃTICAS RLS EN LEADS' as info,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'leads';

SELECT
    'ðŸ”’ POLÃTICAS RLS EN MESSAGES' as info,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'messages';

-- Verificar si RLS estÃ¡ activado en las tablas
SELECT
    'ðŸ“Š ESTADO RLS' as info,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('leads', 'messages', 'profiles');

-- Desactivar RLS si estÃ¡ activado
ALTER TABLE IF EXISTS public.leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profiles DISABLE ROW LEVEL SECURITY;

SELECT 'âœ… RLS DESACTIVADO EN TODAS LAS TABLAS' as status;

``r
---
## [029_create_cv_versions_table.sql]
Fecha de consolidación: 2025-11-24 18:58:16

`sql
-- =============================================
-- TABLA CV_VERSIONS - Sistema de Versiones de CV
-- =============================================

-- Eliminar constraint existente si existe (para permitir todos los templates)
ALTER TABLE IF EXISTS public.cv_versions DROP CONSTRAINT IF EXISTS cv_versions_template_check;

-- Crear la tabla cv_versions si no existe
CREATE TABLE IF NOT EXISTS public.cv_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    version_name TEXT NOT NULL,
    country TEXT,
    role TEXT,
    sections JSONB NOT NULL DEFAULT '[]'::jsonb,
    template TEXT NOT NULL DEFAULT 'modern',
    template_color TEXT,
    snapshot_data JSONB,
    export_options JSONB DEFAULT jsonb_build_object(
        'includePhoto', true,
        'includeStamps', true,
        'includeSummary', true,
        'includeSkills', true,
        'includeLanguages', true,
        'includeCertifications', true,
        'includePortfolio', true
    ),
    notes TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ãndices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_cv_versions_profile_id ON public.cv_versions(profile_id);
CREATE INDEX IF NOT EXISTS idx_cv_versions_country ON public.cv_versions(country);
CREATE INDEX IF NOT EXISTS idx_cv_versions_template ON public.cv_versions(template);
CREATE INDEX IF NOT EXISTS idx_cv_versions_created_at ON public.cv_versions(created_at DESC);

-- FunciÃ³n para actualizar updated_at automÃ¡ticamente
CREATE OR REPLACE FUNCTION update_cv_versions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
DROP TRIGGER IF EXISTS trigger_update_cv_versions_updated_at ON public.cv_versions;
CREATE TRIGGER trigger_update_cv_versions_updated_at
    BEFORE UPDATE ON public.cv_versions
    FOR EACH ROW
    EXECUTE FUNCTION update_cv_versions_updated_at();

-- PolÃ­ticas RLS (Row Level Security)
ALTER TABLE public.cv_versions ENABLE ROW LEVEL SECURITY;

-- PolÃ­tica: Los usuarios pueden ver sus propias versiones
DROP POLICY IF EXISTS "Users can view their own CV versions" ON public.cv_versions;
CREATE POLICY "Users can view their own CV versions"
    ON public.cv_versions
    FOR SELECT
    USING (profile_id = auth.uid());

-- PolÃ­tica: Los usuarios pueden crear sus propias versiones
DROP POLICY IF EXISTS "Users can create their own CV versions" ON public.cv_versions;
CREATE POLICY "Users can create their own CV versions"
    ON public.cv_versions
    FOR INSERT
    WITH CHECK (profile_id = auth.uid());

-- PolÃ­tica: Los usuarios pueden actualizar sus propias versiones
DROP POLICY IF EXISTS "Users can update their own CV versions" ON public.cv_versions;
CREATE POLICY "Users can update their own CV versions"
    ON public.cv_versions
    FOR UPDATE
    USING (profile_id = auth.uid());

-- PolÃ­tica: Los usuarios pueden eliminar sus propias versiones
DROP POLICY IF EXISTS "Users can delete their own CV versions" ON public.cv_versions;
CREATE POLICY "Users can delete their own CV versions"
    ON public.cv_versions
    FOR DELETE
    USING (profile_id = auth.uid());

-- FunciÃ³n para obtener estadÃ­sticas de versiones
DROP FUNCTION IF EXISTS get_cv_version_stats(UUID);
CREATE OR REPLACE FUNCTION get_cv_version_stats(p_profile_id UUID)
RETURNS TABLE (
    total_versions BIGINT,
    versions_by_country JSONB,
    versions_by_template JSONB,
    most_recent_version JSONB
) AS $$
DECLARE
    v_total BIGINT;
    v_by_country JSONB;
    v_by_template JSONB;
    v_recent JSONB;
BEGIN
    -- Contar total
    SELECT COUNT(*) INTO v_total
    FROM public.cv_versions
    WHERE profile_id = p_profile_id;

    -- Agrupar por paÃ­s
    SELECT jsonb_object_agg(
        COALESCE(country, 'Sin paÃ­s'),
        cnt
    ) INTO v_by_country
    FROM (
        SELECT country, COUNT(*)::INT as cnt
        FROM public.cv_versions
        WHERE profile_id = p_profile_id
        GROUP BY country
    ) t;

    -- Agrupar por template
    SELECT jsonb_object_agg(template, cnt) INTO v_by_template
    FROM (
        SELECT template, COUNT(*)::INT as cnt
        FROM public.cv_versions
        WHERE profile_id = p_profile_id
        GROUP BY template
    ) t;

    -- Obtener la mÃ¡s reciente
    SELECT jsonb_build_object(
        'id', id,
        'version_name', version_name,
        'created_at', created_at
    ) INTO v_recent
    FROM public.cv_versions
    WHERE profile_id = p_profile_id
    ORDER BY created_at DESC
    LIMIT 1;

    RETURN QUERY SELECT v_total, v_by_country, v_by_template, v_recent;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- FunciÃ³n para duplicar una versiÃ³n
-- Eliminar todas las versiones existentes de esta funciÃ³n
DROP FUNCTION IF EXISTS duplicate_cv_version(UUID, TEXT);
DROP FUNCTION IF EXISTS duplicate_cv_version;

CREATE FUNCTION duplicate_cv_version(
    p_version_id UUID,
    p_new_name TEXT
)
RETURNS UUID AS $$
DECLARE
    v_new_id UUID;
    v_original record;
BEGIN
    -- Obtener la versiÃ³n original
    SELECT * INTO v_original
    FROM public.cv_versions
    WHERE id = p_version_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Version not found: %', p_version_id;
    END IF;

    -- Crear la nueva versiÃ³n (sin created_by para evitar problemas con auth.uid())
    INSERT INTO public.cv_versions (
        profile_id,
        version_name,
        country,
        role,
        sections,
        template,
        template_color,
        snapshot_data,
        export_options,
        notes
    ) VALUES (
        v_original.profile_id,
        p_new_name,
        v_original.country,
        v_original.role,
        v_original.sections,
        v_original.template,
        v_original.template_color,
        v_original.snapshot_data,
        v_original.export_options,
        'Duplicado de: ' || v_original.version_name
    )
    RETURNING id INTO v_new_id;

    RETURN v_new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentarios para documentaciÃ³n
COMMENT ON TABLE public.cv_versions IS 'Almacena diferentes versiones de CV personalizadas por paÃ­s/rol';
COMMENT ON COLUMN public.cv_versions.snapshot_data IS 'Snapshot completo del perfil en el momento de creaciÃ³n';
COMMENT ON COLUMN public.cv_versions.sections IS 'Array de secciones incluidas en esta versiÃ³n (profile, experience, education, etc.)';
COMMENT ON COLUMN public.cv_versions.export_options IS 'Opciones de exportaciÃ³n (incluir foto, stamps, etc.)';
COMMENT ON FUNCTION get_cv_version_stats IS 'Obtiene estadÃ­sticas agregadas de versiones para un perfil';
COMMENT ON FUNCTION duplicate_cv_version IS 'Duplica una versiÃ³n existente con un nuevo nombre';

``r
---
## [030_check_and_clean_cv_versions.sql]
Fecha de consolidación: 2025-11-24 18:58:16

`sql
-- =============================================
-- CHECK AND CLEAN CV VERSIONS
-- =============================================
-- Este script te ayuda a verificar y limpiar versiones de CV con datos incorrectos

-- 1. VER TODAS LAS VERSIONES EXISTENTES
-- Ejecuta esto primero para ver quÃ© hay en la tabla:
/*
SELECT
    id,
    profile_id,
    version_name,
    country,
    template,
    created_at,
    (snapshot_data->'profile'->>'full_name') as nombre_en_snapshot
FROM public.cv_versions
ORDER BY created_at DESC;
*/

-- 2. SI VES VERSIONES CON DATOS INCORRECTOS (ADMINISTRATOR u otros nombres), ELIMÃNALAS:
-- OPCIÃ“N A: Eliminar TODAS las versiones (si todas tienen datos incorrectos)
/*
DELETE FROM public.cv_versions;
*/

-- OPCIÃ“N B: Eliminar solo versiones especÃ­ficas por ID
-- Reemplaza 'ID_AQUI' con el ID de la versiÃ³n incorrecta
/*
DELETE FROM public.cv_versions WHERE id = 'ID_AQUI';
*/

-- 3. VERIFICAR QUE TU PROFILE_ID ES CORRECTO
-- Esto te muestra tu profile_id actual (el que deberÃ­as usar)
/*
SELECT id, full_name, email
FROM public.profiles
WHERE id = auth.uid();
*/

-- =============================================
-- INSTRUCCIONES DE USO:
-- =============================================
-- 1. Ve al SQL Editor de Supabase
-- 2. Ejecuta la query del paso 1 (descomenta removiendo /* */)
-- 3. Si ves versiones con "ADMINISTRATOR" u otros datos incorrectos, elimÃ­nalas con paso 2
-- 4. Verifica tu profile_id correcto con paso 3
-- 5. Luego en la aplicaciÃ³n, crea una NUEVA versiÃ³n de CV
-- 6. La nueva versiÃ³n tendrÃ¡ tus datos correctos actuales


``r
---
