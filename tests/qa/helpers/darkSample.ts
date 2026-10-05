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
 * Devuelve los colores de los elementos (raiz incluida) cuya clase contiene `dark:`
 * dentro de `rootSelector`, omitiendo los subarboles marcados con
 * `[data-qa-skip]` o que casen con `excludeSelector`.
 */
export async function sampleDarkColors(page: Page, rootSelector: string, opts: { exclude?: string; max?: number } = {}): Promise<ColorSample[]> {
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
  }, [rootSelector, opts.exclude ?? null, opts.max ?? 400] as const);
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

export function diffSamples(before: ColorSample[], after: ColorSample[]): string[] {
  const diffs: string[] = [];
  if (before.length !== after.length) diffs.push(`numero de elementos: ${before.length} -> ${after.length}`);
  const n = Math.min(before.length, after.length);
  for (let i = 0; i < n; i++) {
    const a = before[i], b = after[i];
    if (a.key !== b.key) { diffs.push(`[${i}] clave distinta: ${a.key} | ${b.key}`); continue; }
    for (const p of ['color', 'bg', 'border', 'bgImage'] as const) {
      if (a[p] !== b[p]) diffs.push(`[${a.key}] ${p}: ${a[p]} -> ${b[p]}`);
    }
  }
  return diffs;
}
