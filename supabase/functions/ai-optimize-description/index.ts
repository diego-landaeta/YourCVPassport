import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.44.4';
import { Redis } from 'https://esm.sh/@upstash/redis@1.34.3';
import { Ratelimit } from 'https://esm.sh/@upstash/ratelimit@2.0.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OptimizePayload {
  text: string;
  type: 'experience' | 'summary' | 'skills';
  role?: string;
  industry?: string;
}

/**
 * Rate limiting for AI endpoints (10 req/hour)
 */
async function checkRateLimit(req: Request, userId?: string): Promise<{ success: boolean; headers: Record<string, string>; reset?: number }> {
  try {
    const redis = new Redis({
      url: Deno.env.get('UPSTASH_REDIS_REST_URL') || '',
      token: Deno.env.get('UPSTASH_REDIS_REST_TOKEN') || '',
    });

    const ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '1 h'),
      prefix: '@ratelimit/ai',
    });

    const identifier = userId || req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown';
    const result = await ratelimit.limit(`ai:${identifier}`);

    const headers: Record<string, string> = {
      'X-RateLimit-Limit': '10',
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
 * Optimize text using AI (example with OpenAI/Gemini)
 */
async function optimizeText(payload: OptimizePayload): Promise<string> {
  // Example using Google Gemini (you can also use OpenAI)
  const apiKey = Deno.env.get('GEMINI_API_KEY') || Deno.env.get('OPENAI_API_KEY');

  if (!apiKey) {
    throw new Error('AI API key not configured');
  }

  // This is a simplified example - adjust based on your AI provider
  const prompts = {
    experience: `You are a professional CV writer. Optimize the following work experience description to be more impactful, professional, and ATS-friendly. Focus on achievements, metrics, and action verbs. Keep it concise and professional.

Original: ${payload.text}
${payload.role ? `Role: ${payload.role}` : ''}
${payload.industry ? `Industry: ${payload.industry}` : ''}

Optimized description:`,
    summary: `You are a professional CV writer. Create a compelling professional summary based on the following information. Make it 2-3 sentences that highlight key strengths, experience, and value proposition.

Information: ${payload.text}
${payload.role ? `Role: ${payload.role}` : ''}
${payload.industry ? `Industry: ${payload.industry}` : ''}

Professional summary:`,
    skills: `You are a professional CV writer. Based on the following profile information, suggest 8-10 relevant professional skills that would enhance this CV. Include both technical and soft skills.

Profile: ${payload.text}
${payload.role ? `Role: ${payload.role}` : ''}
${payload.industry ? `Industry: ${payload.industry}` : ''}

Suggested skills (comma-separated):`,
  };

  // TODO: Replace with actual AI API call
  // Example for Gemini:
  // const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({
  //     contents: [{ parts: [{ text: prompts[payload.type] }] }],
  //   }),
  // });

  // For now, return a placeholder
  return `[AI Optimized] ${payload.text}`;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get user ID from authorization header
    const authHeader = req.headers.get('authorization');
    let userId: string | undefined;

    if (authHeader) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { authorization: authHeader } },
      });

      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id;
    }

    // Apply rate limiting (10 req/hour per user, or per IP if not authenticated)
    const rateLimitResult = await checkRateLimit(req, userId);

    if (!rateLimitResult.success) {
      const retryAfter = rateLimitResult.reset ? Math.ceil((rateLimitResult.reset - Date.now()) / 1000) : 3600;
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          message: `Too many requests. Please try again in ${retryAfter} seconds.`,
          limit: 10,
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

    // Parse request body
    const payload: OptimizePayload = await req.json();

    // Validate required fields
    if (!payload.text || !payload.type) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: text, type' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate type
    if (!['experience', 'summary', 'skills'].includes(payload.type)) {
      return new Response(
        JSON.stringify({ error: 'Invalid type. Must be: experience, summary, or skills' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Optimize text using AI
    const optimizedText = await optimizeText(payload);

    return new Response(
      JSON.stringify({
        success: true,
        original: payload.text,
        optimized: optimizedText,
        type: payload.type,
      }),
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
    console.error('Error in ai-optimize-description function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
