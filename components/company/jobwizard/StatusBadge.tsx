import React from 'react';
import { pick, useJobText } from '../../../lib/jobPostingText';

/**
 * Punto de color por estado. Escala del proyecto: verde = activa/completa, ámbar = espera
 * algo (revisión), rojo = rechazada, azul = cubierta, gris = inactiva o sin publicar.
 * El punto nunca va solo: siempre lleva el nombre del estado al lado.
 */
const DOT: Record<string, string> = {
  DRAFT: 'bg-slate-400 dark:bg-slate-500',
  AI_REVIEW: 'bg-amber-500',
  MANUAL_REVIEW: 'bg-amber-500',
  REJECTED: 'bg-red-500',
  PUBLISHED: 'bg-emerald-500',
  PAUSED: 'bg-slate-400 dark:bg-slate-500',
  CLOSED: 'bg-slate-400 dark:bg-slate-500',
  FILLED: 'bg-cv-blue',
  EXPIRED: 'bg-slate-400 dark:bg-slate-500',
};

/** Estado de una oferta, traducido: punto + texto (nunca solo color). */
export const JobStatusBadge: React.FC<{ status: string; className?: string }> = ({ status, className }) => {
  const tx = useJobText();
  return (
    <span data-status={status} className={`inline-flex items-center gap-2 whitespace-nowrap text-sm font-medium text-slate-800 dark:text-slate-100 ${className || ''}`}>
      <span aria-hidden="true" className={`h-2 w-2 shrink-0 rounded-full ${DOT[status] || DOT.DRAFT}`} />
      {pick(tx, 'status', status)}
    </span>
  );
};

export default JobStatusBadge;
