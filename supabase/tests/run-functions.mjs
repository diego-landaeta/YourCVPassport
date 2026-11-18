// Ejecuta las pruebas de Node de las Edge Functions de la bolsa de empleo (supabase/functions/**/*.test.mjs)
// y sale con código 0 solo si todas pasan. No necesitan red ni claves: usan dobles de Supabase y de fetch.
//
//   npm run test:functions
//   node supabase/tests/run-functions.mjs [filtro]
//
// Node 22.6+ (o 24) para leer los .ts directamente (type stripping). `esbuild` (viene con vite) lo usa
// supabase/functions/_shared/testHarness.mjs para empaquetar el handler de cada función.
import { spawnSync } from 'node:child_process';
import { readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'functions');
const filter = process.argv[2] || '';

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules') continue;
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (/\.test\.mjs$/.test(name)) out.push(full);
  }
  return out;
}

const files = walk(root)
  .filter((f) => f.includes(filter))
  .sort();

if (files.length === 0) {
  console.error('No hay pruebas de funciones' + (filter ? ` con el filtro «${filter}»` : '') + '.');
  process.exit(2);
}

const results = [];
for (const file of files) {
  const rel = path.relative(root, file).replace(/\\/g, '/');
  const started = Date.now();
  console.log(`\n=== ${rel} ===`);
  const r = spawnSync(process.execPath, [file], { cwd: path.resolve(root, '..', '..'), encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const out = `${r.stdout || ''}${r.stderr || ''}`;
  const lines = out.split('\n');
  const bad = lines.filter((l) => /^(FAIL|FALLO|Error|AssertionError)|ERR_/.test(l.trim()));
  const tail = lines.filter((l) => l.trim()).slice(-3);
  for (const l of (bad.length ? bad.slice(0, 20) : tail)) console.log('  ' + l.trim());
  const secs = ((Date.now() - started) / 1000).toFixed(1);
  results.push({ rel, code: r.status ?? 1, secs });
  console.log(`  -> ${r.status === 0 ? 'OK' : 'FALLA (código ' + r.status + ')'} en ${secs}s`);
}

console.log('\nResumen');
for (const r of results) console.log(`  ${r.code === 0 ? 'OK    ' : 'FALLA '} ${r.rel} (${r.secs}s)`);
const failed = results.filter((r) => r.code !== 0);
console.log(failed.length ? `\n${failed.length} de ${results.length} ficheros fallan.` : `\nTodas las pruebas pasan (${results.length} ficheros).`);
process.exit(failed.length ? 1 : 0);
