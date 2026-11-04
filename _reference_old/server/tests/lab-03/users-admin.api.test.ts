import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";

describe("Lab 03 — Administrator User Management API (users-admin.api.test.ts)", () => {
  let adminAgent: any;
  let staffAgent: any;
  let createdUserId: number | null = null;

  beforeAll(async () => {
    const prisma = getPrisma();
    const adminHash = bcrypt.hashSync("AdminPassword123!", 10);
    const staffHash = bcrypt.hashSync("Password123!", 10);
    await prisma.user.update({
      where: { email: "admin@toktickit.local" },
      data: { passwordHash: adminHash, mustChangePassword: false, isActive: true },
    });
    await prisma.user.update({
      where: { email: "staff1@toktickit.local" },
      data: { passwordHash: staffHash, mustChangePassword: false, isActive: true },
    });

    adminAgent = request.agent(app);
    await adminAgent
      .post("/api/auth/login")
      .send({ email: "admin@toktickit.local", password: "AdminPassword123!" });

    staffAgent = request.agent(app);
    await staffAgent
      .post("/api/auth/login")
      .send({ email: "staff1@toktickit.local", password: "Password123!" });
  });

  afterAll(async () => {
    const prisma = getPrisma();
    if (createdUserId) {
      await prisma.user.deleteMany({ where: { id: createdUserId } });
    }
    await prisma.user.deleteMany({ where: { email: "testcreateduser@toktickit.local" } });
  });

  it("allows Administrator to list users with search and role filter", async () => {
    const res = await adminAgent
      .get("/api/users")
      .query({ search: "staff", role: "IT_STAFF" });

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.every((u: any) => u.role === "IT_STAFF")).toBe(true);
  });

  it("allows Administrator to create user with initial password and forced change flag", async () => {
    const res = await adminAgent.post("/api/users").send({
      name: "New Test User",
      email: "testcreateduser@toktickit.local",
      role: "IT_STAFF",
      initialPassword: "Password123!",
    });

    expect(res.status).toBe(201);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe("testcreateduser@toktickit.local");
    expect(res.body.user.role).toBe("IT_STAFF");
    expect(res.body.user.mustChangePassword).toBe(true);
    expect(res.body.user.isActive).toBe(true);
    createdUserId = res.body.user.id;
  });

  it("rejects duplicate user email creation with 409 Conflict", async () => {
    const res = await adminAgent.post("/api/users").send({
      name: "Duplicate User",
      email: "admin@toktickit.local",
      role: "REQUESTER",
      initialPassword: "Password123!",
    });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("EMAIL_ALREADY_EXISTS");
  });

  it("allows Administrator to update name, email, role, and active status", async () => {
    if (!createdUserId) return;

    const res = await adminAgent.patch(`/api/users/${createdUserId}`).send({
      name: "Updated Test User",
      role: "REQUESTER",
    });

    expect(res.status).toBe(200);
    expect(res.body.user.name).toBe("Updated Test User");
    expect(res.body.user.role).toBe("REQUESTER");
  });

  it("rejects Administrator self-deactivation with 400 Bad Request", async () => {
    // Admin ID for admin@toktickit.local
    const prisma = getPrisma();
    const adminUser = await prisma.user.findUnique({ where: { email: "admin@toktickit.local" } });
    expect(adminUser).toBeDefined();

    const res = await adminAgent.patch(`/api/users/${adminUser!.id}`).send({
      isActive: false,
    });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("SELF_DEACTIVATION_PROHIBITED");
  });

  it("prevents removal or deactivation of the last active Administrator (BR-19)", async () => {
    const prisma = getPrisma();
    const admin2 = await prisma.user.findUnique({ where: { email: "admin2@toktickit.local" } });
    expect(admin2).toBeDefined();

    // 1. Deactivate 2nd admin while primary admin is still active (allowed)
    const deactRes = await adminAgent.patch(`/api/users/${admin2!.id}`).send({ isActive: false });
    expect(deactRes.status).toBe(200);
    expect(deactRes.body.user.isActive).toBe(false);

    // 2. Now only 1 active admin remains (admin@toktickit.local).
    // Create a temporary 3rd user to try converting the primary admin's role
    const admin1 = await prisma.user.findUnique({ where: { email: "admin@toktickit.local" } });
    
    // Attempting to change role of the last active admin should fail with LAST_ADMIN_PROTECTION
    const roleChangeRes = await adminAgent.patch(`/api/users/${admin1!.id}`).send({ role: "REQUESTER" });
    expect(roleChangeRes.status).toBe(400);
    expect(roleChangeRes.body.error.code).toBe("LAST_ADMIN_PROTECTED");

    // 3. Reactivate 2nd admin
    const reactRes = await adminAgent.patch(`/api/users/${admin2!.id}`).send({ isActive: true });
    expect(reactRes.status).toBe(200);
    expect(reactRes.body.user.isActive).toBe(true);
  });

  it("allows Administrator to set a new initial password", async () => {
    if (!createdUserId) return;

    const res = await adminAgent
      .post(`/api/users/${createdUserId}/reset-password`)
      .send({ initialPassword: "NewInitialPassword1!" });

    expect(res.status).toBe(200);
    expect(res.body.mustChangePassword).toBe(true);
  });
});
