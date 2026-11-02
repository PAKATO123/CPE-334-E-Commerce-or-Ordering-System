import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { getPrisma } from "../src/prisma.js";
import { generateOrderNumber } from "../src/utils/orderNumber.js";

describe("Feature 3: Multi-Item Order Assembly & Atomic Persistence (F-03)", () => {
  const prisma = getPrisma();

  // Helper to get authenticated supertest session agent
  async function loginAsCustomer() {
    const agent = request.agent(app);
    const loginRes = await agent
      .post("/api/auth/login")
      .send({ email: "customer1@example.com", password: "Password123!" });
    expect(loginRes.status).toBe(200);
    return agent;
  }

  async function loginAsOperator() {
    const agent = request.agent(app);
    const loginRes = await agent
      .post("/api/auth/login")
      .send({ email: "operator1@example.com", password: "Password123!" });
    expect(loginRes.status).toBe(200);
    return agent;
  }

  // Restore initial product stocks before tests
  beforeEach(async () => {
    try {
      await prisma.product.update({
        where: { sku: "PHON-PRO-256" },
        data: { stockQuantity: 10, price: 899.00 },
      });
      await prisma.product.update({
        where: { sku: "KB-MECH-RGB" },
        data: { stockQuantity: 15, price: 79.00 },
      });
      await prisma.product.update({
        where: { sku: "TAB-ULTRA-11" },
        data: { stockQuantity: 8, price: 549.00 },
      });
      await prisma.product.update({
        where: { sku: "CHG-GAN-65W" },
        data: { stockQuantity: 25, price: 29.00 },
      });
      await prisma.product.update({
        where: { sku: "PHON-FLIP-LTD" },
        data: { stockQuantity: 0, price: 999.00 },
      });
    } catch {}
  });

  afterAll(async () => {
    try {
      // Clean up test orders created during tests
      await prisma.orderItem.deleteMany({});
      await prisma.order.deleteMany({});
      // Reset product stock levels
      await prisma.product.update({
        where: { sku: "PHON-PRO-256" },
        data: { stockQuantity: 10 },
      });
      await prisma.product.update({
        where: { sku: "KB-MECH-RGB" },
        data: { stockQuantity: 15 },
      });
      await prisma.product.update({
        where: { sku: "TAB-ULTRA-11" },
        data: { stockQuantity: 8 },
      });
      await prisma.product.update({
        where: { sku: "CHG-GAN-65W" },
        data: { stockQuantity: 25 },
      });
      await prisma.$disconnect();
    } catch {}
  });

  // -------------------------------------------------------------------------
  // 1. Order Number Format (TEST-ORD-03)
  // -------------------------------------------------------------------------

  it("TEST-ORD-03: generates order number conforming to regex ^ORD-\\d{8}-\\d{4}$", async () => {
    const orderNumber = await generateOrderNumber(prisma);
    expect(orderNumber).toMatch(/^ORD-\d{8}-\d{4}$/);
  });

  // -------------------------------------------------------------------------
  // 2. Order Creation & Stock Decrement (TEST-ORD-01, TEST-ORD-02)
  // -------------------------------------------------------------------------

  it("TEST-ORD-01: authenticated customer creates a multi-item order with status PENDING", async () => {
    const customer = await loginAsCustomer();

    const phone = await prisma.product.findUniqueOrThrow({ where: { sku: "PHON-PRO-256" } });
    const keyboard = await prisma.product.findUniqueOrThrow({ where: { sku: "KB-MECH-RGB" } });

    const res = await customer.post("/api/orders").send({
      items: [
        { productId: phone.id, quantity: 1 },
        { productId: keyboard.id, quantity: 2 },
      ],
    });

    expect(res.status).toBe(201);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.orderNumber).toMatch(/^ORD-\d{8}-\d{4}$/);
    expect(res.body.data.status).toBe("PENDING");
    // Authoritative total: 899.00 * 1 + 79.00 * 2 = 1057.00
    expect(res.body.data.totalAmount).toBe("1057.00");
    expect(res.body.data.items.length).toBe(2);

    const phoneItem = res.body.data.items.find((i: any) => i.productId === phone.id);
    expect(phoneItem.quantity).toBe(1);
    expect(phoneItem.unitPrice).toBe("899.00");
    expect(phoneItem.subtotal).toBe("899.00");

    const kbItem = res.body.data.items.find((i: any) => i.productId === keyboard.id);
    expect(kbItem.quantity).toBe(2);
    expect(kbItem.unitPrice).toBe("79.00");
    expect(kbItem.subtotal).toBe("158.00");
  });

  it("TEST-ORD-02: decrements product stock atomically upon order placement", async () => {
    const customer = await loginAsCustomer();
    const keyboard = await prisma.product.findUniqueOrThrow({ where: { sku: "KB-MECH-RGB" } });
    expect(keyboard.stockQuantity).toBe(15);

    const res = await customer.post("/api/orders").send({
      items: [{ productId: keyboard.id, quantity: 2 }],
    });

    expect(res.status).toBe(201);

    // Verify stock is now 13
    const updatedKeyboard = await prisma.product.findUniqueOrThrow({ where: { sku: "KB-MECH-RGB" } });
    expect(updatedKeyboard.stockQuantity).toBe(13);
  });

  // -------------------------------------------------------------------------
  // 3. Authoritative Pricing & Historic Preservation (TEST-BR-01, TEST-BR-02)
  // -------------------------------------------------------------------------

  it("TEST-BR-01: ignores client-submitted price manipulation and calculates from database authoritatively", async () => {
    const customer = await loginAsCustomer();
    const phone = await prisma.product.findUniqueOrThrow({ where: { sku: "PHON-PRO-256" } });

    // Client maliciously attempts to pay $0.01 for an $899.00 phone
    const res = await customer.post("/api/orders").send({
      items: [
        {
          productId: phone.id,
          quantity: 1,
          unitPrice: "0.01",
          subtotal: "0.01",
          totalAmount: "0.01",
        },
      ],
    });

    expect(res.status).toBe(201);
    expect(res.body.data.totalAmount).toBe("899.00");
    expect(res.body.data.items[0].unitPrice).toBe("899.00");
    expect(res.body.data.items[0].subtotal).toBe("899.00");
  });

  it("TEST-BR-02: captures and preserves unitPrice snapshot in OrderItem record", async () => {
    const customer = await loginAsCustomer();
    const phone = await prisma.product.findUniqueOrThrow({ where: { sku: "PHON-PRO-256" } });

    const res = await customer.post("/api/orders").send({
      items: [{ productId: phone.id, quantity: 1 }],
    });

    expect(res.status).toBe(201);
    const orderId = res.body.data.id;

    // Direct database query on OrderItem
    const savedItem = await prisma.orderItem.findFirstOrThrow({
      where: { orderId, productId: phone.id },
    });
    expect(Number(savedItem.unitPrice)).toBe(899.00);
  });

  // -------------------------------------------------------------------------
  // 4. Insufficient Stock & Atomic Rollback (TEST-BR-03)
  // -------------------------------------------------------------------------

  it("TEST-BR-03: rejects order with 409 Conflict if requested quantity exceeds stock and rolls back completely", async () => {
    const customer = await loginAsCustomer();
    const tablet = await prisma.product.findUniqueOrThrow({ where: { sku: "TAB-ULTRA-11" } });
    const initialTabletStock = tablet.stockQuantity; // 8

    // Attempt to order 99 tablets (exceeds 8)
    const res = await customer.post("/api/orders").send({
      items: [{ productId: tablet.id, quantity: 99 }],
    });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("INSUFFICIENT_STOCK");

    // Stock must remain unchanged
    const afterTablet = await prisma.product.findUniqueOrThrow({ where: { sku: "TAB-ULTRA-11" } });
    expect(afterTablet.stockQuantity).toBe(initialTabletStock);
  });

  it("rejects order if any single item has insufficient stock and does not decrement other items (Atomic Rollback)", async () => {
    const customer = await loginAsCustomer();
    const charger = await prisma.product.findUniqueOrThrow({ where: { sku: "CHG-GAN-65W" } });
    const outOfStockFlip = await prisma.product.findUniqueOrThrow({ where: { sku: "PHON-FLIP-LTD" } });

    const initialChargerStock = charger.stockQuantity; // 25

    // Item 1 has ample stock (1 charger), but Item 2 has 0 stock (1 flip phone)
    const res = await customer.post("/api/orders").send({
      items: [
        { productId: charger.id, quantity: 1 },
        { productId: outOfStockFlip.id, quantity: 1 },
      ],
    });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("INSUFFICIENT_STOCK");

    // Atomicity check: Charger stock must NOT be decremented
    const afterCharger = await prisma.product.findUniqueOrThrow({ where: { sku: "CHG-GAN-65W" } });
    expect(afterCharger.stockQuantity).toBe(initialChargerStock);
  });

  // -------------------------------------------------------------------------
  // 5. Input Validations (TEST-BR-04)
  // -------------------------------------------------------------------------

  it("TEST-BR-04: rejects empty order payload with 400 Bad Request", async () => {
    const customer = await loginAsCustomer();

    const res = await customer.post("/api/orders").send({ items: [] });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("EMPTY_ORDER");
  });

  it("TEST-BR-04: rejects negative or zero quantity with 400 Bad Request", async () => {
    const customer = await loginAsCustomer();
    const phone = await prisma.product.findUniqueOrThrow({ where: { sku: "PHON-PRO-256" } });

    const resZero = await customer.post("/api/orders").send({
      items: [{ productId: phone.id, quantity: 0 }],
    });
    expect(resZero.status).toBe(400);
    expect(resZero.body.error.code).toBe("INVALID_QUANTITY");

    const resNegative = await customer.post("/api/orders").send({
      items: [{ productId: phone.id, quantity: -2 }],
    });
    expect(resNegative.status).toBe(400);
    expect(resNegative.body.error.code).toBe("INVALID_QUANTITY");
  });

  it("returns 404 if product ID does not exist or is inactive", async () => {
    const customer = await loginAsCustomer();

    const res = await customer.post("/api/orders").send({
      items: [{ productId: 99999, quantity: 1 }],
    });
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("PRODUCT_NOT_FOUND");
  });

  // -------------------------------------------------------------------------
  // 6. Access Control & Role Enforcement (TEST-AUTH-04, TEST-SEC-02)
  // -------------------------------------------------------------------------

  it("TEST-AUTH-04: unauthenticated requests receive 401 Unauthorized", async () => {
    const res = await request(app).post("/api/orders").send({
      items: [{ productId: 1, quantity: 1 }],
    });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  it("rejects non-customer roles (OPERATOR) with 403 Forbidden", async () => {
    const operator = await loginAsOperator();

    const res = await operator.post("/api/orders").send({
      items: [{ productId: 1, quantity: 1 }],
    });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });
});
