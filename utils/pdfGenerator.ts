/**
 * PDF Generator Utility
 *
 * Generates PDF from CV using html2canvas and jspdf
 * Downloads the PDF file directly without print dialog
 *
 * Los saltos de página no se hacen a altura fija: se eligen en huecos entre bloques
 * (ver "Saltos de página inteligentes") para no partir líneas de texto ni tarjetas.
 */

interface PDFGeneratorOptions {
  profileSlug: string;
  profileId: string;
  fileName?: string;
  onProgress?: (progress: number) => void;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Viewport del iframe oculto donde se renderiza el CV.
 * Antes medía 1200 × 8000 px: dentro del iframe `100vh` valía 8000 px, así que el
 * `min-h-screen` de las plantillas y el `minHeight: 100vh` del contenedor estiraban
 * la captura a 8000 px y el PDF salía siempre con 5 páginas, casi todas vacías (#11).
 * Ahora usamos un viewport de escritorio normal y anulamos esas alturas mínimas en el clon.
 */
const PDF_VIEWPORT_WIDTH = 1200;
const PDF_VIEWPORT_HEIGHT = 1200;

/**
 * Límites del canvas de html2canvas.
 * - Safari/iOS no pinta canvas de más de 16.777.216 px de área (4096²): devuelve un canvas
 *   vacío o lanza error. Con `scale: 3` un CV de 1200 × 4000 px pedía 43 MP.
 * - Chrome y Firefox no admiten lados de más de 32.767 px.
 * Calculamos el `scale` para quedar por debajo de ambos límites con margen. Con un CV
 * corto se mantiene la nitidez anterior (scale 3, o casi); uno largo baja a ~1,7-2,
 * que siguen siendo ~250-290 ppp sobre los 210 mm del A4.
 */
const MAX_CANVAS_PIXELS = 16_000_000;
const MAX_CANVAS_SIDE = 32_000;
const MAX_CAPTURE_SCALE = 3;

/** A4 en mm. */
const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;

/**
 * Si al trocear la captura en páginas A4 la última porción ocupa menos de este
 * porcentaje de una página (restos de redondeo, el padding final o el pie), no se crea
 * una página más: la imagen se reduce ligeramente (como mucho un 5 %) para que quepa
 * en las páginas anteriores, sin perder contenido.
 */
const LAST_PAGE_TOLERANCE = 0.05;

/** Escala de captura según el tamaño en px CSS del contenido. */
export function computeCaptureScale(widthPx: number, heightPx: number): number {
  const w = Math.max(1, widthPx);
  const h = Math.max(1, heightPx);
  return Math.min(
    MAX_CAPTURE_SCALE,
    Math.sqrt(MAX_CANVAS_PIXELS / (w * h)),
    MAX_CANVAS_SIDE / h,
    MAX_CANVAS_SIDE / w,
  );
}

export interface PdfPageLayout {
  /** Número de páginas A4. */
  pages: number;
  /** Ancho y alto (mm) con los que se dibuja la imagen completa en cada página. */
  drawWidth: number;
  drawHeight: number;
  /** Desplazamiento horizontal (mm) para centrar la imagen si se ha reducido. */
  offsetX: number;
}

/**
 * Reparte una captura de `canvasWidth × canvasHeight` px en páginas A4:
 * pages = ceil(alto real / alto de página), sin página extra por restos < 5 %.
 */
export function computePdfLayout(canvasWidth: number, canvasHeight: number): PdfPageLayout {
  const imgHeight = (canvasHeight * A4_WIDTH_MM) / canvasWidth;
  let pages = Math.max(1, Math.ceil(imgHeight / A4_HEIGHT_MM - 1e-6));
  const lastSlice = imgHeight - (pages - 1) * A4_HEIGHT_MM;

  if (pages > 1 && lastSlice < A4_HEIGHT_MM * LAST_PAGE_TOLERANCE) {
    pages -= 1;
    const fit = (pages * A4_HEIGHT_MM) / imgHeight;
    const drawWidth = A4_WIDTH_MM * fit;
    return { pages, drawWidth, drawHeight: imgHeight * fit, offsetX: (A4_WIDTH_MM - drawWidth) / 2 };
  }
  return { pages, drawWidth: A4_WIDTH_MM, drawHeight: imgHeight, offsetX: 0 };
}

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/** Espera a que la página del CV pinte la plantilla (los datos llegan después del onload). */
async function waitForCvTemplate(doc: Document, timeoutMs: number): Promise<Element | null> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const el = doc.querySelector('.cv-template');
    if (el && el.childElementCount > 0) return el;
    await wait(250);
  }
  return doc.querySelector('.cv-template');
}

