import { describe, expect, it, vi } from "vitest";
import bcrypt from "bcryptjs";
import type { PrismaClient } from "@prisma/client";
import { main, seedUsers, PRODUCTS } from "../../prisma/seed.js";

const production = { NODE_ENV: "production", ADMIN_PASSWORD: "Test-admin-only-Aa1!" };

describe("deployment seed (database-free stateful persistence double)", () => {
  it("requires production credentials before any writes", async () => {
    const upsert = vi.fn();
    const client = { user: { upsert }, product: { upsert } } as unknown as PrismaClient;
    await expect(main({ NODE_ENV: "production" }, client)).rejects.toThrow("ADMIN_PASSWORD");
    await expect(main({ ...production, SEED_DEMO_DATA: "true" }, client)).rejects.toThrow("DEMO_USER_PASSWORD");
    expect(upsert).not.toHaveBeenCalled();
  });

  it("only creates demo users when explicitly enabled, using the separate password", () => {
    const users = seedUsers(production);
    expect(users).toHaveLength(1);
    expect(users[0]).toMatchObject({ email: "admin@example.com", role: "ADMIN", mustChangePassword: true });
    expect(bcrypt.compareSync(production.ADMIN_PASSWORD, users[0].passwordHash)).toBe(true);
    expect(seedUsers({ NODE_ENV: "development" })).toHaveLength(1);
    const demo = seedUsers({ ...production, SEED_DEMO_DATA: "true", DEMO_USER_PASSWORD: "Test-demo-only-Dd1!" });
    expect(demo).toHaveLength(6);
    for (const user of demo.filter(user => user.role !== "ADMIN")) {
      expect(bcrypt.compareSync("Test-demo-only-Dd1!", user.passwordHash)).toBe(true);
    }
    expect(seedUsers({ ...production, SEED_DEMO_DATA: "false" })).toHaveLength(1);
    expect(() => seedUsers({ ...production, SEED_DEMO_DATA: "yes" })).toThrow("SEED_DEMO_DATA");
  });

  it("preserves changed passwords, roles, account state, catalog, inventory and orders on rerun", async () => {
    const users = new Map<string, any>();
    const products = new Map<string, any>();
    const orders = [{ id: 71, status: "ACCEPTED", items: [{ sku: PRODUCTS[0].sku, quantity: 2 }] }];
    const upsert = (records: Map<string, any>, key: string) => vi.fn(async ({ where, create, update }) => {
      const id = where[key];
      const record = records.has(id) ? { ...records.get(id), ...update } : { ...create };
      records.set(id, record);
      return record;
    });
    const client = { user: { upsert: upsert(users, "email") }, product: { upsert: upsert(products, "sku") },
      order: { deleteMany: vi.fn(), updateMany: vi.fn() } };
    const env = { ...production, SEED_DEMO_DATA: "true", DEMO_USER_PASSWORD: "Test-demo-only-Dd1!" };
    await main(env, client as unknown as PrismaClient);
    Object.assign(users.get("admin@example.com"), { passwordHash: "changed-hash", role: "CUSTOMER", isActive: false, mustChangePassword: false, name: "Changed" });
    Object.assign(users.get("customer1@example.com"), { passwordHash: "customer-changed", role: "OPERATOR", isActive: false });
    Object.assign(products.get(PRODUCTS[0].sku), { stockQuantity: 3, price: 800, isActive: false });
    const before = structuredClone({ users: [...users], products: [...products], orders });
    await main({ ...env, ADMIN_PASSWORD: "Different-admin-Aa1!", DEMO_USER_PASSWORD: "Different-demo-Dd1!" }, client as unknown as PrismaClient);
    expect({ users: [...users], products: [...products], orders }).toEqual(before);
    expect(client.order.deleteMany).not.toHaveBeenCalled();
    expect(client.order.updateMany).not.toHaveBeenCalled();
  });
});
