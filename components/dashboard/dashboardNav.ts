// Reglas de navegación del panel compartidas por el menú de escritorio (Sidebar)
// y el de móvil (MobileNav), para que un mismo apartado no esté bloqueado en un
// sitio y abierto en otro (issue #4, puntos 2, 3 y 13).
import type React from 'react';

// Apartados que no dependen del CV y por tanto nunca se bloquean: el panel, el
// asistente, las notificaciones y los ajustes (privacidad y borrar la cuenta
// tienen que estar siempre a mano, RGPD).
export const ALWAYS_UNLOCKED_SECTIONS = ['dashboard', 'mi-perfil', 'notificaciones', 'ajustes'] as const;

/** El asistente del CV está terminado (se marca al publicar en «Finalizar»). */
export function isWizardCompleted(profile: { wizard_completed?: boolean | null } | null | undefined): boolean {
  return profile?.wizard_completed === true;
}

/** Un apartado del menú está bloqueado hasta terminar el asistente del CV. */
export function isSectionLocked(profile: { wizard_completed?: boolean | null } | null | undefined, sectionId: string): boolean {
  if (isWizardCompleted(profile)) return false;
  const base = sectionId.split(':')[0];
  return !(ALWAYS_UNLOCKED_SECTIONS as readonly string[]).includes(base);
}

/** Formato válido de un apartado en la URL (`?seccion=ajustes`, `?seccion=mi-perfil:identity`). */
const SECTION_PARAM_RE = /^[a-z0-9-]+(?::[A-Za-z0-9_-]+)?$/;

export function parseSectionParam(search: string): string | null {
  const value = new URLSearchParams(search).get('seccion');
  return value && SECTION_PARAM_RE.test(value) ? value : null;
}

/**
 * URL enlazable de un apartado del panel. El panel cambia de apartado sin cambiar
 * de ruta; con `?seccion=` cada opción del menú tiene una dirección propia que se
 * puede copiar o abrir en otra pestaña.
 */
export function sectionHref(sectionId: string): string {
  return sectionId === 'dashboard' ? '/dashboard' : `/dashboard?seccion=${encodeURIComponent(sectionId)}`;
}

/**
 * Clic con Ctrl/Cmd/Mayús o con el botón central: se abre el apartado en otra
 * pestaña, como haría un enlace. Devuelve true si lo ha gestionado.
 */
export function openSectionInNewTabIfRequested(e: React.MouseEvent, sectionId: string): boolean {
  if (e.button === 1 || e.ctrlKey || e.metaKey || e.shiftKey) {
    e.preventDefault();
    window.open(sectionHref(sectionId), '_blank', 'noopener');
    return true;
  }
  return false;
}

/**
 * Lo que falta para desbloquear el menú, con datos del propio perfil: los campos
 * básicos de Identidad que estén vacíos y, siempre, publicar el CV en el último
 * paso del asistente (es lo que marca `wizard_completed`).
 */
export function getWizardMissingItems(
  profile: Record<string, any> | null | undefined,
  labels: { fullName: string; headline: string; summary: string; photo: string; publish: string },
): string[] {
  return [
    !profile?.full_name && labels.fullName,
    !profile?.headline && labels.headline,
    !profile?.summary && labels.summary,
    !profile?.avatar_url && labels.photo,
    labels.publish,
  ].filter(Boolean) as string[];
}
