/**
 * Post-processing utility to fix gender in Spanish translations
 * Based on the user's profile gender
 */

// Words that change based on gender (feminine -> masculine)
const GENDERED_WORDS: Record<string, { feminine: string; masculine: string }> = {
  // Professions - Education
  educador: { feminine: 'educadora', masculine: 'educador' },
  maestro: { feminine: 'maestra', masculine: 'maestro' },
  docente: { feminine: 'docente', masculine: 'docente' }, // invariable
  pedagogo: { feminine: 'pedagoga', masculine: 'pedagogo' },
  tutor: { feminine: 'tutora', masculine: 'tutor' },
  coach: { feminine: 'coach', masculine: 'coach' }, // invariable
  mentor: { feminine: 'mentora', masculine: 'mentor' },
  instructor: { feminine: 'instructora', masculine: 'instructor' },
  profesor: { feminine: 'profesora', masculine: 'profesor' },
  director: { feminine: 'directora', masculine: 'director' },
  gerente: { feminine: 'gerenta', masculine: 'gerente' },
  consultor: { feminine: 'consultora', masculine: 'consultor' },
  coordinador: { feminine: 'coordinadora', masculine: 'coordinador' },
  analista: { feminine: 'analista', masculine: 'analista' }, // invariable
  especialista: { feminine: 'especialista', masculine: 'especialista' }, // invariable
  desarrollador: { feminine: 'desarrolladora', masculine: 'desarrollador' },
  diseñador: { feminine: 'diseñadora', masculine: 'diseñador' },
  ingeniero: { feminine: 'ingeniera', masculine: 'ingeniero' },
  arquitecto: { feminine: 'arquitecta', masculine: 'arquitecto' },
  abogado: { feminine: 'abogada', masculine: 'abogado' },
  médico: { feminine: 'médica', masculine: 'médico' },
  enfermero: { feminine: 'enfermera', masculine: 'enfermero' },
  psicólogo: { feminine: 'psicóloga', masculine: 'psicólogo' },
  nutricionista: { feminine: 'nutricionista', masculine: 'nutricionista' }, // invariable
  terapeuta: { feminine: 'terapeuta', masculine: 'terapeuta' }, // invariable
  investigador: { feminine: 'investigadora', masculine: 'investigador' },
  científico: { feminine: 'científica', masculine: 'científico' },
  escritor: { feminine: 'escritora', masculine: 'escritor' },
  editor: { feminine: 'editora', masculine: 'editor' },
  traductor: { feminine: 'traductora', masculine: 'traductor' },
  contador: { feminine: 'contadora', masculine: 'contador' },
  administrador: { feminine: 'administradora', masculine: 'administrador' },
  emprendedor: { feminine: 'emprendedora', masculine: 'emprendedor' },
  fundador: { feminine: 'fundadora', masculine: 'fundador' },
  líder: { feminine: 'líder', masculine: 'líder' }, // invariable
  jefe: { feminine: 'jefa', masculine: 'jefe' },
  supervisor: { feminine: 'supervisora', masculine: 'supervisor' },
  asistente: { feminine: 'asistenta', masculine: 'asistente' },
  ejecutivo: { feminine: 'ejecutiva', masculine: 'ejecutivo' },
  representante: { feminine: 'representante', masculine: 'representante' }, // invariable
  vendedor: { feminine: 'vendedora', masculine: 'vendedor' },
  asesor: { feminine: 'asesora', masculine: 'asesor' },
  experto: { feminine: 'experta', masculine: 'experto' },
  técnico: { feminine: 'técnica', masculine: 'técnico' },
  programador: { feminine: 'programadora', masculine: 'programador' },
  entrenador: { feminine: 'entrenadora', masculine: 'entrenador' },
  facilitador: { feminine: 'facilitadora', masculine: 'facilitador' },
  formador: { feminine: 'formadora', masculine: 'formador' },
  capacitador: { feminine: 'capacitadora', masculine: 'capacitador' },
  orador: { feminine: 'oradora', masculine: 'orador' },
  conferencista: { feminine: 'conferencista', masculine: 'conferencista' }, // invariable
  autor: { feminine: 'autora', masculine: 'autor' },
  creador: { feminine: 'creadora', masculine: 'creador' },
  productor: { feminine: 'productora', masculine: 'productor' },
  fotógrafo: { feminine: 'fotógrafa', masculine: 'fotógrafo' },
  artista: { feminine: 'artista', masculine: 'artista' }, // invariable
  músico: { feminine: 'música', masculine: 'músico' },
  cocinero: { feminine: 'cocinera', masculine: 'cocinero' },
  chef: { feminine: 'chef', masculine: 'chef' }, // invariable

  // Adjectives commonly used in profiles
  certificado: { feminine: 'certificada', masculine: 'certificado' },
  especializado: { feminine: 'especializada', masculine: 'especializado' },
  apasionado: { feminine: 'apasionada', masculine: 'apasionado' },
  comprometido: { feminine: 'comprometida', masculine: 'comprometido' },
  dedicado: { feminine: 'dedicada', masculine: 'dedicado' },
  enfocado: { feminine: 'enfocada', masculine: 'enfocado' },
  orientado: { feminine: 'orientada', masculine: 'orientado' },
  motivado: { feminine: 'motivada', masculine: 'motivado' },
  reconocido: { feminine: 'reconocida', masculine: 'reconocido' },
  experimentado: { feminine: 'experimentada', masculine: 'experimentado' },
  calificado: { feminine: 'calificada', masculine: 'calificado' },
  capacitado: { feminine: 'capacitada', masculine: 'capacitado' },
  licenciado: { feminine: 'licenciada', masculine: 'licenciado' },
  graduado: { feminine: 'graduada', masculine: 'graduado' },
  titulado: { feminine: 'titulada', masculine: 'titulado' },
};

