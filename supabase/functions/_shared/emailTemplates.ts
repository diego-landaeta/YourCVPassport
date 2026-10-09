// Contenido de los correos de YourCVPassport sobre la plantilla base
// (_shared/emailLayout.ts). Los datos entran en crudo: la plantilla los escapa.
//
// Devuelven { subject, html, text } para pasar tal cual a sendEmail().
// Vista previa y envío de prueba: ver EMAIL.md.
//
// Correos que existen (y quién los envía):
//   confirmSignupEmail      signup, send-email-confirmation ("Reenviar")
//   passwordResetEmail      send-password-reset
//   magicLinkEmail          send-magic-link
//   verificationCodeEmail   send-verification-email (sello de correo)
//   companyApprovedEmail    company-registration-email (panel de admin)
//   companyRejectedEmail    company-registration-email (panel de admin)
//   pressContactEmail       newsletter-contact (buzón de prensa, interno)
//   inviteEmail, emailChangeEmail, reauthenticationEmail, accountNoticeEmail
//                           send-auth-email (Send Email Hook de Supabase Auth)

import { BRAND, renderEmail, type EmailContent } from './emailLayout.ts'

export interface RenderedEmail {
  subject: string
  html: string
  text: string
}

function build(subject: string, content: EmailContent): RenderedEmail {
  // El asunto es texto plano: sin saltos de línea (cabecera del correo).
  return { subject: subject.replace(/[\r\n]+/g, ' ').trim(), ...renderEmail(content) }
}

/** "Hola, Ana:" o "Hola:" si no hay nombre. */
function hello(name?: string | null): string {
  const n = String(name ?? '').trim()
  return n ? `Hola, ${n}:` : 'Hola:'
}

function truncate(text: unknown, max: number): string {
  const s = String(text ?? '')
  return s.length > max ? `${s.slice(0, max).trimEnd()}…` : s
}

// ---------------------------------------------------------------------------
// Cuenta
// ---------------------------------------------------------------------------

/** Confirmación de alta (signup y "Reenviar correo de confirmación"). */
export function confirmSignupEmail(d: { name?: string | null; link: string }): RenderedEmail {
  return build('Confirma tu correo para activar tu cuenta', {
    preheader: 'Un último paso para activar tu cuenta de YourCVPassport.',
    eyebrow: 'Activa tu cuenta',
    heading: 'Confirma tu correo y empieza a destacar',
    intro: 'Estás a un paso de tener tu CV profesional verificado.',
    greeting: hello(d.name),
    blocks: [
      { type: 'p', text: 'Gracias por crear tu cuenta en YourCVPassport. Para activarla, confirma que esta dirección de correo es tuya.' },
      { type: 'button', label: 'Confirmar mi correo', url: d.link },
      { type: 'checks', title: 'Con tu cuenta podrás', items: [
        'Crear tu CV con plantillas profesionales',
        'Verificar tu experiencia y tu formación con sellos',
        'Compartir tu perfil con un enlace propio',
      ] },
      { type: 'note', tone: 'brand', title: 'El enlace caduca en 24 horas', text: 'Si caduca, entra en la página de inicio de sesión y pulsa «Reenviar correo de confirmación».' },
      { type: 'small', text: 'Si no has creado ninguna cuenta, puedes ignorar este mensaje: sin confirmación, la cuenta no se activa.' },
    ],
    footerReason: 'Has recibido este correo porque se ha creado una cuenta de YourCVPassport con esta dirección.',
  })
}

/** Recuperación de contraseña. */
export function passwordResetEmail(d: { name?: string | null; link: string }): RenderedEmail {
  return build('Restablece tu contraseña', {
    preheader: 'Crea una contraseña nueva para tu cuenta. El enlace caduca en 1 hora.',
    eyebrow: 'Seguridad de la cuenta',
    heading: 'Restablece tu contraseña',
    intro: 'Elige una contraseña nueva y vuelve a tu cuenta en un minuto.',
    greeting: hello(d.name),
    blocks: [
      { type: 'p', text: 'Hemos recibido una solicitud para restablecer la contraseña de tu cuenta. Pulsa el botón para elegir una nueva.' },
      { type: 'button', label: 'Crear contraseña nueva', url: d.link },
      { type: 'note', tone: 'warning', title: 'Por tu seguridad', text: 'El enlace caduca en 1 hora y solo puede usarse una vez. Nunca te pediremos tu contraseña por correo ni por teléfono.' },
      { type: 'small', text: 'Si no has solicitado este cambio, ignora este mensaje: tu contraseña actual sigue siendo válida.' },
    ],
    footerReason: 'Has recibido este correo porque se ha solicitado restablecer la contraseña de esta cuenta.',
  })
}

