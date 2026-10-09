/**
 * Utilidades compartidas por las plantillas de CV (excepto Passport).
 */

/**
 * Devuelve una URL externa segura (solo http/https) o `null`.
 *
 * - Sin valor → `null`: la plantilla pinta el texto sin `<a>` (nunca `href="#"`).
 * - Esquemas distintos de http/https (`javascript:`, `data:`, `vbscript:`…) → `null`.
 * - Dominio sin esquema (`linkedin.com/in/x`, `www.web.com`) → se antepone `https://`;
 *   antes salía como enlace relativo al propio sitio.
 */
export const safeExternalUrl = (raw?: string | null): string | null => {
    const value = (raw ?? '').trim();
    if (!value) return null;

    let candidate: string;
    // Esquema = "xxx:" no seguido de dígito (así `web.com:8080/x` es dominio con puerto)
    if (/^[a-z][a-z0-9+.-]*:(?!\d)/i.test(value)) {
        candidate = value;
    } else if (value.startsWith('//')) {
        candidate = `https:${value}`;
    } else if (/^[\w-]+(\.[\w-]+)+([/?#:].*)?$/.test(value)) {
        candidate = `https://${value}`;
    } else {
        return null;
    }

    try {
        const url = new URL(candidate);
        if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
        return url.href;
    } catch {
        return null;
    }
};

/**
 * Email de contacto público de la plantilla. Las plantillas lo leen de
 * `profile.meta_description` (el email real es una columna privada), pero esa
 * columna también guarda descripciones SEO: solo se usa si parece un email, para
 * no pintar "Email: <texto SEO>" con un `mailto:` roto.
 */
export const publicContactEmail = (raw?: string | null): string | null => {
    const value = (raw ?? '').trim();
    return /^[^\s@<>()]+@[^\s@<>()]+\.[^\s@<>()]+$/.test(value) ? value : null;
};

/** Atributos de un enlace externo que abre en otra pestaña. */
export const EXTERNAL_LINK_PROPS = { target: '_blank', rel: 'noopener noreferrer' } as const;

/**
 * Modo exportación de las plantillas con pestañas (Gradient Blue, Coral Pink,
 * Yellow Minimalist). En pantalla solo se ve la pestaña activa; al imprimir
 * (`@media print`) o cuando un ancestro lleva `data-pdf-export="true"` (lo pone el
 * generador de PDF) se muestran todas las pestañas en secuencia con su título y
 * se ocultan los controles de pestaña. Solo CSS: funciona también sobre el clon
 * del DOM que captura el generador de PDF, sin depender de su estado de React.
 *
 * Las clases van completas (no concatenadas) para que Tailwind las detecte.
 */
/** Pestaña inactiva: oculta en pantalla, visible al imprimir/exportar. */
export const TAB_PANEL_INACTIVE = 'hidden print:block [[data-pdf-export=true]_&]:block';
/** Título de cada pestaña: solo al imprimir/exportar. */
export const TAB_EXPORT_TITLE = 'hidden print:block [[data-pdf-export=true]_&]:block';
/** Separación entre pestañas cuando se muestran todas seguidas. */
export const TAB_PANEL_EXPORT_GAP = 'print:mb-16 [[data-pdf-export=true]_&]:mb-16';
/** Controles de pestaña: ocultos al imprimir/exportar. */
export const TAB_CONTROLS = 'print:hidden [[data-pdf-export=true]_&]:hidden';
/** Elementos que en pantalla solo aparecen al pasar el ratón: visibles al imprimir/exportar. */
export const HOVER_ONLY_EXPORT_VISIBLE = 'print:opacity-100 [[data-pdf-export=true]_&]:opacity-100';
