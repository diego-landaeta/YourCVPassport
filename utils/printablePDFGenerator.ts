/**
 * Generador de PDF basado en window.print()
 *
 * Este generador renderiza el CV en un contenedor oculto (#print-mount)
 * y usa window.print() para que el navegador genere el PDF con texto seleccionable.
 */

import { createRoot } from 'react-dom/client';
import React from 'react';

/** Clase del body mientras se imprime desde #print-mount (ver src/print-styles.css). */
const PRINTING_CLASS = 'printing-cv';

/** Si el navegador nunca emite `afterprint`, se limpia igualmente pasado este tiempo. */
const PRINT_CLEANUP_FALLBACK_MS = 60_000;

/** Deja la página como estaba: sin modo impresión, #print-mount vacío y sin los estilos copiados del iframe. */
function cleanupPrintMode(): void {
  document.body.classList.remove(PRINTING_CLASS);
  const printMount = document.getElementById('print-mount');
  if (printMount) {
    printMount.innerHTML = '';
  }
  document.head.querySelectorAll('[data-from-iframe]').forEach((el) => el.remove());
}

/**
 * Alto máximo (px del iframe de 1200 px de ancho) de un bloque que se mantiene entero
 * al imprimir. Al imprimir en A4 (~794 px de ancho) el texto se reparte en más líneas y
 * el bloque crece; con 700 px sigue cabiendo en una página (~1123 px).
 */
const KEEP_TOGETHER_MAX_PX = 700;

/** Ítems que las plantillas suelen nombrar así, además de las tarjetas con fondo/borde/sombra. */
const KEEP_TOGETHER_HINTS = '[class*="experience"], [class*="trabajo"], [class*="education"], [class*="educacion"], div:has(> h3), [data-pdf-avoid-break]';

/**
 * Marca con `keep-together` en el clon los bloques que no deben partirse entre páginas.
 * `original` y `clone` tienen el mismo árbol (el clon aún no se ha modificado), así que
 * sus elementos se emparejan por orden.
 */
function markKeepTogether(original: Element, clone: Element): void {
  const view = original.ownerDocument.defaultView;
  const originals = original.querySelectorAll('*');
  const clones = clone.querySelectorAll('*');
  if (!view || originals.length !== clones.length) return;
  originals.forEach((el, i) => {
    if (el.closest('svg') && el.tagName.toLowerCase() !== 'svg') return;
    const height = el.getBoundingClientRect().height;
    if (height <= 0 || height > KEEP_TOGETHER_MAX_PX) return;
    let keep = false;
    try {
      keep = el.matches(KEEP_TOGETHER_HINTS);
    } catch {
      // Navegadores sin :has(): se queda con la detección por estilos
      keep = el.matches('[class*="experience"], [class*="trabajo"], [class*="education"], [class*="educacion"], [data-pdf-avoid-break]');
    }
    if (!keep) {
      const cs = view.getComputedStyle(el);
      const hasBackground = cs.backgroundImage !== 'none' || !/^(transparent|rgba\(0, 0, 0, 0\))$/.test(cs.backgroundColor);
      const hasBorder =
        (parseFloat(cs.borderTopWidth) > 0 && cs.borderTopStyle !== 'none') ||
        (parseFloat(cs.borderBottomWidth) > 0 && cs.borderBottomStyle !== 'none');
      const hasShadow = !!cs.boxShadow && cs.boxShadow !== 'none';
      keep = hasBackground || hasBorder || hasShadow;
    }
    if (keep) clones[i].classList.add('keep-together');
  });
}

