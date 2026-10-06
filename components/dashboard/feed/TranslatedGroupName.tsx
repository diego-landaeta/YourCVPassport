import React from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useAutoTranslation } from '../../../hooks/useAutoTranslation';

/**
 * Nombre de un grupo/canal en el idioma de la interfaz (traducción automática
 * por lotes, igual que GroupCard). Pensado para sitios compactos —cabecera de
 * un post, listas laterales, selectores— donde no cabe "Ver original": allí se
 * pinta la traducción y el original queda en el `title` (tooltip).
 */
export function useTranslatedGroupName(name: string | null | undefined) {
  const { lang } = useLanguage();
  const translation = useAutoTranslation([name], { enabled: !!name });
  const original = name || '';
  const shown = translation.texts[0] || original;
  const isTranslated = translation.isTranslated && !translation.showOriginal && shown !== original;
  const originalTitle = isTranslated
    ? `${lang === 'es' ? 'Nombre original' : 'Original name'}: ${original}`
    : undefined;
  return { name: shown, original, isTranslated, originalTitle };
}

interface TranslatedGroupNameProps {
  name: string;
  className?: string;
}

/** `<span>` con el nombre traducido y el original en el tooltip. */
export const TranslatedGroupName: React.FC<TranslatedGroupNameProps> = ({ name, className }) => {
  const { name: shown, originalTitle } = useTranslatedGroupName(name);
  return (
    <span className={className} title={originalTitle}>
      {shown}
    </span>
  );
};

/** `<option>` de un `<select>` de grupos con el nombre traducido. */
export const TranslatedGroupOption: React.FC<{ value: string; name: string }> = ({ value, name }) => {
  const { name: shown, originalTitle } = useTranslatedGroupName(name);
  return <option value={value} title={originalTitle}>{shown}</option>;
};

export default TranslatedGroupName;
