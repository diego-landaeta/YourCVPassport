# E2E Tests with Playwright

This directory contains end-to-end tests for YourCVPassport using Playwright.

## Running Tests

### Prerequisites

Make sure Playwright browsers are installed:

```bash
npx playwright install chromium
```

### Running All Tests

```bash
npm test
```

### Running Tests in UI Mode (Recommended for Development)

```bash
npm run test:ui
```

This opens the Playwright UI where you can:
- See all tests
- Run individual tests
- See live test execution
- Debug failures

### Running Tests in Headed Mode (See Browser)

```bash
npm run test:headed
```

### Debugging Tests

```bash
npm run test:debug
```

This opens the Playwright Inspector for step-by-step debugging.

## Test Structure

- `login.spec.ts` - Tests for authentication flows (login, signup, magic link)

## Writing Tests

### Example Test

```typescript
import { test, expect } from '@playwright/test';

test('should do something', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/YourCVPassport/);
});
```

### Best Practices

1. **Use data-testid for stable selectors**:
   ```typescript
   await page.getByTestId('nav-users').click();
   ```

2. **Use role-based selectors when possible**:
   ```typescript
   await page.getByRole('button', { name: /log in/i }).click();
   ```

3. **Wait for navigation explicitly**:
   ```typescript
   await page.waitForURL(/.*dashboard/);
   ```

4. **Use beforeEach for common setup**:
   ```typescript
   test.beforeEach(async ({ page }) => {
     await page.goto('/login');
   });
   ```

## Environment Variables

For tests requiring authentication, create a `.env.test` file:

```env
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=testpassword123
```

## CI/CD Integration

Tests are configured to run in CI with:
- Automatic retries on failure
- Screenshot capture on failure
- Trace collection for debugging

## Reports

After running tests, view the HTML report:

```bash
npx playwright show-report
```
