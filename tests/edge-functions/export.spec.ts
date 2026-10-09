/**
 * Edge Function Tests: Export (Updated for Real API)
 * Tests for PDF and DOCX export functions
 */

import { test, expect } from '@playwright/test';
import { SUPABASE_URL, SUPABASE_ANON_KEY, requireLiveEdgeProject } from './test-config';

// Edge Functions reales: solo con RUN_LIVE_EDGE_TESTS=1 y un proyecto de pruebas.
requireLiveEdgeProject();

test.describe('PDF Export Function', () => {
  test('export-pdf - should require authorization', async ({ request }) => {
    const response = await request.post(`${SUPABASE_URL}/functions/v1/export-pdf`, {
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
      },
      data: {
        profileId: 'test-profile-id',
        template: 'modern',
      },
    });

    // Should fail without proper authorization
    expect([401, 500]).toContain(response.status());
  });

  test('export-pdf - should require profileId parameter', async ({ request }) => {
    const response = await request.post(`${SUPABASE_URL}/functions/v1/export-pdf`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock-token',
        'apikey': SUPABASE_ANON_KEY,
      },
      data: {
        template: 'modern',
      },
    });

    expect([400, 401, 500]).toContain(response.status());
  });
});

test.describe('DOCX Export Function', () => {
  test('export-docx - should require authorization', async ({ request }) => {
    const response = await request.post(`${SUPABASE_URL}/functions/v1/export-docx`, {
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
      },
      data: {
        profileId: 'test-profile-id',
        template: 'modern',
      },
    });

    expect([401, 500]).toContain(response.status());
  });

  test('export-docx - should require profileId parameter', async ({ request }) => {
    const response = await request.post(`${SUPABASE_URL}/functions/v1/export-docx`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock-token',
        'apikey': SUPABASE_ANON_KEY,
      },
      data: {
        template: 'modern',
      },
    });

    expect([400, 401, 500]).toContain(response.status());
  });
});

test.describe('CORS Handling', () => {
  test('should handle OPTIONS for export-pdf', async ({ request }) => {
    const response = await request.fetch(`${SUPABASE_URL}/functions/v1/export-pdf`, {
      method: 'OPTIONS',
    });

    expect(response.status()).toBe(200);
  });

  test('should handle OPTIONS for export-docx', async ({ request }) => {
    const response = await request.fetch(`${SUPABASE_URL}/functions/v1/export-docx`, {
      method: 'OPTIONS',
    });

    expect(response.status()).toBe(200);
  });
});
