// Genera supabase/migrations/<argv[2]> (p. ej. 20261104c_legal_v21.sql) desde lib/legalDrafts.ts:
// los textos de LEGAL_DRAFT_VERSION sin la primera línea «BORRADOR…». Uso: npx tsx scripts/gen-legal-sql.mts <fichero.sql>
import { writeFileSync } from 'node:fs';
import { LEGAL_DRAFTS, LEGAL_DRAFT_VERSION } from '../lib/legalDrafts.ts';

const q = (s: string) => `'${s.replace(/'/g, "''")}'`;
const filas: string[] = [];
for (const [tipo, porIdioma] of Object.entries(LEGAL_DRAFTS)) {
  for (const [idioma, d] of Object.entries(porIdioma)) {
    const lineas = d.texto.split('\n');
    if (!/^(BORRADOR|DRAFT)\b/.test(lineas[0])) throw new Error(`${tipo}/${idioma}: no empieza por BORRADOR`);
    const texto = lineas.slice(1).join('\n');
    if (/iseie|\[(por confirmar|to be confirmed)/i.test(texto)) throw new Error(`${tipo}/${idioma}: marcas o ISEIE`);
    filas.push(`  (${q(tipo)}, ${q(idioma)}, ${q(d.titulo)}, ${q(texto)})`);
  }
}

const sql = `-- =============================================================================
-- ${process.argv[2] ?? "legal_vX.sql"} (generado con scripts/gen-legal-sql.mts)
-- Publica la versión ${LEGAL_DRAFT_VERSION} completa de privacidad, condiciones de candidato y
-- de empleador y condiciones de publicación (ES y EN), que sustituye a la versión en vigor.
-- Texto: lib/legalDrafts.ts sin la línea «BORRADOR…».
--
-- Entra en vigor al momento (publicación urgente del servicio) y NO encola correo
-- de aviso: la app pide a cada usuario aceptar la versión nueva al volver a entrar.
-- Hereda de la versión en vigor audiencia, obligación de aceptar, casillas y la
-- marca «borrador». Reaplicable (ON CONFLICT DO NOTHING). Aborta si queda ISEIE.
--
-- Comprobación:
--   SELECT tipo, idioma, version, length(texto) FROM public.documentos_legales
--    WHERE public.documento_legal_vigente(id) ORDER BY 1, 2;
-- =============================================================================
BEGIN;

SELECT set_config('request.jwt.claims', '{"role":"service_role"}', true);
SELECT set_config('request.jwt.claim.role', 'service_role', true);
SELECT set_config('app.legal_urgente', 'on', true);

INSERT INTO public.documentos_legales
  (tipo, version, idioma, titulo, texto, audiencia, requiere_aceptacion, casillas_obligatorias, borrador, vigente_desde)
SELECT n.tipo, ${q(LEGAL_DRAFT_VERSION)}, n.idioma, n.titulo, n.texto,
       v.audiencia, v.requiere_aceptacion, v.casillas_obligatorias, v.borrador, now()
FROM (VALUES
${filas.join(',\n')}
) AS n(tipo, idioma, titulo, texto)
JOIN public.documentos_legales v
  ON v.tipo = n.tipo AND v.idioma = n.idioma AND public.documento_legal_vigente(v.id)
ON CONFLICT (tipo, version, idioma) DO NOTHING;

DO $$
DECLARE n int;
BEGIN
  SELECT count(*) INTO n FROM public.documentos_legales d
   WHERE public.documento_legal_vigente(d.id) AND d.texto ILIKE '%iseie%';
  IF n > 0 THEN
    RAISE EXCEPTION 'ABORTADO: quedan % textos en vigor que nombran a ISEIE', n;
  END IF;
END $$;

SELECT set_config('app.legal_urgente', 'off', true);

COMMIT;

SELECT tipo, idioma, version, length(texto) AS caracteres
  FROM public.documentos_legales
 WHERE public.documento_legal_vigente(id)
 ORDER BY tipo, idioma;
`;
writeFileSync(new URL('../supabase/migrations/' + (process.argv[2] ?? 'legal_vX.sql'), import.meta.url), sql);
console.log(`${filas.length} textos → supabase/migrations/${process.argv[2]}`);
