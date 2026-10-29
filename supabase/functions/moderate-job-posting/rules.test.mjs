// Pruebas de rules.ts (moderación de ofertas). Sin dependencias:
//   node supabase/functions/moderate-job-posting/rules.test.mjs
// (Node >= 22.18 / 24 carga .ts directamente; si no: node --experimental-strip-types ...)
import assert from 'node:assert/strict'
import { reviewJobText, freeEmailsIn } from './rules.ts'

let passed = 0
function t(name, fn) {
  try {
    fn()
    passed++
    console.log(`ok   ${name}`)
  } catch (e) {
    console.log(`FAIL ${name}\n     ${e.message}`)
    process.exitCode = 1
  }
}
const codes = (job) => reviewJobText(job).map((f) => f.code)

// ---------------------------------------------------------------------------
// Ofertas NORMALES: no se marcan
// ---------------------------------------------------------------------------
const normales = {
  'con web de la empresa y correo corporativo en el texto': {
    title: 'Desarrollador/a backend',
    description:
      '<p>En Acme Tech (https://www.acme.es) buscamos una persona para nuestro equipo de plataforma. Trabajarás con Node y PostgreSQL. Más información en https://www.acme.es/empleo.</p><p>Envía tu CV a rrhh@acme.es indicando la referencia BE-2026.</p>',
    requirements: ['3 años de experiencia', 'Inglés B2'],
    benefits: ['Seguro médico', 'Horario flexible 9:00-18:00'],
    application_instructions: 'Rellena el formulario o escribe a talento@acme.es',
  },
  'con application_url y application_email gratuitos en sus campos propios': {
    title: 'Camarero/a de sala',
    description: 'Restaurante en el centro de Valencia. Turnos de tarde. Salario 1.300 - 1.500 € brutos al mes.',
    application_url: 'https://www.restaurantemar.es/trabaja-con-nosotros',
    application_email: 'restaurantemar@gmail.com',
  },
  'application_email gratuito repetido literalmente en las instrucciones': {
    title: 'Dependiente/a',
    description: 'Tienda de ropa en Sevilla.',
    application_email: 'tienda.sevilla@hotmail.com',
    application_instructions: 'Envía tu CV a tienda.sevilla@hotmail.com',
  },
  'atención al cliente por WhatsApp (trabajo, no contacto)': {
    title: 'Agente de atención al cliente',
    description: 'Atenderás consultas de clientes por WhatsApp, teléfono y correo. Servicio 24/7 con turnos rotativos. Conocimientos de WhatsApp Business.',
  },
  'salarios con puntos de millar y rangos': {
    title: 'Responsable de compras',
    description: 'Buscamos una persona responsable de compras para coordinar proveedores y negociar contratos con el equipo directivo. Salario anual 35.000 - 45.000 EUR. En COP: 100.000.000 anuales. Rango 30000-40000. Incorporación 15/11/2026. CP 28013.',
  },
  'fechas, referencias y años': {
    title: 'Técnico/a de laboratorio',
    description: 'Ref. 2026-0153. Contrato de 12 meses desde 01-12-2026. Experiencia 2-3 años en laboratorio acreditado ISO 17025.',
  },
  'dirección y horario': {
    title: 'Profesor/a de inglés',
    description: 'Academia en Calle Mayor 12, 28013 Madrid. Lunes a viernes de 16 a 21 h. Se valorará el título CELTA.',
  },
  'entrevista por Skype o Teams': {
    title: 'Analista financiero',
    description: 'El proceso incluye una entrevista por Skype o Microsoft Teams y una prueba técnica.',
  },
  'teléfono de la empresa sin número': {
    title: 'Recepcionista',
    description: 'Atención telefónica y presencial. Teléfono de contacto disponible en nuestra web.',
  },
  'inglés': {
    title: 'Customer Success Manager',
    description: 'You will manage key accounts. Apply through our careers page at https://careers.globex.com or email jobs@globex.com. Salary 60,000 - 75,000 USD.',
  },
}
for (const [name, job] of Object.entries(normales)) {
  t(`NORMAL no marcada: ${name}`, () => assert.deepEqual(codes(job), []))
}