/** Enlace de acceso sin contraseña. */
export function magicLinkEmail(d: { name?: string | null; link: string }): RenderedEmail {
  return build('Tu enlace de acceso a YourCVPassport', {
    preheader: 'Entra en tu cuenta sin contraseña. El enlace caduca en 1 hora.',
    eyebrow: 'Acceso a tu cuenta',
    heading: 'Entra en tu cuenta con un clic',
    intro: 'Sin contraseñas: tu enlace de acceso personal está listo.',
    greeting: hello(d.name),
    blocks: [
      { type: 'p', text: 'Has solicitado un enlace para entrar en YourCVPassport sin contraseña. Pulsa el botón para acceder a tu cuenta.' },
      { type: 'button', label: 'Iniciar sesión', url: d.link },
      { type: 'note', tone: 'warning', title: 'Por tu seguridad', text: 'El enlace caduca en 1 hora, solo puede usarse una vez y da acceso a tu cuenta: no lo compartas con nadie.' },
      { type: 'small', text: 'Si no has solicitado este acceso, ignora este mensaje. Nadie puede entrar en tu cuenta sin este enlace.' },
    ],
    footerReason: 'Has recibido este correo porque se ha solicitado un enlace de acceso para esta dirección.',
  })
}

/** Código para el sello de correo verificado. */
export function verificationCodeEmail(d: { name?: string | null; code: string }): RenderedEmail {
  return build(`Tu código de verificación: ${d.code}`, {
    preheader: `Introduce ${d.code} en YourCVPassport. Caduca en 15 minutos.`,
    eyebrow: 'Sello de correo verificado',
    heading: 'Tu código de verificación',
    intro: 'Un paso más para añadir el sello de correo verificado a tu perfil.',
    greeting: hello(d.name),
    blocks: [
      { type: 'p', text: 'Introduce este código en YourCVPassport para verificar tu dirección de correo.' },
      { type: 'code', code: d.code, caption: 'Código de verificación' },
      { type: 'note', tone: 'brand', title: 'Caduca en 15 minutos', text: 'Si caduca, puedes pedir uno nuevo desde la misma pantalla de verificación.' },
      { type: 'small', text: 'Si no has solicitado esta verificación, ignora este mensaje. No compartas este código con nadie.' },
    ],
    footerReason: 'Has recibido este correo porque se ha solicitado verificar esta dirección en un perfil de YourCVPassport.',
  })
}

// ---------------------------------------------------------------------------
// Correos que pide Supabase Auth (send-auth-email, Send Email Hook)
// ---------------------------------------------------------------------------

/** Invitación creada desde el panel de Supabase o la API de admin. */
export function inviteEmail(d: { link: string }): RenderedEmail {
  return build('Te han invitado a YourCVPassport', {
    preheader: 'Acepta la invitación y crea tu CV profesional verificado.',
    eyebrow: 'Invitación',
    heading: 'Te damos la bienvenida a YourCVPassport',
    intro: 'Tienes una invitación para unirte a la plataforma.',
    greeting: 'Hola:',
    blocks: [
      { type: 'p', text: 'Te han invitado a crear tu cuenta en YourCVPassport. Pulsa el botón para aceptar la invitación y entrar.' },
      { type: 'button', label: 'Aceptar invitación', url: d.link },
      { type: 'note', tone: 'brand', title: 'El enlace caduca en 24 horas', text: 'Si caduca, pide a quien te invitó que te envíe uno nuevo.' },
      { type: 'small', text: 'Si no esperabas esta invitación, puedes ignorar este mensaje.' },
    ],
    footerReason: 'Has recibido este correo porque te han invitado a YourCVPassport.',
  })
}

/**
 * Cambio de dirección de correo. `target`: 'new' para la dirección nueva
 * (confirmarla) y 'current' para la actual (autorizar el cambio).
 */
