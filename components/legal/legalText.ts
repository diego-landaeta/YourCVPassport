import { defineBolsaText } from '../../lib/bolsaText';

/**
 * Textos de la fase 1 de la bolsa de empleo (#6): elección de camino en el
 * registro, casillas legales, puerta de aceptación y páginas de condiciones.
 * es + en con las MISMAS claves (no se toca translations/es.ts ni en.ts).
 */
export const useLegalText = defineBolsaText({
  es: {
    // Elección de camino
    typeTitle: '¿Buscas empleo o quieres contratar?',
    typeSubtitle: 'Elige cómo vas a usar YourCVPassport. Podrás cambiarlo antes de crear la cuenta.',
    typeCandidate: 'Busco empleo',
    typeCandidateDesc: 'Crea tu CV verificado y aplícate a ofertas en un solo paso.',
    typeCompany: 'Quiero contratar',
    typeCompanyDesc: 'Publica ofertas y recibe candidatos con perfil verificado.',
    typeChange: 'Cambiar',
    typeSelectedCandidate: 'Registro de candidato',
    typeSelectedCompany: 'Registro de empresa',
    companyAccountNote:
      'Primero creas tu cuenta personal. Cuando verifiques tu correo, completarás los datos de la empresa y aceptarás las condiciones para empleadores.',

    // Fecha de nacimiento
    birthDate: 'Fecha de nacimiento',
    birthDateHelp: 'Hay que tener al menos 16 años para registrarse.',
    birthDateRequired: 'Indica tu fecha de nacimiento.',
    birthDateInvalid: 'La fecha de nacimiento no es válida.',
    underage: 'Debes tener al menos 16 años para crear una cuenta.',
    minorNotice:
      'Tienes menos de 18 años: para usar la plataforma necesitas la autorización de tus padres o tutores.',
    guardianCheck: 'Confirmo que cuento con la autorización de mis padres o tutores.',
    errGuardian: 'Confirma la autorización de tus padres o tutores para continuar.',

    // Casillas
    requiredGroup: 'Obligatorias',
    optionalGroup: 'Opcionales',
    requiredHint: 'Necesarias para crear la cuenta.',
    optionalHint: 'No impiden registrarte. Puedes cambiarlas cuando quieras desde tu perfil.',
    typeGroupAccount: 'Tu cuenta',
    typeGroupAbout: 'Sobre ti',
    typeGroupTerms: 'Condiciones',
    birthDateHelpShort: 'Solo la usamos para comprobar tu edad. No se muestra en tu perfil.',
    gateDocsTitle: 'Documentos',
    gateConfirmHint: 'Marca cada casilla para poder continuar.',
    gateProgress: '{n} de {total} marcadas',
    gateReadHint: 'Léelo con calma: puedes descargarlo y conservarlo.',
    docBack: 'Condiciones y privacidad',
    readInNewTab: '(se abre en una pestaña nueva)',
    acceptLead: 'Acepto las ',
    termsLinkCandidate: 'Condiciones de registro y uso para candidatos',
    acceptAnd: ' y la ',
    privacyLink: 'Política de Privacidad',
    truthful: 'Declaro que los datos de mi perfil son verdaderos.',
    employerPowerLead: 'Declaro tener poder o autorización para registrar a esta empresa y acepto las ',
    termsLinkEmployer: 'Condiciones para Empleadores',
    employerOffers:
      'Me comprometo a publicar solo ofertas reales y no discriminatorias, y a usar los datos de los candidatos únicamente para la selección.',
    employerAnnexLead: 'Acepto el ',
    employerAnnexLink: 'Anexo I de encargo del tratamiento de datos',
    optProfilePublic: 'Quiero que mi perfil sea público.',
    optGoogle: 'Quiero aparecer en los resultados de Google.',
    optContact: 'Permito que las empresas me encuentren y me contacten.',
    optAlerts: 'Quiero recibir alertas de ofertas y novedades.',
    optNews: 'Quiero recibir novedades comerciales.',
    errMandatory: 'Marca todas las casillas obligatorias para continuar.',
    errTruthful: 'Debes declarar que los datos de tu perfil son verdaderos.',

    // Puerta de aceptación (LegalGate)
    gateChecking: 'Comprobando condiciones...',
    gateTitle: 'Acepta las condiciones para continuar',
    gateIntro:
      'Necesitamos registrar tu aceptación de los documentos siguientes (son nuevos o han cambiado). Hasta que los aceptes no podrás usar esta parte de la plataforma.',
    gateAccept: 'Aceptar y continuar',
    gateAccepting: 'Guardando...',
    gateError: 'No se pudo guardar tu aceptación. Inténtalo de nuevo.',
    gateLogout: 'Cerrar sesión',
    gateConfirmGroup: 'Confirmo que:',
    gateRead: 'Texto completo',
    gateVersion: 'Versión {version}',
    gateSince: 'en vigor desde {date}',
    download: 'Descargar',
    draftBadge: 'Borrador pendiente de revisión legal',
    downloadTerms: 'Descargar condiciones',
    downloadTermsLoading: 'Preparando...',
    downloadTermsError: 'No hemos podido descargar las condiciones. Inténtalo de nuevo en unos minutos.',

    // Puerta: fecha de nacimiento que falta (cuentas con Google/LinkedIn o anteriores)
    birthGateTitle: 'Confirma tu fecha de nacimiento',
    birthGateIntro:
      'Para usar la plataforma necesitamos comprobar que tienes la edad mínima. Es un dato que no se muestra en tu perfil ni lo ven las empresas.',
    birthGateSave: 'Guardar y continuar',
    birthGateSaving: 'Comprobando...',
    birthGateError: 'No se pudo guardar la fecha de nacimiento. Inténtalo de nuevo.',
    birthGateGuardianHint: 'Marca la casilla para continuar.',
    underageGateTitle: 'Todavía no puedes usar YourCVPassport',
    underageGateText:
      'Hay que tener al menos 16 años para usar la plataforma. No hemos guardado la fecha y vamos a cerrar tu sesión.',
    underageGateClose: 'Entendido, cerrar sesión',
    underageLoginNotice:
      'Hemos cerrado tu sesión: hay que tener al menos 16 años para usar YourCVPassport. No hemos guardado tu fecha de nacimiento.',

    // Páginas de condiciones y privacidad
    docLoading: 'Cargando texto...',
    docFallback: 'No hemos podido cargar la última versión del texto; mostramos una versión resumida.',
    docDraftNotice: 'Borrador v{version}: texto provisional, pendiente de revisión por un abogado.',
    docVersionLine: 'Versión {version} · en vigor desde {date}',
    tabCandidates: 'Candidatos',
    tabEmployers: 'Empleadores',
    docDownload: 'Descargar texto',
    docTabsLabel: 'Tipo de condiciones',
  },
  en: {
    typeTitle: 'Are you looking for a job or hiring?',
    typeSubtitle: 'Choose how you will use YourCVPassport. You can change it before creating the account.',
    typeCandidate: "I'm looking for a job",
    typeCandidateDesc: 'Build a verified CV and apply to jobs in a single step.',
    typeCompany: 'I want to hire',
    typeCompanyDesc: 'Post job offers and receive candidates with verified profiles.',
    typeChange: 'Change',
    typeSelectedCandidate: 'Candidate sign-up',
    typeSelectedCompany: 'Company sign-up',
    companyAccountNote:
      'You first create your personal account. Once you verify your email, you will fill in the company details and accept the employer terms.',

    birthDate: 'Date of birth',
    birthDateHelp: 'You must be at least 16 years old to sign up.',
    birthDateRequired: 'Enter your date of birth.',
    birthDateInvalid: 'The date of birth is not valid.',
    underage: 'You must be at least 16 years old to create an account.',
    minorNotice:
      'You are under 18: to use the platform you need the authorisation of your parents or guardians.',
    guardianCheck: 'I confirm I have the authorisation of my parents or guardians.',
    errGuardian: 'Confirm the authorisation of your parents or guardians to continue.',

    requiredGroup: 'Required',
    optionalGroup: 'Optional',
    requiredHint: 'Needed to create the account.',
    optionalHint: "They don't prevent you from signing up. You can change them any time from your profile.",
    typeGroupAccount: 'Your account',
    typeGroupAbout: 'About you',
    typeGroupTerms: 'Terms',
    birthDateHelpShort: 'We only use it to check your age. It is not shown on your profile.',
    gateDocsTitle: 'Documents',
    gateConfirmHint: 'Tick every box to be able to continue.',
    gateProgress: '{n} of {total} ticked',
    gateReadHint: 'Take your time: you can download it and keep a copy.',
    docBack: 'Terms and privacy',
    readInNewTab: '(opens in a new tab)',
    acceptLead: 'I accept the ',
    termsLinkCandidate: 'Registration and Terms of Use for candidates',
    acceptAnd: ' and the ',
    privacyLink: 'Privacy Policy',
    truthful: 'I declare that the data in my profile is true.',
    employerPowerLead: 'I declare I have the power or authorisation to register this company, and I accept the ',
    termsLinkEmployer: 'Employer Terms',
    employerOffers:
      'I undertake to publish only genuine, non-discriminatory job offers and to use candidate data solely for selection.',
    employerAnnexLead: 'I accept the ',
    employerAnnexLink: 'Annex I (data processing agreement)',
    optProfilePublic: 'I want my profile to be public.',
    optGoogle: 'I want to appear in Google results.',
    optContact: 'I allow companies to find and contact me.',
    optAlerts: 'I want to receive job alerts and news.',
    optNews: 'I want to receive commercial news.',
    errMandatory: 'Tick all the required boxes to continue.',
    errTruthful: 'You must declare that the data in your profile is true.',

    gateChecking: 'Checking terms...',
    gateTitle: 'Accept the terms to continue',
    gateIntro:
      'We need to record your acceptance of the documents below (they are new or have changed). Until you accept them you will not be able to use this part of the platform.',
    gateAccept: 'Accept and continue',
    gateAccepting: 'Saving...',
    gateError: 'Your acceptance could not be saved. Please try again.',
    gateLogout: 'Sign out',
    gateConfirmGroup: 'I confirm that:',
    gateRead: 'Full text',
    gateVersion: 'Version {version}',
    gateSince: 'in force since {date}',
    download: 'Download',
    draftBadge: 'Draft pending legal review',
    downloadTerms: 'Download terms',
    downloadTermsLoading: 'Preparing...',
    downloadTermsError: 'We could not download the terms. Please try again in a few minutes.',

    birthGateTitle: 'Confirm your date of birth',
    birthGateIntro:
      'To use the platform we need to check that you meet the minimum age. It is not shown on your profile and companies cannot see it.',
    birthGateSave: 'Save and continue',
    birthGateSaving: 'Checking...',
    birthGateError: 'Your date of birth could not be saved. Please try again.',
    birthGateGuardianHint: 'Tick the box to continue.',
    underageGateTitle: 'You cannot use YourCVPassport yet',
    underageGateText:
      'You must be at least 16 years old to use the platform. We have not saved the date and we are going to sign you out.',
    underageGateClose: 'Understood, sign me out',
    underageLoginNotice:
      'We have signed you out: you must be at least 16 years old to use YourCVPassport. We have not saved your date of birth.',

    docLoading: 'Loading text...',
    docFallback: 'We could not load the latest version of the text; showing a summary version.',
    docDraftNotice: 'Draft v{version}: provisional text, pending review by a lawyer.',
    docVersionLine: 'Version {version} · in force since {date}',
    tabCandidates: 'Candidates',
    tabEmployers: 'Employers',
    docDownload: 'Download text',
    docTabsLabel: 'Type of terms',
  },
});

/** Etiqueta (texto plano) de cada casilla del contrato SQL, para la puerta de aceptación. */
export function casillaLabel(tx: ReturnType<typeof useLegalText>, key: string): string {
  switch (key) {
    case 'acepto_condiciones_privacidad':
      return `${tx.acceptLead}${tx.termsLinkCandidate}${tx.acceptAnd}${tx.privacyLink}`;
    case 'datos_verdaderos':
      return tx.truthful;
    case 'autorizacion_tutores':
      return tx.guardianCheck;
    case 'poder_representacion':
      return `${tx.employerPowerLead}${tx.termsLinkEmployer}${tx.acceptAnd}${tx.privacyLink}`;
    case 'ofertas_reales_no_discriminatorias':
      return tx.employerOffers;
    case 'anexo_encargo_tratamiento':
      return `${tx.employerAnnexLead}${tx.employerAnnexLink}`;
    case 'perfil_publico':
      return tx.optProfilePublic;
    case 'aparecer_google':
      return tx.optGoogle;
    case 'empresas_contacto':
      return tx.optContact;
    case 'alertas_novedades':
      return tx.optAlerts;
    case 'novedades_comerciales':
      return tx.optNews;
    default:
      return key;
  }
}
