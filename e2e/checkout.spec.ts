import { test, expect } from "@playwright/test";

/**
 * End-to-end: Full checkout flow in sandbox (UPI simulator) mode.
 *
 * Prerequisites (handled by the CI/CD setup in Phase 6):
 *   - App running at BASE_URL (default: http://localhost:3000)
 *   - Database seeded with at least one in-stock product
 *   - PAYMENT_MODE=sandbox (no real money charged)
 */

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

test.describe("Checkout flow (sandbox mode)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
  });

  test("homepage loads with product grid", async ({ page }) => {
    await expect(page).toHaveTitle(/Kalpa Living/i);
    // At least one product card should be visible
    const products = page.locator('[data-testid="product-card"], article, .product-card');
    // Allow time for server-side rendering
    await expect(products.first()).toBeVisible({ timeout: 10000 });
  });

  test("add to cart → cart shows item count", async ({ page }) => {
    // Navigate directly to the seeded product's detail page
    await page.goto(`${BASE_URL}/products/brass-diya-set-of-two`);

    // Click the "Add to cart" button
    const addBtn = page.getByRole("button", { name: /add to cart/i }).first();
    await expect(addBtn).toBeVisible({ timeout: 10000 });
    await addBtn.scrollIntoViewIfNeeded();
    await addBtn.click({ force: true });

    // Cart badge or indicator should update
    const cartIndicator = page
      .locator('[data-testid="cart-count"], [aria-label*="cart"], [href*="cart"]')
      .first();
    await expect(cartIndicator).toBeVisible({ timeout: 10000 });
  });

  test("checkout page renders with all required fields", async ({ page }) => {
    // Navigate to seeded product and add to cart so checkout has items
    await page.goto(`${BASE_URL}/products/brass-diya-set-of-two`);

    const addBtn = page.getByRole("button", { name: /add to cart/i }).first();
    await expect(addBtn).toBeVisible({ timeout: 10000 });
    await addBtn.scrollIntoViewIfNeeded();
    await addBtn.click({ force: true });

    // Ensure item added before navigating
    await expect(page.getByRole("button", { name: /added/i })).toBeVisible({ timeout: 5000 });

    // Navigate to checkout
    await page.goto(`${BASE_URL}/checkout`);
    await expect(page.getByRole("heading", { name: /checkout|your details|delivery/i })).toBeVisible({
      timeout: 10000,
    });

    // Verify key fields exist
    await expect(page.getByLabel(/name/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/phone/i)).toBeVisible();
  });

  test("order tracking page loads for a valid order number format", async ({ page }) => {
    // The track page should render even without a real order (shows form)
    await page.goto(`${BASE_URL}/track`);
    await expect(page.getByRole("heading", { name: /track/i })).toBeVisible({ timeout: 10000 });
    // Order number input field should be present
    await expect(page.getByLabel(/order number/i)).toBeVisible();
  });

  test("404 page renders for unknown routes", async ({ page }) => {
    await page.goto(`${BASE_URL}/this-page-definitely-does-not-exist-xyz-123`);
    // Should show our custom 404, not a raw Next.js error
    await expect(page.getByRole("heading", { name: /find that page|not found/i })).toBeVisible({ timeout: 10000 });
    // Should not expose raw stack traces
    await expect(page.getByText(/at Object\.|node_modules|Error:/)).not.toBeVisible();
  });
});

test.describe("Admin panel access control", () => {
  test("admin panel redirects unauthenticated users to login", async ({ page }) => {
    await page.goto(`${BASE_URL}/admin`);
    // Should redirect to /admin/login
    await expect(page).toHaveURL(/\/admin\/login/, { timeout: 10000 });
  });

  test("admin login page renders correctly", async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/login`);
    await expect(page.getByLabel(/password/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("button", { name: /sign in|login/i })).toBeVisible();
  });
});
