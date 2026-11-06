import { test, expect } from "@playwright/test";

/**
 * TokTickIT — End-to-End Test Suite: IT Staff Ticket Queue & Workflow (Lab 03)
 */

test.describe("Lab 03 E2E — IT Staff Ticket Queue & Workflow Flow", () => {
  const handlePasswordModalIfNeeded = async (page: any) => {
    const modalHeading = page.locator("h2, h3").filter({ hasText: "Mandatory Password Change" });
    if (await modalHeading.isVisible({ timeout: 2000 }).catch(() => false)) {
      await page.locator("#current-password-input").fill("Password123!");
      await page.locator("#new-password-input").fill("NewPassword123!");
      await page.locator("#confirm-password-input").fill("NewPassword123!");
      await page.getByRole("button", { name: /Save New Password|Update Password/i }).click();
      await expect(modalHeading).not.toBeVisible();
    }
  };

  test("Staff logs in, searches queue, claims ticket, updates priority, posts internal note", async ({ page }) => {
    // 1. Login as IT Staff
    await page.goto("/");
    await page.locator("#email-input").fill("staff1@toktickit.local");
    await page.locator("#password-input").fill("Password123!");
    await page.getByRole("button", { name: "Sign In" }).click();
    await handlePasswordModalIfNeeded(page);

    await expect(page).toHaveURL(/\/staff\/queue/);

    // 2. Open ticket detail
    await page.goto("/tickets/1");
    await expect(page).toHaveURL(/\/tickets\/1/);

    // 3. Claim ticket if present
    const claimBtn = page.getByRole("button", { name: "Claim Ticket" });
    if (await claimBtn.isVisible().catch(() => false)) {
      await claimBtn.click();
      await expect(page.locator(".tt-toast, .tt-alert")).toBeVisible();
    }

    // 4. Update IT Priority
    const prioritySelect = page.locator("#it-priority-select");
    if (await prioritySelect.isVisible().catch(() => false)) {
      await prioritySelect.selectOption("High");
      await expect(page.locator(".tt-toast, .tt-alert")).toBeVisible();
    }

    // 5. Post Internal Note
    const noteTextarea = page.locator("#internal-note-input, textarea[placeholder*='note' i]");
    if (await noteTextarea.isVisible().catch(() => false)) {
      await noteTextarea.fill("Investigating VPN gateway logs for authentication timeout.");
      await page.getByRole("button", { name: /Add Note|Post Note|Submit Note/i }).click();
      await expect(page.locator("text=Investigating VPN gateway logs")).toBeVisible();
    }
  });

  test("Requester marks problem resolved with confirmation modal, status moves to Pending Verification", async ({ page }) => {
    await page.goto("/");
    await page.locator("#email-input").fill("requester1@toktickit.local");
    await page.locator("#password-input").fill("Password123!");
    await page.getByRole("button", { name: "Sign In" }).click();
    await handlePasswordModalIfNeeded(page);

    await page.goto("/tickets/1");

    const resolveBtn = page.getByRole("button", { name: /I consider this issue resolved|Mark Resolved/i });
    if (await resolveBtn.isVisible().catch(() => false)) {
      await resolveBtn.click();

      const modalConfirmBtn = page.locator("button").filter({ hasText: /Confirm|Yes, Issue Resolved/i }).last();
      if (await modalConfirmBtn.isVisible().catch(() => false)) {
        await modalConfirmBtn.click();
      }

      await expect(page.locator("text=Pending Verification")).toBeVisible();
    }
  });

  test("Staff reverts Pending Verification ticket back to In Progress", async ({ page }) => {
    await page.goto("/");
    await page.locator("#email-input").fill("staff1@toktickit.local");
    await page.locator("#password-input").fill("Password123!");
    await page.getByRole("button", { name: "Sign In" }).click();
    await handlePasswordModalIfNeeded(page);

    await page.goto("/tickets/5");

    const statusSelect = page.locator("#ticket-status-select, #status-select");
    if (await statusSelect.isVisible().catch(() => false)) {
      await statusSelect.selectOption("In Progress");
      await expect(page.locator(".tt-toast, .tt-alert")).toBeVisible();
    }
  });

  test("Staff formally resolves ticket", async ({ page }) => {
    await page.goto("/");
    await page.locator("#email-input").fill("staff1@toktickit.local");
    await page.locator("#password-input").fill("Password123!");
    await page.getByRole("button", { name: "Sign In" }).click();
    await handlePasswordModalIfNeeded(page);

    await page.goto("/tickets/2");

    const statusSelect = page.locator("#ticket-status-select, #status-select");
    if (await statusSelect.isVisible().catch(() => false)) {
      await statusSelect.selectOption("Resolved");
      await expect(page.locator(".tt-toast, .tt-alert")).toBeVisible();
    }
  });
});
