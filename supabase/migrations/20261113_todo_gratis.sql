-- 20261113_todo_gratis.sql
-- «Todo gratis hasta nuevo aviso» (#24, pide Manuel 12/11/2026). Se desactiva, no se borra.
--
-- plan_limits: los planes free y basic tienen lo mismo que pro en exportaciones, sellos y
--    plantillas premium (basic entra para que nadie quede peor que un gratuito; el 13/11 no
--    había ningún perfil basic). La IA sigue siendo de pago: can_use_ai y
--    ai_requests_per_month no se tocan.
--
-- Contactar con candidatos (créditos) no entra en la #24 y no se toca.
-- Va con el front de lib/plans.ts (VITE_TODO_GRATIS; se apaga solo con el valor exacto 'false').
-- Orden: esta migración y después el front.
-- Comprobación: SELECT * FROM plan_limits WHERE plan_name IN ('free', 'basic');
--
-- VUELTA ATRÁS (volver a cobrar):
--   UPDATE public.plan_limits SET ats_exports_per_month = 1, stamps_per_month = 3,
--          can_use_premium_templates = false, updated_at = NOW() WHERE plan_name = 'free';
--   UPDATE public.plan_limits SET ats_exports_per_month = 5, stamps_per_month = 10,
--          can_use_premium_templates = false, updated_at = NOW() WHERE plan_name = 'basic';

BEGIN;

UPDATE public.plan_limits
   SET ats_exports_per_month = 0,          -- 0 = ilimitado (antes free 1, basic 5)
       stamps_per_month = 0,               -- 0 = ilimitado (antes free 3, basic 10)
       can_use_premium_templates = true,   -- antes false en los dos
       updated_at = NOW()
 WHERE plan_name IN ('free', 'basic');

COMMIT;
