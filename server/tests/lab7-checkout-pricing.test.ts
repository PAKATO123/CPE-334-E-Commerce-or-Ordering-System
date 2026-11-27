import { randomUUID } from "node:crypto";
import request from "supertest";
import { expect, it } from "vitest";
import { app } from "../src/app.js";
import { getPrisma } from "../src/prisma.js";

const prisma = getPrisma();

it.each([
  ["199.99", "0.00", "15.00", "214.99"],
  ["200.00", "0.00", "0.00", "200.00"],
  ["205.00", "0.00", "0.00", "205.00"],
  ["499.99", "0.00", "0.00", "499.99"],
  ["500.00", "25.00", "0.00", "475.00"],
  ["999.99", "50.00", "0.00", "949.99"],
  ["1000.00", "100.00", "0.00", "900.00"],
])("LAB7-STS-01/02: checkout at $%s uses server pricing and reserves stock", async (subtotal, discountAmount, shippingFee, totalAmount) => {
  const customer = request.agent(app);
  await customer.post("/api/auth/login").send({ email: "customer1@example.com", password: "Password123!" }).expect(200);
  const product = await prisma.product.create({ data: {
    sku: `LAB7-${randomUUID()}`, name: "Lab 7 pricing fixture", category: "Smartphones",
    description: "Disposable checkout test product", price: subtotal, stockQuantity: 2,
  } });

  try {
    const response = await customer.post("/api/orders").send({
      items: [{ productId: product.id, quantity: 1, unitPrice: "0.01" }],
      subtotal: "0.01", discountAmount: "0.01", shippingFee: "0.01", totalAmount: "0.01",
    }).expect(201);
    const stored = await prisma.order.findUniqueOrThrow({
      where: { id: response.body.data.id }, include: { items: true },
    });
    expect(stored.items[0].unitPrice.toFixed(2)).toBe(subtotal);
    expect((await prisma.product.findUniqueOrThrow({ where: { id: product.id } })).stockQuantity).toBe(1);
    expect(response.body.data.totalAmount).toBe(totalAmount);
    expect(stored.totalAmount.toFixed(2)).toBe(totalAmount);
    expect(response.body.data).toMatchObject({ subtotal, discountAmount, shippingFee });
  } finally {
    const items = await prisma.orderItem.findMany({ where: { productId: product.id }, select: { orderId: true } });
    await prisma.orderItem.deleteMany({ where: { productId: product.id } });
    await prisma.order.deleteMany({ where: { id: { in: items.map(item => item.orderId) } } });
    await prisma.product.delete({ where: { id: product.id } });
  }
});