interface PrintablePDFOptions {
  profileSlug: string;
  profileId: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Genera un PDF abriendo el diálogo de impresión del navegador
 * El CV se renderiza en #print-mount que solo es visible al imprimir
 */
export async function generatePrintablePDF(options: PrintablePDFOptions): Promise<void> {
  const { profileSlug, profileId, onSuccess, onError } = options;

  try {
    // Obtener el contenedor de impresión
    const printMount = document.getElementById('print-mount');
    if (!printMount) {
      throw new Error('Contenedor #print-mount no encontrado');
    }

    // Construir URL del CV (`?export=1`: carga de exportación, no una visita real; la
    // analítica de visitas debe ignorarlo, lo implementa otra unidad)
    const cvUrl = `${window.location.origin}/cv/${profileSlug || profileId}?export=1`;

    // Crear iframe temporal para cargar el CV
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.left = '-9999px';
    iframe.style.top = '-9999px';
    iframe.style.width = '1200px';
    iframe.style.height = '8000px';
    document.body.appendChild(iframe);

    // Cargar CV en iframe
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout al cargar CV'));
      }, 30000);

      iframe.onload = () => {
        clearTimeout(timeout);
        setTimeout(() => {
          resolve();
        }, 2000);
      };

      iframe.onerror = () => {
        clearTimeout(timeout);
        reject(new Error('Error al cargar CV'));
      };

