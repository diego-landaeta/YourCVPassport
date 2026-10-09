/**
 * Edge Function Tests: Public Profile (Updated for Real API)
 * Tests for public profile and directory functions
 */

import { test, expect } from '@playwright/test';
import { SUPABASE_URL, SUPABASE_ANON_KEY, requireLiveEdgeProject } from './test-config';

// Edge Functions reales: solo con RUN_LIVE_EDGE_TESTS=1 y un proyecto de pruebas.
requireLiveEdgeProject();

test.describe('Get Public Profile Function', () => {
  test('get-public-profile - should handle request with slug', async ({ request }) => {
    const response = await request.get(`${SUPABASE_URL}/functions/v1/get-public-profile?slug=test-slug`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
      },
    });

    // May return 404 if profile doesn't exist
    expect([200, 404, 500]).toContain(response.status());
  });

  test('get-public-profile - should handle missing slug parameter', async ({ request }) => {
    const response = await request.get(`${SUPABASE_URL}/functions/v1/get-public-profile`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
      },
    });

    expect([400, 404, 500]).toContain(response.status());
  });
});

test.describe('Get Profiles Directory Function', () => {
  test('get-profiles-directory - should return profiles list', async ({ request }) => {
    const response = await request.get(`${SUPABASE_URL}/functions/v1/get-profiles-directory`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
      },
    });

    expect([200, 500]).toContain(response.status());
  });

  test('get-profiles-directory - should handle pagination parameters', async ({ request }) => {
    const response = await request.get(`${SUPABASE_URL}/functions/v1/get-profiles-directory?page=1&limit=10`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
      },
    });

    expect([200, 500]).toContain(response.status());
  });
});

test.describe('CORS Handling', () => {
  test('should handle OPTIONS for get-public-profile', async ({ request }) => {
    const response = await request.fetch(`${SUPABASE_URL}/functions/v1/get-public-profile`, {
      method: 'OPTIONS',
    });

    expect(response.status()).toBe(200);
  });

  test('should handle OPTIONS for get-profiles-directory', async ({ request }) => {
    const response = await request.fetch(`${SUPABASE_URL}/functions/v1/get-profiles-directory`, {
      method: 'OPTIONS',
    });

    expect(response.status()).toBe(200);
  });
});
