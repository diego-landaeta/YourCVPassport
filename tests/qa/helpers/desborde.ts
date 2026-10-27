import { expect, type Page } from '@playwright/test';

/**
 * Afirma que la página no tiene scroll horizontal, MIDIENDO CUANDO SE HA ASENTADO.
 *
 * Medirlo justo al cargar daba falsos rojos: con la máquina cargada (la suite corre en paralelo,
 * y en CI más) hay elementos que aún están entrando con una animación o esperando a las fuentes y
 * por un instante se salen unos píxeles (4 px), aunque la página en reposo no se desborde. Esos
 * fallos eran de la medición, no de la página: en reposo la misma página mide 0 a 390 y a 1280 px,
 * y el test pasa solo.
 *
 * Esto NO esconde un desborde real: se reintenta hasta `plazoMs`, y si al final sigue habiendo
 * desborde el test falla y dice qué elementos se salen y cuánto.
 */
export async function esperarSinDesborde(page: Page, plazoMs = 8000): Promise<void> {
  const medir = () => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  try {
    await expect.poll(medir, { timeout: plazoMs, intervals: [100, 250, 500, 1000] }).toBeLessThanOrEqual(0);
  } catch {
    const sobra = await medir();
    const culpables = await page.evaluate(() => {
      const ancho = window.innerWidth;
      return [...document.querySelectorAll('body *')]
        .map((el) => ({ el, r: el.getBoundingClientRect() }))
        .filter(({ r }) => r.width > 0 && r.right > ancho + 0.5)
        .slice(0, 6)
        .map(({ el, r }) => `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}.${String(el.className).split(' ').slice(0, 3).join('.')} (se sale ${Math.round(r.right - ancho)} px)`);
    });
    throw new Error(`Desborde horizontal de ${sobra} px que sigue ahí tras ${plazoMs} ms. Elementos que se salen: ${culpables.join(' | ') || 'ninguno visible'}`);
  }
}
