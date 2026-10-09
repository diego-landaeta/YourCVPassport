// Plantilla base de todos los correos de YourCVPassport (Brevo, _shared/email.ts).
//
// Mismo lenguaje visual que la web (tailwind.config.js, portada y /login):
// logotipo en texto azul cv-blue, panel con el degradado azul → índigo del
// login y titular grande en blanco, tarjeta blanca con sombra suave sobre fondo
// cv-light-gray, botón azul con sombra e iconos de check en círculo azul.
//
// - HTML con tablas y estilos en línea: Gmail, Outlook (escritorio y web),
//   Apple Mail y móviles. El degradado lleva color sólido de respaldo (bgcolor)
//   para Outlook. Sin imágenes: todo se ve aunque el cliente las bloquee.
// - Todo texto que entra se escapa aquí: los llamadores pasan datos en crudo.
//   No hay forma de meter HTML propio en un bloque.
// - Cada correo sale también en texto plano (mejor entregabilidad y lectores).
// - Las URLs solo pueden ser https://, http:// o mailto:; cualquier otra cosa
//   (javascript:, data:...) se sustituye por la web.
//
// Uso: renderEmail({ heading, intro, greeting, blocks: [...] }) → { html, text }.
// El contenido de cada correo está en _shared/emailTemplates.ts.

export const BRAND = {
  name: 'YourCVPassport',
  url: 'https://yourcvpassport.com',
  helpUrl: 'https://yourcvpassport.com/profesionales/ayuda',
  privacyUrl: 'https://yourcvpassport.com/privacidad',
  termsUrl: 'https://yourcvpassport.com/terminos',
  supportEmail: 'support@yourcvpassport.com',
}

// Tokens de la web (tailwind.config.js) + escala gris de Tailwind.
const C = {
  blue: '#2563EB',        // cv-blue
  blueDark: '#1E40AF',    // cv-blue-dark
  indigo: '#4338CA',      // final del degradado del login
  ink: '#111827',         // gray-900 (titulares)
  text: '#374151',        // gray-700
  muted: '#6B7280',       // gray-500
  faint: '#9CA3AF',       // gray-400
  line: '#E5E7EB',        // gray-200
  page: '#F8F9FA',        // cv-light-gray
  soft: '#F9FAFB',        // gray-50
  tint: '#EFF6FF',        // blue-50
  green: '#10B981',       // cv-green
}

export type Tone = 'brand' | 'success' | 'warning' | 'danger' | 'neutral'

const TONES: Record<Tone, { accent: string; bg: string }> = {
  brand: { accent: C.blue, bg: C.tint },
  success: { accent: '#059669', bg: '#ECFDF5' },
  warning: { accent: '#D97706', bg: '#FFFBEB' },
  danger: { accent: '#DC2626', bg: '#FEF2F2' },
  neutral: { accent: '#4B5563', bg: '#F3F4F6' },
}

// Paneles de cabecera: degradado (Gmail, Apple Mail) con color sólido de respaldo.
const HEROES = {
  brand: { solid: '#3049D9', gradient: `linear-gradient(135deg, ${C.blue} 0%, ${C.indigo} 100%)` },
  dark: { solid: '#1F2937', gradient: 'linear-gradient(135deg, #374151 0%, #111827 100%)' },
}

export type Block =
  /** Párrafo de texto. */
  | { type: 'p'; text: string }
  /** Botón principal. Debajo sale el enlace en texto por si el botón no funciona. */
  | { type: 'button'; label: string; url: string; fallback?: boolean }
  /** Código grande (verificación), una casilla por carácter. */
  | { type: 'code'; code: string; caption?: string }
  /** Nota con título y texto, con filete del color del tono. */
  | { type: 'note'; tone: Tone; title?: string; text: string }
  /** Lista con check en círculo azul (como la web). */
  | { type: 'checks'; title?: string; items: string[] }
  /** Pasos numerados en círculo azul. */
  | { type: 'steps'; title?: string; items: string[] }
  /** Tabla de datos (etiqueta → valor). Las filas con valor vacío se omiten. */
  | { type: 'details'; title?: string; rows: [string, string | number | null | undefined][] }
  /** Cita (mensaje de otra persona). */
  | { type: 'quote'; text: string; caption?: string }
  /** Texto pequeño y gris. */
  | { type: 'small'; text: string }

