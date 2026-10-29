import React from 'react';

/**
 * Marca de la empresa: logo si lo hay; si no, monograma con las iniciales sobre un tono
 * estable (el mismo nombre da siempre el mismo color). Sustituye al icono gris de edificio.
 *
 * Los tonos son apagados a proposito: la oferta manda, el avatar acompana. Cada tono trae
 * fondo y texto para claro y oscuro con contraste >= 4.5:1.
 */
const TONES = [
  'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-200',
  'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200',
  'bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-200',
  'bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-200',
  'bg-violet-100 text-violet-800 dark:bg-violet-500/20 dark:text-violet-200',
  'bg-cyan-100 text-cyan-900 dark:bg-cyan-500/20 dark:text-cyan-200',
  'bg-slate-200 text-slate-800 dark:bg-slate-500/25 dark:text-slate-100',
  'bg-orange-100 text-orange-900 dark:bg-orange-500/20 dark:text-orange-200',
] as const;

export function initialsOf(name: string): string {
  const words = name
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 0 && !/^(de|del|la|las|el|los|y|e|s\.?l\.?|s\.?a\.?|the|of|and)$/i.test(w));
  const letters = (words.length >= 2 ? [words[0], words[1]] : [words[0] || name]).map((w) => w.charAt(0));
  return letters.join('').toUpperCase().slice(0, 2) || '?';
}

export function toneIndexOf(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return h % TONES.length;
}

const SIZES = {
  sm: 'h-10 w-10 rounded-xl text-sm',
  md: 'h-12 w-12 rounded-xl text-base',
  lg: 'h-16 w-16 rounded-2xl text-xl',
  xl: 'h-20 w-20 rounded-2xl text-2xl',
} as const;

interface Props {
  name: string;
  logoUrl?: string | null;
  size?: keyof typeof SIZES;
  className?: string;
}

const CompanyMark: React.FC<Props> = ({ name, logoUrl, size = 'md', className = '' }) => {
  const [broken, setBroken] = React.useState(false);
  const base = `${SIZES[size]} shrink-0 inline-flex items-center justify-center overflow-hidden ring-1 ring-black/5 dark:ring-white/10 select-none`;
  if (logoUrl && !broken) {
    return (
      <span className={`${base} bg-white dark:bg-slate-800 ${className}`}>
        <img src={logoUrl} alt="" loading="lazy" onError={() => setBroken(true)} className="h-full w-full object-contain p-1.5" />
      </span>
    );
  }
  return (
    <span aria-hidden="true" className={`${base} font-bold tracking-tight ${TONES[toneIndexOf(name)]} ${className}`}>
      {initialsOf(name)}
    </span>
  );
};

export default CompanyMark;
