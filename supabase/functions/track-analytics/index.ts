// Supabase Edge Function: track-analytics (RETIRADA, responde 410 Gone)
//
// Seguridad (auditoría 2026-10-05, U4). La versión anterior aceptaba eventos de
// cualquiera (CORS '*', sin autenticación) y confiaba en el profileId del body:
// permitía inflar o falsear las estadísticas de cualquier perfil e insertar
// filas con service role saltándose la RLS.
//
// No la llama nadie: ni el frontend (src, dist) ni SQL (comprobado con grep; solo
// la mencionan los tests antiguos de tests/edge-functions contra producción).
// Las visitas se registran por otras vías, así que se deja inerte en vez de
// endurecerla: responde 410 { error, code: 'GONE' } a todo salvo al preflight.
// El código anterior está en el historial de git (commit 8600856) si algún día
// hace falta recuperarla; en ese caso: JWT o firma de servidor, profileId
// validado contra perfiles publicados y CORS de _shared/cors.ts.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getCorsHeaders } from '../_shared/cors.ts';

serve((req: Request) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  return new Response(
    JSON.stringify({ error: 'This endpoint has been retired', code: 'GONE' }),
    { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  );
});
