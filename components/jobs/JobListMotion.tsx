import React from 'react';

/**
 * Fotogramas del listado: entrada escalonada de las primeras tarjetas y panel inferior de
 * filtros. Solo declaran la animacion; quien la usa la activa con `motion-safe:animate-[...]`,
 * asi que con «reducir movimiento» no existe animacion y el contenido es visible desde el principio.
 */
export const JOB_ENTER_CLASS = 'motion-safe:animate-[ycvp-job-in_480ms_cubic-bezier(0.16,1,0.3,1)_both]';
export const JOB_SHEET_CLASS = 'motion-safe:animate-[ycvp-sheet-in_320ms_cubic-bezier(0.16,1,0.3,1)_both]';
export const JOB_FADE_CLASS = 'motion-safe:animate-[ycvp-fade-in_200ms_ease-out_both]';

/** Solo las primeras tarjetas se animan (el resto aparece de golpe). */
export const JOB_ENTER_LIMIT = 8;
export const JOB_ENTER_STEP_MS = 30;

const JobListMotion: React.FC = () => (
  <style>{`
    @keyframes ycvp-job-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes ycvp-sheet-in { from { transform: translateY(100%); } to { transform: translateY(0); } }
    @keyframes ycvp-fade-in { from { opacity: 0; } to { opacity: 1; } }
  `}</style>
);

export default JobListMotion;
