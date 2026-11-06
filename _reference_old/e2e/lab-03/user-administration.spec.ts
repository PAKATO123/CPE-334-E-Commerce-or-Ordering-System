import { test, expect } from "@playwright/test";

/**
 * TokTickIT — End-to-End Test Suite: Administrator User Management (Lab 03)
 */

test.describe("Lab 03 E2E — Administrator User Management Flow", () => {
  const handlePasswordModalIfNeeded = async (page: any, defaultPass = "AdminPassword123!") => {
    const modalHeading = page.locator("h2, h3").filter({ hasText: "Mandatory Password Change" });
    if (await modalHeading.isVisible({ timeout: 1000 }).catch(() => false)) {
      await page.locator("#current-password-input").fill(defaultPass);
      await page.locator("#new-password-input").fill("NewComplexPass123!");
      await page.locator("#confirm-password-input").fill("NewComplexPass123!");
      await page.getByRole("button", { name: /Save New Password|Update Password/i }).click();
      await expect(modalHeading).not.toBeVisible({ timeout: 10000 });
    }
  };

  const adminLoginHelper = async (page: any) => {
    await page.goto("/");
    await page.locator("#email-input").fill("admin@toktickit.local");
    await page.locator("#password-input").fill("AdminPassword123!");
    await page.getByRole("button", { name: "Sign In" }).click();

    const isError = await page.locator("[data-testid='error-alert'], .tt-alert-error").isVisible({ timeout: 1500 }).catch(() => false);
    if (isError) {
      await page.locator("#password-input").fill("Password123!");
      await page.getByRole("button", { name: "Sign In" }).click();
    }
    await handlePasswordModalIfNeeded(page, isError ? "Password123!" : "AdminPassword123!");
  };

  test("Admin logs in, creates user, updates account details, resets initial password", async ({ page }) => {
    // 1. Admin Login
    await adminLoginHelper(page);

    await expect(page).toHaveURL(/\/staff\/queue/);

    // 2. Navigate to /admin/users
    await page.goto("/admin/users");
    const header = page.locator("h1");
    await expect(header).toBeVisible({ timeout: 10000 });
    await expect(header).toContainText("User Account Management");

    // 3. Open Add User Modal
    await page.getByTestId("add-user-button").click();

    const createModal = page.locator(".tt-modal, [role='dialog']");
    await expect(createModal).toBeVisible();

    const uniqueEmail = `e2euser_${Date.now()}@toktickit.local`;
    await page.getByTestId("create-user-name").fill("E2E Test User");
    await page.getByTestId("create-user-email").fill(uniqueEmail);
    await page.getByTestId("create-user-role").selectOption("IT_STAFF");
    await page.getByTestId("create-user-password").fill("Password123!");

    await page.getByTestId("submit-create-user").click();

    await expect(createModal).not.toBeVisible();
    await expect(page.locator("text=" + uniqueEmail)).toBeVisible();

    // 4. Edit User Details
    const userRow = page.locator("tr", { hasText: uniqueEmail });
    await userRow.getByRole("button", { name: "Edit" }).click();

    const editModal = page.locator(".tt-modal, [role='dialog']");
    await expect(editModal).toBeVisible();
    await page.getByTestId("edit-user-name").fill("E2E Test User Updated");
    await page.getByTestId("submit-edit-user").click();

    await expect(editModal).not.toBeVisible();
    await expect(page.locator("text=E2E Test User Updated").first()).toBeVisible();

    // 5. Reset Initial Password
    const updatedUserRow = page.locator("tr", { hasText: uniqueEmail });
    await updatedUserRow.getByRole("button", { name: "Reset Password" }).click();

    const resetModal = page.locator(".tt-modal, [role='dialog']");
    await expect(resetModal).toBeVisible();
    await page.getByTestId("reset-password-input").fill("NewInitialPassword1!");
    await page.getByTestId("submit-reset-password").click();

    await expect(resetModal).not.toBeVisible();
    await expect(page.locator(".tt-toast, [role='status']")).toBeVisible();
  });

  test("Admin self-deactivation attempt displays safety error banner", async ({ page }) => {
    await page.goto("/");
    await page.locator("#email-input").fill("admin@toktickit.local");
    await page.locator("#password-input").fill("AdminPassword123!");
    await page.getByRole("button", { name: "Sign In" }).click();
    await handlePasswordModalIfNeeded(page, "AdminPassword123!");

    await expect(page).toHaveURL(/\/staff\/queue/);

    await page.goto("/admin/users");
    const header = page.locator("h1");
    await expect(header).toBeVisible({ timeout: 10000 });
    await expect(header).toContainText("User Account Management");

    // Find row for admin@toktickit.local
    const adminRow = page.locator("tr", { hasText: "admin@toktickit.local" });
    await expect(adminRow).toBeVisible();
    await adminRow.getByRole("button", { name: "Edit" }).click();

    const editModal = page.locator(".tt-modal, [role='dialog']");
    await expect(editModal).toBeVisible();

    // Uncheck active status checkbox
    const activeCheckbox = page.getByTestId("edit-user-active");
    if (await activeCheckbox.isChecked()) {
      await activeCheckbox.uncheck();
    }

    await page.getByTestId("submit-edit-user").click();

    // Error notice should explain self-deactivation restriction
    const errorNotice = page.locator("[data-testid='edit-user-error'], .tt-toast, [role='status']");
    await expect(errorNotice).toBeVisible();
    await expect(errorNotice).toContainText(/deactivate/i);
  });

  test("Non-Admin user attempting to access Admin User Management screen is blocked", async ({ page }) => {
    // Login as IT Staff
    await page.goto("/");
    await page.locator("#email-input").fill("staff1@toktickit.local");
    await page.locator("#password-input").fill("Password123!");
    await page.getByRole("button", { name: "Sign In" }).click();
    await handlePasswordModalIfNeeded(page, "Password123!");

    await expect(page).toHaveURL(/\/staff\/queue/);

    // Attempt direct navigation to /admin/users
    await page.goto("/admin/users");

    // AdminGuard redirects non-admin user back to default authorized route (/staff/queue)
    await expect(page).toHaveURL(/\/staff\/queue/, { timeout: 10000 });
  });
});