      iframe.src = cvUrl;
    });

    // Obtener el contenido del iframe
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) {
      throw new Error('No se pudo acceder al contenido del iframe');
    }

    // Buscar el contenedor del CV
    // Los datos del perfil llegan después del onload: esperar (hasta 15 s) a que la
    // plantilla esté pintada en vez de fiarse solo de la espera fija de 2 s.
    // Si no aparece, usar el body completo
    const waitStart = Date.now();
    let cvContainer = iframeDoc.querySelector('.cv-template');
    while ((!cvContainer || cvContainer.childElementCount === 0) && Date.now() - waitStart < 15000) {
      await new Promise(resolve => setTimeout(resolve, 250));
      cvContainer = iframeDoc.querySelector('.cv-template');
    }

    if (!cvContainer) {
      console.warn('⚠️ .cv-template no encontrado, usando body completo');
      cvContainer = iframeDoc.body;
    }

    // Pre-cargar imágenes antes de clonar
    const images = iframeDoc.querySelectorAll('img');
    await Promise.all(
      Array.from(images).map((img: any) => {
        return new Promise((resolve) => {
          if (img.complete) {
            resolve(true);
          } else {
            img.onload = () => resolve(true);
            img.onerror = () => resolve(true); // Continuar incluso si falla
            // Timeout de 5 segundos por imagen
            setTimeout(() => resolve(true), 5000);
          }
        });
      })
    );

    // Las plantillas pueden reaccionar a la exportación (p. ej. mostrar todas las pestañas)
    if (cvContainer !== iframeDoc.body) {
      cvContainer.setAttribute('data-pdf-export', 'true');
    }

    // Clonar el contenido del CV completo
    const cvClone = cvContainer.cloneNode(true) as HTMLElement;

    // Evitar cortes de página dentro de tarjetas e ítems (clase keep-together →
    // break-inside: avoid en src/print-styles.css). Se mide en el original, que sí está
    // maquetado: solo se marcan los bloques bajos; uno más alto que una página se
    // partiría igualmente y antes dejaría un hueco en blanco al saltar de página.
    // Párrafos, li, títulos y filas los cubre el @media print de index.css.
    markKeepTogether(cvContainer, cvClone);

    // Forzar tema claro y limpiar clases oscuras SOLO del body/container principal
    cvClone.classList.remove('dark');

    // Remover dark de todos los elementos hijos pero PRESERVAR COLORES
    const allElements = cvClone.querySelectorAll('*');
    allElements.forEach((el: any) => {
      el.classList.remove('dark');
      // Solo remover fondos oscuros del contenedor principal, NO del header
      if (el.classList.contains('dark:bg-dark-bg-primary') && !el.closest('header')) {
        el.style.backgroundColor = 'white';
      }
      // Eliminar min-height que puedan causar páginas en blanco
      if (el.style.minHeight && parseFloat(el.style.minHeight) > 1000) {
        el.style.minHeight = 'auto';
      }
    });

    // Forzar estilos del header de PassportTemplate para que se vea igual que en web
    const passportHeader = cvClone.querySelector('header.bg-white');
    if (passportHeader) {
      (passportHeader as HTMLElement).style.backgroundColor = 'white';

      // Asegurar que el overlay gradiente tenga opacity 5%
      const gradientOverlay = passportHeader.querySelector('.bg-gradient-to-r.from-blue-600');
      if (gradientOverlay) {
        (gradientOverlay as HTMLElement).style.opacity = '0.05';
      }
    }

    // Asegurar que el contenedor principal no tenga altura mínima excesiva
    cvClone.style.minHeight = 'auto';
    cvClone.style.height = 'auto';

    // Copiar estilos del iframe al documento principal
    const iframeStyles = iframeDoc.querySelectorAll('style, link[rel="stylesheet"]');
    const copiedStyleIds = new Set<string>();

    iframeStyles.forEach((style: any, index: number) => {
      const styleId = `iframe-style-${index}`;

      // Verificar si ya copiamos este estilo
      if (!copiedStyleIds.has(styleId)) {
        const styleClone = style.cloneNode(true) as HTMLElement;
        styleClone.setAttribute('data-from-iframe', styleId);
        document.head.appendChild(styleClone);
        copiedStyleIds.add(styleId);
      }
    });

    // Eliminar elementos que no deben aparecer en el PDF
    // IMPORTANTE: NO eliminar buttons dentro del header del CV
    const noPrintElements = cvClone.querySelectorAll('.no-print, nav, a[class*="fixed"], div[class*="fixed"]:not(header *)');
    noPrintElements.forEach((el: any) => {
      // Solo eliminar si no está dentro de un header
      const isInsideHeader = el.closest('header');
      if (!isInsideHeader) {
        el.remove();
      }
    });

    // Ocultar el country badge (como solicita el usuario)
    // Buscar el contenedor del CountryBadge (div que contiene el badge)
    const allImages = cvClone.querySelectorAll('img');
    allImages.forEach((img: any) => {
      if (img.src && img.src.includes('flagcdn.com')) {
        // Encontrar el div padre más cercano que contenga el badge completo
        const badgeContainer = img.closest('div.inline-flex') || img.closest('div');
        if (badgeContainer && badgeContainer.parentElement) {
          // Remover el div que envuelve el badge completo
          const wrapper = badgeContainer.closest('div.mt-4');
          if (wrapper) {
            wrapper.remove();
          } else {
            badgeContainer.remove();
          }
        }
      }
    });

    // Ocultar stamps verificados del header
    // Buscar SOLO los spans individuales de badges, no los divs contenedores
    const stampBadges = cvClone.querySelectorAll('header span');
    stampBadges.forEach((span: any) => {
      const text = span.textContent || '';
      // Remover SOLO los spans que sean badges de verificación
      if (
        (text.trim().startsWith('✓') &&
         (text.includes('LANGUAGE') || text.includes('Email') || text.includes('Identity') ||
          text.includes('Education') || text.includes('Employment'))) ||
        span.className.includes('bg-green-500') ||
        span.className.includes('bg-black')
      ) {
        span.remove();
      }
    });

    // Buscar el div contenedor de los stamps (flex flex-wrap) y eliminarlo si está vacío
    const stampContainers = cvClone.querySelectorAll('header div.flex.flex-wrap');
    stampContainers.forEach((container: any) => {
      const hasOnlyStamps = Array.from(container.children).every((child: any) => {
        const text = child.textContent || '';
        return text.includes('✓') && (text.includes('LANGUAGE') || text.includes('Email') || text.includes('Identity'));
      });
      if (hasOnlyStamps || container.children.length === 0) {
        container.remove();
      }
    });

    // Reemplazar botones de contacto con información de contacto real
    const headerButtons = cvClone.querySelector('header .print\\:hidden');
    if (headerButtons) {
      // Obtener datos del perfil desde el iframe
      const iframeWindow = iframe.contentWindow as any;
      const profileData = iframeWindow?.__PROFILE_DATA__;

      if (profileData) {
        // Crear contenedor de información de contacto
        const contactInfo = document.createElement('div');
        contactInfo.style.cssText = `
          margin-top: 1.5rem;
          padding: 0;
          text-align: center;
          font-size: 0.9rem;
          line-height: 1.8;
          color: #374151;
        `;

        const contactItems: string[] = [];

        // Email
        if (profileData.email) {
          contactItems.push(`<span style="margin: 0 1rem; white-space: nowrap;">📧 ${profileData.email}</span>`);
        }

        // Phone
        if (profileData.phone) {
          contactItems.push(`<span style="margin: 0 1rem; white-space: nowrap;">📱 ${profileData.phone}</span>`);
        }

        // Location
        if (profileData.location) {
          contactItems.push(`<span style="margin: 0 1rem; white-space: nowrap;">📍 ${profileData.location}</span>`);
        }

        // LinkedIn
        if (profileData.linkedin_url && profileData.show_connect_links !== false) {
          const linkedinClean = profileData.linkedin_url.replace('https://', '').replace('http://', '');
          contactItems.push(`<span style="margin: 0 1rem; white-space: nowrap;">💼 ${linkedinClean}</span>`);
        }

        // Portfolio
        if (profileData.portfolio_url && profileData.show_connect_links !== false) {
          const portfolioClean = profileData.portfolio_url.replace('https://', '').replace('http://', '');
          contactItems.push(`<span style="margin: 0 1rem; white-space: nowrap;">🌐 ${portfolioClean}</span>`);
        }

        // GitHub
        if (profileData.github_url && profileData.show_connect_links !== false) {
          const githubClean = profileData.github_url.replace('https://', '').replace('http://', '');
          contactItems.push(`<span style="margin: 0 1rem; white-space: nowrap;">💻 ${githubClean}</span>`);
        }

        if (contactItems.length > 0) {
          contactInfo.innerHTML = `
            <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 0.5rem;">
              ${contactItems.join('')}
            </div>
          `;

          // Reemplazar los botones con la información de contacto
          headerButtons.parentNode?.replaceChild(contactInfo, headerButtons);
        }
      } else {
        // Si no hay datos de perfil, simplemente ocultar los botones
        headerButtons.remove();
      }
    }

    // Limpiar el contenedor de impresión
    printMount.innerHTML = '';

    // Agregar el CV clonado al contenedor de impresión
    printMount.appendChild(cvClone);

    // Limpiar iframe
    document.body.removeChild(iframe);

    // Esperar un momento para que el DOM se actualice
    await new Promise(resolve => setTimeout(resolve, 500));

    // Solo mientras dure esta impresión, el CSS de impresión oculta #root y muestra
    // #print-mount (src/print-styles.css). La limpieza va en afterprint: en Chrome y
    // Firefox window.print() bloquea hasta cerrar el diálogo, pero en Safari/iOS vuelve
    // enseguida y limpiar con un temporizador corto imprimiría la página vacía.
    let cleanedUp = false;
    const stopListening = () => {
      cleanedUp = true;
      window.removeEventListener('afterprint', finish);
      clearTimeout(fallbackTimer);
    };
    const finish = () => {
      if (cleanedUp) return;
      stopListening();
      cleanupPrintMode();
      if (onSuccess) {
        onSuccess();
      }
    };
    window.addEventListener('afterprint', finish);
    // Red de seguridad si el navegador no emite afterprint
    const fallbackTimer = setTimeout(finish, PRINT_CLEANUP_FALLBACK_MS);

    document.body.classList.add(PRINTING_CLASS);

    // Abrir diálogo de impresión
    try {
      window.print();
    } catch (printError) {
      // El catch de abajo limpia y avisa con onError (sin onSuccess)
      stopListening();
      throw printError;
    }

  } catch (error) {
    console.error('❌ Error generando PDF imprimible:', error);

    // Limpiar en caso de error
    cleanupPrintMode();

    if (onError) {
      onError(error instanceof Error ? error : new Error('Error desconocido'));
    }

    throw error;
  }
}
