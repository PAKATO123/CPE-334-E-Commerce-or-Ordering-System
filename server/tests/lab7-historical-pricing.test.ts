import { randomUUID } from "node:crypto";
import request from "supertest";
import { afterEach, beforeEach, expect, it } from "vitest";
import { app } from "../src/app.js";
import { getPrisma } from "../src/prisma.js";

const prisma = getPrisma();
const historicalPricing = { subtotal: "500.00", discountAmount: "0.00", shippingFee: "0.00", totalAmount: "500.00" };
let customer: ReturnType<typeof request.agent>;
let productId: number | undefined;
let orderId: number;

async function signIn(email: string) {
  const agent = request.agent(app);
  await agent.post("/api/auth/login").send({ email, password: "Password123!" }).expect(200);
  return agent;
}

beforeEach(async () => {
  customer = await signIn("customer1@example.com");
  const product = await prisma.product.create({ data: {
    sku: `LAB7-${randomUUID()}`, name: "Lab 7 historical fixture", category: "Smartphones",
    description: "Disposable legacy order product", price: "500.00", stockQuantity: 2,
  } });
  productId = product.id;
  const order = await customer.post("/api/orders").send({ items: [{ productId, quantity: 1 }] }).expect(201);
  orderId = order.body.data.id;

  // Represent the values produced by the Lab 7 migration for a pre-existing order.
  await prisma.order.update({ where: { id: orderId }, data: {
    subtotal: "0.00", discountAmount: "0.00", shippingFee: "0.00", totalAmount: "500.00",
    createdAt: new Date("2026-11-20T00:00:00Z"),
  } });
  await prisma.product.update({ where: { id: productId }, data: { price: "600.00" } });
});

afterEach(async () => {
  if (productId === undefined) return;
  const items = await prisma.orderItem.findMany({ where: { productId }, select: { orderId: true } });
  await prisma.orderItem.deleteMany({ where: { productId } });
  await prisma.order.deleteMany({ where: { id: { in: items.map(item => item.orderId) } } });
  await prisma.product.delete({ where: { id: productId } });
  productId = undefined;
});

it("LAB7-STS-03: historical receipt preserves line price and stored total after a catalog change", async () => {
  const { body } = await customer.get(`/api/orders/${orderId}`).expect(200);
  expect(body.data.items[0]).toMatchObject({ unitPrice: "500.00", subtotal: "500.00" });
  expect((await prisma.order.findUniqueOrThrow({ where: { id: orderId } })).totalAmount.toFixed(2)).toBe("500.00");
  expect(body.data.totalAmount).toBe("500.00");
  expect(body.data).toMatchObject(historicalPricing);
});

it("LAB7-STS-03: historical customer history preserves stored pricing", async () => {
  const { body } = await customer.get("/api/orders").expect(200);
  const order = body.data.find((item: { id: number }) => item.id === orderId);
  expect(order.totalAmount).toBe("500.00");
  expect(order).toMatchObject(historicalPricing);
});

it("LAB7-STS-03: historical operator view preserves stored pricing", async () => {
  const operator = await signIn("operator1@example.com");
  const { body } = await operator.get("/api/operator/orders").expect(200);
  expect(body.data.find((item: { id: number }) => item.id === orderId)).toMatchObject(historicalPricing);
});

it("LAB7-STS-04/05: payment and cancellation preserve legacy total and restore stock once", async () => {
  const paid = await customer.post(`/api/orders/${orderId}/pay`).send({ paymentMethod: "SIMULATED_CARD" }).expect(200);
  expect(paid.body.data.paymentStatus).toBe("PAID");
  const cancelled = await customer.post(`/api/orders/${orderId}/cancel`).send({ reason: "Changed my mind" }).expect(200);
  expect(cancelled.body.data).toMatchObject({ totalAmount: "500.00", paymentStatus: "REFUNDED" });
  await customer.post(`/api/orders/${orderId}/cancel`).send({ reason: "Duplicate" }).expect(409);
  expect((await prisma.product.findUniqueOrThrow({ where: { id: productId } })).stockQuantity).toBe(2);
  expect((await prisma.order.findUniqueOrThrow({ where: { id: orderId } })).totalAmount.toFixed(2)).toBe("500.00");
  expect(paid.body.data.totalAmount).toBe("500.00");
  expect(paid.body.data).toMatchObject(historicalPricing);
});

it("LAB7-STS-06: a different customer cannot read, pay, cancel or inspect the operator queue", async () => {
  const other = await signIn("customer2@example.com");
  const history = await other.get("/api/orders").expect(200);
  expect(history.body.data.some((item: { id: number }) => item.id === orderId)).toBe(false);
  await other.get(`/api/orders/${orderId}`).expect(403);
  await other.post(`/api/orders/${orderId}/pay`).send({ paymentMethod: "SIMULATED_CARD" }).expect(403);
  await other.post(`/api/orders/${orderId}/cancel`).send({ reason: "Unauthorized attempt" }).expect(403);
  await other.get("/api/operator/orders").expect(403);
  expect(await prisma.order.findUniqueOrThrow({ where: { id: orderId } })).toMatchObject({ status: "PENDING", paymentStatus: "UNPAID" });
  expect((await prisma.product.findUniqueOrThrow({ where: { id: productId } })).stockQuantity).toBe(1);
});
