import { test, expect } from '@playwright/test';

/**
 * TokTickIT — End-to-End Test Suite: Actions Taken Flow (Lab 04)
 */

test.describe('Lab 04 E2E — Actions Taken Flow', () => {
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

  test('IT Staff creates Action Taken with follow-up required, confirms modal mark done, and verifies status update', async ({ page }) => {
    // 1. Sign in as IT Staff
    await loginAs(page, 'staff1@toktickit.local');
    await expect(page).toHaveURL(/\/staff\/(dashboard|queue)/);

    // 2. Open Ticket Detail page (e.g. ticket 4)
    await page.goto('/staff/tickets/4');
    await expect(page).toHaveURL(/\/staff\/tickets\/4/);

    // 3. Click "+ Add Action Taken" button
    const addActionBtn = page.getByRole('button', { name: /\+ Add Action Taken/i });
    await expect(addActionBtn).toBeVisible();
    await addActionBtn.click();

    // 4. Fill in Action Description and Result
    await page.locator('textarea[placeholder*="action taken" i]').fill('Replaced network interface card and tested connectivity');
    await page.locator('textarea[placeholder*="result or outcome" i]').fill('Ping latency reduced below 2ms across all subnet nodes');

    // 5. Toggle Follow-Up Required and enter Follow-Up Note
    await page.locator('#followUpRequired').check();
    await page.locator('textarea[placeholder*="follow-up action" i]').fill('Re-verify packet loss rate after 24 hours');

    // 6. Submit the form
    await page.getByRole('button', { name: /Save Action|Create/i }).click();

    // 7. Verify the new action item appears in the list with Follow-Up Required badge
    await expect(page.locator('p:has-text("Replaced network interface card")').first()).toBeVisible();
    await expect(page.locator('text=Follow-Up Required').first()).toBeVisible();

    // 8. Click "Mark done" on the action entry
    const markDoneBtn = page.getByRole('button', { name: 'Mark done' }).first();
    await expect(markDoneBtn).toBeVisible();
    await markDoneBtn.click();

    // 9. Verify custom confirmation modal appears and click "Confirm Mark Done"
    const modal = page.locator('[data-testid="mark-done-confirmation-modal"]');
    await expect(modal).toBeVisible();
    await modal.getByRole('button', { name: 'Confirm Mark Done' }).click();
    await expect(modal).not.toBeVisible();
    await page.waitForTimeout(500);

    // 10. Verify badge transitions to Followed up state
    await expect(page.locator('span.tt-badge').filter({ hasText: "Followed up" }).first()).toBeVisible({ timeout: 10000 });
  });

  test('Requester views Actions Taken in read-only mode without edit or mark done controls', async ({ page }) => {
    // 1. Sign in as Requester
    await loginAs(page, 'requester1@toktickit.local');
    await expect(page).toHaveURL(/\/requester\/dashboard/);

    // 2. Open owned ticket detail page
    await page.goto('/requester/tickets/1');
    await expect(page).toHaveURL(/\/requester\/tickets\/1/);

    // 3. Verify Actions Taken section renders
    await expect(page.locator('text=Actions Taken').first()).toBeVisible();

    // 4. Verify "+ Add Action Taken" and "Mark done" buttons are NOT visible for Requesters
    await expect(page.getByRole('button', { name: /\+ Add Action Taken/i })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Mark done' })).not.toBeVisible();
  });
});
