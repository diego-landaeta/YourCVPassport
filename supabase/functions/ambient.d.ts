// Ambient type definitions for Deno environment compatibility
// This allows the standard TypeScript compiler to ignore Deno-specific globals and imports

declare namespace Deno {
  export interface Env {
    get(key: string): string | undefined;
    toObject(): { [key: string]: string };
  }
  export const env: Env;
}

// Allow imports from https URLs
declare module "https://*" {
  export const serve: any;
  export const createClient: any;
  export const Redis: any;
  export const Ratelimit: any;
  const _default: any;
  export default _default;
}
