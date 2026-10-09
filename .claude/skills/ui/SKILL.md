---
name: ui
description: Construir o revisar interfaz en este proyecto (React 19 + Vite + TypeScript + Tailwind 3.4). Usar SIEMPRE antes de escribir JSX, elegir colores, crear un componente, maquetar una pantalla o revisar UI existente. Cubre los tokens reales del proyecto, modo oscuro obligatorio, accesibilidad, i18n, estados de interacción y los antipatrones concretos ya detectados en este código. Se activa con: interfaz, UI, UX, pantalla, componente, tarjeta, card, modal, formulario, botón, layout, responsive, móvil, dark mode, accesibilidad, diseño, maquetar, estilos, Tailwind.
---

# UI en YourCVPassport

Reglas de esta base de código. No son preferencias genéricas: salen de leer el repo.

## 1. Usa los tokens que existen, no inventes colores

Definidos en [tailwind.config.js](../../../tailwind.config.js). Un `#3B82F6` suelto en una clase es un bug de consistencia.

| Uso | Token |
|---|---|
| Acción primaria | `cv-blue` `#2563EB` · hover `cv-blue-dark` |
| Éxito / verificado | `cv-green` `#10B981` |
| Fondo oscuro | `dark-bg-primary` · `dark-bg-secondary` · `dark-bg-tertiary` |
| Borde oscuro | `dark-border` · `dark-border-light` |
| Texto oscuro | `dark-text-primary` / `-secondary` / `-tertiary` |

Escala semántica ya asentada en el repo: **ámbar** = falta algo obligatorio, **rojo** = error o destructivo, **verde** = completo, **gris** = opcional o inactivo. Respétala; si un paso opcional vacío se ve igual que uno obligatorio sin cumplir, el usuario no puede distinguir "me falta esto" de "esto puedo saltármelo".

Animaciones disponibles sin escribir CSS: `animate-fadeIn`, `animate-slideUp`, `animate-shimmer`, `animate-shake`, `animate-blob`, `animate-spin-reverse`. Utilidad propia: `scrollbar-hide`.

## 2. Modo oscuro: obligatorio, no opcional

`darkMode: 'class'`, y la clase la gestionan [Header.tsx](../../../components/Header.tsx) y [MainLayout.tsx](../../../components/MainLayout.tsx).

**Toda superficie, borde y texto lleva su variante `dark:`.** Un bloque sin ella se ve roto para la mitad de los usuarios. Antes de dar algo por terminado, míralo en los dos temas.

```tsx
className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
           text-gray-900 dark:text-white"
```

## 3. Accesibilidad: el punto flojo de este repo

Hoy: `aria-*` en 19 de 245 componentes, `role=` en 6. Al tocar UI, sube ese suelo en lo que toques.

- Botón que solo contiene un icono → `aria-label` o `title` obligatorio.
- Estado por color → **siempre** acompañado de texto o icono. Un punto ámbar solo no comunica nada a quien no distingue el color.
- Interactivo → `<button>` o `<a>` reales. Un `<div onClick>` no recibe foco ni responde a teclado.
- `focus:ring-2 focus:ring-blue-500` en todo lo enfocable. Nunca `outline-none` sin sustituto.
- Imagen informativa → `alt` descriptivo; decorativa → `alt=""`.

## 4. Nada de texto incrustado: la app es bilingüe

Todo literal visible sale de `useTranslations()`, y **cada clave se añade a la vez** en [translations/es.ts](../../../translations/es.ts) y [translations/en.ts](../../../translations/en.ts). Añadirla en uno solo rompe el otro idioma en silencio.

```tsx
const t = useTranslations();
<p>{t.profileWizard.optional}</p>
```

Interpolación por reemplazo, que es el patrón del repo:

```tsx
t.profileWizard.stepCounter.replace('{n}', String(i + 1)).replace('{total}', String(total))
```

## 5. Reutiliza antes de crear

Vivos en [components/shared/](../../../components/shared/): `Modal`, `AlertModal`, `LoadingSpinner`, `CountrySelector`, `LanguageSelector`, `PageSEO`, `SEOHead`, `URLSimulator`, `PushNotificationPrompt`.

Iconos: `@heroicons/react/24/outline`, siempre outline por coherencia. Avisos: `react-hot-toast`.

## 6. Los cinco estados, no solo el feliz

Ninguna vista con datos está acabada hasta que resuelve: **cargando** (`LoadingSpinner`), **vacío** (con acción para salir del vacío), **error** (con reintento), **lleno**, y **filtrado sin resultados** (distinto de vacío: ofrece limpiar el filtro).

Interacción: `hover:` y `focus:` en todo lo pulsable, `disabled:opacity-60` mientras se envía, y `transition-colors` o `transition-all duration-200` para que el cambio no dé un salto seco.

## 7. Móvil primero

El repo usa `sm:` (640) y `lg:` (1024) como puntos reales. Antes de ocultar algo en móvil, pregúntate si el usuario puede pasarse sin ello.

**Un icono sin etiqueta no se entiende.** Si escondes los títulos con `hidden sm:block`, añade un texto de contexto visible en móvil ("Paso 3 de 8 · Habilidades"). Objetivo táctil mínimo ~44px. Todo lo ancho (tablas, código) scrollea en su propio contenedor: el `body` nunca scrollea en horizontal.

## 8. Antipatrones ya cometidos aquí

Cada uno es un bug real encontrado en este código. No los repitas.

**El indicador que miente.** El progreso y la validación calculaban la completitud con criterios distintos: el paso salía verde con nombre+email mientras la finalización exigía además titular, resumen y foto. → Una sola fuente de verdad que alimente el indicador *y* la puerta.

**El respaldo que no salta.** El avatar caía a iniciales solo si `avatar_url` era null, no si la imagen fallaba al cargar — y las fotos venían de un dominio ajeno. → Toda `<img>` remota lleva `onError`.

**El error con temporizador.** El aviso de validación se autodestruía a los 10 segundos mientras el usuario leía la lista. → Los errores los cierra el usuario. Y si listan cosas que arreglar, cada ítem navega a su sitio.

**El recorte que decapita.** `object-cover` centrado sobre fotos de proporciones dispares corta caras. → Para retratos, `object-top`.

**El permiso mal medido.** El botón de IA leía el plan del *perfil editado*, no el del usuario que edita, y en perfiles gestionados invitaba al gestor a mejorar el plan de otra persona. → Verifica de quién es el estado que estás consultando.

**La carga diferida en lo importante.** `loading="lazy"` en la imagen principal de la página la retrasa. → `lazy` en listas y rejillas; nunca en el elemento protagonista.

**El muro sin filtro.** Una rejilla que crece a veinte elementos sin buscador obliga a recorrerla a ojo. → A partir de ~10, filtro. Insensible a mayúsculas **y acentos** (`normalize('NFD')`), que aquí hay nombres con tildes.

## 9. Antes de decirlo terminado

1. `npx tsc --noEmit` → **0 errores** (el proyecto está limpio desde 2026-07-30; cualquier error nuevo es tuyo).
2. Visto en claro **y** en oscuro.
3. Visto estrecho (~375px) y ancho.
4. Estados vacío, cargando y error comprobados, no solo el feliz.
5. Navegable con Tab, con foco visible.
6. Claves nuevas en `es.ts` **y** `en.ts`.

Si no puedes verificarlo de verdad —porque la pantalla exige sesión, por ejemplo— **dilo explícitamente** en vez de darlo por bueno. Typecheck y build no son verificación visual.
