import type React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

/**
 * Textos accesibles (aria-label) de botones que solo muestran un icono.
 *
 * Diccionario local en lugar de translations/es.ts y en.ts: son etiquetas que
 * solo leen los lectores de pantalla y no forman parte del contenido visible.
 */
const A11Y_LABELS = {
    es: {
        close: 'Cerrar',
        closeNotification: 'Cerrar notificación',
        edit: 'Editar',
        delete: 'Eliminar',
        remove: 'Quitar',
        dragToReorder: 'Arrastrar para reordenar',
        back: 'Volver',
        sendMessage: 'Enviar mensaje',
        zoomIn: 'Acercar',
        zoomOut: 'Alejar',
        viewDetails: 'Ver detalles',
        removeAchievement: 'Eliminar logro',
        removeImage: 'Quitar imagen',
        removeFile: 'Quitar archivo',
        changePhoto: 'Cambiar foto de perfil',
        star: 'Destacar',
        skipToContent: 'Saltar al contenido',
    },
    en: {
        close: 'Close',
        closeNotification: 'Close notification',
        edit: 'Edit',
        delete: 'Delete',
        remove: 'Remove',
        dragToReorder: 'Drag to reorder',
        back: 'Back',
        sendMessage: 'Send message',
        zoomIn: 'Zoom in',
        zoomOut: 'Zoom out',
        viewDetails: 'View details',
        removeAchievement: 'Remove achievement',
        removeImage: 'Remove image',
        removeFile: 'Remove file',
        changePhoto: 'Change profile photo',
        star: 'Star',
        skipToContent: 'Skip to content',
    },
} as const;

export type A11yLabels = { [K in keyof typeof A11Y_LABELS.es]: string };

/**
 * Devuelve las etiquetas accesibles del idioma activo.
 *
 * Algunos componentes (toasts, modales globales) se montan fuera de
 * LanguageProvider; ahi useLanguage lanza, asi que se cae al atributo lang del
 * documento, que el propio LanguageProvider mantiene sincronizado.
 */
export const useA11yLabels = (): A11yLabels => {
    let lang: 'es' | 'en';
    try {
        lang = useLanguage().lang;
    } catch {
        lang = typeof document !== 'undefined' && document.documentElement.lang?.startsWith('en') ? 'en' : 'es';
    }
    return A11Y_LABELS[lang];
};

/**
 * onKeyDown para elementos no nativos (div/span con role="button") que deben
 * activarse con Enter o Espacio igual que un <button>.
 */
export const activateOnKey = (handler: (e: React.KeyboardEvent<HTMLElement>) => void) =>
    (e: React.KeyboardEvent<HTMLElement>) => {
        if (e.target !== e.currentTarget) return;
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handler(e);
        }
    };