export function emailChangeEmail(d: { link: string; target: 'new' | 'current'; newEmail?: string | null }): RenderedEmail {
  const isNew = d.target === 'new'
  return build(isNew ? 'Confirma tu nueva dirección de correo' : 'Confirma el cambio de tu dirección de correo', {
    preheader: isNew ? 'Confirma la dirección nueva de tu cuenta de YourCVPassport.' : 'Has pedido cambiar el correo de tu cuenta.',
    eyebrow: 'Seguridad de la cuenta',
    heading: isNew ? 'Confirma tu nueva dirección' : 'Confirma el cambio de correo',
    intro: isNew ? 'Un paso más para usar esta dirección en tu cuenta.' : 'Por seguridad, autoriza el cambio desde tu dirección actual.',
    greeting: 'Hola:',
    blocks: [
      {
        type: 'p', text: isNew
          ? 'Has pedido usar esta dirección en tu cuenta de YourCVPassport. Pulsa el botón para confirmarla.'
          : `Has pedido cambiar el correo de tu cuenta${d.newEmail ? ` a ${d.newEmail}` : ''}. Pulsa el botón para autorizarlo.`,
      },
      { type: 'button', label: isNew ? 'Confirmar nueva dirección' : 'Autorizar el cambio', url: d.link },
      { type: 'note', tone: 'warning', title: 'Por tu seguridad', text: 'El enlace caduca en 24 horas. El cambio no se completa hasta que se confirma.' },
      { type: 'small', text: 'Si no has pedido este cambio, ignora este mensaje y escríbenos: tu correo actual sigue siendo el de tu cuenta.' },
    ],
    footerReason: 'Has recibido este correo porque se ha pedido cambiar el correo de una cuenta de YourCVPassport.',
  })
}

/** Código para reautenticarse antes de una acción sensible (p. ej. cambiar la contraseña). */
export function reauthenticationEmail(d: { code: string }): RenderedEmail {
  return build(`Tu código de seguridad: ${d.code}`, {
    preheader: `Introduce ${d.code} para confirmar que eres tú.`,
    eyebrow: 'Seguridad de la cuenta',
    heading: 'Confirma que eres tú',
    intro: 'Necesitamos verificar tu identidad para continuar.',
    greeting: 'Hola:',
    blocks: [
      { type: 'p', text: 'Introduce este código en YourCVPassport para completar la acción que has solicitado.' },
      { type: 'code', code: d.code, caption: 'Código de seguridad' },
      { type: 'small', text: 'Si no has solicitado este código, ignora este mensaje y cambia tu contraseña.' },
    ],
    footerReason: 'Has recibido este correo porque se ha pedido un código de seguridad para tu cuenta.',
  })
}

const NOTICES: Record<string, { subject: string; heading: string; text: string }> = {
  password_changed_notification: { subject: 'Tu contraseña se ha cambiado', heading: 'Tu contraseña se ha cambiado', text: 'La contraseña de tu cuenta de YourCVPassport se acaba de cambiar.' },
  email_changed_notification: { subject: 'El correo de tu cuenta se ha cambiado', heading: 'El correo de tu cuenta ha cambiado', text: 'La dirección de correo de tu cuenta de YourCVPassport se acaba de cambiar.' },
  phone_changed_notification: { subject: 'El teléfono de tu cuenta se ha cambiado', heading: 'El teléfono de tu cuenta ha cambiado', text: 'El teléfono de tu cuenta de YourCVPassport se acaba de cambiar.' },
  identity_linked_notification: { subject: 'Se ha vinculado un acceso nuevo a tu cuenta', heading: 'Nuevo método de acceso', text: 'Se ha vinculado un nuevo método de inicio de sesión a tu cuenta de YourCVPassport.' },
  identity_unlinked_notification: { subject: 'Se ha quitado un acceso de tu cuenta', heading: 'Método de acceso eliminado', text: 'Se ha quitado un método de inicio de sesión de tu cuenta de YourCVPassport.' },
  mfa_factor_enrolled_notification: { subject: 'Verificación en dos pasos activada', heading: 'Verificación en dos pasos activada', text: 'Se ha añadido un factor de verificación en dos pasos a tu cuenta de YourCVPassport.' },
  mfa_factor_unenrolled_notification: { subject: 'Verificación en dos pasos desactivada', heading: 'Verificación en dos pasos desactivada', text: 'Se ha quitado un factor de verificación en dos pasos de tu cuenta de YourCVPassport.' },
}

