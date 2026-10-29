import { defineBolsaText } from '../../lib/bolsaText';

/**
 * Textos NUEVOS de la ficha de oferta y del modal de inscripcion (rediseno).
 * Los textos que ya existian siguen en `textos.ts`; aqui solo se anaden claves.
 * es y en tienen las MISMAS claves (en: typeof es lo obliga el compilador).
 */
const es = {
  verifiedCompany: 'Empresa verificada',
  keyFacts: 'Datos clave de la oferta',
  postedWhen: 'Publicada {when}',
  deadlineLeftMany: 'Quedan {n} días',
  deadlineLeftOne: 'Queda 1 día',
  deadlineLastDay: 'Último día para inscribirse',
  deadlineEnded: 'Plazo terminado',
  deadlineUntil: 'Hasta el {date}',
  deadlineEndedOn: 'Terminó el {date}',
  deadlineNone: 'Sin fecha límite',
  vacanciesOne: '1 vacante',
  applyHintOut: 'Crea tu cuenta gratis o inicia sesión: tu perfil se envía en un solo paso.',
  applyHintIn: 'Se envía tu perfil de YourCVPassport, sin formularios largos.',
  closedShort: 'Candidaturas cerradas',
  seeSimilar: 'Ver ofertas parecidas',
  sectionDetails: 'Detalles del puesto',
  companyWebsite: 'Sitio web',
  applyYourProfile: 'Tu perfil',
  profileComplete: 'Tu perfil está completo',
  applyCharCount: '{n} / {max}',
  successNextTitle: 'Qué pasa ahora',
  successNext1: 'La empresa revisa tu perfil y tus respuestas.',
  successNext2: 'Verás el estado de tu candidatura paso a paso y podrás retirarla cuando quieras.',
  similarWhen: 'Publicada {when}',
};

const en: typeof es = {
  verifiedCompany: 'Verified company',
  keyFacts: 'Key facts about this job',
  postedWhen: 'Posted {when}',
  deadlineLeftMany: '{n} days left',
  deadlineLeftOne: '1 day left',
  deadlineLastDay: 'Last day to apply',
  deadlineEnded: 'Deadline passed',
  deadlineUntil: 'Until {date}',
  deadlineEndedOn: 'Ended on {date}',
  deadlineNone: 'No closing date',
  vacanciesOne: '1 opening',
  applyHintOut: 'Create a free account or sign in: your profile is sent in a single step.',
  applyHintIn: 'Your YourCVPassport profile is sent, no long forms.',
  closedShort: 'Applications closed',
  seeSimilar: 'See similar jobs',
  sectionDetails: 'Job details',
  companyWebsite: 'Website',
  applyYourProfile: 'Your profile',
  profileComplete: 'Your profile is complete',
  applyCharCount: '{n} / {max}',
  successNextTitle: 'What happens next',
  successNext1: 'The company reviews your profile and your answers.',
  successNext2: 'You will see your application status step by step and can withdraw it whenever you want.',
  similarWhen: 'Posted {when}',
};

export const useDetailText = defineBolsaText({ es, en });
export type DetailText = typeof es;
