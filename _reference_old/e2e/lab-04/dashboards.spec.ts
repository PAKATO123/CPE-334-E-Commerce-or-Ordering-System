import { test, expect } from '@playwright/test';

/**
 * TokTickIT — End-to-End Test Suite: Role Dashboards (Lab 04)
 */

test.describe('Lab 04 E2E — Role Dashboards', () => {
  const loginAs = async (page: any, email: string, defaultPassword = "Password123!") => {
    await page.goto('/');
    const signOutBtn = page.getByRole("button", { name: "Sign Out" });
    if (await signOutBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await signOutBtn.click();
      await page.waitForTimeout(300);
    }

    const emailInput = page.locator("#email-input");
    await emailInput.waitFor({ state: "visible", timeout: 10000 });
    await emailInput.fill(email);
    await page.locator("#password-input").fill(defaultPassword);
    await page.getByRole("button", { name: "Sign In" }).click();

    const isError = await page.locator("[data-testid='error-alert'], .tt-alert-error").isVisible({ timeout: 1500 }).catch(() => false);
    if (isError) {
      await page.locator("#password-input").fill("NewPassword123!");
      await page.getByRole("button", { name: "Sign In" }).click();
    }

    await page.waitForURL(/\/(requester\/dashboard|staff\/dashboard|admin\/dashboard|staff\/queue)/, { timeout: 10000 });
  };

  test('Requester views dashboard, checks ticket metrics, and navigates via quick action links', async ({ page }) => {
    await loginAs(page, 'requester1@toktickit.local');
    await page.goto('/requester/dashboard');
    await expect(page).toHaveURL(/\/requester\/dashboard/);

    // Verify Dashboard Banner text
    await expect(page.locator('text=Welcome back')).toBeVisible();

    // Verify Metric Cards
    await expect(page.locator('text=Total Open Tickets')).toBeVisible();
    await expect(page.locator('text=Waiting for Your Input')).toBeVisible();

    // Quick Action link "+ Create New Ticket"
    const createBtn = page.getByRole('link', { name: /\+ Create New Ticket/i });
    await expect(createBtn).toBeVisible();
    await createBtn.click();
    await expect(page).toHaveURL(/\/requester\/tickets\/new/);
  });

  test('IT Staff views dashboard metrics, framed status breakdown badges, and drill-down links', async ({ page }) => {
    await loginAs(page, 'staff1@toktickit.local');
    await expect(page).toHaveURL(/\/staff\/(dashboard|queue)/);

    // Navigate to Staff Dashboard
    await page.goto('/staff/dashboard');
    await expect(page).toHaveURL(/\/staff\/dashboard/);

    // Verify Metric Cards
    await expect(page.locator('text=Unassigned Tickets')).toBeVisible();
    await expect(page.locator('text=Urgent & High Priority')).toBeVisible();

    // Verify framed status badges exist for ticket breakdown
    await expect(page.locator('text=Active Ticket Status Breakdown')).toBeVisible();

    // Click Unassigned metric card to test drill-down
    const unassignedCard = page.locator('div').filter({ hasText: /Unassigned Tickets/i }).last();
    await expect(unassignedCard).toBeVisible();
    await unassignedCard.click();
    await expect(page).toHaveURL(/\/staff\/queue/);
  });

  test('Administrator views dashboard with staff operational metrics and user account statistics', async ({ page }) => {
    await loginAs(page, 'admin@toktickit.local', 'AdminPassword123!');

    // Navigate to Admin Dashboard
    await page.goto('/admin/dashboard');
    await expect(page).toHaveURL(/\/admin\/dashboard/);

    // Verify User Accounts Summary
    await expect(page.locator('text=User Accounts Summary')).toBeVisible();
    await expect(page.getByText('Requesters', { exact: true })).toBeVisible();
  });
});
