import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.44.4';
import { Redis } from 'https://esm.sh/@upstash/redis@1.34.3';
import { Ratelimit } from 'https://esm.sh/@upstash/ratelimit@2.0.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DirectoryFilters {
  country?: string;
  city?: string;
  role?: string;
  skills?: string[];
  search?: string;
}

interface DirectoryResponse {
  profiles: any[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
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
 * Build cache key from filters
 */
function buildFilterKey(filters: DirectoryFilters, page: number): string {
  const parts = [
    filters.country || '',
    filters.city || '',
    filters.role || '',
    filters.skills?.sort().join(',') || '',
    filters.search || '',
  ];
  return `profiles:${parts.join(':')}:${page}`;
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

    // Parse query parameters
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '20');

    const filters: DirectoryFilters = {
      country: url.searchParams.get('country') || undefined,
      city: url.searchParams.get('city') || undefined,
      role: url.searchParams.get('role') || undefined,
      skills: url.searchParams.get('skills')?.split(',').filter(Boolean) || undefined,
      search: url.searchParams.get('search') || undefined,
    };

    // Validate page and pageSize
    if (page < 1 || pageSize < 1 || pageSize > 100) {
      return new Response(
        JSON.stringify({ error: 'Invalid pagination parameters. page >= 1, 1 <= pageSize <= 100' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Try to get from cache first (15 minutes TTL)
    const cacheKey = buildFilterKey(filters, page);
    let directoryData = await cacheGet<DirectoryResponse>(cacheKey);

    if (directoryData) {
      console.log(`Cache HIT for directory: page ${page}`);
      return new Response(
        JSON.stringify({
          success: true,
          ...directoryData,
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

    console.log(`Cache MISS for directory: page ${page}`);

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Build query
    let query = supabase
      .from('profiles')
      .select('id, handle, full_name, summary, avatar_url, role, location, skills, country, city', { count: 'exact' })
      .eq('is_public', true);

    // Apply filters
    if (filters.country) {
      query = query.eq('country', filters.country);
    }

    if (filters.city) {
      query = query.eq('city', filters.city);
    }

    if (filters.role) {
      query = query.ilike('role', `%${filters.role}%`);
    }

    if (filters.skills && filters.skills.length > 0) {
      // Assuming skills is a JSON array column
      query = query.contains('skills', filters.skills);
    }

    if (filters.search) {
      // Full-text search on name and summary
      query = query.or(`full_name.ilike.%${filters.search}%,summary.ilike.%${filters.search}%`);
    }

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    // Order by updated_at desc
    query = query.order('updated_at', { ascending: false });

    // Execute query
    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching profiles directory:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch profiles', details: error.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / pageSize);

    directoryData = {
      profiles: data || [],
      total,
      page,
      pageSize,
      totalPages,
    };

    // Cache the directory for 15 minutes (900 seconds)
    await cacheSet(cacheKey, directoryData, 900);

    return new Response(
      JSON.stringify({
        success: true,
        ...directoryData,
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
    console.error('Error in get-profiles-directory function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
