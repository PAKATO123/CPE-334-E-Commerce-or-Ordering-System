import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import type { Prisma, Role } from "@prisma/client";
import { app } from "../src/app.js";
import { getPrisma } from "../src/prisma.js";

const PREFIX = "TEST-F05-";
const password = "FeatureFive123!";
const prisma = getPrisma(); // Global/worker setup must authorize the disposable DB first.
const roles = { operator: "OPERATOR", admin: "ADMIN", customer: "CUSTOMER", customer2: "CUSTOMER" } as const;
type Account = keyof typeof roles;
let accounts: Record<Account, { id: number; email: string }>;
let products: { id: number; sku: string }[] = [];
let sequence = 0;

async function login(account: Account = "operator") {
  const agent = request.agent(app);
  const response = await agent.post("/api/auth/login").send({ email: accounts[account].email, password });
  expect(response.status).toBe(200);
  return agent;
}

async function createOrder(options: { status?: string; customerId?: number; createdAt?: Date } = {}) {
  return prisma.order.create({
    data: {
      orderNumber: `${PREFIX}${++sequence}`,
      customerId: options.customerId ?? accounts.customer.id,
      status: options.status ?? "PENDING",
      totalAmount: "33.75",
      createdAt: options.createdAt,
      items: { create: [
        { productId: products[0].id, quantity: 3, unitPrice: "7.50", subtotal: "22.50" },
        { productId: products[1].id, quantity: 5, unitPrice: "2.25", subtotal: "11.25" },
      ] },
    },
  });
}

async function stocks() {
  const rows = await prisma.product.findMany({ where: { id: { in: products.map(product => product.id) } }, orderBy: { id: "asc" } });
  return rows.map(product => product.stockQuantity);
}

// Gate both HTTP requests at the real transaction entry, then release both.
// Prisma/PostgreSQL still execute the actual competing conditional updates.
type Transaction = (callback: (tx: Prisma.TransactionClient) => Promise<unknown>, options?: { isolationLevel?: Prisma.TransactionIsolationLevel }) => Promise<unknown>;
function synchronizeTransactions() {
  const original = prisma.$transaction.bind(prisma) as Transaction;
  let entered = 0;
  let release!: () => void;
  const ready = new Promise<void>(resolve => { release = resolve; });
  const replacement: Transaction = async (callback, options) => {
    entered++;
    if (entered === 2) release();
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      await Promise.race([ready, new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error("Both competing requests did not reach their transactions")), 3000);
      })]);
    } finally { clearTimeout(timer); }
    return original(callback, options);
  };
  vi.spyOn(prisma, "$transaction").mockImplementation(replacement as typeof prisma.$transaction);
}

beforeAll(async () => {
  const hash = bcrypt.hashSync(password, 10);
  const entries = await Promise.all(Object.entries(roles).map(async ([name, role]) => {
    const email = `f05-${name}@example.test`;
    const user = await prisma.user.upsert({
      where: { email },
      update: { passwordHash: hash, role: role as Role, isActive: true, mustChangePassword: false },
      create: { email, name: `F05 ${name}`, passwordHash: hash, role: role as Role },
    });
    return [name, { id: user.id, email }] as const;
  }));
  accounts = Object.fromEntries(entries) as typeof accounts;
  for (const [index, price] of ["7.50", "2.25"].entries()) {
    const sku = `${PREFIX}PRODUCT-${index}`;
    products.push(await prisma.product.upsert({
      where: { sku }, update: {},
      create: { sku, name: `F05 Device ${index}`, category: "Test Fixtures", price, stockQuantity: 0 },
    }));
  }
});

beforeEach(async () => {
  await prisma.order.deleteMany({ where: { customerId: { in: Object.values(accounts).map(user => user.id) } } });
  await prisma.product.update({ where: { id: products[0].id }, data: { stockQuantity: 7, price: "7.50", isActive: true } });
  await prisma.product.update({ where: { id: products[1].id }, data: { stockQuantity: 15, price: "2.25", isActive: true } });
  await prisma.user.updateMany({ where: { id: { in: Object.values(accounts).map(user => user.id) } }, data: { isActive: true, mustChangePassword: false } });
});

