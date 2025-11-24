import { test, expect } from '@playwright/test';

/**
 * Dashboard Sections Test Suite
 * 
 * This suite tests the navigation and rendering of all dashboard sections.
 * Note: These tests require an authenticated session.
 */

test.describe('Dashboard Navigation & Sections', () => {
  // Pre-condition: User must be logged in
  // In a real environment, we would use a global setup or a helper to login
  // test.beforeEach(async ({ page }) => {
  //   await loginUser(page); 
  // });

  test('should navigate to Dashboard Home', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard$/);
    // Verify ModernDashboardView is rendered
    await expect(page.getByText(/Visits|Visitas/i)).toBeVisible();
  });

  test('should navigate to My Profile sections', async ({ page }) => {
    await page.goto('/dashboard');
    const myProfileBtn = page.locator('button[data-section-btn="mi-perfil"]');
    await myProfileBtn.click();
    
    // Should default to Identity
    await expect(page.getByLabel(/Full Name|Nombre Completo/i)).toBeVisible();

    // Test sub-navigation if visible (e.g. via sidebar or tabs)
  });

  test('should navigate to Templates', async ({ page }) => {
    await page.goto('/dashboard');
    await page.locator('button[data-section-btn="template"]').click();
    await expect(page.getByText(/Select Template|Seleccionar Plantilla/i)).toBeVisible();
  });

  test('should navigate to Visas', async ({ page }) => {
    await page.goto('/dashboard');
    await page.locator('button[data-section-btn="visas"]').click();
    await expect(page.getByText(/Visa Status|Estado de Visa/i)).toBeVisible();
  });

  test('should navigate to CV Versions', async ({ page }) => {
    await page.goto('/dashboard');
    await page.locator('button[data-section-btn="cv-versions"]').click();
    await expect(page.getByText(/Version History|Historial de Versiones/i)).toBeVisible();
  });

  test('should navigate to Export', async ({ page }) => {
    await page.goto('/dashboard');
    await page.locator('button[data-section-btn="exportar"]').click();
    await expect(page.getByText(/Download PDF|Descargar PDF/i)).toBeVisible();
  });

  test('should navigate to Analytics', async ({ page }) => {
    await page.goto('/dashboard');
    await page.locator('button[data-section-btn="analitica"]').click();
    // AnalyticsDashboard component
    await expect(page.getByText(/Profile Views|Vistas del Perfil/i)).toBeVisible();
  });

  test('should navigate to Leads', async ({ page }) => {
    await page.goto('/dashboard');
    await page.locator('button[data-section-btn="leads"]').click();
    await expect(page.getByText(/Messages|Mensajes/i)).toBeVisible();
  });

  test('should navigate to Stamps/Verifications', async ({ page }) => {
    await page.goto('/dashboard');
    await page.locator('button[data-section-btn="stamps"]').click();
    await expect(page.getByText(/Verified Stamps|Sellos Verificados/i)).toBeVisible();
  });

  test('should navigate to Settings', async ({ page }) => {
    await page.goto('/dashboard');
    await page.locator('button[data-section-btn="ajustes"]').click();
    await expect(page.getByText(/Account Settings|Configuración de Cuenta/i)).toBeVisible();
  });
});
