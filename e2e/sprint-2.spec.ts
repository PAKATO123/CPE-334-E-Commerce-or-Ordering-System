import { randomUUID } from "node:crypto";
import { expect, test, type Locator, type Page } from "@playwright/test";

const customer = "customer1@example.com";
const operator = "operator1@example.com";

async function signIn(page: Page, email: string) {
  const password = process.env.DEMO_USER_PASSWORD;
  if (!password) throw new Error("Set DEMO_USER_PASSWORD to the password used to seed the disposable database.");
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await expect(page.getByRole("button", { name: "Sign Out" })).toBeVisible();
}

function productDetails(prefix: string) {
  const key = randomUUID().slice(0, 8);
  return { sku: `E2E-${key.toUpperCase()}`, name: `${prefix} ${key}`, category: "Keyboards", price: 24.5, stockQuantity: 5 };
}

async function seedProduct(operatorPage: Page, prefix: string) {
  const product = productDetails(prefix);
  const created = await operatorPage.request.post("/api/products", { data: product });
  expect(created.status()).toBe(201);
  return { ...product, id: (await created.json()).data.id as number };
}

function productCard(page: Page, sku: string) {
  return page.getByTestId(`product-card-${sku}`);
}

async function recordScreenshot(target: Page | Locator, name: string) {
  const path = test.info().outputPath(`${name}.png`);
  await target.screenshot({ path });
  await test.info().attach(name, { path, contentType: "image/png" });
}

async function placeOrder(page: Page, sku: string) {
  await page.goto("/");
  await productCard(page, sku).getByRole("button", { name: "Add to Order" }).click();
  await page.getByTestId("header-cart-button").click();
  await page.getByRole("button", { name: "Place Order Now" }).click();
  const confirmed = page.getByTestId("confirmed-order-number");
  await expect(confirmed).toHaveText(/^ORD-/);
  const orderNumber = (await confirmed.innerText()).trim();
  await page.getByTestId("view-orders-btn").click();
  await expect(page).toHaveURL(/\/orders\/\d+$/);
  await expect(page.getByTestId("order-receipt-status")).toContainText("Pending");
  return orderNumber;
}

test("Sprint 1 checkout, history and receipt survive operator acceptance", async ({ page, browser, baseURL }) => {
  const staff = await browser.newPage({ baseURL });
  try {
    await signIn(staff, operator);
    const product = await seedProduct(staff, "Checkout Accessory");
    await signIn(page, customer);
    const order = await placeOrder(page, product.sku);
    const receipt = page.url();
    await expect(page.getByTestId("order-receipt-grand-total")).toContainText("24.50");
    await page.getByRole("link", { name: "My Orders" }).click();
    await expect(page.getByText(order, { exact: true })).toBeVisible();
    await staff.goto("/operator/orders");
    const accepted = staff.waitForResponse((response) =>
      response.request().method() === "PATCH" && response.url().endsWith("/status")
    );
    await staff.getByRole("button", { name: `Accept order ${order}`, exact: true }).click();
    expect((await accepted).status()).toBe(200);
    await page.goto(receipt);
    await expect(page.getByTestId("order-receipt-status")).toContainText("Accepted");
    await expect(page.getByTestId("order-receipt-grand-total")).toContainText("24.50");
    await recordScreenshot(page, "accepted-customer-receipt");
  } finally {
    await staff.close();
  }
});

test("F-06 catalog management persists stock and controls customer visibility", async ({ page, browser, baseURL }) => {
  const storefront = await browser.newPage({ baseURL });
  try {
    await signIn(page, operator);
    await page.getByRole("link", { name: "Manage Products" }).click();
    const product = productDetails("Warehouse Accessory");
    await page.getByTestId("add-product-btn").click();
    await page.getByTestId("input-new-sku").fill(product.sku);
    await page.getByTestId("input-new-name").fill(product.name);
    await page.getByTestId("input-new-category").selectOption(product.category);
    await page.getByTestId("input-new-price").fill(String(product.price));
    await page.getByTestId("input-new-stock").fill(String(product.stockQuantity));
    await page.getByTestId("submit-new-product-btn").click();
    const row = page.getByRole("row").filter({ hasText: product.sku });
    await expect(row).toBeVisible();
    await storefront.goto("/");
    await expect(productCard(storefront, product.sku)).toBeVisible();
    await row.getByRole("button", { name: "Restock" }).click();
    await page.getByTestId("input-restock-qty").fill("3");
    await page.getByTestId("submit-restock-btn").click();
    await expect(page.getByTestId("restock-modal")).toBeHidden();
    await page.reload();
    await expect(row.getByRole("cell", { name: "8", exact: true })).toBeVisible();
    await storefront.reload();
    await expect(productCard(storefront, product.sku)).toContainText("In Stock (8)");
    await recordScreenshot(productCard(storefront, product.sku), "restocked-customer-catalog");
    await row.getByRole("button", { name: "Edit" }).click();
    await page.getByTestId("input-edit-is-active").uncheck();
    await page.getByTestId("submit-edit-product-btn").click();
    await expect(row).toContainText("Discontinued");
    await storefront.reload();
    await expect(productCard(storefront, product.sku)).toHaveCount(0);
    const catalog = await storefront.request.get(`/api/products?search=${encodeURIComponent(product.sku)}`);
    expect(catalog.ok()).toBeTruthy();
    expect((await catalog.json()).data).toEqual([]);
  } finally {
    await storefront.close();
  }
});

test("F-07/F-08 paid customer cancellation persists refund and restores stock", async ({ page, browser, baseURL }) => {
  const staff = await browser.newPage({ baseURL });
  try {
    await signIn(staff, operator);
    const product = await seedProduct(staff, "Refund Accessory");
    await signIn(page, customer);
    await placeOrder(page, product.sku);
    const receipt = new URL(page.url()).pathname;
    await page.getByTestId("pay-now-btn").click();
    await page.getByTestId("pay-method-card").check();
    await page.getByTestId("confirm-pay-btn").click();
    await expect(page.getByTestId("pay-order-modal")).toBeHidden();
    const paymentBadges = page.getByTestId("order-receipt-payment-status");
    await expect(paymentBadges).toHaveText([/\bPaid\b/, /\bPaid\b/]);
    await page.getByTestId("cancel-order-btn").click();
    await page.getByTestId("cancel-reason-input").fill("Browser verification");
    await page.getByTestId("confirm-cancel-btn").click();
    await expect(paymentBadges).toHaveText([/Refunded/, /Refunded/]);
    await page.reload();
    await expect(page.getByTestId("order-receipt-status")).toContainText("Cancelled");
    await expect(paymentBadges).toHaveText([/Refunded/, /Refunded/]);
    await recordScreenshot(page, "persisted-cancellation-and-refund");
    const saved = await page.request.get(`/api${receipt}`);
    expect((await saved.json()).data).toMatchObject({
      status: "CANCELLED", paymentStatus: "REFUNDED", refundedAt: expect.any(String),
    });
    const repeat = await page.request.post(`/api${receipt}/pay`, { data: { paymentMethod: "SIMULATED_CARD" } });
    expect(repeat.status()).toBe(422);
    expect((await repeat.json()).error.code).toBe("CANNOT_PAY_TERMINAL_ORDER");
    await page.goto("/");
    await expect(productCard(page, product.sku)).toContainText("In Stock (5)");
  } finally {
    await staff.close();
  }
});
