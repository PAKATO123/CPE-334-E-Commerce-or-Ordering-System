import { randomUUID } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { expect, it } from "vitest";
import { getPrisma } from "../src/prisma.js";
import { cancelCustomerOrder } from "../src/services/cancellation.js";
import { simulateOrderPayment } from "../src/services/payment.js";
import { processOperatorOrder } from "../src/services/operatorOrders.js";

function gate() {
  let release!: () => void;
  const wait = new Promise<void>((resolve) => { release = resolve; });
  return { wait, release };
}

it.each([
  ["cancel", "payment"], ["cancel", "terminal"],
  ["reject", "payment"], ["reject", "terminal"],
] as const)("TEST-PAY-09: %s and payment are consistent when %s commits first", async (action, first) => {
  const db = getPrisma();
  const key = randomUUID();
  const user = await db.user.create({ data: { email: `${key}@example.test`, name: "Race test", passwordHash: "unused" } });
  const product = await db.product.create({ data: { sku: key, name: "Race test", category: "Tests", price: 1, stockQuantity: 3 } });
  const order = await db.order.create({ data: {
    orderNumber: key, customerId: user.id, totalAmount: 2,
    items: { create: { productId: product.id, quantity: 2, unitPrice: 1, subtotal: 2 } },
  } });

  const entered = gate();
  const resume = gate();
  let paused = false;
  async function pauseOnce() {
    if (paused) return;
    paused = true;
    entered.release();
    await resume.wait;
  }
  const delayed = new Proxy(db, {
    get(target, key, receiver) {
      if (key !== "$transaction") return Reflect.get(target, key, receiver);
      return async (
        callback: (tx: Prisma.TransactionClient) => Promise<unknown>,
        options: { isolationLevel: Prisma.TransactionIsolationLevel },
      ) => {
        if (action !== "reject" || first !== "payment") await pauseOnce();
        return target.$transaction((tx) => callback(new Proxy(tx, {
          get(transaction, property, transactionReceiver) {
            if (property !== "order" || action !== "reject" || first !== "payment") {
              return Reflect.get(transaction, property, transactionReceiver);
            }
            return new Proxy(transaction.order, {
              get(model, method, modelReceiver) {
                if (method !== "updateMany") return Reflect.get(model, method, modelReceiver);
                return async (args: Prisma.OrderUpdateManyArgs) => {
                  await pauseOnce();
                  return model.updateMany(args);
                };
              },
            });
          },
        })), options);
      };
    },
  });
  const pay = (client = db) => simulateOrderPayment(client, order.id, user.id, "CUSTOMER", "SIMULATED_CARD");
  const terminate = (client = db) => action === "cancel"
    ? cancelCustomerOrder(client, order.id, user.id, "CUSTOMER")
    : processOperatorOrder(client, order.id, "REJECTED");
  const pending = (first === "payment" ? terminate(delayed) : pay(delayed))
    .then((result) => ({ result }), (error: unknown) => ({ error }));
  try {
    await Promise.race([entered.wait, pending.then(() => { throw new Error("Operation completed before the synchronization point"); })]);
    if (first === "payment") expect((await pay()).paymentStatus).toBe("PAID");
    else expect((await terminate()).paymentStatus).toBe("VOID");
  } finally {
    resume.release();
  }
  const outcome = await pending;
  try {
    const saved = await db.order.findUniqueOrThrow({ where: { id: order.id } });
    const restored = await db.product.findUniqueOrThrow({ where: { id: product.id } });
    expect(restored.stockQuantity).toBe(5);
    expect(saved.status).toBe(action === "cancel" ? "CANCELLED" : "REJECTED");
    if (first === "payment") {
      expect(outcome).toHaveProperty("result");
      expect(saved.paymentStatus).toBe("REFUNDED");
      expect(saved.paidAt).toBeInstanceOf(Date);
      expect(saved.refundedAt!.getTime()).toBeGreaterThanOrEqual(saved.paidAt!.getTime());
    } else {
      expect(outcome).toMatchObject({ error: { status: 422, code: "CANNOT_PAY_TERMINAL_ORDER" } });
      expect(saved.paymentStatus).toBe("VOID");
      expect(saved.paidAt).toBeNull();
      expect(saved.refundedAt).toBeNull();
    }
  } finally {
    await db.order.delete({ where: { id: order.id } });
    await db.product.delete({ where: { id: product.id } });
    await db.user.delete({ where: { id: user.id } });
  }
}, 15_000);