/** Avisos de seguridad que Supabase Auth manda tras un cambio en la cuenta. */
export function accountNoticeEmail(d: { type: string }): RenderedEmail {
  const n = NOTICES[d.type] ?? { subject: 'Cambio en tu cuenta', heading: 'Cambio en tu cuenta', text: 'Se ha producido un cambio en tu cuenta de YourCVPassport.' }
  return build(n.subject, {
    preheader: n.text,
    eyebrow: 'Aviso de seguridad',
    heading: n.heading,
    greeting: 'Hola:',
    blocks: [
      { type: 'p', text: n.text },
      { type: 'note', tone: 'warning', title: '¿No has sido tú?', text: `Cambia tu contraseña cuanto antes y escríbenos a ${BRAND.supportEmail}.` },
    ],
    footerReason: 'Has recibido este aviso porque se ha modificado la seguridad de tu cuenta de YourCVPassport.',
  })
}

// ---------------------------------------------------------------------------
// Empresas (panel de administración)
// ---------------------------------------------------------------------------

export function companyApprovedEmail(d: {
  companyName: string
  companyEmail?: string | null
  taxId?: string | null
  dashboardUrl?: string
}): RenderedEmail {
  return build(`${d.companyName} ya está activa en YourCVPassport`, {
    preheader: 'Tu registro de empresa está aprobado. Ya puedes buscar talento verificado.',
    eyebrow: 'Registro aprobado',
    heading: 'Tu empresa ya está activa',
    intro: 'Empieza a encontrar profesionales con experiencia verificada.',
    greeting: 'Hola:',
    blocks: [
      { type: 'p', text: `Hemos revisado el registro de ${d.companyName} y está aprobado. Desde hoy tienes acceso completo al panel de empresa.` },
      { type: 'details', title: 'Datos registrados', rows: [['Empresa', d.companyName], ['Correo', d.companyEmail], ['NIF / CIF', d.taxId]] },
      { type: 'steps', title: 'Primeros pasos', items: [
        'Completa el perfil de tu empresa',
        'Invita a las personas de tu equipo',
        'Busca candidatos con los filtros avanzados',
      ] },
      { type: 'button', label: 'Ir al panel de empresa', url: d.dashboardUrl || `${BRAND.url}/company/dashboard` },
    ],
    footerReason: `Has recibido este correo porque has registrado ${d.companyName} en YourCVPassport.`,
  })
}

export function companyRejectedEmail(d: { companyName: string; reason?: string | null }): RenderedEmail {
  return build(`Sobre el registro de ${d.companyName} en YourCVPassport`, {
    preheader: 'No hemos podido aprobar el registro. Te explicamos el motivo y cómo continuar.',
    eyebrow: 'Registro de empresa',
    heading: 'No hemos podido aprobar tu registro',
    intro: 'Te explicamos el motivo y cómo puedes continuar.',
    hero: 'dark',
    greeting: 'Hola:',
    blocks: [
      { type: 'p', text: `Gracias por tu interés en YourCVPassport. Hemos revisado el registro de ${d.companyName} y, por el momento, no podemos aprobarlo.` },
      { type: 'note', tone: 'danger', title: 'Motivo', text: d.reason || 'Escríbenos y te explicaremos el motivo en detalle.' },
      { type: 'steps', title: 'Cómo continuar', items: [
        'Revisa que los datos de la empresa sean correctos y estén completos',
        'Comprueba que los documentos se lean con claridad',
        'Vuelve a enviar el registro con la información corregida',
      ] },
      { type: 'button', label: 'Contactar con soporte', url: `mailto:${BRAND.supportEmail}`, fallback: false },
    ],
    footerReason: `Has recibido este correo porque has registrado ${d.companyName} en YourCVPassport.`,
  })
}

// ---------------------------------------------------------------------------
// Interno
// ---------------------------------------------------------------------------

/** Consulta de prensa (va al buzón de prensa, no a usuarios). */
export function pressContactEmail(d: { name: string; outlet?: string | null; email: string; lang?: string | null; message: string }): RenderedEmail {
  return build(`[Prensa] ${d.outlet || d.name}`, {
    preheader: truncate(d.message, 90),
    eyebrow: 'Formulario de prensa',
    heading: 'Nueva consulta de prensa',
    intro: `${d.name}${d.outlet ? ` · ${d.outlet}` : ''}`,
    hero: 'dark',
    blocks: [
      { type: 'details', rows: [['Nombre', d.name], ['Medio', d.outlet || '-'], ['Correo', d.email], ['Idioma', d.lang]] },
      { type: 'quote', caption: 'Mensaje', text: d.message },
      { type: 'small', text: 'Responde a este correo para contestar directamente a quien escribió.' },
    ],
    signoff: false,
    footerReason: 'Enviado desde el formulario de prensa de yourcvpassport.com.',
  })
}
