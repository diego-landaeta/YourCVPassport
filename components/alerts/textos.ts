import { defineBolsaText } from '../../lib/bolsaText';

/** Textos de la página pública de baja de alertas de ofertas (/alertas/baja, /alerts/unsubscribe). */
const es = {
  seoTitle: 'Baja de alertas de ofertas',
  seoDescription: 'Cancela las alertas de ofertas de empleo que recibes por correo.',
  working: 'Dando de baja tus alertas…',
  doneTitle: 'Alertas canceladas',
  doneText: 'No volverás a recibir correos de alertas de ofertas con este enlace. Puedes volver a activarlas cuando quieras desde tu panel.',
  notFoundTitle: 'Este enlace ya no tiene alertas activas',
  notFoundText: 'Puede que ya te hubieras dado de baja o que el enlace no sea válido. Si sigues recibiendo correos, escríbenos a support@yourcvpassport.com.',
  invalidTitle: 'Enlace no válido',
  invalidText: 'Falta el código de baja o está incompleto. Abre el enlace tal cual aparece en el correo, o gestiona tus alertas desde tu panel.',
  errorTitle: 'No hemos podido completar la baja',
  errorText: 'Ha habido un problema de conexión. Inténtalo de nuevo en unos minutos.',
  retry: 'Reintentar',
  manage: 'Gestionar mis alertas',
  seeJobs: 'Ver ofertas',
  home: 'Ir al inicio',
};

const en: typeof es = {
  seoTitle: 'Unsubscribe from job alerts',
  seoDescription: 'Cancel the job alerts you receive by email.',
  working: 'Cancelling your alerts…',
  doneTitle: 'Alerts cancelled',
  doneText: 'You will no longer receive job alert emails with this link. You can turn them back on whenever you want from your dashboard.',
  notFoundTitle: 'This link has no active alerts',
  notFoundText: 'You may have already unsubscribed, or the link is not valid. If you keep receiving emails, write to us at support@yourcvpassport.com.',
  invalidTitle: 'Invalid link',
  invalidText: 'The unsubscribe code is missing or incomplete. Open the link exactly as it appears in the email, or manage your alerts from your dashboard.',
  errorTitle: 'We could not complete the unsubscribe',
  errorText: 'There was a connection problem. Please try again in a few minutes.',
  retry: 'Try again',
  manage: 'Manage my alerts',
  seeJobs: 'See jobs',
  home: 'Go to the home page',
};

export const useAlertUnsubText = defineBolsaText({ es, en });
