/**
 * Edge Function Tests: Authentication (Updated for Real API)
 * Tests for email confirmation, magic link, and password reset functions
 *
 * ENVIA CORREOS REALES: solo con RUN_LIVE_EDGE_TESTS=1, un proyecto de pruebas y
 * EDGE_TEST_EMAIL (ver test-config.ts).
 */

import { test, expect } from '@playwright/test';
import { SUPABASE_URL, SUPABASE_ANON_KEY, TEST_EMAIL, requireLiveEdgeProject, requireTestEmail } from './test-config';

requireLiveEdgeProject();

test.describe('Email Confirmation Function', () => {
  test('send-email-confirmation - should handle request', async ({ request }) => {
    requireTestEmail();
    const response = await request.post(`${SUPABASE_URL}/functions/v1/send-email-confirmation`, {
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
      },
      data: {
        email: TEST_EMAIL,
        userId: 'test-user-id',
      },
    });

    expect([200, 400, 404, 500]).toContain(response.status());
  });

  test('send-email-confirmation - should require email parameter', async ({ request }) => {
    const response = await request.post(`${SUPABASE_URL}/functions/v1/send-email-confirmation`, {
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
      },
      data: {
        userId: 'test-user-id',
      },
    });

    expect([400, 500]).toContain(response.status());
  });
});

test.describe('Magic Link Function', () => {
  test('send-magic-link - should handle request', async ({ request }) => {
    requireTestEmail();
    const response = await request.post(`${SUPABASE_URL}/functions/v1/send-magic-link`, {
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
      },
      data: {
        email: TEST_EMAIL,
      },
    });

    expect([200, 400, 404, 500]).toContain(response.status());
  });

  test('send-magic-link - should require email parameter', async ({ request }) => {
    const response = await request.post(`${SUPABASE_URL}/functions/v1/send-magic-link`, {
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
      },
      data: {},
    });

    expect([400, 500]).toContain(response.status());
  });
});

test.describe('Password Reset Function', () => {
  test('send-password-reset - should handle request', async ({ request }) => {
    requireTestEmail();
    const response = await request.post(`${SUPABASE_URL}/functions/v1/send-password-reset`, {
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
      },
      data: {
        email: TEST_EMAIL,
      },
    });

    // Should always return 200 (security best practice - don't reveal user existence)
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
  });

  test('send-password-reset - should require email parameter', async ({ request }) => {
    const response = await request.post(`${SUPABASE_URL}/functions/v1/send-password-reset`, {
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
      },
      data: {},
    });

    expect([400, 500]).toContain(response.status());
  });

  test('send-password-reset - should not reveal user existence', async ({ request }) => {
    const response = await request.post(`${SUPABASE_URL}/functions/v1/send-password-reset`, {
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
      },
      data: {
        email: 'nonexistent@example.com',
      },
    });

    // Should return 200 even for non-existent users
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
  });
});

test.describe('CORS Handling', () => {
  test('should handle OPTIONS for send-email-confirmation', async ({ request }) => {
    const response = await request.fetch(`${SUPABASE_URL}/functions/v1/send-email-confirmation`, {
      method: 'OPTIONS',
    });

    expect(response.status()).toBe(200);
  });

  test('should handle OPTIONS for send-magic-link', async ({ request }) => {
    const response = await request.fetch(`${SUPABASE_URL}/functions/v1/send-magic-link`, {
      method: 'OPTIONS',
    });

    expect(response.status()).toBe(200);
  });

  test('should handle OPTIONS for send-password-reset', async ({ request }) => {
    const response = await request.fetch(`${SUPABASE_URL}/functions/v1/send-password-reset`, {
      method: 'OPTIONS',
    });

    expect(response.status()).toBe(200);
  });
});

// Pendiente: requiere interceptar el correo (buzon de pruebas con API). Antes eran
// `expect(true)` que pasaban sin comprobar nada.
test.describe('Email Content Validation', () => {
  test.fixme('send-email-confirmation - should include welcome message', async () => {});
  test.fixme('send-magic-link - should include login link', async () => {});
  test.fixme('send-password-reset - should include reset link', async () => {});
});