/**
 * Fuerza la carga de las imágenes `loading="lazy"`: con un iframe de altura normal,
 * las que quedan bajo el pliegue no se descargarían y saldrían sin tamaño en el PDF.
 */
async function loadLazyImages(doc: Document, timeoutMs: number): Promise<void> {
  const images = Array.from(doc.querySelectorAll('img'));
  images.forEach((img) => {
    if (img.loading === 'lazy') img.loading = 'eager';
  });
  await Promise.all(
    images.map((img) => {
      if (img.complete) return Promise.resolve();
      return new Promise<void>((resolve) => {
        const done = () => resolve();
        img.addEventListener('load', done, { once: true });
        img.addEventListener('error', done, { once: true });
        setTimeout(done, timeoutMs);
      });
    })
  );
}

/** Alturas mínimas ligadas al viewport o al A4: `min-h-screen`, `md:min-h-screen`, `min-h-[70vh]`, `min-h-[297mm]`… */
const VIEWPORT_MIN_HEIGHT_CLASS = /(^|\s)([\w-]+:)*min-h-(screen|svh|dvh|lvh|\[[^\]]+\])(?=\s|$)/;

/**
 * Anula en el clon las alturas mínimas que dependen del viewport.
 * Tiene que ser un estilo en línea: html2canvas vuelve a clonar el documento en un
 * iframe con `windowHeight = fullHeight`, y ahí cualquier `100vh` volvería a crecer.
 */
function neutralizeViewportMinHeights(root: HTMLElement): void {
  root.style.minHeight = '0';
  root.querySelectorAll<HTMLElement>('*').forEach((el) => {
    const cls = el.getAttribute('class') || '';
    if (VIEWPORT_MIN_HEIGHT_CLASS.test(cls) || /vh|mm/.test(el.style.minHeight || '')) {
      el.style.minHeight = '0';
    }
  });
}

/** Aire que se deja bajo el último contenido al recortar el fondo sobrante (px CSS). */
const CONTENT_BOTTOM_MARGIN_PX = 32;

/**
 * Posición (px CSS, relativa a `root`) del borde inferior del último contenido visible:
 * texto, imágenes/iconos y cajas con fondo o borde (tarjetas, chips…). Se ignoran las
 * cajas que ocupan más de media plantilla, que son fondos de página o columnas.
 */
function measureContentBottom(root: HTMLElement): number {
  const doc = root.ownerDocument;
  const view = doc.defaultView;
  const rootRect = root.getBoundingClientRect();
  const largeBox = rootRect.height * 0.5;
  let bottom = rootRect.top;

  const range = doc.createRange();
  const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (!node.textContent || !node.textContent.trim()) continue;
    range.selectNodeContents(node);
    const r = range.getBoundingClientRect();
    if (r.height > 0 && r.width > 0) bottom = Math.max(bottom, r.bottom);
  }

  root.querySelectorAll('*').forEach((el) => {
    const r = el.getBoundingClientRect();
    if (!r.height || !r.width) return;
    if (/^(img|svg|video|canvas|picture|iframe)$/i.test(el.tagName)) {
      bottom = Math.max(bottom, r.bottom);
      return;
    }
    if (r.height >= largeBox || !view) return;
    const cs = view.getComputedStyle(el);
    const hasBackground = cs.backgroundImage !== 'none' || !/^(transparent|rgba\(0, 0, 0, 0\))$/.test(cs.backgroundColor);
    const hasBorder = parseFloat(cs.borderBottomWidth) > 0 && cs.borderBottomStyle !== 'none';
    if (hasBackground || hasBorder) bottom = Math.max(bottom, r.bottom);
  });

  return bottom - rootRect.top;
}

// ---------------------------------------------------------------------------
// Saltos de página inteligentes
// ---------------------------------------------------------------------------
//
// Antes la captura se troceaba en páginas A4 a altura fija y el corte atravesaba
// tarjetas, líneas de texto e incluso letras. Ahora, antes de capturar, se miden en el
// clon las cajas que no deben partirse y, para cada página, se elige el punto de corte
// más bajo que caiga en un hueco entre bloques. Después cada página del PDF muestra solo
// su tramo [corte i, corte i+1) y el resto de la hoja queda en blanco.

/** Franja vertical (px CSS, relativa al envoltorio capturado) que un corte no debería atravesar. */
export interface PdfBreakObstacle {
  top: number;
  bottom: number;
  /** Coste de cortar por dentro: PDF_BREAK_WEIGHT_TEXT (prohibido) o PDF_BREAK_WEIGHT_BLOCK (evitable). */
  weight: number;
}

