import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import { app } from "../src/app.js";
import { getPrisma } from "../src/prisma.js";

const DEFAULT_HASH = bcrypt.hashSync("Password123!", 10);

describe("Feature 1: User Authentication & Role-Based Session Control", () => {
  const prisma = getPrisma();

  beforeEach(async () => {
    // Reset test user states to predictable baselines before each test
    try {
      await prisma.user.updateMany({
        where: { email: { in: ["customer1@example.com", "customer2@example.com"] } },
        data: { passwordHash: DEFAULT_HASH, mustChangePassword: false, isActive: true },
      });
      await prisma.user.updateMany({
        where: { email: "customer3@example.com" },
        data: { passwordHash: DEFAULT_HASH, mustChangePassword: true, isActive: true },
      });
      await prisma.user.updateMany({
        where: { email: "deactivated@example.com" },
        data: { passwordHash: DEFAULT_HASH, mustChangePassword: false, isActive: false },
      });
    } catch {
      // If DB is offline, test cases that hit DB will fail with connection error
    }
  });

  afterAll(async () => {
    try {
      // Restore baseline user states so tests leave the DB pristine for manual testing
      await prisma.user.updateMany({
        where: { email: { in: ["customer1@example.com", "customer2@example.com"] } },
        data: { passwordHash: DEFAULT_HASH, mustChangePassword: false, isActive: true },
      });
      await prisma.user.updateMany({
        where: { email: "customer3@example.com" },
        data: { passwordHash: DEFAULT_HASH, mustChangePassword: true, isActive: true },
      });
      await prisma.user.updateMany({
        where: { email: "deactivated@example.com" },
        data: { passwordHash: DEFAULT_HASH, mustChangePassword: false, isActive: false },
      });
      await prisma.$disconnect();
    } catch {}
  });

  // -------------------------------------------------------------------------
  // 1. Login Validation & Authentication (TEST-AUTH-01, TEST-AUTH-02)
  // -------------------------------------------------------------------------

  it("TEST-AUTH-01: authenticates valid Customer credentials, sets cookie, and returns user profile", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "customer1@example.com", password: "Password123!" });

    expect(res.status).toBe(200);
    expect(res.header["set-cookie"]).toBeDefined();
    expect(res.body.user).toMatchObject({
      email: "customer1@example.com",
      name: "Alice Customer",
      role: "CUSTOMER",
      isActive: true,
      mustChangePassword: false,
    });
  });

  it("TEST-AUTH-01 (RBAC): authenticates Operator and returns role OPERATOR", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "operator1@example.com", password: "Password123!" });

    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe("OPERATOR");
  });

  it("TEST-AUTH-01 (RBAC): authenticates Admin and returns role ADMIN", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@example.com", password: "Password123!" });

    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe("ADMIN");
  });

  it("TEST-AUTH-02: rejects login attempt with invalid password with 401 Unauthorized", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "customer1@example.com", password: "WrongPassword999!" });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("INVALID_CREDENTIALS");
    expect(res.header["set-cookie"]).toBeUndefined();
  });

  it("rejects login attempt with missing email or password with 400 Bad Request", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "customer1@example.com" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("MISSING_FIELDS");
  });

  it("rejects login attempt for deactivated user with 401 Unauthorized", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "deactivated@example.com", password: "Password123!" });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("ACCOUNT_DEACTIVATED");
  });

  // -------------------------------------------------------------------------
  // 2. Session Lifecycle & Logout (TEST-AUTH-03, TEST-AUTH-04)
  // -------------------------------------------------------------------------

  it("TEST-AUTH-04: rejects GET /api/auth/me when unauthenticated with 401 Unauthorized", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  it("returns current user context for GET /api/auth/me with active session cookie", async () => {
    const agent = request.agent(app);
    await agent
      .post("/api/auth/login")
      .send({ email: "customer1@example.com", password: "Password123!" });

    const meRes = await agent.get("/api/auth/me");
    expect(meRes.status).toBe(200);
    expect(meRes.body.user).toMatchObject({
      email: "customer1@example.com",
      role: "CUSTOMER",
    });
  });

  it("TEST-AUTH-03: invalidates session on POST /api/auth/logout", async () => {
    const agent = request.agent(app);
    await agent
      .post("/api/auth/login")
      .send({ email: "customer1@example.com", password: "Password123!" });

    const logoutRes = await agent.post("/api/auth/logout");
    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body.message).toContain("Logged out");

    const meRes = await agent.get("/api/auth/me");
    expect(meRes.status).toBe(401);
  });

  // -------------------------------------------------------------------------
  // 3. Role-Based Access Control (TEST-SEC-02)
  // -------------------------------------------------------------------------

  it("TEST-SEC-02: blocks Customer from accessing Operator queue with 403 Forbidden", async () => {
    const agent = request.agent(app);
    await agent
      .post("/api/auth/login")
      .send({ email: "customer1@example.com", password: "Password123!" });

    const res = await agent.get("/api/operator/orders");
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });

  it("TEST-SEC-02: allows Operator to access Operator queue with 200 OK", async () => {
    const agent = request.agent(app);
    await agent
      .post("/api/auth/login")
      .send({ email: "operator1@example.com", password: "Password123!" });

    const res = await agent.get("/api/operator/orders");
    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
  });

  // -------------------------------------------------------------------------
  // 4. Password Change & First-Login Policy
  // -------------------------------------------------------------------------

  it("blocks user with mustChangePassword = true from accessing normal endpoints", async () => {
    const agent = request.agent(app);
    await agent
      .post("/api/auth/login")
      .send({ email: "customer3@example.com", password: "Password123!" });

    const res = await agent.get("/api/operator/orders");
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("PASSWORD_CHANGE_REQUIRED");
  });

  it("rejects password change if current password is incorrect", async () => {
    const agent = request.agent(app);
    await agent
      .post("/api/auth/login")
      .send({ email: "customer3@example.com", password: "Password123!" });

    const res = await agent.post("/api/auth/change-password").send({
      currentPassword: "WrongPassword999!",
      newPassword: "BrandNewSecurePassword123!",
    });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_CURRENT_PASSWORD");
  });

  it("rejects weak new password with 400 Bad Request", async () => {
    const agent = request.agent(app);
    await agent
      .post("/api/auth/login")
      .send({ email: "customer3@example.com", password: "Password123!" });

    const res = await agent.post("/api/auth/change-password").send({
      currentPassword: "Password123!",
      newPassword: "weak",
    });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("WEAK_PASSWORD");
  });

  it("updates password and clears mustChangePassword flag upon valid password change", async () => {
    const agent = request.agent(app);
    await agent
      .post("/api/auth/login")
      .send({ email: "customer3@example.com", password: "Password123!" });

    const changeRes = await agent.post("/api/auth/change-password").send({
      currentPassword: "Password123!",
      newPassword: "BrandNewSecurePassword123!",
    });

    expect(changeRes.status).toBe(200);
    expect(changeRes.body.mustChangePassword).toBe(false);

    // Verify login with new password succeeds
    const newLoginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: "customer3@example.com", password: "BrandNewSecurePassword123!" });

    expect(newLoginRes.status).toBe(200);
    expect(newLoginRes.body.user.mustChangePassword).toBe(false);
  });
});