// ---------------------------------------------------------------------------
// Estafas típicas: SÍ se marcan
// ---------------------------------------------------------------------------
const estafas = [
  ['teléfono con prefijo', { title: 'Trabajo desde casa', description: 'Escríbenos al +34 612 345 678 y empieza hoy.' }, 'CONTACTO_EXTERNO'],
  ['teléfono con espacios', { title: 'Administrativo', description: 'Llama al 612 345 678 para más información.' }, 'CONTACTO_EXTERNO'],
  ['teléfono corrido', { title: 'Administrativo', description: 'Para postular escribe al 612345678.' }, 'CONTACTO_EXTERNO'],
  ['teléfono mexicano', { title: 'Vendedor', description: 'Informes al (55) 1234-5678.' }, 'CONTACTO_EXTERNO'],
  ['«tel:»', { title: 'Vendedor', description: 'Tel: 91 123 45 67' }, 'CONTACTO_EXTERNO'],
  ['enlace acortado', { title: 'Gana en casa', description: 'Más info aquí: bit.ly/3AbCdEf' }, 'CONTACTO_EXTERNO'],
  ['acortador en application_url', { title: 'Empleo', description: 'Buena oferta.', application_url: 'https://tinyurl.com/xyz123' }, 'CONTACTO_EXTERNO'],
  ['WhatsApp para contactar', { title: 'Asistente virtual', description: 'Contáctanos por WhatsApp y te respondemos al instante.' }, 'CONTACTO_EXTERNO'],
  ['Telegram con usuario', { title: 'Asistente', description: 'Escríbenos a Telegram @trabajo_facil_ya' }, 'CONTACTO_EXTERNO'],
  ['wa.me', { title: 'Oferta', description: 'Pulsa wa.me/34612345678' }, 'CONTACTO_EXTERNO'],
  ['correo gratuito en el texto', { title: 'Asistente', description: 'Envía tu CV a trabajofacil2026@gmail.com' }, 'CONTACTO_EXTERNO'],
  ['correo hotmail de otro país', { title: 'Asistente', description: 'Escribe a reclutamiento@hotmail.com.mx' }, 'CONTACTO_EXTERNO'],
  ['contacto por privado', { title: 'Asistente', description: 'Interesados, contáctame por privado.' }, 'CONTACTO_EXTERNO'],
  ['contacto fuera de la plataforma', { title: 'Asistente', description: 'Escríbeme fuera de la plataforma para agilizar.' }, 'CONTACTO_EXTERNO'],
  ['dinero por adelantado', { title: 'Operario', description: 'Pago inicial de 50 euros para el kit de bienvenida.' }, 'DINERO'],
  ['curso de pago', { title: 'Teletrabajo', description: 'Incluye curso de pago obligatorio previo.' }, 'DINERO'],
  ['multinivel', { title: 'Oportunidad', description: 'Negocio multinivel con red de distribuidores.' }, 'MULTINIVEL'],
  ['solo mujeres', { title: 'Recepcionista', description: 'Solo mujeres, buena presencia.' }, 'DISCRIMINACION'],
  ['promesa exagerada', { title: 'Negocio', description: 'Ingresos garantizados, dinero fácil y rápido.' }, 'PROMESA_EXAGERADA'],
]
for (const [name, job, code] of estafas) {
  t(`ESTAFA marcada (${code}): ${name}`, () => assert.ok(codes(job).includes(code), `códigos: ${codes(job).join(',') || '(ninguno)'}`))
}

t('el hallazgo trae un fragmento y un código estable', () => {
  const f = reviewJobText({ title: 'X', description: 'Escríbenos al +34 612 345 678.' }).find((x) => x.code === 'CONTACTO_EXTERNO')
  assert.ok(f && f.excerpt && f.message)
})
t('freeEmailsIn: gratuitos sí, corporativos no', () => {
  assert.equal(freeEmailsIn('a@gmail.com b@acme.es c@yahoo.com.mx d@outlook.es').length, 3)
  assert.equal(freeEmailsIn('rrhh@acme.es info@mail.acme.com').length, 0)
})

console.log(`\n${passed} pruebas correctas${process.exitCode ? ' (HAY FALLOS)' : ''}`)
