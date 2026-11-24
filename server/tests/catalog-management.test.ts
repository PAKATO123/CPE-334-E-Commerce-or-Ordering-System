import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { getPrisma } from "../src/prisma.js";

describe("Feature 6: Catalog Curation & Inventory Restocking (F-06)", () => {
  const prisma = getPrisma();
  let adminAgent: any;
  let operatorAgent: any;
  let customerAgent: any;

  const TEST_SKU_PREFIX = "TEST-MGMT-";

  beforeAll(async () => {
    // Log in as Admin
    adminAgent = request.agent(app);
    await adminAgent.post("/api/auth/login").send({
      email: "admin@example.com",
      password: "Password123!",
    });

    // Log in as Operator
    operatorAgent = request.agent(app);
    await operatorAgent.post("/api/auth/login").send({
      email: "operator1@example.com",
      password: "Password123!",
    });

    // Log in as Customer
    customerAgent = request.agent(app);
    await customerAgent.post("/api/auth/login").send({
      email: "customer1@example.com",
      password: "Password123!",
    });

    // Clean up any test products
    try {
      await prisma.product.deleteMany({
        where: { sku: { startsWith: TEST_SKU_PREFIX } },
      });
    } catch {}
  });

  afterAll(async () => {
    try {
      await prisma.product.deleteMany({
        where: { sku: { startsWith: TEST_SKU_PREFIX } },
      });
      await prisma.$disconnect();
    } catch {}
  });

  // -------------------------------------------------------------------------
  // 1. Product Creation (AC-CAT-MGMT-01, AC-CAT-MGMT-02, AC-CAT-MGMT-03)
  // -------------------------------------------------------------------------

  it("TEST-CAT-M01: allows Operator or Admin to create a new product with valid specifications (AC-CAT-MGMT-01)", async () => {
    const sku = `${TEST_SKU_PREFIX}CHG-45W`;
    const res = await adminAgent.post("/api/products").send({
      sku,
      name: "45W Super Fast USB-C Charger",
      category: "Chargers & Power",
      description: "Dual-port GaN power adapter with foldable plug.",
      price: 34.99,
      stockQuantity: 25,
    });

    expect(res.status).toBe(201);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.id).toBeTypeOf("number");
    expect(res.body.data.sku).toBe(sku);
    expect(res.body.data.name).toBe("45W Super Fast USB-C Charger");
    expect(res.body.data.category).toBe("Chargers & Power");
    expect(res.body.data.price).toBe("34.99");
    expect(res.body.data.stockQuantity).toBe(25);
    expect(res.body.data.isActive).toBe(true);

    // Verify database persistence
    const saved = await prisma.product.findUnique({ where: { sku } });
    expect(saved).not.toBeNull();
    expect(saved?.name).toBe("45W Super Fast USB-C Charger");
  });

  it("TEST-CAT-M02: rejects creation with an already existing SKU with 409 Conflict (AC-CAT-MGMT-02)", async () => {
    // Attempting to create product with existing seed SKU
    const res = await adminAgent.post("/api/products").send({
      sku: "PHON-PRO-256",
      name: "Duplicate Phone Name",
      category: "Smartphones",
      price: 899.0,
      stockQuantity: 10,
    });

    expect(res.status).toBe(409);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe("SKU_ALREADY_EXISTS");
  });

  it("TEST-CAT-M03: rejects invalid price (zero/negative) or negative stock with 400 Bad Request (AC-CAT-MGMT-03)", async () => {
    // Zero price
    const resZeroPrice = await adminAgent.post("/api/products").send({
      sku: `${TEST_SKU_PREFIX}BAD-PRICE-1`,
      name: "Zero Price Device",
      category: "Smartphones",
      price: 0,
      stockQuantity: 10,
    });
    expect(resZeroPrice.status).toBe(400);
    expect(resZeroPrice.body.error.code).toBe("VALIDATION_ERROR");

    // Negative price
    const resNegPrice = await adminAgent.post("/api/products").send({
      sku: `${TEST_SKU_PREFIX}BAD-PRICE-2`,
      name: "Negative Price Device",
      category: "Smartphones",
      price: -15.99,
      stockQuantity: 10,
    });
    expect(resNegPrice.status).toBe(400);
    expect(resNegPrice.body.error.code).toBe("VALIDATION_ERROR");

    // Negative stock
    const resNegStock = await adminAgent.post("/api/products").send({
      sku: `${TEST_SKU_PREFIX}BAD-STOCK`,
      name: "Negative Stock Device",
      category: "Keyboards",
      price: 49.99,
      stockQuantity: -5,
    });
    expect(resNegStock.status).toBe(400);
    expect(resNegStock.body.error.code).toBe("VALIDATION_ERROR");
  });

  // -------------------------------------------------------------------------
  // 2. Product Updates & Soft-Deletion Toggle (AC-CAT-MGMT-04)
  // -------------------------------------------------------------------------

  it("TEST-CAT-M04: allows updating product details and toggling active status (AC-CAT-MGMT-04)", async () => {
    // Create product first
    const sku = `${TEST_SKU_PREFIX}TOGGLE-PROD`;
    const createRes = await operatorAgent.post("/api/products").send({
      sku,
      name: "Toggle Test Headset",
      category: "Keyboards",
      price: 59.0,
      stockQuantity: 12,
    });
    const productId = createRes.body.data.id;

    // Update metadata and set isActive: false
    const updateRes = await operatorAgent.patch(`/api/products/${productId}`).send({
      name: "Updated Wireless Headset",
      price: 65.5,
      isActive: false,
    });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.name).toBe("Updated Wireless Headset");
    expect(updateRes.body.data.price).toBe("65.50");
    expect(updateRes.body.data.isActive).toBe(false);

    // Verify public customer catalog excludes it
    const publicCat = await request(app).get("/api/products");
    const foundPublic = publicCat.body.data.find((p: any) => p.id === productId);
    expect(foundPublic).toBeUndefined();

    // Verify operator query with includeInactive=true includes it
    const adminCat = await operatorAgent.get("/api/products?includeInactive=true");
    const foundAdmin = adminCat.body.data.find((p: any) => p.id === productId);
    expect(foundAdmin).toBeDefined();
    expect(foundAdmin.isActive).toBe(false);
  });

  // -------------------------------------------------------------------------
  // 3. Atomic Restocking (AC-CAT-MGMT-05)
  // -------------------------------------------------------------------------

  it("TEST-CAT-M05: atomically increments inventory stock quantity (AC-CAT-MGMT-05)", async () => {
    // Create a product with initial stock = 5
    const sku = `${TEST_SKU_PREFIX}RESTOCK-ITEM`;
    const createRes = await operatorAgent.post("/api/products").send({
      sku,
      name: "Mechanical Numpad",
      category: "Keyboards",
      price: 25.0,
      stockQuantity: 5,
    });
    const productId = createRes.body.data.id;

    // Restock with +15 units
    const restockRes = await operatorAgent.post(`/api/products/${productId}/restock`).send({
      quantity: 15,
    });

    expect(restockRes.status).toBe(200);
    expect(restockRes.body.data).toEqual({
      id: productId,
      sku,
      name: "Mechanical Numpad",
      previousStock: 5,
      restockedAmount: 15,
      newStock: 20,
    });

    // Check database
    const inDb = await prisma.product.findUnique({ where: { id: productId } });
    expect(inDb?.stockQuantity).toBe(20);
  });

  // -------------------------------------------------------------------------
  // 4. Role Authorization & Access Control (AC-CAT-MGMT-06)
  // -------------------------------------------------------------------------

  it("TEST-CAT-M06: rejects Customer and unauthenticated requests with 401 or 403 (AC-CAT-MGMT-06)", async () => {
    const payload = {
      sku: `${TEST_SKU_PREFIX}UNAUTH`,
      name: "Unauthorized Add",
      category: "Smartphones",
      price: 100.0,
      stockQuantity: 10,
    };

    // Anonymous request ➔ 401 Unauthorized
    const unauthRes = await request(app).post("/api/products").send(payload);
    expect(unauthRes.status).toBe(401);

    // Customer request ➔ 403 Forbidden
    const customerRes = await customerAgent.post("/api/products").send(payload);
    expect(customerRes.status).toBe(403);
    expect(customerRes.body.error.code).toBe("FORBIDDEN");

    // Customer patching product ➔ 403 Forbidden
    const customerPatch = await customerAgent.patch("/api/products/1").send({ price: 1.0 });
    expect(customerPatch.status).toBe(403);

    // Customer restocking product ➔ 403 Forbidden
    const customerRestock = await customerAgent.post("/api/products/1/restock").send({ quantity: 10 });
    expect(customerRestock.status).toBe(403);
  });
});
