// Correos de pagos que manda stripe-webhook (Brevo, _shared/email.ts), en el
// idioma del perfil (profiles.registro_idioma: 'es' | 'en'; por defecto 'es').
//
//   trialEndingEmail   customer.subscription.trial_will_end (3 días antes del fin
//                      de la prueba de 14 días del plan Profesional)
//
// Los datos entran en crudo: la plantilla (_shared/emailLayout.ts) los escapa.

import { BRAND, renderEmail, type EmailLang } from '../_shared/emailLayout.ts'

export interface RenderedEmail {
  subject: string
  html: string
  text: string
}

function hello(lang: EmailLang, name?: string | null): string {
  const n = String(name ?? '').trim().slice(0, 80)
  if (lang === 'en') return n ? `Hi ${n},` : 'Hello,'
  return n ? `Hola, ${n}:` : 'Hola:'
}

export function formatDate(lang: EmailLang, iso: string | null | undefined): string {
  const d = iso ? new Date(iso) : null
  if (!d || Number.isNaN(d.getTime())) return lang === 'en' ? 'in a few days' : 'en unos días'
  return d.toLocaleDateString(lang === 'en' ? 'en-GB' : 'es-ES', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Madrid',
  })
}

/**
 * Aviso de fin de la prueba gratuita del plan Profesional.
 * hasPaymentMethod: ya añadió tarjeta (se cobrará) o no (la suscripción se
 * cancelará y vuelve al plan Gratis).
 */
export function trialEndingEmail(lang: EmailLang, d: {
  name?: string | null
  trialEnd: string | null
  manageUrl: string
  hasPaymentMethod: boolean
}): RenderedEmail {
  const date = formatDate(lang, d.trialEnd)
  const en = lang === 'en'
  const subject = en ? 'Your Professional plan trial ends soon' : 'Tu prueba del plan Profesional termina pronto'
  const blocks = d.hasPaymentMethod
    ? [
        { type: 'p' as const, text: en
          ? `Your free trial of the YourCVPassport Professional plan ends on ${date}. From then on we will charge the card you added and your plan will continue without interruption.`
          : `Tu prueba gratuita del plan Profesional de YourCVPassport termina el ${date}. A partir de ese día se cobrará la tarjeta que añadiste y tu plan seguirá sin interrupciones.` },
        { type: 'button' as const, label: en ? 'Manage my subscription' : 'Gestionar mi suscripción', url: d.manageUrl },
        { type: 'small' as const, text: en
          ? 'If you do not want to continue, cancel before that date from the same page and nothing will be charged.'
          : 'Si no quieres continuar, cancela antes de esa fecha desde la misma página y no se cobrará nada.' },
      ]
    : [
        { type: 'p' as const, text: en
          ? `Your free trial of the YourCVPassport Professional plan ends on ${date}. To keep premium templates, AI tools and unlimited verifications, add a payment card before that date.`
          : `Tu prueba gratuita del plan Profesional de YourCVPassport termina el ${date}. Para seguir con las plantillas premium, la IA y las verificaciones ilimitadas, añade una tarjeta antes de esa fecha.` },
        { type: 'button' as const, label: en ? 'Add my card' : 'Añadir mi tarjeta', url: d.manageUrl },
        { type: 'note' as const, tone: 'brand' as const, title: en ? 'If you do nothing' : 'Si no haces nada', text: en
          ? 'Your account goes back to the Free plan automatically. Your profile and your CV stay as they are and nothing is charged.'
          : 'Tu cuenta vuelve al plan Gratis automáticamente. Tu perfil y tu CV se quedan como están y no se cobra nada.' },
      ]
  return {
    subject,
    ...renderEmail({
      lang,
      preheader: en ? `Your trial ends on ${date}.` : `Tu prueba termina el ${date}.`,
      eyebrow: en ? 'Professional plan' : 'Plan Profesional',
      heading: en ? 'Your trial ends soon' : 'Tu prueba termina pronto',
      intro: en ? `Free trial until ${date}` : `Prueba gratuita hasta el ${date}`,
      greeting: hello(lang, d.name),
      blocks,
      footerReason: en
        ? `You are receiving this email because you started a free trial of the Professional plan on ${BRAND.name}.`
        : `Has recibido este correo porque empezaste una prueba gratuita del plan Profesional en ${BRAND.name}.`,
    }),
  }
}