// Build reverse lookup maps
const FEMININE_TO_MASCULINE: Record<string, string> = {};
const MASCULINE_TO_FEMININE: Record<string, string> = {};

Object.values(GENDERED_WORDS).forEach(({ feminine, masculine }) => {
  if (feminine !== masculine) {
    FEMININE_TO_MASCULINE[feminine.toLowerCase()] = masculine;
    MASCULINE_TO_FEMININE[masculine.toLowerCase()] = feminine;
  }
});

/**
 * Corrects gender in a Spanish text based on the target gender
 * @param text - The translated Spanish text
 * @param gender - The target gender ('male', 'female', 'masculino', 'femenino', 'm', 'f', etc.)
 * @returns The text with corrected gender
 */
export function correctGender(text: string, gender: string | null | undefined): string {
  if (!text || !gender) return text;

  const normalizedGender = gender.toLowerCase().trim();
  const isMale = ['male', 'masculino', 'm', 'hombre', 'man'].includes(normalizedGender);
  const isFemale = ['female', 'femenino', 'f', 'mujer', 'woman'].includes(normalizedGender);

  if (!isMale && !isFemale) return text;

  // Create a regex pattern to match all gendered words
  const targetMap = isMale ? FEMININE_TO_MASCULINE : MASCULINE_TO_FEMININE;
  const wordsToReplace = Object.keys(targetMap);

  if (wordsToReplace.length === 0) return text;

  // Replace each gendered word
  let result = text;

  for (const word of wordsToReplace) {
    // Match whole words only, case-insensitive
    const regex = new RegExp(`\\b${escapeRegex(word)}\\b`, 'gi');
    result = result.replace(regex, (match) => {
      const replacement = targetMap[match.toLowerCase()];
      // Preserve original capitalization
      if (match[0] === match[0].toUpperCase()) {
        return replacement.charAt(0).toUpperCase() + replacement.slice(1);
      }
      return replacement;
    });
  }

  return result;
}

