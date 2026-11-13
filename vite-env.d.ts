/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  // La IA se sirve desde la Edge Function ai-cv-assistant; no hay clave en el cliente.
  // 'false' oculta/desactiva las funciones de IA en la interfaz.
  readonly VITE_AI_ENABLED?: string
  // «Todo gratis» (#24, lib/plans.ts). Encendido salvo que valga 'false'.
  readonly VITE_TODO_GRATIS?: string
  readonly VITE_TENOR_API_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
