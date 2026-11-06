import { useLanguage } from '../contexts/LanguageContext';

/**
 * Textos de la bolsa de empleo, en un modulo propio por area.
 *
 * `translations/es.ts` y `en.ts` son dos ficheros enormes con un tipo comun; cada
 * area de la bolsa define aqui su diccionario (es + en con las MISMAS claves) y
 * lo usa con el hook que devuelve `defineBolsaText`. Idioma = el de la interfaz
 * (hoy solo es y en).
 *
 * Uso:
 *   const dict = { es: { titulo: 'Hola' }, en: { titulo: 'Hello' } };
 *   export const useMiAreaText = defineBolsaText(dict);
 *   const tx = useMiAreaText(); tx.titulo
 *   fmt('Quedan {n}', { n: 3 })
 */
export function defineBolsaText<T extends Record<string, string>>(dict: { es: T; en: T }) {
  return function useBolsaText(): T {
    const { lang } = useLanguage();
    return lang === 'en' ? dict.en : dict.es;
  };
}

export function fmt(text: string, vars: Record<string, string | number> = {}): string {
  return text.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`));
}
