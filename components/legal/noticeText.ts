import { defineBolsaText } from '../../lib/bolsaText';

/**
 * Textos del aviso de «nueva versión de las condiciones» (15 días de antelación):
 * banner de los paneles, aviso de la puerta de aceptación y de las páginas legales.
 * es + en con las MISMAS claves (no se toca translations/es.ts ni en.ts).
 */
export const useNoticeText = defineBolsaText({
  es: {
    bannerLabel: 'Aviso de nueva versión de las condiciones',
    bannerTitle: 'Habrá una nueva versión de nuestras condiciones',
    line: '«{titulo}», versión {version}, entra en vigor el {date}.',
    leftMany: 'Quedan {n} días.',
    leftOne: 'Queda 1 día.',
    leftToday: 'Entra en vigor hoy.',
    afterwards: 'Al entrar en vigor se te pedirá aceptarla.',
    read: 'Leer la nueva versión',
    dismiss: 'Descartar aviso',
    dismissFor: 'Descartar el aviso de {titulo}',
    // Puerta de aceptación y páginas legales
    gateTitle: 'Próxima versión',
    gateOptHint: 'No impiden aceptar las condiciones. Puedes cambiarlas cuando quieras desde tu perfil.',
    gateLine: 'Además, el {date} entra en vigor la versión {version} de «{titulo}». Podrás leerla desde la página de condiciones.',
    docNotice: 'La versión {version} de este documento entra en vigor el {date}. Hasta entonces sigue vigente el texto de abajo.',
    docShowNext: 'Ver la próxima versión',
    docShowCurrent: 'Volver al texto vigente',
    docNextHeading: 'Próxima versión {version} (desde el {date})',
    docNextLoading: 'Cargando la próxima versión…',
    docNextError: 'No se ha podido cargar la próxima versión. Inténtalo de nuevo en unos minutos.',
  },
  en: {
    bannerLabel: 'New terms version notice',
    bannerTitle: 'A new version of our terms is coming',
    line: '"{titulo}", version {version}, takes effect on {date}.',
    leftMany: '{n} days left.',
    leftOne: '1 day left.',
    leftToday: 'It takes effect today.',
    afterwards: "Once it takes effect, you'll be asked to accept it.",
    read: 'Read the new version',
    dismiss: 'Dismiss notice',
    dismissFor: 'Dismiss the notice for {titulo}',
    gateTitle: 'Upcoming version',
    gateOptHint: "They don't prevent you from accepting the terms. You can change them any time from your profile.",
    gateLine: 'Also, version {version} of "{titulo}" takes effect on {date}. You can read it on the terms page.',
    docNotice: 'Version {version} of this document takes effect on {date}. The text below stays in force until then.',
    docShowNext: 'View the upcoming version',
    docShowCurrent: 'Back to the current text',
    docNextHeading: 'Upcoming version {version} (from {date})',
    docNextLoading: 'Loading the upcoming version…',
    docNextError: "We couldn't load the upcoming version. Please try again in a few minutes.",
  },
});