export interface EmailContent {
  /** Texto de vista previa en la bandeja de entrada (no se ve en el cuerpo). */
  preheader: string
  /** Etiqueta pequeña sobre el titular (tipo de correo o estado). */
  eyebrow?: string
  /** Titular grande del panel. */
  heading: string
  /** Frase bajo el titular, dentro del panel. */
  intro?: string
  /** Panel azul de la marca (por defecto) u oscuro (avisos negativos, internos). */
  hero?: keyof typeof HEROES
  /** Saludo, p. ej. "Hola, Ana:". */
  greeting?: string
  blocks: Block[]
  /** Firma "Un saludo, El equipo de YourCVPassport" (por defecto sí). */
  signoff?: boolean
  /** Por qué recibe este correo (pie). */
  footerReason?: string
}

export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** Solo http(s) y mailto; lo demás se cambia por la web. */
export function safeUrl(value: unknown): string {
  const url = String(value ?? '').trim()
  if (/^https?:\/\/[^\s<>"']+$/i.test(url) || /^mailto:[^\s<>"']+$/i.test(url)) return url
  return BRAND.url
}

/** Texto multilínea escapado con <br>. */
function multiline(text: string): string {
  return escapeHtml(text).replace(/\r?\n/g, '<br>')
}

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
const MONO = "'SFMono-Regular', Menlo, Consolas, 'Liberation Mono', monospace"
const TABLE = 'role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"'
const P = `margin:0 0 20px;font-size:16px;line-height:1.7;color:${C.text};`
const SUBTITLE = `margin:0 0 14px;font-size:15px;line-height:1.4;font-weight:700;color:${C.ink};`

/** Círculo de 26px con un carácter centrado (check o número). */
function badge(char: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td width="26" height="26" align="center" valign="middle" bgcolor="${C.blue}" style="width:26px;height:26px;border-radius:13px;background:${C.blue};font-family:${FONT};font-size:13px;font-weight:700;line-height:26px;color:#FFFFFF;">${char}</td></tr></table>`
}

function iconList(title: string | undefined, items: string[], mark: (i: number) => string): string {
  return `${title ? `<p style="${SUBTITLE}">${escapeHtml(title)}</p>` : ''}
<table ${TABLE} style="margin:0 0 28px;">
${items.map((item, i) => `  <tr>
    <td valign="top" width="40" style="width:40px;padding:0 0 14px;">${badge(mark(i))}</td>
    <td valign="middle" style="padding:2px 0 14px;font-size:16px;line-height:1.5;color:${C.text};">${escapeHtml(item)}</td>
  </tr>`).join('\n')}
</table>`
}

function renderBlock(block: Block): string {
  switch (block.type) {
    case 'p':
      return `<p style="${P}">${multiline(block.text)}</p>`

    case 'small':
      return `<p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:${C.muted};">${multiline(block.text)}</p>`

    case 'button': {
      const url = escapeHtml(safeUrl(block.url))
      const button = `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" class="btn" style="margin:8px 0 ${block.fallback === false ? '32px' : '16px'};">
  <tr>
    <td align="center" bgcolor="${C.blue}" style="border-radius:10px;background:${C.blue};box-shadow:0 6px 16px rgba(37,99,235,0.35);">
      <a href="${url}" target="_blank" style="display:inline-block;padding:16px 36px;font-family:${FONT};font-size:16px;font-weight:700;line-height:1.2;color:#FFFFFF;text-decoration:none;border-radius:10px;">${escapeHtml(block.label)}</a>
    </td>
  </tr>
</table>`
      if (block.fallback === false) return button
      return button + `
<p style="margin:0 0 32px;font-size:13px;line-height:1.6;color:${C.muted};">¿No funciona el botón? Copia este enlace en tu navegador:<br>
<a href="${url}" target="_blank" style="font-family:${MONO};font-size:12px;color:${C.blue};text-decoration:none;word-break:break-all;">${url}</a></p>`
    }

    case 'code': {
      const cells = escapeHtml(block.code).split('').map((ch) =>
        `<td align="center" valign="middle" width="46" height="58" style="width:46px;height:58px;background:#FFFFFF;border:1px solid #BFDBFE;border-radius:10px;font-family:${MONO};font-size:28px;font-weight:700;color:${C.ink};">${ch}</td>`
      ).join('<td width="8" style="width:8px;font-size:0;">&nbsp;</td>')
      return `
<table ${TABLE} style="margin:4px 0 28px;">
  <tr>
    <td align="center" style="padding:26px 12px;background:${C.tint};border-radius:14px;">
      ${block.caption ? `<div style="font-size:12px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:${C.blue};margin-bottom:16px;">${escapeHtml(block.caption)}</div>` : ''}
      <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>${cells}</tr></table>
    </td>
  </tr>
</table>`
    }

    case 'note': {
      const t = TONES[block.tone]
      return `
<table ${TABLE} style="margin:0 0 28px;">
  <tr>
    <td style="padding:16px 20px;background:${t.bg};border-left:4px solid ${t.accent};border-radius:0 10px 10px 0;font-size:15px;line-height:1.6;color:${C.text};">
      ${block.title ? `<div style="font-weight:700;color:${C.ink};margin-bottom:2px;">${escapeHtml(block.title)}</div>` : ''}${multiline(block.text)}
    </td>
  </tr>
</table>`
    }

    case 'checks':
      return iconList(block.title, block.items, () => '&#10003;')

    case 'steps':
      return iconList(block.title, block.items, (i) => String(i + 1))

    case 'details': {
      const rows = block.rows.filter(([, v]) => v !== null && v !== undefined && String(v).trim() !== '')
      if (!rows.length) return ''
      return `${block.title ? `<p style="${SUBTITLE}">${escapeHtml(block.title)}</p>` : ''}
<table ${TABLE} style="margin:0 0 28px;background:${C.soft};border:1px solid ${C.line};border-radius:12px;">
${rows.map(([k, v], i) => `  <tr>
    <td valign="top" width="38%" style="padding:13px 18px;width:38%;font-size:14px;line-height:1.5;color:${C.muted};${i ? `border-top:1px solid ${C.line};` : ''}">${escapeHtml(k)}</td>
    <td valign="top" style="padding:13px 18px 13px 0;font-size:15px;line-height:1.5;font-weight:600;color:${C.ink};word-break:break-word;${i ? `border-top:1px solid ${C.line};` : ''}">${multiline(String(v))}</td>
  </tr>`).join('\n')}
</table>`
    }

    case 'quote':
      return `
<table ${TABLE} style="margin:0 0 28px;">
  <tr>
    <td style="padding:18px 22px;background:${C.soft};border:1px solid ${C.line};border-radius:12px;">
      ${block.caption ? `<div style="font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${C.muted};margin-bottom:10px;">${escapeHtml(block.caption)}</div>` : ''}
      <div style="font-size:16px;line-height:1.7;color:${C.text};">${multiline(block.text)}</div>
    </td>
  </tr>
</table>`
  }
}

function blockText(block: Block): string {
  switch (block.type) {
    case 'p':
    case 'small':
      return block.text
    case 'button':
      return `${block.label}: ${safeUrl(block.url)}`
    case 'code':
      return `${block.caption ? `${block.caption}: ` : ''}${block.code}`
    case 'note':
      return [block.title, block.text].filter(Boolean).join('\n')
    case 'checks':
      return [block.title, ...block.items.map((i) => `- ${i}`)].filter(Boolean).join('\n')
    case 'steps':
      return [block.title, ...block.items.map((i, n) => `${n + 1}. ${i}`)].filter(Boolean).join('\n')
    case 'details': {
      const rows = block.rows.filter(([, v]) => v !== null && v !== undefined && String(v).trim() !== '')
      return [block.title, ...rows.map(([k, v]) => `${k}: ${v}`)].filter(Boolean).join('\n')
    }
    case 'quote':
      return [block.caption, block.text.split(/\r?\n/).map((l) => `> ${l}`).join('\n')].filter(Boolean).join('\n')
  }
}

/**
 * Logotipo, tarjeta (panel + cuerpo) y pie, sin <html> ni fondo de página.
 * renderEmail la envuelve; también sirve para juntar varias en una vista previa.
 */
export function renderEmailCard(content: EmailContent): string {
  const year = new Date().getFullYear()
  const hero = HEROES[content.hero ?? 'brand']
  const link = `color:${C.muted};text-decoration:underline;`
  const signoff = content.signoff === false
    ? ''
    : `<p style="margin:12px 0 0;font-size:16px;line-height:1.7;color:${C.text};">Un saludo,<br><strong style="color:${C.ink};">El equipo de ${BRAND.name}</strong></p>`

  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;font-family:${FONT};">
  <tr>
    <td class="px-logo" style="padding:4px 8px 22px;">
      <a href="${BRAND.url}" target="_blank" style="font-family:${FONT};font-size:24px;font-weight:800;letter-spacing:-0.02em;color:${C.blue};text-decoration:none;">${BRAND.name}</a>
    </td>
  </tr>
  <tr>
    <td style="background:#FFFFFF;border-radius:18px;box-shadow:0 10px 30px rgba(17,24,39,0.08);">
      <table ${TABLE}>
        <tr>
          <td class="px" bgcolor="${hero.solid}" style="padding:44px 48px 42px;background-color:${hero.solid};background-image:${hero.gradient};border-radius:18px 18px 0 0;">
            ${content.eyebrow ? `<div style="margin:0 0 12px;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#C7D2FE;">${escapeHtml(content.eyebrow)}</div>` : ''}
            <h1 class="h1" style="margin:0;font-family:${FONT};font-size:32px;line-height:1.15;font-weight:800;letter-spacing:-0.02em;color:#FFFFFF;">${escapeHtml(content.heading)}</h1>
            ${content.intro ? `<p style="margin:14px 0 0;font-size:17px;line-height:1.6;color:#E0E7FF;">${escapeHtml(content.intro)}</p>` : ''}
          </td>
        </tr>
        <tr>
          <td class="px" style="padding:40px 48px 44px;">
            ${content.greeting ? `<p style="${P}">${escapeHtml(content.greeting)}</p>` : ''}
            ${content.blocks.map(renderBlock).join('\n')}
            ${signoff}
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td class="px" align="center" style="padding:28px 32px 4px;font-size:13px;line-height:1.7;color:${C.muted};">
      ${content.footerReason ? `<p style="margin:0 0 10px;">${escapeHtml(content.footerReason)}</p>` : ''}
      <p style="margin:0 0 10px;">Mensaje automático, no respondas a esta dirección. ¿Necesitas ayuda? Escríbenos a <a href="mailto:${BRAND.supportEmail}" style="${link}">${BRAND.supportEmail}</a></p>
      <p style="margin:0;color:${C.faint};"><a href="${BRAND.helpUrl}" style="${link}">Ayuda</a> &nbsp;·&nbsp; <a href="${BRAND.privacyUrl}" style="${link}">Privacidad</a> &nbsp;·&nbsp; <a href="${BRAND.termsUrl}" style="${link}">Términos</a><br>© ${year} ${BRAND.name}</p>
    </td>
  </tr>
</table>`
}

/** Documento HTML completo (head, estilos responsive y fondo) alrededor de `inner`. */
export function wrapEmailDocument(title: string, preheader: string, inner: string): string {
  return `<!DOCTYPE html>
<html lang="es" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${escapeHtml(title)}</title>
<style>
  @media only screen and (max-width: 600px) {
    .px { padding-left: 26px !important; padding-right: 26px !important; }
    .px-logo { padding-left: 6px !important; }
    .outer { padding: 20px 10px !important; }
    .h1 { font-size: 26px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:${C.page};-webkit-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all;">${escapeHtml(preheader)}&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.page}" style="background:${C.page};">
  <tr>
    <td align="center" class="outer" style="padding:40px 16px;">
${inner}
    </td>
  </tr>
</table>
</body>
</html>`
}

export function renderEmailText(content: EmailContent): string {
  const year = new Date().getFullYear()
  return [
    BRAND.name,
    '',
    content.heading,
    content.intro,
    '',
    ...(content.greeting ? [content.greeting, ''] : []),
    ...content.blocks.map((b) => blockText(b)).filter(Boolean).flatMap((t) => [t, '']),
    ...(content.signoff === false ? [] : [`Un saludo,\nEl equipo de ${BRAND.name}`, '']),
    '--',
    content.footerReason,
    `Mensaje automático, no respondas a esta dirección. ¿Necesitas ayuda? Escríbenos a ${BRAND.supportEmail}`,
    `© ${year} ${BRAND.name} · ${BRAND.url}`,
  ].filter((l) => l !== undefined && l !== null).join('\n').replace(/\n{3,}/g, '\n\n')
}

export function renderEmail(content: EmailContent): { html: string; text: string } {
  return {
    html: wrapEmailDocument(content.heading, content.preheader, renderEmailCard(content)),
    text: renderEmailText(content),
  }
}
