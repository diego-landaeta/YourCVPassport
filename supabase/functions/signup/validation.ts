// Validación de los campos de la bolsa de empleo del alta (`signup`): tipo, idioma,
// fecha de nacimiento (edad mínima) y casillas. Módulo PURO (sin Deno ni red): lo usa
// index.ts y se prueba con Node (validation.test.mjs).
//
// Reglas (auditoría 29/10/2026, S4):
//   - tipo: solo 'empresa' EXACTO sale del camino de candidato. Ausente, vacío, con otras
//     mayúsculas, de otro tipo de dato o desconocido = 'candidato'.
//   - fecha_nacimiento (AAAA-MM-DD real, desde 1900, no futura): obligatoria salvo
//     'empresa'; en 'empresa', si llega, se valida igual. Menor de 16 -> UNDERAGE.
//   - casillas (solo candidato): acepto_condiciones_privacidad y datos_verdaderos a `true`
//     (y autorizacion_tutores si tiene 16 o 17); el resto de opcionales se guardan.

export type SignupTipo = 'candidato' | 'empresa'

export interface SignupFields {
  tipo?: unknown
  registro_idioma?: unknown
  fecha_nacimiento?: unknown
  casillas?: unknown
}

export interface SignupValidated {
  tipo: SignupTipo
  /** 'es' | 'en' | otro código ISO de 2-3 letras; undefined si falta o es raro. */
  registroIdioma: string | undefined
  /** AAAA-MM-DD validada; undefined solo en 'empresa' sin fecha. */
  fechaNacimiento: string | undefined
  /** Edad en años (0 si no hay fecha). */
  age: number
  /** Casillas del candidato normalizadas a boolean (undefined en 'empresa'). */
  acceptedBoxes: Record<string, boolean> | undefined
}

/** Error de validación con el estado HTTP y el código estable que espera el cliente. */
export class SignupValidationError extends Error {
  status: number
  code: string
  constructor(message: string, status = 400, code = 'INVALID_INPUT') {
    super(message)
    this.status = status
    this.code = code
    this.name = 'SignupValidationError'
  }
}

// Claves de casillas del contrato SQL (20261029_legal_aceptaciones_idioma.sql).
export const CANDIDATE_REQUIRED = ['acepto_condiciones_privacidad', 'datos_verdaderos']
export const CANDIDATE_OPTIONAL = ['perfil_publico', 'aparecer_google', 'empresas_contacto', 'alertas_novedades']
export const GUARDIAN_KEY = 'autorizacion_tutores'
export const MIN_AGE = 16
export const ADULT_AGE = 18

// AAAA-MM-DD real (no 2026-02-31), desde 1900 y no futura. Null si no vale.
export function parseBirthDate(value: unknown, now = new Date()): { y: number; m: number; d: number } | null {
  if (typeof value !== 'string') return null
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return null
  const y = Number(match[1])
  const m = Number(match[2])
  const d = Number(match[3])
  const date = new Date(Date.UTC(y, m - 1, d))
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null
  if (y < 1900 || date.getTime() > now.getTime()) return null
  return { y, m, d }
}

/** Edad cumplida, en UTC. */
export function ageFrom(b: { y: number; m: number; d: number }, now = new Date()): number {
  let age = now.getUTCFullYear() - b.y
  const before = now.getUTCMonth() + 1 < b.m || (now.getUTCMonth() + 1 === b.m && now.getUTCDate() < b.d)
  if (before) age -= 1
  return age
}

// 'es' | 'en' | otro código ISO de 2-3 letras; cualquier otra cosa se ignora.
export function normalizeLang(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const base = value.trim().toLowerCase().split('-')[0]
  return /^[a-z]{2,3}$/.test(base) ? base : undefined
}

/** Valida tipo, idioma, edad y casillas. Lanza SignupValidationError (400) si algo no cumple. */
export function validateSignupFields(payload: SignupFields | null | undefined, now = new Date()): SignupValidated {
  const tipo: SignupTipo = payload?.tipo === 'empresa' ? 'empresa' : 'candidato'
  const registroIdioma = normalizeLang(payload?.registro_idioma)

  const rawBirth = payload?.fecha_nacimiento
  const hasBirth = rawBirth !== undefined && rawBirth !== null && rawBirth !== ''
  let fechaNacimiento: string | undefined
  let age = 0
  if (tipo !== 'empresa' || hasBirth) {
    const birth = parseBirthDate(rawBirth, now)
    if (!birth) throw new SignupValidationError('A valid fecha_nacimiento (YYYY-MM-DD) is required')
    age = ageFrom(birth, now)
    if (age < MIN_AGE) throw new SignupValidationError('UNDERAGE: you must be at least 16 years old to register')
    fechaNacimiento = rawBirth as string
  }

  let acceptedBoxes: Record<string, boolean> | undefined
  if (tipo === 'candidato') {
    const raw = payload?.casillas
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new SignupValidationError('casillas is required')
    acceptedBoxes = {}
    for (const key of [...CANDIDATE_REQUIRED, ...CANDIDATE_OPTIONAL, GUARDIAN_KEY]) {
      acceptedBoxes[key] = (raw as Record<string, unknown>)[key] === true
    }
    for (const key of CANDIDATE_REQUIRED) {
      if (!acceptedBoxes[key]) throw new SignupValidationError(`CASILLA_OBLIGATORIA: ${key}`)
    }
    if (age < ADULT_AGE && !acceptedBoxes[GUARDIAN_KEY]) throw new SignupValidationError('CASILLA_OBLIGATORIA: autorizacion_tutores')
  }

  return { tipo, registroIdioma, fechaNacimiento, age, acceptedBoxes }
}
