// Utilidades SOLO para las pruebas de Node de las Edge Functions (no se despliega).
//
//  - loadEdge(entry, env): empaqueta con esbuild el index.ts de una función sustituyendo
//    `serve` (Deno std), supabase-js y Upstash por dobles, y devuelve el handler. Nada sale
//    a la red: fetch y Deno.env son falsos y las claves son inventadas.
//  - createFakeSupabase(tables, hooks): una «base» en memoria con el constructor de
//    consultas de supabase-js que usan las funciones (select/eq/neq/lt/lte/gte/is/not/in/
//    order/limit/range/update/insert/maybeSingle/single), rpc() y auth.admin.
//
// Uso: ver company-review-ai/sweep.test.mjs y send-outbox/digests.test.mjs.
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { build } from 'esbuild'

const HERE = path.dirname(fileURLToPath(import.meta.url))
export const FUNCTIONS_DIR = path.resolve(HERE, '..')

/** Carga el handler de supabase/functions/<fn>/index.ts. `env` = variables de entorno falsas. */
export async function loadEdge(fn, env = {}) {
  const g = globalThis
  const outDir = mkdtempSync(path.join(tmpdir(), 'edge-test-'))
  const outfile = path.join(outDir, `${fn}.mjs`)
  await build({
    entryPoints: [path.join(FUNCTIONS_DIR, fn, 'index.ts')],
    bundle: true,
    format: 'esm',
    platform: 'node',
    outfile,
    logLevel: 'silent',
    plugins: [{
      name: 'stubs-deno',
      setup(b) {
        b.onResolve({ filter: /^https:\/\/deno\.land\/std@[^/]+\/http\/server\.ts$/ }, () => ({ path: 'serve', namespace: 'stub' }))
        b.onResolve({ filter: /^https:\/\/esm\.sh\/@supabase\/supabase-js/ }, () => ({ path: 'supabase', namespace: 'stub' }))
        b.onResolve({ filter: /^https:\/\/esm\.sh\/@upstash\// }, () => ({ path: 'upstash', namespace: 'stub' }))
        b.onLoad({ filter: /^serve$/, namespace: 'stub' }, () => ({
          contents: 'export function serve(handler) { globalThis.__edgeHandler = handler }',
          loader: 'js',
        }))
        b.onLoad({ filter: /^upstash$/, namespace: 'stub' }, () => ({
          contents: `export class Redis { constructor() {} }
            export class Ratelimit {
              constructor(opts) { this.max = opts.limiter.max }
              static slidingWindow(max) { return { max } }
              async limit() { return { success: true, limit: this.max, remaining: this.max, reset: Date.now() + 60000 } }
            }`,
          loader: 'js',
        }))
        b.onLoad({ filter: /^supabase$/, namespace: 'stub' }, () => ({
          contents: 'export function createClient() { return globalThis.__fakeSupabase }',
          loader: 'js',
        }))
      },
    }],
  })
  g.Deno = { env: { get: (k) => env[k] } }
  delete g.__edgeHandler
  await import(pathToFileURL(outfile).href + `?t=${Date.now()}${Math.random()}`)
  const handler = g.__edgeHandler
  if (typeof handler !== 'function') throw new Error(`${fn} no registra su handler con serve()`)
  return handler
}

export function post(handler, fn, body, headers = {}) {
  return handler(new Request(`https://edge.example.test/functions/v1/${fn}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
  }))
}

// ---------------------------------------------------------------------------
// Base en memoria
// ---------------------------------------------------------------------------
const get = (row, col) => row[col]
const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0)

class Query {
  constructor(db, table) {
    this.db = db
    this.table = table
    this.op = 'select'
    this.filters = []
    this.orders = []
    this.lim = null
    this.rng = null
    this.patch = null
    this.rowsToInsert = null
    this.head = false
    this.wantCount = false
    this.returning = false
  }
  select(_cols, opts) {
    if (this.op === 'select') {
      if (opts?.head) this.head = true
      if (opts?.count) this.wantCount = true
    } else this.returning = true
    return this
  }
  insert(rows) { this.op = 'insert'; this.rowsToInsert = Array.isArray(rows) ? rows : [rows]; return this }
  update(patch) { this.op = 'update'; this.patch = patch; return this }
  delete() { this.op = 'delete'; return this }
  eq(c, v) { this.filters.push((r) => get(r, c) === v); return this }
  neq(c, v) { this.filters.push((r) => get(r, c) !== v); return this }
  lt(c, v) { this.filters.push((r) => get(r, c) < v); return this }
  lte(c, v) { this.filters.push((r) => get(r, c) <= v); return this }
  gt(c, v) { this.filters.push((r) => get(r, c) > v); return this }
  gte(c, v) { this.filters.push((r) => get(r, c) >= v); return this }
  is(c, v) { this.filters.push((r) => (v === null ? get(r, c) == null : get(r, c) === v)); return this }
  not(c, op, v) { if (op === 'is') this.filters.push((r) => (v === null ? get(r, c) != null : get(r, c) !== v)); return this }
  in(c, vals) { this.filters.push((r) => vals.includes(get(r, c))); return this }
  order(c, { ascending = true } = {}) { this.orders.push([c, ascending]); return this }
  limit(n) { this.lim = n; return this }
  range(a, b) { this.rng = [a, b]; return this }
  maybeSingle() { this.single_ = 'maybe'; return this.run() }
  single() { this.single_ = 'one'; return this.run() }
  then(resolve, reject) { return this.run().then(resolve, reject) }

  async run() {
    const tableRows = (this.db.tables[this.table] ??= [])
    this.db.log.push({ table: this.table, op: this.op })
    const hook = this.db.hooks.onQuery?.(this)
    if (hook?.error) return { data: null, error: hook.error }
    if (this.op === 'insert') {
      const out = []
      for (const row of this.rowsToInsert) {
        const key = row?.payload?.dedupe_key
        if (this.table === 'email_outbox' && key && tableRows.some((r) => r.payload?.dedupe_key === key)) {
          return { data: null, error: { code: '23505', message: 'duplicate key value violates unique constraint' } }
        }
        const full = { id: row.id ?? `${this.table}-${tableRows.length + 1}`, created_at: new Date().toISOString(), ...row }
        tableRows.push(full)
        out.push(full)
      }
      return this.finish(this.returning || this.single_ ? out : null)
    }
    let rows = tableRows.filter((r) => this.filters.every((f) => f(r)))
    if (this.op === 'update') {
      for (const r of rows) Object.assign(r, this.patch)
      return this.finish(this.returning ? rows : null)
    }
    if (this.op === 'delete') {
      this.db.tables[this.table] = tableRows.filter((r) => !rows.includes(r))
      return this.finish(null)
    }
    for (const [c, asc] of [...this.orders].reverse()) rows = [...rows].sort((a, b) => (asc ? 1 : -1) * cmp(a[c], b[c]))
    const total = rows.length
    if (this.rng) rows = rows.slice(this.rng[0], this.rng[1] + 1)
    if (this.lim !== null) rows = rows.slice(0, this.lim)
    if (this.head) return { data: null, count: this.wantCount ? total : null, error: null }
    return this.finish(rows, total)
  }
  finish(rows, total) {
    if (this.single_) {
      if (!rows || rows.length === 0) return this.single_ === 'one' ? { data: null, error: { message: 'no rows' } } : { data: null, error: null }
      return { data: { ...rows[0] }, error: null }
    }
    const data = rows ? rows.map((r) => ({ ...r })) : null
    return { data, count: this.wantCount ? (total ?? data?.length ?? 0) : null, error: null }
  }
}

/**
 * tables: { nombre: [filas] }.  hooks: { rpc(name, args) -> {data, error}, onQuery(query) -> {error}?,
 * users: { id: { id, email, email_confirmed_at } }, getUser(token) -> id|null }
 */
export function createFakeSupabase(tables = {}, hooks = {}) {
  const db = { tables, hooks, log: [], rpcCalls: [] }
  const client = {
    db,
    from: (table) => new Query(db, table),
    rpc: async (name, args) => {
      db.rpcCalls.push({ name, args })
      db.log.push({ rpc: name })
      return hooks.rpc ? hooks.rpc(name, args) : { data: null, error: { message: `rpc sin simular: ${name}` } }
    },
    auth: {
      getUser: async (token) => {
        const id = hooks.getUser ? hooks.getUser(token) : null
        return id ? { data: { user: { id } }, error: null } : { data: { user: null }, error: { message: 'invalid' } }
      },
      admin: {
        getUserById: async (id) => {
          const u = hooks.users?.[id]
          return u ? { data: { user: u }, error: null } : { data: { user: null }, error: { message: 'not found' } }
        },
      },
    },
  }
  return client
}
