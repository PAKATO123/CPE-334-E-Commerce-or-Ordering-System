import { test, expect } from '@playwright/test';

/**
 * TokTickIT — End-to-End Test Suite: Ticket Resolution Flow (Lab 04)
 */

test.describe('Lab 04 E2E — Ticket Resolution Flow', () => {
  const loginAs = async (page: any, email: string) => {
    await page.goto('/');
    const signOutBtn = page.getByRole("button", { name: "Sign Out" });
    if (await signOutBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await signOutBtn.click();
      await page.waitForTimeout(300);
    }

    const emailInput = page.locator("#email-input");
    await emailInput.waitFor({ state: "visible", timeout: 10000 });
    let activePass = "Password123!";
    await emailInput.fill(email);
    await page.locator("#password-input").fill(activePass);
    await page.getByRole("button", { name: "Sign In" }).click();

    const isError = await page.locator("[data-testid='error-alert'], .tt-alert-error").isVisible({ timeout: 1500 }).catch(() => false);
    if (isError) {
      activePass = "NewPassword123!";
      await page.locator("#password-input").fill(activePass);
      await page.getByRole("button", { name: "Sign In" }).click();
    }

    const modalHeading = page.locator("h2, h3, [data-testid='change-password-modal']").filter({ hasText: /Mandatory Password Change/i });
    if (await modalHeading.isVisible({ timeout: 2000 }).catch(() => false)) {
      await page.locator("#current-password-input, [data-testid='current-password-input']").fill(activePass);
      await page.locator("#new-password-input, [data-testid='new-password-input']").fill("Password123!");
      await page.locator("#confirm-password-input, [data-testid='confirm-password-input']").fill("Password123!");
      await page.getByRole("button", { name: /Save New Password|Update Password/i }).click();
      await expect(modalHeading).not.toBeVisible({ timeout: 10000 });
    }

    await page.waitForURL(/\/(requester\/dashboard|staff\/dashboard|admin\/dashboard|staff\/queue)/, { timeout: 10000 });
  };

  test('IT Staff transitions ticket status to Resolved directly via permitted state machine', async ({ page }) => {
    await loginAs(page, 'staff1@toktickit.local');

    await page.goto('/staff/tickets/2');
    await expect(page).toHaveURL(/\/staff\/tickets\/2/);

    const statusSelect = page.locator('#status-select, #ticket-status-select');
    await expect(statusSelect).toBeVisible();
    await statusSelect.selectOption('Resolved');
    await expect(page.locator('.tt-toast, .tt-alert').first()).toBeVisible();
  });

  test('Requester considers problem resolved, updating advisory flag while status remains managed by staff', async ({ page }) => {
    await loginAs(page, 'requester1@toktickit.local');

    await page.goto('/requester/tickets/1');
    await expect(page).toHaveURL(/\/requester\/tickets\/1/);

    const resolveBtn = page.getByTestId('request-resolution-button');
    await expect(resolveBtn).toBeVisible();
    await resolveBtn.click();

    const modalConfirmBtn = page.getByTestId('confirm-resolution-button');
    await expect(modalConfirmBtn).toBeVisible();
    await modalConfirmBtn.click();

    await expect(page.getByText(/Pending Verification|Requester consider/i).first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId('resolution-requested-badge')).toBeVisible();
  });
});