/** Línea de texto, icono, imagen o el pie: no se corta salvo como último recurso. */
export const PDF_BREAK_WEIGHT_TEXT = 1000;
/** Tarjeta, ítem, párrafo o título: se prefiere no partirlo si cabe en una página. */
export const PDF_BREAK_WEIGHT_BLOCK = 10;
/**
 * Coste de dejar en blanco una página entera al final de la hoja. Con 20, partir un
 * bloque (10) solo compensa cuando empujarlo entero a la página siguiente dejaría más
 * de media página vacía.
 */
const PDF_BREAK_WEIGHT_WASTE = 20;
/**
 * Grupo pequeño sin estilo (p. ej. "Grado / Universidad / 2010 - 2012"): un div de
 * bloque con texto que mide menos de un cuarto de página. Coste bajo: separa ítems de
 * una lista sin impedir cortes dentro de contenedores mayores.
 */
export const PDF_BREAK_WEIGHT_GROUP = 3;
/** Distancia mínima (px CSS) entre el corte y el borde superior del siguiente obstáculo. */
const CUT_CLEARANCE_PX = 2;
/**
 * Holgura deseable (px CSS) entre el corte y la línea de texto más cercana. html2canvas
 * no siempre pinta el texto exactamente en su caja del DOM (en WebKit puede desplazarse
 * unos px por la línea base), así que entre dos huecos se prefiere el más ancho.
 */
const CUT_COMFORT_PX = 8;
const PDF_BREAK_WEIGHT_TIGHT = 6;

/** Bloques que no conviene partir (además de los que piden `break-inside: avoid`). */
const AVOID_BREAK_SELECTOR = [
  'li', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'tr', 'dt', 'dd', 'figure', 'blockquote', 'pre',
  'table', 'article', 'section', '[data-pdf-avoid-break]', '.keep-together', '.break-inside-avoid',
].join(',');
const MEDIA_TAGS = /^(img|svg|video|canvas|picture|iframe)$/i;
const HEADING_TAGS = /^h[1-6]$/i;
/** Distancia máxima (px CSS) entre un título y la primera línea que lo sigue para mantenerlos juntos. */
const HEADING_KEEP_WITH_NEXT_PX = 120;

function isTransparent(color: string): boolean {
  return /^(transparent|rgba\(0, 0, 0, 0\))$/.test(color);
}

/**
 * Mide en `root` (ya en el documento) las franjas que los cortes de página deben evitar:
 * - cada línea de texto (getClientRects de los nodos de texto) e imágenes/iconos;
 * - bloques (li, p, títulos, filas, secciones, tarjetas con fondo/borde/sombra,
 *   `break-inside: avoid`, `[data-pdf-avoid-break]`) que caben en una página;
 * - cada título junto con la primera línea que lo sigue (que no quede huérfano al pie).
 * Las posiciones son relativas a `originTop` (borde superior del envoltorio capturado).
 */
