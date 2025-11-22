import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.44.4';
import { Redis } from 'https://esm.sh/@upstash/redis@1.34.3';
import { Ratelimit } from 'https://esm.sh/@upstash/ratelimit@2.0.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProfileResponse {
  id: string;
  handle: string;
  full_name: string;
  email?: string;
  phone?: string;
  summary?: string;
  avatar_url?: string;
  experience?: any[];
  education?: any[];
  skills?: string[];
  languages?: any[];
  certifications?: any[];
  is_public: boolean;
  custom_domain?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Rate limiting for API endpoints (100 req/min)
 */
async function checkRateLimit(req: Request): Promise<{ success: boolean; headers: Record<string, string>; reset?: number }> {
  try {
    const redis = new Redis({
      url: Deno.env.get('UPSTASH_REDIS_REST_URL') || '',
      token: Deno.env.get('UPSTASH_REDIS_REST_TOKEN') || '',
    });

    const ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, '1 m'),
      prefix: '@ratelimit/api',
    });

    const identifier = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown';
    const result = await ratelimit.limit(`api:${identifier}`);

    const headers: Record<string, string> = {
      'X-RateLimit-Limit': '100',
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': new Date(result.reset).toISOString(),
    };

    if (!result.success) {
      const retryAfter = Math.ceil((result.reset - Date.now()) / 1000);
      headers['Retry-After'] = retryAfter.toString();
    }

    return {
      success: result.success,
      headers,
      reset: result.reset,
    };
  } catch (error) {
    console.error('Rate limit check failed:', error);
    // Fail open - allow request if rate limiting fails
    return {
      success: true,
      headers: {},
    };
  }
}

/**
 * Get value from Redis cache
 */
async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const redis = new Redis({
      url: Deno.env.get('UPSTASH_REDIS_REST_URL') || '',
      token: Deno.env.get('UPSTASH_REDIS_REST_TOKEN') || '',
    });

    const value = await redis.get(key);
    return value as T | null;
  } catch (error) {
    console.error('Cache get failed:', error);
    return null;
  }
}

/**
 * Set value in Redis cache with TTL
 */
async function cacheSet<T>(key: string, value: T, ttl: number): Promise<void> {
  try {
    const redis = new Redis({
      url: Deno.env.get('UPSTASH_REDIS_REST_URL') || '',
      token: Deno.env.get('UPSTASH_REDIS_REST_TOKEN') || '',
    });

    await redis.set(key, value, { ex: ttl });
  } catch (error) {
    console.error('Cache set failed:', error);
  }
}

/**
 * Delete value from Redis cache
 */
async function cacheDel(key: string): Promise<void> {
  try {
    const redis = new Redis({
      url: Deno.env.get('UPSTASH_REDIS_REST_URL') || '',
      token: Deno.env.get('UPSTASH_REDIS_REST_TOKEN') || '',
    });

    await redis.del(key);
  } catch (error) {
    console.error('Cache delete failed:', error);
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Apply rate limiting (100 req/min per IP)
    const rateLimitResult = await checkRateLimit(req);

    if (!rateLimitResult.success) {
      const retryAfter = rateLimitResult.reset ? Math.ceil((rateLimitResult.reset - Date.now()) / 1000) : 60;
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          message: `Too many requests. Please try again in ${retryAfter} seconds.`,
          limit: 100,
          reset: rateLimitResult.reset,
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            ...rateLimitResult.headers,
          },
        }
      );
    }

    // Get handle from URL query parameter
    const url = new URL(req.url);
    const handle = url.searchParams.get('handle');

    if (!handle) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: handle' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Try to get from cache first (1 hour TTL)
    const cacheKey = `profile:${handle}`;
    let profile = await cacheGet<ProfileResponse>(cacheKey);

    if (profile) {
      console.log(`Cache HIT for profile: ${handle}`);
      return new Response(
        JSON.stringify({
          success: true,
          profile,
          cached: true,
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'X-Cache': 'HIT',
            ...rateLimitResult.headers,
          },
        }
      );
    }

    console.log(`Cache MISS for profile: ${handle}`);

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch profile from database
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('handle', handle)
      .eq('is_public', true)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);

      if (error.code === 'PGRST116') {
        return new Response(
          JSON.stringify({ error: 'Profile not found or not public' }),
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(
        JSON.stringify({ error: 'Failed to fetch profile', details: error.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    profile = data as ProfileResponse;

    // Cache the profile for 1 hour (3600 seconds)
    await cacheSet(cacheKey, profile, 3600);

    return new Response(
      JSON.stringify({
        success: true,
        profile,
        cached: false,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'X-Cache': 'MISS',
          ...rateLimitResult.headers,
        },
      }
    );
  } catch (error) {
    console.error('Error in get-public-profile function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

/**
 * Helper function to invalidate profile cache
 * Call this when a profile is updated
 */
export async function invalidateProfileCache(handle: string): Promise<void> {
  const cacheKey = `profile:${handle}`;
  await cacheDel(cacheKey);
}
