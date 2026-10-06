/**
 * Entorno tipo Supabase sobre PGlite (Postgres en memoria, WASM) para probar
 * migraciones SQL del repo desde Playwright sin tocar ninguna base de datos real.
 *
 * Imita lo que importa para RLS y privilegios:
 * - roles anon, authenticated y service_role (este último con BYPASSRLS);
 * - esquema auth con auth.users, auth.uid() y auth.role(), que leen
 *   `request.jwt.claims` (y `request.jwt.claim.sub/role`, formato antiguo de PostgREST);
 * - privilegios por defecto de Supabase en public: ALL sobre tablas, funciones y
 *   secuencias para anon, authenticated y service_role;
 * - `as(role, sub, sql, params)`: ejecuta una consulta con ese rol y esos claims,
 *   como haría PostgREST con el JWT del usuario. Devuelve `{ rows, error }` en vez de lanzar.
 *
 * Las migraciones se leen tal cual de supabase/migrations; solo se quita
 * `CREATE EXTENSION ... pg_net` (PGlite no la trae). `transformar` permite aplicar
 * una copia modificada en memoria (nunca se escribe el fichero).
 */
import { PGlite } from '@electric-sql/pglite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const MIGRATIONS_DIR = path.resolve(HERE, '..', '..', '..', 'supabase', 'migrations');

export type Rol = 'anon' | 'authenticated' | 'service_role';
export type Fila = Record<string, any>;
export type ErrorBd = Error & { code?: string };
export interface Resultado<T extends Fila = Fila> {
  rows: T[] | null;
  error: ErrorBd | null;
}

export interface OpcionesMigracion {
  /** Modifica el SQL en memoria antes de aplicarlo (p. ej. para comprobar que un test detecta un fallo). */
  transformar?: (sql: string) => string;
}

/** Lee una migración del repo quitando solo `CREATE EXTENSION ... pg_net`. */
export function leerMigracion(nombre: string, opciones: OpcionesMigracion = {}): string {
  const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, nombre), 'utf8')
    .replace(/create extension[^;]*pg_net[^;]*;/gi, '');
  return opciones.transformar ? opciones.transformar(sql) : sql;
}

/** Errores de permisos/RLS o de las excepciones propias de las RPC de seguridad. */
export function denegado(r: Resultado): boolean {
  return !!r.error && /permission denied|42501|row-level security|NOT_ADMIN|USER_MISMATCH|ANON_NOT_ALLOWED|PROTECTED_FIELD|PUBLISH_REQUIRES|Unauthorized/i
    .test(`${r.error.message} ${r.error.code || ''}`);
}

/** Texto del error para los mensajes de `expect`. */
export function describirError(r: Resultado): string {
  return r.error ? `${r.error.code || ''} ${r.error.message}` : 'sin error';
}

const BASE_SQL = `
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE service_role NOLOGIN BYPASSRLS;
CREATE SCHEMA auth;
CREATE TABLE auth.users (id uuid PRIMARY KEY, email text);
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
  SELECT coalesce(nullif(current_setting('request.jwt.claim.sub', true), ''),
                  (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub'))::uuid $$;
CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS $$
  SELECT coalesce(nullif(current_setting('request.jwt.claim.role', true), ''),
                  (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role'))::text $$;
GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA auth TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
`;

export class SupabaseBd {
  private constructor(readonly db: PGlite) {}

  /** Crea una instancia nueva de PGlite con roles, auth.* y privilegios por defecto. */
  static async crear(): Promise<SupabaseBd> {
    const db = new PGlite();
    await db.exec(BASE_SQL);
    return new SupabaseBd(db);
  }

  async cerrar(): Promise<void> {
    await this.db.close();
  }

  /** Ejecuta SQL arbitrario como superusuario (lanza si falla). */
  async exec(sql: string): Promise<void> {
    await this.db.exec(sql);
  }

  /** Aplica una migración del repo como superusuario (lanza si falla). */
  async aplicarMigracion(nombre: string, opciones: OpcionesMigracion = {}): Promise<void> {
    await this.db.exec(leerMigracion(nombre, opciones));
  }

  /**
   * Aplica una migración y devuelve el error en vez de lanzarlo (null si se aplicó).
   * Si falla, hace ROLLBACK de la transacción que la migración dejó abierta.
   */
  async probarMigracion(nombre: string, opciones: OpcionesMigracion = {}): Promise<ErrorBd | null> {
    try {
      await this.aplicarMigracion(nombre, opciones);
      return null;
    } catch (e) {
      await this.db.exec('ROLLBACK');
      return e as ErrorBd;
    }
  }

  /**
   * Ejecuta `sql` con el rol y los claims del JWT indicados. Con `role` null se
   * ejecuta como superusuario y sin claims (SQL editor).
   */
  async as<T extends Fila = Fila>(role: Rol | null, sub: string | null, sql: string, params?: unknown[]): Promise<Resultado<T>> {
    const claims = role ? JSON.stringify(sub ? { role, sub } : { role }) : '';
    await this.db.exec(`RESET ROLE; SELECT set_config('request.jwt.claims', '${claims}', false);`);
    if (role) await this.db.exec(`SET ROLE ${role}`);
    try {
      const r = await this.db.query<T>(sql, params);
      return { rows: r.rows, error: null };
    } catch (e) {
      return { rows: null, error: e as ErrorBd };
    } finally {
      await this.db.exec('RESET ROLE');
      await this.db.exec(`SELECT set_config('request.jwt.claims', '', false)`);
    }
  }

  su<T extends Fila = Fila>(sql: string, params?: unknown[]) { return this.as<T>(null, null, sql, params); }
  anon<T extends Fila = Fila>(sql: string, params?: unknown[]) { return this.as<T>('anon', null, sql, params); }
  user<T extends Fila = Fila>(id: string, sql: string, params?: unknown[]) { return this.as<T>('authenticated', id, sql, params); }
  svc<T extends Fila = Fila>(sql: string, params?: unknown[]) { return this.as<T>('service_role', null, sql, params); }

  /** Primera fila de una consulta como superusuario. */
  async una<T extends Fila = Fila>(sql: string, params?: unknown[]): Promise<T | undefined> {
    return (await this.su<T>(sql, params)).rows?.[0];
  }
}