export function collectBreakObstacles(root: HTMLElement, originTop: number, pagePx: number): PdfBreakObstacle[] {
  const doc = root.ownerDocument;
  const view = doc.defaultView;
  const obstacles: PdfBreakObstacle[] = [];
  const lines: { top: number; bottom: number; left: number; right: number }[] = [];
  const styleCache = new Map<Element, CSSStyleDeclaration>();
  const styleOf = (el: Element): CSSStyleDeclaration | null => {
    if (!view) return null;
    let cs = styleCache.get(el);
    if (!cs) {
      cs = view.getComputedStyle(el);
      styleCache.set(el, cs);
    }
    return cs;
  };

  // Líneas de texto
  const range = doc.createRange();
  const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (!node.textContent || !node.textContent.trim()) continue;
    const parent = node.parentElement;
    if (parent && styleOf(parent)?.visibility === 'hidden') continue;
    range.selectNodeContents(node);
    const rects = range.getClientRects();
    for (let i = 0; i < rects.length; i++) {
      const r = rects[i];
      if (r.width <= 0 || r.height <= 0 || r.height >= pagePx) continue;
      const line = { top: r.top - originTop, bottom: r.bottom - originTop, left: r.left, right: r.right };
      lines.push(line);
      obstacles.push({ top: line.top, bottom: line.bottom, weight: PDF_BREAK_WEIGHT_TEXT });
    }
  }
  range.detach?.();
  lines.sort((a, b) => a.top - b.top);

  root.querySelectorAll('*').forEach((el) => {
    // Lo de dentro de un SVG va con el propio SVG
    if (el.parentElement && el.parentElement.closest('svg')) return;
    const r = el.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0 || r.height >= pagePx) return;
    const top = r.top - originTop;
    const bottom = r.bottom - originTop;

    if (MEDIA_TAGS.test(el.tagName)) {
      obstacles.push({ top, bottom, weight: r.height <= pagePx / 2 ? PDF_BREAK_WEIGHT_TEXT : PDF_BREAK_WEIGHT_BLOCK });
      return;
    }

    const cs = styleOf(el);
    let avoid = el.matches(AVOID_BREAK_SELECTOR);
    if (!avoid && cs) {
      const breakInside = cs.breakInside || cs.getPropertyValue('page-break-inside');
      const hasBackground = cs.backgroundImage !== 'none' || !isTransparent(cs.backgroundColor);
      const hasBorder =
        (parseFloat(cs.borderTopWidth) > 0 && cs.borderTopStyle !== 'none') ||
        (parseFloat(cs.borderBottomWidth) > 0 && cs.borderBottomStyle !== 'none');
      const hasShadow = !!cs.boxShadow && cs.boxShadow !== 'none';
      avoid = /avoid/.test(breakInside) || hasBackground || hasBorder || hasShadow;
    }
    if (avoid) {
      obstacles.push({ top, bottom, weight: PDF_BREAK_WEIGHT_BLOCK });
    } else if (cs && r.height <= pagePx / 4 && !/^(inline|contents|none)$/.test(cs.display) && (el.textContent || '').trim()) {
      obstacles.push({ top, bottom, weight: PDF_BREAK_WEIGHT_GROUP });
    }

    // Título + primera línea que lo sigue en su misma columna
    if (HEADING_TAGS.test(el.tagName)) {
      const next = lines.find((l) =>
        l.top >= bottom - 1 &&
        l.top - bottom <= HEADING_KEEP_WITH_NEXT_PX &&
        l.right > r.left && l.left < r.right
      );
      if (next && next.bottom - top < pagePx) obstacles.push({ top, bottom: next.bottom, weight: PDF_BREAK_WEIGHT_BLOCK });
    }
  });

  return obstacles;
}

/**
 * Elige dónde termina la página que empieza en `start` (corte en `(start, start + pagePx]`):
 * el punto que minimiza el coste de las franjas que atraviesa más el espacio que deja en
 * blanco. Si todos los puntos posibles cortan texto (un bloque más alto que una página
 * sin huecos entre líneas), se corta a altura fija.
 */
export function findPageCut(obstacles: PdfBreakObstacle[], start: number, pagePx: number): number {
  const limit = start + pagePx;
  // También los que empiezan justo bajo el límite: cuentan para la holgura del corte
  const relevant = obstacles.filter((o) => o.bottom > start && o.top < limit + CUT_COMFORT_PX);

  const boundaries = new Set<number>([start, limit]);
  relevant.forEach((o) => {
    if (o.top > start && o.top < limit) boundaries.add(o.top);
    if (o.bottom > start && o.bottom < limit) boundaries.add(o.bottom);
  });
  const sorted = Array.from(boundaries).sort((a, b) => a - b);
  const obstacleTops = new Set(relevant.map((o) => o.top));

  // Candidatos: cada borde (cortar justo entre dos líneas que se tocan) y, en cada
  // hueco entre bordes, el punto más bajo que deja aire con el siguiente obstáculo.
  const candidates: number[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const a = sorted[i];
    candidates.push(a);
    if (i === sorted.length - 1) break;
    const b = sorted[i + 1];
    candidates.push((a + b) / 2);
    if (b === limit && !obstacleTops.has(limit)) {
      candidates.push(limit);
    } else if (b - a > 2 * CUT_CLEARANCE_PX) {
      candidates.push(b - CUT_CLEARANCE_PX);
    }
    if (b - a > 2 * CUT_COMFORT_PX) candidates.push(b - CUT_COMFORT_PX);
  }

  let best = limit;
  let bestCost = Infinity;
  for (const y of candidates) {
    if (y <= start + 1 || y > limit) continue;
    let cost = ((limit - y) / pagePx) * PDF_BREAK_WEIGHT_WASTE;
    let nearestText = Infinity;
    for (const o of relevant) {
      if (o.top < y && o.bottom > y) cost += o.weight;
      else if (o.weight >= PDF_BREAK_WEIGHT_TEXT) nearestText = Math.min(nearestText, o.top >= y ? o.top - y : y - o.bottom);
    }
    // Hueco estrecho junto a una línea de texto: válido, pero peor que uno holgado
    if (nearestText < CUT_COMFORT_PX) cost += ((CUT_COMFORT_PX - nearestText) / CUT_COMFORT_PX) * PDF_BREAK_WEIGHT_TIGHT;
    if (cost < bestCost - 1e-9 || (Math.abs(cost - bestCost) <= 1e-9 && y > best)) {
      bestCost = cost;
      best = y;
    }
  }
  // Último recurso: no hay hueco sin texto en toda la página → altura fija
  return bestCost >= PDF_BREAK_WEIGHT_TEXT ? limit : best;
}

