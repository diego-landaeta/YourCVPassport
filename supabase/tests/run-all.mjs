// Ejecuta TODAS las pruebas SQL de la bolsa de empleo (fase1-6 e integrado*) sobre PGlite, una tras otra,
// y sale con código 0 solo si todas pasan.
//
//   npm run test:sql
//   node supabase/tests/run-all.mjs [filtro]      (filtro opcional: solo los ficheros cuyo nombre lo contiene)
//
// Requiere `@electric-sql/pglite` instalado (devDependency; ver README.md). No toca ninguna base real.
import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const filter = process.argv[2] || '';

try {
  await import('@electric-sql/pglite');
} catch {
  console.error('Falta @electric-sql/pglite. Instálalo con `npm install` (está en devDependencies) y vuelve a ejecutar.');
  process.exit(2);
}

const files = readdirSync(here)
  .filter((f) => /^(fase\d+|integrado\d*)\.test\.mjs$/.test(f) && f.includes(filter))
  .sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));

if (files.length === 0) {
  console.error('No hay pruebas que ejecutar' + (filter ? ` con el filtro «${filter}»` : '') + '.');
  process.exit(2);
}

const results = [];
for (const f of files) {
  const started = Date.now();
  console.log(`\n=== ${f} ===`);
  const r = spawnSync(process.execPath, [path.join(here, f)], { cwd: here, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const out = `${r.stdout || ''}${r.stderr || ''}`;
  // Se muestran solo las líneas relevantes (fallos y resumen) para que la salida sea legible.
  const relevant = out.split('\n').filter((l) => /FALLO|FAIL|ERROR|RESULTADO|PARCIAL|AVISO/.test(l));
  for (const l of relevant.slice(-40)) console.log('  ' + l.trim());
  const secs = ((Date.now() - started) / 1000).toFixed(1);
  results.push({ f, code: r.status ?? 1, secs });
  console.log(`  -> ${r.status === 0 ? 'OK' : 'FALLA (código ' + r.status + ')'} en ${secs}s`);
}

console.log('\nResumen');
for (const r of results) console.log(`  ${r.code === 0 ? 'OK    ' : 'FALLA '} ${r.f} (${r.secs}s)`);
const failed = results.filter((r) => r.code !== 0);
console.log(failed.length ? `\n${failed.length} de ${results.length} pruebas fallan.` : `\nTodas las pruebas pasan (${results.length}).`);
process.exit(failed.length ? 1 : 0);
