-- Fix support account to be a proper brand/entity profile
-- The support account (support-yourcvpassport-com) was showing "Perfil Incompleto"
-- because it was missing full_name, headline, and summary.

UPDATE profiles
SET
  full_name = 'YourCVPassport Support',
  headline = 'Official Support Team · Equipo de Soporte Oficial',
  summary = 'We are the official support team of YourCVPassport. We help professionals build stunning digital CVs, connect with companies, and grow their careers. Need help? Reach us at support@yourcvpassport.com.

Somos el equipo de soporte oficial de YourCVPassport. Ayudamos a profesionales a crear CVs digitales impresionantes, conectarse con empresas y hacer crecer sus carreras. ¿Necesitas ayuda? Escríbenos a support@yourcvpassport.com.',
  country_code = 'ES',
  is_active = true,
  wizard_completed = true
WHERE slug = 'support-yourcvpassport-com';