afterEach(() => { vi.restoreAllMocks(); });
afterAll(async () => {
  vi.restoreAllMocks();
  if (accounts) {
    const ids = Object.values(accounts).map(user => user.id);
    await prisma.order.deleteMany({ where: { customerId: { in: ids } } });
    await prisma.user.deleteMany({ where: { id: { in: ids } } });
  }
  await prisma.product.deleteMany({ where: { id: { in: products.map(product => product.id) } } });
  await prisma.$disconnect();
});

describe("F-05 queue and authorization", () => {
  it.each(["operator", "admin"] as const)("%s sees both customers, item summaries, stored amounts and newest-first ordering", async role => {
    const old = await createOrder({ createdAt: new Date("2026-01-01T00:00:00Z") });
    const recent = await createOrder({ customerId: accounts.customer2.id, createdAt: new Date("2026-01-02T00:00:00Z") });
    const agent = await login(role);
    const response = await agent.get("/api/operator/orders");
    expect(response.status).toBe(200);
    const own = response.body.data.filter((order: { id: number }) => [old.id, recent.id].includes(order.id));
    expect(own.map((order: { id: number }) => order.id)).toEqual([recent.id, old.id]);
    expect(own[0]).toMatchObject({ customerId: accounts.customer2.id, customerEmail: accounts.customer2.email, totalAmount: "33.75", itemCount: 8, lineItemCount: 2 });
    expect(own[0].items).toHaveLength(2);
    expect(own[0].items[0]).toMatchObject({ sku: products[0].sku, unitPrice: "7.50", quantity: 3, subtotal: "22.50" });
    expect(JSON.stringify(response.body)).not.toMatch(/passwordHash|session|FeatureFive123/);
  });

  it.each([undefined, "PENDING", "ACCEPTED", "REJECTED"])("applies filter %s at the queue boundary", async status => {
    const fixture = await Promise.all(["PENDING", "ACCEPTED", "REJECTED"].map(status => createOrder({ status })));
    const agent = await login();
    const response = await agent.get("/api/operator/orders").query(status ? { status } : {});
    expect(response.status).toBe(200);
    if (status) expect(response.body.data.every((order: { status: string }) => order.status === status)).toBe(true);
    const ids = response.body.data.map((order: { id: number }) => order.id);
    for (const order of fixture) expect(ids.includes(order.id)).toBe(!status || order.status === status);
  });

  it.each(["", "pending", "ALL", "UNKNOWN", ["PENDING", "REJECTED"]])("rejects invalid filter %j", async status => {
    const agent = await login();
    const response = await agent.get("/api/operator/orders").query({ status });
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("INVALID_STATUS");
  });

  it.each(["queue", "process"])("rejects anonymous %s requests", async endpoint => {
    const response = endpoint === "queue"
      ? await request(app).get("/api/operator/orders")
      : await request(app).patch("/api/operator/orders/1/status").send({ status: "ACCEPTED" });
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("UNAUTHORIZED");
  });

  it.each(["queue", "process"])("rejects customer %s requests", async endpoint => {
    const order = await createOrder();
    const agent = await login("customer");
    const response = endpoint === "queue"
      ? await agent.get("/api/operator/orders")
      : await agent.patch(`/api/operator/orders/${order.id}/status`).send({ status: "REJECTED" });
    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("FORBIDDEN");
    expect((await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).status).toBe("PENDING");
    expect(await stocks()).toEqual([7, 15]);
  });

  it.each(["queue", "process"])("refreshes password policy before %s authorization", async endpoint => {
    const agent = await login();
    await prisma.user.update({ where: { id: accounts.operator.id }, data: { mustChangePassword: true } });
    const response = endpoint === "queue"
      ? await agent.get("/api/operator/orders")
      : await agent.patch("/api/operator/orders/1/status").send({ status: "ACCEPTED" });
    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("PASSWORD_CHANGE_REQUIRED");
  });

  it("denies a session whose account was deactivated", async () => {
    const agent = await login();
    await prisma.user.update({ where: { id: accounts.operator.id }, data: { isActive: false } });
    const response = await agent.get("/api/operator/orders");
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("ACCOUNT_DEACTIVATED");
  });

  it("honors a role downgrade after login", async () => {
    const agent = await login();
    await prisma.user.update({ where: { id: accounts.operator.id }, data: { role: "CUSTOMER" } });
    try {
      const response = await agent.get("/api/operator/orders");
      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe("FORBIDDEN");
    } finally {
      await prisma.user.update({ where: { id: accounts.operator.id }, data: { role: "OPERATOR" } });
    }
  });
});

