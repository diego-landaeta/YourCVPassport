-- Issue #4, punto 38: la moneda de las expectativas salariales preseleccionaba USD para un usuario de España.
--
-- Causa: profiles.salary_currency tenia DEFAULT 'USD' en la base. El asistente ya calcula la moneda por pais
-- (PreferencesSection.defaultCurrencyFor: eurozona o pais sin indicar -> EUR) pero solo cuando el valor viene vacio,
-- y todo perfil nuevo nacia con 'USD' (hoy: 105 perfiles en USD, 22 en EUR), asi que nunca llegaba a usarse.
--
-- Cambio: quitar el valor por defecto. Los perfiles nuevos nacen con NULL y el asistente elige por pais.
-- NO se tocan los perfiles existentes: no se puede saber cuales eligieron USD a proposito.
--
-- Reaplicable. Vuelta atras:  ALTER TABLE public.profiles ALTER COLUMN salary_currency SET DEFAULT 'USD';

ALTER TABLE public.profiles ALTER COLUMN salary_currency DROP DEFAULT;