/**
 * Posiciones (px CSS) donde empieza cada página para un contenido de alto `totalHeight`.
 * La primera es siempre 0 y el tramo de la última página nunca supera `pagePx`.
 */
export function computePageStarts(obstacles: PdfBreakObstacle[], totalHeight: number, pagePx: number): number[] {
  const starts = [0];
  let start = 0;
  while (totalHeight - start > pagePx + 0.5) {
    const cut = findPageCut(obstacles, start, pagePx);
    starts.push(cut);
    start = cut;
  }
  return starts;
}

interface PagePlan {
  /** Inicio de cada página (px CSS relativos al envoltorio). */
  starts: number[];
  /** Alto al que hay que dejar el clon para que el pie cierre la última página (null = no tocar). */
  cloneHeight: number | null;
}

/**
 * Reparte en páginas el CV (`cvClone`) más el pie, con el pie siempre al final de la
 * última página con contenido (ninguna página vacía, #11): el fondo sobrante de la
 * plantilla bajo el último contenido se recorta lo necesario.
 */
function planPages(wrapper: HTMLElement, cvClone: HTMLElement, footer: HTMLElement, pagePx: number, naturalCloneHeight: number): PagePlan {
  const originTop = wrapper.getBoundingClientRect().top;
  const cloneRect = cvClone.getBoundingClientRect();
  const cloneTop = cloneRect.top - originTop;
  const footerRect = footer.getBoundingClientRect();
  // Lo que ocupa el pie más el hueco que lo separa del clon (p. ej. el margen inferior
  // del último hijo, que se colapsa a través del clon y no cuenta en su alto)
  const footerBlock = footerRect.height + Math.max(0, footerRect.top - cloneRect.bottom);
  const contentBottom = cloneTop + Math.min(naturalCloneHeight, measureContentBottom(cvClone) + CONTENT_BOTTOM_MARGIN_PX);

  const obstacles = collectBreakObstacles(cvClone, originTop, pagePx);
  // El pie va (virtualmente) justo bajo el contenido, no se parte y viaja con la última
  // línea de texto: así la última página nunca queda solo con el pie y fondo (#11).
  let lastTextTop = -Infinity;
  for (const o of obstacles) {
    if (o.weight >= PDF_BREAK_WEIGHT_TEXT && o.top < contentBottom) lastTextTop = Math.max(lastTextTop, o.top);
  }
  const footerGroupTop = Number.isFinite(lastTextTop) && contentBottom + footerBlock - lastTextTop < pagePx ? lastTextTop : contentBottom;
  obstacles.push({ top: footerGroupTop, bottom: contentBottom + footerBlock, weight: PDF_BREAK_WEIGHT_TEXT });
  const starts = computePageStarts(obstacles, contentBottom + footerBlock, pagePx);

  const lastStart = starts[starts.length - 1];
  const maxCloneHeight = Math.floor(lastStart + pagePx - footerBlock - cloneTop);
  const cloneHeight = naturalCloneHeight > maxCloneHeight
    ? Math.max(maxCloneHeight, Math.ceil(contentBottom - cloneTop))
    : null;
  return { starts, cloneHeight };
}

/**
 * Crea un canvas de `páginas × alto A4` (en px de la captura) con el tramo de cada página
 * arriba de su hoja y blanco debajo. Así jsPDF sigue incrustando una sola imagen y el
 * troceo a altura fija de computePdfLayout cae siempre en los cortes elegidos.
 */
function composePagedCanvas(capture: HTMLCanvasElement, pageStarts: number[], captureHeightCss: number): HTMLCanvasElement {
  const pageCanvasHeight = (capture.width * A4_HEIGHT_MM) / A4_WIDTH_MM;
  const pageCanvasFloor = Math.floor(pageCanvasHeight);
  const k = capture.height / captureHeightCss; // px de canvas por px CSS en vertical
  const paged = document.createElement('canvas');
  paged.width = capture.width;
  // floor: el alto en mm nunca pasa de páginas × 297, así que no aparece una página extra
  paged.height = Math.floor(pageStarts.length * pageCanvasHeight);
  const ctx = paged.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context not available');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, paged.width, paged.height);
  for (let i = 0; i < pageStarts.length; i++) {
    const sy = Math.round(pageStarts[i] * k);
    const ey = i + 1 < pageStarts.length ? Math.round(pageStarts[i + 1] * k) : capture.height;
    const sh = Math.min(ey - sy, pageCanvasFloor, capture.height - sy);
    if (sh <= 0) continue;
    const dy = Math.ceil(i * pageCanvasHeight);
    ctx.drawImage(capture, 0, sy, capture.width, sh, 0, dy, capture.width, sh);
  }
  return paged;
}

