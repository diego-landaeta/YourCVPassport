import { defineBolsaText } from '../../lib/bolsaText';

/**
 * Textos NUEVOS del registro de empresa (#6): país, contacto, tamaños, casillas
 * de empleador, avisos de verificación y banner de «en revisión».
 * Los textos que ya existían siguen en translations (company.registration.*).
 */
export const useCompanyRegText = defineBolsaText({
  es: {
    needAccountTitle: 'Necesitas una cuenta para registrar tu empresa',
    needAccountBody:
      'Primero crea tu cuenta (o inicia sesión). Después volverás aquí para completar los datos de la empresa.',
    createAccount: 'Crear cuenta de empresa',
    signIn: 'Ya tengo cuenta',

    country: 'País de la empresa',
    countryPlaceholder: 'Selecciona un país',
    countriesError: 'No se pudo cargar la lista de países. Recarga la página.',
    countriesRetry: 'Reintentar',
    industryRequired: 'Sector',
    sizeRequired: 'Tamaño de la empresa',
    size1: '1-10 empleados',
    size2: '11-50 empleados',
    size3: '51-250 empleados',
    size4: 'Más de 250 empleados',
    selectSize: 'Selecciona el tamaño',

    contactSection: 'Persona de contacto',
    contactName: 'Nombre y apellidos',
    contactPosition: 'Cargo',
    contactPositionPlaceholder: 'Responsable de RR. HH., reclutador...',

    docsOptionalNote:
      'Los documentos son opcionales: ayudan a verificar tu empresa más rápido, pero no son necesarios para registrarla.',
    optionalSuffix: '(opcional)',

    legalSection: 'Condiciones legales',

    errCountry: 'Selecciona el país de la empresa.',
    errIndustry: 'Indica el sector de la empresa.',
    errSize: 'Selecciona el tamaño de la empresa.',
    errContactName: 'Indica el nombre de la persona de contacto.',
    errConsents: 'Marca todas las casillas obligatorias para registrar la empresa.',
    errTaxDuplicate: 'Ya hay una empresa registrada con este identificador fiscal. Si es la tuya, pide acceso a quien la administra o escríbenos a support@yourcvpassport.com.',
    errEmailDuplicate: 'Ya hay una empresa registrada con este correo. Usa otro correo de la empresa o escríbenos a support@yourcvpassport.com.',
    errDuplicateInsert: 'Ya existe una empresa con ese identificador fiscal o ese correo, así que no hemos creado nada. Revisa los datos o escríbenos a support@yourcvpassport.com.',
    errLinkFailed: 'No hemos podido terminar el registro y lo hemos deshecho para que no quede nada a medias. Inténtalo de nuevo; si se repite, escríbenos a support@yourcvpassport.com.',

    acceptSaveFailed:
      'La empresa se ha registrado, pero no pudimos guardar tu aceptación de las condiciones. Te la pediremos al entrar en el panel.',
    successVerified: 'Tu empresa ha sido verificada. Ya puedes preparar y publicar ofertas.',
    successPending:
      'Hemos recibido el registro. Tu empresa está en revisión: puedes preparar borradores de ofertas, pero no publicarlas hasta que la verifiquemos.',
    successChecking:
      'Hemos recibido el registro y estamos revisando tu empresa. Si la revisión tarda un poco, no pasa nada: te avisaremos por correo en cuanto esté verificada. Mientras tanto puedes preparar borradores de ofertas.',

    // Banner del panel de empresa mientras está PENDING
    pendingBannerTitle: 'Tu empresa está en revisión',
    pendingBannerBody:
      'Puedes entrar y preparar borradores de ofertas, pero no publicarlas hasta que verifiquemos tu empresa (normalmente 1-2 días laborables). Te avisaremos por correo.',
    publishBlocked: 'Publicar no está disponible mientras tu empresa está en revisión.',

    // Presentación del formulario por secciones
    regIntro: 'Cuéntanos quién eres. Verificamos cada empresa antes de que pueda publicar, y así los candidatos saben que las ofertas son reales.',
    secCompanyTitle: 'Datos de la empresa',
    secCompanyHelp: 'Los usamos para verificar la empresa. En las ofertas se muestran el nombre comercial y el sector, no el identificador fiscal.',
    secContactTitle: 'Persona de contacto',
    secContactHelp: 'Con quién hablamos si necesitamos confirmar algo.',
    secAddressTitle: 'Dirección',
    secAddressHelp: 'Opcional. Ayuda a localizar la empresa.',
    secDocsTitle: 'Logotipo y documentos',
    secLegalTitle: 'Condiciones',
    secLegalHelp: 'Para registrar la empresa necesitas aceptar estas condiciones.',
    requiredNote: 'Los campos con * son obligatorios.',
    reviewStepsTitle: 'Qué pasa después',
    reviewStep1: 'Revisamos tus datos (normalmente 1-2 días laborables).',
    reviewStep2: 'Mientras tanto puedes entrar y preparar borradores de ofertas.',
    reviewStep3: 'Cuando verifiquemos la empresa, podrás publicar.',
    goToPanel: 'Ir al panel de empresa',
  },
  en: {
    needAccountTitle: 'You need an account to register your company',
    needAccountBody:
      'First create your account (or sign in). Then you will come back here to complete the company details.',
    createAccount: 'Create company account',
    signIn: 'I already have an account',

    country: 'Company country',
    countryPlaceholder: 'Select a country',
    countriesError: 'The list of countries could not be loaded. Reload the page.',
    countriesRetry: 'Retry',
    industryRequired: 'Industry',
    sizeRequired: 'Company size',
    size1: '1-10 employees',
    size2: '11-50 employees',
    size3: '51-250 employees',
    size4: 'More than 250 employees',
    selectSize: 'Select the size',

    contactSection: 'Contact person',
    contactName: 'Full name',
    contactPosition: 'Position',
    contactPositionPlaceholder: 'HR manager, recruiter...',

    docsOptionalNote:
      'Documents are optional: they help us verify your company faster, but they are not required to register it.',
    optionalSuffix: '(optional)',

    legalSection: 'Legal terms',

    errCountry: 'Select the company country.',
    errIndustry: 'Enter the company industry.',
    errSize: 'Select the company size.',
    errContactName: 'Enter the name of the contact person.',
    errConsents: 'Tick all the required boxes to register the company.',
    errTaxDuplicate: 'A company is already registered with this tax ID. If it is yours, ask whoever manages it for access or write to support@yourcvpassport.com.',
    errEmailDuplicate: 'A company is already registered with this email. Use another company email or write to support@yourcvpassport.com.',
    errDuplicateInsert: 'A company with that tax ID or email already exists, so nothing was created. Check the details or write to support@yourcvpassport.com.',
    errLinkFailed: 'We could not finish the registration and we undid it so nothing is left half done. Please try again; if it keeps happening, write to support@yourcvpassport.com.',

    acceptSaveFailed:
      'The company has been registered, but we could not save your acceptance of the terms. We will ask for it when you enter the dashboard.',
    successVerified: 'Your company has been verified. You can now prepare and publish job offers.',
    successPending:
      'We have received your registration. Your company is under review: you can prepare draft job offers, but you cannot publish them until we verify it.',
    successChecking:
      'We have received your registration and we are reviewing your company. If the review takes a little while, that is fine: we will email you as soon as it is verified. Meanwhile you can prepare draft job offers.',

    pendingBannerTitle: 'Your company is under review',
    pendingBannerBody:
      'You can sign in and prepare draft job offers, but you cannot publish them until we verify your company (usually 1-2 business days). We will notify you by email.',
    publishBlocked: 'Publishing is not available while your company is under review.',

    regIntro: 'Tell us who you are. We verify every company before it can publish, so candidates know the offers are real.',
    secCompanyTitle: 'Company details',
    secCompanyHelp: 'We use them to verify the company. Job offers show the trade name and industry, not the tax ID.',
    secContactTitle: 'Contact person',
    secContactHelp: 'Who we talk to if we need to confirm something.',
    secAddressTitle: 'Address',
    secAddressHelp: 'Optional. Helps us locate the company.',
    secDocsTitle: 'Logo and documents',
    secLegalTitle: 'Terms',
    secLegalHelp: 'To register the company you need to accept these terms.',
    requiredNote: 'Fields marked * are required.',
    reviewStepsTitle: 'What happens next',
    reviewStep1: 'We review your details (usually 1-2 business days).',
    reviewStep2: 'Meanwhile you can sign in and prepare draft job offers.',
    reviewStep3: 'Once we verify the company, you will be able to publish.',
    goToPanel: 'Go to the company dashboard',
  },
});
