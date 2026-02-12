-- Diversify Profile Summaries - Remove "I believe" pattern
-- Makes profiles look more natural and varied

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Amanda Rodriguez - Leadership Coach
  SELECT id INTO v_user_id FROM auth.users WHERE email='amanda.rodriguez@iseih.edu';
  IF v_user_id IS NOT NULL THEN
    UPDATE profiles SET summary='Durante 9 años he transformado la forma en que líderes de todo el mundo entienden el liderazgo—no como autoridad, sino como presencia, integridad y la valentía de liderar desde tu ser más auténtico. He entrenado a más de 150 líderes para pasar de la gestión reactiva al liderazgo consciente, donde las decisiones se alinean con valores y las organizaciones prosperan a través de conexiones auténticas. Mi enfoque integra mindfulness, inteligencia emocional y pensamiento sistémico para ayudar a líderes a cultivar conciencia, comunicar auténticamente y crear culturas de confianza. Trabajo con ejecutivos, fundadores y agentes de cambio que enfrentan desafíos complejos—fusiones, transformación cultural, dilemas éticos—ayudándoles a liderar con sabiduría en lugar de ego. En ISEIH, entreno a coaches y consultores en frameworks de liderazgo consciente, enseñándoles a facilitar conversaciones transformacionales que cambian cómo los líderes se ven a sí mismos y su impacto.', updated_at=NOW() WHERE id=v_user_id;
    RAISE NOTICE '✅ Amanda Rodriguez updated';
  END IF;

  -- Daniel Foster - Research Methodologist
  SELECT id INTO v_user_id FROM auth.users WHERE email='daniel.foster@iseih.edu';
  IF v_user_id IS NOT NULL THEN
    UPDATE profiles SET summary='¿Qué separa una práctica holística brillante de una que transforma vidas de manera comprobable? La investigación rigurosa. Durante 13 años, he apoyado más de 100 proyectos de investigación en salud integrativa, ayudando a profesionales a diseñar estudios, analizar datos y traducir hallazgos en insights accionables. Mi trabajo conecta la práctica clínica con la validación científica. Mi camino comenzó con frustración: profesionales holísticos brillantes cuyo trabajo carecía de credibilidad porque no podían probar su eficacia. Dediqué mi carrera a hacer la investigación rigurosa accesible para no académicos, enseñándoles a diseñar estudios, recopilar datos significativos y comunicar hallazgos profesionalmente. En ISEIH, enseño diseño de investigación, análisis estadístico y práctica basada en evidencia, desmitificando métodos de investigación y mostrando que la buena ciencia no requiere un doctorado—solo curiosidad, integridad y pensamiento sistemático.', updated_at=NOW() WHERE id=v_user_id;
    RAISE NOTICE '✅ Daniel Foster updated';
  END IF;

  -- Margaret Sullivan - Contemplative Practices Teacher
  SELECT id INTO v_user_id FROM auth.users WHERE email='margaret.sullivan@iseih.edu';
  IF v_user_id IS NOT NULL THEN
    UPDATE profiles SET summary='La práctica contemplativa no es un escape de la vida, sino una forma de estar completamente presente en ella. Durante 18 años, he enseñado meditación, indagación contemplativa y prácticas basadas en mindfulness a más de 800 estudiantes, ayudándoles a desarrollar recursos internos para navegar los desafíos de la vida con gracia y sabiduría. Mi camino comenzó en crisis. Después de una pérdida devastadora, descubrí la meditación budista y experimenté de primera mano cómo la práctica contemplativa puede sostener el sufrimiento sin ser consumida por él. Esa transformación personal se convirtió en el trabajo de mi vida. Me entrené intensivamente en múltiples tradiciones contemplativas—Zen, Vipassana, cristianismo contemplativo y mindfulness secular—aprendiendo a enseñar prácticas accesibles, no dogmáticas y profundamente transformadoras. En ISEIH, entreno a maestros, terapeutas y coaches en pedagogía contemplativa: cómo guiar meditación, facilitar indagación y crear condiciones para el insight.', updated_at=NOW() WHERE id=v_user_id;
    RAISE NOTICE '✅ Margaret Sullivan updated';
  END IF;

  -- Patricia Coleman - Qualitative Research Specialist
  SELECT id INTO v_user_id FROM auth.users WHERE email='patricia.coleman@iseih.edu';
  IF v_user_id IS NOT NULL THEN
    UPDATE profiles SET summary='Especialista en investigación cualitativa con 13 años transformando experiencias humanas complejas en conocimiento riguroso y accionable. He completado más de 80 proyectos de investigación en salud holística, utilizando metodologías innovadoras que honran tanto las historias individuales como los patrones emergentes. La investigación cualitativa captura lo que los números no pueden: la riqueza de la experiencia vivida, los matices del significado, las complejidades de la sanación. Mi trabajo ayuda a profesionales holísticos a documentar y comunicar su impacto de formas que resuenan tanto con clientes como con instituciones. En ISEIH, enseño métodos de investigación cualitativa—entrevistas fenomenológicas, teoría fundamentada, análisis temático—guiando a estudiantes a través del arte de escuchar profundamente, codificar meticulosamente y presentar hallazgos persuasivamente. Mi misión: elevar la investigación cualitativa como ciencia rigurosa que honra la complejidad humana.', updated_at=NOW() WHERE id=v_user_id;
    RAISE NOTICE '✅ Patricia Coleman updated';
  END IF;

  -- Kevin Park - Business Coach
  SELECT id INTO v_user_id FROM auth.users WHERE email='kevin.park@iseih.edu';
  IF v_user_id IS NOT NULL THEN
    UPDATE profiles SET summary='He ayudado a más de 200 emprendedores a construir negocios exitosos que realmente funcionan—no solo en papel, sino en la compleja realidad del mercado, las finanzas y el crecimiento sostenible. Durante 12 años como coach empresarial, he guiado a profesionales holísticos desde la incertidumbre inicial hasta empresas prósperas con estrategia clara, métricas sólidas y rentabilidad comprobada. Los profesionales holísticos a menudo tienen un don pero luchan con el lado empresarial. Mi trabajo es cerrar esa brecha. Enseño estrategia de negocios práctica, no teoría—modelado financiero real, estrategias de marketing que funcionan, sistemas de ventas éticos y crecimiento operacional. En ISEIH, entreno a estudiantes en emprendimiento holístico: cómo lanzar, escalar y sostener negocios exitosos mientras se mantienen fieles a sus valores. He visto demasiados practicantes brillantes fallar no por falta de habilidad, sino por falta de conocimiento empresarial. Mi misión: asegurar que cada graduado tenga las herramientas para prosperar.', updated_at=NOW() WHERE id=v_user_id;
    RAISE NOTICE '✅ Kevin Park updated';
  END IF;

  -- Thomas Rivera - Spiritual Studies Scholar
  SELECT id INTO v_user_id FROM auth.users WHERE email='thomas.rivera@iseih.edu';
  IF v_user_id IS NOT NULL THEN
    UPDATE profiles SET summary='Las tradiciones espirituales del mundo comparten un núcleo común—pero solo cuando miramos más allá de dogmas y hacia las prácticas, experiencias y transformaciones vividas. Mi trabajo durante 15 años ha explorado estos hilos universales, ayudando a más de 600 estudiantes a comprender las tradiciones espirituales con profundidad académica y relevancia práctica. Estudié intensivamente cristianismo contemplativo, budismo, sufismo, misticismo judío y tradiciones indígenas, buscando patrones en cómo cultivan la conciencia, compasión y conexión con lo sagrado. Mi enfoque es académicamente riguroso pero experiencialmente fundamentado—no solo estudiando textos, sino practicando para entender cómo las enseñanzas transforman la conciencia. En ISEIH, enseño religión comparada, misticismo y tradiciones de sabiduría, creando espacios donde estudiantes pueden explorar espiritualidad críticamente mientras honran su santidad. Mi pasión: hacer la sabiduría espiritual accesible más allá de fronteras religiosas.', updated_at=NOW() WHERE id=v_user_id;
    RAISE NOTICE '✅ Thomas Rivera updated';
  END IF;

  -- Alex Martinez - Ethics Teacher
  SELECT id INTO v_user_id FROM auth.users WHERE email='alex.martinez@iseih.edu';
  IF v_user_id IS NOT NULL THEN
    UPDATE profiles SET summary='Durante 10 años he navegado las complejas aguas de la ética profesional en salud holística, ayudando a más de 400 profesionales a tomar decisiones que honren tanto a sus clientes como a sus valores más profundos. La ética no se trata de reglas memorables—se trata de cultivar juicio moral que puede navegar ambigüedad, equilibrar intereses competitivos y sostener integridad bajo presión. Mi camino comenzó cuando presencié tanto prácticas brillantes y éticas como violaciones dañinas dentro de comunidades holísticas. Dediqué mi carrera a elevar estándares éticos a través de educación rigurosa. Enseño marcos éticos—deontología, consecuencialismo, ética de la virtud, ética del cuidado—pero también casos del mundo real que desafían el pensamiento simplista. En ISEIH, entreno a futuros profesionales en toma de decisiones éticas, límites profesionales, consentimiento informado y práctica centrada en el cliente. Mi misión: asegurar que cada graduado pueda navegar dilemas éticos con sabiduría y compasión.', updated_at=NOW() WHERE id=v_user_id;
    RAISE NOTICE '✅ Alex Martinez updated';
  END IF;

  -- Angela Roberts - Clinical Supervisor
  SELECT id INTO v_user_id FROM auth.users WHERE email='angela.roberts@iseih.edu';
  IF v_user_id IS NOT NULL THEN
    UPDATE profiles SET summary='Supervisar no es solo revisar casos—es cultivar profesionales reflexivos, éticos y efectivos que puedan sostener el trabajo terapéutico complejo sin agotarse. Durante 15 años, he supervisado a más de 200 terapeutas en formación, creando espacios donde pueden procesar casos desafiantes, explorar puntos ciegos y desarrollar su voz terapéutica única. Mi enfoque de supervisión integra competencia clínica, reflexión personal y consideraciones sistémicas. Ayudo a supervisados a ver patrones en su trabajo, reconocer contratransferencia, desarrollar intervenciones efectivas y mantener límites éticos. Pero también honro la relacionalidad de la supervisión—no como jerarquía sino como alianza colaborativa para el crecimiento. En ISEIH, entreno tanto a futuros terapeutas como a supervisores clínicos, enseñando el arte de supervisión que es desafiante pero compasiva, rigurosa pero relacionalmente sintonizada. He visto cómo la buena supervisión previene agotamiento, aumenta efectividad y profundiza compromiso con este trabajo sagrado.', updated_at=NOW() WHERE id=v_user_id;
    RAISE NOTICE '✅ Angela Roberts updated';
  END IF;

  -- Brian Cooper - Social Justice Advocate
  SELECT id INTO v_user_id FROM auth.users WHERE email='brian.cooper@iseih.edu';
  IF v_user_id IS NOT NULL THEN
    UPDATE profiles SET summary='La sanación no puede separarse de la justicia. Durante 11 años, he trabajado en la intersección de salud holística y equidad social, ayudando a profesionales a reconocer cómo el trauma, la opresión y la marginación dan forma a las experiencias de sanación. He entrenado a más de 350 profesionales en prácticas culturalmente humildes y sensibles al trauma que centran la equidad. Mi trabajo comenzó en comunidades desatendidas donde vi claramente cómo los determinantes sociales de la salud—pobreza, racismo, falta de acceso—crean disparidades masivas en el bienestar. Dediqué mi carrera a ayudar a profesionales holísticos a comprender estas realidades y adaptar sus prácticas en consecuencia. En ISEIH, enseño competencia cultural, práctica informada por trauma y defensa de la justicia social, desafiando a estudiantes a examinar sus propios privilegios y comprometerse con el cambio sistémico. Mi misión: asegurar que la sanación holística sea accesible, relevante y transformadora para todas las comunidades, especialmente las marginadas.', updated_at=NOW() WHERE id=v_user_id;
    RAISE NOTICE '✅ Brian Cooper updated';
  END IF;

  -- Catherine Adams - Wellness Program Designer
  SELECT id INTO v_user_id FROM auth.users WHERE email='catherine.adams@iseih.edu';
  IF v_user_id IS NOT NULL THEN
    UPDATE profiles SET summary='Especialista en diseño de programas de bienestar con 12 años transformando visiones en sistemas sostenibles y escalables. He diseñado más de 50 programas de bienestar—desde retiros de fin de semana hasta iniciativas corporativas de un año—que realmente funcionan: bien estructurados, atractivos para los participantes y orientados a resultados medibles. El bienestar efectivo no sucede por accidente. Requiere planificación cuidadosa, comprensión de teoría del cambio de comportamiento y sistemas que apoyen el crecimiento sostenido. Mi trabajo ayuda a profesionales a pasar de talleres únicos a programas integrales que crean transformación duradera. En ISEIH, enseño diseño de programas: cómo evaluar necesidades, establecer objetivos, crear currículos, facilitar experiencias de aprendizaje y medir resultados. Mis estudiantes aprenden tanto el arte de crear contenido significativo como la ciencia de estructurar programas efectivos. Mi pasión: ayudar a profesionales a amplificar su impacto a través de programas que cambian vidas a escala.', updated_at=NOW() WHERE id=v_user_id;
    RAISE NOTICE '✅ Catherine Adams updated';
  END IF;

  -- Christopher Barnes - Nutrition Science Educator
  SELECT id INTO v_user_id FROM auth.users WHERE email='christopher.barnes@iseih.edu';
  IF v_user_id IS NOT NULL THEN
    UPDATE profiles SET summary='¿Qué hace que la nutrición sea tan confusa? Las tendencias contradictorias, la ciencia emergente y las afirmaciones de marketing que oscurecen la verdad. Durante 14 años, he ayudado a más de 500 profesionales y clientes a navegar el caótico panorama nutricional con ciencia sólida, pensamiento crítico y consejos prácticos basados en evidencia. Mi enfoque equilibra rigor científico con sabiduría nutricional tradicional. Estudio investigación emergente pero también honro prácticas alimentarias ancestrales que han sostenido la salud humana durante milenios. Enseño a estudiantes a leer estudios críticamente, reconocer sesgos y traducir evidencia compleja en recomendaciones accionables. En ISEIH, entreno a futuros consejeros de nutrición en bioquímica, fisiología digestiva, ciencia de nutrientes y coaching nutricional basado en evidencia. Pero también enseño humildad—la ciencia nutricional es joven, compleja y en constante evolución. Mi misión: equipar a profesionales con herramientas para separar hechos de moda y empoderar a clientes con conocimiento nutricional sólido.', updated_at=NOW() WHERE id=v_user_id;
    RAISE NOTICE '✅ Christopher Barnes updated';
  END IF;

  -- Diana Russell - Movement Therapy Specialist
  SELECT id INTO v_user_id FROM auth.users WHERE email='diana.russell@iseih.edu';
  IF v_user_id IS NOT NULL THEN
    UPDATE profiles SET summary='El cuerpo habla cuando las palabras fallan. Durante 16 años, he usado terapia de movimiento somático para ayudar a más de 400 clientes a liberar trauma almacenado, reconectar con sensaciones corporales y restaurar vitalidad a través del movimiento consciente. Mi práctica integra Auténtico Movimiento, Educación Somática y principios de trauma informado para crear sanación profunda y duradera. Mi camino comenzó cuando presencié cómo el movimiento podía acceder a recuerdos y emociones que la terapia de conversación no podía tocar. Me entrené intensivamente en múltiples modalidades somáticas, aprendiendo cómo el cuerpo almacena experiencia y cómo el movimiento consciente puede reorganizar patrones neuronales. En ISEIH, enseño terapia de movimiento: cómo facilitar exploración segura de movimiento, trabajar con memoria corporal, integrar práctica somática con psicoterapia y crear espacios donde el cuerpo puede contar su historia. Mi pasión: hacer accesible la sanación somática para terapeutas y clientes por igual.', updated_at=NOW() WHERE id=v_user_id;
    RAISE NOTICE '✅ Diana Russell updated';
  END IF;

  -- Elizabeth Morgan - Mindfulness-Based Therapy
  SELECT id INTO v_user_id FROM auth.users WHERE email='elizabeth.morgan@iseih.edu';
  IF v_user_id IS NOT NULL THEN
    UPDATE profiles SET summary='Terapeuta especializada en intervenciones basadas en mindfulness con 14 años ayudando a clientes a transformar su relación con pensamientos, emociones y experiencia. He entrenado a más de 300 terapeutas en protocolos basados en evidencia—MBSR, MBCT, ACT—que integran prácticas contemplativas con psicoterapia moderna. El mindfulness no es solo relajación—es una herramienta terapéutica poderosa respaldada por décadas de investigación neurocientífica. Mi trabajo ayuda a terapeutas a entender tanto la ciencia como la práctica: cómo el mindfulness regula emocionalmente, reduce reactividad y crea espacio para elecciones conscientes. En ISEIH, enseño terapia basada en mindfulness: teoría, protocolos, práctica personal y consideraciones éticas. Mis estudiantes aprenden a facilitar prácticas mindfulness clínicamente, adaptarlas para poblaciones diversas y integrarlas en sus marcos terapéuticos existentes. Pero también enfatizo la práctica personal—no puedes enseñar mindfulness sin vivir mindfulness. Mi misión: elevar intervenciones basadas en mindfulness como estándar de atención en salud mental.', updated_at=NOW() WHERE id=v_user_id;
    RAISE NOTICE '✅ Elizabeth Morgan updated';
  END IF;

  -- Janet Lee - Herbal Medicine Educator
  SELECT id INTO v_user_id FROM auth.users WHERE email='janet.lee@iseih.edu';
  IF v_user_id IS NOT NULL THEN
    UPDATE profiles SET summary='Durante 17 años he ayudado a profesionales a redescubrir el poder medicinal de las plantas—no como alternativa romántica sino como medicina seria, efectiva y basada en evidencia. He entrenado a más de 500 herbalistas en farmacología botánica, preparación de remedios y prescripción clínica que honra tanto la sabiduría tradicional como la investigación moderna. Mi camino comenzó en frustración con la medicina convencional que trataba síntomas sin abordar causas raíz. Descubrí la medicina herbal y experimenté sanación profunda que los farmacéuticos sintéticos no habían logrado. Estudié intensivamente tanto tradiciones herbales—Medicina Tradicional China, Ayurveda, herbalismo occidental—como fitoquímica moderna, aprendiendo cómo los compuestos vegetales interactúan con la fisiología humana. En ISEIH, enseño materia médica herbal, farmacología botánica, formulación de remedios y práctica clínica basada en evidencia. Mis estudiantes aprenden a prescribir plantas de manera segura, efectiva y con respeto tanto por la tradición como por la ciencia. Mi misión: restaurar la medicina herbal como pilar respetado de la atención médica.', updated_at=NOW() WHERE id=v_user_id;
    RAISE NOTICE '✅ Janet Lee updated';
  END IF;

  -- Jessica Porter - Grief & Loss Counseling
  SELECT id INTO v_user_id FROM auth.users WHERE email='jessica.porter@iseih.edu';
  IF v_user_id IS NOT NULL THEN
    UPDATE profiles SET summary='El duelo no se "supera"—se integra. Durante 13 años, he acompañado a más de 300 clientes a través de las complejidades del duelo, la pérdida y la transición, creando espacios sagrados donde el dolor puede ser sostenido sin ser arreglado. Mi práctica honra que el duelo es tan único como la relación perdida—no hay línea de tiempo, no hay etapas ordenadas, solo el desorden hermoso y desgarrador de amar y perder. Mi trabajo comenzó con mi propia pérdida devastadora. Cuando la terapia de duelo convencional se sintió superficial e insensible, busqué enfoques que honraran la complejidad del duelo. Estudié terapia centrada en el significado, duelo complicado y tradiciones interculturales de duelo, aprendiendo cómo las culturas sostienen la pérdida de manera diferente. En ISEIH, entreno a consejeros en apoyo al duelo: cómo estar presente con el dolor, facilitar integración del significado, reconocer duelo complicado y honrar diversidad cultural en las prácticas de duelo. Mi misión: crear una cultura que honre el duelo como proceso sagrado, no como problema a resolver.', updated_at=NOW() WHERE id=v_user_id;
    RAISE NOTICE '✅ Jessica Porter updated';
  END IF;

  -- Karen White - Energy Psychology
  SELECT id INTO v_user_id FROM auth.users WHERE email='karen.white@iseih.edu';
  IF v_user_id IS NOT NULL THEN
    UPDATE profiles SET summary='Especialista en psicología energética con 12 años integrando técnicas mente-cuerpo innovadoras—EFT, EMDR, Psicología Energética—en práctica terapéutica efectiva. He ayudado a más de 400 clientes a liberar trauma, ansiedad y patrones emocionales arraigados a través de intervenciones que trabajan directamente con el sistema nervioso. La psicología energética puede parecer poco convencional, pero la investigación la respalda. Mi trabajo ayuda a terapeutas a entender tanto la ciencia—cómo estimular puntos de acupresión regula la amígdala, cómo el procesamiento bilateral reorganiza la memoria traumática—como la aplicación práctica. En ISEIH, enseño psicología energética: teoría de trauma, protocolos basados en evidencia, consideraciones clínicas y práctica ética. Mis estudiantes aprenden a usar estas herramientas poderosas con integridad, comprensión de cuándo son apropiadas y cuándo se necesitan enfoques convencionales. No presento la psicología energética como panacea sino como conjunto valioso de herramientas en el kit terapéutico. Mi misión: llevar modalidades mente-cuerpo al mainstream terapéutico.', updated_at=NOW() WHERE id=v_user_id;
    RAISE NOTICE '✅ Karen White updated';
  END IF;

  -- Linda Zhang - Cross-Cultural Communication
  SELECT id INTO v_user_id FROM auth.users WHERE email='linda.zhang@iseih.edu';
  IF v_user_id IS NOT NULL THEN
    UPDATE profiles SET summary='¿Cómo navegamos diferencias culturales en sanación cuando conceptos básicos—mente, cuerpo, salud, enfermedad—significan cosas fundamentalmente diferentes en culturas diversas? Durante 11 años, he ayudado a más de 350 profesionales a desarrollar competencia intercultural que va más allá de la sensibilidad superficial hacia comprensión genuina y práctica culturalmente humilde. Mi camino comenzó navegando mundos culturales—criada entre culturas china y estadounidense, presenciando cómo cada una entendía salud de manera diferente. Estudié antropología médica, comunicación intercultural y práctica culturalmente humilde, aprendiendo cómo los sistemas de creencias culturales dan forma a experiencias de sanación. En ISEIH, enseño comunicación intercultural: cómo reconocer diferencias de valores, navegar barreras idiomáticas, adaptar prácticas para diversas poblaciones y trabajar con intérpretes y mediadores culturales. Pero sobre todo, enseño humildad—reconociendo que nunca "dominamos" otra cultura, solo nos volvemos más hábiles en aprender y adaptarnos. Mi misión: hacer la sanación holística verdaderamente accesible a través de fronteras culturales.', updated_at=NOW() WHERE id=v_user_id;
    RAISE NOTICE '✅ Linda Zhang updated';
  END IF;

  -- Maria Gonzalez - Family Systems Therapy
  SELECT id INTO v_user_id FROM auth.users WHERE email='maria.gonzalez@iseih.edu';
  IF v_user_id IS NOT NULL THEN
    UPDATE profiles SET summary='Las familias son sistemas vivos—cuando un miembro sufre, todo el sistema se ajusta. Durante 15 años, he trabajado con más de 200 familias, ayudándolas a reconocer patrones relacionales, sanar heridas generacionales y crear dinámicas más saludables. Mi práctica integra terapia de sistemas familiares, teoría del apego y enfoques transgeneracionales para crear cambio duradero. Mi trabajo comenzó cuando vi cómo la terapia individual a menudo mejoraba síntomas pero no transformaba las dinámicas familiares que los mantenían. Estudié intensivamente teoría de sistemas familiares—Bowen, estructural, estratégica, narrativa—aprendiendo cómo los patrones se transmiten a través de generaciones y cómo las intervenciones sistémicas pueden interrumpir ciclos disfuncionales. En ISEIH, entreno a terapeutas en práctica de sistemas familiares: cómo conceptualizar familias sistémicamente, facilitar sesiones familiares, trabajar con jerarquías y límites, y abordar trauma transgeneracional. Mis estudiantes aprenden a ver más allá de los individuos hacia los patrones que conectan. Mi misión: sanar familias, no solo individuos.', updated_at=NOW() WHERE id=v_user_id;
    RAISE NOTICE '✅ Maria Gonzalez updated';
  END IF;

  -- Mark Davidson - Mind-Body Medicine
  SELECT id INTO v_user_id FROM auth.users WHERE email='mark.davidson@iseih.edu';
  IF v_user_id IS NOT NULL THEN
    UPDATE profiles SET summary='Durante 16 años he explorado la frontera donde mente y cuerpo se encuentran, ayudando a más de 450 clientes y profesionales a comprender cómo pensamientos, emociones y creencias dan forma literalmente a la salud física. Mi práctica integra psiconeuroinmunología, medicina mente-cuerpo y enfoques somáticos para crear sanación integral. La división mente-cuerpo es artificial. Décadas de investigación neurocientífica confirman lo que las tradiciones de sanación antiguas siempre supieron: la mente influye en la salud física a través de vías neurales, hormonales e inmunes. Mi trabajo ayuda a profesionales a entender tanto la ciencia como la práctica de intervenciones mente-cuerpo. En ISEIH, enseño medicina mente-cuerpo: psiconeuroinmunología, efectos del estrés en salud, técnicas de regulación del sistema nervioso y protocolos basados en evidencia como imágenes guiadas, relajación progresiva y biorretroalimentación. Mis estudiantes aprenden a trabajar con la unidad mente-cuerpo, no como concepto abstracto sino como realidad clínica tangible. Mi misión: integrar medicina mente-cuerpo en el mainstream de atención médica.', updated_at=NOW() WHERE id=v_user_id;
    RAISE NOTICE '✅ Mark Davidson updated';
  END IF;

  -- Michelle Chang - Positive Psychology
  SELECT id INTO v_user_id FROM auth.users WHERE email='michelle.chang@iseih.edu';
  IF v_user_id IS NOT NULL THEN
    UPDATE profiles SET summary='Especialista en psicología positiva con 10 años ayudando a personas y organizaciones a prosperar—no solo sobrevivir. He trabajado con más de 300 clientes y entrenado a 150+ profesionales en intervenciones basadas en fortalezas que cultivan bienestar, resiliencia y florecimiento humano. La psicología durante demasiado tiempo se enfocó solo en patología. La psicología positiva pregunta: ¿qué hace que la vida valga la pena? ¿Cómo cultivamos significado, compromiso, relaciones positivas y logro? Mi trabajo ayuda a profesionales a integrar intervenciones de psicología positiva—identificación de fortalezas, cultivo de gratitud, construcción de resiliencia, descubrimiento de propósito—en su práctica terapéutica. En ISEIH, enseño psicología positiva: teoría del bienestar, ciencia de fortalezas de carácter, intervenciones basadas en evidencia y coaching positivo. Pero también enseño equilibrio—la psicología positiva no ignora el sufrimiento sino que construye recursos para navegarlo. Mis estudiantes aprenden a ayudar a clientes a prosperar, no solo a funcionar. Mi misión: hacer de la psicología positiva parte fundamental de la práctica terapéutica.', updated_at=NOW() WHERE id=v_user_id;
    RAISE NOTICE '✅ Michelle Chang updated';
  END IF;

  RAISE NOTICE '🎉 All profile summaries diversified successfully!';
END $$;
