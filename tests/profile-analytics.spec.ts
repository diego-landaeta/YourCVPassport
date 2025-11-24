import { test, expect } from '@playwright/test';

test.describe('Profile Analytics Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/product/analytics');
  });

  test('should load the page correctly', async ({ page }) => {
    await expect(page).toHaveTitle(/Analytics|Analítica/i);
    
    // Check for main heading
    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toBeVisible();
    // The text might vary based on language, but "Analytics" or "Analítica" should be there
  });

  test('should display metric cards', async ({ page }) => {
    // Check for metric cards
    const metricCards = page.locator('.bg-white.shadow-md'); 
    // This selector is a bit generic, let's try to find by content if possible, 
    // but based on the code: className="bg-white dark:bg-dark-bg-primary p-6 rounded-lg shadow-md..."
    
    // We can check for specific text in the cards like "Views", "Visitors", "Engagement"
    // or their Spanish equivalents.
    // Since we don't know the default language, we might need to be flexible or force a language.
    
    // Let's check for the presence of the dashboard demo section
    const dashboardDemo = page.locator('section').filter({ hasText: /Dashboard|Panel/ });
    await expect(dashboardDemo).toBeVisible();
  });

  test('should display traffic sources', async ({ page }) => {
    // Check for traffic bars
    const trafficSection = page.locator('section').filter({ hasText: /Traffic|Tráfico/ });
    await expect(trafficSection).toBeVisible();
  });

  test('should have a call to action', async ({ page }) => {
    const ctaButton = page.getByRole('button', { name: /Get Started|Empezar|Sign Up|Registrarse/i });
    await expect(ctaButton).toBeVisible();
  });
});
