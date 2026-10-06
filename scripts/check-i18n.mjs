#!/usr/bin/env node
/**
 * Comprueba que translations/es.ts y translations/en.ts tienen exactamente la
 * misma estructura de claves (incluidos los elementos de los arrays).
 *
 * No ejecuta los ficheros: los analiza con el compilador de TypeScript, asi que
 * no depende de React ni de los tipos del proyecto.
 *
 * Ademas exige que TEMPLATES tenga el mismo `id` e `imageUrl` en cada posicion,
 * para que la biblioteca muestre la misma imagen y orden en ambos idiomas.
 *
 * Uso: node scripts/check-i18n.mjs   (sale con codigo 1 si hay divergencias)
 */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const FILES = {
  es: resolve(ROOT, 'translations/es.ts'),
  en: resolve(ROOT, 'translations/en.ts'),
};

/** Quita envoltorios que no cambian la forma del valor (`as`, `satisfies`, parentesis). */
function unwrap(node) {
  while (
    ts.isAsExpression(node) ||
    ts.isParenthesizedExpression(node) ||
    ts.isTypeAssertionExpression(node) ||
    (ts.isSatisfiesExpression && ts.isSatisfiesExpression(node))
  ) {
    node = node.expression;
  }
  return node;
}

function propName(name, sf) {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) return name.text;
  return name.getText(sf);
}

function leafKind(node) {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node) || ts.isTemplateExpression(node)) return 'string';
  if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) return 'function';
  if (ts.isNumericLiteral(node)) return 'number';
  if (node.kind === ts.SyntaxKind.TrueKeyword || node.kind === ts.SyntaxKind.FalseKeyword) return 'boolean';
  return 'other';
}

// Rutas cuyo valor debe ser igual en ambos idiomas (los `id` de NAV_LINKS son slugs traducidos).
const INVARIANT_PATH = /^TEMPLATES\[\d+\]\.(id|imageUrl)$/;

/**
 * Recorre el objeto `translations` y devuelve { keys: Map<ruta, tipo>, invariants: Map<ruta, texto> }.
 */
export function collectKeys(file) {
  const sf = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  let root = null;
  sf.forEachChild(stmt => {
    if (!ts.isVariableStatement(stmt)) return;
    for (const decl of stmt.declarationList.declarations) {
      if (ts.isIdentifier(decl.name) && decl.name.text === 'translations' && decl.initializer) root = unwrap(decl.initializer);
    }
  });
  if (!root || !ts.isObjectLiteralExpression(root)) throw new Error(`No se encontro "export const translations = {...}" en ${file}`);

  const keys = new Map();
  const invariants = new Map();
  const walk = (node, path) => {
    node = unwrap(node);
    if (ts.isObjectLiteralExpression(node)) {
      if (path) keys.set(path, 'object');
      for (const prop of node.properties) {
        if (ts.isSpreadAssignment(prop)) {
          keys.set(`${path}...${prop.expression.getText(sf)}`, 'spread');
          continue;
        }
        const name = propName(prop.name, sf);
        const child = path ? `${path}.${name}` : name;
        if (ts.isPropertyAssignment(prop)) walk(prop.initializer, child);
        else if (ts.isMethodDeclaration(prop)) keys.set(child, 'function');
        else keys.set(child, 'other');
      }
    } else if (ts.isArrayLiteralExpression(node)) {
      keys.set(path, `array(${node.elements.length})`);
      node.elements.forEach((el, i) => walk(el, `${path}[${i}]`));
    } else {
      keys.set(path, leafKind(node));
      if (INVARIANT_PATH.test(path)) invariants.set(path, node.getText(sf));
    }
  };
  walk(root, '');
  return { keys, invariants };
}

function main() {
  const { keys: es, invariants: esInv } = collectKeys(FILES.es);
  const { keys: en, invariants: enInv } = collectKeys(FILES.en);

  const onlyEs = [...es.keys()].filter(k => !en.has(k));
  const onlyEn = [...en.keys()].filter(k => !es.has(k));
  const kindMismatch = [...es.keys()].filter(k => en.has(k) && es.get(k) !== en.get(k));
  const valueMismatch = [...esInv.keys()].filter(k => enInv.has(k) && esInv.get(k) !== enInv.get(k));

  // Si un objeto/array entero falta, basta con informar de su raiz.
  const roots = list => list.filter(k => !list.some(o => o !== k && (k.startsWith(`${o}.`) || k.startsWith(`${o}[`))));

  let failed = false;
  const report = (title, list, fmt = k => k) => {
    if (!list.length) return;
    failed = true;
    console.error(`\n${title} (${list.length}):`);
    for (const k of list) console.error(`  - ${fmt(k)}`);
  };
  report('Claves solo en es.ts', roots(onlyEs));
  report('Claves solo en en.ts', roots(onlyEn));
  report('Claves con distinto tipo/longitud', kindMismatch, k => `${k}: es=${es.get(k)} en=${en.get(k)}`);
  report('TEMPLATES con distinto id/imagen', valueMismatch, k => `${k}: es=${esInv.get(k)} en=${enInv.get(k)}`);

  if (failed) {
    console.error('\ncheck-i18n: las traducciones divergen.');
    process.exit(1);
  }
  console.log(`check-i18n: paridad OK (${es.size} claves en es y en).`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
