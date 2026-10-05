import type React from 'react';

/**
 * Imagen de reserva para el blog cuando una foto remota (Unsplash) falla.
 * SVG inline con tamano intrinseco 1200x630 (naturalWidth > 0) y el azul de marca.
 */
const FALLBACK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2563EB"/><stop offset="1" stop-color="#1E40AF"/></linearGradient></defs>
<rect width="1200" height="630" fill="url(#g)"/>
<path d="M548 215h40l12 32 12-32h40l-34 70v60h-36v-60z" fill="#ffffff" fill-opacity="0.9"/>
</svg>`;

export const BLOG_IMAGE_FALLBACK = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(FALLBACK_SVG)}`;

/** Sustituye la imagen por la de reserva una sola vez (evita bucles si tambien fallara). */
export const applyBlogImageFallback = (img: HTMLImageElement) => {
    if (img.dataset.fallbackApplied) return;
    img.dataset.fallbackApplied = 'true';
    img.src = BLOG_IMAGE_FALLBACK;
};

/** Manejador onError para <img> de React. */
export const handleBlogImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    applyBlogImageFallback(e.currentTarget);
};
