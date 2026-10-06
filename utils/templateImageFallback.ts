import type React from 'react';

/**
 * Imagen de reserva para las miniaturas de plantillas cuando el PNG no carga
 * (archivo ausente en el servidor o fallo de red). Mismo patron que
 * utils/blogImageFallback.ts, pero vertical (proporcion A4, 794x1123) para que
 * la tarjeta y el modal no cambien de forma. Tamano intrinseco => naturalWidth > 0.
 */
const TEMPLATE_FALLBACK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="794" height="1123" viewBox="0 0 794 1123">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2563EB"/><stop offset="1" stop-color="#1E40AF"/></linearGradient></defs>
<rect width="794" height="1123" fill="url(#g)"/>
<rect x="297" y="300" width="200" height="260" rx="16" fill="none" stroke="#ffffff" stroke-opacity="0.9" stroke-width="14"/>
<g fill="#ffffff" fill-opacity="0.9"><rect x="337" y="350" width="120" height="14" rx="7"/><rect x="337" y="390" width="120" height="14" rx="7"/><rect x="337" y="430" width="120" height="14" rx="7"/><rect x="337" y="470" width="72" height="14" rx="7"/></g>
</svg>`;

export const TEMPLATE_IMAGE_FALLBACK = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(TEMPLATE_FALLBACK_SVG)}`;

/** Sustituye la imagen por la de reserva una sola vez (evita bucles si tambien fallara). */
export const handleTemplateImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img.dataset.fallbackApplied) return;
    img.dataset.fallbackApplied = 'true';
    img.src = TEMPLATE_IMAGE_FALLBACK;
};
