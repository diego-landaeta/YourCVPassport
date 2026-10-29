import React from 'react';
import { TONE_ACCENTS, toneIndexOf } from './CompanyMark';

/**
 * Banda de fondo de la cabecera de la ficha: patron geometrico propio (SVG en linea, sin imagenes
 * remotas) con el tono estable de la empresa, el mismo que su monograma. Baja opacidad y se desvanece
 * hacia el texto para no restar legibilidad. Decorativo: aria-hidden.
 */
const BrandBand: React.FC<{ name: string }> = ({ name }) => {
  const uid = React.useId().replace(/[^a-zA-Z0-9]/g, '');
  const fade = 'linear-gradient(to left, #000 0%, rgba(0,0,0,.85) 38%, transparent 82%)';
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden ${TONE_ACCENTS[toneIndexOf(name)]}`}
      style={{ maskImage: fade, WebkitMaskImage: fade }}
    >
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1200 340" preserveAspectRatio="xMaxYMid slice" fill="none">
        <defs>
          <pattern id={`${uid}-dots`} width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.6" fill="currentColor" />
          </pattern>
        </defs>
        <rect width="1200" height="340" fill={`url(#${uid}-dots)`} opacity=".3" />
        <g className="max-sm:hidden">
        <circle cx="1030" cy="130" r="230" stroke="currentColor" strokeWidth="1.5" opacity=".26" />
        <circle cx="1030" cy="130" r="150" stroke="currentColor" strokeWidth="1.5" opacity=".24" />
        <circle cx="1030" cy="130" r="76" fill="currentColor" opacity=".14" />
        <rect x="740" y="205" width="124" height="124" rx="28" transform="rotate(14 802 267)" fill="currentColor" opacity=".08" />
        <rect x="1100" y="222" width="82" height="82" rx="20" transform="rotate(-10 1141 263)" stroke="currentColor" strokeWidth="1.5" opacity=".3" />
        <path d="M600 40 L640 40 M620 20 L620 60" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity=".22" />
        <path d="M905 300 L945 300 M925 280 L925 320" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity=".26" />
        </g>
      </svg>
    </div>
  );
};

export default BrandBand;
