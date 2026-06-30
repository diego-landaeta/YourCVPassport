// Supabase Edge Function: admin-create-managed-profile
// ----------------------------------------------------------------------------
// Permite a un usuario con role='profile_manager' crear un PERFIL GESTIONADO:
// un perfil profesional normal (role='professional') que NO tiene login activo
// y cuyo campo managed_by apunta al gestor que lo crea.
//
// Se ejecuta con SERVICE_ROLE porque crear usuarios en auth.users requiere
// privilegios de administrador. El llamante se valida vía su JWT.
// ----------------------------------------------------------------------------

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface CreateManagedProfileRequest {
  full_name: string
  // Email de contacto opcional de la persona (NO se usa para iniciar sesión).
  contact_email?: string
  headline?: string
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (req.method !== 'POST') {
      throw new Error('Method not allowed')
    }

    // --- 1. Autenticar al llamante y comprobar que es profile_manager ---------
    const authHeader = req.headers.get('Authorization') || ''
    const token = authHeader.replace('Bearer ', '').trim()
    if (!token) {
      return json({ error: 'Missing authorization token' }, 401)
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data: callerData, error: callerError } = await admin.auth.getUser(token)
    if (callerError || !callerData?.user) {
      return json({ error: 'Invalid or expired session' }, 401)
    }
    const callerId = callerData.user.id

    const { data: callerProfile, error: profileError } = await admin
      .from('profiles')
      .select('role')
      .eq('id', callerId)
      .single()

    if (profileError || !callerProfile) {
      return json({ error: 'Caller profile not found' }, 403)
    }
    if (callerProfile.role !== 'profile_manager') {
      return json({ error: 'Forbidden: requires profile_manager role' }, 403)
    }

    // --- 2. Validar input -----------------------------------------------------
    const { full_name, contact_email, headline }: CreateManagedProfileRequest = await req.json()
    if (!full_name || !full_name.trim()) {
      return json({ error: 'full_name is required' }, 400)
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
        full_name: full_name.trim(),
        managed: true,
        managed_by: callerId,
      },
    })

    if (createError || !created?.user) {
      return json({ error: `Could not create auth user: ${createError?.message ?? 'unknown'}` }, 500)
    }

    const newUserId = created.user.id

    // --- 4. Insertar el profile gestionado -----------------------------------
    const { data: newProfile, error: insertError } = await admin
      .from('profiles')
      .upsert({
        id: newUserId,
        full_name: full_name.trim(),
        email: contact_email?.trim() || null,
        headline: headline?.trim() || null,
        role: 'professional',
        managed_by: callerId,
      })
      .select('id, full_name, email, headline, slug, managed_by, role, created_at')
      .single()

    if (insertError || !newProfile) {
      // Rollback: si falla el profile, elimina el auth user huérfano.
      await admin.auth.admin.deleteUser(newUserId)
      return json({ error: `Could not create profile: ${insertError?.message ?? 'unknown'}` }, 500)
    }

    return json({ profile: newProfile }, 200)
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unexpected error' }, 500)
  }
})

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
