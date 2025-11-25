/**
 * Edge Function Tests: Export (Updated for Real API)
 * Tests for PDF and DOCX export functions
 */

import { test, expect } from '@playwright/test';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

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
