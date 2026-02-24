/**
 * Generador de PDF basado en window.print()
 *
 * Este generador renderiza el CV en un contenedor oculto (#print-mount)
 * y usa window.print() para que el navegador genere el PDF con texto seleccionable.
 */

import { createRoot } from 'react-dom/client';
import React from 'react';

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

    // Construir URL del CV
    const cvUrl = `${window.location.origin}/cv/${profileSlug || profileId}`;

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
    // Primero intentar con .cv-template, si no existe usar body completo
    let cvContainer = iframeDoc.querySelector('.cv-template');

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

    // Clonar el contenido del CV completo
    const cvClone = cvContainer.cloneNode(true) as HTMLElement;

    // Agregar clases para evitar cortes de página
    const experienceItems = cvClone.querySelectorAll('[class*="experience"], [class*="trabajo"], div:has(> h3)');
    experienceItems.forEach((item: any) => {
      item.classList.add('keep-together');
    });

    const educationItems = cvClone.querySelectorAll('[class*="education"], [class*="educacion"]');
    educationItems.forEach((item: any) => {
      item.classList.add('keep-together');
    });

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

    // Abrir diálogo de impresión
    window.print();

    // Limpiar después de cerrar el diálogo de impresión
    setTimeout(() => {
      printMount.innerHTML = '';

      if (onSuccess) {
        onSuccess();
      }
    }, 1000);

  } catch (error) {
    console.error('❌ Error generando PDF imprimible:', error);

    // Limpiar en caso de error
    const printMount = document.getElementById('print-mount');
    if (printMount) {
      printMount.innerHTML = '';
    }

    if (onError) {
      onError(error instanceof Error ? error : new Error('Error desconocido'));
    }

    throw error;
  }
}
