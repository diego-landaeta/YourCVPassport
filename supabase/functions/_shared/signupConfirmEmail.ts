// Correo de confirmación del ALTA (`signup`), en el idioma de registro y con el texto del
// tipo de cuenta: candidato (CV, sellos) o EMPRESA (completar el registro de la empresa).
//
// Módulo PURO (sin Deno ni red): se prueba con Node (signupConfirmEmail.test.mjs).
//
//   - candidato + es -> el correo de siempre (confirmSignupEmail, sin cambios).
//   - candidato + en -> mismo contenido en inglés.
//   - empresa   + es/en -> asunto, saludo, botón y siguiente paso propios de empresa:
//                          confirmar el correo y completar el registro de la empresa.
//   - Cualquier idioma que no sea 'en' sale en español; cualquier tipo que no sea
//     exactamente 'empresa' sale como candidato (igual que la validación del alta).
//
// El reenvío («Reenviar correo de confirmación», send-email-confirmation) y el correo que
// manda Supabase Auth (send-auth-email) siguen usando confirmSignupEmail en español: solo
// el alta conoce el tipo y el idioma que eligió quien se registra.

import { renderEmail, type Block, type EmailContent, type EmailLang } from './emailLayout.ts'
import { confirmSignupEmail, type RenderedEmail } from './emailTemplates.ts'

export type SignupEmailKind = 'candidato' | 'empresa'

export interface SignupEmailInput {
  /** Solo 'empresa' EXACTO da el correo de empresa. */
  tipo?: unknown
  /** 'en' (o 'en-GB'...) -> inglés; cualquier otro valor -> español. */
  lang?: unknown
  name?: string | null
  link: string
}

export function signupEmailLang(raw: unknown): EmailLang {
  return typeof raw === 'string' && raw.trim().toLowerCase().split('-')[0] === 'en' ? 'en' : 'es'
}

export function signupEmailKind(raw: unknown): SignupEmailKind {
  return raw === 'empresa' ? 'empresa' : 'candidato'
}

function hello(lang: EmailLang, name?: string | null): string {
  const n = String(name ?? '').trim()
  if (lang === 'en') return n ? `Hi ${n},` : 'Hello,'
  return n ? `Hola, ${n}:` : 'Hola:'
}

function build(lang: EmailLang, subject: string, content: EmailContent): RenderedEmail {
  return { subject: subject.replace(/[\r\n]+/g, ' ').trim(), ...renderEmail({ ...content, lang }) }
}

export function buildSignupConfirmEmail(input: SignupEmailInput): RenderedEmail {
  const kind = signupEmailKind(input.tipo)
  const lang = signupEmailLang(input.lang)
  const name = input.name
  const link = input.link
  const en = lang === 'en'

  if (kind === 'candidato' && !en) return confirmSignupEmail({ name, link })

  if (kind === 'candidato') {
    const blocks: Block[] = [
      { type: 'p', text: 'Thanks for creating your YourCVPassport account. To activate it, please confirm that this email address is yours.' },
      { type: 'button', label: 'Confirm my email', url: link },
      { type: 'checks', title: 'With your account you will be able to', items: [
        'Build your CV with professional templates',
        'Verify your experience and education with stamps',
        'Share your profile with your own link',
      ] },
      { type: 'note', tone: 'brand', title: 'The link expires in 24 hours', text: 'If it expires, go to the sign-in page and press “Resend confirmation email”.' },
      { type: 'small', text: 'If you did not create an account, you can ignore this message: without confirmation the account is not activated.' },
    ]
    return build(lang, 'Confirm your email to activate your account', {
      preheader: 'One last step to activate your YourCVPassport account.',
      eyebrow: 'Activate your account',
      heading: 'Confirm your email and start standing out',
      intro: 'You are one step away from your verified professional CV.',
      greeting: hello(lang, name),
      blocks,
      footerReason: 'You are receiving this email because a YourCVPassport account was created with this address.',
    })
  }

  // Cuenta de EMPRESA
  const blocks: Block[] = en
    ? [
        { type: 'p', text: 'Thanks for creating a company account on YourCVPassport. To activate it, please confirm that this email address is yours.' },
        { type: 'button', label: 'Confirm my email', url: link },
        { type: 'steps', title: 'Next steps', items: [
          'Confirm your email with the button above',
          'Sign in and complete your company registration (tax details, website and company email)',
          'We review the registration and let you know by email; publishing job postings is free',
        ] },
        { type: 'note', tone: 'brand', title: 'The link expires in 24 hours', text: 'If it expires, go to the sign-in page and press “Resend confirmation email”.' },
        { type: 'small', text: 'If you did not create an account, you can ignore this message: without confirmation the account is not activated.' },
      ]
    : [
        { type: 'p', text: 'Gracias por crear una cuenta de empresa en YourCVPassport. Para activarla, confirma que esta dirección de correo es tuya.' },
        { type: 'button', label: 'Confirmar mi correo', url: link },
        { type: 'steps', title: 'Siguientes pasos', items: [
          'Confirma tu correo con el botón de arriba',
          'Inicia sesión y completa el registro de tu empresa (datos fiscales, web y correo de la empresa)',
          'Revisamos el registro y te avisamos por correo; publicar ofertas es gratis',
        ] },
        { type: 'note', tone: 'brand', title: 'El enlace caduca en 24 horas', text: 'Si caduca, entra en la página de inicio de sesión y pulsa «Reenviar correo de confirmación».' },
        { type: 'small', text: 'Si no has creado ninguna cuenta, puedes ignorar este mensaje: sin confirmación, la cuenta no se activa.' },
      ]
  return build(lang, en ? 'Confirm your email to complete your company registration' : 'Confirma tu correo para completar el registro de tu empresa', {
    preheader: en ? 'One last step to activate your company account on YourCVPassport.' : 'Un último paso para activar la cuenta de tu empresa en YourCVPassport.',
    eyebrow: en ? 'Company account' : 'Cuenta de empresa',
    heading: en ? 'Confirm your email and complete your company registration' : 'Confirma tu correo y completa el registro de tu empresa',
    intro: en ? 'You are one step away from publishing job postings and finding verified talent.' : 'Estás a un paso de publicar ofertas y encontrar talento verificado.',
    greeting: hello(lang, name),
    blocks,
    footerReason: en
      ? 'You are receiving this email because a YourCVPassport company account was created with this address.'
      : 'Recibes este correo porque se ha creado una cuenta de empresa de YourCVPassport con esta dirección.',
  })
}
