import { Redis } from 'https://esm.sh/@upstash/redis@1.34.3';
import { Ratelimit } from 'https://esm.sh/@upstash/ratelimit@2.0.3';

// Initialize Redis client
let redis: Redis | null = null;

function getRedisClient(): Redis {
  if (!redis) {
    const redisUrl = Deno.env.get('UPSTASH_REDIS_REST_URL');
    const redisToken = Deno.env.get('UPSTASH_REDIS_REST_TOKEN');

    if (!redisUrl || !redisToken) {
      throw new Error('UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set in environment variables');
    }

    redis = new Redis({
      url: redisUrl,
      token: redisToken,
    });
  }

  return redis;
}

// Rate limit configurations
export const rateLimitConfigs = {
  // API calls: 100 req/min per IP
  api: {
    requests: 100,
    window: '1 m',
  },
  // AI endpoints: 10 req/hour per user
  ai: {
    requests: 10,
    window: '1 h',
  },
  // Auth endpoints: 5 req/min per IP
  auth: {
    requests: 5,
    window: '1 m',
  },
  // Correos de auth por destinatario (send-password-reset): 3 cada 15 min por
  // email, para que nadie pueda bombardear un buzón ajeno cambiando de IP.
  authEmail: {
    requests: 3,
    window: '15 m',
  },
  // Analytics: 30 req/min per IP
  analytics: {
    requests: 30,
    window: '1 m',
  },
} as const;

// Create rate limiter instances
const rateLimiters = new Map<string, Ratelimit>();

function getRateLimiter(type: keyof typeof rateLimitConfigs): Ratelimit {
  if (!rateLimiters.has(type)) {
    const config = rateLimitConfigs[type];
    const redis = getRedisClient();

    rateLimiters.set(
      type,
      new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(config.requests, config.window),
        analytics: true,
        prefix: `@ratelimit/${type}`,
      })
    );
  }

  return rateLimiters.get(type)!;
}

/**
 * Extract identifier from request (IP or user ID)
 */
export function getIdentifier(req: Request, userId?: string): string {
  // Prefer user ID if available
  if (userId) {
    return `user:${userId}`;
  }

  // Fall back to IP address
  return `ip:${getClientIp(req) ?? 'unknown'}`;
}

/**
 * IP del cliente según las cabeceras del proxy (mismo orden que getIdentifier).
 * null si no viene ninguna.
 */
export function getClientIp(req: Request): string | null {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    req.headers.get('cf-connecting-ip') || // Cloudflare
    null
  );
}

/**
 * Apply rate limiting to a request
 * Returns response headers with rate limit info
 */
export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  headers: Record<string, string>;
}

export async function checkRateLimit(
  type: keyof typeof rateLimitConfigs,
  identifier: string
): Promise<RateLimitResult> {
  const ratelimit = getRateLimiter(type);
  const result = await ratelimit.limit(identifier);

  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
    headers: {
      'X-RateLimit-Limit': result.limit.toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': new Date(result.reset).toISOString(),
    },
  };
}

/**
 * Middleware to apply rate limiting
 * Returns a 429 response if rate limit is exceeded
 */
export async function withRateLimit(
  req: Request,
  type: keyof typeof rateLimitConfigs,
  userId?: string
): Promise<RateLimitResult | Response> {
  try {
    const identifier = getIdentifier(req, userId);
    const result = await checkRateLimit(type, identifier);

    if (!result.success) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          message: `Too many requests. Please try again in ${Math.ceil((result.reset - Date.now()) / 1000)} seconds.`,
          limit: result.limit,
          reset: result.reset,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil((result.reset - Date.now()) / 1000).toString(),
            ...result.headers,
          },
        }
      );
    }

    return result;
  } catch (error) {
    
    // Allow the request to proceed if rate limiting fails (fail open)
    return {
      success: true,
      limit: 0,
      remaining: 0,
      reset: 0,
      headers: {},
    };
  }
}

/**
 * Rate limit para las funciones de auth (signup, send-password-reset).
 *
 * A diferencia de withRateLimit:
 * - Comprueba varias claves a la vez (p. ej. IP y email); basta con que una
 *   esté agotada para devolver 429.
 * - El 429 sigue el contrato de las funciones de auth: { error, code:
 *   'RATE_LIMITED' } con Retry-After y las cabeceras CORS que se le pasen.
 * - Sin Upstash configurado falla en abierto (como el resto del repo) y lo
 *   avisa una sola vez por instancia; si Upstash falla, también deja pasar.
 *
 * Devuelve la Response 429 o null si la petición puede seguir.
 */
let warnedRateLimitDisabled = false;

export async function enforceRateLimit(
  type: keyof typeof rateLimitConfigs,
  identifiers: string[],
  corsHeaders: Record<string, string>
): Promise<Response | null> {
  if (!Deno.env.get('UPSTASH_REDIS_REST_URL') || !Deno.env.get('UPSTASH_REDIS_REST_TOKEN')) {
    if (!warnedRateLimitDisabled) {
      warnedRateLimitDisabled = true;
      console.warn('[ratelimit] UPSTASH_REDIS_REST_URL/TOKEN no configurados: rate limit desactivado (fail open)');
    }
    return null;
  }

  const results = await Promise.allSettled(
    identifiers.map((identifier) => checkRateLimit(type, identifier))
  );

  let blockedUntil = 0;
  for (const result of results) {
    if (result.status === 'rejected') {
      // Solo el mensaje: nunca la URL ni el token de Upstash.
      console.warn('[ratelimit] Upstash falló, se deja pasar:', (result.reason as Error)?.message);
      continue;
    }
    if (!result.value.success) blockedUntil = Math.max(blockedUntil, result.value.reset);
  }

  if (!blockedUntil) return null;

  const retryAfter = Math.max(1, Math.ceil((blockedUntil - Date.now()) / 1000));
  return new Response(
    JSON.stringify({ error: 'Too many requests. Please try again later.', code: 'RATE_LIMITED' }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfter),
      },
    }
  );
}

/**
 * SHA-256 en hex. Para usar emails como clave de rate limit sin guardarlos en
 * claro en Upstash.
 */
export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Cache utilities
 */
export interface CacheOptions {
  ttl: number; // TTL in seconds
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const redis = getRedisClient();
    const value = await redis.get(key);
    return value as T | null;
  } catch (error) {
    
    return null;
  }
}

export async function cacheSet<T>(
  key: string,
  value: T,
  options: CacheOptions
): Promise<void> {
  try {
    const redis = getRedisClient();
    await redis.set(key, value, { ex: options.ttl });
  } catch (error) {
    
  }
}

export async function cacheDel(key: string): Promise<void> {
  try {
    const redis = getRedisClient();
    await redis.del(key);
  } catch (error) {
    
  }
}

/**
 * Cache invalidation patterns
 */
export async function invalidatePattern(pattern: string): Promise<void> {
  try {
    const redis = getRedisClient();
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    
  }
}

// Predefined cache keys and TTLs
export const cacheKeys = {
  profile: (handle: string) => `profile:${handle}`,
  profileTTL: 3600, // 1 hour

  directory: (filters: string, page: number) => `profiles:${filters}:${page}`,
  directoryTTL: 900, // 15 minutes

  analytics: (profileId: string, period: string) => `analytics:${profileId}:${period}`,
  analyticsTTL: 1800, // 30 minutes
};