describe("F-05 fulfillment transitions and inventory", () => {
  it.each(["operator", "admin"] as const)("%s accepts without modifying any inventory", async role => {
    const order = await createOrder();
    const agent = await login(role);
    const response = await agent.patch(`/api/operator/orders/${order.id}/status`).send({ status: "ACCEPTED" });
    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({ id: order.id, orderNumber: order.orderNumber, status: "ACCEPTED" });
    expect(Number.isNaN(Date.parse(response.body.data.updatedAt))).toBe(false);
    expect((await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).status).toBe("ACCEPTED");
    expect(await stocks()).toEqual([7, 15]);
  });

  it.each(["operator", "admin"] as const)("%s rejects and restores every ordered quantity", async role => {
    const order = await createOrder();
    const agent = await login(role);
    const response = await agent.patch(`/api/operator/orders/${order.id}/status`).send({ status: "REJECTED" });
    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe("REJECTED");
    expect((await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).status).toBe("REJECTED");
    expect(await stocks()).toEqual([10, 20]);
    expect(await prisma.orderItem.count({ where: { orderId: order.id } })).toBe(2);
  });

  it("restores inventory for an inactive product too", async () => {
    const order = await createOrder();
    await prisma.product.update({ where: { id: products[0].id }, data: { isActive: false } });
    const agent = await login();
    expect((await agent.patch(`/api/operator/orders/${order.id}/status`).send({ status: "REJECTED" })).status).toBe(200);
    expect(await stocks()).toEqual([10, 20]);
  });

  it.each(["ACCEPTED", "REJECTED"] as const)("rejects all further transitions after %s, without additional stock changes", async first => {
    const order = await createOrder();
    const agent = await login();
    expect((await agent.patch(`/api/operator/orders/${order.id}/status`).send({ status: first })).status).toBe(200);
    const before = await stocks();
    for (const target of ["ACCEPTED", "REJECTED"]) {
      const response = await agent.patch(`/api/operator/orders/${order.id}/status`).send({ status: target });
      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe("ORDER_ALREADY_PROCESSED");
      expect((await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).status).toBe(first);
      expect(await stocks()).toEqual(before);
    }
  });

  it.each([{}, { status: "PENDING" }, { status: "accepted" }, { status: "UNKNOWN" }, { status: null }, { status: [] }, { status: 1 }])(
    "rejects malformed target %j without writes", async body => {
      const order = await createOrder();
      const agent = await login();
      const response = await agent.patch(`/api/operator/orders/${order.id}/status`).send(body);
      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("INVALID_STATUS");
      expect((await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).status).toBe("PENDING");
      expect(await stocks()).toEqual([7, 15]);
    }
  );

  it.each(["abc", "1abc", "1.2", "-1", "0", "1e2", "2147483648"])("rejects invalid ID %s", async id => {
    const agent = await login();
    const response = await agent.patch(`/api/operator/orders/${id}/status`).send({ status: "ACCEPTED" });
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("INVALID_ID");
    expect(await stocks()).toEqual([7, 15]);
  });

  it("returns 404 for a valid but missing ID", async () => {
    const agent = await login();
    const response = await agent.patch("/api/operator/orders/2147483647/status").send({ status: "ACCEPTED" });
    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("ORDER_NOT_FOUND");
  });

  it.each([
    ["REJECTED", "REJECTED"], ["ACCEPTED", "REJECTED"], ["ACCEPTED", "ACCEPTED"],
  ] as const)("concurrent %s/%s requests have exactly one winner", async (first, second) => {
    const order = await createOrder();
    const operator = await login();
    const admin = await login("admin");
    synchronizeTransactions();
    const results = await Promise.all([
      operator.patch(`/api/operator/orders/${order.id}/status`).send({ status: first }),
      admin.patch(`/api/operator/orders/${order.id}/status`).send({ status: second }),
    ]);
    expect(results.map(result => result.status).sort()).toEqual([200, 409]);
    const winner = results.find(result => result.status === 200)!;
    expect(results.find(result => result.status === 409)!.body.error.code).toBe("ORDER_ALREADY_PROCESSED");
    const saved = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(saved.status).toBe(winner.body.data.status);
    expect(await stocks()).toEqual(saved.status === "REJECTED" ? [10, 20] : [7, 15]);
    expect(await prisma.orderItem.count({ where: { orderId: order.id } })).toBe(2);
  });

  it("rolls back status and the first stock write when the second restoration fails", async () => {
    const order = await createOrder();
    const agent = await login();
    const original = prisma.$transaction.bind(prisma) as Transaction;
    let writes = 0;
    const replacement: Transaction = (callback, options) => original(async tx => {
      const product = new Proxy(tx.product, {
        get(target, property) {
          if (property === "update") return async (args: Prisma.ProductUpdateArgs) => {
            if (++writes === 2) throw new Error("Injected second restoration failure");
            return target.update(args);
          };
          return Reflect.get(target, property);
        },
      });
      return callback(new Proxy(tx, { get: (target, property) => property === "product" ? product : Reflect.get(target, property) }));
    }, options);
    vi.spyOn(prisma, "$transaction").mockImplementation(replacement as typeof prisma.$transaction);
    const response = await agent.patch(`/api/operator/orders/${order.id}/status`).send({ status: "REJECTED" });
    expect(response.status).toBe(500);
    expect(response.body.error.code).toBe("INTERNAL_ERROR");
    expect(JSON.stringify(response.body)).not.toContain("Injected");
    expect(writes).toBe(2); // The first real stock update executed inside the aborted transaction.
    expect(await stocks()).toEqual([7, 15]);
    const saved = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(saved.status).toBe("PENDING");
    expect(saved.updatedAt).toEqual(order.updatedAt);
    expect(await prisma.orderItem.count({ where: { orderId: order.id } })).toBe(2);
  });
});

