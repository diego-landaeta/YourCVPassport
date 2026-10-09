# Suite QA (Playwright)

Suite del informe de testeo (issue #1). Tiene su propia config:
`tests/qa/playwright.qa.config.ts`. La config raiz (`playwright.config.ts`) **no**
carga esta carpeta.

## Tipos de spec

| Patron | Contra que corre | Que puede hacer |
| --- | --- | --- |
| `*.local.spec.ts` | App local (Vite) con Supabase **mockeado** (`helpers/supabaseMock.ts`) | Cualquier cosa: nada sale de la maquina |
| `*.prod.spec.ts` | `https://yourcvpassport.com` y las Edge Functions de produccion | **Solo lectura**: GET, navegacion y preflight `OPTIONS`. Nunca formularios, POST ni escrituras |

Los `*.prod.spec.ts` no se ejecutan en CI (`.github/workflows/qa.yml`).

## Ejecutar

```bash
# Suite completa, 4 proyectos (chromium, firefox, webkit, mobile-chromium)
npx playwright test -c tests/qa/playwright.qa.config.ts

# Solo los specs locales en Chromium (lo mismo que hace CI)
npx playwright test -c tests/qa/playwright.qa.config.ts --project=chromium 'local\.spec\.ts'

# Un spec en un puerto propio (util si hay otro Vite levantado)
QA_PORT=5310 npx playwright test -c tests/qa/playwright.qa.config.ts tests/qa/admin.local.spec.ts

# Un proyecto concreto
npx playwright test -c tests/qa/playwright.qa.config.ts --project=webkit

# Produccion, solo lectura
npx playwright test -c tests/qa/playwright.qa.config.ts tests/qa/publicas.prod.spec.ts --project=chromium
```

En PowerShell: `$env:QA_PORT='5310'; npx playwright test -c tests/qa/playwright.qa.config.ts`.

Informe HTML: `playwright-report/qa/` (`npx playwright show-report playwright-report/qa`).
Artefactos de fallos: `test-results/qa/`.

### Puertos

- `webServer` lanza `npx vite --host 127.0.0.1 --port $QA_PORT --strictPort` desde la raiz
  del repo (`cwd: '../..'`). `QA_PORT` por defecto: **5300**.
- `127.0.0.1` y no `localhost`: en Windows `localhost` puede resolver a `::1` y Playwright
  no detecta el Vite levantado.
- `reuseExistingServer: true`: si ya hay un Vite en ese puerto se reutiliza (arrancarlo
  aparte con el mismo comando evita la compilacion en frio en cada ejecucion).
- La config raiz usa otro puerto (`PW_PORT`, por defecto 5173, el de `vite.config.ts`).
  El 3000 es `server.mjs`, que sirve un `dist/` que puede estar desactualizado: no se usa.

### Variables

| Variable | Uso |
| --- | --- |
| `QA_PORT` | Puerto del Vite de la suite (5300) |
| `QA_DARK_BASELINE=capture` | Regenera las lineas base de la regresion de modo oscuro (#19) |
| `QA_SHOTS`, `QA_SHOTS_DIR` | Guarda capturas del panel admin |
| `QA_PDF_EVIDENCE` | Guarda los PDF generados en `pdf.local.spec.ts` |
| `QA_DEBUG` | Trazas extra en algunos specs |

## Reglas para specs locales: `SAFE_CONTEXT_OPTIONS`

Todo spec con mocks debe usar `test.use(SAFE_CONTEXT_OPTIONS)` (o pasarlo al crear
contextos a mano con `browser.newContext`) y `mockSupabase(context, db)`:

- `serviceWorkers: 'block'`: la app registra `/sw.js`; en WebKit las peticiones que pasan
  por el Service Worker se saltan `page.route` y llegarian a la Supabase real.
- `proxy` muerto (`127.0.0.1:9`, sin bypass salvo localhost): si algo escapa al router,
  falla con "could not connect" en vez de llegar a produccion.
- `mockSupabase` responde en local todo `*.supabase.co`, aborta cualquier otro origen
  externo, cierra los WebSocket y corta `/api/*` de Vite con un 503. Las escrituras
  (POST/PATCH/PUT/DELETE) no se aplican: se registran en `mock.writes`.
- `installInitState(context, { sessionProfile, theme, language })` inyecta una sesion
  falsa (JWT inventado), el tema y el idioma antes de que cargue la app.

Los specs antiguos de `tests/*.spec.ts` (config raiz) usan los mismos helpers.

## Regresion de modo oscuro (#19) y lineas base

`admin.local.spec.ts › #19 regresion modo oscuro global` muestrea los colores computados
de los elementos con clases `dark:` (`helpers/darkSample.ts`) en la cabecera, la portada,
el panel admin y la plantilla de CV, con `<html class="dark">`, y los compara con
`fixtures/dark-regression-baseline.<proyecto>.json`.

Las lineas base se capturaron con el `darkMode: 'class'` de referencia, antes del selector
actual de `tailwind.config.js` (que excluye `.cv-force-light`). Lo que se verifica:

- Cada elemento de la linea base sigue existiendo y con color, fondo, borde y degradado
  identicos. La comparacion alinea por `etiqueta:clases` (no por posicion), asi que un
  elemento insertado no desplaza a los demas.
- Un elemento quitado o con otras clases **falla**.
- Un elemento **nuevo** (sin valor de referencia) no falla: se anota en el informe como
  `elemento nuevo sin linea base`. Hoy son dos, en la cabecera: el selector de idioma
  movil que paso del boton flotante a `components/Header.tsx`.
- El widget de Opynio (`.opynio-widget`) queda siempre fuera de la muestra y su script se
  sirve vacio en local: `Testimonials.tsx` oculta la seccion si el script falla, y sin el
  stub la portada perdia la seccion entera segun la red.

Regenerar las lineas base (solo si cambia a proposito el DOM de las zonas muestreadas y
tras revisar que el diff no tiene cambios de color):

```bash
# 1. Comprobar el diff contra la linea base actual: no debe haber cambios de color
QA_PORT=5310 npx playwright test -c tests/qa/playwright.qa.config.ts tests/qa/admin.local.spec.ts -g "#19"
# 2. Capturar en los 4 proyectos (idealmente con el darkMode de referencia en tailwind.config.js)
QA_DARK_BASELINE=capture QA_PORT=5310 npx playwright test -c tests/qa/playwright.qa.config.ts tests/qa/admin.local.spec.ts -g "#19"
# 3. Revisar el diff de tests/qa/fixtures/*.json antes de commitear
```

## Tests de Edge Functions (`tests/edge-functions`)

Llaman a Edge Functions **reales** y algunas envian correos. No corren por defecto: la
config raiz los ignora salvo con `RUN_LIVE_EDGE_TESTS=1`, y entonces exigen un proyecto de
Supabase de **pruebas** (`EDGE_TEST_SUPABASE_URL`, `EDGE_TEST_SUPABASE_ANON_KEY`; se rechaza
la URL de produccion) y un buzon de pruebas en `EDGE_TEST_EMAIL` para los que envian
correo. Detalle en `tests/edge-functions/test-config.ts`.

## Comandos que conviene anadir a package.json

No estan en `package.json` (lo mantiene otra parte del equipo); propuesta:

```json
"test": "playwright test",
"test:qa": "playwright test -c tests/qa/playwright.qa.config.ts",
"test:qa:local": "playwright test -c tests/qa/playwright.qa.config.ts --project=chromium local\\.spec\\.ts",
"test:edge:live": "RUN_LIVE_EDGE_TESTS=1 playwright test tests/edge-functions"
```