/**
 * Generate PDF from CV by loading it in a hidden iframe and capturing with html2canvas
 * Downloads the PDF file directly
 */
export async function generateCVPDF(options: PDFGeneratorOptions): Promise<void> {
  const { profileSlug, profileId, fileName, onProgress, onSuccess, onError } = options;
  let iframe: HTMLIFrameElement | null = null;

  try {
    // Dynamic imports to reduce bundle size
    const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
      import('html2canvas'),
      import('jspdf')
    ]);

    if (onProgress) onProgress(10);

    // Construct CV URL. `?export=1` marca la carga como exportación, no como visita real
    // al perfil (la analítica de visitas debe ignorarlo; lo implementa otra unidad).
    // El pie del PDF muestra la dirección sin el parámetro.
    const profilePath = `/cv/${profileSlug || profileId}`;
    const cvUrl = `${window.location.origin}${profilePath}?export=1`;

    if (onProgress) onProgress(20);

    // Create hidden iframe to load the CV
    const frame = document.createElement('iframe');
    iframe = frame;
    frame.style.position = 'fixed';
    frame.style.left = '-9999px';
    frame.style.top = '-9999px';
    frame.style.width = `${PDF_VIEWPORT_WIDTH}px`;
    frame.style.height = `${PDF_VIEWPORT_HEIGHT}px`;
    frame.style.overflow = 'visible';
    frame.setAttribute('aria-hidden', 'true');
    document.body.appendChild(frame);

    // Load CV in iframe
    await new Promise<void>((resolve, reject) => {
      frame.onload = () => {
        setTimeout(() => resolve(), 3000); // Increased wait time for all content to render
      };
      frame.onerror = () => reject(new Error('Failed to load CV'));
      frame.src = cvUrl;
    });

    if (onProgress) onProgress(40);

    // Get iframe document
    const iframeDoc = frame.contentDocument || frame.contentWindow?.document;
    if (!iframeDoc) {
      throw new Error('Cannot access iframe content');
    }

    // Find the CV template container (without header/footer navigation)
    const cvContainer = await waitForCvTemplate(iframeDoc, 15000);
    if (!cvContainer) {
      throw new Error('CV template container not found');
    }
    // Las plantillas pueden reaccionar a la exportación (p. ej. mostrar todas las
    // pestañas); el clon hereda el atributo.
    cvContainer.setAttribute('data-pdf-export', 'true');
    await loadLazyImages(iframeDoc, 8000);

    // Force light theme by removing dark mode classes
    const html = iframeDoc.documentElement;
    html.classList.remove('dark');
    iframeDoc.body.classList.remove('dark');
    iframeDoc.body.style.backgroundColor = '#ffffff';

    // Remove dark mode from all child elements
    const allElements = iframeDoc.querySelectorAll('*');
    allElements.forEach((el: any) => {
      el.classList.remove('dark');
    });

    // Force the CV container to show ALL content (remove any height restrictions)
    const cvElement = cvContainer as HTMLElement;
    cvElement.style.height = 'auto';
    cvElement.style.maxHeight = 'none';
    cvElement.style.overflow = 'visible';

    // Only hide floating buttons and external navigation (not CV content)
    const floatingButtons = iframeDoc.querySelectorAll('button[class*="fixed"], button[class*="floating"]');
    floatingButtons.forEach((el: any) => {
      el.style.display = 'none';
    });

    // Hide the "own profile" message that shows for logged-in users
    const ownProfileMessages = iframeDoc.querySelectorAll('[class*="bg-blue-50"]');
    ownProfileMessages.forEach((el: any) => {
      const text = el.textContent || '';
      if (text.includes('Este es tu perfil') || text.includes('This is your profile')) {
        el.style.display = 'none';
      }
    });

    // Wait for styles to settle after removing dark classes
    await wait(500);

    // Create a wrapper to include CV and footer.
    // Sin minHeight: su alto tiene que ser exactamente el del contenido (#11).
    const wrapper = iframeDoc.createElement('div');
    wrapper.style.backgroundColor = '#ffffff';
    wrapper.style.padding = '0';
    wrapper.style.margin = '0';
    wrapper.style.width = '100%';

    // Clone CV content FIRST
    const cvClone = cvContainer.cloneNode(true) as HTMLElement;

    // Alturas mínimas ligadas al viewport (min-h-screen, min-h-[70vh], min-h-[297mm]…)
    neutralizeViewportMinHeights(cvClone);

    // UI interactiva que las plantillas ya marcan como no imprimible (`print:hidden`):
    // los botones "Contáctame / Agendar Reunión" (ProfileContactButtons y
    // PassportTemplate) y el aviso de perfil propio. En un PDF no se pueden pulsar.
    cvClone.querySelectorAll('.print\\:hidden, .no-print').forEach((el) => el.remove());

    // Guionado automático (index.css: `hyphens: auto` en el texto justificado de las
    // plantillas): html2canvas no pinta el guion que inserta el navegador y la palabra
    // salía partida en dos líneas sin guion ("coordin / ando"). En el PDF se desactiva.
    cvClone.querySelectorAll<HTMLElement>('p, li, blockquote').forEach((el) => {
      el.style.hyphens = 'manual';
      el.style.setProperty('-webkit-hyphens', 'manual');
    });

    // FIX: html2canvas has issues with bg-clip-text and text-transparent
    // It renders the background gradient as a solid block or makes text invisible.
    // We must replace gradient text with solid color for PDF export.
    const gradientTextElements = cvClone.querySelectorAll('.text-transparent, .bg-clip-text');
    gradientTextElements.forEach((el: any) => {
      el.classList.remove('text-transparent', 'bg-clip-text');
      el.style.backgroundImage = 'none';
      el.style.background = 'transparent';
      el.style.webkitTextFillColor = 'initial';
      el.style.color = '#111827'; // Force dark color for visibility on white background
    });

    // NOW modify the CLONED header to remove dark elements
    const clonedHeaders = cvClone.querySelectorAll('header');
    clonedHeaders.forEach((header: any) => {
      // Force white background
      header.style.background = 'white';
      header.style.backgroundImage = 'none';
      header.style.backgroundColor = 'white';

      // Find and remove the gradient overlay divs (first two divs in header)
      const allDivs = Array.from(header.querySelectorAll('div'));
      allDivs.forEach((div: any, index: number) => {
        // Remove first 2 divs (they are the gradient overlays)
        if (index < 2 && div.classList.contains('absolute')) {
          div.remove();
        }
      });
    });

    wrapper.appendChild(cvClone);

    // Pie: "Powered by YourCVPassport" y la dirección del CV online.
    // Antes la URL iba en una caja "Contact Information" incrustada en la cabecera de
    // la plantilla; ahora es una línea discreta en el pie. Se construye con
    // textContent porque el slug viene de la base de datos.
    const footer = iframeDoc.createElement('div');
    footer.style.textAlign = 'center';
    footer.style.padding = '16px';
    footer.style.fontSize = '11px';
    footer.style.lineHeight = '1.6';
    footer.style.color = '#666666';
    footer.style.backgroundColor = '#f9fafb';
    footer.style.borderTop = '1px solid #e5e7eb';
    const poweredBy = iframeDoc.createElement('div');
    poweredBy.append('Powered by ');
    const brand = iframeDoc.createElement('strong');
    brand.style.color = '#2563eb';
    brand.textContent = 'YourCVPassport';
    poweredBy.appendChild(brand);
    const profileLine = iframeDoc.createElement('div');
    profileLine.textContent = `${window.location.host}${profilePath}`;
    footer.appendChild(poweredBy);
    footer.appendChild(profileLine);
    wrapper.appendChild(footer);

    // Clear body and add only our wrapper
    iframeDoc.body.innerHTML = '';
    iframeDoc.body.appendChild(wrapper);

    if (onProgress) onProgress(50);

    // Wait a bit more for styles to apply
    await wait(500);

    // Saltos de página: se eligen sobre el clon ya maquetado (ver planPages). Si hay que
    // recortar el fondo sobrante para que el pie cierre la última página, el recorte
    // (`overflow: hidden`) puede mover el contenido unos px (deja de colapsar márgenes),
    // así que en ese caso se vuelve a medir y planificar con el recorte ya aplicado.
    const fullWidth = wrapper.scrollWidth || PDF_VIEWPORT_WIDTH;
    const pagePx = (fullWidth * A4_HEIGHT_MM) / A4_WIDTH_MM;
    const naturalCloneHeight = cvClone.getBoundingClientRect().height;
    let plan = planPages(wrapper, cvClone, footer, pagePx, naturalCloneHeight);
    if (plan.cloneHeight !== null) {
      cvClone.style.height = `${plan.cloneHeight}px`;
      cvClone.style.overflow = 'hidden';
      plan = planPages(wrapper, cvClone, footer, pagePx, naturalCloneHeight);
      if (plan.cloneHeight !== null) cvClone.style.height = `${plan.cloneHeight}px`;
    }
    const pageStarts = plan.starts;

    // Alto real del contenido (ya sin alturas mínimas de viewport)
    const fullHeight = Math.ceil(wrapper.scrollHeight);
    wrapper.style.height = `${fullHeight}px`;

    // Red de seguridad: si por redondeos el final no cabe en la última página, se añaden
    // páginas a altura fija antes que perder el pie.
    while (fullHeight - pageStarts[pageStarts.length - 1] > pagePx + 1) {
      pageStarts.push(pageStarts[pageStarts.length - 1] + pagePx);
    }

    // Wait for layout to settle
    await wait(300);

    // Generate canvas from wrapper element with optimized settings for FULL content.
    // La escala se calcula con el alto final paginado (páginas × alto A4), que es el
    // canvas más grande que se llega a crear.
    const canvas = await html2canvas(wrapper, {
      scale: computeCaptureScale(fullWidth, Math.max(fullHeight, pageStarts.length * pagePx)), // Nitidez máxima sin pasar del límite de canvas de Safari/iOS
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: PDF_VIEWPORT_WIDTH,
      windowHeight: fullHeight, // Use full height
      width: fullWidth,
      height: fullHeight, // Capture full height
      x: 0,
      y: 0,
      scrollX: 0,
      scrollY: 0,
      allowTaint: true,
      foreignObjectRendering: false,
      imageTimeout: 15000, // Increased timeout
      removeContainer: false
    });

    if (onProgress) onProgress(70);

    if (!canvas.width || !canvas.height) {
      throw new Error('Empty canvas');
    }

    // Componer una imagen "paginada": cada página A4 recibe solo su tramo de la captura
    // [inicio de página, inicio de la siguiente) y el resto de la hoja queda en blanco,
    // de modo que ningún salto atraviesa texto ni tarjetas.
    const pagedCanvas = composePagedCanvas(canvas, pageStarts, fullHeight);
    // Liberar cuanto antes la captura original (memoria de canvas limitada en iOS)
    canvas.width = 0;
    canvas.height = 0;

    const layout = computePdfLayout(pagedCanvas.width, pagedCanvas.height);

    // Create PDF with better compression settings
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
      precision: 2
    });

    // Convert canvas to image with maximum quality
    const imgData = pagedCanvas.toDataURL('image/jpeg', 0.95); // Use JPEG with high quality for smaller file size
    pagedCanvas.width = 0;
    pagedCanvas.height = 0;

    // Cada página muestra la misma imagen paginada desplazada una altura de página hacia
    // arriba (jsPDF la incrusta una sola vez y la reutiliza en todas las páginas).
    for (let page = 0; page < layout.pages; page++) {
      if (page > 0) pdf.addPage();
      pdf.addImage(imgData, 'JPEG', layout.offsetX, -page * A4_HEIGHT_MM, layout.drawWidth, layout.drawHeight, undefined, 'FAST');
    }

    if (onProgress) onProgress(90);

    // Generate filename
    const pdfFileName = fileName || `CV-${profileSlug || profileId}-${new Date().toISOString().split('T')[0]}.pdf`;

    // Save PDF
    pdf.save(pdfFileName);

    if (onProgress) onProgress(100);

    // Call success callback
    if (onSuccess) {
      onSuccess();
    }

  } catch (error) {

    if (onError) {
      onError(error instanceof Error ? error : new Error('Unknown error'));
    }
  } finally {
    // Cleanup: quitar el iframe también si algo falla a mitad
    if (iframe && iframe.parentNode) {
      iframe.parentNode.removeChild(iframe);
    }
  }
}

/**
 * Alternative: Generate PDF using html2canvas + jspdf
 * This generates a real PDF file that downloads automatically
 * Note: This requires the CV to be rendered in the current page
 */
export async function generateCVPDFDirect(elementId: string, fileName: string): Promise<void> {
  // Dynamic import to reduce bundle size
  const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf')
  ]);

  // Get the element to convert
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with id "${elementId}" not found`);
  }

  // Generate canvas from HTML
  const canvas = await html2canvas(element, {
    scale: 2, // Higher quality
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff'
  });

  // Calculate dimensions
  const imgWidth = 210; // A4 width in mm
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  // Create PDF
  const pdf = new jsPDF({
    orientation: imgHeight > imgWidth ? 'portrait' : 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  // Add image to PDF
  const imgData = canvas.toDataURL('image/png');
  pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

  // Save PDF
  pdf.save(fileName);
}
