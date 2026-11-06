import { defineBolsaText } from '../../lib/bolsaText';

/**
 * Textos de la tarjeta de oferta del listado (datos clave con icono, etiquetas y «Guardar»).
 * es y en tienen las MISMAS claves (en: typeof es lo obliga el compilador).
 */
const es = {
  newTag: 'Nueva',
  deadlineSoonTag: 'Plazo próximo',
  factsLabel: 'Datos de la oferta',
  saveShort: 'Guardar',
  savedShort: 'Guardada',
  saveAria: 'Guardar oferta: {title}',
  unsaveAria: 'Quitar de guardadas: {title}',
  salaryCurrencyNote: 'Salario en {currency}',
  experienceFrom: '{n} años de experiencia',
  experienceOne: '1 año de experiencia',
};

const en: typeof es = {
  newTag: 'New',
  deadlineSoonTag: 'Closing soon',
  factsLabel: 'Job details',
  saveShort: 'Save',
  savedShort: 'Saved',
  saveAria: 'Save job: {title}',
  unsaveAria: 'Remove from saved: {title}',
  salaryCurrencyNote: 'Salary in {currency}',
  experienceFrom: '{n} years of experience',
  experienceOne: '1 year of experience',
};

export const useCardText = defineBolsaText({ es, en });
export type CardText = typeof es;
