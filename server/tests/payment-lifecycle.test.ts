import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { getPrisma } from "../src/prisma.js";

describe("Feature 8: Payment State Machine & Extended Fulfillment Progression (F-08)", () => {
  const prisma = getPrisma();
  let customerAgent: any;
  let otherCustomerAgent: any;
  let operatorAgent: any;

  let testProduct: any;
  const TEST_SKU = "TEST-PAY-LIFECYCLE-SKU";

  beforeAll(async () => {
    // Authenticate Customer 1
    customerAgent = request.agent(app);
    await customerAgent.post("/api/auth/login").send({
      email: "customer1@example.com",
      password: "Password123!",
    });

    // Authenticate Customer 2
    otherCustomerAgent = request.agent(app);
    await otherCustomerAgent.post("/api/auth/login").send({
      email: "customer2@example.com",
      password: "Password123!",
    });

    // Ensure operator does not have mustChangePassword
    await prisma.user.updateMany({
      where: { email: "operator1@example.com" },
      data: { mustChangePassword: false },
    });

    // Authenticate Operator
    operatorAgent = request.agent(app);
    await operatorAgent.post("/api/auth/login").send({
      email: "operator1@example.com",
      password: "Password123!",
    });

    // Clean up previous test entities
    try {
      await prisma.orderItem.deleteMany({
        where: { product: { sku: TEST_SKU } },
      });
      await prisma.product.deleteMany({
        where: { sku: TEST_SKU },
      });
    } catch {}

    // Create a fresh test product with 50 stock
    testProduct = await prisma.product.create({
      data: {
        sku: TEST_SKU,
        name: "Payment Lifecycle Test Speaker",
        category: "Audio & Accessories",
        price: 99.99,
        stockQuantity: 50,
        isActive: true,
      },
    });
  });

  afterAll(async () => {
    try {
      await prisma.orderItem.deleteMany({
        where: { product: { sku: TEST_SKU } },
      });
      await prisma.product.deleteMany({
        where: { sku: TEST_SKU },
      });
      await prisma.$disconnect();
    } catch {}
  });

  it("TEST-PAY-01: initializes created order with paymentStatus = 'UNPAID'", async () => {
    const res = await customerAgent.post("/api/orders").send({
      items: [{ productId: testProduct.id, quantity: 2 }],
    });
    expect(res.status).toBe(201);
    expect(res.body.data.paymentStatus).toBe("UNPAID");
    expect(res.body.data.status).toBe("PENDING");
  });

  it("TEST-PAY-02: allows customer to simulate payment, setting paymentStatus = 'PAID', paymentMethod and paidAt", async () => {
    // 1. Create order
    const orderRes = await customerAgent.post("/api/orders").send({
      items: [{ productId: testProduct.id, quantity: 1 }],
    });
    const orderId = orderRes.body.data.id;

    // 2. Pay order
    const payRes = await customerAgent.post(`/api/orders/${orderId}/pay`).send({
      paymentMethod: "SIMULATED_CARD",
    });

    expect(payRes.status).toBe(200);
    expect(payRes.body.data.paymentStatus).toBe("PAID");
    expect(payRes.body.data.paymentMethod).toBe("SIMULATED_CARD");
    expect(payRes.body.data.paidAt).toBeDefined();

    // 3. Verify in GET /api/orders/:id
    const detailRes = await customerAgent.get(`/api/orders/${orderId}`);
    expect(detailRes.status).toBe(200);
    expect(detailRes.body.data.paymentStatus).toBe("PAID");
    expect(detailRes.body.data.paymentMethod).toBe("SIMULATED_CARD");
    expect(detailRes.body.data.paidAt).toBeDefined();
  });

  it("TEST-PAY-03: rejects duplicate payment calls with 409 Conflict (ORDER_ALREADY_PAID)", async () => {
    const orderRes = await customerAgent.post("/api/orders").send({
      items: [{ productId: testProduct.id, quantity: 1 }],
    });
    const orderId = orderRes.body.data.id;

    // First payment succeeds
    const pay1 = await customerAgent.post(`/api/orders/${orderId}/pay`).send({
      paymentMethod: "SIMULATED_PROMPTPAY",
    });
    expect(pay1.status).toBe(200);

    // Second payment fails
    const pay2 = await customerAgent.post(`/api/orders/${orderId}/pay`).send({
      paymentMethod: "SIMULATED_CARD",
    });
    expect(pay2.status).toBe(409);
    expect(pay2.body.error.code).toBe("ORDER_ALREADY_PAID");
  });

  it("TEST-PAY-04: rejects payment on cancelled order with 422 Unprocessable (CANNOT_PAY_TERMINAL_ORDER)", async () => {
    const orderRes = await customerAgent.post("/api/orders").send({
      items: [{ productId: testProduct.id, quantity: 1 }],
    });
    const orderId = orderRes.body.data.id;

    // Cancel order
    const cancelRes = await customerAgent.post(`/api/orders/${orderId}/cancel`).send({
      reason: "No longer needed",
    });
    expect(cancelRes.status).toBe(200);

    // Attempt payment
    const payRes = await customerAgent.post(`/api/orders/${orderId}/pay`).send({
      paymentMethod: "SIMULATED_CARD",
    });
    expect(payRes.status).toBe(422);
    expect(payRes.body.error.code).toBe("CANNOT_PAY_TERMINAL_ORDER");
  });

  it("TEST-PAY-05: operator progresses fulfillment through ACCEPTED ➔ PACKED ➔ SHIPPED", async () => {
    const orderRes = await customerAgent.post("/api/orders").send({
      items: [{ productId: testProduct.id, quantity: 1 }],
    });
    const orderId = orderRes.body.data.id;

    // 1. PENDING ➔ ACCEPTED
    const step1 = await operatorAgent.patch(`/api/operator/orders/${orderId}/status`).send({
      status: "ACCEPTED",
    });
    expect(step1.status).toBe(200);
    expect(step1.body.data.status).toBe("ACCEPTED");

    // 2. ACCEPTED ➔ PACKED
    const step2 = await operatorAgent.patch(`/api/operator/orders/${orderId}/status`).send({
      status: "PACKED",
    });
    expect(step2.status).toBe(200);
    expect(step2.body.data.status).toBe("PACKED");

    // 3. PACKED ➔ SHIPPED
    const step3 = await operatorAgent.patch(`/api/operator/orders/${orderId}/status`).send({
      status: "SHIPPED",
    });
    expect(step3.status).toBe(200);
    expect(step3.body.data.status).toBe("SHIPPED");

    // 4. SHIPPED ➔ any transition rejected with 409 Conflict
    const step4 = await operatorAgent.patch(`/api/operator/orders/${orderId}/status`).send({
      status: "PACKED",
    });
    expect(step4.status).toBe(409);
    expect(step4.body.error.code).toBe("ORDER_ALREADY_PROCESSED");
    expect(await prisma.order.findUniqueOrThrow({ where: { id: orderId } })).toMatchObject({ status: "SHIPPED" });
  });

  it("TEST-PAY-06: rejects invalid fulfillment step skips with 400 Bad Request (INVALID_TRANSITION)", async () => {
    const orderRes = await customerAgent.post("/api/orders").send({
      items: [{ productId: testProduct.id, quantity: 1 }],
    });
    const orderId = orderRes.body.data.id;

    // Attempt PENDING ➔ SHIPPED (invalid skip)
    const invalidSkip = await operatorAgent.patch(`/api/operator/orders/${orderId}/status`).send({
      status: "SHIPPED",
    });
    expect(invalidSkip.status).toBe(400);
    expect(invalidSkip.body.error.code).toBe("INVALID_TRANSITION");

    // Advance to ACCEPTED
    await operatorAgent.patch(`/api/operator/orders/${orderId}/status`).send({
      status: "ACCEPTED",
    });

    // Attempt ACCEPTED ➔ SHIPPED (invalid skip, must be PACKED first)
    const skipPacked = await operatorAgent.patch(`/api/operator/orders/${orderId}/status`).send({
      status: "SHIPPED",
    });
    expect(skipPacked.status).toBe(400);
    expect(skipPacked.body.error.code).toBe("INVALID_TRANSITION");
  });

  it("TEST-PAY-07: operator rejection of a paid order automatically sets paymentStatus = 'REFUNDED' and restores stock", async () => {
    // Check initial stock
    const initialProduct = await prisma.product.findUniqueOrThrow({
      where: { id: testProduct.id },
    });
    const stockBefore = initialProduct.stockQuantity;

    // 1. Create order for 3 items
    const orderRes = await customerAgent.post("/api/orders").send({
      items: [{ productId: testProduct.id, quantity: 3 }],
    });
    const orderId = orderRes.body.data.id;

    // Stock was decremented by 3
    const productAfterOrder = await prisma.product.findUniqueOrThrow({
      where: { id: testProduct.id },
    });
    expect(productAfterOrder.stockQuantity).toBe(stockBefore - 3);

    // 2. Pay order
    const payRes = await customerAgent.post(`/api/orders/${orderId}/pay`).send({
      paymentMethod: "SIMULATED_CARD",
    });
    expect(payRes.status).toBe(200);
    expect(payRes.body.data.paymentStatus).toBe("PAID");

    // 3. Operator rejects the paid order
    const rejectRes = await operatorAgent.patch(`/api/operator/orders/${orderId}/status`).send({
      status: "REJECTED",
    });
    expect(rejectRes.status).toBe(200);
    expect(rejectRes.body.data.status).toBe("REJECTED");
    expect(rejectRes.body.data.paymentStatus).toBe("REFUNDED");
    expect(rejectRes.body.data.refundedAt).toBeDefined();

    // 4. Verify stock was restored
    const finalProduct = await prisma.product.findUniqueOrThrow({
      where: { id: testProduct.id },
    });
    expect(finalProduct.stockQuantity).toBe(stockBefore);
  });

  it("TEST-PAY-08: denies payment by another customer and after operator rejection", async () => {
    const placed = await customerAgent.post("/api/orders").send({
      items: [{ productId: testProduct.id, quantity: 1 }],
    });
    expect(placed.status).toBe(201);
    const { id } = placed.body.data;
    const path = `/api/orders/${id}/pay`;
    const input = { paymentMethod: "SIMULATED_CARD" };
    expect((await otherCustomerAgent.post(path).send(input)).status).toBe(403);
    expect(await prisma.order.findUniqueOrThrow({ where: { id } })).toMatchObject({
      paymentStatus: "UNPAID", paidAt: null, paymentMethod: null,
    });
    expect((await operatorAgent.patch(`/api/operator/orders/${id}/status`).send({ status: "REJECTED" })).status).toBe(200);
    const denied = await customerAgent.post(path).send(input);
    expect(denied.status).toBe(422);
    expect(denied.body.error.code).toBe("CANNOT_PAY_TERMINAL_ORDER");
    expect(await prisma.order.findUniqueOrThrow({ where: { id } })).toMatchObject({
      status: "REJECTED", paymentStatus: "VOID", paidAt: null, paymentMethod: null, refundedAt: null,
    });
  });
});
