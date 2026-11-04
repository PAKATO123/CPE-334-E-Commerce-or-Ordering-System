import { describe, it, expect, afterAll } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { getPrisma } from "../src/prisma.js";

describe("Feature 2: Product Catalog & Category Browsing (F-02)", () => {
  const prisma = getPrisma();

  afterAll(async () => {
    try {
      await prisma.$disconnect();
    } catch {}
  });

  // -------------------------------------------------------------------------
  // 1. Catalog Listing & Inactive Exclusion (TEST-CAT-01, TEST-CAT-02)
  // -------------------------------------------------------------------------

  it("TEST-CAT-01: retrieves all active products with SKU, name, USD price, and stock levels", async () => {
    const res = await request(app).get("/api/products");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(6);

    const proPhone = res.body.data.find((p: any) => p.sku === "PHON-PRO-256");
    expect(proPhone).toBeDefined();
    expect(proPhone.name).toBe("Flagship Pro Smartphone 256GB");
    expect(proPhone.category).toBe("Smartphones");
    expect(proPhone.price).toBe("899.00");
    expect(proPhone.stockQuantity).toBe(10);
    expect(proPhone.isActive).toBe(true);

    const keyboard = res.body.data.find((p: any) => p.sku === "KB-MECH-RGB");
    expect(keyboard).toBeDefined();
    expect(keyboard.name).toBe("Wireless Mechanical Keyboard");
    expect(keyboard.category).toBe("Keyboards");
    expect(keyboard.price).toBe("79.00");
    expect(keyboard.stockQuantity).toBe(15);
  });

  it("TEST-CAT-02: omits inactive products (isActive = false) from public catalog queries", async () => {
    const res = await request(app).get("/api/products");

    expect(res.status).toBe(200);
    const inactiveProduct = res.body.data.find((p: any) => p.sku === "DISCONT-OLD-GEN");
    expect(inactiveProduct).toBeUndefined();
  });

  it("returns out-of-stock devices with stockQuantity = 0 for UI Out-of-Stock badge rendering", async () => {
    const res = await request(app).get("/api/products");

    expect(res.status).toBe(200);
    const outOfStockDevice = res.body.data.find((p: any) => p.sku === "PHON-FLIP-LTD");
    expect(outOfStockDevice).toBeDefined();
    expect(outOfStockDevice.stockQuantity).toBe(0);
    expect(outOfStockDevice.price).toBe("999.00");
  });

  // -------------------------------------------------------------------------
  // 2. Category & Keyword Filtering
  // -------------------------------------------------------------------------

  it("filters products by category correctly", async () => {
    const res = await request(app).get("/api/products?category=Smartphones");

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    for (const item of res.body.data) {
      expect(item.category).toBe("Smartphones");
    }
  });

  it("filters products by keyword search across name, sku, and description", async () => {
    const res = await request(app).get("/api/products?search=Keyboard");

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].sku).toBe("KB-MECH-RGB");
  });

  // -------------------------------------------------------------------------
  // 3. Single Product Lookup & Distinct Categories
  // -------------------------------------------------------------------------

  it("fetches a single product by ID", async () => {
    // First get all to find an ID
    const listRes = await request(app).get("/api/products");
    const firstItem = listRes.body.data[0];

    const res = await request(app).get(`/api/products/${firstItem.id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(firstItem.id);
    expect(res.body.data.sku).toBe(firstItem.sku);
    expect(res.body.data.price).toBe(firstItem.price);
  });

  it("returns 404 when querying non-existent product ID", async () => {
    const res = await request(app).get("/api/products/99999");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("PRODUCT_NOT_FOUND");
  });

  it("returns 400 when product ID is not an integer", async () => {
    const res = await request(app).get("/api/products/abc");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_ID");
  });

  it("retrieves distinct active categories", async () => {
    const res = await request(app).get("/api/categories");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data).toContain("Smartphones");
    expect(res.body.data).toContain("Tablets");
    expect(res.body.data).toContain("Smart TVs");
    expect(res.body.data).toContain("Keyboards");
    expect(res.body.data).toContain("Chargers & Power");
  });
});

