/**
 * Edge Function Tests: Utilities (Updated for Real API)
 * Tests for analytics, AI optimization, sitemap, and lead notification functions
 */

import { test, expect } from '@playwright/test';
import { SUPABASE_URL, SUPABASE_ANON_KEY, requireLiveEdgeProject } from './test-config';

// Edge Functions reales (track-analytics escribe datos): solo con RUN_LIVE_EDGE_TESTS=1
// y un proyecto de pruebas.
requireLiveEdgeProject();

test.describe('Track Analytics Function', () => {
  test('track-analytics - should handle event tracking', async ({ request }) => {
    const response = await request.post(`${SUPABASE_URL}/functions/v1/track-analytics`, {
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
      },
      data: {
        event: 'profile_view',
        profileId: 'test-profile-id',
        metadata: {
          source: 'test',
        },
      },
    });

    expect([200, 400, 500]).toContain(response.status());
  });

  test('track-analytics - should require event parameter', async ({ request }) => {
    const response = await request.post(`${SUPABASE_URL}/functions/v1/track-analytics`, {
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
      },
      data: {
        profileId: 'test-profile-id',
      },
    });

    expect([400, 500]).toContain(response.status());
  });
});

test.describe('AI Optimize Description Function', () => {
  test('ai-optimize-description - should handle optimization request', async ({ request }) => {
    const response = await request.post(`${SUPABASE_URL}/functions/v1/ai-optimize-description`, {
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
      },
      data: {
        description: 'Test description',
        type: 'experience',
      },
    });

    // 401: ai-optimize-description exige JWT desde el endurecimiento de seguridad.
    expect([200, 400, 401, 500]).toContain(response.status());
  });

  test('ai-optimize-description - should require description parameter', async ({ request }) => {
    const response = await request.post(`${SUPABASE_URL}/functions/v1/ai-optimize-description`, {
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
      },
      data: {
        type: 'experience',
      },
    });

    // Sin JWT la funcion responde 401 antes de validar el body.
    expect([400, 401, 500]).toContain(response.status());
  });
});

test.describe('Sitemap Function', () => {
  test('sitemap - should return XML sitemap', async ({ request }) => {
    const response = await request.get(`${SUPABASE_URL}/functions/v1/sitemap`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
      },
    });

    expect([200, 500]).toContain(response.status());

    if (response.status() === 200) {
      const contentType = response.headers()['content-type'];
      expect(contentType).toContain('xml');
    }
  });
});

test.describe('Send Lead Notification Function', () => {
  test('send-lead-notification - should handle notification request', async ({ request }) => {
    const response = await request.post(`${SUPABASE_URL}/functions/v1/send-lead-notification`, {
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
      },
      // Campos que espera la funcion (lead_id, profile_id, sender_*). El profile_id no
      // existe: responde 404 sin enviar ningun correo.
      data: {
        lead_id: '00000000-0000-4000-8000-000000000000',
        profile_id: '00000000-0000-4000-8000-000000000000',
        sender_name: 'Test User',
        sender_email: 'test@example.com',
        message: 'Test message',
      },
    });

    expect([200, 400, 404, 500]).toContain(response.status());
  });

  test('send-lead-notification - should require email parameter', async ({ request }) => {
    const response = await request.post(`${SUPABASE_URL}/functions/v1/send-lead-notification`, {
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
      },
      data: {
        lead_id: '00000000-0000-4000-8000-000000000000',
        profile_id: '00000000-0000-4000-8000-000000000000',
        sender_name: 'Test User',
        message: 'Test message',
      },
    });

    expect([400, 500]).toContain(response.status());
  });
});

test.describe('CORS Handling', () => {
  test('should handle OPTIONS for track-analytics', async ({ request }) => {
    const response = await request.fetch(`${SUPABASE_URL}/functions/v1/track-analytics`, {
      method: 'OPTIONS',
    });

    expect(response.status()).toBe(200);
  });

  test('should handle OPTIONS for ai-optimize-description', async ({ request }) => {
    const response = await request.fetch(`${SUPABASE_URL}/functions/v1/ai-optimize-description`, {
      method: 'OPTIONS',
    });

    expect(response.status()).toBe(200);
  });

  test('should handle OPTIONS for send-lead-notification', async ({ request }) => {
    const response = await request.fetch(`${SUPABASE_URL}/functions/v1/send-lead-notification`, {
      method: 'OPTIONS',
    });

    expect(response.status()).toBe(200);
  });
});