describe("F-01 through F-05 integration", () => {
  it.each(["ACCEPTED", "REJECTED"] as const)("customer checkout, history and receipt reflect %s while preserving prices and isolation", async status => {
    const customer = await login("customer");
    const other = await login("customer2");
    const operator = await login();
    const admin = await login("admin");
    const catalog = await customer.get("/api/products");
    expect(catalog.status).toBe(200);
    expect(catalog.body.data.find((product: { id: number }) => product.id === products[0].id).stockQuantity).toBe(7);
    const placed = await customer.post("/api/orders").send({ items: [{ productId: products[0].id, quantity: 2 }] });
    expect(placed.status).toBe(201);
    expect(placed.body.data.totalAmount).toBe("15.00");
    expect(await stocks()).toEqual([5, 15]);
    await prisma.product.update({ where: { id: products[0].id }, data: { price: "999.00" } });
    const processed = await operator.patch(`/api/operator/orders/${placed.body.data.id}/status`).send({ status });
    expect(processed.status).toBe(200);
    expect(await stocks()).toEqual(status === "REJECTED" ? [7, 15] : [5, 15]);
    const history = await customer.get("/api/orders");
    expect(history.status).toBe(200);
    expect(history.body.data.find((order: { id: number }) => order.id === placed.body.data.id).status).toBe(status);
    for (const agent of [customer, operator, admin]) {
      const receipt = await agent.get(`/api/orders/${placed.body.data.id}`);
      expect(receipt.status).toBe(200);
      expect(receipt.body.data).toMatchObject({ status, totalAmount: "15.00" });
      expect(receipt.body.data.items[0]).toMatchObject({ unitPrice: "7.50", quantity: 2, subtotal: "15.00" });
    }
    const forbidden = await other.get(`/api/orders/${placed.body.data.id}`);
    expect(forbidden.status).toBe(403);
    expect(forbidden.body.data).toBeUndefined();
  });
});
