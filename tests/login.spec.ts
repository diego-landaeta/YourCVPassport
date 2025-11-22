import { test, expect } from '@playwright/test';

/**
 * E2E Test Suite: Authentication Flow
 * Tests the login functionality and dashboard redirection
 */

test.describe('Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the login page before each test
    await page.goto('/login');
  });

  test('should display login page correctly', async ({ page }) => {
    // Check that we're on the login page
    await expect(page).toHaveURL(/.*login/);

    // Verify page title or heading
    await expect(page).toHaveTitle(/YourCVPassport/i);
  });

  test('should show validation errors for empty credentials', async ({ page }) => {
    // Try to submit the form without filling in credentials
    const loginButton = page.getByRole('button', { name: /log in|sign in|iniciar/i });
    await loginButton.click();

    // Should still be on the login page (form validation prevents submission)
    await expect(page).toHaveURL(/.*login/);
  });

  test('should navigate to signup page', async ({ page }) => {
    // Look for a signup/register link
    const signupLink = page.getByRole('link', { name: /sign up|create account|registro/i });

    if (await signupLink.isVisible()) {
      await signupLink.click();
      await expect(page).toHaveURL(/.*signup/);
    }
  });

  test.skip('should successfully login with valid credentials and redirect to dashboard', async ({ page }) => {
    /**
     * NOTE: This test is skipped by default as it requires:
     * 1. A test user account in the database
     * 2. Valid credentials (email/password)
     *
     * To enable this test:
     * 1. Create a test user in your Supabase instance
     * 2. Store credentials in environment variables or a .env.test file
     * 3. Remove the .skip modifier from this test
     */

    const testEmail = process.env.TEST_USER_EMAIL || 'test@example.com';
    const testPassword = process.env.TEST_USER_PASSWORD || 'testpassword123';

    // Fill in the login form
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);

    // Submit the form
    const loginButton = page.getByRole('button', { name: /log in|sign in|iniciar/i });
    await loginButton.click();

    // Wait for navigation to dashboard
    await page.waitForURL(/.*dashboard/, { timeout: 10000 });

    // Verify we're on the dashboard
    await expect(page).toHaveURL(/.*dashboard/);

    // Check for dashboard-specific elements
    const dashboardHeading = page.getByRole('heading', { name: /dashboard|panel/i });
    await expect(dashboardHeading).toBeVisible();
  });

  test('should handle magic link login option if available', async ({ page }) => {
    // Check if magic link option exists
    const magicLinkButton = page.getByRole('button', { name: /magic link|enlace mágico/i });

    if (await magicLinkButton.isVisible()) {
      await magicLinkButton.click();

      // Should navigate to magic link page or show email input
      const emailInput = page.locator('input[type="email"]');
      await expect(emailInput).toBeVisible();
    }
  });
});

test.describe('Protected Routes', () => {
  test('should redirect to login when accessing dashboard without authentication', async ({ page }) => {
    // Try to access the dashboard directly
    await page.goto('/dashboard');

    // Should be redirected to login or auth page
    await expect(page).toHaveURL(/.*\/(login|auth|signup)/);
  });
});
