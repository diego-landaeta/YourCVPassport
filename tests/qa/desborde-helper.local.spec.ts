import { test, expect } from '@playwright/test';
import { esperarSinDesborde } from './helpers/desborde';

/**
 * El ayudante que mide el scroll horizontal «con la página asentada» no puede volverse un
 * tragarrojos: un desborde real tiene que seguir fallando, diciendo qué elemento se sale.
 */
test.describe('esperarSinDesborde', () => {
  test('una página sin desborde pasa al momento', async ({ page }) => {
    await page.setContent('<body style="margin:0"><div style="width:100px;height:20px"></div></body>');
    await esperarSinDesborde(page, 2000);
  });

  test('un desborde que se resuelve solo (animación o fuentes) pasa', async ({ page }) => {
    await page.setContent('<body style="margin:0"><div id="a" style="position:relative;left:3000px;width:50px;height:20px"></div></body>');
    // El desborde se quita DESDE EL TEST, pasado un rato, y no con un setTimeout de la página: bajo
    // carga los temporizadores de la página se retrasan, y esta prueba fallaba justo por lo mismo
    // que el ayudante arregla (medir con la máquina ocupada).
    const midiendo = esperarSinDesborde(page, 8000);
    await page.waitForTimeout(400);
    await page.evaluate(() => { document.getElementById('a')!.style.left = '0'; });
    await midiendo;
  });

  test('un desborde REAL sigue fallando y nombra al culpable', async ({ page }) => {
    await page.setContent('<body style="margin:0"><div id="ancho" class="tarjeta enorme" style="width:5000px;height:20px"></div></body>');
    const error = await esperarSinDesborde(page, 1500).then(() => null, (e: Error) => e);
    expect(error, 'debería haber fallado').not.toBeNull();
    expect(error!.message).toMatch(/Desborde horizontal de \d+ px/);
    expect(error!.message).toContain('div#ancho');
  });
});
