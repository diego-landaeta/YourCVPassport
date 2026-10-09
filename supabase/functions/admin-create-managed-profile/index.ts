// Supabase Edge Function: admin-create-managed-profile
// ----------------------------------------------------------------------------
// Permite a un usuario con role='profile_manager' crear un PERFIL GESTIONADO:
// un perfil profesional normal (role='professional') que NO tiene login activo
// y cuyo campo managed_by apunta al gestor que lo crea.
//
// Se ejecuta con SERVICE_ROLE porque crear usuarios en auth.users requiere
// privilegios de administrador. El llamante se valida vía su JWT.
//
// Seguridad (auditoría 2026-10-05, U4): CORS con la lista de _shared/cors.ts (antes
// '*'), supabase-js fijado a 2.44.4, entrada con límites y errores
// { error, code } sin mensajes internos de GoTrue/PostgREST (van al log).
// Contrato: POST { full_name, contact_email?, headline? } -> 200 { profile }
//   400 INVALID_INPUT | 401 UNAUTHORIZED | 403 FORBIDDEN | 500 INTERNAL_ERROR
// ----------------------------------------------------------------------------

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.44.4'
import { getCorsHeaders } from '../_shared/cors.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX_NAME = 200
const MAX_HEADLINE = 300

interface CreateManagedProfileRequest {
  full_name: string
  // Email de contacto opcional de la persona (NO se usa para iniciar sesión).
  contact_email?: string
  headline?: string
}

serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req)
  const json = (body: unknown, status: number): Response =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (req.method !== 'POST') {
      return json({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' }, 405)
    }

    // --- 1. Autenticar al llamante y comprobar que es profile_manager ---------
    const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '').trim()
    if (!token) {
      return json({ error: 'Missing authorization token', code: 'UNAUTHORIZED' }, 401)
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data: callerData, error: callerError } = await admin.auth.getUser(token)
    if (callerError || !callerData?.user) {
      return json({ error: 'Invalid or expired session', code: 'UNAUTHORIZED' }, 401)
    }
    const callerId = callerData.user.id

    const { data: callerProfile, error: profileError } = await admin
      .from('profiles')
      .select('role')
      .eq('id', callerId)
      .maybeSingle()

    if (profileError || !callerProfile) {
      return json({ error: 'Caller profile not found', code: 'FORBIDDEN' }, 403)
    }
    if (callerProfile.role !== 'profile_manager') {
      return json({ error: 'Forbidden: requires profile_manager role', code: 'FORBIDDEN' }, 403)
    }

    // --- 2. Validar input -----------------------------------------------------
    let payload: CreateManagedProfileRequest
    try {
      payload = await req.json()
    } catch {
      return json({ error: 'Invalid JSON body', code: 'INVALID_INPUT' }, 400)
    }
    const full_name = typeof payload?.full_name === 'string' ? payload.full_name.trim() : ''
    const contact_email = typeof payload?.contact_email === 'string' ? payload.contact_email.trim() : ''
    const headline = typeof payload?.headline === 'string' ? payload.headline.trim() : ''
    if (!full_name) {
      return json({ error: 'full_name is required', code: 'INVALID_INPUT' }, 400)
    }
    if (full_name.length > MAX_NAME || headline.length > MAX_HEADLINE) {
      return json({ error: 'full_name or headline too long', code: 'INVALID_INPUT' }, 400)
    }
    if (contact_email && (contact_email.length > 254 || !EMAIL_RE.test(contact_email))) {
      return json({ error: 'Invalid contact_email', code: 'INVALID_INPUT' }, 400)
    }

    // --- 3. Crear el usuario Auth "oculto" -----------------------------------
    // Email interno único (no es un buzón real). La persona no inicia sesión.
    const internalEmail = `managed-${crypto.randomUUID()}@managed.yourcvpassport.local`
    // Contraseña aleatoria fuerte que nunca se comparte.
    const randomPassword = crypto.randomUUID() + crypto.randomUUID()

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email: internalEmail,
      password: randomPassword,
      email_confirm: true, // cuenta válida pero inactiva (nadie la usa para entrar)
      user_metadata: {
        full_name,
        managed: true,
        managed_by: callerId,
      },
    })

    if (createError || !created?.user) {
      console.error('[admin-create-managed-profile] createUser:', createError?.message)
      return json({ error: 'Could not create the profile', code: 'INTERNAL_ERROR' }, 500)
    }

    const newUserId = created.user.id

    // --- 4. Insertar el profile gestionado -----------------------------------
    const { data: newProfile, error: insertError } = await admin
      .from('profiles')
      .upsert({
        id: newUserId,
        full_name,
        email: contact_email || null,
        headline: headline || null,
        role: 'professional',
        plan: 'free', // explicito: el default de la columna ('Free') viola profiles_plan_check
        // Plantilla por defecto de los perfiles gestionados: la misma que usan los
        // 19 directores ISEIE y los 13 perfiles de PsikoAprende. Se fija aqui y no
        // como DEFAULT de la columna a proposito: `template IS NULL` es el centinela
        // que varias migraciones usan para detectar wizards sin completar, y un
        // default en la tabla lo romperia para las altas normales.
        // Ademas evita que la ficha publica quede sin plantilla: ProfileViewPage
        // hace templateToRender.startsWith(...) y con NULL lanzaria TypeError.
        template: 'passport',
        managed_by: callerId,
      })
      .select('id, full_name, email, headline, slug, template, managed_by, role, created_at')
      .single()

    if (insertError || !newProfile) {
      console.error('[admin-create-managed-profile] upsert profile:', insertError?.message)
      // Rollback: si falla el profile, elimina el auth user huérfano.
      await admin.auth.admin.deleteUser(newUserId)
      return json({ error: 'Could not create the profile', code: 'INTERNAL_ERROR' }, 500)
    }

    return json({ profile: newProfile }, 200)
  } catch (error) {
    console.error('[admin-create-managed-profile] error interno:', (error as Error)?.message)
    return json({ error: 'Unexpected error', code: 'INTERNAL_ERROR' }, 500)
  }
})
