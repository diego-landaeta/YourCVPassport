/**
 * Muestreo de colores computados de los elementos con variantes `dark:`.
 * Lo usa el test de regresion del cambio de `darkMode` en tailwind.config.js:
 * con `<html class="dark">` los colores deben ser identicos antes y despues.
 */
import type { Page } from '@playwright/test';

export interface ColorSample {
  key: string;
  color: string;
  bg: string;
  border: string;
  bgImage: string;
}

/**
 * Widgets de terceros que se excluyen SIEMPRE de la muestra: su DOM lo inyecta un
 * script externo (que en QA no carga) y no depende de nuestro Tailwind.
 */
export const THIRD_PARTY_WIDGETS = '.opynio-widget';

/**
 * Devuelve los colores de los elementos (raiz incluida) cuya clase contiene `dark:`
 * dentro de `rootSelector`, omitiendo los subarboles de widgets de terceros y los
 * que casen con `opts.exclude` (p. ej. `[data-qa-skip]`).
 */
export async function sampleDarkColors(page: Page, rootSelector: string, opts: { exclude?: string; max?: number } = {}): Promise<ColorSample[]> {
  const exclude = [THIRD_PARTY_WIDGETS, opts.exclude].filter(Boolean).join(', ');
  return page.evaluate(([rootSel, exclude, max]) => {
    const root = document.querySelector(rootSel as string);
    if (!root) throw new Error(`No existe ${rootSel}`);
    const all = [root, ...Array.from(root.querySelectorAll('*'))];
    const out: any[] = [];
    let idx = 0;
    for (const el of all) {
      if (exclude && el.closest(exclude as string) && el !== root) continue;
      const cls = el.getAttribute('class') || '';
      if (!cls.includes('dark:')) continue;
      const cs = getComputedStyle(el);
      out.push({
        key: `${idx++}:${el.tagName.toLowerCase()}:${cls.slice(0, 80)}`,
        color: cs.color,
        bg: cs.backgroundColor,
        border: cs.borderTopColor,
        bgImage: cs.backgroundImage.slice(0, 160),
      });
      if (out.length >= (max as number)) break;
    }
    return out;
  }, [rootSelector, exclude, opts.max ?? 400] as const);
}

/**
 * Color de texto y fondo EFECTIVO de un elemento: compone los fondos
 * semitransparentes de los ancestros hasta encontrar uno opaco (blanco si no hay).
 */
export async function readEffectiveColors(page: Page, selector: string, nth = 0): Promise<{ color: string; bg: string; border: string }> {
  return page.locator(selector).nth(nth).evaluate((el) => {
    const parse = (c: string) => {
      const m = (c.match(/[\d.]+/g) || ['0', '0', '0', '0']).map(Number);
      return { r: m[0], g: m[1], b: m[2], a: m.length > 3 ? m[3] : 1 };
    };
    const layers: Array<{ r: number; g: number; b: number; a: number }> = [];
    let e: Element | null = el;
    while (e) {
      const c = parse(getComputedStyle(e).backgroundColor);
      if (c.a > 0) layers.push(c);
      if (c.a >= 1) break;
      e = e.parentElement;
    }
    let base = { r: 255, g: 255, b: 255 };
    for (let i = layers.length - 1; i >= 0; i--) {
      const l = layers[i];
      base = { r: l.r * l.a + base.r * (1 - l.a), g: l.g * l.a + base.g * (1 - l.a), b: l.b * l.a + base.b * (1 - l.a) };
    }
    const cs = getComputedStyle(el);
    return {
      color: cs.color,
      bg: `rgb(${Math.round(base.r)}, ${Math.round(base.g)}, ${Math.round(base.b)})`,
      border: cs.borderTopColor,
    };
  });
}

/** Clave sin el indice de posicion: `etiqueta:clases`. */
const signature = (s: ColorSample) => s.key.replace(/^\d+:/, '');

/**
 * Compara dos muestras alineandolas por `etiqueta:clases` (subsecuencia comun mas
 * larga) en vez de por posicion. Asi un elemento nuevo o quitado del DOM sale como
 * UNA linea (`+`/`-`) y no desplaza todas las claves que vienen detras (antes un
 * boton nuevo en la cabecera producia decenas de "clave distinta" en cascada).
 *
 * Cuentan como diferencia: los elementos quitados, en los emparejados cualquier
 * cambio de color, fondo, borde o degradado y, salvo `opts.added` = 'ignore', los
 * elementos nuevos. Con 'ignore' los nuevos se devuelven aparte en `opts.onAdded`
 * (no tienen valor de referencia con el que compararse; ver la regresion #19).
 */
export function diffSamples(
  before: ColorSample[],
  after: ColorSample[],
  opts: { added?: 'fail' | 'ignore'; onAdded?: (key: string) => void } = {},
): string[] {
  const a = before.map(signature);
  const b = after.map(signature);
  // lcs[i][j] = longitud de la subsecuencia comun de a[i..] y b[j..]
  const lcs: number[][] = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }
  const diffs: string[] = [];
  let i = 0, j = 0;
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && a[i] === b[j]) {
      for (const p of ['color', 'bg', 'border', 'bgImage'] as const) {
        if (before[i][p] !== after[j][p]) diffs.push(`[${before[i].key}] ${p}: ${before[i][p]} -> ${after[j][p]}`);
      }
      i++; j++;
    } else if (j < b.length && (i >= a.length || lcs[i][j + 1] >= lcs[i + 1][j])) {
      if (opts.added === 'ignore') opts.onAdded?.(after[j].key);
      else diffs.push(`+ elemento nuevo: ${after[j].key}`);
      j++;
    } else {
      diffs.push(`- elemento quitado: ${before[i].key}`);
      i++;
    }
  }
  return diffs;
}