function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Common male names (English and Spanish)
const MALE_NAMES = new Set([
  // English
  'james', 'john', 'robert', 'michael', 'david', 'william', 'richard', 'joseph',
  'thomas', 'charles', 'christopher', 'daniel', 'matthew', 'anthony', 'mark',
  'donald', 'steven', 'paul', 'andrew', 'joshua', 'kenneth', 'kevin', 'brian',
  'george', 'timothy', 'ronald', 'edward', 'jason', 'jeffrey', 'ryan', 'jacob',
  'gary', 'nicholas', 'eric', 'jonathan', 'stephen', 'larry', 'justin', 'scott',
  'brandon', 'benjamin', 'samuel', 'raymond', 'gregory', 'frank', 'alexander',
  'patrick', 'jack', 'dennis', 'jerry', 'tyler', 'aaron', 'jose', 'adam', 'nathan',
  'henry', 'douglas', 'zachary', 'peter', 'kyle', 'noah', 'ethan', 'jeremy',
  'walter', 'christian', 'keith', 'roger', 'terry', 'austin', 'sean', 'gerald',
  'carl', 'harold', 'dylan', 'arthur', 'lawrence', 'jordan', 'jesse', 'bryan',
  // Spanish
  'carlos', 'juan', 'miguel', 'luis', 'pedro', 'pablo', 'antonio', 'francisco',
  'alejandro', 'manuel', 'ricardo', 'fernando', 'sergio', 'alberto', 'rafael',
  'eduardo', 'mario', 'oscar', 'enrique', 'raul', 'andres', 'diego', 'victor',
  'jorge', 'angel', 'gabriel', 'hugo', 'ivan', 'javier', 'adrian', 'ruben',
  'marcos', 'arturo', 'cesar', 'hector', 'guillermo', 'martin', 'felipe',
  'roberto', 'santiago', 'nicolas', 'mateo', 'tomas', 'ignacio', 'emilio',
]);

// Common female names (English and Spanish)
const FEMALE_NAMES = new Set([
  // English
  'mary', 'patricia', 'jennifer', 'linda', 'elizabeth', 'barbara', 'susan',
  'jessica', 'sarah', 'karen', 'lisa', 'nancy', 'betty', 'margaret', 'sandra',
  'ashley', 'kimberly', 'emily', 'donna', 'michelle', 'dorothy', 'carol',
  'amanda', 'melissa', 'deborah', 'stephanie', 'rebecca', 'sharon', 'laura',
  'cynthia', 'kathleen', 'amy', 'angela', 'shirley', 'anna', 'brenda', 'pamela',
  'emma', 'nicole', 'helen', 'samantha', 'katherine', 'christine', 'debra',
  'rachel', 'carolyn', 'janet', 'catherine', 'maria', 'heather', 'diane',
  'ruth', 'julie', 'olivia', 'joyce', 'virginia', 'victoria', 'kelly', 'lauren',
  'christina', 'joan', 'evelyn', 'judith', 'megan', 'andrea', 'cheryl', 'hannah',
  'jacqueline', 'martha', 'gloria', 'teresa', 'ann', 'sara', 'madison', 'frances',
  // Spanish
  'maria', 'carmen', 'ana', 'rosa', 'laura', 'elena', 'paula', 'lucia',
  'isabel', 'marta', 'cristina', 'patricia', 'andrea', 'sara', 'claudia',
  'daniela', 'gabriela', 'alejandra', 'fernanda', 'valentina', 'sofia', 'natalia',
  'carolina', 'adriana', 'monica', 'veronica', 'julia', 'silvia', 'beatriz',
  'margarita', 'alicia', 'catalina', 'camila', 'susana', 'pilar', 'rocio',
  'lorena', 'raquel', 'teresa', 'victoria', 'diana', 'angela', 'luisa',
  'mercedes', 'concepcion', 'dolores', 'amparo', 'inmaculada', 'esperanza',
]);

/**
 * Infers gender from a full name
 * @param fullName - The person's full name
 * @returns 'male', 'female', or null if cannot determine
 */
export function inferGenderFromName(fullName: string | null | undefined): string | null {
  if (!fullName) return null;

  // Get the first name (first word before space)
  const firstName = fullName.trim().split(/\s+/)[0]?.toLowerCase();
  if (!firstName) return null;

  if (MALE_NAMES.has(firstName)) return 'male';
  if (FEMALE_NAMES.has(firstName)) return 'female';

  return null;
}

/**
 * Batch correct gender for multiple texts
 */
export function correctGenderBatch(
  translations: Map<string, string>,
  gender: string | null | undefined
): Map<string, string> {
  if (!gender) return translations;

  const corrected = new Map<string, string>();
  translations.forEach((translated, original) => {
    corrected.set(original, correctGender(translated, gender));
  });
  return corrected;
}
