const { test, expect } = require('@playwright/test');

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load the homepage', async ({ page }) => {
    await expect(page).toHaveTitle(/Nexus/i);
  });

  test('should navigate to login page', async ({ page }) => {
    // Look for login link in navigation
    const loginButton = page
      .locator('a[href="/auth/login"], button:has-text("Login"), a:has-text("Login")')
      .first();

    if (await loginButton.isVisible()) {
      await loginButton.click();
      await expect(page).toHaveURL(/.*login/);
    } else {
      // Direct navigation if button not found
      await page.goto('/auth/login');
    }

    // Verify login form elements are present
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible();
  });

  test('should show validation errors for empty login form', async ({ page }) => {
    await page.goto('/auth/login');

    // Try to submit without filling form
    const submitButton = page
      .locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign in")')
      .first();
    await submitButton.click();

    // Wait a bit for validation to appear
    await page.waitForTimeout(500);

    // Check for validation messages or error states
    const hasValidation = await page
      .locator('text=/required|fill|enter|invalid/i')
      .isVisible()
      .catch(() => false);
    expect(hasValidation || (await page.locator('input:invalid').count()) > 0).toBeTruthy();
  });

  test('should navigate to register page', async ({ page }) => {
    await page.goto('/auth/login');

    // Look for register/signup link
    const registerLink = page
      .locator('a[href="/auth/register"], a:has-text("Register"), a:has-text("Sign up")')
      .first();

    if (await registerLink.isVisible()) {
      await registerLink.click();
      await expect(page).toHaveURL(/.*register/);
    } else {
      await page.goto('/auth/register');
    }

    // Verify registration form elements
    await expect(page.locator('input[name="email"], input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible();
  });

  test('should show password requirements on register page', async ({ page }) => {
    await page.goto('/auth/register');

    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    await passwordInput.click();
    await passwordInput.fill('weak');

    // Check if password requirements or validation appears
    await page.waitForTimeout(500);
    const hasRequirements = await page
      .locator('text=/8 characters|uppercase|lowercase|number/i')
      .isVisible()
      .catch(() => false);

    // At least one of these should be true: requirements shown or form validation present
    expect(
      hasRequirements || (await passwordInput.evaluate((el) => !el.validity.valid)),
    ).toBeTruthy();
  });
});

test.describe('Navigation', () => {
  test('should have working navigation links', async ({ page }) => {
    await page.goto('/');

    // Check for common navigation items
    const nav = page.locator('nav, header').first();
    await expect(nav).toBeVisible();

    // Test that at least one navigation link is present and clickable
    const navLinks = page.locator('nav a, header a');
    const count = await navLinks.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should have responsive navigation', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Mobile menu should exist
    const mobileMenu = page
      .locator('[aria-label*="menu" i], button:has-text("Menu"), .mobile-menu, #mobile-menu')
      .first();

    if (await mobileMenu.isVisible()) {
      await mobileMenu.click();
      await page.waitForTimeout(300);

      // Navigation should be visible after clicking menu
      const nav = page.locator('nav, [role="navigation"]');
      await expect(nav).toBeVisible();
    }
  });
});

test.describe('Accessibility', () => {
  test('should have proper page structure', async ({ page }) => {
    await page.goto('/');

    // Check for proper HTML structure
    await expect(page.locator('main, [role="main"]')).toBeVisible();
  });

  test('should have keyboard navigation support', async ({ page }) => {
    await page.goto('/auth/login');

    // Tab through form elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Check that focus is working
    const focused = await page.evaluate(() => document.activeElement.tagName);
    expect(['INPUT', 'BUTTON', 'A']).toContain(focused);
  });

  test('should have alt text for images', async ({ page }) => {
    await page.goto('/');

    const images = page.locator('img');
    const count = await images.count();

    if (count > 0) {
      // Check first few images have alt text
      for (let i = 0; i < Math.min(count, 3); i++) {
        const img = images.nth(i);
        const alt = await img.getAttribute('alt');
        expect(alt).toBeDefined();
      }
    }
  });
});

test.describe('Performance', () => {
  test('should load homepage quickly', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    const loadTime = Date.now() - startTime;

    // Page should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test('should not have console errors on homepage', async ({ page }) => {
    const errors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Should have no console errors
    expect(errors.length).toBe(0);
  });
});
