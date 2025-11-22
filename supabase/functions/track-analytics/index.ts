import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.44.4';
import { crypto } from 'https://deno.land/std@0.168.0/crypto/mod.ts';
import { Redis } from 'https://esm.sh/@upstash/redis@1.34.3';
import { Ratelimit } from 'https://esm.sh/@upstash/ratelimit@2.0.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TrackingPayload {
  profileId: string;
  eventType: 'VIEW' | 'CLICK' | 'SHARE' | 'DOWNLOAD' | 'CONTACT';
  metadata?: {
    referrer?: string;
    userAgent?: string;
    location?: string;
    section?: string;
    buttonName?: string;
    shareType?: string;
    downloadType?: string;
    contactType?: string;
  };
  sessionId?: string;
  visitorId?: string;
}

interface AnalyticsEvent {
  profile_id: string;
  event_type: string;
  session_id: string;
  visitor_id: string;
  ip_address: string;
  user_agent?: string;
  referrer?: string;
  country?: string;
  city?: string;
  metadata?: any;
  created_at?: string;
}

/**
 * Rate limiting for analytics endpoints (30 req/min)
 */
async function checkRateLimit(req: Request): Promise<{ success: boolean; headers: Record<string, string>; reset?: number }> {
  try {
    const redis = new Redis({
      url: Deno.env.get('UPSTASH_REDIS_REST_URL') || '',
      token: Deno.env.get('UPSTASH_REDIS_REST_TOKEN') || '',
    });

    const ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(30, '1 m'),
      prefix: '@ratelimit/analytics',
    });

    const identifier = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown';
    const result = await ratelimit.limit(`analytics:${identifier}`);

    const headers: Record<string, string> = {
      'X-RateLimit-Limit': '30',
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
 * Generate a visitor fingerprint based on request headers
 */
async function generateVisitorId(req: Request): Promise<string> {
  const userAgent = req.headers.get('user-agent') || '';
  const acceptLanguage = req.headers.get('accept-language') || '';
  const acceptEncoding = req.headers.get('accept-encoding') || '';

  const fingerprint = `${userAgent}${acceptLanguage}${acceptEncoding}`;

  // Create SHA-256 hash
  const encoder = new TextEncoder();
  const data = encoder.encode(fingerprint);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return hashHex;
}

/**
 * Get geolocation from IP (if available via Cloudflare headers)
 */
function getGeolocation(req: Request): { country?: string; city?: string } {
  return {
    country: req.headers.get('cf-ipcountry') || undefined,
    city: req.headers.get('cf-ipcity') || undefined,
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Apply rate limiting (30 req/min per IP)
    const rateLimitResult = await checkRateLimit(req);

    if (!rateLimitResult.success) {
      const retryAfter = rateLimitResult.reset ? Math.ceil((rateLimitResult.reset - Date.now()) / 1000) : 60;
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          message: `Too many requests. Please try again in ${retryAfter} seconds.`,
          limit: 30,
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

    // Create Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const payload: TrackingPayload = await req.json();

    // Validate required fields
    if (!payload.profileId || !payload.eventType) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: profileId, eventType' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get request metadata
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0] ||
                     req.headers.get('cf-connecting-ip') ||
                     'unknown';
    const userAgent = req.headers.get('user-agent') || undefined;
    const referrer = payload.metadata?.referrer || req.headers.get('referer') || undefined;
    const geo = getGeolocation(req);

    // Generate visitor ID if not provided
    const visitorId = payload.visitorId || await generateVisitorId(req);

    // Generate session ID if not provided (simple timestamp-based)
    const sessionId = payload.sessionId || `${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // Prepare analytics event
    const analyticsEvent: AnalyticsEvent = {
      profile_id: payload.profileId,
      event_type: payload.eventType,
      session_id: sessionId,
      visitor_id: visitorId,
      ip_address: ipAddress,
      user_agent: userAgent,
      referrer: referrer,
      country: geo.country,
      city: geo.city,
      metadata: payload.metadata || {},
    };

    // Insert into analytics table
    const { data, error } = await supabase
      .from('analytics_events')
      .insert([analyticsEvent])
      .select()
      .single();

    if (error) {
      console.error('Error inserting analytics event:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to track event', details: error.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true, id: data.id }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          ...rateLimitResult.headers,
        },
      }
    );
  } catch (error) {
    console.error('Error in track-analytics function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
