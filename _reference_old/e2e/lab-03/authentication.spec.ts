import { test, expect } from "@playwright/test";

/**
 * TokTickIT — End-to-End Test Suite: Authentication & Mandatory Password Change (Lab 03)
 */

test.describe("Lab 03 E2E — Authentication & Mandatory Password Change Flow", () => {
  test("User logs in with credentials, handles mandatory password change if required, then enters app shell", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h2")).toContainText("Sign In to TokTickIT");

    await page.locator("#email-input").fill("requester1@toktickit.local");
    await page.locator("#password-input").fill("Password123!");
    await page.getByRole("button", { name: "Sign In" }).click();

    const modalHeading = page.locator("h2, h3, [data-testid='change-password-modal']").filter({ hasText: /Mandatory Password Change/i });
    if (await modalHeading.isVisible({ timeout: 3000 }).catch(() => false)) {
      await page.locator("[data-testid='current-password-input'], #current-password-input").fill("Password123!");
      await page.locator("[data-testid='new-password-input'], #new-password-input").fill("NewPassword123!");
      await page.locator("[data-testid='confirm-password-input'], #confirm-password-input").fill("NewPassword123!");
      await page.getByRole("button", { name: /Save New Password|Update Password/i }).click();
      await expect(modalHeading).not.toBeVisible({ timeout: 10000 });
    }

    await expect(page).toHaveURL(/\/tickets/);
  });

  test("Deactivated user login attempt is rejected", async ({ page }) => {
    await page.goto("/");
    await page.locator("#email-input").fill("staff4@toktickit.local");
    await page.locator("#password-input").fill("Password123!");
    await page.getByRole("button", { name: "Sign In" }).click();

    const errorAlert = page.locator("[data-testid='error-alert'], .tt-alert-error");
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText(/deactivated/i);
  });

  test("User logs out and session is destroyed", async ({ page }) => {
    await page.goto("/");
    await page.locator("#email-input").fill("staff1@toktickit.local");
    await page.locator("#password-input").fill("Password123!");
    await page.getByRole("button", { name: "Sign In" }).click();

    const isLoginError = await page.locator("[data-testid='error-alert'], .tt-alert-error").isVisible({ timeout: 1500 }).catch(() => false);
    if (isLoginError) {
      await page.locator("#password-input").fill("NewPassword123!");
      await page.getByRole("button", { name: "Sign In" }).click();
    }

    const modalHeading = page.locator("[data-testid='change-password-modal']");
    if (await modalHeading.isVisible({ timeout: 2000 }).catch(() => false)) {
      const curPass = isLoginError ? "NewPassword123!" : "Password123!";
      await page.locator("[data-testid='current-password-input']").fill(curPass);
      await page.locator("[data-testid='new-password-input']").fill("BrandNewPass123!");
      await page.locator("[data-testid='confirm-password-input']").fill("BrandNewPass123!");
      await page.getByRole("button", { name: /Save New Password|Update Password/i }).click();
      await expect(modalHeading).not.toBeVisible({ timeout: 10000 });
    }

    await expect(page).toHaveURL(/\/(staff\/queue|tickets)/);
    await page.getByRole("button", { name: "Sign Out" }).click();
    await expect(page.locator("h2")).toContainText("Sign In to TokTickIT");
  });
});
