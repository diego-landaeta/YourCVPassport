-- =====================================================
-- LIMPIAR JAMES WILSON - DEJAR SOLO EMAIL
-- =====================================================
-- Elimina toda la información y deja solo el email
-- =====================================================

DO $$
DECLARE
  v_user_id UUID;
BEGIN

  -- Buscar el usuario
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'james.wilson@iseih.edu';

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no encontrado';
  END IF;

  RAISE NOTICE '🧹 Limpiando toda la información de James Wilson...';

  -- Eliminar TODO
  DELETE FROM experiences WHERE profile_id = v_user_id;
  DELETE FROM education WHERE profile_id = v_user_id;
  DELETE FROM skills WHERE profile_id = v_user_id;
  DELETE FROM languages WHERE profile_id = v_user_id;
  DELETE FROM portfolio_items WHERE profile_id = v_user_id;
  DELETE FROM stamps WHERE profile_id = v_user_id;

  RAISE NOTICE '✅ Eliminados: experiencias, educación, habilidades, idiomas, portfolio, stamps';

  -- Resetear perfil a valores mínimos
  UPDATE profiles SET
    full_name = NULL,
    headline = NULL,
    title = NULL,
    summary = NULL,
    location = NULL,
    country_code = NULL,
    slug = NULL,
    template = 'passport',
    template_color = '#0052FF',
    show_verified_credentials = false,
    show_connect_links = true,
    show_qr_code = true,
    updated_at = NOW()
  WHERE id = v_user_id;

  RAISE NOTICE '✅ Perfil reseteado (solo queda email)';

  RAISE NOTICE '';
  RAISE NOTICE '══════════════════════════════════════';
  RAISE NOTICE '✅ JAMES WILSON LIMPIADO EXITOSAMENTE';
  RAISE NOTICE '══════════════════════════════════════';
  RAISE NOTICE 'Email: james.wilson@iseih.edu';
  RAISE NOTICE 'Todo lo demás eliminado';
  RAISE NOTICE '';

END $$;

-- Verificación
SELECT
  p.id,
  p.email,
  p.full_name,
  p.headline,
  COUNT(DISTINCT e.id) as experiencias,
  COUNT(DISTINCT ed.id) as educacion,
  COUNT(DISTINCT s.id) as skills,
  COUNT(DISTINCT l.id) as idiomas,
  COUNT(DISTINCT pi.id) as portfolio,
  COUNT(DISTINCT st.id) as stamps
FROM profiles p
LEFT JOIN experiences e ON e.profile_id = p.id
LEFT JOIN education ed ON ed.profile_id = p.id
LEFT JOIN skills s ON s.profile_id = p.id
LEFT JOIN languages l ON l.profile_id = p.id
LEFT JOIN portfolio_items pi ON pi.profile_id = p.id
LEFT JOIN stamps st ON st.profile_id = p.id
WHERE p.email = 'james.wilson@iseih.edu'
GROUP BY p.id, p.email, p.full_name, p.headline;
