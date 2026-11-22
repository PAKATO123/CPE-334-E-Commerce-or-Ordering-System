import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { getPrisma } from "../src/prisma.js";

describe("Feature 7: Customer Order Cancellation & Stock Restoral (F-07)", () => {
  const prisma = getPrisma();
  let customer1Agent: any;
  let customer2Agent: any;
  let adminAgent: any;

  let testProduct: any;
  let customer1Order: any;

  const TEST_SKU = "TEST-CAN-PROD";

  beforeAll(async () => {
    // Authenticate Customer 1
    customer1Agent = request.agent(app);
    await customer1Agent.post("/api/auth/login").send({
      email: "customer1@example.com",
      password: "Password123!",
    });

    // Authenticate Customer 2
    customer2Agent = request.agent(app);
    await customer2Agent.post("/api/auth/login").send({
      email: "customer2@example.com",
      password: "Password123!",
    });

    // Authenticate Admin
    adminAgent = request.agent(app);
    await adminAgent.post("/api/auth/login").send({
      email: "admin@example.com",
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

    // Create a fresh test product with 20 stock
    testProduct = await prisma.product.create({
      data: {
        sku: TEST_SKU,
        name: "Cancellation Test Headset",
        category: "Chargers & Power",
        price: 49.99,
        stockQuantity: 20,
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

  it("TEST-CAN-01 & 02: allows customer to cancel own PENDING order, recording reason and atomically restoring stock", async () => {
    // 1. Customer 1 places an order for 3 units
    const orderRes = await customer1Agent.post("/api/orders").send({
      items: [{ productId: testProduct.id, quantity: 3 }],
    });
    expect(orderRes.status).toBe(201);
    customer1Order = orderRes.body.data;

    // Verify stock decreased from 20 to 17
    const productAfterOrder = await prisma.product.findUniqueOrThrow({
      where: { id: testProduct.id },
    });
    expect(productAfterOrder.stockQuantity).toBe(17);

    // 2. Customer 1 cancels the order with a reason
    const cancelRes = await customer1Agent
      .post(`/api/orders/${customer1Order.id}/cancel`)
      .send({ reason: "Ordered by mistake" });

    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.data.id).toBe(customer1Order.id);
    expect(cancelRes.body.data.status).toBe("CANCELLED");
    expect(cancelRes.body.data.cancellationReason).toBe("Ordered by mistake");
    expect(cancelRes.body.data.paymentStatus).toBe("VOID");
    expect(cancelRes.body.data.cancelledAt).toBeDefined();

    // 3. Verify stock was restored back from 17 to 20
    const productAfterCancel = await prisma.product.findUniqueOrThrow({
      where: { id: testProduct.id },
    });
    expect(productAfterCancel.stockQuantity).toBe(20);

    // 4. Verify GET /api/orders/:id reflects the cancellation
    const getRes = await customer1Agent.get(`/api/orders/${customer1Order.id}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.data.status).toBe("CANCELLED");
    expect(getRes.body.data.cancellationReason).toBe("Ordered by mistake");
    expect(getRes.body.data.cancelledAt).toBeDefined();
  });

  it("TEST-CAN-03: rejects cancellation of another customer's order with 403 Forbidden", async () => {
    // Customer 1 places an order
    const orderRes = await customer1Agent.post("/api/orders").send({
      items: [{ productId: testProduct.id, quantity: 1 }],
    });
    expect(orderRes.status).toBe(201);
    const orderId = orderRes.body.data.id;

    // Customer 2 attempts to cancel Customer 1's order
    const cancelRes = await customer2Agent
      .post(`/api/orders/${orderId}/cancel`)
      .send({ reason: "Malicious attempt" });

    expect(cancelRes.status).toBe(403);
    expect(cancelRes.body.error.code).toBe("FORBIDDEN");

    // Order should still be PENDING
    const checkOrder = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
    expect(checkOrder.status).toBe("PENDING");
  });

  it("TEST-CAN-04: rejects cancellation of an ACCEPTED or REJECTED order with 409 Conflict", async () => {
    // Customer 1 places an order
    const orderRes = await customer1Agent.post("/api/orders").send({
      items: [{ productId: testProduct.id, quantity: 1 }],
    });
    expect(orderRes.status).toBe(201);
    const orderId = orderRes.body.data.id;

    // Set order status to ACCEPTED
    await prisma.order.update({
      where: { id: orderId },
      data: { status: "ACCEPTED" },
    });

    // Customer attempts to cancel ACCEPTED order
    const cancelRes = await customer1Agent
      .post(`/api/orders/${orderId}/cancel`)
      .send({ reason: "Too late" });

    expect(cancelRes.status).toBe(409);
    expect(cancelRes.body.error.code).toBe("ORDER_NOT_CANCELLABLE");
    expect(cancelRes.body.error.message).toContain("Only PENDING orders can be cancelled");
  });

  it("TEST-CAN-05: rejects unauthenticated requests with 401 Unauthorized", async () => {
    const unauthenticated = request(app);
    const res = await unauthenticated.post("/api/orders/1/cancel").send({});
    expect(res.status).toBe(401);
  });

  it("TEST-CAN-06: returns 404 if order does not exist", async () => {
    const res = await customer1Agent.post("/api/orders/999999/cancel").send({});
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("ORDER_NOT_FOUND");
  });

  it("TEST-CAN-07: returns 400 for invalid order ID formats", async () => {
    const res1 = await customer1Agent.post("/api/orders/invalid-id/cancel").send({});
    expect(res1.status).toBe(400);
    expect(res1.body.error.code).toBe("INVALID_ID");

    const res2 = await customer1Agent.post("/api/orders/-5/cancel").send({});
    expect(res2.status).toBe(400);
    expect(res2.body.error.code).toBe("INVALID_ID");
  });
});
